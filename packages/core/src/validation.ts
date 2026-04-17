import { ValidationError } from './errors.js';

const MAX_KEY_LENGTH = 256;

/**
 * Permission key format: module.resource.action[.scope]
 * With field: module.resource:field.action[.scope]
 *
 * - 2-5 dot-separated segments
 * - Lowercase alphanumeric + underscore + dash
 * - Optional colon in any segment for field notation
 * - Each segment starts with a letter
 *
 * ReDoS-safe: bounded quantifiers, no overlapping character classes.
 */
const PERMISSION_KEY_PATTERN = /^[a-z][a-z0-9_-]*(\.[a-z][a-z0-9_-]*(:[a-z][a-z0-9_-]*)?){1,4}$/;

/**
 * Validate that a value is a non-empty string suitable for use as a user ID.
 * Throws ValidationError if the value is not a valid user ID.
 */
export function validateUserId(userId: unknown): asserts userId is string {
  if (typeof userId !== 'string' || userId.trim().length === 0) {
    throw new ValidationError(
      'userId must be a non-empty string',
      'userId',
    );
  }
}

/**
 * Assert that a value is a valid structured permission key.
 * Throws ValidationError if the key is malformed.
 *
 * Format: `module.resource.action[.scope]` or `module.resource:field.action[.scope]`
 */
export function assertPermissionKey(key: unknown): asserts key is string {
  if (typeof key !== 'string') {
    throw new ValidationError(
      'permissionKey must be a string',
      'permissionKey',
    );
  }

  if (key.length === 0) {
    throw new ValidationError(
      'permissionKey must not be empty',
      'permissionKey',
    );
  }

  if (key.length > MAX_KEY_LENGTH) {
    throw new ValidationError(
      `permissionKey must not exceed ${MAX_KEY_LENGTH} characters`,
      'permissionKey',
    );
  }

  if (key.includes('\0')) {
    throw new ValidationError(
      'permissionKey must not contain null bytes',
      'permissionKey',
    );
  }

  if (!PERMISSION_KEY_PATTERN.test(key)) {
    throw new ValidationError(
      `permissionKey '${key}' does not match the required format. ` +
      `Expected: module.resource.action[.scope] (e.g. 'clients.clients.view.all'). ` +
      `Keys must be lowercase, dot-separated, with 2-5 segments.`,
      'permissionKey',
    );
  }
}

/**
 * Check whether a string is a valid structured permission key.
 * Returns a boolean instead of throwing.
 */
export function isValidPermissionKey(key: string): boolean {
  if (typeof key !== 'string') return false;
  if (key.length === 0 || key.length > MAX_KEY_LENGTH) return false;
  if (key.includes('\0')) return false;
  return PERMISSION_KEY_PATTERN.test(key);
}

/**
 * Validate that a tenant ID is present when multi-tenancy is enabled.
 * When tenancy is disabled, this is a no-op.
 */
export function validateTenantId(
  tenantId: unknown,
  tenancyEnabled: boolean,
): asserts tenantId is string {
  if (!tenancyEnabled) return;

  if (typeof tenantId !== 'string' || tenantId.trim().length === 0) {
    throw new ValidationError(
      'tenantId is required when multi-tenancy is enabled',
      'tenantId',
    );
  }
}

/**
 * Validate that a value is a non-empty string.
 * Used for service, method, and path parameters in authorizeApi.
 */
export function validateNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(
      `${field} must be a non-empty string`,
      field,
    );
  }
}
