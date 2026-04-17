import type { PermXConfig } from './types/config.js';
import type { PermXDataProvider } from './types/data-provider.js';
import type { AuthResult, EffectivePermissions } from './types/context.js';
import { getUserEffectivePermissions } from './engine/permission-resolver.js';
import { matchPathPattern } from './engine/path-matcher.js';
import { TtlCache } from './cache/ttl-cache.js';
import { PermXError, DataProviderError } from './errors.js';
import { validateUserId, assertPermissionKey, validateNonEmptyString, validateTenantId } from './validation.js';
import { PermXEmitter } from './events.js';
import type { PermXEventName, PermXEventMap } from './events.js';

export interface PermXInstance {
  /** Check if a user has a specific permission by key */
  authorize(userId: string, permissionKey: string, context?: { tenantId?: string }): Promise<AuthResult>;

  /** Check if a user can access an API endpoint (by service/method/path) */
  authorizeApi(userId: string, service: string, method: string, path: string, context?: { tenantId?: string }): Promise<AuthResult>;

  /** Get a user's full effective permissions with UI mappings */
  getUserPermissions(userId: string, context?: { tenantId?: string }): Promise<EffectivePermissions>;

  /** Get the cached API permission map */
  getApiMap(): Promise<Array<{ service: string; method: string; path: string; key: string }>>;

  /** Invalidate cached effective permissions for a single user. Call after role changes. */
  invalidateUser(userId: string, context?: { tenantId?: string }): void;

  /** Invalidate all cached data (api map + all users). Call after bulk permission/role changes. */
  invalidateAll(): void;

  /** @deprecated Prefer `invalidateAll()`. Retained for backwards compatibility. */
  invalidateCache(): void;

  /** Event emitter for observability (authorize, cache events). Always present on factory-created instances. */
  readonly emitter?: PermXEmitter;
}

/**
 * Create a database-agnostic PermX instance.
 *
 * This is the core factory. Database-specific factories (like `createPermX`
 * in `permx/mongoose`) wrap this and provide their own DataProvider.
 */
export function createPermXCore(
  provider: PermXDataProvider,
  config: PermXConfig = {},
): PermXInstance {
  const cache_ttl = config.cache?.ttl ?? 0;
  const api_map_cache = cache_ttl > 0
    ? new TtlCache<Array<{ service: string; method: string; path: string; key: string }>>(cache_ttl, config.cache?.max_size)
    : null;

  const user_cache = cache_ttl > 0
    ? new TtlCache<EffectivePermissions>(cache_ttl, config.cache?.max_size)
    : null;

  const userCacheKey = (userId: string, tenantId?: string) =>
    tenantId ? `${tenantId}::${userId}` : userId;

  const tenancy_enabled = config.tenancy?.enabled ?? false;
  const emitter = new PermXEmitter();

  const known_keys = config.dev?.knownKeys ? new Set(config.dev.knownKeys) : null;
  const warned_unknown_keys = known_keys ? new Set<string>() : null;

  const warnIfUnknownKey = (permissionKey: string): void => {
    if (!known_keys || !warned_unknown_keys) return;
    if (known_keys.has(permissionKey)) return;
    if (warned_unknown_keys.has(permissionKey)) return;
    warned_unknown_keys.add(permissionKey);
    // eslint-disable-next-line no-console
    console.warn(
      `[permx] authorize() called with unknown permission key '${permissionKey}'. ` +
      `This key is not in config.dev.knownKeys — likely a typo. ` +
      `Warning shown once per key; omit dev.knownKeys in production.`,
    );
  };

  /** Emit events asynchronously so listeners never block the auth path */
  const safe_emit = <K extends PermXEventName>(event: K, payload: PermXEventMap[K]): void => {
    if (emitter.listenerCount(event as string) > 0) {
      queueMicrotask(() => {
        try {
          emitter.emit(event, payload);
        } catch {
          // Listener errors must not break authorization
        }
      });
    }
  };

  const getApiMapCached = async () => {
    if (api_map_cache) {
      const cached = api_map_cache.get('api_map');
      if (cached) {
        safe_emit('cache.hit', { key: 'api_map' });
        return cached;
      }
      safe_emit('cache.miss', { key: 'api_map' });
    }

    const map = await provider.getApiPermissionMap();

    if (api_map_cache) {
      api_map_cache.set('api_map', map);
    }

    return map;
  };

  const isSuperAdmin = async (userId: string, context?: Record<string, unknown>): Promise<boolean> => {
    if (!config.superAdmin) return false;
    return config.superAdmin.check(userId, context);
  };

  return {
    emitter,

    async authorize(userId, permissionKey, context) {
      validateUserId(userId);
      assertPermissionKey(permissionKey);
      if (context?.tenantId !== undefined) {
        validateTenantId(context.tenantId, tenancy_enabled);
      }
      warnIfUnknownKey(permissionKey);

      const start = Date.now();

      try {
        if (await isSuperAdmin(userId, context)) {
          safe_emit('authorize', { userId, permissionKey, authorized: true, duration_ms: Date.now() - start });
          return { authorized: true };
        }

        const cacheKey = userCacheKey(userId, context?.tenantId);
        let effective = user_cache?.get(cacheKey);

        if (effective) {
          safe_emit('cache.hit', { key: cacheKey });
        } else {
          if (user_cache) safe_emit('cache.miss', { key: cacheKey });
          effective = await getUserEffectivePermissions(
            userId,
            provider,
            config.subscriptionResolver,
            context?.tenantId,
          );
          user_cache?.set(cacheKey, effective);
        }

        const authorized = effective.permissions.includes(permissionKey);

        safe_emit('authorize', { userId, permissionKey, authorized, duration_ms: Date.now() - start });
        if (!authorized) {
          safe_emit('authorize.denied', { userId, permissionKey });
        }

        return { authorized };
      } catch (error) {
        safe_emit('authorize.error', { userId, permissionKey, error });
        if (error instanceof PermXError) throw error;
        throw new DataProviderError(
          'Failed to resolve authorization',
          { userId, operation: 'authorize' },
          error,
        );
      }
    },

    async authorizeApi(userId, service, method, path, context) {
      validateUserId(userId);
      validateNonEmptyString(service, 'service');
      validateNonEmptyString(method, 'method');
      validateNonEmptyString(path, 'path');

      try {
        if (await isSuperAdmin(userId, context)) {
          return { authorized: true };
        }

        const apiMap = await getApiMapCached();

        const matched = apiMap.find(
          (entry) =>
            entry.service === service &&
            entry.method.toUpperCase() === method.toUpperCase() &&
            matchPathPattern(entry.path, path),
        );

        if (!matched) {
          return { authorized: false };
        }

        const result = await this.authorize(userId, matched.key, context);
        return { ...result, matched_key: matched.key };
      } catch (error) {
        if (error instanceof PermXError) throw error;
        throw new DataProviderError(
          'Failed to resolve API authorization',
          { userId, operation: 'authorizeApi' },
          error,
        );
      }
    },

    async getUserPermissions(userId, context) {
      validateUserId(userId);
      if (context?.tenantId !== undefined) {
        validateTenantId(context.tenantId, tenancy_enabled);
      }

      try {
        const cacheKey = userCacheKey(userId, context?.tenantId);
        const cached = user_cache?.get(cacheKey);
        if (cached) {
          safe_emit('cache.hit', { key: cacheKey });
          return cached;
        }
        if (user_cache) safe_emit('cache.miss', { key: cacheKey });

        const effective = await getUserEffectivePermissions(
          userId,
          provider,
          config.subscriptionResolver,
          context?.tenantId,
        );
        user_cache?.set(cacheKey, effective);
        return effective;
      } catch (error) {
        if (error instanceof PermXError) throw error;
        throw new DataProviderError(
          'Failed to resolve user permissions',
          { userId, operation: 'getUserPermissions' },
          error,
        );
      }
    },

    async getApiMap() {
      try {
        return await getApiMapCached();
      } catch (error) {
        if (error instanceof PermXError) throw error;
        throw new DataProviderError(
          'Failed to load API permission map',
          { operation: 'getApiMap' },
          error,
        );
      }
    },

    invalidateUser(userId, context) {
      if (!user_cache) return;
      user_cache.invalidate(userCacheKey(userId, context?.tenantId));
    },

    invalidateAll() {
      api_map_cache?.clear();
      user_cache?.clear();
    },

    invalidateCache() {
      api_map_cache?.clear();
      user_cache?.clear();
    },
  };
}
