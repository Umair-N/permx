import type mongoose from 'mongoose';
import type { PermXConfig } from '../types/config.js';
import type { PermXInstance } from '../permx.js';
import { createPermXCore } from '../permx.js';
import { createPermXSchemas, type SchemaFactoryConfig, type PermXModels } from './schemas.js';
import { MongooseDataProvider } from './data-provider.js';

export interface MongoosePermXConfig extends PermXConfig, SchemaFactoryConfig {
  connection: mongoose.Connection;
}

export interface MongoosePermXInstance extends PermXInstance {
  /** The Mongoose models created by PermX */
  models: PermXModels;

  /** Ensure all indexes are created (run once on startup) */
  migrate(): Promise<void>;
}

/**
 * Create a PermX instance backed by Mongoose.
 *
 * This is the main entry point for `permx/mongoose`.
 *
 * @example
 * ```typescript
 * import { createPermX } from 'permx/mongoose';
 *
 * const permx = createPermX({
 *   connection: mongoose.connection,
 *   tenancy: { enabled: true },
 *   cache: { ttl: 15_000 },
 *   superAdmin: { check: (userId) => userId === 'admin' },
 * });
 *
 * await permx.migrate();
 * const result = await permx.authorize(userId, 'clients.view.all');
 * ```
 */
export function createPermX(config: MongoosePermXConfig): MongoosePermXInstance {
  const { connection, collections, extend, tenancy, ...coreConfig } = config;

  const models = createPermXSchemas(connection, {
    collections,
    extend,
    tenancy,
  });

  const provider = new MongooseDataProvider(models);

  const core = createPermXCore(provider, {
    ...coreConfig,
    tenancy,
  });

  return {
    ...core,
    models,

    async migrate() {
      await Promise.all([
        models.Module.createIndexes(),
        models.Permission.createIndexes(),
        models.Role.createIndexes(),
        models.UserRole.createIndexes(),
      ]);
    },
  };
}
