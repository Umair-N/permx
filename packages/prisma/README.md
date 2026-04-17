# @permx/prisma

[![npm version](https://img.shields.io/npm/v/@permx/prisma.svg)](https://www.npmjs.com/package/@permx/prisma)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7+-blue.svg)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)

Prisma adapter for [**PermX**](https://github.com/Umair-N/permx) — structured RBAC with permission keys, role inheritance, and UI-aware mappings. Works with PostgreSQL, MySQL, SQLite, SQL Server, and MongoDB via Prisma.

```bash
npm install @permx/core @permx/prisma @prisma/client
```

## Setup

### 1. Add PermX models to your Prisma schema

Copy the models from [`prisma/schema.prisma`](./prisma/schema.prisma) into your own `schema.prisma`. They use your existing datasource and generator blocks — no separate database required.

Alternatively, import them at build time:

```bash
# View / copy the reference schema
cat node_modules/@permx/prisma/prisma/schema.prisma
```

The PermX models are:

- `PermXModule` — top-level permission grouping (e.g. "Projects", "Billing")
- `PermXPermission` — the actual permission keys (`module.resource:field.action.scope`)
- `PermXRole` — named roles that group permissions
- `PermXRolePermission` — role ↔ permission M:M
- `PermXRoleInheritance` — role → role parent-child for DFS resolution
- `PermXUserRole` — assigns roles to users (per-tenant when multi-tenant)
- `PermXUserRoleAdditional` / `PermXUserRoleExcluded` — per-user overrides

### 2. Generate the client + run the migration

```bash
npx prisma generate
npx prisma migrate dev --name add-permx
```

### 3. Wire up PermX

```ts
import { PrismaClient } from '@prisma/client';
import { createPermX } from '@permx/prisma';

const prisma = new PrismaClient();

export const permx = createPermX({
  prisma,
  cache: { ttl: 15_000 },
  superAdmin: { check: (userId) => userId === 'admin-id' },
});
```

That's it — `permx.authorize()`, `permx.getUserPermissions()`, `invalidateUser()`, and every other PermX API now work against your Prisma-backed database.

## Seeding your first role

PermX ships idempotent, declarative seed helpers. Safe to run on every app boot:

```ts
import { syncFromConfig } from '@permx/prisma';

await syncFromConfig(prisma, {
  modules: [{ name: 'Projects', slug: 'projects' }],
  permissions: [
    { moduleSlug: 'projects', name: 'View Tasks',   key: 'projects.tasks.view.all' },
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
      inheritsFrom: ['project-viewer'],
    },
  ],
});

// Assign the role to a user (also idempotent)
import { ensureUserRole } from '@permx/prisma';
const role = await prisma.permXRole.findUnique({ where: { slug: 'project-editor' } });
await ensureUserRole(prisma, userId, role!.id);
```

For one-off operations: `upsertModule`, `upsertPermission`, `upsertRole`, `setRolePermissions`, `setRoleInheritance`, `ensureUserRole`.

## Multi-tenancy

Pass a `tenantId` when assigning roles and to `authorize()`:

```ts
await ensureUserRole(prisma, userId, roleId, { tenantId: 'acme' });

const result = await permx.authorize(userId, 'projects.tasks.view.all', {
  tenantId: 'acme',
});
```

The per-user cache is automatically scoped by tenant — a user's `acme` permissions and `globex` permissions are separate cache entries.

## Subscription resolver (SaaS plans)

```ts
const permx = createPermX({
  prisma,
  subscriptionResolver: async (tenantId) => {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { planRoleId: true },
    });
    return tenant?.planRoleId ? [tenant.planRoleId] : [];
  },
});
```

Returns an array of role IDs whose permissions union into the user's effective set. Use it to gate features behind Free / Pro / Enterprise tiers.

## Exports

| Import | Purpose |
|---|---|
| `createPermX` | Factory — returns a `PermXInstance` (all authorize / getUserPermissions / invalidate methods) |
| `PrismaDataProvider` | Advanced — wire up `createPermXCore` yourself |
| `syncFromConfig` | Declarative seeder |
| `upsertModule`, `upsertPermission`, `upsertRole` | Per-entity upserts |
| `setRolePermissions`, `setRoleInheritance` | Replace many-to-many sets |
| `ensureUserRole` | Idempotent role assignment |
| `PrismaClientLike` | Type — the subset of Prisma client methods PermX calls |

## Compatibility

- `@permx/core` >= 0.4.0
- `@prisma/client` >= 5.0.0
- Node.js >= 18

## License

MIT
