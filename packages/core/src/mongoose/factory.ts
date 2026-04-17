import type mongoose from 'mongoose';
import type { PermXConfig } from '../types/config.js';
import type { PermXInstance } from '../permx.js';
import { createPermXCore } from '../permx.js';
import { createPermXSchemas, type SchemaFactoryConfig, type PermXModels } from './schemas.js';
import { MongooseDataProvider } from './data-provider.js';
import type {
  CreateModuleInput,
  CreatePermissionInput,
  CreateRoleInput,
  AssignRoleInput,
  CreatedDocument,
} from './types.js';

export interface MongoosePermXConfig extends PermXConfig, SchemaFactoryConfig {
  connection: mongoose.Connection;
}

export interface MongoosePermXInstance extends PermXInstance {
  /** The Mongoose models created by PermX */
  models: PermXModels;

  /** Ensure all indexes are created (run once on startup) */
  migrate(): Promise<void>;

  /** Create a module */
  createModule(input: CreateModuleInput): Promise<CreatedDocument>;

  /** Create a permission */
  createPermission(input: CreatePermissionInput): Promise<CreatedDocument>;

  /** Create a role */
  createRole(input: CreateRoleInput): Promise<CreatedDocument>;

  /** Assign a role to a user */
  assignRole(userId: string, roleId: string, options?: Partial<Omit<AssignRoleInput, 'user_id' | 'role'>>): Promise<CreatedDocument>;

  /** Revoke a role from a user */
  revokeRole(userId: string, roleId: string): Promise<boolean>;
}

/**
 * Create a PermX instance backed by Mongoose.
 *
 * This is the main entry point for `permx/mongoose`.
 *
 * @example
 * ```typescript
 * import { createPermX } from 'permx/mongoose';
 *
 * const permx = createPermX({
 *   connection: mongoose.connection,
 *   tenancy: { enabled: true },
 *   cache: { ttl: 15_000 },
 *   superAdmin: { check: (userId) => userId === 'admin' },
 * });
 *
 * await permx.migrate();
 *
 * // Convenience methods for managing RBAC data
 * const mod = await permx.createModule({ name: 'Clients', slug: 'clients' });
 * const perm = await permx.createPermission({
 *   module: mod._id,
 *   name: 'View All Clients',
 *   key: 'clients.clients.view.all',
 * });
 * const role = await permx.createRole({
 *   name: 'Client Manager',
 *   slug: 'client-manager',
 *   permissions: [perm._id],
 * });
 * await permx.assignRole(userId, role._id);
 *
 * const result = await permx.authorize(userId, 'clients.clients.view.all');
 * ```
 */
export function createPermX(config: MongoosePermXConfig): MongoosePermXInstance {
  const { connection, collections, extend, tenancy, ...coreConfig } = config;

  const models = createPermXSchemas(connection, {
    collections,
    extend,
    tenancy,
  });

  const provider = new MongooseDataProvider(models);

  const core = createPermXCore(provider, {
    ...coreConfig,
    tenancy,
  });

  return {
    ...core,
    models,

    async migrate() {
      await Promise.all([
        models.Module.createIndexes(),
        models.Permission.createIndexes(),
        models.Role.createIndexes(),
        models.UserRole.createIndexes(),
      ]);
    },

    async createModule(input) {
      const doc = await models.Module.create({
        name: input.name,
        slug: input.slug,
        description: input.description,
        icon: input.icon,
        sort_order: input.sort_order ?? 0,
        active: input.active ?? true,
      });
      return { _id: doc._id.toString(), ...doc.toObject() };
    },

    async createPermission(input) {
      const doc = await models.Permission.create({
        module: input.module,
        name: input.name,
        key: input.key,
        description: input.description,
        api_mappings: input.api_mappings ?? [],
        ui_mappings: input.ui_mappings ?? [],
        resource: input.resource,
        action: input.action,
        scope: input.scope,
        field: input.field,
      });
      return { _id: doc._id.toString(), ...doc.toObject() };
    },

    async createRole(input) {
      const doc = await models.Role.create({
        name: input.name,
        slug: input.slug,
        description: input.description,
        permissions: input.permissions ?? [],
        inherits_from: input.inherits_from ?? [],
        role_type: input.role_type ?? 'regular',
        is_system_role: input.is_system_role ?? false,
        active: input.active ?? true,
        expires_at: input.expires_at,
      });
      return { _id: doc._id.toString(), ...doc.toObject() };
    },

    async assignRole(userId, roleId, options) {
      const doc = await models.UserRole.create({
        user_id: userId,
        role: roleId,
        assigned_by: options?.assigned_by,
        expires_at: options?.expires_at,
        excluded_permissions: options?.excluded_permissions ?? [],
        additional_permissions: options?.additional_permissions ?? [],
      });
      return { _id: doc._id.toString(), ...doc.toObject() };
    },

    async revokeRole(userId, roleId) {
      const result = await models.UserRole.deleteOne({
        user_id: userId,
        role: roleId,
      });
      return result.deletedCount > 0;
    },
  };
}
