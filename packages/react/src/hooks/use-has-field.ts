import { useSyncExternalStore } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns true if the given field identifier is in the user's allowed fields.
 */
export function useHasField(id: string): boolean {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.hasField(id),
    () => false,
  );
}
