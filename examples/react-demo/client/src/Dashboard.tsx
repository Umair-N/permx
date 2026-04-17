import {
  Can,
  CanField,
  RouteGuard,
  FeatureGate,
  useHasPermission,
  useHasRoute,
  usePermissions,
  usePermXReady,
} from '@permx/react';
import type { DemoUser } from './UserSwitcher.tsx';
import { ProtectedApiPanel } from './ProtectedApiPanel.tsx';

interface DashboardProps {
  currentUser: DemoUser;
}

export function Dashboard({ currentUser }: DashboardProps) {
  const ready = usePermXReady();
  const perms = usePermissions();
  const canViewAdmin = useHasRoute('/admin');
  const canEdit = useHasPermission('projects.tasks.update.all');

  if (!ready) return <div className="loading">Loading…</div>;

  return (
    <main className="dashboard">
      <section className="section">
        <h2>1. Component gate — <code>&lt;Can&gt;</code></h2>
        <p className="note">
          Renders children only if the component id is in{' '}
          <code>ui_mappings.components</code>.
        </p>
        <div className="demo-row">
          <Can
            componentId="create-project-btn"
            fallback={<span className="muted">— create-project-btn hidden —</span>}
          >
            <button>+ Create project</button>
          </Can>
          <Can
            componentId="edit-project-btn"
            fallback={<span className="muted">— edit-project-btn hidden —</span>}
          >
            <button>✎ Edit project</button>
          </Can>
        </div>
      </section>

      <section className="section">
        <h2>2. Field gate — <code>&lt;CanField&gt;</code></h2>
        <p className="note">
          Hides sensitive form fields based on <code>ui_mappings.fields</code>.
        </p>
        <form className="demo-form">
          <label>
            Customer
            <input type="text" defaultValue="Acme Co" readOnly />
          </label>
          <CanField
            fieldId="revenue"
            fallback={
              <label>
                Revenue
                <input type="text" value="***REDACTED***" readOnly />
              </label>
            }
          >
            <label>
              Revenue
              <input type="text" defaultValue="$124,000" readOnly />
            </label>
          </CanField>
        </form>
      </section>

      <section className="section">
        <h2>3. Route gate — <code>&lt;RouteGuard&gt;</code></h2>
        <p className="note">
          Router-agnostic route gate keyed on <code>ui_mappings.routes</code>.
        </p>
        <RouteGuard
          routeId="/admin"
          fallback={
            <div className="no-access">
              🔒 Admin route not available for <strong>{currentUser.label}</strong>
            </div>
          }
        >
          <div className="admin-panel">
            <h3>Admin panel</h3>
            <p>Only visible to users whose permissions map <code>/admin</code>.</p>
          </div>
        </RouteGuard>
      </section>

      <section className="section">
        <h2>4. Feature gate — <code>&lt;FeatureGate&gt;</code></h2>
        <p className="note">
          Keyed on a permission key. When denied, renders children plus an
          overlay — the classic upgrade-CTA pattern.
        </p>
        <FeatureGate
          permission="subscription.sso.view.all"
          renderOverlay={() => (
            <div className="overlay">
              🔐 SSO requires the <strong>Enterprise</strong> plan.{' '}
              <a href="#upgrade">Upgrade →</a>
            </div>
          )}
        >
          <div className="feature-card">
            <h3>Single Sign-On</h3>
            <p>Configure SAML, OIDC, and SCIM for your workspace.</p>
          </div>
        </FeatureGate>
      </section>

      <section className="section">
        <h2>5. Hooks — programmatic checks</h2>
        <p className="note">
          Use hooks for conditional logic that doesn't fit a gate component.
        </p>
        <div className="hook-output">
          <div>
            <strong>usePermXReady():</strong> {ready ? '✅ true' : '⏳ false'}
          </div>
          <div>
            <strong>useHasPermission('projects.tasks.update.all'):</strong>{' '}
            {canEdit ? '✅ allowed' : '❌ denied'}
          </div>
          <div>
            <strong>useHasRoute('/admin'):</strong>{' '}
            {canViewAdmin ? '✅ allowed' : '❌ denied'}
          </div>
        </div>
      </section>

      <section className="section">
        <h2>6. Live backend calls</h2>
        <p className="note">
          The gates are frontend hints — the backend enforces authorization on
          each request. Try these endpoints with the selected user:
        </p>
        <ProtectedApiPanel currentUser={currentUser} />
      </section>

      <section className="section">
        <h2>7. Raw payload — <code>usePermissions()</code></h2>
        <p className="note">
          What the React SDK received from <code>/api/permissions/my</code>:
        </p>
        <pre className="payload">{JSON.stringify(perms, null, 2)}</pre>
      </section>
    </main>
  );
}
