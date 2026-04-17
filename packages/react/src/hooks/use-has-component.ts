import { useSyncExternalStore } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns true if the given component identifier is in the user's allowed components.
 */
export function useHasComponent(id: string): boolean {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.hasComponent(id),
    () => false,
  );
}
