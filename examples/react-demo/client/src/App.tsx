import { useCallback, useMemo, useState } from 'react';
import { PermXProvider } from '@permx/react';
import { UserSwitcher, type DemoUser, DEMO_USERS } from './UserSwitcher.tsx';
import { Dashboard } from './Dashboard.tsx';
import { createFetchPermissions } from './api.ts';

export function App() {
  const [currentUser, setCurrentUser] = useState<DemoUser>(DEMO_USERS[0]!);

  // Stable reference across renders for the same user; changes on user switch,
  // which triggers PermXProvider to refetch.
  const fetchPermissions = useCallback(
    createFetchPermissions(() => currentUser.id),
    [currentUser.id],
  );

  // Remounting via `key` guarantees a fresh store per user so the fallback
  // shows briefly and we see loading → ready transitions per switch.
  const providerKey = currentUser.id;

  const isSuperAdmin = useMemo(() => currentUser.id === 'super-admin', [currentUser.id]);

  return (
    <div className="layout">
      <header className="header">
        <div>
          <h1>PermX React Demo</h1>
          <p className="subtitle">
            Backend: Express + MongoDB-Memory + <code>@permx/core</code> &nbsp;·&nbsp;
            Frontend: React + <code>@permx/react</code>
          </p>
        </div>
        <UserSwitcher current={currentUser} onChange={setCurrentUser} />
      </header>

      <PermXProvider
        key={providerKey}
        fetchPermissions={fetchPermissions}
        superAdmin={isSuperAdmin}
        fallback={<div className="loading">Loading permissions…</div>}
        onError={(err) => console.error('permissions fetch failed', err)}
      >
        <Dashboard currentUser={currentUser} />
      </PermXProvider>
    </div>
  );
}
