import type { ReactElement } from 'react';
import { useHasPermission } from '../hooks/use-has-permission.js';
import type { FeatureGateProps } from '../types.js';

/**
 * Subscription/feature gate keyed on a permission.
 *
 * - If allowed: renders children.
 * - If denied and `renderOverlay` is provided: renders children AND overlay
 *   (use for upgrade-prompt patterns where the feature is visible but blocked).
 * - If denied and no overlay: renders `fallback`.
 */
export function FeatureGate({
  permission,
  children,
  fallback = null,
  renderOverlay,
}: FeatureGateProps): ReactElement | null {
  const allowed = useHasPermission(permission);

  if (allowed) {
    return <>{children}</>;
  }

  if (renderOverlay) {
    return (
      <>
        {children}
        {renderOverlay()}
      </>
    );
  }

  return <>{fallback}</>;
}
