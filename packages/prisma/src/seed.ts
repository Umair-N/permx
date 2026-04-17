import type { PermissionAction, PermissionScope, ApiMapping, UiMapping } from '@permx/core';
import type { PrismaClientLike } from './types.js';

export interface UpsertModuleInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface UpsertPermissionInput {
  moduleSlug: string;
  name: string;
  key: string;
  description?: string;
  apiMappings?: ApiMapping[];
  uiMappings?: UiMapping[];
  resource?: string;
  action?: PermissionAction;
  scope?: PermissionScope;
  field?: string;
}

export interface UpsertRoleInput {
  name: string;
  slug: string;
  description?: string;
  roleType?: string;
  isSystemRole?: boolean;
  active?: boolean;
  permissionKeys?: string[];
  inheritsFrom?: string[];
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

/** Upsert a module by `slug`. Idempotent. */
export async function upsertModule(
  prisma: PrismaClientLike,
  input: UpsertModuleInput,
): Promise<{ id: string }> {
  const row = await prisma.permXModule.upsert({
    where: { slug: input.slug },
    create: {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
    update: {
      name: input.name,
      description: input.description ?? null,
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? 0,
      active: input.active ?? true,
    },
  });
  return { id: row.id };
}

/** Upsert a permission by `key`. Idempotent. */
export async function upsertPermission(
  prisma: PrismaClientLike,
  input: UpsertPermissionInput & { moduleId: string },
): Promise<{ id: string }> {
  const row = await prisma.permXPermission.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      moduleId: input.moduleId,
      name: input.name,
      description: input.description ?? null,
      resource: input.resource ?? null,
      action: input.action ?? null,
      scope: input.scope ?? null,
      field: input.field ?? null,
      apiMappings: input.apiMappings ? JSON.stringify(input.apiMappings) : null,
      uiMappings: input.uiMappings ? JSON.stringify(input.uiMappings) : null,
    },
    update: {
      moduleId: input.moduleId,
      name: input.name,
      description: input.description ?? null,
      resource: input.resource ?? null,
      action: input.action ?? null,
      scope: input.scope ?? null,
      field: input.field ?? null,
      apiMappings: input.apiMappings ? JSON.stringify(input.apiMappings) : null,
      uiMappings: input.uiMappings ? JSON.stringify(input.uiMappings) : null,
    },
  });
  return { id: row.id };
}

/** Upsert a role by `slug`. Permissions and inheritance are applied separately. */
export async function upsertRole(
  prisma: PrismaClientLike,
  input: Omit<UpsertRoleInput, 'permissionKeys' | 'inheritsFrom'>,
): Promise<{ id: string }> {
  const row = await prisma.permXRole.upsert({
    where: { slug: input.slug },
    create: {
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      roleType: input.roleType ?? 'regular',
      isSystemRole: input.isSystemRole ?? false,
      active: input.active ?? true,
    },
    update: {
      name: input.name,
      description: input.description ?? null,
      roleType: input.roleType ?? 'regular',
      isSystemRole: input.isSystemRole ?? false,
      active: input.active ?? true,
    },
  });
  return { id: row.id };
}

/** Replace the permission set for a role. Idempotent. */
export async function setRolePermissions(
  prisma: PrismaClientLike,
  roleId: string,
  permissionIds: string[],
): Promise<void> {
  await prisma.permXRolePermission.deleteMany({ where: { roleId } });
  for (const permissionId of permissionIds) {
    await prisma.permXRolePermission.create({ data: { roleId, permissionId } });
  }
}

/** Replace the inheritance parents for a role. Idempotent. */
export async function setRoleInheritance(
  prisma: PrismaClientLike,
  childId: string,
  parentIds: string[],
): Promise<void> {
  await prisma.permXRoleInheritance.deleteMany({ where: { childId } });
  for (const parentId of parentIds) {
    await prisma.permXRoleInheritance.create({ data: { childId, parentId } });
  }
}

/** Ensure a user has a role assignment. Idempotent. */
export async function ensureUserRole(
  prisma: PrismaClientLike,
  userId: string,
  roleId: string,
  options?: {
    tenantId?: string;
    assignedBy?: string;
    expiresAt?: Date;
    additionalPermissionIds?: string[];
    excludedPermissionIds?: string[];
  },
): Promise<{ id: string }> {
  const tenantId = options?.tenantId ?? null;
  const existing = await prisma.permXUserRole.findFirst({
    where: { userId, roleId, tenantId },
  });

  const row = existing
    ? await prisma.permXUserRole.update({
        where: { id: existing.id },
        data: {
          assignedBy: options?.assignedBy ?? null,
          expiresAt: options?.expiresAt ?? null,
        },
      })
    : await prisma.permXUserRole.create({
        data: {
          userId,
          roleId,
          tenantId,
          assignedBy: options?.assignedBy ?? null,
          expiresAt: options?.expiresAt ?? null,
        },
      });

  if (options?.additionalPermissionIds) {
    await prisma.permXUserRoleAdditional.deleteMany({ where: { userRoleId: row.id } });
    for (const permissionId of options.additionalPermissionIds) {
      await prisma.permXUserRoleAdditional.create({
        data: { userRoleId: row.id, permissionId },
      });
    }
  }
  if (options?.excludedPermissionIds) {
    await prisma.permXUserRoleExcluded.deleteMany({ where: { userRoleId: row.id } });
    for (const permissionId of options.excludedPermissionIds) {
      await prisma.permXUserRoleExcluded.create({
        data: { userRoleId: row.id, permissionId },
      });
    }
  }

  return { id: row.id };
}

/**
 * Apply a declarative seed config — upserts modules, permissions, and roles
 * with cross-references resolved by slug/key. Idempotent. Safe to run on
 * every app boot.
 */
export async function syncFromConfig(
  prisma: PrismaClientLike,
  config: SeedConfig,
): Promise<SeedResult> {
  const modules: Record<string, string> = {};
  const permissions: Record<string, string> = {};
  const roles: Record<string, string> = {};

  for (const mod of config.modules ?? []) {
    const { id } = await upsertModule(prisma, mod);
    modules[mod.slug] = id;
  }

  for (const perm of config.permissions ?? []) {
    const moduleId = modules[perm.moduleSlug];
    if (!moduleId) {
      throw new Error(
        `Permission '${perm.key}' references unknown moduleSlug '${perm.moduleSlug}'. ` +
          `Add the module to config.modules first.`,
      );
    }
    const { id } = await upsertPermission(prisma, { ...perm, moduleId });
    permissions[perm.key] = id;
  }

  // Two-pass roles so inheritsFrom can reference roles declared later
  for (const role of config.roles ?? []) {
    const { id } = await upsertRole(prisma, {
      name: role.name,
      slug: role.slug,
      description: role.description,
      roleType: role.roleType,
      isSystemRole: role.isSystemRole,
      active: role.active,
    });
    roles[role.slug] = id;
  }

  for (const role of config.roles ?? []) {
    const roleId = roles[role.slug]!;
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

    await setRolePermissions(prisma, roleId, permissionIds);
    await setRoleInheritance(prisma, roleId, inheritsFromIds);
  }

  return { modules, permissions, roles };
}
