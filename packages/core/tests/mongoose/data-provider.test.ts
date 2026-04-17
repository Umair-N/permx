import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPermXSchemas, type PermXModels } from '../../src/mongoose/schemas.js';
import { MongooseDataProvider } from '../../src/mongoose/data-provider.js';

let mongoServer: MongoMemoryServer;
let conn: mongoose.Connection;
let models: PermXModels;
let provider: MongooseDataProvider;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  conn = mongoose.createConnection(mongoServer.getUri());
  models = createPermXSchemas(conn);
  provider = new MongooseDataProvider(models);
  await conn.asPromise();
});

afterAll(async () => {
  await conn.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await models.Module.deleteMany({});
  await models.Permission.deleteMany({});
  await models.Role.deleteMany({});
  await models.UserRole.deleteMany({});
});

async function seedTestData() {
  const moduleA = await models.Module.create({
    name: 'Users',
    slug: 'users',
    sort_order: 1,
    active: true,
  });

  const moduleB = await models.Module.create({
    name: 'Billing',
    slug: 'billing',
    sort_order: 2,
    active: true,
  });

  const moduleInactive = await models.Module.create({
    name: 'Legacy',
    slug: 'legacy',
    sort_order: 0,
    active: false,
  });

  const permViewUsers = await models.Permission.create({
    module: moduleA._id,
    name: 'View Users',
    key: 'users.view',
    resource: 'users',
    action: 'view',
    scope: 'all',
    api_mappings: [
      { service: 'user-service', method: 'GET', path: '/api/users' },
    ],
  });

  const permCreateUsers = await models.Permission.create({
    module: moduleA._id,
    name: 'Create Users',
    key: 'users.create',
    resource: 'users',
    action: 'create',
    scope: 'all',
    api_mappings: [
      { service: 'user-service', method: 'POST', path: '/api/users' },
    ],
  });

  const permViewBilling = await models.Permission.create({
    module: moduleB._id,
    name: 'View Billing',
    key: 'billing.view',
    resource: 'billing',
    action: 'view',
    scope: 'all',
    api_mappings: [],
  });

  const parentRole = await models.Role.create({
    name: 'Viewer',
    slug: 'viewer',
    permissions: [permViewUsers._id],
    inherits_from: [],
  });

  const childRole = await models.Role.create({
    name: 'Admin',
    slug: 'admin',
    permissions: [permCreateUsers._id, permViewBilling._id],
    inherits_from: [parentRole._id],
  });

  return {
    moduleA,
    moduleB,
    moduleInactive,
    permViewUsers,
    permCreateUsers,
    permViewBilling,
    parentRole,
    childRole,
  };
}

describe('MongooseDataProvider', () => {
  describe('getUserRoles', () => {
    it('returns populated roles with permissions for a user', async () => {
      const { childRole, permCreateUsers, permViewBilling } = await seedTestData();
      const userId = 'user-123';

      await models.UserRole.create({
        user_id: userId,
        role: childRole._id,
        assigned_by: 'admin',
        assigned_at: new Date(),
      });

      const result = await provider.getUserRoles(userId);

      expect(result).toHaveLength(1);
      expect(result[0].user_id).toBe(userId);
      expect(result[0].role._id).toBe(childRole._id.toString());
      expect(result[0].role.permissions).toHaveLength(2);

      const permIds = result[0].role.permissions.map((p) => p._id);
      expect(permIds).toContain(permCreateUsers._id.toString());
      expect(permIds).toContain(permViewBilling._id.toString());
    });

    it('filters out expired role assignments', async () => {
      const { childRole } = await seedTestData();
      const userId = 'user-expired';

      await models.UserRole.create({
        user_id: userId,
        role: childRole._id,
        assigned_by: 'admin',
        assigned_at: new Date(),
        expires_at: new Date(Date.now() - 86_400_000), // expired yesterday
      });

      const result = await provider.getUserRoles(userId);
      expect(result).toHaveLength(0);
    });

    it('returns empty array for user with no roles', async () => {
      const result = await provider.getUserRoles('nonexistent-user');
      expect(result).toEqual([]);
    });
  });

  describe('getRoleForResolution', () => {
    it('returns permissions and inherits_from for a role', async () => {
      const { childRole, parentRole, permCreateUsers, permViewBilling } =
        await seedTestData();

      const result = await provider.getRoleForResolution(
        childRole._id.toString(),
      );

      expect(result).not.toBeNull();
      expect(result!.permissions).toHaveLength(2);

      const permIds = result!.permissions.map((p) => p._id);
      expect(permIds).toContain(permCreateUsers._id.toString());
      expect(permIds).toContain(permViewBilling._id.toString());

      expect(result!.inherits_from).toContain(parentRole._id.toString());
    });

    it('returns null for nonexistent role', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const result = await provider.getRoleForResolution(fakeId);
      expect(result).toBeNull();
    });
  });

  describe('getPermissionsByIds', () => {
    it('returns full permission documents', async () => {
      const { permViewUsers, permCreateUsers } = await seedTestData();

      const result = await provider.getPermissionsByIds([
        permViewUsers._id.toString(),
        permCreateUsers._id.toString(),
      ]);

      expect(result).toHaveLength(2);

      const keys = result.map((p) => p.key);
      expect(keys).toContain('users.view');
      expect(keys).toContain('users.create');

      const viewPerm = result.find((p) => p.key === 'users.view')!;
      expect(viewPerm.name).toBe('View Users');
      expect(viewPerm.resource).toBe('users');
      expect(viewPerm.action).toBe('view');
      expect(viewPerm.scope).toBe('all');
    });

    it('returns empty array for empty input', async () => {
      const result = await provider.getPermissionsByIds([]);
      expect(result).toEqual([]);
    });
  });

  describe('getModulesByIds', () => {
    it('returns active modules sorted by sort_order', async () => {
      const { moduleA, moduleB } = await seedTestData();

      const result = await provider.getModulesByIds([
        moduleA._id.toString(),
        moduleB._id.toString(),
      ]);

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('users');
      expect(result[1].slug).toBe('billing');
      expect(result[0].sort_order).toBeLessThan(result[1].sort_order);
    });

    it('excludes inactive modules', async () => {
      const { moduleInactive, moduleA } = await seedTestData();

      const result = await provider.getModulesByIds([
        moduleInactive._id.toString(),
        moduleA._id.toString(),
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('users');
    });
  });

  describe('getApiPermissionMap', () => {
    it('extracts service/method/path/key entries from permissions with api_mappings', async () => {
      const { permViewUsers, permCreateUsers } = await seedTestData();

      const result = await provider.getApiPermissionMap();

      expect(result.length).toBeGreaterThanOrEqual(2);

      const viewEntry = result.find(
        (e) => e.key === 'users.view' && e.method === 'GET',
      );
      expect(viewEntry).toBeDefined();
      expect(viewEntry!.service).toBe('user-service');
      expect(viewEntry!.path).toBe('/api/users');

      const createEntry = result.find(
        (e) => e.key === 'users.create' && e.method === 'POST',
      );
      expect(createEntry).toBeDefined();
      expect(createEntry!.service).toBe('user-service');
      expect(createEntry!.path).toBe('/api/users');
    });

    it('returns empty array when no permissions have api_mappings', async () => {
      // Create a module and permission with no api_mappings
      const mod = await models.Module.create({
        name: 'Settings',
        slug: 'settings',
        sort_order: 0,
        active: true,
      });

      await models.Permission.create({
        module: mod._id,
        name: 'View Settings',
        key: 'settings.view',
        api_mappings: [],
      });

      const result = await provider.getApiPermissionMap();
      expect(result).toEqual([]);
    });
  });
});
