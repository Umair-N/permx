import type { ReactElement } from 'react';
import { useHasField } from '../hooks/use-has-field.js';
import type { CanFieldProps } from '../types.js';

/**
 * Renders children when the given field id is in the user's allowed fields
 * (or the user is a super admin). Otherwise renders `fallback`.
 */
export function CanField({ fieldId, children, fallback = null }: CanFieldProps): ReactElement | null {
  const allowed = useHasField(fieldId);
  return <>{allowed ? children : fallback}</>;
}
