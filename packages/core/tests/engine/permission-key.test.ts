import { describe, it, expect } from 'vitest';
import { buildDerivedKey, parsePermissionKey } from '../../src/engine/permission-key.js';

describe('buildDerivedKey', () => {
  it('builds key with all segments', () => {
    expect(
      buildDerivedKey({ module: 'people', resource: 'employees', action: 'view', scope: 'own', field: 'salary' }),
    ).toBe('people.employees:salary.view.own');
  });

  it('builds key without field', () => {
    expect(
      buildDerivedKey({ module: 'clients', resource: 'clients', action: 'view', scope: 'all' }),
    ).toBe('clients.clients.view.all');
  });

  it('builds key without scope', () => {
    expect(
      buildDerivedKey({ module: 'clients', resource: 'clients', action: 'manage' }),
    ).toBe('clients.clients.manage');
  });

  it('lowercases everything', () => {
    expect(
      buildDerivedKey({ module: 'People', resource: 'Employees', action: 'view', scope: 'all' }),
    ).toBe('people.employees.view.all');
  });

  it('handles subscription-style keys', () => {
    expect(
      buildDerivedKey({ module: 'subscription', resource: 'sso', action: 'manage' }),
    ).toBe('subscription.sso.manage');
  });
});

describe('parsePermissionKey', () => {
  it('parses key with field segment', () => {
    expect(parsePermissionKey('people.employees:salary.view.own')).toEqual({
      module: 'people',
      resource: 'employees',
      field: 'salary',
      action: 'view',
      scope: 'own',
    });
  });

  it('parses key without field', () => {
    expect(parsePermissionKey('clients.clients.view.all')).toEqual({
      module: 'clients',
      resource: 'clients',
      field: undefined,
      action: 'view',
      scope: 'all',
    });
  });

  it('parses key without scope', () => {
    expect(parsePermissionKey('clients.clients.manage')).toEqual({
      module: 'clients',
      resource: 'clients',
      field: undefined,
      action: 'manage',
      scope: undefined,
    });
  });

  it('parses subscription-style two-segment key', () => {
    const result = parsePermissionKey('subscription.sso');
    expect(result.module).toBe('subscription');
    expect(result.resource).toBe('sso');
  });

  it('handles single-segment key gracefully', () => {
    const result = parsePermissionKey('admin');
    expect(result.module).toBe('admin');
    expect(result.resource).toBe('');
  });

  it('roundtrips with buildDerivedKey', () => {
    const original = { module: 'people', resource: 'employees', action: 'view' as const, scope: 'own' as const, field: 'salary' };
    const key = buildDerivedKey(original);
    const parsed = parsePermissionKey(key);

    expect(parsed.module).toBe(original.module);
    expect(parsed.resource).toBe(original.resource);
    expect(parsed.action).toBe(original.action);
    expect(parsed.scope).toBe(original.scope);
    expect(parsed.field).toBe(original.field);
  });
});
