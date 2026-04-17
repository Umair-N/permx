import { describe, it, expect, vi } from 'vitest';
import { PermissionStore, createPermissionStore } from '../src/store.js';
import type { EffectivePermissions } from '@permx/core';

function makePermissions(
  overrides: Partial<EffectivePermissions> = {},
): EffectivePermissions {
  return {
    permissions: ['clients.view.all', 'invoices.create.own'],
    structured_permissions: [],
    ui_mappings: {
      routes: ['/dashboard', '/clients'],
      components: ['client-table', 'sidebar-nav'],
      fields: ['client-email', 'client-phone'],
    },
    modules: [
      {
        _id: 'm1',
        name: 'Clients',
        slug: 'clients',
        sort_order: 1,
        active: true,
      },
    ],
    ...overrides,
  };
}

describe('createPermissionStore', () => {
  it('returns a PermissionStore instance', () => {
    const store = createPermissionStore();
    expect(store).toBeInstanceOf(PermissionStore);
  });
});

describe('PermissionStore initial state', () => {
  it('starts with is_ready false, is_super_admin false, empty sets, raw null', () => {
    const store = createPermissionStore();
    const snap = store.getSnapshot();

    expect(snap.is_ready).toBe(false);
    expect(snap.is_super_admin).toBe(false);
    expect(snap.permissions.size).toBe(0);
    expect(snap.routes.size).toBe(0);
    expect(snap.components.size).toBe(0);
    expect(snap.fields.size).toBe(0);
    expect(snap.modules).toEqual([]);
    expect(snap.raw).toBeNull();
  });
});

describe('PermissionStore.hydrate', () => {
  it('populates permissions Set from permissions array', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions());
    const snap = store.getSnapshot();

    expect(snap.permissions.has('clients.view.all')).toBe(true);
    expect(snap.permissions.has('invoices.create.own')).toBe(true);
    expect(snap.permissions.size).toBe(2);
  });

  it('populates routes, components, fields Sets from ui_mappings', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions());
    const snap = store.getSnapshot();

    expect(snap.routes.has('/dashboard')).toBe(true);
    expect(snap.routes.has('/clients')).toBe(true);
    expect(snap.components.has('client-table')).toBe(true);
    expect(snap.components.has('sidebar-nav')).toBe(true);
    expect(snap.fields.has('client-email')).toBe(true);
    expect(snap.fields.has('client-phone')).toBe(true);
  });

  it('stores modules array', () => {
    const store = createPermissionStore();
    const data = makePermissions();
    store.hydrate(data);

    expect(store.getSnapshot().modules).toEqual(data.modules);
  });

  it('stores raw EffectivePermissions', () => {
    const store = createPermissionStore();
    const data = makePermissions();
    store.hydrate(data);

    expect(store.getSnapshot().raw).toBe(data);
  });

  it('sets is_ready to true', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions());

    expect(store.getSnapshot().is_ready).toBe(true);
  });

  it('sets is_super_admin to true when second arg is true', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions(), true);

    expect(store.getSnapshot().is_super_admin).toBe(true);
  });
});

describe('PermissionStore.hasPermission', () => {
  it('returns true for existing key, false for missing key', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions());

    expect(store.hasPermission('clients.view.all')).toBe(true);
    expect(store.hasPermission('nonexistent.key')).toBe(false);
  });

  it('returns true for any key when super admin', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions({ permissions: [] }), true);

    expect(store.hasPermission('literally.anything')).toBe(true);
    expect(store.hasPermission('never.defined')).toBe(true);
  });
});

describe('PermissionStore.hasRoute', () => {
  it('follows super-admin + lookup pattern', () => {
    const normal = createPermissionStore();
    normal.hydrate(makePermissions());
    expect(normal.hasRoute('/dashboard')).toBe(true);
    expect(normal.hasRoute('/missing')).toBe(false);

    const admin = createPermissionStore();
    admin.hydrate(makePermissions({ ui_mappings: { routes: [], components: [], fields: [] } }), true);
    expect(admin.hasRoute('/anything')).toBe(true);
  });
});

describe('PermissionStore.hasComponent', () => {
  it('follows super-admin + lookup pattern', () => {
    const normal = createPermissionStore();
    normal.hydrate(makePermissions());
    expect(normal.hasComponent('client-table')).toBe(true);
    expect(normal.hasComponent('missing-component')).toBe(false);

    const admin = createPermissionStore();
    admin.hydrate(makePermissions({ ui_mappings: { routes: [], components: [], fields: [] } }), true);
    expect(admin.hasComponent('any-component')).toBe(true);
  });
});

describe('PermissionStore.hasField', () => {
  it('follows super-admin + lookup pattern', () => {
    const normal = createPermissionStore();
    normal.hydrate(makePermissions());
    expect(normal.hasField('client-email')).toBe(true);
    expect(normal.hasField('missing-field')).toBe(false);

    const admin = createPermissionStore();
    admin.hydrate(makePermissions({ ui_mappings: { routes: [], components: [], fields: [] } }), true);
    expect(admin.hasField('any-field')).toBe(true);
  });
});

describe('PermissionStore.clear', () => {
  it('resets state to initial', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions(), true);
    store.clear();

    const snap = store.getSnapshot();
    expect(snap.is_ready).toBe(false);
    expect(snap.is_super_admin).toBe(false);
    expect(snap.permissions.size).toBe(0);
    expect(snap.routes.size).toBe(0);
    expect(snap.components.size).toBe(0);
    expect(snap.fields.size).toBe(0);
    expect(snap.modules).toEqual([]);
    expect(snap.raw).toBeNull();
  });
});

describe('PermissionStore.subscribe', () => {
  it('calls listener after hydrate', () => {
    const store = createPermissionStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.hydrate(makePermissions());

    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('returns unsubscribe function that removes listener', () => {
    const store = createPermissionStore();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.hydrate(makePermissions());

    expect(listener).not.toHaveBeenCalled();
  });
});

describe('PermissionStore re-hydration', () => {
  it('replaces previous state entirely', () => {
    const store = createPermissionStore();
    store.hydrate(makePermissions());

    const next = makePermissions({
      permissions: ['only.this.one'],
      ui_mappings: {
        routes: ['/only-route'],
        components: ['only-component'],
        fields: ['only-field'],
      },
      modules: [],
    });
    store.hydrate(next);

    const snap = store.getSnapshot();
    expect(snap.permissions.size).toBe(1);
    expect(snap.permissions.has('only.this.one')).toBe(true);
    expect(snap.permissions.has('clients.view.all')).toBe(false);
    expect(snap.routes.size).toBe(1);
    expect(snap.routes.has('/only-route')).toBe(true);
    expect(snap.components.size).toBe(1);
    expect(snap.fields.size).toBe(1);
    expect(snap.modules).toEqual([]);
  });
});
