import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPermXCore } from '../../src/permx.js';
import { definePermissions } from '../../src/engine/typed-keys.js';
import type { PermXDataProvider } from '../../src/types/data-provider.js';

const makeProvider = (): PermXDataProvider => ({
  getUserRoles: async () => [],
  getRoleForResolution: async () => null,
  getPermissionsByIds: async () => [],
  getModulesByIds: async () => [],
  getApiPermissionMap: async () => [],
});

describe('dev.knownKeys typo warning', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

  afterEach(() => {
    warn.mockClear();
  });

  it('warns once when authorize() is called with an unknown key', async () => {
    const P = definePermissions({
      viewTasks: { module: 'projects', resource: 'tasks', action: 'view', scope: 'all' },
    } as const);

    const permx = createPermXCore(makeProvider(), {
      dev: { knownKeys: Object.values(P) },
    });

    await permx.authorize('user-1', 'projects.tasks.view.typo');

    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/unknown permission key 'projects.tasks.view.typo'/);
  });

  it('does not warn for known keys', async () => {
    const permx = createPermXCore(makeProvider(), {
      dev: { knownKeys: ['projects.tasks.view.all'] },
    });

    await permx.authorize('user-1', 'projects.tasks.view.all');

    expect(warn).not.toHaveBeenCalled();
  });

  it('deduplicates warnings per key', async () => {
    const permx = createPermXCore(makeProvider(), {
      dev: { knownKeys: ['known.key.view.all'] },
    });

    await permx.authorize('user-1', 'typo.one.view.all');
    await permx.authorize('user-1', 'typo.one.view.all');
    await permx.authorize('user-1', 'typo.one.view.all');
    await permx.authorize('user-1', 'typo.two.view.all');

    expect(warn).toHaveBeenCalledTimes(2);
  });

  it('is silent when dev.knownKeys is not configured', async () => {
    const permx = createPermXCore(makeProvider());

    await permx.authorize('user-1', 'anything.goes.view.all');

    expect(warn).not.toHaveBeenCalled();
  });
});
