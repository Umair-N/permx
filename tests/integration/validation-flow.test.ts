import { describe, it, expect } from 'vitest';
import { createPermXCore } from '../../src/permx.js';
import {
  ValidationError,
  DataProviderError,
  CircularInheritanceError,
} from '../../src/errors.js';
import type { PermXDataProvider } from '../../src/types/data-provider.js';

const makeProvider = (overrides: Partial<PermXDataProvider> = {}): PermXDataProvider => ({
  getUserRoles: async () => [],
  getRoleForResolution: async () => null,
  getPermissionsByIds: async () => [],
  getModulesByIds: async () => [],
  getApiPermissionMap: async () => [],
  ...overrides,
});

describe('Validation + error wrapping + events integration', () => {
  it('empty userId throws ValidationError with field userId', async () => {
    const permx = createPermXCore(makeProvider());

    try {
      await permx.authorize('', 'clients.view.all');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('userId');
    }
  });

  it('malformed key throws ValidationError with field permissionKey', async () => {
    const permx = createPermXCore(makeProvider());

    try {
      await permx.authorize('user-1', 'INVALID KEY');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('permissionKey');
    }
  });

  it('provider error throws DataProviderError with cause', async () => {
    const provider = makeProvider({
      getUserRoles: async () => { throw new Error('connection lost'); },
    });
    const permx = createPermXCore(provider);

    try {
      await permx.authorize('user-1', 'clients.view.all');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DataProviderError);
      const dpe = error as DataProviderError;
      expect((dpe.cause as Error).message).toBe('connection lost');
      expect(dpe.context.operation).toBe('authorize');
    }
  });

  it('PermXError subclass passes through unwrapped', async () => {
    const provider = makeProvider({
      getUserRoles: async () => { throw new CircularInheritanceError(['a', 'b', 'a']); },
    });
    const permx = createPermXCore(provider);

    try {
      await permx.authorize('user-1', 'clients.view.all');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(CircularInheritanceError);
      expect(error).not.toBeInstanceOf(DataProviderError);
      expect((error as CircularInheritanceError).chain).toEqual(['a', 'b', 'a']);
    }
  });

  it('authorizeApi validates service parameter', async () => {
    const permx = createPermXCore(makeProvider());

    try {
      await permx.authorizeApi('user-1', '', 'GET', '/clients');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('service');
    }
  });

  it('authorizeApi validates method parameter', async () => {
    const permx = createPermXCore(makeProvider());

    try {
      await permx.authorizeApi('user-1', 'client-hq', '', '/clients');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('method');
    }
  });

  it('getUserPermissions validates userId', async () => {
    const permx = createPermXCore(makeProvider());

    try {
      await permx.getUserPermissions('');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      expect((error as ValidationError).field).toBe('userId');
    }
  });

  it('getApiMap wraps provider errors in DataProviderError', async () => {
    const provider = makeProvider({
      getApiPermissionMap: async () => { throw new Error('timeout'); },
    });
    const permx = createPermXCore(provider);

    try {
      await permx.getApiMap();
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(DataProviderError);
      const dpe = error as DataProviderError;
      expect(dpe.context.operation).toBe('getApiMap');
      expect((dpe.cause as Error).message).toBe('timeout');
    }
  });
});
