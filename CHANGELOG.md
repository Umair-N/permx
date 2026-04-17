# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2026-04-17

### Changed

- **README updated** to feature the new `@permx/react` SDK — see Quick Start step 6 for the 60-second React setup, the new Entry Points row, and the `@permx/react` import reference.
- No code changes in this release.

## [0.2.0] - 2026-04-15

### Added

- **Input validation** at all public API boundaries (`authorize`, `authorizeApi`, `getUserPermissions`)
  - `validateUserId()` — rejects empty/null/whitespace user IDs
  - `assertPermissionKey()` — validates structured key format with ReDoS-safe regex
  - `isValidPermissionKey()` — non-throwing boolean variant
  - `validateTenantId()` — enforces tenant ID when multi-tenancy is enabled
- **Event emitter** for observability (`PermXEmitter` on `permx.emitter`)
  - Events: `authorize`, `authorize.denied`, `authorize.error`, `cache.hit`, `cache.miss`
  - Async emission via `queueMicrotask` — listeners never block the auth path
  - Listener errors are silently swallowed to protect authorization flow
- **Bounded LRU cache** — `TtlCache` now accepts optional `max_size` parameter
  - LRU eviction when at capacity (expired entries cleaned first)
  - `has()` method for existence checks
  - `size` getter now returns count of non-expired entries only
- **Error wrapping** — provider failures wrapped in `DataProviderError` with context
  - Includes `operation`, `userId`, `tenantId` in error context (not in message for security)
  - `PermXError` subclasses pass through unwrapped (no double-wrapping)
  - `PermXError.isPermXError()` static type guard for narrowing unknown errors
- **`ValidationError`** — new error class (statusCode 400) with `field` property
- **`DataProviderError`** — new error class (statusCode 500) with `context` and `cause`
- **Role inheritance depth limit** — default max depth of 10 prevents DoS from deep hierarchies
- 75 new tests (172 total) including integration tests for validation+error+event flows

### Breaking Changes

- `authorize()` now throws `ValidationError` on empty userId or malformed permission key (previously returned `{ authorized: false }` silently)
- `authorizeApi()` now validates `service`, `method`, and `path` parameters
- Provider errors are now wrapped in `DataProviderError` (check `error.cause` for the original error)
- `TtlCache.size` now excludes expired entries (more correct, but different from previous behavior)
- Role inheritance deeper than 10 levels now throws `CircularInheritanceError`

### Changed

- `CacheConfig` now accepts optional `max_size` for bounded caching
- `PermXInstance` interface has optional `emitter` property

## [0.1.0] - 2026-04-15

### Added

- Core RBAC engine with structured permission keys (`module.resource:field.action.scope`)
- Permission key parser and builder (`buildDerivedKey`, `parsePermissionKey`)
- Role inheritance resolver with DFS traversal, diamond handling, and cycle detection
- Three-layer permission model: regular roles, subscription roles, and feature flags
- UI mapping system for routes, components, and fields
- API permission mapping with path pattern matching
- Generic TTL cache for API map caching
- Custom error hierarchy (`PermXError`, `PermissionDeniedError`, `CircularInheritanceError`)
- Mongoose adapter with schema factory (Better-Auth pattern)
  - Configurable collection names
  - Custom field extension via `extend` config
  - Multi-tenancy support with tenant plugin
  - Index management via `migrate()`
- Express middleware with `authorize()` and `authorizeApi()`
  - Service call bypass
  - Super admin bypass
  - Custom denied/error handlers
- Database-agnostic `PermXDataProvider` interface for custom adapters
- Dual CJS/ESM build output via tsup
- Full TypeScript types with declaration maps
- 58 unit tests with vitest
