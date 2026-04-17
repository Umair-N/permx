import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createPermXMiddleware } from '../../src/middleware/authorize.js';
import type { PermXInstance } from '../../src/permx.js';
import type { PermXMiddlewareConfig } from '../../src/middleware/types.js';

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

const TEST_USER_ID = 'user-123';
const TEST_TENANT_ID = 'tenant-456';

const makeConfig = (overrides: Partial<PermXMiddlewareConfig> = {}): PermXMiddlewareConfig => ({
  extractUserId: () => TEST_USER_ID,
  extractTenantId: () => TEST_TENANT_ID,
  ...overrides,
});

describe('createPermXMiddleware', () => {
  describe('authorize(key)', () => {
    it('returns 200 and calls next() when authorized', async () => {
      const permx = makeMockPermx({
        authorize: vi.fn().mockResolvedValue({ authorized: true }),
      });
      const auth = createPermXMiddleware(permx, makeConfig());

      const app = express();
      app.get('/test', auth.authorize('clients.view.all'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(permx.authorize).toHaveBeenCalledWith(TEST_USER_ID, 'clients.view.all', {
        tenantId: TEST_TENANT_ID,
      });
    });

    it('returns 403 when permission denied', async () => {
      const permx = makeMockPermx({
        authorize: vi.fn().mockResolvedValue({ authorized: false }),
      });
      const auth = createPermXMiddleware(permx, makeConfig());

      const app = express();
      app.get('/test', auth.authorize('clients.delete'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'You do not have permission to access this resource' });
    });

    it('returns 403 when extractUserId returns null', async () => {
      const permx = makeMockPermx();
      const auth = createPermXMiddleware(
        permx,
        makeConfig({ extractUserId: () => null }),
      );

      const app = express();
      app.get('/test', auth.authorize('clients.view.all'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(403);
      expect(permx.authorize).not.toHaveBeenCalled();
    });

    it('bypasses authorization when isServiceCall returns true', async () => {
      const permx = makeMockPermx();
      const auth = createPermXMiddleware(
        permx,
        makeConfig({ isServiceCall: () => true }),
      );

      const app = express();
      app.get('/test', auth.authorize('clients.view.all'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(permx.authorize).not.toHaveBeenCalled();
    });

    it('bypasses authorization when isSuperAdmin returns true', async () => {
      const permx = makeMockPermx();
      const auth = createPermXMiddleware(
        permx,
        makeConfig({ isSuperAdmin: () => true }),
      );

      const app = express();
      app.get('/test', auth.authorize('clients.view.all'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(permx.authorize).not.toHaveBeenCalled();
    });

    it('calls custom onDenied handler with the permission key', async () => {
      const permx = makeMockPermx({
        authorize: vi.fn().mockResolvedValue({ authorized: false }),
      });
      const onDenied = vi.fn((_req, res, permissionKey: string) => {
        res.status(403).json({ denied: true, key: permissionKey });
      });
      const auth = createPermXMiddleware(permx, makeConfig({ onDenied }));

      const app = express();
      app.get('/test', auth.authorize('reports.export'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ denied: true, key: 'reports.export' });
      expect(onDenied).toHaveBeenCalledOnce();
      expect(onDenied.mock.calls[0]![2]).toBe('reports.export');
    });

    it('calls custom onError handler when permx.authorize throws', async () => {
      const authorizeError = new Error('Database connection lost');
      const permx = makeMockPermx({
        authorize: vi.fn().mockRejectedValue(authorizeError),
      });
      const onError = vi.fn((_req, res, error: unknown) => {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
      });
      const auth = createPermXMiddleware(permx, makeConfig({ onError }));

      const app = express();
      app.get('/test', auth.authorize('clients.view.all'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body).toEqual({ error: 'Database connection lost' });
      expect(onError).toHaveBeenCalledOnce();
      expect(onError.mock.calls[0]![2]).toBe(authorizeError);
    });
  });

  describe('authorizeApi(service)', () => {
    it('returns 200 when API authorization succeeds', async () => {
      const permx = makeMockPermx({
        authorizeApi: vi.fn().mockResolvedValue({ authorized: true, matched_key: 'clients.view.all' }),
      });
      const auth = createPermXMiddleware(permx, makeConfig());

      const app = express();
      app.get('/clients', auth.authorizeApi('client-service'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).get('/clients');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(permx.authorizeApi).toHaveBeenCalledWith(
        TEST_USER_ID,
        'client-service',
        'GET',
        '/clients',
        { tenantId: TEST_TENANT_ID },
      );
    });

    it('returns 403 when API authorization denied', async () => {
      const permx = makeMockPermx({
        authorizeApi: vi.fn().mockResolvedValue({ authorized: false, matched_key: 'clients.delete' }),
      });
      const auth = createPermXMiddleware(permx, makeConfig());

      const app = express();
      app.delete('/clients/1', auth.authorizeApi('client-service'), (_req, res) => {
        res.status(200).json({ ok: true });
      });

      const response = await request(app).delete('/clients/1');

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'You do not have permission to access this resource' });
    });
  });
});
