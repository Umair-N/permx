import type { SubscriptionResolver } from './data-provider.js';

export interface TenancyConfig {
  enabled: boolean;
  tenantIdField?: string;
  exemptModels?: Array<'module' | 'permission'>;
}

export interface CacheConfig {
  ttl: number;
  max_size?: number;
}

export interface SuperAdminConfig {
  check: (userId: string, context?: Record<string, unknown>) => boolean | Promise<boolean>;
}

export interface DevConfig {
  /**
   * Known permission keys. When an `authorize()` call uses a key not in this
   * set, PermX logs a one-time warning — almost always a typo. Pass
   * `Object.values(yourDefinePermissions)` for end-to-end coverage.
   *
   * Recommended for development only; omit in production.
   */
  knownKeys?: Iterable<string>;
}

export interface PermXConfig {
  tenancy?: TenancyConfig;
  cache?: CacheConfig;
  superAdmin?: SuperAdminConfig;
  subscriptionResolver?: SubscriptionResolver;
  dev?: DevConfig;
}
