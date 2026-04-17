import { describe, it, expect, beforeEach } from 'vitest';
import { createPermX } from '../src/factory.js';
import { syncFromConfig } from '../src/seed.js';
import { createInMemoryPrisma } from './in-memory-prisma.js';

describe('createPermX (Prisma)', () => {
  let prisma: ReturnType<typeof createInMemoryPrisma>;

  beforeEach(() => {
    prisma = createInMemoryPrisma();
  });

  it('authorize() returns true for a permission the user has', async () => {
    await syncFromConfig(prisma, {
      modules: [{ name: 'Projects', slug: 'projects' }],
      permissions: [
        { moduleSlug: 'projects', name: 'View', key: 'projects.tasks.view.all' },
      ],
      roles: [{ name: 'Viewer', slug: 'viewer', permissionKeys: ['projects.tasks.view.all'] }],
    });

    const role = await prisma.permXRole.findUnique({ where: { slug: 'viewer' } });
    await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: (role as { id: string }).id, tenantId: null },
    });

    const permx = createPermX({ prisma });
    const result = await permx.authorize('user-1', 'projects.tasks.view.all');
    expect(result.authorized).toBe(true);
  });

  it('authorize() returns false for a permission the user does not have', async () => {
    await syncFromConfig(prisma, {
      modules: [{ name: 'Projects', slug: 'projects' }],
      permissions: [
        { moduleSlug: 'projects', name: 'View', key: 'projects.tasks.view.all' },
        { moduleSlug: 'projects', name: 'Delete', key: 'projects.tasks.delete.all' },
      ],
      roles: [{ name: 'Viewer', slug: 'viewer', permissionKeys: ['projects.tasks.view.all'] }],
    });

    const role = await prisma.permXRole.findUnique({ where: { slug: 'viewer' } });
    await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: (role as { id: string }).id, tenantId: null },
    });

    const permx = createPermX({ prisma });
    const result = await permx.authorize('user-1', 'projects.tasks.delete.all');
    expect(result.authorized).toBe(false);
  });

  it('inherited permissions resolve through the parent chain', async () => {
    await syncFromConfig(prisma, {
      modules: [{ name: 'Projects', slug: 'projects' }],
      permissions: [
        { moduleSlug: 'projects', name: 'View', key: 'projects.tasks.view.all' },
        { moduleSlug: 'projects', name: 'Edit', key: 'projects.tasks.update.all' },
      ],
      roles: [
        {
          name: 'Viewer',
          slug: 'viewer',
          permissionKeys: ['projects.tasks.view.all'],
        },
        {
          name: 'Editor',
          slug: 'editor',
          permissionKeys: ['projects.tasks.update.all'],
          inheritsFrom: ['viewer'],
        },
      ],
    });

    const editor = await prisma.permXRole.findUnique({ where: { slug: 'editor' } });
    await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: (editor as { id: string }).id, tenantId: null },
    });

    const permx = createPermX({ prisma });
    const canView = await permx.authorize('user-1', 'projects.tasks.view.all');
    const canEdit = await permx.authorize('user-1', 'projects.tasks.update.all');
    expect(canView.authorized).toBe(true);
    expect(canEdit.authorized).toBe(true);
  });

  it('superAdmin bypass allows any key', async () => {
    const permx = createPermX({
      prisma,
      superAdmin: { check: (userId) => userId === 'root' },
    });
    const result = await permx.authorize('root', 'anything.at.view.all');
    expect(result.authorized).toBe(true);
  });

  it('getUserPermissions returns full effective set with UI mappings', async () => {
    await syncFromConfig(prisma, {
      modules: [{ name: 'Projects', slug: 'projects' }],
      permissions: [
        {
          moduleSlug: 'projects',
          name: 'View',
          key: 'projects.tasks.view.all',
          uiMappings: [
            { type: 'route', identifier: '/projects' },
            { type: 'component', identifier: 'task-list' },
          ],
        },
      ],
      roles: [{ name: 'Viewer', slug: 'viewer', permissionKeys: ['projects.tasks.view.all'] }],
    });

    const role = await prisma.permXRole.findUnique({ where: { slug: 'viewer' } });
    await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: (role as { id: string }).id, tenantId: null },
    });

    const permx = createPermX({ prisma });
    const perms = await permx.getUserPermissions('user-1');

    expect(perms.permissions).toContain('projects.tasks.view.all');
    expect(perms.ui_mappings.routes).toContain('/projects');
    expect(perms.ui_mappings.components).toContain('task-list');
  });

  it('invalidateUser clears the cache so the next authorize sees fresh data', async () => {
    await syncFromConfig(prisma, {
      modules: [{ name: 'Projects', slug: 'projects' }],
      permissions: [
        { moduleSlug: 'projects', name: 'View', key: 'projects.tasks.view.all' },
        { moduleSlug: 'projects', name: 'Edit', key: 'projects.tasks.update.all' },
      ],
      roles: [
        { name: 'Viewer', slug: 'viewer', permissionKeys: ['projects.tasks.view.all'] },
        { name: 'Editor', slug: 'editor', permissionKeys: ['projects.tasks.update.all'] },
      ],
    });

    const viewer = await prisma.permXRole.findUnique({ where: { slug: 'viewer' } });
    const editor = await prisma.permXRole.findUnique({ where: { slug: 'editor' } });
    const viewerUR = await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: (viewer as { id: string }).id, tenantId: null },
    });

    const permx = createPermX({ prisma, cache: { ttl: 60_000 } });
    expect((await permx.authorize('user-1', 'projects.tasks.update.all')).authorized).toBe(false);

    // Admin swaps the role out-of-band
    await prisma.permXUserRole.delete({ where: { id: viewerUR.id } });
    await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: (editor as { id: string }).id, tenantId: null },
    });

    // Still cached — returns the old answer
    expect((await permx.authorize('user-1', 'projects.tasks.update.all')).authorized).toBe(false);

    permx.invalidateUser('user-1');

    // Fresh fetch — new role is picked up
    expect((await permx.authorize('user-1', 'projects.tasks.update.all')).authorized).toBe(true);
  });
});
