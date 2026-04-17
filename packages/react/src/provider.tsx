import { useEffect, useRef, useSyncExternalStore, type ReactElement, type ReactNode } from 'react';
import { PermXContext } from './context.js';
import { createPermissionStore, type PermissionStore } from './store.js';
import type { PermXProviderProps } from './types.js';

/**
 * Provides the permission store to descendants and fetches permissions on mount.
 *
 * Rendering:
 * - Initial fetch pending → `fallback`
 * - Fetch failed         → `errorFallback(error, retry)` if provided, else `fallback`
 * - Fetch succeeded      → `children`
 *
 * Descendants can trigger a refetch via `usePermXRefresh()` after a server-side
 * role change to pick up fresh permissions without reloading the page.
 */
export function PermXProvider({
  fetchPermissions,
  superAdmin = false,
  children,
  fallback = null,
  errorFallback,
  onError,
}: PermXProviderProps): ReactElement {
  const storeRef = useRef<PermissionStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createPermissionStore();
  }
  const store = storeRef.current;

  const snapshot = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );

  useEffect(() => {
    store.configure(fetchPermissions, superAdmin);
    let cancelled = false;

    store.refresh().then((result) => {
      if (!cancelled && !result.ok) {
        onError?.(result.error);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [fetchPermissions, superAdmin, store, onError]);

  let content: ReactNode;
  if (snapshot.error && errorFallback) {
    content = errorFallback(snapshot.error, () => {
      void store.refresh().then((result) => {
        if (!result.ok) onError?.(result.error);
      });
    });
  } else if (snapshot.is_ready) {
    content = children;
  } else {
    content = fallback;
  }

  return <PermXContext.Provider value={store}>{content}</PermXContext.Provider>;
}
