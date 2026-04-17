import type { PermXConfig, PermXInstance } from '@permx/core';
import { createPermXCore } from '@permx/core';
import { PrismaDataProvider } from './data-provider.js';
import type { PrismaClientLike } from './types.js';

export interface PrismaPermXConfig extends PermXConfig {
  /** A Prisma client (or anything structurally matching `PrismaClientLike`). */
  prisma: PrismaClientLike;
}

export interface PrismaPermXInstance extends PermXInstance {
  /** The underlying Prisma client. */
  readonly prisma: PrismaClientLike;
}

/**
 * Create a PermX instance backed by Prisma.
 *
 * @example
 * ```ts
 * import { PrismaClient } from '@prisma/client';
 * import { createPermX } from '@permx/prisma';
 *
 * const prisma = new PrismaClient();
 *
 * const permx = createPermX({
 *   prisma,
 *   cache: { ttl: 15_000 },
 *   superAdmin: { check: (userId) => userId === 'admin-id' },
 * });
 *
 * const { authorized } = await permx.authorize(userId, 'projects.tasks.view.all');
 * ```
 */
export function createPermX(config: PrismaPermXConfig): PrismaPermXInstance {
  const { prisma, ...coreConfig } = config;
  const provider = new PrismaDataProvider(prisma);
  const core = createPermXCore(provider, coreConfig);

  return {
    ...core,
    prisma,
  };
}
