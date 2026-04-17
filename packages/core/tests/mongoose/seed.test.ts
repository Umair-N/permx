import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createPermXSchemas, type PermXModels } from '../../src/mongoose/schemas.js';
import {
  upsertModule,
  upsertPermission,
  upsertRole,
  ensureUserRole,
  syncFromConfig,
} from '../../src/mongoose/seed.js';

let mongoServer: MongoMemoryServer;
let conn: mongoose.Connection;
let models: PermXModels;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  conn = mongoose.createConnection(mongoServer.getUri());
  models = createPermXSchemas(conn);
  await conn.asPromise();
});

afterAll(async () => {
  await conn.close();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Promise.all([
    models.Module.deleteMany({}),
    models.Permission.deleteMany({}),
    models.Role.deleteMany({}),
    models.UserRole.deleteMany({}),
  ]);
});

describe('upsertModule', () => {
  it('creates a module on first call', async () => {
    const doc = await upsertModule(models, { name: 'Projects', slug: 'projects' });
    expect(doc._id).toBeDefined();
    expect(await models.Module.countDocuments()).toBe(1);
  });

  it('is idempotent — reuses the same document on re-run', async () => {
    const first = await upsertModule(models, { name: 'Projects', slug: 'projects' });
    const second = await upsertModule(models, { name: 'Projects Renamed', slug: 'projects' });

    expect(first._id).toBe(second._id);
    expect(await models.Module.countDocuments()).toBe(1);
    const fresh = await models.Module.findOne({ slug: 'projects' }).lean();
    expect((fresh as { name: string }).name).toBe('Projects Renamed');
  });
});

describe('upsertPermission', () => {
  it('is idempotent by key', async () => {
    const mod = await upsertModule(models, { name: 'Projects', slug: 'projects' });
    const first = await upsertPermission(models, {
      moduleSlug: 'projects',
      moduleId: mod._id,
      name: 'View Tasks',
      key: 'projects.tasks.view.all',
    });
    const second = await upsertPermission(models, {
      moduleSlug: 'projects',
      moduleId: mod._id,
      name: 'View All Tasks',
      key: 'projects.tasks.view.all',
    });

    expect(first._id).toBe(second._id);
    expect(await models.Permission.countDocuments()).toBe(1);
  });
});

describe('ensureUserRole', () => {
  it('assigns a role once and is idempotent on re-run', async () => {
    const roleDoc = await upsertRole(models, {
      name: 'Viewer',
      slug: 'viewer',
      permissionIds: [],
      inheritsFromIds: [],
    });

    const first = await ensureUserRole(models, 'user-1', roleDoc._id);
    const second = await ensureUserRole(models, 'user-1', roleDoc._id);

    expect(first._id).toBe(second._id);
    expect(await models.UserRole.countDocuments()).toBe(1);
  });
});

describe('syncFromConfig', () => {
  it('seeds modules, permissions, and roles with cross-references resolved', async () => {
    const result = await syncFromConfig(models, {
      modules: [
        { name: 'Projects', slug: 'projects' },
        { name: 'Billing', slug: 'billing' },
      ],
      permissions: [
        { moduleSlug: 'projects', name: 'View Tasks', key: 'projects.tasks.view.all' },
        { moduleSlug: 'projects', name: 'Edit Tasks', key: 'projects.tasks.update.own' },
        { moduleSlug: 'billing', name: 'View Invoices', key: 'billing.invoices.view.all' },
      ],
      roles: [
        {
          name: 'Project Viewer',
          slug: 'project-viewer',
          permissionKeys: ['projects.tasks.view.all'],
        },
        {
          name: 'Project Editor',
          slug: 'project-editor',
          permissionKeys: ['projects.tasks.update.own'],
          inheritsFrom: ['project-viewer'],
        },
      ],
    });

    expect(Object.keys(result.modules)).toEqual(['projects', 'billing']);
    expect(Object.keys(result.permissions)).toHaveLength(3);
    expect(Object.keys(result.roles)).toEqual(['project-viewer', 'project-editor']);

    const editor = await models.Role.findOne({ slug: 'project-editor' }).lean();
    expect((editor as { permissions: unknown[] }).permissions).toHaveLength(1);
    expect((editor as { inherits_from: unknown[] }).inherits_from).toHaveLength(1);
  });

  it('is idempotent — running twice yields the same ids', async () => {
    const config = {
      modules: [{ name: 'Projects', slug: 'projects' }],
      permissions: [
        { moduleSlug: 'projects', name: 'View', key: 'projects.tasks.view.all' },
      ],
      roles: [
        { name: 'Viewer', slug: 'viewer', permissionKeys: ['projects.tasks.view.all'] },
      ],
    };

    const first = await syncFromConfig(models, config);
    const second = await syncFromConfig(models, config);

    expect(second.modules.projects).toBe(first.modules.projects);
    expect(second.permissions['projects.tasks.view.all']).toBe(
      first.permissions['projects.tasks.view.all'],
    );
    expect(second.roles.viewer).toBe(first.roles.viewer);

    expect(await models.Module.countDocuments()).toBe(1);
    expect(await models.Permission.countDocuments()).toBe(1);
    expect(await models.Role.countDocuments()).toBe(1);
  });

  it('throws a helpful error when a permission references an unknown module', async () => {
    await expect(
      syncFromConfig(models, {
        permissions: [
          { moduleSlug: 'missing', name: 'View', key: 'missing.tasks.view.all' },
        ],
      }),
    ).rejects.toThrow(/unknown moduleSlug 'missing'/);
  });

  it('throws a helpful error when a role references an unknown permission key', async () => {
    await expect(
      syncFromConfig(models, {
        modules: [{ name: 'Projects', slug: 'projects' }],
        roles: [{ name: 'X', slug: 'x', permissionKeys: ['projects.nope.view.all'] }],
      }),
    ).rejects.toThrow(/unknown permission key 'projects.nope.view.all'/);
  });
});
