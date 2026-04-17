import type { ReactElement } from 'react';
import { useHasComponent } from '../hooks/use-has-component.js';
import type { CanProps } from '../types.js';

/**
 * Renders children when the given component id is in the user's allowed
 * components (or the user is a super admin). Otherwise renders `fallback`.
 */
export function Can({ componentId, children, fallback = null }: CanProps): ReactElement | null {
  const allowed = useHasComponent(componentId);
  return <>{allowed ? children : fallback}</>;
}
