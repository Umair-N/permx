import { useSyncExternalStore } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns true if the user has the given permission key (or is a super admin).
 */
export function useHasPermission(key: string): boolean {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.hasPermission(key),
    () => false,
  );
}
