import { describe, it, expect } from 'vitest';
import {
  PermXError,
  PermissionDeniedError,
  CircularInheritanceError,
  RoleNotFoundError,
  PermissionNotFoundError,
  ValidationError,
  DataProviderError,
} from '../../src/errors.js';

describe('PermXError', () => {
  it('sets message, code, and statusCode', () => {
    const err = new PermXError('test', 'TEST', 400);
    expect(err.message).toBe('test');
    expect(err.code).toBe('TEST');
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe('PermXError');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('PermissionDeniedError', () => {
  it('has correct defaults', () => {
    const err = new PermissionDeniedError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('PERMISSION_DENIED');
    expect(err.name).toBe('PermissionDeniedError');
  });

  it('accepts custom message', () => {
    const err = new PermissionDeniedError('Custom denied');
    expect(err.message).toBe('Custom denied');
  });
});

describe('CircularInheritanceError', () => {
  it('includes chain in message', () => {
    const err = new CircularInheritanceError(['a', 'b', 'a']);
    expect(err.message).toContain('a → b → a');
    expect(err.chain).toEqual(['a', 'b', 'a']);
    expect(err.statusCode).toBe(400);
  });
});

describe('RoleNotFoundError', () => {
  it('includes role ID', () => {
    const err = new RoleNotFoundError('role-123');
    expect(err.message).toContain('role-123');
    expect(err.statusCode).toBe(404);
  });
});

describe('PermissionNotFoundError', () => {
  it('includes identifier', () => {
    const err = new PermissionNotFoundError('clients.view.all');
    expect(err.message).toContain('clients.view.all');
    expect(err.statusCode).toBe(404);
  });
});

describe('ValidationError', () => {
  it('has statusCode 400', () => {
    const err = new ValidationError('bad input', 'email');
    expect(err.statusCode).toBe(400);
  });

  it('has code VALIDATION_ERROR', () => {
    const err = new ValidationError('bad input', 'email');
    expect(err.code).toBe('VALIDATION_ERROR');
  });

  it('has name ValidationError', () => {
    const err = new ValidationError('bad input', 'email');
    expect(err.name).toBe('ValidationError');
  });

  it('stores field property', () => {
    const err = new ValidationError('bad input', 'email');
    expect(err.field).toBe('email');
  });

  it('is instanceof PermXError', () => {
    const err = new ValidationError('bad input', 'email');
    expect(err).toBeInstanceOf(PermXError);
  });
});

describe('DataProviderError', () => {
  const context = { operation: 'fetchRoles', userId: 'u-1' };

  it('has statusCode 500', () => {
    const err = new DataProviderError('provider failed', context);
    expect(err.statusCode).toBe(500);
  });

  it('has code DATA_PROVIDER_ERROR', () => {
    const err = new DataProviderError('provider failed', context);
    expect(err.code).toBe('DATA_PROVIDER_ERROR');
  });

  it('has name DataProviderError', () => {
    const err = new DataProviderError('provider failed', context);
    expect(err.name).toBe('DataProviderError');
  });

  it('stores context object', () => {
    const err = new DataProviderError('provider failed', context);
    expect(err.context).toEqual({ operation: 'fetchRoles', userId: 'u-1' });
  });

  it('stores cause', () => {
    const original = new Error('connection refused');
    const err = new DataProviderError('provider failed', context, original);
    expect(err.cause).toBe(original);
  });

  it('is instanceof PermXError', () => {
    const err = new DataProviderError('provider failed', context);
    expect(err).toBeInstanceOf(PermXError);
  });
});

describe('PermXError.isPermXError', () => {
  it('returns true for PermXError instances', () => {
    const err = new PermXError('test', 'TEST', 500);
    expect(PermXError.isPermXError(err)).toBe(true);
  });

  it('returns true for ValidationError instances (subclass)', () => {
    const err = new ValidationError('bad', 'field');
    expect(PermXError.isPermXError(err)).toBe(true);
  });

  it('returns false for plain Error', () => {
    expect(PermXError.isPermXError(new Error('plain'))).toBe(false);
  });

  it('returns false for null/undefined', () => {
    expect(PermXError.isPermXError(null)).toBe(false);
    expect(PermXError.isPermXError(undefined)).toBe(false);
  });
});
