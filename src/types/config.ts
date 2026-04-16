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

export interface PermXConfig {
  tenancy?: TenancyConfig;
  cache?: CacheConfig;
  superAdmin?: SuperAdminConfig;
  subscriptionResolver?: SubscriptionResolver;
}
