import { describe, it, expect } from 'vitest';
import { getUserEffectivePermissions } from '../../src/engine/permission-resolver.js';
import type { PermXDataProvider } from '../../src/types/data-provider.js';
import type { Permission } from '../../src/types/permission.js';

const makePermission = (id: string, key: string, moduleId: string = 'mod-1', ui: Permission['ui_mappings'] = []): Permission => ({
  _id: id,
  module: moduleId,
  name: key,
  key,
  api_mappings: [],
  ui_mappings: ui,
});

const makeProvider = (overrides: Partial<PermXDataProvider> = {}): PermXDataProvider => ({
  getUserRoles: async () => [],
  getRoleForResolution: async () => null,
  getPermissionsByIds: async () => [],
  getModulesByIds: async () => [],
  getApiPermissionMap: async () => [],
  ...overrides,
});

describe('getUserEffectivePermissions', () => {
  it('returns empty permissions for user with no roles', async () => {
    const provider = makeProvider();
    const result = await getUserEffectivePermissions('user-1', provider);
    expect(result.permissions).toEqual([]);
    expect(result.ui_mappings.routes).toEqual([]);
    expect(result.modules).toEqual([]);
  });

  it('resolves permissions from a single role', async () => {
    const perms = [
      makePermission('p1', 'clients.view.all', 'mod-1', [
        { type: 'route', identifier: '/clients' },
        { type: 'component', identifier: 'client-list' },
      ]),
      makePermission('p2', 'clients.create.all', 'mod-1', [
        { type: 'component', identifier: 'create-client-btn' },
      ]),
    ];

    const provider = makeProvider({
      getUserRoles: async () => [
        {
          _id: 'ur-1',
          user_id: 'user-1',
          role: {
            _id: 'role-1',
            role_type: 'regular',
            permissions: [{ _id: 'p1', key: '' }, { _id: 'p2', key: '' }],
            inherits_from: [],
          },
          assigned_at: new Date(),
          excluded_permissions: [],
          additional_permissions: [],
        },
      ],
      getRoleForResolution: async (id) => {
        if (id === 'role-1') return {
          permissions: [{ _id: 'p1' }, { _id: 'p2' }],
          inherits_from: [],
        };
        return null;
      },
      getPermissionsByIds: async (ids) => perms.filter((p) => ids.includes(p._id)),
      getModulesByIds: async () => [
        { _id: 'mod-1', name: 'Clients', slug: 'clients', sort_order: 0, active: true },
      ],
    });

    const result = await getUserEffectivePermissions('user-1', provider);
    expect(result.permissions).toEqual(['clients.view.all', 'clients.create.all']);
    expect(result.ui_mappings.routes).toEqual(['/clients']);
    expect(result.ui_mappings.components).toEqual(['client-list', 'create-client-btn']);
    expect(result.modules).toHaveLength(1);
  });

  it('applies excluded_permissions', async () => {
    const perms = [
      makePermission('p1', 'clients.view.all'),
      makePermission('p2', 'clients.delete.all'),
    ];

    const provider = makeProvider({
      getUserRoles: async () => [
        {
          _id: 'ur-1',
          user_id: 'user-1',
          role: {
            _id: 'role-1',
            role_type: 'regular',
            permissions: [{ _id: 'p1', key: '' }, { _id: 'p2', key: '' }],
            inherits_from: [],
          },
          assigned_at: new Date(),
          excluded_permissions: ['clients.delete.all'],
          additional_permissions: [],
        },
      ],
      getRoleForResolution: async () => ({
        permissions: [{ _id: 'p1' }, { _id: 'p2' }],
        inherits_from: [],
      }),
      getPermissionsByIds: async (ids) => perms.filter((p) => ids.includes(p._id)),
      getModulesByIds: async () => [
        { _id: 'mod-1', name: 'Clients', slug: 'clients', sort_order: 0, active: true },
      ],
    });

    const result = await getUserEffectivePermissions('user-1', provider);
    expect(result.permissions).toEqual(['clients.view.all']);
    expect(result.permissions).not.toContain('clients.delete.all');
  });

  it('merges subscription permissions via resolver', async () => {
    const perms = [
      makePermission('p1', 'clients.view.all'),
      makePermission('p-sub', 'subscription.sso'),
    ];

    const provider = makeProvider({
      getUserRoles: async () => [
        {
          _id: 'ur-1',
          user_id: 'user-1',
          role: {
            _id: 'role-1',
            role_type: 'regular',
            permissions: [{ _id: 'p1', key: '' }],
            inherits_from: [],
          },
          assigned_at: new Date(),
          excluded_permissions: [],
          additional_permissions: [],
        },
      ],
      getRoleForResolution: async () => ({
        permissions: [{ _id: 'p1' }],
        inherits_from: [],
      }),
      getPermissionsByIds: async (ids) => perms.filter((p) => ids.includes(p._id)),
      getModulesByIds: async () => [],
    });

    const subscriptionResolver = async () => ['p-sub'];

    const result = await getUserEffectivePermissions('user-1', provider, subscriptionResolver, 'tenant-1');
    expect(result.permissions).toContain('clients.view.all');
    expect(result.permissions).toContain('subscription.sso');
  });

  it('includes additional_permissions', async () => {
    const perms = [
      makePermission('p1', 'clients.view.all'),
      makePermission('p-extra', 'clients.manage.all'),
    ];

    const provider = makeProvider({
      getUserRoles: async () => [
        {
          _id: 'ur-1',
          user_id: 'user-1',
          role: {
            _id: 'role-1',
            role_type: 'regular',
            permissions: [{ _id: 'p1', key: '' }],
            inherits_from: [],
          },
          assigned_at: new Date(),
          excluded_permissions: [],
          additional_permissions: ['p-extra'],
        },
      ],
      getRoleForResolution: async () => ({
        permissions: [{ _id: 'p1' }],
        inherits_from: [],
      }),
      getPermissionsByIds: async (ids) => perms.filter((p) => ids.includes(p._id)),
      getModulesByIds: async () => [],
    });

    const result = await getUserEffectivePermissions('user-1', provider);
    expect(result.permissions).toContain('clients.view.all');
    expect(result.permissions).toContain('clients.manage.all');
  });

  it('deduplicates UI mappings', async () => {
    const perms = [
      makePermission('p1', 'clients.view.all', 'mod-1', [{ type: 'route', identifier: '/clients' }]),
      makePermission('p2', 'clients.create.all', 'mod-1', [{ type: 'route', identifier: '/clients' }]),
    ];

    const provider = makeProvider({
      getUserRoles: async () => [
        {
          _id: 'ur-1',
          user_id: 'user-1',
          role: {
            _id: 'role-1',
            role_type: 'regular',
            permissions: [{ _id: 'p1', key: '' }, { _id: 'p2', key: '' }],
            inherits_from: [],
          },
          assigned_at: new Date(),
          excluded_permissions: [],
          additional_permissions: [],
        },
      ],
      getRoleForResolution: async () => ({
        permissions: [{ _id: 'p1' }, { _id: 'p2' }],
        inherits_from: [],
      }),
      getPermissionsByIds: async (ids) => perms.filter((p) => ids.includes(p._id)),
      getModulesByIds: async () => [],
    });

    const result = await getUserEffectivePermissions('user-1', provider);
    expect(result.ui_mappings.routes).toEqual(['/clients']);
  });

  it('skips subscription role assignments in regular processing', async () => {
    const provider = makeProvider({
      getUserRoles: async () => [
        {
          _id: 'ur-1',
          user_id: 'user-1',
          role: {
            _id: 'role-sub',
            role_type: 'subscription',
            permissions: [{ _id: 'p-sub', key: '' }],
            inherits_from: [],
          },
          assigned_at: new Date(),
          excluded_permissions: [],
          additional_permissions: [],
        },
      ],
      getRoleForResolution: async () => null,
      getPermissionsByIds: async () => [],
      getModulesByIds: async () => [],
    });

    const result = await getUserEffectivePermissions('user-1', provider);
    expect(result.permissions).toEqual([]);
  });
});
