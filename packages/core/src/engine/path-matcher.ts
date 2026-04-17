/**
 * Match a URL path against a pattern with :param placeholders.
 *
 *
 * @example
 * matchPathPattern('/clients/:id', '/clients/123')        // true
 * matchPathPattern('/clients/:id/roles', '/clients/123/roles') // true
 * matchPathPattern('/clients/:id', '/clients/123/extra')   // false
 * matchPathPattern('/clients', '/users')                   // false
 */
export function matchPathPattern(pattern: string, actual: string): boolean {
  const pattern_parts = pattern.split('/');
  const actual_parts = actual.split('/');

  if (pattern_parts.length !== actual_parts.length) return false;

  return pattern_parts.every((part, i) => {
    if (part.startsWith(':')) return true;
    return part === actual_parts[i];
  });
}
