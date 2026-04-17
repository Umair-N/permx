import type { PermissionAction, PermissionScope } from '../types/permission.js';
import { buildDerivedKey } from './permission-key.js';

/**
 * One entry in a `definePermissions` schema. The shape is preserved in the
 * return type so callers get autocomplete on the resulting key strings.
 */
export interface PermissionDefinition<
  M extends string = string,
  R extends string = string,
  A extends PermissionAction = PermissionAction,
  S extends PermissionScope | undefined = PermissionScope | undefined,
  F extends string | undefined = string | undefined,
> {
  module: M;
  resource: R;
  action: A;
  scope?: S;
  field?: F;
}

type BuildKey<
  M extends string,
  R extends string,
  A extends string,
  S extends string | undefined,
  F extends string | undefined,
> = F extends string
  ? S extends string
    ? `${Lowercase<M>}.${Lowercase<R>}:${Lowercase<F>}.${Lowercase<A>}.${Lowercase<S>}`
    : `${Lowercase<M>}.${Lowercase<R>}:${Lowercase<F>}.${Lowercase<A>}`
  : S extends string
    ? `${Lowercase<M>}.${Lowercase<R>}.${Lowercase<A>}.${Lowercase<S>}`
    : `${Lowercase<M>}.${Lowercase<R>}.${Lowercase<A>}`;

type KeysFromSchema<T> = {
  [K in keyof T]: T[K] extends PermissionDefinition<
    infer M,
    infer R,
    infer A,
    infer S,
    infer F
  >
    ? BuildKey<M, R, A, S & (string | undefined), F & (string | undefined)>
    : never;
};

/**
 * Define permissions as a typed object — get autocomplete and literal-type
 * permission keys across your codebase.
 *
 * @example
 * const P = definePermissions({
 *   projectsView: { module: 'projects', resource: 'tasks', action: 'view', scope: 'all' },
 *   projectsEdit: { module: 'projects', resource: 'tasks', action: 'update', scope: 'own' },
 * } as const);
 *
 * P.projectsView; // type: "projects.tasks.view.all"
 * await permx.authorize(userId, P.projectsView); // autocompletes
 */
export function definePermissions<
  const T extends Readonly<Record<string, PermissionDefinition>>,
>(schema: T): Readonly<KeysFromSchema<T>> {
  const out = {} as Record<string, string>;
  for (const name of Object.keys(schema)) {
    const def = schema[name]!;
    out[name] = buildDerivedKey({
      module: def.module,
      resource: def.resource,
      action: def.action,
      scope: def.scope,
      field: def.field,
    });
  }
  return out as Readonly<KeysFromSchema<T>>;
}

/**
 * Extract the union of permission key strings from a `definePermissions` result.
 *
 * @example
 * const P = definePermissions({ ... } as const);
 * type AppPermission = PermissionKeyOf<typeof P>;
 * // type AppPermission = "projects.tasks.view.all" | "projects.tasks.update.own"
 */
export type PermissionKeyOf<T extends Record<string, string>> = T[keyof T];
