// Provider
export { PermXProvider } from './provider.js';

// Gate components
export { Can } from './components/can.js';
export { CanField } from './components/can-field.js';
export { RouteGuard } from './components/route-guard.js';
export { FeatureGate } from './components/feature-gate.js';

// Hooks
export { useHasPermission } from './hooks/use-has-permission.js';
export { useHasRoute } from './hooks/use-has-route.js';
export { useHasComponent } from './hooks/use-has-component.js';
export { useHasField } from './hooks/use-has-field.js';
export { usePermissions } from './hooks/use-permissions.js';
export { usePermXReady } from './hooks/use-permx-ready.js';
export { usePermXRefresh } from './hooks/use-permx-refresh.js';
export { usePermXError } from './hooks/use-permx-error.js';

// Store (advanced: custom providers, testing, SSR hydration)
export { createPermissionStore, PermissionStore } from './store.js';

// Types
export type {
  PermXProviderProps,
  CanProps,
  CanFieldProps,
  RouteGuardProps,
  FeatureGateProps,
  PermissionState,
} from './types.js';
