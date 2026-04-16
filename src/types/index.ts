export type {
  Permission,
  PermissionAction,
  PermissionScope,
  ApiMapping,
  UiMapping,
  ParsedPermissionKey,
  StructuredPermission,
} from './permission.js';

export { PERMISSION_ACTIONS, PERMISSION_SCOPES } from './permission.js';

export type { Module } from './module.js';

export type { Role, RoleType, RolePropagation } from './role.js';
export { ROLE_TYPES } from './role.js';

export type { UserRole, UserRolePopulated } from './user-role.js';

export type {
  PermXDataProvider,
  SubscriptionResolver,
} from './data-provider.js';

export type {
  PermXConfig,
  TenancyConfig,
  CacheConfig,
  SuperAdminConfig,
} from './config.js';

export type { AuthResult, EffectivePermissions } from './context.js';
