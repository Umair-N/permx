import type { Module } from './module.js';
import type { Permission } from './permission.js';
import type { UserRolePopulated } from './user-role.js';

/**
 * Database-agnostic data provider interface.
 *
 * The core engine calls these methods to fetch data. Each database adapter
 * (Mongoose, Prisma, etc.) implements this interface using its own queries.
 * The engine never touches the database directly.
 */
export interface PermXDataProvider {
  /** Get all role assignments for a user (with role populated including permissions) */
  getUserRoles(userId: string): Promise<UserRolePopulated[]>;

  /** Get a single role by ID with its direct permissions populated */
  getRoleForResolution(roleId: string): Promise<{
    permissions: Array<{ _id: string }>;
    inherits_from: string[];
  } | null>;

  /** Get full permission documents by their IDs */
  getPermissionsByIds(ids: string[]): Promise<Permission[]>;

  /** Get modules by their IDs */
  getModulesByIds(ids: string[]): Promise<Module[]>;

  /** Get the API permission map (service/method/path → permission key) */
  getApiPermissionMap(): Promise<Array<{
    service: string;
    method: string;
    path: string;
    key: string;
  }>>;
}

/**
 * Optional callback for resolving subscription-tier permissions.
 * SaaS apps implement this to return permission IDs from the tenant's plan.
 * Returns an array of permission ID strings.
 */
export type SubscriptionResolver = (tenantId: string) => Promise<string[]>;
