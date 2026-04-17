import { describe, it, expect, vi } from 'vitest';
import { handleAuthorization, handleApiAuthorization } from '../../src/middleware/handler.js';
import type { PermXInstance } from '../../src/permx.js';
import type { AuthorizationRequest } from '../../src/middleware/handler.js';

const makeMockPermx = (overrides: Partial<PermXInstance> = {}): PermXInstance => ({
  authorize: vi.fn().mockResolvedValue({ authorized: false }),
  authorizeApi: vi.fn().mockResolvedValue({ authorized: false }),
  getUserPermissions: vi.fn().mockResolvedValue({
    permissions: [],
    structured_permissions: [],
    ui_mappings: { routes: [], components: [], fields: [] },
    modules: [],
  }),
  getApiMap: vi.fn().mockResolvedValue([]),
  invalidateCache: vi.fn(),
  ...overrides,
});

const makeRequest = (overrides: Partial<AuthorizationRequest> = {}): AuthorizationRequest => ({
  userId: 'user-123',
  tenantId: 'tenant-456',
  isServiceCall: false,
  isSuperAdmin: false,
  ...overrides,
});

describe('handleAuthorization', () => {
  it('allows when authorized', async () => {
    const permx = makeMockPermx({
      authorize: vi.fn().mockResolvedValue({ authorized: true }),
    });

    const outcome = await handleAuthorization(permx, makeRequest(), 'clients.view.all');

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorize).toHaveBeenCalledWith('user-123', 'clients.view.all', {
      tenantId: 'tenant-456',
    });
  });

  it('denies when not authorized', async () => {
    const permx = makeMockPermx({
      authorize: vi.fn().mockResolvedValue({ authorized: false }),
    });

    const outcome = await handleAuthorization(permx, makeRequest(), 'clients.delete');

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'clients.delete' });
  });

  it('denies when userId is null', async () => {
    const permx = makeMockPermx();

    const outcome = await handleAuthorization(
      permx,
      makeRequest({ userId: null }),
      'clients.view.all',
    );

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'clients.view.all' });
    expect(permx.authorize).not.toHaveBeenCalled();
  });

  it('denies when userId is undefined', async () => {
    const permx = makeMockPermx();

    const outcome = await handleAuthorization(
      permx,
      makeRequest({ userId: undefined }),
      'clients.view.all',
    );

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'clients.view.all' });
  });

  it('allows when isServiceCall is true', async () => {
    const permx = makeMockPermx();

    const outcome = await handleAuthorization(
      permx,
      makeRequest({ isServiceCall: true }),
      'clients.view.all',
    );

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorize).not.toHaveBeenCalled();
  });

  it('allows when isSuperAdmin is true', async () => {
    const permx = makeMockPermx();

    const outcome = await handleAuthorization(
      permx,
      makeRequest({ isSuperAdmin: true }),
      'clients.view.all',
    );

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorize).not.toHaveBeenCalled();
  });

  it('returns error when permx.authorize throws', async () => {
    const dbError = new Error('Database connection lost');
    const permx = makeMockPermx({
      authorize: vi.fn().mockRejectedValue(dbError),
    });

    const outcome = await handleAuthorization(permx, makeRequest(), 'clients.view.all');

    expect(outcome).toEqual({ action: 'error', error: dbError });
  });

  it('returns error when validateUserId throws', async () => {
    const permx = makeMockPermx();

    // Use a non-empty but invalid userId — empty string is falsy and returns deny
    const outcome = await handleAuthorization(
      permx,
      makeRequest({ userId: '   ' }),
      'clients.view.all',
    );

    expect(outcome.action).toBe('error');
    expect(permx.authorize).not.toHaveBeenCalled();
  });

  it('denies when userId is empty string (falsy)', async () => {
    const permx = makeMockPermx();

    const outcome = await handleAuthorization(
      permx,
      makeRequest({ userId: '' }),
      'clients.view.all',
    );

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'clients.view.all' });
    expect(permx.authorize).not.toHaveBeenCalled();
  });

  it('passes undefined tenantId when not provided', async () => {
    const permx = makeMockPermx({
      authorize: vi.fn().mockResolvedValue({ authorized: true }),
    });

    const outcome = await handleAuthorization(
      permx,
      makeRequest({ tenantId: null }),
      'clients.view.all',
    );

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorize).toHaveBeenCalledWith('user-123', 'clients.view.all', {
      tenantId: undefined,
    });
  });
});

describe('handleApiAuthorization', () => {
  it('allows when API authorization succeeds', async () => {
    const permx = makeMockPermx({
      authorizeApi: vi.fn().mockResolvedValue({ authorized: true, matched_key: 'clients.view.all' }),
    });

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest(),
      'client-service',
      'GET',
      '/clients',
    );

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorizeApi).toHaveBeenCalledWith(
      'user-123',
      'client-service',
      'GET',
      '/clients',
      { tenantId: 'tenant-456' },
    );
  });

  it('denies with matched_key when API authorization fails', async () => {
    const permx = makeMockPermx({
      authorizeApi: vi.fn().mockResolvedValue({ authorized: false, matched_key: 'clients.delete' }),
    });

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest(),
      'client-service',
      'DELETE',
      '/clients/1',
    );

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'clients.delete' });
  });

  it('denies with api_access fallback when no matched_key', async () => {
    const permx = makeMockPermx({
      authorizeApi: vi.fn().mockResolvedValue({ authorized: false }),
    });

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest(),
      'client-service',
      'GET',
      '/unknown',
    );

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'api_access' });
  });

  it('denies when userId is null', async () => {
    const permx = makeMockPermx();

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest({ userId: null }),
      'client-service',
      'GET',
      '/clients',
    );

    expect(outcome).toEqual({ action: 'deny', permissionKey: 'api_access' });
    expect(permx.authorizeApi).not.toHaveBeenCalled();
  });

  it('allows when isServiceCall is true', async () => {
    const permx = makeMockPermx();

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest({ isServiceCall: true }),
      'client-service',
      'GET',
      '/clients',
    );

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorizeApi).not.toHaveBeenCalled();
  });

  it('allows when isSuperAdmin is true', async () => {
    const permx = makeMockPermx();

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest({ isSuperAdmin: true }),
      'client-service',
      'GET',
      '/clients',
    );

    expect(outcome).toEqual({ action: 'allow' });
    expect(permx.authorizeApi).not.toHaveBeenCalled();
  });

  it('returns error when permx.authorizeApi throws', async () => {
    const apiError = new Error('API map unavailable');
    const permx = makeMockPermx({
      authorizeApi: vi.fn().mockRejectedValue(apiError),
    });

    const outcome = await handleApiAuthorization(
      permx,
      makeRequest(),
      'client-service',
      'GET',
      '/clients',
    );

    expect(outcome).toEqual({ action: 'error', error: apiError });
  });

  it('returns error when validateUserId throws', async () => {
    const permx = makeMockPermx();

    // Use a non-empty but invalid userId — empty string is falsy and returns deny
    const outcome = await handleApiAuthorization(
      permx,
      makeRequest({ userId: '   ' }),
      'client-service',
      'GET',
      '/clients',
    );

    expect(outcome.action).toBe('error');
    expect(permx.authorizeApi).not.toHaveBeenCalled();
  });
});
