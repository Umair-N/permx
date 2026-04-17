import type { PermissionAction, PermissionScope, ApiMapping, UiMapping } from '@permx/core';

/**
 * Structural type describing the subset of a Prisma client that PermX uses.
 *
 * Your project's generated `PrismaClient` satisfies this automatically as
 * long as the PermX models in your `schema.prisma` use the names
 * `permXModule`, `permXPermission`, `permXRole`, `permXRolePermission`,
 * `permXRoleInheritance`, `permXUserRole`, `permXUserRoleAdditional`, and
 * `permXUserRoleExcluded`.
 *
 * If you rename a model, pass `models: { ... }` to the factory.
 */
export interface PrismaClientLike {
  permXModule: PrismaDelegate<ModuleRow>;
  permXPermission: PrismaDelegate<PermissionRow>;
  permXRole: PrismaDelegate<RoleRow>;
  permXRolePermission: PrismaDelegate<RolePermissionRow>;
  permXRoleInheritance: PrismaDelegate<RoleInheritanceRow>;
  permXUserRole: PrismaDelegate<UserRoleRow>;
  permXUserRoleAdditional: PrismaDelegate<UserRoleAdditionalRow>;
  permXUserRoleExcluded: PrismaDelegate<UserRoleExcludedRow>;
  $transaction<T>(fn: (tx: PrismaClientLike) => Promise<T>): Promise<T>;
}

/** Minimal delegate shape — covers the handful of methods PermX calls. */
export interface PrismaDelegate<Row> {
  findUnique(args: { where: Record<string, unknown>; include?: unknown }): Promise<Row | null>;
  findFirst(args: { where: Record<string, unknown>; include?: unknown }): Promise<Row | null>;
  findMany(args?: {
    where?: Record<string, unknown>;
    include?: unknown;
    orderBy?: Record<string, unknown>;
    select?: Record<string, unknown>;
  }): Promise<Row[]>;
  create(args: { data: Record<string, unknown>; include?: unknown }): Promise<Row>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<Row>;
  upsert(args: {
    where: Record<string, unknown>;
    create: Record<string, unknown>;
    update: Record<string, unknown>;
  }): Promise<Row>;
  delete(args: { where: Record<string, unknown> }): Promise<Row>;
  deleteMany(args?: { where?: Record<string, unknown> }): Promise<{ count: number }>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
}

// ── Row shapes ────────────────────────────────────────────────────

export interface ModuleRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  active: boolean;
}

export interface PermissionRow {
  id: string;
  moduleId: string;
  name: string;
  key: string;
  description: string | null;
  resource: string | null;
  action: PermissionAction | null;
  scope: PermissionScope | null;
  field: string | null;
  /** JSON-stringified ApiMapping[] — stored as text for cross-DB portability. */
  apiMappings: string | null;
  /** JSON-stringified UiMapping[] — stored as text for cross-DB portability. */
  uiMappings: string | null;
}

export interface RoleRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  roleType: string;
  isSystemRole: boolean;
  active: boolean;
  expiresAt: Date | null;
  /** Populated when include: { permissions: true } */
  permissions?: Array<RolePermissionRow & { permission?: PermissionRow }>;
  /** Populated when include: { parents: true } */
  parents?: Array<RoleInheritanceRow>;
}

export interface RolePermissionRow {
  roleId: string;
  permissionId: string;
  permission?: PermissionRow;
}

export interface RoleInheritanceRow {
  childId: string;
  parentId: string;
}

export interface UserRoleRow {
  id: string;
  userId: string;
  roleId: string;
  tenantId: string | null;
  assignedBy: string | null;
  assignedAt: Date;
  expiresAt: Date | null;
  /** Populated when include: { role: { include: { permissions: { include: { permission: true }}}}} */
  role?: RoleRow;
  additionalPermissions?: UserRoleAdditionalRow[];
  excludedPermissions?: UserRoleExcludedRow[];
}

export interface UserRoleAdditionalRow {
  userRoleId: string;
  permissionId: string;
}

export interface UserRoleExcludedRow {
  userRoleId: string;
  permissionId: string;
}

// ── Input types (convenience methods) ─────────────────────────────

export interface CreateModuleInput {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
  active?: boolean;
}

export interface CreatePermissionInput {
  moduleId: string;
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

export interface CreateRoleInput {
  name: string;
  slug: string;
  description?: string;
  roleType?: string;
  isSystemRole?: boolean;
  active?: boolean;
  permissionIds?: string[];
  inheritsFromIds?: string[];
}

export interface AssignRoleInput {
  userId: string;
  roleId: string;
  tenantId?: string;
  assignedBy?: string;
  expiresAt?: Date;
  additionalPermissionIds?: string[];
  excludedPermissionIds?: string[];
}
