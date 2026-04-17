import { describe, it, expect } from 'vitest';
import { matchPathPattern } from '../../src/engine/path-matcher.js';

describe('matchPathPattern', () => {
  it('matches exact paths', () => {
    expect(matchPathPattern('/clients', '/clients')).toBe(true);
  });

  it('matches parameterized paths', () => {
    expect(matchPathPattern('/clients/:id', '/clients/123')).toBe(true);
  });

  it('matches multiple params', () => {
    expect(matchPathPattern('/clients/:id/roles/:roleId', '/clients/123/roles/456')).toBe(true);
  });

  it('rejects different segment count', () => {
    expect(matchPathPattern('/clients/:id', '/clients/123/extra')).toBe(false);
  });

  it('rejects non-matching static segments', () => {
    expect(matchPathPattern('/clients', '/users')).toBe(false);
  });

  it('matches root path', () => {
    expect(matchPathPattern('/', '/')).toBe(true);
  });

  it('rejects longer actual path', () => {
    expect(matchPathPattern('/api/v1', '/api/v1/users')).toBe(false);
  });
});
