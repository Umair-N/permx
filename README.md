# PermX

Structured RBAC with permission keys, role inheritance, UI mappings, and feature flags.

```
npm install permx
```

## Why PermX?

Existing RBAC libraries (CASL, Casbin, AccessControl) lack structured permission keys, UI-aware mappings, multi-layer resolution, and React gating components. PermX fills this gap.

| Capability | CASL | Casbin | Permit.io | **PermX** |
|---|---|---|---|---|
| Structured keys (`module.resource:field.action.scope`) | No | No | No | **Yes** |
| UI mappings (routes/components/fields) | No | No | No | **Yes** |
| 3-layer model (regular + subscription + flags) | No | No | Partial | **Yes** |
| Role inheritance with DFS + cycle protection | No | Policy | Managed | **Yes** |
| React component suite | Partial | No | No | **Soon** |
| DB-agnostic with adapter pattern | No | Yes | SaaS | **Yes** |

## Quick Start (5 minutes)

### 1. Install

```bash
npm install permx mongoose express
```

### 2. Initialize

```typescript
import mongoose from 'mongoose';
import { createPermX } from 'permx/mongoose';

await mongoose.connect('mongodb://localhost:27017/myapp');

const permx = createPermX({
  connection: mongoose.connection,
});

// Create collections and indexes
await permx.migrate();
```

### 3. Protect Routes

```typescript
import { createPermXMiddleware } from 'permx/express';

const auth = createPermXMiddleware(permx, {
  extractUserId: (req) => req.user?.id,
});

app.get('/clients', auth.authorize('clients.clients.view.all'), getClients);
app.post('/clients', auth.authorize('clients.clients.create.all'), createClient);
```

### 4. Check Permissions

```typescript
// Direct check
const result = await permx.authorize(userId, 'clients.clients.view.all');
// → { authorized: true }

// Get all effective permissions (for frontend)
const perms = await permx.getUserPermissions(userId);
// → { permissions: [...], ui_mappings: { routes, components, fields }, modules }
```

## Core Concepts

### Structured Permission Keys

Permissions follow the format: `{module}.{resource}:{field}.{action}.{scope}`

```typescript
import { buildDerivedKey, parsePermissionKey } from 'permx';

buildDerivedKey({
  module: 'people',
  resource: 'employees',
  action: 'view',
  scope: 'own',
  field: 'salary',
});
// → "people.employees:salary.view.own"

parsePermissionKey('people.employees:salary.view.own');
// → { module: 'people', resource: 'employees', field: 'salary', action: 'view', scope: 'own' }
```

**Actions**: `view`, `create`, `update`, `delete`, `manage`
**Scopes**: `all`, `own`, `team`, `department`, `self`, `public`, `admin`

### Role Inheritance

Roles can inherit permissions from parent roles. PermX uses DFS with diamond and cycle protection:

```
Admin (manages everything)
  └── Manager (inherits Admin's view permissions)
        ├── Team Lead (inherits Manager)
        └── Project Lead (inherits Manager)
              └── Member (inherits from both leads — diamond handled)
```

### UI Mappings

Each permission can map to routes, components, and fields — enabling frontend gating without hardcoding access rules in your UI:

```typescript
// Permission "clients.clients.view.all" maps to:
{
  ui_mappings: [
    { type: 'route', identifier: '/clients' },
    { type: 'component', identifier: 'client-list-table' },
    { type: 'field', identifier: 'client-revenue' },
  ]
}

// Frontend receives pre-computed arrays:
const perms = await permx.getUserPermissions(userId);
perms.ui_mappings.routes;     // ['/clients', '/dashboard']
perms.ui_mappings.components; // ['client-list-table', 'export-btn']
perms.ui_mappings.fields;     // ['client-revenue', 'salary']
```

### Three-Layer Permission Model

For SaaS apps, permissions come from three independent sources:

```
Effective = Regular Roles ∪ Subscription Roles ∪ Feature Flags

Regular Roles:    Job-function access (per-user assignment)
Subscription:     Tenant plan features (per-tenant, shared by all users)
Feature Flags:    Gradual rollout capabilities (per-tenant)
```

## Entry Points

| Import | Purpose | Dependencies |
|---|---|---|
| `permx` | Core types, engine, utilities | **Zero** |
| `permx/mongoose` | MongoDB adapter + schema factory | `mongoose` |
| `permx/express` | Express middleware | `express` |

### `permx` — Core (Zero Dependencies)

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
} from 'permx';
```

### `permx/mongoose` — MongoDB Adapter

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
} from 'permx/mongoose';
```

### `permx/express` — Middleware

```typescript
import {
  createPermXMiddleware,
  type PermXMiddleware,
  type PermXMiddlewareConfig,
} from 'permx/express';
```

## Configuration

### Full Configuration Example

```typescript
import { createPermX } from 'permx/mongoose';

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

  // Optional: subscription-based feature flags (SaaS)
  subscriptionResolver: async (tenantId) => {
    const customer = await MyCustomerModel.findById(tenantId);
    return customer?.subscriptionPermissionIds ?? [];
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
import { createPermXMiddleware } from 'permx/express';

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
router.get('/clients', auth.authorize('clients.clients.view.all'), handler);

// Gateway-style API mapping authorization
router.use(auth.authorizeApi('client-hq'));
```

## Building Custom Adapters

PermX's core engine is database-agnostic. To use a different database, implement the `PermXDataProvider` interface:

```typescript
import { createPermXCore, type PermXDataProvider } from 'permx';

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
permx (core — zero deps)
├── types/           8 type definition files
├── engine/          Permission key parser, DFS resolver, circular detector, path matcher
├── cache/           Generic TTL cache
├── errors.ts        Error class hierarchy
└── permx.ts         createPermXCore() factory

permx/mongoose (peer: mongoose)
├── schemas.ts       Schema factory (Better-Auth pattern)
├── data-provider.ts MongooseDataProvider implements PermXDataProvider
├── factory.ts       createPermX() wires schemas + provider + core
└── tenant-plugin.ts Lightweight opt-in tenant isolation

permx/express (peer: express)
└── authorize.ts     createPermXMiddleware() with authorize + authorizeApi
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

# Run TypeScript directly
bun examples/smoke.ts
# or with tsx:
npx tsx examples/smoke.ts
```

## License

MIT
