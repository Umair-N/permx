import { useSyncExternalStore } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns true if the given route identifier is in the user's allowed routes.
 */
export function useHasRoute(id: string): boolean {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.hasRoute(id),
    () => false,
  );
}
