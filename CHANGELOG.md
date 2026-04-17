# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [@permx/prisma 0.1.0] - 2026-04-17

### Added

- **New package `@permx/prisma`** — Prisma adapter for PostgreSQL, MySQL, SQLite, SQL Server, or MongoDB via Prisma. Peer-depends on `@permx/core >=0.4.0` and `@prisma/client >=5.0.0`.
- **`createPermX({ prisma, ...config })`** — factory returning a full PermX instance with `authorize`, `getUserPermissions`, `invalidateUser`, and every other core API backed by Prisma queries.
- **`PrismaDataProvider`** — implements `PermXDataProvider` using the Prisma client's typed delegates. Use directly with `createPermXCore` if you want to wire the core factory yourself.
- **Reference `schema.prisma`** shipped with the package. 8 models mirror the Mongoose adapter: `PermXModule`, `PermXPermission`, `PermXRole`, `PermXRolePermission`, `PermXRoleInheritance`, `PermXUserRole`, `PermXUserRoleAdditional`, `PermXUserRoleExcluded`.
- **Idempotent seed helpers** — `syncFromConfig`, `upsertModule`, `upsertPermission`, `upsertRole`, `ensureUserRole`, `setRolePermissions`, `setRoleInheritance`. Safe to run on every app boot.
- **Cross-DB-portable JSON storage** for `api_mappings` and `ui_mappings` — stored as text-encoded JSON so the same schema works on SQLite, PostgreSQL, MySQL, and SQL Server without `json`-type divergence.
- **`PrismaClientLike`** structural type — the adapter works with any Prisma client whose generated delegates match the shape PermX calls. Your project's real `PrismaClient` satisfies this automatically.
- 31 tests against an in-memory Prisma-compatible test harness (data provider, seed helpers, factory end-to-end including cache invalidation).

## [@permx/core 0.4.0] - 2026-04-17

### Added

- **Per-user permission cache with granular invalidation** — `authorize()` and `getUserPermissions()` now share a per-user (per-tenant when multi-tenancy is enabled) TTL cache. Opt in via existing `cache: { ttl }` config.
  - `permx.invalidateUser(userId, { tenantId? })` — clear one user's cache entry after a role change
  - `permx.invalidateAll()` — clear user cache + api-map cache; use after bulk permission/role schema changes
  - `permx.invalidateCache()` — kept as a deprecated alias of `invalidateAll()` for backwards compatibility
- **Dev-mode typo guardrail** — `dev.knownKeys` config option logs a one-time warning when `authorize()` is called with a key not in the provided set. Pair with `Object.values(definePermissions(...))` for full coverage. Warnings deduplicated per key; omit `dev` in production for zero overhead.
- **`DevConfig` type** exported from the main entry point.
- 11 new tests (228 total) — 7 for cache invalidation behaviour, 4 for dev-mode warnings.

### Changed

- No breaking changes. All additions are backwards-compatible.

## [@permx/react 0.2.0] - 2026-04-17

### Added

- **`errorFallback` prop** on `<PermXProvider>` — `(error, retry) => ReactNode`. Renders when the initial fetch (or a subsequent `refresh()`) fails; the supplied `retry` function re-triggers the fetch. Falls back to `fallback` when not provided (existing behaviour).
- **`usePermXRefresh()` hook** — returns a stable `refresh()` function that re-fetches permissions without re-mounting the provider. Resolves to `{ ok: true }` or `{ ok: false, error }`. Pair with backend `permx.invalidateUser(id)` after role changes to propagate new permissions without a page reload.
- **`usePermXError()` hook** — exposes the current fetch error (or `null`) to any descendant. Useful for toasts, banners, and programmatic error handling outside `<PermXProvider>`'s render prop.
- **Store-level `refresh()`** with stale-response protection — concurrent refreshes use an internal token so only the last call's result is applied.
- 8 new tests (65 total) covering error rendering, retry, refresh success/failure, and the error hook.

### Changed

- `PermissionState` now includes an `error: Error | null` field (additive, non-breaking).
- `@permx/core` peer dependency bumped to `>=0.4.0` so the new invalidation APIs referenced by the documentation are available.

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
