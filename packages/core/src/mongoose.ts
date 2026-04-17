export { createPermX } from './mongoose/factory.js';
export type { MongoosePermXConfig, MongoosePermXInstance } from './mongoose/factory.js';
export { createPermXSchemas } from './mongoose/schemas.js';
export type { SchemaFactoryConfig, PermXModels } from './mongoose/schemas.js';
export { MongooseDataProvider } from './mongoose/data-provider.js';
export { tenantPlugin } from './mongoose/tenant-plugin.js';
export type { TenantPluginOptions } from './mongoose/tenant-plugin.js';
export type {
  CreateModuleInput,
  CreatePermissionInput,
  CreateRoleInput,
  AssignRoleInput,
  CreatedDocument,
} from './mongoose/types.js';
export {
  upsertModule,
  upsertPermission,
  upsertRole,
  ensureUserRole,
  syncFromConfig,
} from './mongoose/seed.js';
export type {
  UpsertModuleInput,
  UpsertPermissionInput,
  UpsertRoleInput,
  SeedConfig,
  SeedResult,
} from './mongoose/seed.js';
