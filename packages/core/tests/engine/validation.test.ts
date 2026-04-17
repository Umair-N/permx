import { describe, it, expect } from 'vitest';
import {
  validateUserId,
  assertPermissionKey,
  isValidPermissionKey,
  validateTenantId,
  validateNonEmptyString,
} from '../../src/validation.js';
import { ValidationError } from '../../src/errors.js';

describe('validateUserId', () => {
  it('accepts valid string', () => {
    expect(() => validateUserId('user-1')).not.toThrow();
  });

  it('rejects null', () => {
    expect(() => validateUserId(null)).toThrow(ValidationError);
  });

  it('rejects undefined', () => {
    expect(() => validateUserId(undefined)).toThrow(ValidationError);
  });

  it('rejects empty string', () => {
    expect(() => validateUserId('')).toThrow(ValidationError);
  });

  it('rejects whitespace-only string', () => {
    expect(() => validateUserId('   ')).toThrow(ValidationError);
  });

  it('rejects number', () => {
    expect(() => validateUserId(123)).toThrow(ValidationError);
  });

  it('thrown error has field userId', () => {
    try {
      validateUserId(null);
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).field).toBe('userId');
    }
  });
});

describe('assertPermissionKey', () => {
  it('accepts clients.view.all', () => {
    expect(() => assertPermissionKey('clients.view.all')).not.toThrow();
  });

  it('accepts people.employees:salary.view.own (field notation)', () => {
    expect(() => assertPermissionKey('people.employees:salary.view.own')).not.toThrow();
  });

  it('accepts subscription.sso (2 segments)', () => {
    expect(() => assertPermissionKey('subscription.sso')).not.toThrow();
  });

  it('accepts module.resource.action.scope.extra (5 segments)', () => {
    expect(() => assertPermissionKey('module.resource.action.scope.extra')).not.toThrow();
  });

  it('rejects empty string', () => {
    expect(() => assertPermissionKey('')).toThrow(ValidationError);
  });

  it('rejects single word admin (no dot)', () => {
    expect(() => assertPermissionKey('admin')).toThrow(ValidationError);
  });

  it('rejects uppercase Clients.View.All', () => {
    expect(() => assertPermissionKey('Clients.View.All')).toThrow(ValidationError);
  });

  it('rejects empty segments clients..view', () => {
    expect(() => assertPermissionKey('clients..view')).toThrow(ValidationError);
  });

  it('rejects trailing dot clients.view.', () => {
    expect(() => assertPermissionKey('clients.view.')).toThrow(ValidationError);
  });

  it('rejects leading dot .clients.view', () => {
    expect(() => assertPermissionKey('.clients.view')).toThrow(ValidationError);
  });

  it('rejects special characters clients.view.all!', () => {
    expect(() => assertPermissionKey('clients.view.all!')).toThrow(ValidationError);
  });

  it('rejects very long string (>256 chars)', () => {
    const longKey = 'a.' + 'b'.repeat(256);
    expect(() => assertPermissionKey(longKey)).toThrow(ValidationError);
  });

  it('rejects null bytes', () => {
    expect(() => assertPermissionKey('clients.view\0.all')).toThrow(ValidationError);
  });

  it('thrown error has field permissionKey', () => {
    try {
      assertPermissionKey('');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).field).toBe('permissionKey');
    }
  });
});

describe('isValidPermissionKey', () => {
  it('returns true for valid key', () => {
    expect(isValidPermissionKey('clients.view.all')).toBe(true);
  });

  it('returns false for invalid key', () => {
    expect(isValidPermissionKey('admin')).toBe(false);
  });

  it('does not throw', () => {
    expect(() => isValidPermissionKey('!!invalid!!')).not.toThrow();
  });
});

describe('validateTenantId', () => {
  it('accepts valid string when tenancy enabled', () => {
    expect(() => validateTenantId('tenant-1', true)).not.toThrow();
  });

  it('rejects empty string when tenancy enabled', () => {
    expect(() => validateTenantId('', true)).toThrow(ValidationError);
  });

  it('passes through when tenancy disabled even with empty string', () => {
    expect(() => validateTenantId('', false)).not.toThrow();
  });
});

describe('validateNonEmptyString', () => {
  it('accepts valid string', () => {
    expect(() => validateNonEmptyString('hello', 'myField')).not.toThrow();
  });

  it('rejects empty string with correct field name', () => {
    try {
      validateNonEmptyString('', 'serviceName');
      expect.unreachable('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ValidationError);
      expect((err as ValidationError).field).toBe('serviceName');
    }
  });
});
