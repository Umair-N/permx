import type { EffectivePermissions, Module } from '@permx/core';
import type { ReactNode } from 'react';

/**
 * State held by the permission store.
 * Sets are used instead of arrays for O(1) lookups in hot paths.
 */
export interface PermissionState {
  permissions: Set<string>;
  routes: Set<string>;
  components: Set<string>;
  fields: Set<string>;
  modules: readonly Module[];
  raw: EffectivePermissions | null;
  is_ready: boolean;
  is_super_admin: boolean;
  error: Error | null;
}

export interface PermXProviderProps {
  /** Called once on mount to load the user's permissions. */
  fetchPermissions: () => Promise<EffectivePermissions>;
  /** When true, all permission checks return true. */
  superAdmin?: boolean;
  children: ReactNode;
  /** Rendered until the first fetch resolves. */
  fallback?: ReactNode;
  /**
   * Rendered when the fetch fails (instead of `fallback`). Receives the error
   * and a `retry()` function. If omitted, `fallback` stays visible on error.
   */
  errorFallback?: (error: Error, retry: () => void) => ReactNode;
  /** Invoked when fetchPermissions rejects. */
  onError?: (error: Error) => void;
}

export interface CanProps {
  /** Component identifier to check against ui_mappings.components. */
  componentId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export interface CanFieldProps {
  /** Field identifier to check against ui_mappings.fields. */
  fieldId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export interface RouteGuardProps {
  /** Route identifier to check against ui_mappings.routes. */
  routeId: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export interface FeatureGateProps {
  /** Permission key the feature requires (e.g. 'subscription.sso'). */
  permission: string;
  children: ReactNode;
  /** Rendered when the permission is missing and no overlay is provided. */
  fallback?: ReactNode;
  /**
   * When provided and permission is missing, renders children AND overlay.
   * Use for upgrade-prompt patterns where the feature is visible but blocked.
   */
  renderOverlay?: () => ReactNode;
}
