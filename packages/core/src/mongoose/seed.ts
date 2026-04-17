import type { PermXModels } from './schemas.js';
import type { CreatedDocument } from './types.js';
import type { PermissionAction, PermissionScope, ApiMapping, UiMapping } from '../types/permission.js';
import type { RoleType } from '../types/role.js';

export interface UpsertModuleInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sort_order?: number;
  active?: boolean;
}

export interface UpsertPermissionInput {
  /** Module slug (resolved to module _id during upsert) */
  moduleSlug: string;
  name: string;
  key: string;
  description?: string;
  api_mappings?: ApiMapping[];
  ui_mappings?: UiMapping[];
  resource?: string;
  action?: PermissionAction;
  scope?: PermissionScope;
  field?: string;
}

export interface UpsertRoleInput {
  name: string;
  slug: string;
  description?: string;
  /** Permission keys (resolved to permission _ids during upsert) */
  permissionKeys?: string[];
  /** Slugs of parent roles (resolved to role _ids during upsert) */
  inheritsFrom?: string[];
  role_type?: RoleType;
  is_system_role?: boolean;
  active?: boolean;
}

export interface SeedConfig {
  modules?: UpsertModuleInput[];
  permissions?: UpsertPermissionInput[];
  roles?: UpsertRoleInput[];
}

export interface SeedResult {
  modules: Record<string, string>;
  permissions: Record<string, string>;
  roles: Record<string, string>;
}

/** Upsert a module by `slug`. Idempotent — safe to run on every boot. */
export async function upsertModule(
  models: PermXModels,
  input: UpsertModuleInput,
): Promise<CreatedDocument> {
  const doc = await models.Module.findOneAndUpdate(
    { slug: input.slug },
    {
      $set: {
        name: input.name,
        description: input.description,
        icon: input.icon,
        sort_order: input.sort_order ?? 0,
        active: input.active ?? true,
      },
      $setOnInsert: { slug: input.slug },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  if (!doc) {
    throw new Error(`Failed to upsert module '${input.slug}'`);
  }
  return { ...(doc as Record<string, unknown>), _id: String((doc as { _id: unknown })._id) };
}

/** Upsert a permission by `key`. Idempotent — safe to run on every boot. */
export async function upsertPermission(
  models: PermXModels,
  input: UpsertPermissionInput & { moduleId: string },
): Promise<CreatedDocument> {
  const doc = await models.Permission.findOneAndUpdate(
    { key: input.key },
    {
      $set: {
        module: input.moduleId,
        name: input.name,
        description: input.description,
        api_mappings: input.api_mappings ?? [],
        ui_mappings: input.ui_mappings ?? [],
        resource: input.resource,
        action: input.action,
        scope: input.scope,
        field: input.field,
      },
      $setOnInsert: { key: input.key },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  if (!doc) {
    throw new Error(`Failed to upsert permission '${input.key}'`);
  }
  return { ...(doc as Record<string, unknown>), _id: String((doc as { _id: unknown })._id) };
}

/** Upsert a role by `slug`. Idempotent — safe to run on every boot. */
export async function upsertRole(
  models: PermXModels,
  input: Omit<UpsertRoleInput, 'permissionKeys' | 'inheritsFrom'> & {
    permissionIds?: string[];
    inheritsFromIds?: string[];
  },
): Promise<CreatedDocument> {
  const doc = await models.Role.findOneAndUpdate(
    { slug: input.slug },
    {
      $set: {
        name: input.name,
        description: input.description,
        permissions: input.permissionIds ?? [],
        inherits_from: input.inheritsFromIds ?? [],
        role_type: input.role_type ?? 'regular',
        is_system_role: input.is_system_role ?? false,
        active: input.active ?? true,
      },
      $setOnInsert: { slug: input.slug },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  if (!doc) {
    throw new Error(`Failed to upsert role '${input.slug}'`);
  }
  return { ...(doc as Record<string, unknown>), _id: String((doc as { _id: unknown })._id) };
}

/** Ensure a user has a role. Idempotent — returns existing assignment if present. */
export async function ensureUserRole(
  models: PermXModels,
  userId: string,
  roleId: string,
  options?: {
    assigned_by?: string;
    expires_at?: Date;
    excluded_permissions?: string[];
    additional_permissions?: string[];
  },
): Promise<CreatedDocument> {
  const doc = await models.UserRole.findOneAndUpdate(
    { user_id: userId, role: roleId },
    {
      $set: {
        assigned_by: options?.assigned_by,
        expires_at: options?.expires_at,
        excluded_permissions: options?.excluded_permissions ?? [],
        additional_permissions: options?.additional_permissions ?? [],
      },
      $setOnInsert: { user_id: userId, role: roleId },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  if (!doc) {
    throw new Error(`Failed to assign role '${roleId}' to user '${userId}'`);
  }
  return { ...(doc as Record<string, unknown>), _id: String((doc as { _id: unknown })._id) };
}

/**
 * Apply a declarative seed config — upserts modules, permissions, and roles
 * with cross-references resolved by slug/key. Idempotent.
 *
 * Returns maps of `slug → _id` (or `key → _id` for permissions) so callers
 * can resolve ids for follow-up operations like `ensureUserRole`.
 *
 * @example
 * const result = await syncFromConfig(permx.models, {
 *   modules: [{ name: 'Projects', slug: 'projects' }],
 *   permissions: [
 *     { moduleSlug: 'projects', name: 'View Projects', key: 'projects.tasks.view.all' },
 *   ],
 *   roles: [
 *     { name: 'Project Viewer', slug: 'project-viewer', permissionKeys: ['projects.tasks.view.all'] },
 *   ],
 * });
 */
export async function syncFromConfig(
  models: PermXModels,
  config: SeedConfig,
): Promise<SeedResult> {
  const modules: Record<string, string> = {};
  const permissions: Record<string, string> = {};
  const roles: Record<string, string> = {};

  for (const mod of config.modules ?? []) {
    const doc = await upsertModule(models, mod);
    modules[mod.slug] = doc._id;
  }

  for (const perm of config.permissions ?? []) {
    const moduleId = modules[perm.moduleSlug];
    if (!moduleId) {
      throw new Error(
        `Permission '${perm.key}' references unknown moduleSlug '${perm.moduleSlug}'. ` +
        `Add the module to config.modules first.`,
      );
    }
    const doc = await upsertPermission(models, { ...perm, moduleId });
    permissions[perm.key] = doc._id;
  }

  // Two-pass roles so inheritsFrom can reference roles declared later in the list
  for (const role of config.roles ?? []) {
    const doc = await upsertRole(models, {
      name: role.name,
      slug: role.slug,
      description: role.description,
      role_type: role.role_type,
      is_system_role: role.is_system_role,
      active: role.active,
      permissionIds: [],
      inheritsFromIds: [],
    });
    roles[role.slug] = doc._id;
  }

  for (const role of config.roles ?? []) {
    const permissionIds = (role.permissionKeys ?? []).map((key) => {
      const id = permissions[key];
      if (!id) {
        throw new Error(
          `Role '${role.slug}' references unknown permission key '${key}'. ` +
          `Add it to config.permissions first.`,
        );
      }
      return id;
    });

    const inheritsFromIds = (role.inheritsFrom ?? []).map((slug) => {
      const id = roles[slug];
      if (!id) {
        throw new Error(
          `Role '${role.slug}' inherits from unknown role slug '${slug}'. ` +
          `Add it to config.roles first.`,
        );
      }
      return id;
    });

    await models.Role.updateOne(
      { slug: role.slug },
      { $set: { permissions: permissionIds, inherits_from: inheritsFromIds } },
    );
  }

  return { modules, permissions, roles };
}
