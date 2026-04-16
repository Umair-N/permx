# PermX Roadmap

## Current State (Phase 1 — Complete)

### What's Shipped

| Component | Files | Lines | Test Coverage | Status |
|---|---|---|---|---|
| Types | 8 files | 240 | N/A (interfaces) | Done |
| Engine (key parser, DFS, matcher, resolver) | 5 files | 331 | 99% | Done |
| Cache (TTL Map) | 1 file | 48 | 100% | Done |
| Errors (5 classes) | 1 file | 46 | 100% | Done |
| Core Factory (`createPermXCore`) | 1 file | 115 | 87% | Done |
| Mongoose Schema Factory | 1 file | 250 | Needs integration tests | Done |
| Mongoose DataProvider | 1 file | 142 | Needs integration tests | Done |
| Mongoose Factory (`createPermX`) | 1 file | 69 | Needs integration tests | Done |
| Tenant Plugin | 1 file | 30 | Needs integration tests | Done |
| Express Middleware | 2 files | 119 | Needs integration tests | Done |
| **Total** | **25 files** | **1,673** | **58 tests passing** | |

### Build Output

| Entry Point | ESM | CJS | Types |
|---|---|---|---|
| `permx` | 9.76 KB | 10.18 KB | 6.17 KB |
| `permx/mongoose` | 18.00 KB | 18.45 KB | 3.79 KB |
| `permx/express` | 2.19 KB | 2.23 KB | 1.30 KB |

### Tooling

- **Runtime**: bun + tsx
- **Bundler**: tsup (dual CJS/ESM)
- **Tests**: vitest (58 passing, 219ms)
- **Package validation**: publint (clean) + @arethetypeswrong/cli (node16/bundler green)

---

## Next Steps — Detailed

### Phase 1.5: Integration Tests + Polish (before v0.1.0 publish)

**Priority: HIGH — blocks npm publish**

#### 1. Mongoose Integration Tests

Test the schema factory and data provider against a real MongoDB instance using `mongodb-memory-server`.

```
tests/mongoose/
├── schemas.test.ts         # Schema factory creates correct models, indexes, custom fields
├── data-provider.test.ts   # Full CRUD + permission resolution queries
├── tenant-plugin.test.ts   # Tenant isolation works correctly
└── factory.test.ts         # createPermX() end-to-end
```

**What to test:**
- [ ] `createPermXSchemas()` creates 4 models on the connection
- [ ] Default collection names: `PermX_Module`, `PermX_Permission`, `PermX_Role`, `PermX_UserRole`
- [ ] Custom collection names via `collections` config
- [ ] Custom fields via `extend` config appear in documents
- [ ] Indexes are created correctly (unique constraints work)
- [ ] Tenant plugin adds `tenantId` field when enabled
- [ ] Tenant plugin skips exempt models (module, permission)
- [ ] `MongooseDataProvider.getUserRoles()` returns populated roles with permissions
- [ ] `MongooseDataProvider.getRoleForResolution()` returns permissions + inherits_from
- [ ] `MongooseDataProvider.getPermissionsByIds()` returns full permission documents
- [ ] `MongooseDataProvider.getModulesByIds()` returns active modules sorted by sort_order
- [ ] `MongooseDataProvider.getApiPermissionMap()` extracts service/method/path/key entries
- [ ] `permx.migrate()` creates all indexes without error
- [ ] Full end-to-end: create module → create permission → create role → assign to user → resolve permissions

**Estimated effort:** 2 days

#### 2. Express Middleware Tests

Test middleware using `supertest` with a mock PermX instance.

```
tests/middleware/
└── authorize.test.ts
```

**What to test:**
- [ ] `auth.authorize(key)` calls `permx.authorize()` with correct userId
- [ ] Returns 403 when permission denied
- [ ] Returns 200 and calls `next()` when authorized
- [ ] `extractUserId` returning null → 403
- [ ] `isServiceCall` bypass works
- [ ] `isSuperAdmin` bypass works
- [ ] Custom `onDenied` handler is called
- [ ] Custom `onError` handler is called on exception
- [ ] `auth.authorizeApi(service)` matches API map entries
- [ ] `extractTenantId` passes tenant context to permx

**Estimated effort:** 1 day

#### 3. Sahal Compatibility Test

Verify that PermX Mongoose models produce documents identical to Sahal's ACE models.

- [ ] Create a permission via PermX → compare document shape with Sahal's `Permission.create()`
- [ ] Create a role via PermX → compare with Sahal's `Role.create()`
- [ ] Create a user-role via PermX → compare with Sahal's `UserRole.create()`
- [ ] Verify index names match (for zero-migration adoption)
- [ ] Verify `buildDerivedKey()` output matches Sahal's `build_derived_key()` for 20+ test cases

**Estimated effort:** 0.5 days

#### 4. CLAUDE.md for the Project

Create project instructions so Claude Code can work on this repo effectively.

**Estimated effort:** 0.5 days

#### 5. Initial Git Commit + npm Reserve

- [ ] `git add . && git commit`
- [ ] Reserve `permx` on npm: `npm publish --dry-run` then `npm publish --access public`
- [ ] Create GitHub repo (when ready to go public)

**Estimated effort:** 0.5 days

---

### Phase 2: React SDK (`@permx/react`)

**Priority: HIGH — this is the biggest differentiator**

Split into a separate package because React consumers must not install Mongoose.

```
packages/react/
├── package.json            # @permx/react, peer: react, zustand
├── src/
│   ├── store/
│   │   └── permission-store.ts   # createPermissionStore() factory
│   ├── components/
│   │   ├── PermXProvider.tsx      # Context wrapper (fetches + hydrates store)
│   │   ├── Can.tsx                # Component-level gate
│   │   ├── CanField.tsx           # Field-level gate
│   │   ├── RouteGuard.tsx         # Route-level gate (router-agnostic)
│   │   └── FeatureGate.tsx        # Subscription tier gate with upgrade overlay
│   ├── hooks/
│   │   ├── usePermission.ts       # useHasPermission, useHasRoute, useHasComponent, useHasField
│   │   └── usePermissionInit.ts   # Bootstrap hook
│   └── index.ts
└── tests/
    ├── store.test.ts
    ├── can.test.tsx
    ├── route-guard.test.tsx
    └── feature-gate.test.tsx
```

**What to port from Sahal:**

| Sahal File | PermX Target | Changes |
|---|---|---|
| `permission-store.tsx` (108 lines) | `store/permission-store.ts` | Wrap in `createPermissionStore()` factory |
| `Can.tsx` (17 lines) | `components/Can.tsx` | Accept store via context instead of direct import |
| `CanField.tsx` (16 lines) | `components/CanField.tsx` | Accept store via context |
| `rbac-route-guard.tsx` (30 lines) | `components/RouteGuard.tsx` | Make router-agnostic (accept `navigate` callback) |
| `FeatureGate.tsx` (92 lines) | `components/FeatureGate.tsx` | Make styling customizable (headless or className) |
| `usePermissionInit.tsx` (71 lines) | `hooks/usePermissionInit.ts` | Replace Sahal API hooks with `fetchPermissions()` callback |
| `FeatureGate.test.tsx` (163 lines) | `tests/feature-gate.test.tsx` | Adapt to use factory store |

**Consumer API:**

```tsx
import { PermXProvider, Can, CanField, RouteGuard, FeatureGate } from '@permx/react';

// Wrap your app
<PermXProvider
  fetchPermissions={() => fetch('/api/permissions/my').then(r => r.json())}
  superAdmin={user.role === 'super-admin'}
>
  <App />
</PermXProvider>

// Gate components
<Can componentId="edit-client-btn">
  <EditButton />
</Can>

// Gate fields
<CanField fieldId="salary">
  <SalaryInput />
</CanField>

// Gate routes
<RouteGuard routeId="/admin/users" redirectTo="/no-access">
  <AdminPage />
</RouteGuard>

// Gate by subscription tier
<FeatureGate
  permission="subscription.sso"
  currentTier={plan.tier}
  onUpgrade={() => navigate('/billing')}
>
  <SSOSettings />
</FeatureGate>
```

**Key decisions:**
- Ship as `@permx/react` (separate npm package) — requires npm org creation
- Zustand as peer dep (not bundled)
- Headless components (no Tailwind/CSS bundled — consumer styles)
- FeatureGate overlay is opt-in via `renderOverlay` prop

**Estimated effort:** 2 weeks

**This converts the project from monorepo to multi-package:**
```
ace-rbac/
├── packages/
│   ├── core/         # permx (current src/ moves here)
│   └── react/        # @permx/react
├── turbo.json
└── pnpm-workspace.yaml
```

---

### Phase 3: Documentation Site

**Priority: MEDIUM — drives adoption**

- [ ] VitePress or Starlight docs site
- [ ] Auto-generated API reference from TypeDoc
- [ ] Framework-specific quickstarts:
  - Express + MongoDB
  - NestJS + MongoDB
  - Next.js API Routes
  - React frontend
- [ ] Interactive playground (CodeSandbox/StackBlitz template)
- [ ] Comparison page (PermX vs CASL vs Casbin vs Permit.io)
- [ ] Migration guide from CASL
- [ ] Deploy to permx.dev or similar

**Estimated effort:** 1-2 weeks

---

### Phase 4: Additional Adapters

**Priority: LOW — build when requested**

Only build when someone opens a GitHub issue asking for it.

#### Prisma Adapter (`@permx/prisma`)

```typescript
import { createPermX } from '@permx/prisma';

const permx = createPermX({
  prisma: prismaClient,
  // Same config as mongoose adapter
});
```

- Ships Prisma schema fragment for consumers to merge
- Implements `PermXDataProvider` using Prisma Client
- Migration via `prisma migrate`

#### NestJS Integration (`@permx/nestjs`)

```typescript
@Module({
  imports: [PermXModule.forRoot({ connection: mongoose.connection })],
})
export class AppModule {}

// Guard usage
@UseGuards(PermXGuard('clients.view.all'))
@Get('/clients')
getClients() {}
```

- NestJS Module with `forRoot` / `forRootAsync`
- `PermXGuard` decorator
- Injectable `PermXService`

#### Fastify Adapter (`@permx/fastify`)

- Fastify `onRequest` hook instead of Express middleware
- Same API pattern as Express adapter

**Estimated effort per adapter:** 1 week each

---

### Phase 5: Power Features

**Priority: VARIES — build based on user demand**

#### Audit Trail (Most Requested RBAC Feature)

```typescript
// PermX emits events that consumers can hook into
permx.on('authorize', (event) => {
  // { userId, permissionKey, authorized, timestamp, tenantId }
  auditLogger.log(event);
});

permx.on('role.assign', (event) => {
  // { userId, roleId, assignedBy, timestamp }
});
```

- Event emitter pattern on PermXInstance
- Events: `authorize`, `authorize.denied`, `role.assign`, `role.remove`, `permission.change`
- Consumer hooks into their own audit system (not PermX's job to store)

#### System Role Templates

Port from Sahal's `system-role-template.logic.ts` (442 lines):

- Template CRUD with versioning
- `propagate()` — push template changes to all non-customized cloned roles
- `rollback()` — revert to previous version
- `cloneForTenant()` — create a tenant-specific instance from a template
- `revokeFromTenant()` — remove cloned role + handle user assignment cleanup

This is the "how do I update permissions across 500 tenants" feature.

#### Permission Layout Config

Port from Sahal for admin UIs — controls how permissions are displayed/grouped in a management interface, independent of their actual module assignment.

#### Real-Time Permission Sync

When permissions change (role update, assignment change), notify connected frontends:

```typescript
// Backend
permx.on('permissions.changed', (event) => {
  websocket.broadcast(event.userId, { type: 'permissions_invalidated' });
});

// Frontend (@permx/react)
<PermXProvider
  fetchPermissions={fetchFn}
  realtimeChannel={websocketChannel}  // auto-refetch on invalidation
>
```

#### Compact Wire Format

Address the CASL complaint about bloated JWTs. Instead of serializing all permission rules:

```typescript
// Instead of sending 200 permission keys:
const compact = permx.getCompactToken(userId);
// → Base64 bitfield: "AQIDBAUGBwgJ..." (< 1KB for 500 permissions)

const canAccess = permx.checkCompactToken(compact, 'clients.view.all');
```

---

### Phase 6: Open-Core Cloud Product (Future)

Every successful RBAC SDK (Permit.io, Clerk, Auth0) follows: free SDK + paid cloud.

**Free (open source):**
- Everything described above
- Self-hosted, full functionality

**Paid cloud (future):**
- Visual permission editor (drag-and-drop role building)
- Audit log dashboard with search/filter
- Real-time permission sync service
- Multi-environment management (dev → staging → prod)
- Role diff and approval workflows
- Analytics (who accesses what, usage patterns)
- SSO for the admin console

---

## Migration Path: Sahal → PermX

When PermX is ready, Sahal migrates incrementally:

| Step | Sahal Code | PermX Replacement | Risk |
|---|---|---|---|
| 1 | `@data/model/ace/*` | `createPermXSchemas()` (same collection names) | Low — zero DB migration |
| 2 | `@data/operation/ace/*` | `MongooseDataProvider` | Low |
| 3 | `@businessLogic/ace/role.logic.ts` | `resolveRolePermissions()` from `permx` | Medium — test DFS parity |
| 4 | `@businessLogic/ace/user-role.logic.ts` | `getUserEffectivePermissions()` from `permx` | Medium — test 3-layer parity |
| 5 | `@businessLogic/ace/authorize.logic.ts` | `permx.authorize()` + `permx.authorizeApi()` | Low |
| 6 | `ace-authorize.middleware.ts` | `createPermXMiddleware()` | Low |
| 7 | `proxy-authorize.middleware.ts` | `auth.authorizeApi()` | Medium — gateway-specific logic |
| 8 | `permission-store.tsx` | `@permx/react` store | Low — near-identical API |
| 9 | `Can.tsx`, `CanField.tsx` | `@permx/react` components | Low — direct port |
| 10 | `RbacRouteGuard.tsx` | `@permx/react` RouteGuard | Low |
| 11 | `FeatureGate.tsx` | `@permx/react` FeatureGate | Low — styling adjustment |
| 12 | `usePermissionInit.tsx` | `@permx/react` PermXProvider | Medium — rewire API hooks |
| 13 | Provide `subscriptionResolver` callback | Sahal-specific CustomerProfile lookup | Low — just a function |

**Key guarantee:** Same MongoDB collection names and field names = **zero database migration**.

---

## Timeline Estimate

| Phase | Scope | Effort | Dependency |
|---|---|---|---|
| 1.5 | Integration tests + publish v0.1.0 | 4-5 days | None |
| 2 | `@permx/react` | 2 weeks | Phase 1.5 |
| 3 | Docs site | 1-2 weeks | Phase 2 |
| 4 | Additional adapters | 1 week each | On demand |
| 5 | Power features | 1-2 weeks each | On demand |
| 6 | Cloud product | TBD | Phase 3+ |

## Priority Order

1. **Integration tests** (blocks everything)
2. **npm publish v0.1.0** (gets it out there)
3. **React SDK** (biggest differentiator)
4. **Sahal migration** (proves it works at scale)
5. **Docs site** (drives adoption)
6. Everything else follows user demand
