import { describe, it, expect } from 'vitest';
import { resolveRolePermissions } from '../../src/engine/role-resolver.js';
import { CircularInheritanceError } from '../../src/errors.js';

const makeRole = (permissions: string[], inherits: string[] = []) => ({
  permissions: permissions.map((id) => ({ _id: id })),
  inherits_from: inherits,
});

describe('resolveRolePermissions', () => {
  it('returns empty set for null roleId', async () => {
    const result = await resolveRolePermissions(null, async () => null);
    expect(result.size).toBe(0);
  });

  it('returns empty set for missing role', async () => {
    const result = await resolveRolePermissions('role-1', async () => null);
    expect(result.size).toBe(0);
  });

  it('resolves direct permissions', async () => {
    const fetch = async (id: string) => {
      if (id === 'role-1') return makeRole(['perm-a', 'perm-b']);
      return null;
    };

    const result = await resolveRolePermissions('role-1', fetch);
    expect(result).toEqual(new Set(['perm-a', 'perm-b']));
  });

  it('resolves inherited permissions (single parent)', async () => {
    const roles: Record<string, ReturnType<typeof makeRole>> = {
      'child': makeRole(['perm-a'], ['parent']),
      'parent': makeRole(['perm-b', 'perm-c']),
    };

    const fetch = async (id: string) => roles[id] ?? null;
    const result = await resolveRolePermissions('child', fetch);
    expect(result).toEqual(new Set(['perm-a', 'perm-b', 'perm-c']));
  });

  it('handles diamond inheritance without duplicates', async () => {
    // child → parent-a → grandparent
    // child → parent-b → grandparent
    const roles: Record<string, ReturnType<typeof makeRole>> = {
      'child': makeRole(['perm-own'], ['parent-a', 'parent-b']),
      'parent-a': makeRole(['perm-a'], ['grandparent']),
      'parent-b': makeRole(['perm-b'], ['grandparent']),
      'grandparent': makeRole(['perm-shared']),
    };

    const fetch = async (id: string) => roles[id] ?? null;
    const result = await resolveRolePermissions('child', fetch);
    expect(result).toEqual(new Set(['perm-own', 'perm-a', 'perm-b', 'perm-shared']));
  });

  it('handles circular inheritance gracefully', async () => {
    const roles: Record<string, ReturnType<typeof makeRole>> = {
      'role-a': makeRole(['perm-a'], ['role-b']),
      'role-b': makeRole(['perm-b'], ['role-a']),
    };

    const fetch = async (id: string) => roles[id] ?? null;
    // Should not infinite loop
    const result = await resolveRolePermissions('role-a', fetch);
    expect(result).toEqual(new Set(['perm-a', 'perm-b']));
  });

  it('handles deep inheritance chain', async () => {
    const roles: Record<string, ReturnType<typeof makeRole>> = {
      'level-1': makeRole(['perm-1'], ['level-2']),
      'level-2': makeRole(['perm-2'], ['level-3']),
      'level-3': makeRole(['perm-3'], ['level-4']),
      'level-4': makeRole(['perm-4']),
    };

    const fetch = async (id: string) => roles[id] ?? null;
    const result = await resolveRolePermissions('level-1', fetch);
    expect(result).toEqual(new Set(['perm-1', 'perm-2', 'perm-3', 'perm-4']));
  });

  it('throws CircularInheritanceError when depth exceeds max_depth', async () => {
    // Build a chain of 12 roles: A→B→C→D→E→F→G→H→I→J→K→L
    const letters = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i));
    const roles: Record<string, ReturnType<typeof makeRole>> = {};

    for (let i = 0; i < letters.length; i++) {
      const inherits = i < letters.length - 1 ? [letters[i + 1]] : [];
      roles[letters[i]] = makeRole([`perm-${letters[i]}`], inherits);
    }

    const fetch = async (id: string) => roles[id] ?? null;

    await expect(
      resolveRolePermissions('A', fetch, new Set(), 0, 5),
    ).rejects.toThrow(CircularInheritanceError);
  });
});
