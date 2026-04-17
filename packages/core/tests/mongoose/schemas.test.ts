import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPermXSchemas } from '../../src/mongoose/schemas.js';

let mongoServer: MongoMemoryServer;
let uri: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  uri = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});

function freshConnection(): mongoose.Connection {
  return mongoose.createConnection(uri);
}

describe('createPermXSchemas', () => {
  it('creates 4 models (Module, Permission, Role, UserRole) on the connection', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn);

    expect(models.Module).toBeDefined();
    expect(models.Permission).toBeDefined();
    expect(models.Role).toBeDefined();
    expect(models.UserRole).toBeDefined();
    expect(Object.keys(conn.models)).toHaveLength(4);

    await conn.close();
  });

  it('uses default collection names: PermX_Module, PermX_Permission, PermX_Role, PermX_UserRole', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn);

    expect(models.Module.modelName).toBe('PermX_Module');
    expect(models.Permission.modelName).toBe('PermX_Permission');
    expect(models.Role.modelName).toBe('PermX_Role');
    expect(models.UserRole.modelName).toBe('PermX_UserRole');

    await conn.close();
  });

  it('supports custom collection names via collections config', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn, {
      collections: {
        module: 'App_Module',
        permission: 'App_Permission',
        role: 'App_Role',
        userRole: 'App_UserRole',
      },
    });

    expect(models.Module.modelName).toBe('App_Module');
    expect(models.Permission.modelName).toBe('App_Permission');
    expect(models.Role.modelName).toBe('App_Role');
    expect(models.UserRole.modelName).toBe('App_UserRole');

    await conn.close();
  });

  it('custom fields via extend config appear in documents', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn, {
      extend: {
        module: { priority: { type: Number, default: 1 } },
      },
    });

    await conn.asPromise();

    const doc = await models.Module.create({
      name: 'Dashboard',
      slug: 'dashboard',
      sort_order: 0,
    });

    expect(doc.toObject()).toHaveProperty('priority', 1);

    await conn.close();
  });

  it('indexes enforce unique constraints — duplicate slug on Module throws', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn);

    await conn.asPromise();
    await models.Module.syncIndexes();

    await models.Module.create({
      name: 'Users',
      slug: 'users',
      sort_order: 0,
    });

    await expect(
      models.Module.create({
        name: 'Users Duplicate',
        slug: 'users',
        sort_order: 1,
      }),
    ).rejects.toThrow(/duplicate key/i);

    await conn.close();
  });

  it('tenant plugin adds tenantId field when enabled', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn, {
      tenancy: { enabled: true },
    });

    const rolePaths = models.Role.schema.paths;
    expect(rolePaths).toHaveProperty('tenantId');

    const userRolePaths = models.UserRole.schema.paths;
    expect(userRolePaths).toHaveProperty('tenantId');

    await conn.close();
  });

  it('tenant plugin skips exempt models (module, permission) by default', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn, {
      tenancy: { enabled: true },
    });

    const modulePaths = models.Module.schema.paths;
    expect(modulePaths).not.toHaveProperty('tenantId');

    const permissionPaths = models.Permission.schema.paths;
    expect(permissionPaths).not.toHaveProperty('tenantId');

    await conn.close();
  });

  it('slug normalization pre-save hook converts spaces to dashes and lowercases', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn);

    await conn.asPromise();

    const doc = await models.Module.create({
      name: 'User Management',
      slug: 'User Management Module',
      sort_order: 0,
    });

    expect(doc.slug).toBe('user-management-module');

    await conn.close();
  });

  it('permission key normalization pre-save hook converts spaces to dots and lowercases', async () => {
    const conn = freshConnection();
    const models = createPermXSchemas(conn);

    await conn.asPromise();

    const mod = await models.Module.create({
      name: 'Users',
      slug: 'users-perm-test',
      sort_order: 0,
    });

    const perm = await models.Permission.create({
      module: mod._id,
      name: 'View Users',
      key: 'Users View All',
    });

    expect(perm.key).toBe('users.view.all');

    await conn.close();
  });
});
