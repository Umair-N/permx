// Types
export type {
  Permission,
  PermissionAction,
  PermissionScope,
  ApiMapping,
  UiMapping,
  ParsedPermissionKey,
  StructuredPermission,
  Module,
  Role,
  RoleType,
  RolePropagation,
  UserRole,
  UserRolePopulated,
  PermXDataProvider,
  SubscriptionResolver,
  PermXConfig,
  TenancyConfig,
  CacheConfig,
  SuperAdminConfig,
  AuthResult,
  EffectivePermissions,
} from './types/index.js';

export { PERMISSION_ACTIONS, PERMISSION_SCOPES, ROLE_TYPES } from './types/index.js';

// Engine
export { buildDerivedKey, parsePermissionKey } from './engine/permission-key.js';
export type { BuildDerivedKeyParams } from './engine/permission-key.js';
export { definePermissions } from './engine/typed-keys.js';
export type { PermissionDefinition, PermissionKeyOf } from './engine/typed-keys.js';
export { resolveRolePermissions } from './engine/role-resolver.js';
export type { FetchRoleFn } from './engine/role-resolver.js';
export { detectCircularInheritance } from './engine/circular-detector.js';
export type { FetchParentsFn, CircularCheckResult } from './engine/circular-detector.js';
export { matchPathPattern } from './engine/path-matcher.js';

// Core factory
export { createPermXCore } from './permx.js';
export type { PermXInstance } from './permx.js';

// Cache
export { TtlCache } from './cache/ttl-cache.js';

// Errors
export {
  PermXError,
  PermissionDeniedError,
  CircularInheritanceError,
  RoleNotFoundError,
  PermissionNotFoundError,
  ValidationError,
  DataProviderError,
} from './errors.js';
export type { DataProviderErrorContext } from './errors.js';

// Validation
export { assertPermissionKey, isValidPermissionKey, validateUserId } from './validation.js';

// Events
export { PermXEmitter } from './events.js';
export type { PermXEventMap, PermXEventName } from './events.js';

// Middleware (framework-agnostic)
export { handleAuthorization, handleApiAuthorization } from './middleware/handler.js';
export type { AuthorizationRequest, AuthorizationOutcome } from './middleware/handler.js';
