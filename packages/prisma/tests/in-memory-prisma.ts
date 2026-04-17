/**
 * In-memory implementation of `PrismaClientLike` for testing.
 *
 * Supports just the operations PermX's PrismaDataProvider and seed helpers
 * call. Not a full Prisma substitute — do not use in production.
 */
import type { PrismaClientLike, PrismaDelegate } from '../src/types.js';

type Row = Record<string, unknown>;

function matches(row: Row, where: Record<string, unknown>): boolean {
  for (const [key, condition] of Object.entries(where)) {
    if (key === 'OR') {
      const alts = condition as Array<Record<string, unknown>>;
      if (!alts.some((alt) => matches(row, alt))) return false;
      continue;
    }
    const value = row[key];
    if (condition === null) {
      if (value !== null && value !== undefined) return false;
    } else if (typeof condition === 'object' && condition !== null) {
      const cond = condition as Record<string, unknown>;
      if ('in' in cond) {
        const list = cond.in as unknown[];
        if (!list.includes(value)) return false;
      } else if ('gt' in cond) {
        if (!(value instanceof Date) || value <= (cond.gt as Date)) return false;
      } else if ('not' in cond) {
        if (value === cond.not) return false;
      } else {
        // nested equality on object — unsupported, treat as equal check
        if (JSON.stringify(value) !== JSON.stringify(condition)) return false;
      }
    } else {
      if (value !== condition) return false;
    }
  }
  return true;
}

function cuid(): string {
  return 'c' + Math.random().toString(36).slice(2, 14);
}

interface Store {
  modules: Row[];
  permissions: Row[];
  roles: Row[];
  rolePermissions: Row[];
  roleInheritance: Row[];
  userRoles: Row[];
  userRoleAdditional: Row[];
  userRoleExcluded: Row[];
}

function makeDelegate(
  store: Store,
  table: keyof Store,
  opts: { idFields?: string[]; autoId?: boolean; includes?: IncludeMap } = {},
): PrismaDelegate<Row> {
  const { idFields = ['id'], autoId = true, includes = {} } = opts;
  const list = () => store[table];

  const applyInclude = (row: Row, include: unknown): Row => {
    if (!include || typeof include !== 'object') return row;
    const inc = include as Record<string, unknown>;
    const out: Row = { ...row };
    for (const [key, value] of Object.entries(inc)) {
      const handler = includes[key];
      if (!handler) continue;
      const nested = handler(row, store, value);
      out[key] = nested;
    }
    return out;
  };

  return {
    async findUnique({ where, include }) {
      const row = list().find((r) => matches(r, where));
      return row ? applyInclude(row, include) : null;
    },
    async findFirst({ where, include }) {
      const row = list().find((r) => matches(r, where));
      return row ? applyInclude(row, include) : null;
    },
    async findMany(args = {}) {
      let rows = args.where ? list().filter((r) => matches(r, args.where!)) : [...list()];
      if (args.orderBy) {
        const [field, dir] = Object.entries(args.orderBy)[0]!;
        rows.sort((a, b) => {
          const av = a[field] as number;
          const bv = b[field] as number;
          return dir === 'asc' ? av - bv : bv - av;
        });
      }
      return rows.map((r) => applyInclude(r, args.include));
    },
    async create({ data, include }) {
      const row: Row = { ...data };
      if (autoId && idFields.length === 1 && !row[idFields[0]!]) {
        row[idFields[0]!] = cuid();
      }
      for (const field of ['assignedAt', 'createdAt', 'updatedAt']) {
        if (!(field in row) && table === 'userRoles' && field === 'assignedAt') {
          row[field] = new Date();
        }
      }
      list().push(row);
      return applyInclude(row, include);
    },
    async update({ where, data }) {
      const row = list().find((r) => matches(r, where));
      if (!row) throw new Error(`No row matches ${JSON.stringify(where)}`);
      Object.assign(row, data);
      return row;
    },
    async upsert({ where, create, update }) {
      const existing = list().find((r) => matches(r, where));
      if (existing) {
        Object.assign(existing, update);
        return existing;
      }
      const row: Row = { ...create };
      if (autoId && idFields.length === 1 && !row[idFields[0]!]) {
        row[idFields[0]!] = cuid();
      }
      list().push(row);
      return row;
    },
    async delete({ where }) {
      const idx = list().findIndex((r) => matches(r, where));
      if (idx === -1) throw new Error(`No row matches ${JSON.stringify(where)}`);
      const [row] = list().splice(idx, 1);
      return row!;
    },
    async deleteMany(args = {}) {
      const before = list().length;
      if (args.where) {
        store[table] = list().filter((r) => !matches(r, args.where!)) as Row[];
      } else {
        store[table] = [];
      }
      return { count: before - list().length };
    },
    async count(args = {}) {
      return args.where ? list().filter((r) => matches(r, args.where!)).length : list().length;
    },
  };
}

type IncludeMap = Record<string, (row: Row, store: Store, value: unknown) => unknown>;

export function createInMemoryPrisma(): PrismaClientLike & { __store: Store } {
  const store: Store = {
    modules: [],
    permissions: [],
    roles: [],
    rolePermissions: [],
    roleInheritance: [],
    userRoles: [],
    userRoleAdditional: [],
    userRoleExcluded: [],
  };

  const permissionIncludes: IncludeMap = {};

  const roleIncludes: IncludeMap = {
    permissions: (row, s, value) => {
      const rps = s.rolePermissions.filter((rp) => rp.roleId === row.id);
      if (value && typeof value === 'object' && 'include' in (value as Record<string, unknown>)) {
        const innerInc = (value as { include?: Record<string, unknown> }).include ?? {};
        return rps.map((rp) => {
          const expanded: Row = { ...rp };
          if (innerInc.permission) {
            expanded.permission = s.permissions.find((p) => p.id === rp.permissionId) ?? null;
          }
          return expanded;
        });
      }
      return rps;
    },
    parents: (row, s) => s.roleInheritance.filter((ri) => ri.childId === row.id),
    children: (row, s) => s.roleInheritance.filter((ri) => ri.parentId === row.id),
  };

  const userRoleIncludes: IncludeMap = {
    role: (row, s, value) => {
      const role = s.roles.find((r) => r.id === row.roleId);
      if (!role) return null;
      if (value && typeof value === 'object' && 'include' in (value as Record<string, unknown>)) {
        const innerInc = (value as { include?: Record<string, unknown> }).include ?? {};
        const expanded: Row = { ...role };
        if (innerInc.permissions) {
          expanded.permissions = (roleIncludes.permissions!)(role, s, innerInc.permissions);
        }
        if (innerInc.parents) {
          expanded.parents = (roleIncludes.parents!)(role, s, innerInc.parents);
        }
        return expanded;
      }
      return role;
    },
    additionalPermissions: (row, s) =>
      s.userRoleAdditional.filter((a) => a.userRoleId === row.id),
    excludedPermissions: (row, s) => s.userRoleExcluded.filter((e) => e.userRoleId === row.id),
  };

  const client: PrismaClientLike = {
    permXModule: makeDelegate(store, 'modules'),
    permXPermission: makeDelegate(store, 'permissions', { includes: permissionIncludes }),
    permXRole: makeDelegate(store, 'roles', { includes: roleIncludes }),
    permXRolePermission: makeDelegate(store, 'rolePermissions', {
      idFields: ['roleId', 'permissionId'],
      autoId: false,
    }),
    permXRoleInheritance: makeDelegate(store, 'roleInheritance', {
      idFields: ['childId', 'parentId'],
      autoId: false,
    }),
    permXUserRole: makeDelegate(store, 'userRoles', { includes: userRoleIncludes }),
    permXUserRoleAdditional: makeDelegate(store, 'userRoleAdditional', {
      idFields: ['userRoleId', 'permissionId'],
      autoId: false,
    }),
    permXUserRoleExcluded: makeDelegate(store, 'userRoleExcluded', {
      idFields: ['userRoleId', 'permissionId'],
      autoId: false,
    }),
    async $transaction(fn) {
      return fn(client);
    },
  };

  return Object.assign(client, { __store: store });
}
