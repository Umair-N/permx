# PermX

[![npm version](https://img.shields.io/npm/v/@permx/core.svg?label=%40permx%2Fcore)](https://www.npmjs.com/package/@permx/core)
[![npm version](https://img.shields.io/npm/v/@permx/react.svg?label=%40permx%2Freact)](https://www.npmjs.com/package/@permx/react)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/core_deps-zero-brightgreen.svg)](#entry-points)

Structured RBAC for Node.js and React. Permission keys with meaning, role inheritance that handles diamonds and cycles, UI-aware mappings, multi-tenant support, and a headless React SDK — works with any HTTP framework and any database.

```
npm install @permx/core          # backend
npm install @permx/react          # frontend
```

## The Problem

Most RBAC libraries give you flat string permissions (`"read:users"`) or abstract policy languages. When your app grows, you end up with:

- Hundreds of unstructured permission strings with no consistent naming
- Authorization logic scattered across middleware, controllers, and frontend code
- No connection between backend permissions and what the UI should show or hide
- SaaS subscription tiers bolted on as a separate system from role permissions
- Middleware locked to Express, unusable with Fastify, Hono, or Next.js

PermX solves these with **structured permission keys** (`module.resource:field.action.scope`), **UI mappings** baked into each permission, a **three-layer model** (roles + subscriptions + feature flags), and a **framework-agnostic core** with zero dependencies.

## How It Compares

| Capability | CASL | Casbin | Permit.io | **PermX** |
|---|---|---|---|---|
| Structured keys (`module.resource:field.action.scope`) | No | No | No | **Yes** |
| UI mappings (routes/components/fields) | No | No | No | **Yes** |
| 3-layer model (regular + subscription + flags) | No | No | Partial | **Yes** |
| Role inheritance with DFS + cycle protection | No | Policy | Managed | **Yes** |
| Framework-agnostic (Express, Hono, Fastify, Koa) | Express | Yes | SaaS | **Yes** |
| DB-agnostic with adapter pattern | No | Yes | SaaS | **Yes** |
| React SDK (components, hooks, zero-dep store) | `<Can>` only | No | No | **Full suite** |

## Quick Start (5 minutes)

### 1. Install

```bash
npm install @permx/core mongoose express
```

### 2. Initialize

```typescript
import mongoose from 'mongoose';
import { createPermX } from '@permx/core/mongoose';

await mongoose.connect('mongodb://localhost:27017/myapp');

const permx = createPermX({
  connection: mongoose.connection,
});

// Create collections and indexes
await permx.migrate();
```

### 3. Seed your first role

Before `authorize()` can return `true`, you need a module, a permission, a role, and a user-role assignment. PermX ships a declarative, idempotent seeder — safe to run on every app boot:

```typescript
import { syncFromConfig } from '@permx/core/mongoose';

await syncFromConfig(permx.models, {
  modules: [
    { name: 'Projects', slug: 'projects' },
  ],
  permissions: [
    { moduleSlug: 'projects', name: 'View Tasks',  key: 'projects.tasks.view.all' },
    { moduleSlug: 'projects', name: 'Create Tasks', key: 'projects.tasks.create.all' },
  ],
  roles: [
    {
      name: 'Project Viewer',
      slug: 'project-viewer',
      permissionKeys: ['projects.tasks.view.all'],
    },
    {
      name: 'Project Editor',
      slug: 'project-editor',
      permissionKeys: ['projects.tasks.create.all'],
      inheritsFrom: ['project-viewer'], // inherits view permissions too
    },
  ],
});

// Assign the role to a user (also idempotent)
import { ensureUserRole } from '@permx/core/mongoose';
const role = await permx.models.Role.findOne({ slug: 'project-editor' });
await ensureUserRole(permx.models, userId, role._id.toString());
```

All helpers are upsert-based and cross-reference by `slug` / `key` — no id wiring needed. For one-off operations use `upsertModule`, `upsertPermission`, `upsertRole`, and `ensureUserRole` individually.

### 4. Protect Routes

```typescript
import { createPermXMiddleware } from '@permx/core/express';

const auth = createPermXMiddleware(permx, {
  extractUserId: (req) => req.user?.id,
});

app.get('/projects', auth.authorize('projects.tasks.view.all'), listProjects);
app.post('/projects', auth.authorize('projects.tasks.create.all'), createProject);
app.delete('/users/:id', auth.authorize('admin.users.delete.all'), deleteUser);
```

### 5. Check Permissions

```typescript
// Direct check
const result = await permx.authorize(userId, 'projects.tasks.view.all');
// → { authorized: true }

// Get all effective permissions (for frontend)
const perms = await permx.getUserPermissions(userId);
// → { permissions: [...], ui_mappings: { routes, components, fields }, modules }
```

### 6. Gate the UI with `@permx/react`

```bash
npm install @permx/react
```

Wrap your app once, then gate components, fields, and routes declaratively:

```tsx
import { PermXProvider, Can, CanField, RouteGuard, FeatureGate } from '@permx/react';

function App() {
  return (
    <PermXProvider
      fetchPermissions={() => fetch('/api/permissions/my').then((r) => r.json())}
      superAdmin={user.role === 'super-admin'}
      fallback={<Spinner />}
    >
      {/* Component-level gate */}
      <Can componentId="edit-project-btn">
        <EditButton />
      </Can>

      {/* Field-level gate (hides form field) */}
      <CanField fieldId="salary">
        <SalaryInput />
      </CanField>

      {/* Route-level gate (pair with router redirect) */}
      <RouteGuard routeId="/admin" fallback={<NoAccess />}>
        <AdminPage />
      </RouteGuard>

      {/* Feature gate with upgrade-prompt overlay */}
      <FeatureGate
        permission="subscription.sso"
        renderOverlay={() => <UpgradeBanner plan="pro" />}
      >
        <SSOSettings />
      </FeatureGate>
    </PermXProvider>
  );
}
```

Or use hooks for programmatic checks:

```tsx
import { useHasPermission, useHasRoute, usePermXReady } from '@permx/react';

function Toolbar() {
  const ready = usePermXReady();
  const canEdit = useHasPermission('projects.tasks.update.own');
  const canViewAdmin = useHasRoute('/admin');

  if (!ready) return <Spinner />;
  return (
    <nav>
      {canEdit && <EditButton />}
      {canViewAdmin && <a href="/admin">Admin</a>}
    </nav>
  );
}
```

The React SDK is ~5 KB, has **zero runtime dependencies** (built on React's `useSyncExternalStore`), works with React 18 and 19, and is router-agnostic. See [`packages/react/README.md`](packages/react/README.md) for the full API reference.

## Core Concepts

### Structured Permission Keys

Permissions follow the format: `{module}.{resource}:{field}.{action}.{scope}`

```typescript
import { buildDerivedKey, parsePermissionKey } from '@permx/core';

// Field-level access control: only certain roles can see revenue data
buildDerivedKey({
  module: 'analytics',
  resource: 'reports',
  action: 'view',
  scope: 'own',
  field: 'revenue',
});
// → "analytics.reports:revenue.view.own"

parsePermissionKey('analytics.reports:revenue.view.own');
// → { module: 'analytics', resource: 'reports', field: 'revenue', action: 'view', scope: 'own' }
```

**Actions**: `view`, `create`, `update`, `delete`, `manage`
**Scopes**: `all`, `own`, `team`, `department`, `self`, `public`, `admin`

### Typed Permission Keys (TypeScript)

Define permissions once and get autocomplete + literal types everywhere — no magic strings:

```typescript
import { definePermissions, type PermissionKeyOf } from '@permx/core';

export const P = definePermissions({
  projectsView:  { module: 'projects', resource: 'tasks', action: 'view',   scope: 'all' },
  projectsEdit:  { module: 'projects', resource: 'tasks', action: 'update', scope: 'own' },
  viewSalary:    { module: 'people',   resource: 'employees', action: 'view', scope: 'own', field: 'salary' },
} as const);

// Inferred as the literal string "projects.tasks.view.all"
P.projectsView;

// A union of every key you defined — use it to type middleware args
export type AppPermission = PermissionKeyOf<typeof P>;

await permx.authorize(userId, P.projectsView); // fully typed, autocomplete works
app.get('/tasks', auth.authorize(P.projectsView), listTasks);
```

Benefits: refactor a permission in one place, get a compile error everywhere it was used; IDE autocomplete across the app.

### Role Inheritance

Roles can inherit permissions from parent roles. PermX uses DFS with diamond and cycle protection:

```
Owner (full access)
  └── Admin (inherits Owner's management permissions)
        ├── Editor (inherits Admin — can edit content)
        └── Billing Manager (inherits Admin — can manage payments)
              └── Viewer (inherits from both — diamond handled)
```

### UI Mappings

Each permission can map to routes, components, and fields — enabling frontend gating without hardcoding access rules in your UI:

```typescript
// Permission "billing.invoices.view.all" maps to:
{
  ui_mappings: [
    { type: 'route', identifier: '/billing' },
    { type: 'component', identifier: 'invoice-table' },
    { type: 'field', identifier: 'payment-amount' },
  ]
}

// Frontend receives pre-computed arrays:
const perms = await permx.getUserPermissions(userId);
perms.ui_mappings.routes;     // ['/billing', '/dashboard', '/settings']
perms.ui_mappings.components; // ['invoice-table', 'export-btn', 'user-list']
perms.ui_mappings.fields;     // ['payment-amount', 'api-key', 'revenue']
```

### Three-Layer Permission Model

For SaaS apps, permissions come from three independent sources:

```
Effective = Regular Roles ∪ Subscription Roles ∪ Feature Flags

Regular Roles:    Job-function access (per-user assignment)
Subscription:     Tenant plan features (per-tenant, shared by all users)
Feature Flags:    Gradual rollout capabilities (per-tenant)
```

**Example**: A user with the "Editor" role on the "Pro" plan gets:
- Editor permissions (create/update posts, manage media)
- Pro plan features (analytics dashboard, API access, custom domains)
- Feature flags (beta AI assistant, new editor UI)

**Wiring to Stripe (or any billing provider):**

```typescript
// 1. Create a "subscription" role per plan tier (idempotent seed)
await syncFromConfig(permx.models, {
  roles: [
    { name: 'Free Plan',  slug: 'plan-free',  role_type: 'subscription',
      permissionKeys: ['posts.content.view.all'] },
    { name: 'Pro Plan',   slug: 'plan-pro',   role_type: 'subscription',
      permissionKeys: ['posts.content.view.all', 'analytics.dashboards.view.all'] },
  ],
});

// 2. Tell PermX how to resolve a tenant's active plan at request time
const permx = createPermX({
  connection: mongoose.connection,
  subscriptionResolver: async (tenantId) => {
    const tenant = await TenantModel.findById(tenantId).lean();
    const planRole = await permx.models.Role.findOne({ slug: tenant.planSlug }).lean();
    return planRole ? [planRole._id.toString()] : [];
  },
});

// 3. When Stripe sends a webhook (checkout.session.completed, customer.subscription.updated),
//    just update the tenant's planSlug — PermX picks it up on the next request.
await TenantModel.updateOne({ _id: tenantId }, { $set: { planSlug: 'plan-pro' } });
```

The resolver is called per authorization; wrap it with the built-in cache (`cache: { ttl: 15_000 }`) to avoid per-request DB hits.

## Entry Points

| Import | Purpose | Dependencies |
|---|---|---|
| `@permx/core` | Core types, engine, utilities | **Zero** |
| `@permx/core/mongoose` | MongoDB adapter + schema factory | `mongoose` |
| `@permx/core/express` | Express middleware | `express` |
| `@permx/react` | React components, hooks, and zero-dep store | `react` (peer) |

### `@permx/core` — Core (Zero Dependencies)

```typescript
import {
  // Key utilities
  buildDerivedKey,
  parsePermissionKey,
  definePermissions,
  type PermissionKeyOf,

  // Engine (for custom adapters)
  resolveRolePermissions,
  detectCircularInheritance,
  matchPathPattern,
  createPermXCore,

  // Framework-agnostic authorization
  handleAuthorization,
  handleApiAuthorization,
  type AuthorizationRequest,
  type AuthorizationOutcome,

  // Cache
  TtlCache,

  // Errors
  PermXError,
  PermissionDeniedError,
  CircularInheritanceError,

  // Types
  type Permission,
  type Role,
  type Module,
  type UserRole,
  type PermXDataProvider,
  type PermXConfig,
  type EffectivePermissions,
  type AuthResult,

  // Constants
  PERMISSION_ACTIONS,
  PERMISSION_SCOPES,
  ROLE_TYPES,
} from '@permx/core';
```

### `@permx/core/mongoose` — MongoDB Adapter

```typescript
import {
  createPermX,
  createPermXSchemas,
  MongooseDataProvider,
  tenantPlugin,

  // Idempotent seed helpers (safe to run on every boot)
  syncFromConfig,
  upsertModule,
  upsertPermission,
  upsertRole,
  ensureUserRole,

  type MongoosePermXConfig,
  type MongoosePermXInstance,
  type SchemaFactoryConfig,
  type PermXModels,
} from '@permx/core/mongoose';
```

### `@permx/core/express` — Middleware

```typescript
import {
  createPermXMiddleware,
  type PermXMiddleware,
  type PermXMiddlewareConfig,
} from '@permx/core/express';
```

### `@permx/react` — React SDK (peer: react)

```typescript
import {
  // Provider
  PermXProvider,

  // Gate components (headless — no CSS bundled)
  Can,
  CanField,
  RouteGuard,
  FeatureGate,

  // Hooks
  useHasPermission,
  useHasRoute,
  useHasComponent,
  useHasField,
  usePermissions,
  usePermXReady,

  // Advanced (custom providers, testing, SSR hydration)
  createPermissionStore,
  PermissionStore,

  // Types
  type PermXProviderProps,
  type CanProps,
  type CanFieldProps,
  type RouteGuardProps,
  type FeatureGateProps,
  type PermissionState,
} from '@permx/react';
```

## Configuration

### Full Configuration Example

```typescript
import { createPermX } from '@permx/core/mongoose';

const permx = createPermX({
  // Required: your Mongoose connection
  connection: mongoose.connection,

  // Optional: rename collections (default: PermX_Module, PermX_Permission, etc.)
  collections: {
    module: 'acl_modules',
    permission: 'acl_permissions',
    role: 'acl_roles',
    userRole: 'acl_user_roles',
  },

  // Optional: extend schemas with custom fields
  extend: {
    role: { department: { type: String } },
    userRole: { notes: { type: String } },
  },

  // Optional: multi-tenancy
  tenancy: {
    enabled: true,
    tenantIdField: 'tenantId',                  // default
    exemptModels: ['module', 'permission'],      // global (not per-tenant)
  },

  // Optional: subscription-based permissions (SaaS)
  subscriptionResolver: async (tenantId) => {
    const tenant = await TenantModel.findById(tenantId);
    return tenant?.planPermissionIds ?? [];
  },

  // Optional: super-admin bypass
  superAdmin: {
    check: (userId) => userId === 'admin-user-id',
  },

  // Optional: API permission map cache
  cache: { ttl: 15_000 },
});
```

### Express Middleware Configuration

```typescript
import { createPermXMiddleware } from '@permx/core/express';

const auth = createPermXMiddleware(permx, {
  // Required: how to get user ID from the request
  extractUserId: (req) => req.user?.id,

  // Optional: tenant context for multi-tenant apps
  extractTenantId: (req) => req.headers['x-tenant-id'] as string,

  // Optional: service-to-service bypass
  isServiceCall: (req) => req.headers['x-api-key'] === process.env.SERVICE_KEY,

  // Optional: super-admin bypass at middleware level
  isSuperAdmin: (req) => req.user?.role === 'super-admin',

  // Optional: custom denied response
  onDenied: (req, res, permissionKey) => {
    res.status(403).json({
      error: 'Forbidden',
      required_permission: permissionKey,
    });
  },

  // Optional: custom error response
  onError: (req, res, error) => {
    res.status(500).json({ error: 'Authorization service unavailable' });
  },
});

// Per-route authorization
router.get('/projects', auth.authorize('projects.tasks.view.all'), handler);
router.post('/billing/invoices', auth.authorize('billing.invoices.create.all'), handler);

// Gateway-style API mapping authorization
router.use(auth.authorizeApi('project-service'));
```

## Framework-Agnostic Authorization

The core package exports `handleAuthorization` and `handleApiAuthorization` — pure async functions that work with any HTTP framework (Hono, Fastify, Koa, Next.js, etc.):

```typescript
import {
  handleAuthorization,
  handleApiAuthorization,
  type AuthorizationRequest,
  type AuthorizationOutcome,
} from '@permx/core';

// 1. Map your framework's request to AuthorizationRequest
const request: AuthorizationRequest = {
  userId: getUserIdFromYourFramework(),
  tenantId: getTenantIdFromYourFramework(),
  isServiceCall: false,
  isSuperAdmin: false,
};

// 2. Call the handler
const outcome = await handleAuthorization(permx, request, 'projects.tasks.view.all');

// 3. Map the outcome to your framework's response
if (outcome.action === 'allow')  { /* next() */ }
if (outcome.action === 'deny')   { /* 403 response */ }
if (outcome.action === 'error')  { /* 500 response */ }
```

The Express middleware (`@permx/core/express`) is a thin wrapper around these functions. See [`examples/hono-adapter.ts`](examples/hono-adapter.ts) for a complete Hono adapter in ~20 lines.

## Building Custom Data Adapters

PermX's core engine is database-agnostic. To use a different database, implement the `PermXDataProvider` interface:

```typescript
import { createPermXCore, type PermXDataProvider } from '@permx/core';

class PrismaDataProvider implements PermXDataProvider {
  async getUserRoles(userId: string) { /* Prisma queries */ }
  async getRoleForResolution(roleId: string) { /* Prisma queries */ }
  async getPermissionsByIds(ids: string[]) { /* Prisma queries */ }
  async getModulesByIds(ids: string[]) { /* Prisma queries */ }
  async getApiPermissionMap() { /* Prisma queries */ }
}

const permx = createPermXCore(new PrismaDataProvider(), {
  cache: { ttl: 15_000 },
  superAdmin: { check: (userId) => userId === 'admin' },
});
```

## Architecture

This is a monorepo with two published packages:

```
packages/core/          → @permx/core (zero deps)
├── types/              8 type definition files
├── engine/             Permission key parser, DFS resolver, circular detector, path matcher
├── middleware/
│   └── handler.ts      Framework-agnostic handleAuthorization + handleApiAuthorization
├── cache/              Generic TTL cache
├── errors.ts           Error class hierarchy
├── permx.ts            createPermXCore() factory
├── mongoose/           (peer: mongoose) Schema factory, data provider, tenant plugin
└── middleware/         (peer: express)  Thin Express wrapper over handler.ts

packages/react/         → @permx/react (peer: react, zero runtime deps)
├── store.ts            PermissionStore class with useSyncExternalStore-compatible API
├── context.ts          React context + internal usePermXStore hook
├── provider.tsx        <PermXProvider> — fetches on mount, hydrates store
├── components/         <Can>, <CanField>, <RouteGuard>, <FeatureGate> (headless)
└── hooks/              useHasPermission, useHasRoute, useHasComponent, useHasField,
                        usePermissions, usePermXReady
```

## Development

```bash
# Install dependencies for the whole workspace
bun install

# Run tests for all packages (261 tests total)
bun run test

# Run just one package
bun run test:core      # @permx/core   — 204 tests
bun run test:react     # @permx/react  — 57 tests

# Build all packages (dual CJS/ESM)
bun run build

# Type check and lint the whole monorepo
bun run typecheck
bun run lint
```

## License

MIT
