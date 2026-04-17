import { describe, it, expect } from 'vitest';
import { createPermXCore } from '../../src/permx.js';
import type { PermXDataProvider } from '../../src/types/data-provider.js';
import { ValidationError, DataProviderError, RoleNotFoundError } from '../../src/errors.js';

const makeProvider = (overrides: Partial<PermXDataProvider> = {}): PermXDataProvider => ({
  getUserRoles: async () => [],
  getRoleForResolution: async () => null,
  getPermissionsByIds: async () => [],
  getModulesByIds: async () => [],
  getApiPermissionMap: async () => [],
  ...overrides,
});

describe('createPermXCore', () => {
  it('creates an instance with all methods', () => {
    const permx = createPermXCore(makeProvider());
    expect(permx.authorize).toBeDefined();
    expect(permx.authorizeApi).toBeDefined();
    expect(permx.getUserPermissions).toBeDefined();
    expect(permx.getApiMap).toBeDefined();
    expect(permx.invalidateCache).toBeDefined();
  });

  it('denies access for user with no permissions', async () => {
    const permx = createPermXCore(makeProvider());
    const result = await permx.authorize('user-1', 'clients.view.all');
    expect(result.authorized).toBe(false);
  });

  it('grants access when superAdmin check returns true', async () => {
    const permx = createPermXCore(makeProvider(), {
      superAdmin: { check: () => true },
    });

    const result = await permx.authorize('admin', 'anything.any.any');
    expect(result.authorized).toBe(true);
  });

  it('authorizeApi returns false when no mapping found', async () => {
    const permx = createPermXCore(makeProvider());
    const result = await permx.authorizeApi('user-1', 'client-hq', 'GET', '/unknown');
    expect(result.authorized).toBe(false);
  });

  it('authorizeApi matches and checks permission', async () => {
    const provider = makeProvider({
      getApiPermissionMap: async () => [
        { service: 'client-hq', method: 'GET', path: '/clients/:id', key: 'clients.view.all' },
      ],
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
      getPermissionsByIds: async () => [
        {
          _id: 'p1',
          module: 'mod-1',
          name: 'View Clients',
          key: 'clients.view.all',
          api_mappings: [],
          ui_mappings: [],
        },
      ],
      getModulesByIds: async () => [],
    });

    const permx = createPermXCore(provider, { cache: { ttl: 5000 } });
    const result = await permx.authorizeApi('user-1', 'client-hq', 'GET', '/clients/123');
    expect(result.authorized).toBe(true);
    expect(result.matched_key).toBe('clients.view.all');
  });

  it('caches API map', async () => {
    let callCount = 0;
    const provider = makeProvider({
      getApiPermissionMap: async () => {
        callCount++;
        return [{ service: 'svc', method: 'GET', path: '/', key: 'test' }];
      },
    });

    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.getApiMap();
    await permx.getApiMap();
    await permx.getApiMap();

    expect(callCount).toBe(1);
  });

  it('invalidateCache clears cached data', async () => {
    let callCount = 0;
    const provider = makeProvider({
      getApiPermissionMap: async () => {
        callCount++;
        return [];
      },
    });

    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.getApiMap();
    expect(callCount).toBe(1);

    permx.invalidateCache();
    await permx.getApiMap();
    expect(callCount).toBe(2);
  });

  describe('input validation', () => {
    it('rejects empty userId with ValidationError', async () => {
      const permx = createPermXCore(makeProvider());

      await expect(permx.authorize('', 'clients.view.all')).rejects.toThrow(ValidationError);
      await expect(permx.authorize('', 'clients.view.all')).rejects.toMatchObject({
        field: 'userId',
      });
    });

    it('rejects malformed permissionKey with ValidationError', async () => {
      const permx = createPermXCore(makeProvider());

      await expect(permx.authorize('user-1', 'INVALID')).rejects.toThrow(ValidationError);
    });

    it('wraps provider errors in DataProviderError', async () => {
      const provider = makeProvider({
        getUserRoles: async () => {
          throw new Error('db failed');
        },
      });
      const permx = createPermXCore(provider);

      await expect(permx.authorize('user-1', 'clients.view.all')).rejects.toThrow(DataProviderError);
      await expect(permx.authorize('user-1', 'clients.view.all')).rejects.toMatchObject({
        cause: expect.objectContaining({ message: 'db failed' }),
      });
    });

    it('preserves PermXError subclasses (no double-wrap)', async () => {
      const provider = makeProvider({
        getUserRoles: async () => {
          throw new RoleNotFoundError('role-999');
        },
      });
      const permx = createPermXCore(provider);

      await expect(permx.authorize('user-1', 'clients.view.all')).rejects.toThrow(RoleNotFoundError);
    });
  });
});
