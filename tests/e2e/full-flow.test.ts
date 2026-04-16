import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPermX } from '../../src/mongoose/factory.js';
import type { MongoosePermXInstance } from '../../src/mongoose/factory.js';

let mongoServer: MongoMemoryServer;
let uri: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  uri = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});

describe('Full permission resolution flow', () => {
  let conn: mongoose.Connection;
  let permx: MongoosePermXInstance;

  beforeAll(async () => {
    conn = mongoose.createConnection(uri);
    permx = createPermX({ connection: conn });
    await conn.asPromise();
    await permx.migrate();
  });

  afterAll(async () => {
    await conn.close();
  });

  beforeEach(async () => {
    await Promise.all([
      permx.models.UserRole.deleteMany({}),
      permx.models.Role.deleteMany({}),
      permx.models.Permission.deleteMany({}),
      permx.models.Module.deleteMany({}),
    ]);
  });

  it('authorizes a user with an assigned role and denies for nonexistent key', async () => {
    // Arrange
    const mod = await permx.models.Module.create({
      name: 'Clients',
      slug: 'clients',
      sort_order: 0,
    });

    const viewPerm = await permx.models.Permission.create({
      module: mod._id,
      name: 'View All Clients',
      key: 'clients.view.all',
      ui_mappings: [
        { type: 'route', identifier: '/clients' },
        { type: 'component', identifier: 'ClientList' },
      ],
      api_mappings: [
        { service: 'clients-api', method: 'GET', path: '/api/clients' },
      ],
    });

    const editPerm = await permx.models.Permission.create({
      module: mod._id,
      name: 'Edit Clients',
      key: 'clients.edit.all',
      ui_mappings: [
        { type: 'field', identifier: 'client-edit-form' },
      ],
    });

    const role = await permx.models.Role.create({
      name: 'Client Manager',
      slug: 'client-manager',
      permissions: [viewPerm._id, editPerm._id],
    });

    const userId = 'user-001';

    await permx.models.UserRole.create({
      user_id: userId,
      role: role._id,
    });

    // Act & Assert — authorized for assigned permission
    const allowed = await permx.authorize(userId, 'clients.view.all');
    expect(allowed).toEqual({ authorized: true });

    const allowedEdit = await permx.authorize(userId, 'clients.edit.all');
    expect(allowedEdit).toEqual({ authorized: true });

    // Act & Assert — denied for nonexistent permission
    const denied = await permx.authorize(userId, 'nonexistent.key');
    expect(denied).toEqual({ authorized: false });
  });
});

describe('Role inheritance flow', () => {
  let conn: mongoose.Connection;
  let permx: MongoosePermXInstance;

  beforeAll(async () => {
    conn = mongoose.createConnection(uri);
    permx = createPermX({ connection: conn });
    await conn.asPromise();
    await permx.migrate();
  });

  afterAll(async () => {
    await conn.close();
  });

  beforeEach(async () => {
    await Promise.all([
      permx.models.UserRole.deleteMany({}),
      permx.models.Role.deleteMany({}),
      permx.models.Permission.deleteMany({}),
      permx.models.Module.deleteMany({}),
    ]);
  });

  it('user with child role inherits permissions from parent role', async () => {
    // Arrange
    const mod = await permx.models.Module.create({
      name: 'Orders',
      slug: 'orders',
      sort_order: 0,
    });

    const permA = await permx.models.Permission.create({
      module: mod._id,
      name: 'View Orders',
      key: 'orders.view.all',
    });

    const permB = await permx.models.Permission.create({
      module: mod._id,
      name: 'Create Orders',
      key: 'orders.create.all',
    });

    const parentRole = await permx.models.Role.create({
      name: 'Order Viewer',
      slug: 'order-viewer',
      permissions: [permA._id],
    });

    const childRole = await permx.models.Role.create({
      name: 'Order Creator',
      slug: 'order-creator',
      permissions: [permB._id],
      inherits_from: [parentRole._id],
    });

    const userId = 'user-inherit-001';

    await permx.models.UserRole.create({
      user_id: userId,
      role: childRole._id,
    });

    // Act & Assert — user has permission B from the child role
    const hasB = await permx.authorize(userId, 'orders.create.all');
    expect(hasB).toEqual({ authorized: true });

    // Act & Assert — user has permission A inherited from parent role
    const hasA = await permx.authorize(userId, 'orders.view.all');
    expect(hasA).toEqual({ authorized: true });

    // Act & Assert — user does not have unrelated permission
    const denied = await permx.authorize(userId, 'orders.delete.all');
    expect(denied).toEqual({ authorized: false });
  });
});

describe('getUserPermissions returns UI mappings', () => {
  let conn: mongoose.Connection;
  let permx: MongoosePermXInstance;

  beforeAll(async () => {
    conn = mongoose.createConnection(uri);
    permx = createPermX({ connection: conn });
    await conn.asPromise();
    await permx.migrate();
  });

  afterAll(async () => {
    await conn.close();
  });

  beforeEach(async () => {
    await Promise.all([
      permx.models.UserRole.deleteMany({}),
      permx.models.Role.deleteMany({}),
      permx.models.Permission.deleteMany({}),
      permx.models.Module.deleteMany({}),
    ]);
  });

  it('returns routes, components, and fields from UI mappings', async () => {
    // Arrange
    const mod = await permx.models.Module.create({
      name: 'Dashboard',
      slug: 'dashboard',
      sort_order: 0,
    });

    const perm = await permx.models.Permission.create({
      module: mod._id,
      name: 'View Dashboard',
      key: 'dashboard.view.all',
      ui_mappings: [
        { type: 'route', identifier: '/dashboard' },
        { type: 'route', identifier: '/dashboard/analytics' },
        { type: 'component', identifier: 'DashboardWidget' },
        { type: 'component', identifier: 'AnalyticsChart' },
        { type: 'field', identifier: 'revenue-total' },
      ],
    });

    const role = await permx.models.Role.create({
      name: 'Dashboard Viewer',
      slug: 'dashboard-viewer',
      permissions: [perm._id],
    });

    const userId = 'user-ui-001';

    await permx.models.UserRole.create({
      user_id: userId,
      role: role._id,
    });

    // Act
    const result = await permx.getUserPermissions(userId);

    // Assert — permissions list
    expect(result.permissions).toContain('dashboard.view.all');

    // Assert — UI mappings
    expect(result.ui_mappings.routes).toEqual(
      expect.arrayContaining(['/dashboard', '/dashboard/analytics']),
    );
    expect(result.ui_mappings.components).toEqual(
      expect.arrayContaining(['DashboardWidget', 'AnalyticsChart']),
    );
    expect(result.ui_mappings.fields).toEqual(
      expect.arrayContaining(['revenue-total']),
    );

    // Assert — modules
    expect(result.modules).toHaveLength(1);
    expect(result.modules[0]).toMatchObject({
      name: 'Dashboard',
      slug: 'dashboard',
    });

    // Assert — structured permissions
    expect(result.structured_permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'dashboard.view.all',
          module_slug: 'dashboard',
        }),
      ]),
    );
  });
});

describe('Super admin bypass', () => {
  let conn: mongoose.Connection;
  let permx: MongoosePermXInstance;
  const SUPER_ADMIN_ID = 'super-admin-user';

  beforeAll(async () => {
    conn = mongoose.createConnection(uri);
    permx = createPermX({
      connection: conn,
      superAdmin: {
        check: (userId) => userId === SUPER_ADMIN_ID,
      },
    });
    await conn.asPromise();
    await permx.migrate();
  });

  afterAll(async () => {
    await conn.close();
  });

  it('super admin is authorized for any key without needing roles', async () => {
    // Act & Assert — authorized for arbitrary keys without any DB data
    const result1 = await permx.authorize(SUPER_ADMIN_ID, 'any.random.permission');
    expect(result1).toEqual({ authorized: true });

    const result2 = await permx.authorize(SUPER_ADMIN_ID, 'another.nonexistent.key');
    expect(result2).toEqual({ authorized: true });
  });

  it('non-super-admin user is denied without roles', async () => {
    const regularUserId = 'regular-user-123';

    const result = await permx.authorize(regularUserId, 'any.random.permission');
    expect(result).toEqual({ authorized: false });
  });
});

describe('Expired role assignment is ignored', () => {
  let conn: mongoose.Connection;
  let permx: MongoosePermXInstance;

  beforeAll(async () => {
    conn = mongoose.createConnection(uri);
    permx = createPermX({ connection: conn });
    await conn.asPromise();
    await permx.migrate();
  });

  afterAll(async () => {
    await conn.close();
  });

  beforeEach(async () => {
    await Promise.all([
      permx.models.UserRole.deleteMany({}),
      permx.models.Role.deleteMany({}),
      permx.models.Permission.deleteMany({}),
      permx.models.Module.deleteMany({}),
    ]);
  });

  it('denies access when the user role assignment has expired', async () => {
    // Arrange
    const mod = await permx.models.Module.create({
      name: 'Reports',
      slug: 'reports',
      sort_order: 0,
    });

    const perm = await permx.models.Permission.create({
      module: mod._id,
      name: 'View Reports',
      key: 'reports.view.all',
    });

    const role = await permx.models.Role.create({
      name: 'Report Viewer',
      slug: 'report-viewer',
      permissions: [perm._id],
    });

    const userId = 'user-expired-001';
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago

    await permx.models.UserRole.create({
      user_id: userId,
      role: role._id,
      expires_at: pastDate,
    });

    // Act
    const result = await permx.authorize(userId, 'reports.view.all');

    // Assert — denied because the role assignment is expired
    expect(result).toEqual({ authorized: false });
  });

  it('allows access when the user role assignment has not yet expired', async () => {
    // Arrange
    const mod = await permx.models.Module.create({
      name: 'Reports Active',
      slug: 'reports-active',
      sort_order: 0,
    });

    const perm = await permx.models.Permission.create({
      module: mod._id,
      name: 'View Active Reports',
      key: 'reports-active.view.all',
    });

    const role = await permx.models.Role.create({
      name: 'Active Report Viewer',
      slug: 'active-report-viewer',
      permissions: [perm._id],
    });

    const userId = 'user-active-001';
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    await permx.models.UserRole.create({
      user_id: userId,
      role: role._id,
      expires_at: futureDate,
    });

    // Act
    const result = await permx.authorize(userId, 'reports-active.view.all');

    // Assert — allowed because the role assignment has not expired
    expect(result).toEqual({ authorized: true });
  });
});

describe('API authorization flow (authorizeApi)', () => {
  let conn: mongoose.Connection;
  let permx: MongoosePermXInstance;

  beforeAll(async () => {
    conn = mongoose.createConnection(uri);
    permx = createPermX({ connection: conn });
    await conn.asPromise();
    await permx.migrate();
  });

  afterAll(async () => {
    await conn.close();
  });

  beforeEach(async () => {
    permx.invalidateCache();
    await Promise.all([
      permx.models.UserRole.deleteMany({}),
      permx.models.Role.deleteMany({}),
      permx.models.Permission.deleteMany({}),
      permx.models.Module.deleteMany({}),
    ]);
  });

  it('authorizes a user for a matching API endpoint', async () => {
    // Arrange
    const mod = await permx.models.Module.create({
      name: 'Invoices',
      slug: 'invoices',
      sort_order: 0,
    });

    const perm = await permx.models.Permission.create({
      module: mod._id,
      name: 'List Invoices',
      key: 'invoices.view.all',
      api_mappings: [
        { service: 'billing-api', method: 'GET', path: '/api/invoices' },
        { service: 'billing-api', method: 'GET', path: '/api/invoices/:id' },
      ],
    });

    const role = await permx.models.Role.create({
      name: 'Invoice Viewer',
      slug: 'invoice-viewer',
      permissions: [perm._id],
    });

    const userId = 'user-api-001';

    await permx.models.UserRole.create({
      user_id: userId,
      role: role._id,
    });

    // Act & Assert — matching service, method, and path
    const result = await permx.authorizeApi(userId, 'billing-api', 'GET', '/api/invoices');
    expect(result.authorized).toBe(true);
    expect(result.matched_key).toBe('invoices.view.all');
  });

  it('denies access for an unregistered API endpoint', async () => {
    const userId = 'user-api-002';

    // Act — no permissions exist at all
    const result = await permx.authorizeApi(userId, 'unknown-service', 'POST', '/api/unknown');

    // Assert
    expect(result.authorized).toBe(false);
  });

  it('denies access when user lacks the permission mapped to the API endpoint', async () => {
    // Arrange — create the permission and API mapping but do NOT assign to user
    const mod = await permx.models.Module.create({
      name: 'Payments',
      slug: 'payments',
      sort_order: 0,
    });

    await permx.models.Permission.create({
      module: mod._id,
      name: 'Process Payment',
      key: 'payments.create.all',
      api_mappings: [
        { service: 'payments-api', method: 'POST', path: '/api/payments' },
      ],
    });

    const userId = 'user-api-003';

    // Act
    const result = await permx.authorizeApi(userId, 'payments-api', 'POST', '/api/payments');

    // Assert — endpoint exists in API map but user has no role with that permission
    expect(result.authorized).toBe(false);
  });
});
