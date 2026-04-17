import { describe, it, expect, beforeEach } from 'vitest';
import { createPermXCore } from '../../src/permx.js';
import type { PermXDataProvider } from '../../src/types/data-provider.js';

const ROLE_ID = 'role-1';
const USER_ID = 'user-1';
const PERM_KEY = 'projects.tasks.view.all';

function makeProvider(overrides: Partial<PermXDataProvider> = {}): PermXDataProvider {
  let userRoleCalls = 0;
  const provider: PermXDataProvider & { __userRoleCalls: () => number } = {
    getUserRoles: async () => {
      userRoleCalls++;
      return [
        {
          user_id: USER_ID,
          role: { _id: ROLE_ID, slug: 'viewer', name: 'Viewer', active: true, role_type: 'regular' },
        } as never,
      ];
    },
    getRoleForResolution: async () => ({
      _id: ROLE_ID,
      slug: 'viewer',
      name: 'Viewer',
      permissions: ['perm-1'],
      inherits_from: [],
      active: true,
      role_type: 'regular',
    } as never),
    getPermissionsByIds: async () => [
      { _id: 'perm-1', key: PERM_KEY, module: 'mod-1', name: 'View', ui_mappings: [] } as never,
    ],
    getModulesByIds: async () => [],
    getApiPermissionMap: async () => [],
    ...overrides,
    __userRoleCalls: () => userRoleCalls,
  } as never;
  return provider;
}

describe('Per-user permission cache', () => {
  it('cache hit: second authorize() call does not refetch roles', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.authorize(USER_ID, PERM_KEY);
    await permx.authorize(USER_ID, PERM_KEY);
    await permx.authorize(USER_ID, PERM_KEY);

    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(1);
  });

  it('invalidateUser() forces a fresh fetch on the next authorize()', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.authorize(USER_ID, PERM_KEY);
    permx.invalidateUser(USER_ID);
    await permx.authorize(USER_ID, PERM_KEY);

    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(2);
  });

  it('invalidateUser() only invalidates the target user', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.authorize(USER_ID, PERM_KEY);
    await permx.authorize('user-2', PERM_KEY);
    permx.invalidateUser(USER_ID);

    await permx.authorize(USER_ID, PERM_KEY);  // fresh fetch
    await permx.authorize('user-2', PERM_KEY); // still cached

    // user-1: 2 fetches (initial + post-invalidate), user-2: 1 fetch
    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(3);
  });

  it('invalidateAll() clears both user cache and api-map cache', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.authorize(USER_ID, PERM_KEY);
    await permx.authorize('user-2', PERM_KEY);
    permx.invalidateAll();

    await permx.authorize(USER_ID, PERM_KEY);
    await permx.authorize('user-2', PERM_KEY);

    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(4);
  });

  it('invalidateCache() remains as a deprecated alias for invalidateAll()', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider, { cache: { ttl: 60_000 } });

    await permx.authorize(USER_ID, PERM_KEY);
    permx.invalidateCache();
    await permx.authorize(USER_ID, PERM_KEY);

    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(2);
  });

  it('cache is scoped by tenant', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider, {
      cache: { ttl: 60_000 },
      tenancy: { enabled: true },
    });

    await permx.authorize(USER_ID, PERM_KEY, { tenantId: 'tenant-a' });
    await permx.authorize(USER_ID, PERM_KEY, { tenantId: 'tenant-b' });
    await permx.authorize(USER_ID, PERM_KEY, { tenantId: 'tenant-a' }); // cached

    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(2);
  });

  it('no cache configured: every authorize() fetches fresh', async () => {
    const provider = makeProvider();
    const permx = createPermXCore(provider); // no cache config

    await permx.authorize(USER_ID, PERM_KEY);
    await permx.authorize(USER_ID, PERM_KEY);

    expect((provider as unknown as { __userRoleCalls: () => number }).__userRoleCalls()).toBe(2);
  });
});
