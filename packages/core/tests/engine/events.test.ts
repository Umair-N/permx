import { describe, it, expect, vi } from 'vitest';
import { createPermXCore } from '../../src/permx.js';
import { PermXEmitter } from '../../src/events.js';
import type { PermXDataProvider } from '../../src/types/data-provider.js';
import type { PermXInstance } from '../../src/permx.js';

const flushMicrotasks = () => new Promise(resolve => setTimeout(resolve, 0));

const makeProvider = (overrides: Partial<PermXDataProvider> = {}): PermXDataProvider => ({
  getUserRoles: async () => [],
  getRoleForResolution: async () => null,
  getPermissionsByIds: async () => [],
  getModulesByIds: async () => [],
  getApiPermissionMap: async () => [],
  ...overrides,
});

describe('Event emitter integration', () => {
  it('emits authorize event on successful check', async () => {
    const permx = createPermXCore(makeProvider());
    const events: unknown[] = [];

    permx.emitter!.on('authorize', (payload) => {
      events.push(payload);
    });

    await permx.authorize('user-1', 'clients.view.all');
    await flushMicrotasks();

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      userId: 'user-1',
      permissionKey: 'clients.view.all',
      authorized: false,
    });
    expect(events[0]).toHaveProperty('duration_ms');
  });

  it('emits authorize.denied when access denied', async () => {
    const permx = createPermXCore(makeProvider());
    const denied: unknown[] = [];

    permx.emitter!.on('authorize.denied', (payload) => {
      denied.push(payload);
    });

    await permx.authorize('user-1', 'clients.view.all');
    await flushMicrotasks();

    expect(denied).toHaveLength(1);
    expect(denied[0]).toMatchObject({
      userId: 'user-1',
      permissionKey: 'clients.view.all',
    });
  });

  it('emits authorize.error on provider failure', async () => {
    const provider = makeProvider({
      getUserRoles: async () => { throw new Error('db down'); },
    });
    const permx = createPermXCore(provider);
    const errors: unknown[] = [];

    permx.emitter!.on('authorize.error', (payload) => {
      errors.push(payload);
    });

    await expect(permx.authorize('user-1', 'clients.view.all')).rejects.toThrow();
    await flushMicrotasks();

    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatchObject({
      userId: 'user-1',
      permissionKey: 'clients.view.all',
    });
    expect((errors[0] as { error: unknown }).error).toBeInstanceOf(Error);
  });

  it('emits cache.miss on first getApiMap call', async () => {
    const permx = createPermXCore(makeProvider(), { cache: { ttl: 60_000 } });
    const misses: unknown[] = [];

    permx.emitter!.on('cache.miss', (payload) => {
      misses.push(payload);
    });

    await permx.getApiMap();
    await flushMicrotasks();

    expect(misses).toHaveLength(1);
    expect(misses[0]).toMatchObject({ key: 'api_map' });
  });

  it('emits cache.hit on second getApiMap call', async () => {
    const permx = createPermXCore(makeProvider(), { cache: { ttl: 60_000 } });
    const misses: unknown[] = [];
    const hits: unknown[] = [];

    permx.emitter!.on('cache.miss', (payload) => {
      misses.push(payload);
    });
    permx.emitter!.on('cache.hit', (payload) => {
      hits.push(payload);
    });

    await permx.getApiMap();
    await flushMicrotasks();

    await permx.getApiMap();
    await flushMicrotasks();

    expect(misses).toHaveLength(1);
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatchObject({ key: 'api_map' });
  });

  it('works correctly when no listeners are attached', async () => {
    const permx = createPermXCore(makeProvider());

    const result = await permx.authorize('user-1', 'clients.view.all');

    expect(result).toEqual({ authorized: false });
  });

  it('listener errors do not break authorization', async () => {
    const permx = createPermXCore(makeProvider());

    permx.emitter!.on('authorize', () => {
      throw new Error('listener exploded');
    });

    const result = await permx.authorize('user-1', 'clients.view.all');
    await flushMicrotasks();

    expect(result).toEqual({ authorized: false });
  });

  it('includes duration_ms >= 0 in authorize event', async () => {
    const permx = createPermXCore(makeProvider());
    const events: Array<{ duration_ms: number }> = [];

    permx.emitter!.on('authorize', (payload) => {
      events.push(payload);
    });

    await permx.authorize('user-1', 'clients.view.all');
    await flushMicrotasks();

    expect(events).toHaveLength(1);
    expect(events[0].duration_ms).toBeGreaterThanOrEqual(0);
    expect(typeof events[0].duration_ms).toBe('number');
  });

  it('emitter is always present on factory-created instances', () => {
    const permx = createPermXCore(makeProvider());

    expect(permx.emitter).toBeDefined();
    expect(permx.emitter).toBeInstanceOf(PermXEmitter);
  });

  it('emitter is optional on PermXInstance type', () => {
    // Verify the type allows omitting emitter by constructing a conforming object.
    // If this compiles without error, emitter is indeed optional on PermXInstance.
    const instance: PermXInstance = {
      authorize: vi.fn(),
      authorizeApi: vi.fn(),
      getUserPermissions: vi.fn(),
      getApiMap: vi.fn(),
      invalidateCache: vi.fn(),
    };

    // Runtime assertion: the object has no emitter property
    expect(instance.emitter).toBeUndefined();
  });
});
