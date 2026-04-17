/**
 * Detects circular inheritance in role hierarchies.
 *
 * Database-agnostic — accepts a `fetchParents` callback.
 */

export type FetchParentsFn = (roleId: string) => Promise<string[]>;

export interface CircularCheckResult {
  circular: boolean;
  chain?: string[];
}

/**
 * Check if adding `proposed_parents` to `target_role_id` would create a cycle.
 *
 * @param targetRoleId - The role being modified (use 'new' for new roles)
 * @param proposedParents - Parent role IDs to validate
 * @param fetchParents - Callback to get a role's inherits_from array
 */
export async function detectCircularInheritance(
  targetRoleId: string,
  proposedParents: string[],
  fetchParents: FetchParentsFn,
  visited: Set<string> = new Set(),
): Promise<CircularCheckResult> {
  for (const parentId of proposedParents) {
    if (parentId === targetRoleId || visited.has(parentId)) {
      return { circular: true, chain: [...visited, parentId] };
    }

    visited.add(parentId);

    const grandparents = await fetchParents(parentId);
    if (grandparents.length > 0) {
      const result = await detectCircularInheritance(
        targetRoleId,
        grandparents,
        fetchParents,
        visited,
      );
      if (result.circular) return result;
    }
  }

  return { circular: false };
}
