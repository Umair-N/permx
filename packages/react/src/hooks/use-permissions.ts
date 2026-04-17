import { useSyncExternalStore } from 'react';
import type { EffectivePermissions } from '@permx/core';
import { usePermXStore } from '../context.js';

const EMPTY_PERMISSIONS: EffectivePermissions = {
  permissions: [],
  structured_permissions: [],
  ui_mappings: { routes: [], components: [], fields: [] },
  modules: [],
};

/**
 * Returns the raw EffectivePermissions payload as received from fetchPermissions.
 * Returns an empty payload before the first fetch resolves.
 */
export function usePermissions(): EffectivePermissions {
  const store = usePermXStore();
  return useSyncExternalStore(
    store.subscribe,
    () => store.getSnapshot().raw ?? EMPTY_PERMISSIONS,
    () => EMPTY_PERMISSIONS,
  );
}
