import type { ReactElement } from 'react';
import { useHasRoute } from '../hooks/use-has-route.js';
import type { RouteGuardProps } from '../types.js';

/**
 * Router-agnostic route gate. Renders children when the route id is allowed,
 * otherwise renders `fallback`. Pair with a router redirect in the fallback
 * for redirect-on-deny behavior.
 */
export function RouteGuard({ routeId, children, fallback = null }: RouteGuardProps): ReactElement | null {
  const allowed = useHasRoute(routeId);
  return <>{allowed ? children : fallback}</>;
}
