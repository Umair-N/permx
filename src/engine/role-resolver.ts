import { CircularInheritanceError } from '../errors.js';

/**
 * DFS role permission resolver with diamond and cycle protection.
 *
 * Resolves the effective (own + inherited) permission IDs for a role.
 * Uses a visited set to handle diamond inheritance without duplicates
 * and prevent infinite loops from circular inheritance.
 *
 * Database-agnostic — accepts a `fetchRole` callback.
 */

export type FetchRoleFn = (roleId: string) => Promise<{
  permissions: Array<{ _id: string }>;
  inherits_from: string[];
} | null>;

const DEFAULT_MAX_DEPTH = 10;

/**
 * Resolve all permission IDs a role grants, recursively following inheritance.
 *
 * @param max_depth Maximum inheritance depth before throwing (default 10).
 *                  Prevents DoS from extremely deep (but non-circular) hierarchies.
 */
export async function resolveRolePermissions(
  roleId: string | null | undefined,
  fetchRole: FetchRoleFn,
  visited: Set<string> = new Set(),
  depth: number = 0,
  max_depth: number = DEFAULT_MAX_DEPTH,
): Promise<Set<string>> {
  if (!roleId) return new Set();

  if (depth > max_depth) {
    throw new CircularInheritanceError([...visited]);
  }

  if (visited.has(roleId)) {
    return new Set();
  }
  visited.add(roleId);

  const role = await fetchRole(roleId);
  if (!role) {
    return new Set();
  }

  const permission_ids = new Set<string>(
    role.permissions.map((p) => p._id),
  );

  for (const parent_id of role.inherits_from) {
    if (!parent_id) continue;
    const parent_perms = await resolveRolePermissions(
      parent_id,
      fetchRole,
      visited,
      depth + 1,
      max_depth,
    );
    parent_perms.forEach((p) => permission_ids.add(p));
  }

  return permission_ids;
}
