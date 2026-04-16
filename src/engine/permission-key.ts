import type { ParsedPermissionKey, PermissionAction, PermissionScope } from '../types/permission.js';

export interface BuildDerivedKeyParams {
  module: string;
  resource: string;
  action: PermissionAction;
  scope?: PermissionScope;
  field?: string;
}

/**
 * Build a structured permission key from its components.
 *
 * Format: `{module}.{resource}:{field}.{action}.{scope}`
 * - field segment is optional: `{module}.{resource}.{action}.{scope}`
 *
 *
 * @example
 * buildDerivedKey({ module: 'people', resource: 'employees', action: 'view', scope: 'own', field: 'salary' })
 * // → "people.employees:salary.view.own"
 *
 * buildDerivedKey({ module: 'clients', resource: 'clients', action: 'view', scope: 'all' })
 * // → "clients.clients.view.all"
 */
export function buildDerivedKey(params: BuildDerivedKeyParams): string {
  const { module, resource, action, scope, field } = params;
  const resource_segment = field ? `${resource}:${field}` : resource;

  return [module, resource_segment, action, scope]
    .filter(Boolean)
    .join('.')
    .toLowerCase();
}

/**
 * Parse a structured permission key back into its components.
 *
 * Inverse of `buildDerivedKey`. Handles keys with and without field segments.
 *
 * @example
 * parsePermissionKey('people.employees:salary.view.own')
 * // → { module: 'people', resource: 'employees', field: 'salary', action: 'view', scope: 'own' }
 *
 * parsePermissionKey('clients.clients.view.all')
 * // → { module: 'clients', resource: 'clients', action: 'view', scope: 'all' }
 *
 * parsePermissionKey('subscription.sso')
 * // → { module: 'subscription', resource: 'sso', action: 'sso', scope: undefined }
 */
export function parsePermissionKey(key: string): ParsedPermissionKey {
  const parts = key.toLowerCase().split('.');

  if (parts.length < 2) {
    return { module: key, resource: '', action: '' };
  }

  const module = parts[0]!;
  const resource_part = parts[1]!;

  // Check for field segment: "resource:field"
  const colon_index = resource_part.indexOf(':');
  const has_field = colon_index !== -1;

  const resource = has_field
    ? resource_part.substring(0, colon_index)
    : resource_part;

  const field = has_field
    ? resource_part.substring(colon_index + 1)
    : undefined;

  const action = parts[2] ?? resource;
  const scope = parts[3];

  return {
    module,
    resource,
    action,
    scope,
    field,
  };
}
