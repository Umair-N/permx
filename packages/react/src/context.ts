import { createContext, useContext } from 'react';
import type { PermissionStore } from './store.js';

export const PermXContext = createContext<PermissionStore | null>(null);

/**
 * Internal hook that retrieves the store from context.
 * Throws with a clear message if used outside PermXProvider.
 */
export function usePermXStore(): PermissionStore {
  const store = useContext(PermXContext);
  if (store === null) {
    throw new Error(
      'PermX hook used outside of <PermXProvider>. ' +
        'Wrap your app with <PermXProvider> to provide permissions.',
    );
  }
  return store;
}
