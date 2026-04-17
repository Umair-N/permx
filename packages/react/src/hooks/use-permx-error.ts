import { useSyncExternalStore } from 'react';
import { usePermXStore } from '../context.js';

/**
 * Returns the current fetch error, or `null` if the last fetch succeeded or
 * is still pending.
 *
 * Use when you need programmatic access to the error outside of
 * `<PermXProvider>`'s `errorFallback` — for example to show a toast or log
 * the error from a child component.
 */
export function usePermXError(): Error | null {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().error,
    () => null,
  );
}
