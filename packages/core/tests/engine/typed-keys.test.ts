import { describe, it, expect, expectTypeOf } from 'vitest';
import { definePermissions, type PermissionKeyOf } from '../../src/engine/typed-keys.js';

describe('definePermissions', () => {
  it('builds keys from structured definitions', () => {
    const P = definePermissions({
      projectsView: { module: 'projects', resource: 'tasks', action: 'view', scope: 'all' },
      projectsEdit: { module: 'projects', resource: 'tasks', action: 'update', scope: 'own' },
    } as const);

    expect(P.projectsView).toBe('projects.tasks.view.all');
    expect(P.projectsEdit).toBe('projects.tasks.update.own');
  });

  it('handles field-level keys', () => {
    const P = definePermissions({
      viewSalary: {
        module: 'people',
        resource: 'employees',
        action: 'view',
        scope: 'own',
        field: 'salary',
      },
    } as const);

    expect(P.viewSalary).toBe('people.employees:salary.view.own');
  });

  it('handles keys without scope', () => {
    const P = definePermissions({
      ssoFeature: { module: 'subscription', resource: 'sso', action: 'view' },
    } as const);

    expect(P.ssoFeature).toBe('subscription.sso.view');
  });

  it('lowercases all segments', () => {
    const P = definePermissions({
      mixed: { module: 'Projects', resource: 'Tasks', action: 'view', scope: 'all' },
    } as const);

    expect(P.mixed).toBe('projects.tasks.view.all');
  });

  it('infers literal types for keys (type-level test)', () => {
    const P = definePermissions({
      projectsView: { module: 'projects', resource: 'tasks', action: 'view', scope: 'all' },
      viewSalary: {
        module: 'people',
        resource: 'employees',
        action: 'view',
        scope: 'own',
        field: 'salary',
      },
    } as const);

    expectTypeOf(P.projectsView).toEqualTypeOf<'projects.tasks.view.all'>();
    expectTypeOf(P.viewSalary).toEqualTypeOf<'people.employees:salary.view.own'>();

    type All = PermissionKeyOf<typeof P>;
    expectTypeOf<All>().toEqualTypeOf<'projects.tasks.view.all' | 'people.employees:salary.view.own'>();
  });
});
