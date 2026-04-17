import type {
  PermXDataProvider,
  Permission,
  Module,
  UserRolePopulated,
} from '@permx/core';
import type {
  PrismaClientLike,
  PermissionRow,
  ModuleRow,
  UserRoleRow,
  RoleRow,
} from './types.js';

function parseJsonArray<T>(raw: string | null): T[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function mapPermission(row: PermissionRow): Permission {
  return {
    _id: row.id,
    module: row.moduleId,
    name: row.name,
    key: row.key,
    description: row.description ?? undefined,
    api_mappings: parseJsonArray(row.apiMappings),
    ui_mappings: parseJsonArray(row.uiMappings),
    resource: row.resource ?? undefined,
    action: row.action ?? undefined,
    scope: row.scope ?? undefined,
    field: row.field ?? undefined,
  };
}

function mapModule(row: ModuleRow): Module {
  return {
    _id: row.id,
    name: row.name,
    slug: row.slug,
    icon: row.icon ?? undefined,
    sort_order: row.sortOrder,
    active: row.active,
  };
}

/**
 * Prisma implementation of `PermXDataProvider`.
 *
 * Works with any Prisma-supported database (PostgreSQL, MySQL, SQLite,
 * SQL Server, MongoDB). Uses the model names from the PermX reference
 * schema (`permx/prisma/schema`); rename-via-options is planned for v0.2.
 */
export class PrismaDataProvider implements PermXDataProvider {
  constructor(private readonly prisma: PrismaClientLike) {}

  async getUserRoles(userId: string): Promise<UserRolePopulated[]> {
    const now = new Date();

    const rows = (await this.prisma.permXUserRole.findMany({
      where: {
        userId,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
            parents: true,
          },
        },
        additionalPermissions: true,
        excludedPermissions: true,
      },
    })) as UserRoleRow[];

    return rows.map((row) => {
      const role = row.role;
      return {
        _id: row.id,
        user_id: row.userId,
        role: role
          ? {
              _id: role.id,
              role_type: role.roleType,
              permissions: (role.permissions ?? []).map((rp) => ({
                _id: rp.permissionId,
                key: rp.permission?.key ?? '',
              })),
              inherits_from: (role.parents ?? []).map((p) => p.parentId),
            }
          : { _id: '', role_type: 'regular', permissions: [], inherits_from: [] },
        assigned_by: row.assignedBy ?? undefined,
        assigned_at: row.assignedAt,
        expires_at: row.expiresAt ?? undefined,
        excluded_permissions: (row.excludedPermissions ?? []).map((e) => e.permissionId),
        additional_permissions: (row.additionalPermissions ?? []).map((a) => a.permissionId),
      };
    });
  }

  async getRoleForResolution(roleId: string): Promise<{
    permissions: Array<{ _id: string }>;
    inherits_from: string[];
  } | null> {
    const role = (await this.prisma.permXRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: true,
        parents: true,
      },
    })) as RoleRow | null;

    if (!role) return null;

    return {
      permissions: (role.permissions ?? []).map((rp) => ({ _id: rp.permissionId })),
      inherits_from: (role.parents ?? []).map((p) => p.parentId),
    };
  }

  async getPermissionsByIds(ids: string[]): Promise<Permission[]> {
    if (ids.length === 0) return [];

    const rows = (await this.prisma.permXPermission.findMany({
      where: { id: { in: ids } },
    })) as PermissionRow[];

    return rows.map(mapPermission);
  }

  async getModulesByIds(ids: string[]): Promise<Module[]> {
    if (ids.length === 0) return [];

    const rows = (await this.prisma.permXModule.findMany({
      where: { id: { in: ids }, active: true },
      orderBy: { sortOrder: 'asc' },
    })) as ModuleRow[];

    return rows.map(mapModule);
  }

  async getApiPermissionMap(): Promise<
    Array<{ service: string; method: string; path: string; key: string }>
  > {
    const rows = (await this.prisma.permXPermission.findMany({
      where: { apiMappings: { not: null } },
      select: { key: true, apiMappings: true },
    })) as Array<Pick<PermissionRow, 'key' | 'apiMappings'>>;

    const out: Array<{ service: string; method: string; path: string; key: string }> = [];
    for (const row of rows) {
      const mappings = parseJsonArray<{ service: string; method: string; path: string }>(
        row.apiMappings,
      );
      for (const m of mappings) {
        out.push({ service: m.service, method: m.method, path: m.path, key: row.key });
      }
    }
    return out;
  }
}
