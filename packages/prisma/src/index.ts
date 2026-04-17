// Factory
export { createPermX } from './factory.js';
export type { PrismaPermXConfig, PrismaPermXInstance } from './factory.js';

// Data provider (advanced: when you want to wire the core factory yourself)
export { PrismaDataProvider } from './data-provider.js';

// Seed helpers (idempotent upserts — safe to run on every app boot)
export {
  upsertModule,
  upsertPermission,
  upsertRole,
  setRolePermissions,
  setRoleInheritance,
  ensureUserRole,
  syncFromConfig,
} from './seed.js';
export type {
  UpsertModuleInput,
  UpsertPermissionInput,
  UpsertRoleInput,
  SeedConfig,
  SeedResult,
} from './seed.js';

// Types (mostly for advanced use)
export type {
  PrismaClientLike,
  PrismaDelegate,
  ModuleRow,
  PermissionRow,
  RoleRow,
  RolePermissionRow,
  RoleInheritanceRow,
  UserRoleRow,
  UserRoleAdditionalRow,
  UserRoleExcludedRow,
  CreateModuleInput,
  CreatePermissionInput,
  CreateRoleInput,
  AssignRoleInput,
} from './types.js';
