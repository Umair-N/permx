import type { PermXDataProvider } from '../types/data-provider.js';
import type { Permission, PermissionAction, PermissionScope } from '../types/permission.js';
import type { Module } from '../types/module.js';
import type { UserRolePopulated } from '../types/user-role.js';
import type { PermXModels } from './schemas.js';

/** Mongoose document shape returned by UserRole.find().populate('role') */
interface UserRoleDocument {
  _id: { toString(): string };
  user_id: string;
  role: {
    _id: { toString(): string };
    role_type: string;
    permissions: Array<{ _id: { toString(): string }; key?: string }>;
    inherits_from: Array<{ _id?: { toString(): string }; toString(): string }>;
  } | null;
  assigned_by?: string;
  assigned_at: Date;
  expires_at?: Date;
  excluded_permissions?: string[];
  additional_permissions: Array<{ _id?: { toString(): string }; toString(): string }>;
}

/** Mongoose document shape returned by Role.findById().populate('permissions') */
interface RoleDocument {
  _id: { toString(): string };
  permissions: Array<{ _id: { toString(): string } }>;
  inherits_from: Array<{ _id?: { toString(): string }; toString(): string }>;
}

/** Mongoose document shape for Permission */
interface PermissionDocument {
  _id: { toString(): string };
  module: { toString(): string };
  name: string;
  key: string;
  description?: string;
  api_mappings: Array<{ service: string; method: string; path: string }>;
  ui_mappings: Array<{ type: 'route' | 'component' | 'field'; identifier: string }>;
  resource?: string;
  action?: PermissionAction;
  scope?: PermissionScope;
  field?: string;
}

/** Mongoose document shape for Module */
interface ModuleDocument {
  _id: { toString(): string };
  name: string;
  slug: string;
  icon?: string;
  sort_order: number;
}

/**
 * Mongoose implementation of PermXDataProvider.
 *
 * Wraps the PermX Mongoose models with optimized query patterns.
 */
export class MongooseDataProvider implements PermXDataProvider {
  constructor(private readonly models: PermXModels) {}

  async getUserRoles(userId: string): Promise<UserRolePopulated[]> {
    const now = new Date();
    const assignments = await this.models.UserRole.find({
      user_id: userId,
      $or: [
        { expires_at: null },
        { expires_at: { $exists: false } },
        { expires_at: { $gt: now } },
      ],
    }).populate({
      path: 'role',
      populate: { path: 'permissions' },
    }) as unknown as UserRoleDocument[];

    return assignments.map((a) => ({
      _id: a._id.toString(),
      user_id: a.user_id,
      role: a.role
        ? {
            _id: a.role._id.toString(),
            role_type: a.role.role_type,
            permissions: (a.role.permissions ?? []).map((p) => ({
              _id: (p._id || p).toString(),
              key: p.key ?? '',
            })),
            inherits_from: (a.role.inherits_from ?? []).map((id) =>
              (id._id || id).toString(),
            ),
          }
        : { _id: '', role_type: 'regular', permissions: [], inherits_from: [] },
      assigned_by: a.assigned_by,
      assigned_at: a.assigned_at,
      expires_at: a.expires_at,
      excluded_permissions: a.excluded_permissions ?? [],
      additional_permissions: (a.additional_permissions ?? []).map((id) =>
        (id._id || id).toString(),
      ),
    }));
  }

  async getRoleForResolution(roleId: string): Promise<{
    permissions: Array<{ _id: string }>;
    inherits_from: string[];
  } | null> {
    const role = await this.models.Role.findById(roleId).populate('permissions') as unknown as RoleDocument | null;
    if (!role) return null;

    return {
      permissions: (role.permissions ?? []).map((p) => ({
        _id: (p._id || p).toString(),
      })),
      inherits_from: (role.inherits_from ?? []).map((id) =>
        (id._id || id).toString(),
      ),
    };
  }

  async getPermissionsByIds(ids: string[]): Promise<Permission[]> {
    if (ids.length === 0) return [];

    const docs = await this.models.Permission.find({
      _id: { $in: ids },
    }) as unknown as PermissionDocument[];

    return docs.map((d) => ({
      _id: d._id.toString(),
      module: d.module.toString(),
      name: d.name,
      key: d.key,
      description: d.description,
      api_mappings: d.api_mappings ?? [],
      ui_mappings: d.ui_mappings ?? [],
      resource: d.resource,
      action: d.action,
      scope: d.scope,
      field: d.field,
    }));
  }

  async getModulesByIds(ids: string[]): Promise<Module[]> {
    if (ids.length === 0) return [];

    const docs = await this.models.Module.find({
      _id: { $in: ids },
      active: true,
    })
      .select('name slug icon sort_order')
      .sort({ sort_order: 1 }) as unknown as ModuleDocument[];

    return docs.map((d) => ({
      _id: d._id.toString(),
      name: d.name,
      slug: d.slug,
      icon: d.icon,
      sort_order: d.sort_order,
      active: true,
    }));
  }

  async getApiPermissionMap(): Promise<Array<{
    service: string;
    method: string;
    path: string;
    key: string;
  }>> {
    const permissions = await this.models.Permission.find({
      'api_mappings.0': { $exists: true },
    })
      .select('key api_mappings')
      .lean() as unknown as Array<{ key: string; api_mappings: Array<{ service: string; method: string; path: string }> }>;

    const entries: Array<{ service: string; method: string; path: string; key: string }> = [];

    for (const perm of permissions) {
      for (const mapping of perm.api_mappings) {
        entries.push({
          service: mapping.service,
          method: mapping.method,
          path: mapping.path,
          key: perm.key,
        });
      }
    }

    return entries;
  }
}
