# PermX

[![npm version](https://img.shields.io/npm/v/@permx/core.svg)](https://www.npmjs.com/package/@permx/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Zero Dependencies](https://img.shields.io/badge/core_deps-zero-brightgreen.svg)](#entry-points)

Structured RBAC for Node.js. Permission keys with meaning, role inheritance that handles diamonds and cycles, UI-aware mappings, and multi-tenant support — works with any HTTP framework and any database.

```
npm install @permx/core
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

### 3. Protect Routes

```typescript
import { createPermXMiddleware } from '@permx/core/express';

const auth = createPermXMiddleware(permx, {
  extractUserId: (req) => req.user?.id,
});

app.get('/projects', auth.authorize('projects.tasks.view.all'), listProjects);
app.post('/projects', auth.authorize('projects.tasks.create.all'), createProject);
app.delete('/users/:id', auth.authorize('admin.users.delete.all'), deleteUser);
```

### 4. Check Permissions

```typescript
// Direct check
const result = await permx.authorize(userId, 'projects.tasks.view.all');
// → { authorized: true }

// Get all effective permissions (for frontend)
const perms = await permx.getUserPermissions(userId);
// → { permissions: [...], ui_mappings: { routes, components, fields }, modules }
```

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

## Entry Points

| Import | Purpose | Dependencies |
|---|---|---|
| `@permx/core` | Core types, engine, utilities | **Zero** |
| `@permx/core/mongoose` | MongoDB adapter + schema factory | `mongoose` |
| `@permx/core/express` | Express middleware | `express` |

### `@permx/core` — Core (Zero Dependencies)

```typescript
import {
  // Key utilities
  buildDerivedKey,
  parsePermissionKey,

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

```
@permx/core (zero deps)
├── types/           8 type definition files
├── engine/          Permission key parser, DFS resolver, circular detector, path matcher
├── middleware/
│   └── handler.ts   Framework-agnostic handleAuthorization + handleApiAuthorization
├── cache/           Generic TTL cache
├── errors.ts        Error class hierarchy
└── permx.ts         createPermXCore() factory

@permx/core/mongoose (peer: mongoose)
├── schemas.ts       Schema factory with plugin support
├── data-provider.ts MongooseDataProvider implements PermXDataProvider
├── factory.ts       createPermX() wires schemas + provider + core
└── tenant-plugin.ts Lightweight opt-in tenant isolation

@permx/core/express (peer: express)
└── authorize.ts     Thin Express wrapper over handler.ts
```

## Development

```bash
# Install dependencies
bun install

# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Build (dual CJS/ESM)
bun run build

# Type check
bun run typecheck

# Validate package exports
bun run lint
```

## License

MIT
