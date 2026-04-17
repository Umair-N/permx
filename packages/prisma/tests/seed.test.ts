import { describe, it, expect, beforeEach } from 'vitest';
import {
  upsertModule,
  upsertPermission,
  upsertRole,
  ensureUserRole,
  setRolePermissions,
  setRoleInheritance,
  syncFromConfig,
} from '../src/seed.js';
import { createInMemoryPrisma } from './in-memory-prisma.js';

describe('Seed helpers', () => {
  let prisma: ReturnType<typeof createInMemoryPrisma>;

  beforeEach(() => {
    prisma = createInMemoryPrisma();
  });

  describe('upsertModule', () => {
    it('creates a module on first call', async () => {
      const { id } = await upsertModule(prisma, { name: 'Projects', slug: 'projects' });
      expect(id).toBeDefined();
      expect(await prisma.permXModule.count()).toBe(1);
    });

    it('is idempotent — reuses the same id on re-run', async () => {
      const first = await upsertModule(prisma, { name: 'Projects', slug: 'projects' });
      const second = await upsertModule(prisma, { name: 'Projects Renamed', slug: 'projects' });
      expect(first.id).toBe(second.id);
      expect(await prisma.permXModule.count()).toBe(1);
    });
  });

  describe('upsertPermission', () => {
    it('is idempotent by key', async () => {
      const mod = await upsertModule(prisma, { name: 'Projects', slug: 'projects' });
      const first = await upsertPermission(prisma, {
        moduleSlug: 'projects',
        moduleId: mod.id,
        name: 'View',
        key: 'projects.tasks.view.all',
      });
      const second = await upsertPermission(prisma, {
        moduleSlug: 'projects',
        moduleId: mod.id,
        name: 'View Updated',
        key: 'projects.tasks.view.all',
      });
      expect(first.id).toBe(second.id);
      expect(await prisma.permXPermission.count()).toBe(1);
    });

    it('serializes api/ui mappings as JSON', async () => {
      const mod = await upsertModule(prisma, { name: 'P', slug: 'p' });
      await upsertPermission(prisma, {
        moduleSlug: 'p',
        moduleId: mod.id,
        name: 'x',
        key: 'p.x.view.all',
        apiMappings: [{ service: 'p', method: 'GET', path: '/x' }],
        uiMappings: [{ type: 'component', identifier: 'x-btn' }],
      });
      const row = await prisma.permXPermission.findUnique({ where: { key: 'p.x.view.all' } });
      expect(JSON.parse((row as { apiMappings: string }).apiMappings)).toHaveLength(1);
      expect(JSON.parse((row as { uiMappings: string }).uiMappings)).toHaveLength(1);
    });
  });

  describe('ensureUserRole', () => {
    it('assigns once and is idempotent on re-run', async () => {
      const role = await upsertRole(prisma, { name: 'V', slug: 'v' });
      const first = await ensureUserRole(prisma, 'user-1', role.id);
      const second = await ensureUserRole(prisma, 'user-1', role.id);
      expect(first.id).toBe(second.id);
      expect(await prisma.permXUserRole.count()).toBe(1);
    });

    it('scopes assignments by tenantId', async () => {
      const role = await upsertRole(prisma, { name: 'V', slug: 'v' });
      await ensureUserRole(prisma, 'user-1', role.id, { tenantId: 'acme' });
      await ensureUserRole(prisma, 'user-1', role.id, { tenantId: 'globex' });
      expect(await prisma.permXUserRole.count()).toBe(2);
    });

    it('replaces additional/excluded permission sets on re-run', async () => {
      const role = await upsertRole(prisma, { name: 'V', slug: 'v' });
      await ensureUserRole(prisma, 'user-1', role.id, {
        additionalPermissionIds: ['p1', 'p2'],
      });
      expect(await prisma.permXUserRoleAdditional.count()).toBe(2);

      await ensureUserRole(prisma, 'user-1', role.id, {
        additionalPermissionIds: ['p3'],
      });
      expect(await prisma.permXUserRoleAdditional.count()).toBe(1);
    });
  });

  describe('setRolePermissions / setRoleInheritance', () => {
    it('replaces the set on each call', async () => {
      const role = await upsertRole(prisma, { name: 'V', slug: 'v' });
      await setRolePermissions(prisma, role.id, ['p1', 'p2', 'p3']);
      expect(await prisma.permXRolePermission.count()).toBe(3);

      await setRolePermissions(prisma, role.id, ['p4']);
      expect(await prisma.permXRolePermission.count()).toBe(1);
    });

    it('replaces inheritance parents', async () => {
      const child = await upsertRole(prisma, { name: 'C', slug: 'c' });
      await setRoleInheritance(prisma, child.id, ['parent1', 'parent2']);
      expect(await prisma.permXRoleInheritance.count()).toBe(2);

      await setRoleInheritance(prisma, child.id, ['parent3']);
      expect(await prisma.permXRoleInheritance.count()).toBe(1);
    });
  });

  describe('syncFromConfig', () => {
    it('seeds modules, permissions, and roles with cross-references resolved', async () => {
      const result = await syncFromConfig(prisma, {
        modules: [
          { name: 'Projects', slug: 'projects' },
          { name: 'Billing', slug: 'billing' },
        ],
        permissions: [
          { moduleSlug: 'projects', name: 'View', key: 'projects.tasks.view.all' },
          { moduleSlug: 'projects', name: 'Edit', key: 'projects.tasks.update.own' },
          { moduleSlug: 'billing', name: 'View', key: 'billing.invoices.view.all' },
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
            permissionKeys: ['projects.tasks.update.own'],
            inheritsFrom: ['viewer'],
          },
        ],
      });

      expect(Object.keys(result.modules)).toEqual(['projects', 'billing']);
      expect(Object.keys(result.permissions)).toHaveLength(3);
      expect(Object.keys(result.roles)).toEqual(['viewer', 'editor']);

      const editorPerms = await prisma.permXRolePermission.findMany({
        where: { roleId: result.roles.editor },
      });
      expect(editorPerms).toHaveLength(1);

      const editorInheritance = await prisma.permXRoleInheritance.findMany({
        where: { childId: result.roles.editor },
      });
      expect(editorInheritance).toHaveLength(1);
    });

    it('is idempotent — re-running yields the same ids', async () => {
      const config = {
        modules: [{ name: 'P', slug: 'p' }],
        permissions: [{ moduleSlug: 'p', name: 'V', key: 'p.t.view.all' }],
        roles: [{ name: 'V', slug: 'v', permissionKeys: ['p.t.view.all'] }],
      };
      const first = await syncFromConfig(prisma, config);
      const second = await syncFromConfig(prisma, config);

      expect(second.modules.p).toBe(first.modules.p);
      expect(second.permissions['p.t.view.all']).toBe(first.permissions['p.t.view.all']);
      expect(second.roles.v).toBe(first.roles.v);

      expect(await prisma.permXModule.count()).toBe(1);
      expect(await prisma.permXPermission.count()).toBe(1);
      expect(await prisma.permXRole.count()).toBe(1);
      expect(await prisma.permXRolePermission.count()).toBe(1);
    });

    it('throws a helpful error when a permission references an unknown module', async () => {
      await expect(
        syncFromConfig(prisma, {
          permissions: [{ moduleSlug: 'missing', name: 'V', key: 'missing.x.view.all' }],
        }),
      ).rejects.toThrow(/unknown moduleSlug 'missing'/);
    });

    it('throws a helpful error when a role references an unknown permission key', async () => {
      await expect(
        syncFromConfig(prisma, {
          modules: [{ name: 'P', slug: 'p' }],
          roles: [{ name: 'X', slug: 'x', permissionKeys: ['p.nope.view.all'] }],
        }),
      ).rejects.toThrow(/unknown permission key 'p.nope.view.all'/);
    });

    it('throws when a role inherits from an unknown role slug', async () => {
      await expect(
        syncFromConfig(prisma, {
          modules: [{ name: 'P', slug: 'p' }],
          roles: [{ name: 'X', slug: 'x', inheritsFrom: ['does-not-exist'] }],
        }),
      ).rejects.toThrow(/inherits from unknown role slug 'does-not-exist'/);
    });
  });
});
