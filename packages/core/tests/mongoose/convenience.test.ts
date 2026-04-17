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

describe('Convenience methods', () => {
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

  // ── createModule ─────────────────────────────────────────

  describe('createModule', () => {
    it('creates a module and returns document with _id', async () => {
      // Arrange & Act
      const result = await permx.createModule({
        name: 'Inventory',
        slug: 'inventory',
        description: 'Manage warehouse inventory',
      });

      // Assert
      expect(result._id).toBeDefined();
      expect(String(result._id)).toMatch(/^[a-f0-9]{24}$/);
      expect(result.name).toBe('Inventory');
      expect(result.slug).toBe('inventory');
      expect(result.description).toBe('Manage warehouse inventory');
    });

    it('applies default sort_order (0) and active (true)', async () => {
      // Arrange & Act
      const result = await permx.createModule({
        name: 'Settings',
        slug: 'settings',
      });

      // Assert
      expect(result.sort_order).toBe(0);
      expect(result.active).toBe(true);
    });

    it('normalizes slug to lowercase with spaces converted to dashes', async () => {
      // Arrange & Act
      const result = await permx.createModule({
        name: 'User Management',
        slug: 'User Management',
      });

      // Assert
      expect(result.slug).toBe('user-management');
    });
  });

  // ── createPermission ─────────────────────────────────────

  describe('createPermission', () => {
    it('creates a permission with UI mappings and API mappings', async () => {
      // Arrange
      const mod = await permx.createModule({ name: 'Projects', slug: 'projects' });

      // Act
      const result = await permx.createPermission({
        module: mod._id,
        name: 'View Projects',
        key: 'projects.view.all',
        ui_mappings: [
          { type: 'route', identifier: '/projects' },
          { type: 'component', identifier: 'ProjectList' },
        ],
        api_mappings: [
          { service: 'projects-api', method: 'GET', path: '/api/projects' },
        ],
      });

      // Assert
      expect(result.ui_mappings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'route', identifier: '/projects' }),
          expect.objectContaining({ type: 'component', identifier: 'ProjectList' }),
        ]),
      );
      expect(result.api_mappings).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ service: 'projects-api', method: 'GET', path: '/api/projects' }),
        ]),
      );
    });

    it('returns document with _id and all fields', async () => {
      // Arrange
      const mod = await permx.createModule({ name: 'Tasks', slug: 'tasks' });

      // Act
      const result = await permx.createPermission({
        module: mod._id,
        name: 'Create Task',
        key: 'tasks.create.all',
        description: 'Allows creating new tasks',
        resource: 'task',
        action: 'create',
        scope: 'all',
        field: 'status',
      });

      // Assert
      expect(result._id).toBeDefined();
      expect(String(result._id)).toMatch(/^[a-f0-9]{24}$/);
      expect(result.name).toBe('Create Task');
      expect(result.key).toBe('tasks.create.all');
      expect(result.description).toBe('Allows creating new tasks');
      expect(result.resource).toBe('task');
      expect(result.action).toBe('create');
      expect(result.scope).toBe('all');
      expect(result.field).toBe('status');
    });

    it('normalizes key to lowercase', async () => {
      // Arrange
      const mod = await permx.createModule({ name: 'Reports', slug: 'reports' });

      // Act
      const result = await permx.createPermission({
        module: mod._id,
        name: 'View Reports',
        key: 'Reports.View.ALL',
      });

      // Assert
      expect(result.key).toBe('reports.view.all');
    });
  });

  // ── createRole ───────────────────────────────────────────

  describe('createRole', () => {
    it('creates a role with permissions array', async () => {
      // Arrange
      const mod = await permx.createModule({ name: 'Billing', slug: 'billing' });
      const perm1 = await permx.createPermission({
        module: mod._id,
        name: 'View Invoices',
        key: 'billing.invoices.view',
      });
      const perm2 = await permx.createPermission({
        module: mod._id,
        name: 'Create Invoices',
        key: 'billing.invoices.create',
      });

      // Act
      const result = await permx.createRole({
        name: 'Billing Admin',
        slug: 'billing-admin',
        permissions: [perm1._id, perm2._id],
      });

      // Assert
      expect(result._id).toBeDefined();
      expect(result.name).toBe('Billing Admin');
      expect(result.slug).toBe('billing-admin');
      const permIds = (result.permissions as unknown[]).map((p) => String(p));
      expect(permIds).toContain(String(perm1._id));
      expect(permIds).toContain(String(perm2._id));
    });

    it('applies default role_type (regular)', async () => {
      // Arrange & Act
      const result = await permx.createRole({
        name: 'Basic User',
        slug: 'basic-user',
      });

      // Assert
      expect(result.role_type).toBe('regular');
    });

    it('creates role with inherits_from', async () => {
      // Arrange
      const parentRole = await permx.createRole({
        name: 'Viewer',
        slug: 'viewer',
      });

      // Act
      const childRole = await permx.createRole({
        name: 'Editor',
        slug: 'editor',
        inherits_from: [parentRole._id],
      });

      // Assert
      const parentIds = (childRole.inherits_from as unknown[]).map((id) => String(id));
      expect(parentIds).toContain(String(parentRole._id));
    });
  });

  // ── assignRole ───────────────────────────────────────────

  describe('assignRole', () => {
    it('assigns a role to a user and returns document', async () => {
      // Arrange
      const role = await permx.createRole({
        name: 'Member',
        slug: 'member',
      });
      const userId = 'user-assign-001';

      // Act
      const result = await permx.assignRole(userId, role._id);

      // Assert
      expect(result._id).toBeDefined();
      expect(String(result._id)).toMatch(/^[a-f0-9]{24}$/);
      expect(result.user_id).toBe(userId);
      expect(String(result.role)).toBe(String(role._id));
    });

    it('passes options (assigned_by, expires_at)', async () => {
      // Arrange
      const role = await permx.createRole({
        name: 'Temporary',
        slug: 'temporary',
      });
      const userId = 'user-assign-002';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      // Act
      const result = await permx.assignRole(userId, role._id, {
        assigned_by: 'admin-001',
        expires_at: expiresAt,
      });

      // Assert
      expect(result.assigned_by).toBe('admin-001');
      expect(new Date(result.expires_at as string).getTime()).toBe(expiresAt.getTime());
    });
  });

  // ── revokeRole ───────────────────────────────────────────

  describe('revokeRole', () => {
    it('revokes an assigned role and returns true', async () => {
      // Arrange
      const role = await permx.createRole({
        name: 'Revokable',
        slug: 'revokable',
      });
      const userId = 'user-revoke-001';
      await permx.assignRole(userId, role._id);

      // Act
      const result = await permx.revokeRole(userId, role._id);

      // Assert
      expect(result).toBe(true);
    });

    it('returns false when role was not assigned', async () => {
      // Arrange
      const role = await permx.createRole({
        name: 'Never Assigned',
        slug: 'never-assigned',
      });
      const userId = 'user-revoke-002';

      // Act
      const result = await permx.revokeRole(userId, role._id);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ── End-to-end with authorize ────────────────────────────

  describe('end-to-end with authorize', () => {
    it('full flow: createModule → createPermission → createRole → assignRole → authorize succeeds', async () => {
      // Arrange
      const mod = await permx.createModule({
        name: 'Customers',
        slug: 'customers',
      });

      const perm = await permx.createPermission({
        module: mod._id,
        name: 'View Customers',
        key: 'customers.view.all',
        ui_mappings: [{ type: 'route', identifier: '/customers' }],
        api_mappings: [{ service: 'crm-api', method: 'GET', path: '/api/customers' }],
      });

      const role = await permx.createRole({
        name: 'Customer Support',
        slug: 'customer-support',
        permissions: [perm._id],
      });

      const userId = 'user-e2e-001';
      await permx.assignRole(userId, role._id);

      // Act
      const allowed = await permx.authorize(userId, 'customers.view.all');
      const denied = await permx.authorize(userId, 'customers.delete.all');

      // Assert
      expect(allowed).toEqual({ authorized: true });
      expect(denied).toEqual({ authorized: false });
    });
  });
});
