# PermX React Demo

A complete runnable reference app showing [`@permx/core`](https://www.npmjs.com/package/@permx/core) + [`@permx/react`](https://www.npmjs.com/package/@permx/react) working together.

**What you'll see:** a seeded RBAC backend with three roles (Viewer / Editor / Admin) and a React UI that demonstrates all four gate components, every hook, super-admin bypass, error fallbacks, and live protected API calls. Switch users from the dropdown and watch every gate flip in real-time.

<img width="100%" alt="permx react demo" src="./screenshot.png" />

## What's inside

```
examples/react-demo/
├── server/                          ← Express + Mongoose + @permx/core
│   └── src/
│       ├── index.ts                 Express app + middleware + protected routes
│       └── permx-instance.ts        mongodb-memory-server + seeded data
└── client/                          ← Vite + React + @permx/react
    └── src/
        ├── App.tsx                  PermXProvider wiring
        ├── Dashboard.tsx            All 4 gates + hooks in action
        ├── ProtectedApiPanel.tsx    Live calls to the protected routes
        ├── UserSwitcher.tsx         Role-switch dropdown
        └── api.ts                   Fetch helper (sends x-user-id)
```

**No MongoDB install required** — the server boots an in-memory MongoDB via `mongodb-memory-server`.

## Run it

Two terminals:

### Terminal 1 — backend

```bash
cd examples/react-demo/server
npm install
npm run dev
```

Server starts on `http://localhost:3001` with seeded modules, permissions, roles, and three demo users.

### Terminal 2 — frontend

```bash
cd examples/react-demo/client
npm install
npm run dev
```

Open **http://localhost:5173**. Vite proxies `/api/*` to the backend automatically.

## The demo users

| User | Role | Inherits | Can do |
|------|------|----------|--------|
| Alice | Viewer | — | View projects, view invoices |
| Bob | Editor | Viewer | + Create/edit projects |
| Carol | Admin | Editor | + See revenue field, access admin panel, see SSO settings |
| Dana | Super Admin | bypass | Everything (flag-based bypass in PermX config) |

Switch users in the header and every gate updates on the next fetch.

## What each section demonstrates

1. **Component gate** (`<Can>`) — hides buttons based on `ui_mappings.components`
2. **Field gate** (`<CanField>`) — redacts sensitive form fields based on `ui_mappings.fields`
3. **Route gate** (`<RouteGuard>`) — shows/hides whole page regions based on `ui_mappings.routes`
4. **Feature gate** (`<FeatureGate>`) — classic upgrade-CTA pattern with overlay
5. **Hooks** — `usePermXReady`, `useHasPermission`, `useHasRoute` for programmatic checks
6. **Live backend** — hit protected Express routes; the backend enforces the same permissions on the server
7. **Raw payload** — see exactly what `/api/permissions/my` returned

## Key wiring to notice

### Backend: one endpoint feeds the React SDK

```ts
// server/src/index.ts
app.get('/api/permissions/my', async (req, res) => {
  const userId = req.header('x-user-id');
  const perms = await permx.getUserPermissions(userId);
  res.json(perms);
});
```

### Frontend: one provider powers every gate

```tsx
// client/src/App.tsx
<PermXProvider
  fetchPermissions={() => fetch('/api/permissions/my').then(r => r.json())}
  superAdmin={user.id === 'super-admin'}
  fallback={<Spinner />}
  errorFallback={(error, retry) => <ErrorScreen error={error} onRetry={retry} />}
>
  <App />
</PermXProvider>
```

### Seed: declarative + idempotent

```ts
// server/src/permx-instance.ts
await syncFromConfig(permx.models, {
  modules:     [{ name: 'Projects', slug: 'projects' }, ...],
  permissions: [{ moduleSlug: 'projects', key: 'projects.tasks.view.all', ... }, ...],
  roles:       [{ slug: 'editor', inheritsFrom: ['viewer'], permissionKeys: [...] }],
});
```

## License

MIT — use this as a starting point for your own apps.
