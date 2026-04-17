import { useCallback } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns a stable `refresh()` function that re-fetches permissions from the
 * configured endpoint.
 *
 * Use after a server-side role change so the UI picks up new permissions
 * without reloading the page. Pair with a backend `permx.invalidateUser(id)`
 * call to ensure the endpoint returns fresh data.
 *
 * The returned promise resolves to `{ ok: true }` or `{ ok: false, error }`.
 *
 * @example
 * const refresh = usePermXRefresh();
 *
 * async function onRoleChanged() {
 *   await fetch('/api/my-role', { method: 'POST', body: ... });
 *   await refresh();
 * }
 */
export function usePermXRefresh(): () => Promise<{ ok: true } | { ok: false; error: Error }> {
  const store = usePermXStore();
  return useCallback(() => store.refresh(), [store]);
}
