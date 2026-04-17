# @permx/react

React SDK for [PermX](https://www.npmjs.com/package/@permx/core) — headless components, hooks, and a zero-dependency store for permission gating.

```bash
npm install @permx/core @permx/react
```

## Why @permx/react?

The backend decides *what* a user can do. `@permx/react` makes it trivial to gate UI on those decisions without hardcoding roles in every component.

| Feature | Details |
|---------|---------|
| Zero runtime dependencies | Built on React's `useSyncExternalStore` — no zustand, no redux |
| Tiny | ~5 KB minified, tree-shakeable |
| Headless | No CSS, no styling opinions — you ship the look |
| React 18 & 19 | Works with both |
| SSR-friendly | Fetches client-side, renders fallback during SSR |
| Super admin bypass | One flag, every gate opens |

## Quick start (60 seconds)

### 1. Wrap your app

```tsx
import { PermXProvider } from '@permx/react';

function App() {
  return (
    <PermXProvider
      fetchPermissions={() => fetch('/api/permissions/my').then((r) => r.json())}
      superAdmin={user.role === 'super-admin'}
      fallback={<Spinner />}
    >
      <Routes />
    </PermXProvider>
  );
}
```

The `fetchPermissions` callback returns the `EffectivePermissions` shape from `@permx/core` — typically the output of `permx.getUserPermissions(userId)` on the server.

### 2. Gate components, fields, and routes

```tsx
import { Can, CanField, RouteGuard, FeatureGate } from '@permx/react';

// Component-level gate (hides button if not allowed)
<Can componentId="edit-client-btn">
  <EditButton />
</Can>

// Field-level gate (hides form field)
<CanField fieldId="salary" fallback={<RedactedField />}>
  <SalaryInput />
</CanField>

// Route-level gate (pair with router redirect)
<RouteGuard routeId="/admin" fallback={<NoAccess />}>
  <AdminPage />
</RouteGuard>

// Feature gate with upgrade prompt overlay
<FeatureGate
  permission="subscription.sso"
  renderOverlay={() => <UpgradeBanner plan="pro" />}
>
  <SSOSettings />
</FeatureGate>
```

### 3. Use hooks for programmatic checks

```tsx
import { useHasPermission, useHasRoute, usePermXReady } from '@permx/react';

function Toolbar() {
  const ready = usePermXReady();
  const canEdit = useHasPermission('clients.edit.all');
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

## API reference

### `<PermXProvider>`

Provides the permission store to descendants. Fetches permissions once on mount.

| Prop | Type | Description |
|------|------|-------------|
| `fetchPermissions` | `() => Promise<EffectivePermissions>` | Required. Called on mount to load permissions. |
| `superAdmin` | `boolean` | When `true`, all permission checks return `true`. |
| `fallback` | `ReactNode` | Rendered until the initial fetch resolves. |
| `onError` | `(error: Error) => void` | Called if `fetchPermissions` rejects. |

### Components

Each gate renders `children` when allowed, `fallback` (default `null`) when denied. Super admins see everything.

| Component | Prop | Checks against |
|-----------|------|----------------|
| `<Can>` | `componentId` | `ui_mappings.components` |
| `<CanField>` | `fieldId` | `ui_mappings.fields` |
| `<RouteGuard>` | `routeId` | `ui_mappings.routes` |
| `<FeatureGate>` | `permission` | `permissions` (raw key) |

`<FeatureGate>` additionally supports `renderOverlay={() => ReactNode}` for the upgrade-prompt pattern — when denied with `renderOverlay`, both children and overlay render together.

### Hooks

All hooks must be used inside `<PermXProvider>` or they throw.

| Hook | Returns | Description |
|------|---------|-------------|
| `useHasPermission(key)` | `boolean` | O(1) permission key check |
| `useHasRoute(id)` | `boolean` | Is route in `ui_mappings.routes`? |
| `useHasComponent(id)` | `boolean` | Is component in `ui_mappings.components`? |
| `useHasField(id)` | `boolean` | Is field in `ui_mappings.fields`? |
| `usePermissions()` | `EffectivePermissions` | Full raw payload from last fetch |
| `usePermXReady()` | `boolean` | Has the initial fetch resolved? |

All `useHas*` hooks respect super admin bypass.

### Advanced: `createPermissionStore()`

Exposes the underlying store class for custom providers, testing, or SSR hydration:

```tsx
import { createPermissionStore } from '@permx/react';

const store = createPermissionStore();
store.hydrate(permissionsData, /* superAdmin */ false);
store.hasPermission('clients.view.all'); // true
```

## Patterns

### Refetching permissions after role change

Pass a new `fetchPermissions` reference (e.g. via `useCallback` with a token dependency) to trigger a refetch:

```tsx
const fetchPermissions = useCallback(
  () => fetch('/api/permissions/my', { headers: { Authorization: `Bearer ${token}` } })
    .then((r) => r.json()),
  [token],
);

<PermXProvider fetchPermissions={fetchPermissions}>...</PermXProvider>
```

### Router-agnostic redirect on deny

`<RouteGuard>` is router-agnostic — pair it with your router of choice:

```tsx
// React Router v6
function ProtectedRoute({ routeId, children }) {
  const navigate = useNavigate();
  return (
    <RouteGuard
      routeId={routeId}
      fallback={<Navigate to="/no-access" replace />}
    >
      {children}
    </RouteGuard>
  );
}
```

### Disabled form fields vs. hidden

Often you want to disable rather than hide a field. Use the hook for this:

```tsx
function SalaryInput() {
  const canEdit = useHasField('salary');
  return <input name="salary" disabled={!canEdit} />;
}
```

## Requirements

- React 18 or 19
- `@permx/core` ≥ 0.3.0

## License

MIT
