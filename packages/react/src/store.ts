import type { EffectivePermissions } from '@permx/core';
import type { PermissionState } from './types.js';

type Listener = () => void;
type Fetcher = () => Promise<EffectivePermissions>;

const INITIAL_STATE: PermissionState = {
  permissions: new Set(),
  routes: new Set(),
  components: new Set(),
  fields: new Set(),
  modules: [],
  raw: null,
  is_ready: false,
  is_super_admin: false,
  error: null,
};

/**
 * Framework-agnostic permission store.
 *
 * Exposes a `useSyncExternalStore`-compatible API (subscribe + getSnapshot).
 * Holds the fetcher so consumers can call `refresh()` after role changes
 * without re-mounting the provider.
 */
export class PermissionStore {
  private state: PermissionState = INITIAL_STATE;
  private readonly listeners = new Set<Listener>();
  private fetcher: Fetcher | null = null;
  private superAdmin = false;
  private fetchToken = 0;

  getSnapshot = (): PermissionState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  /** Wire the store up to a fetcher. Called by the provider on mount. */
  configure(fetcher: Fetcher, superAdmin: boolean): void {
    this.fetcher = fetcher;
    this.superAdmin = superAdmin;
  }

  /**
   * Trigger a (re)fetch. Safe to call multiple times — stale responses are
   * discarded via an internal token so the last call wins.
   *
   * Returns a promise that resolves to `{ ok: true }` on success or
   * `{ ok: false, error }` on failure. Errors are also stored on state so
   * the UI can render `errorFallback`.
   */
  async refresh(): Promise<{ ok: true } | { ok: false; error: Error }> {
    if (!this.fetcher) {
      const error = new Error('PermissionStore.refresh() called before configure()');
      return { ok: false, error };
    }

    const token = ++this.fetchToken;
    try {
      const data = await this.fetcher();
      if (token !== this.fetchToken) return { ok: true };
      this.hydrate(data, this.superAdmin);
      return { ok: true };
    } catch (err) {
      if (token !== this.fetchToken) return { ok: true };
      const error = err instanceof Error ? err : new Error(String(err));
      this.setError(error);
      return { ok: false, error };
    }
  }

  hydrate(data: EffectivePermissions, superAdmin = false): void {
    this.state = {
      permissions: new Set(data.permissions),
      routes: new Set(data.ui_mappings.routes),
      components: new Set(data.ui_mappings.components),
      fields: new Set(data.ui_mappings.fields),
      modules: data.modules,
      raw: data,
      is_ready: true,
      is_super_admin: superAdmin,
      error: null,
    };
    this.notify();
  }

  setError(error: Error): void {
    this.state = { ...this.state, error };
    this.notify();
  }

  clear(): void {
    this.state = INITIAL_STATE;
    this.notify();
  }

  hasPermission(key: string): boolean {
    return this.state.is_super_admin || this.state.permissions.has(key);
  }

  hasRoute(id: string): boolean {
    return this.state.is_super_admin || this.state.routes.has(id);
  }

  hasComponent(id: string): boolean {
    return this.state.is_super_admin || this.state.components.has(id);
  }

  hasField(id: string): boolean {
    return this.state.is_super_admin || this.state.fields.has(id);
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener());
  }
}

export function createPermissionStore(): PermissionStore {
  return new PermissionStore();
}
