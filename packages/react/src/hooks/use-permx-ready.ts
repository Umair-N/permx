import { useSyncExternalStore } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns true once the initial permissions fetch has resolved.
 * Useful for rendering loading states in components that live below PermXProvider.
 */
export function usePermXReady(): boolean {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().is_ready,
    () => false,
  );
}
