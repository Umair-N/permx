import { describe, it, expect, beforeEach } from 'vitest';
import { PrismaDataProvider } from '../src/data-provider.js';
import { createInMemoryPrisma } from './in-memory-prisma.js';

describe('PrismaDataProvider', () => {
  let prisma: ReturnType<typeof createInMemoryPrisma>;
  let provider: PrismaDataProvider;

  beforeEach(() => {
    prisma = createInMemoryPrisma();
    provider = new PrismaDataProvider(prisma);
  });

  async function seedBasicFixture() {
    const mod = await prisma.permXModule.create({
      data: { id: 'm1', name: 'Projects', slug: 'projects', sortOrder: 1, active: true },
    });
    const perm = await prisma.permXPermission.create({
      data: {
        id: 'p1',
        key: 'projects.tasks.view.all',
        moduleId: mod.id,
        name: 'View tasks',
        apiMappings: JSON.stringify([{ service: 'projects', method: 'GET', path: '/tasks' }]),
        uiMappings: JSON.stringify([{ type: 'component', identifier: 'task-list' }]),
      },
    });
    const role = await prisma.permXRole.create({
      data: { id: 'r1', name: 'Viewer', slug: 'viewer', roleType: 'regular', active: true },
    });
    await prisma.permXRolePermission.create({
      data: { roleId: role.id, permissionId: perm.id },
    });
    const userRole = await prisma.permXUserRole.create({
      data: { userId: 'user-1', roleId: role.id, tenantId: null },
    });
    return { mod, perm, role, userRole };
  }

  it('getUserRoles returns populated role + permissions', async () => {
    await seedBasicFixture();

    const rows = await provider.getUserRoles('user-1');
    expect(rows).toHaveLength(1);
    expect(rows[0]!.role._id).toBe('r1');
    expect(rows[0]!.role.permissions).toEqual([
      { _id: 'p1', key: 'projects.tasks.view.all' },
    ]);
  });

  it('getUserRoles excludes expired assignments', async () => {
    await seedBasicFixture();
    await prisma.permXUserRole.create({
      data: {
        userId: 'user-1',
        roleId: 'r1',
        tenantId: 'tenant-x',
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const rows = await provider.getUserRoles('user-1');
    // Only the non-expired assignment (the one seeded in fixture) should return
    expect(rows).toHaveLength(1);
  });

  it('getUserRoles returns empty for unknown user', async () => {
    await seedBasicFixture();
    const rows = await provider.getUserRoles('nobody');
    expect(rows).toEqual([]);
  });

  it('getRoleForResolution returns permissions + inheritance ids', async () => {
    await seedBasicFixture();
    await prisma.permXRole.create({
      data: { id: 'r2', name: 'Parent', slug: 'parent', roleType: 'regular', active: true },
    });
    await prisma.permXRoleInheritance.create({ data: { childId: 'r1', parentId: 'r2' } });

    const result = await provider.getRoleForResolution('r1');
    expect(result).toEqual({
      permissions: [{ _id: 'p1' }],
      inherits_from: ['r2'],
    });
  });

  it('getRoleForResolution returns null for unknown role', async () => {
    const result = await provider.getRoleForResolution('missing');
    expect(result).toBeNull();
  });

  it('getPermissionsByIds hydrates JSON-encoded mappings', async () => {
    await seedBasicFixture();
    const perms = await provider.getPermissionsByIds(['p1']);
    expect(perms).toHaveLength(1);
    expect(perms[0]!.key).toBe('projects.tasks.view.all');
    expect(perms[0]!.api_mappings).toEqual([
      { service: 'projects', method: 'GET', path: '/tasks' },
    ]);
    expect(perms[0]!.ui_mappings).toEqual([
      { type: 'component', identifier: 'task-list' },
    ]);
  });

  it('getPermissionsByIds returns [] for empty input', async () => {
    const perms = await provider.getPermissionsByIds([]);
    expect(perms).toEqual([]);
  });

  it('getModulesByIds excludes inactive modules and sorts by sortOrder', async () => {
    await prisma.permXModule.create({
      data: { id: 'm1', name: 'A', slug: 'a', sortOrder: 2, active: true },
    });
    await prisma.permXModule.create({
      data: { id: 'm2', name: 'B', slug: 'b', sortOrder: 1, active: true },
    });
    await prisma.permXModule.create({
      data: { id: 'm3', name: 'C', slug: 'c', sortOrder: 0, active: false },
    });

    const mods = await provider.getModulesByIds(['m1', 'm2', 'm3']);
    expect(mods.map((m) => m._id)).toEqual(['m2', 'm1']);
  });

  it('getApiPermissionMap expands JSON mappings into flat entries', async () => {
    await seedBasicFixture();
    await prisma.permXPermission.create({
      data: {
        id: 'p2',
        key: 'projects.tasks.create.all',
        moduleId: 'm1',
        name: 'Create tasks',
        apiMappings: JSON.stringify([
          { service: 'projects', method: 'POST', path: '/tasks' },
          { service: 'projects', method: 'PUT', path: '/tasks/:id' },
        ]),
      },
    });

    const entries = await provider.getApiPermissionMap();
    expect(entries).toEqual([
      { service: 'projects', method: 'GET', path: '/tasks', key: 'projects.tasks.view.all' },
      { service: 'projects', method: 'POST', path: '/tasks', key: 'projects.tasks.create.all' },
      { service: 'projects', method: 'PUT', path: '/tasks/:id', key: 'projects.tasks.create.all' },
    ]);
  });

  it('getApiPermissionMap handles permissions with no mappings', async () => {
    await prisma.permXModule.create({
      data: { id: 'm1', name: 'M', slug: 'm', sortOrder: 0, active: true },
    });
    await prisma.permXPermission.create({
      data: {
        id: 'p1',
        key: 'x.y.view.all',
        moduleId: 'm1',
        name: 'x',
        apiMappings: null,
      },
    });

    const entries = await provider.getApiPermissionMap();
    expect(entries).toEqual([]);
  });

  it('getPermissionsByIds gracefully handles malformed JSON in mappings', async () => {
    await prisma.permXModule.create({
      data: { id: 'm1', name: 'M', slug: 'm', sortOrder: 0, active: true },
    });
    await prisma.permXPermission.create({
      data: {
        id: 'p1',
        key: 'x.y.view.all',
        moduleId: 'm1',
        name: 'x',
        apiMappings: 'not-json',
        uiMappings: 'also-bad',
      },
    });

    const perms = await provider.getPermissionsByIds(['p1']);
    expect(perms[0]!.api_mappings).toEqual([]);
    expect(perms[0]!.ui_mappings).toEqual([]);
  });
});
