import type { Request, Response, NextFunction } from 'express';
import type { PermXInstance } from '../permx.js';
import type { PermXMiddlewareConfig } from './types.js';
import { validateUserId } from '../validation.js';

export interface PermXMiddleware {
  /** Per-route permission check: `router.use('/clients', auth.authorize('clients.view.all'), handler)` */
  authorize(permissionKey: string): (req: Request, res: Response, next: NextFunction) => void;

  /** API mapping check for gateway-style authorization */
  authorizeApi(service: string): (req: Request, res: Response, next: NextFunction) => void;
}

const defaultOnDenied = (_req: Request, res: Response, _permissionKey: string): void => {
  res.status(403).json({ error: 'You do not have permission to access this resource' });
};

const defaultOnError = (_req: Request, res: Response, _error: unknown): void => {
  res.status(500).json({ error: 'Authorization service unavailable' });
};

/**
 * Create Express middleware from a PermX instance.
 *
 * Ported from Sahal's `aceAuthorize` and `proxyAuthorize` middleware.
 * Decoupled from res.locals, FRA_FLAG_KEY, CatchAsync, and SendError.
 */
export function createPermXMiddleware(
  permx: PermXInstance,
  middlewareConfig: PermXMiddlewareConfig,
): PermXMiddleware {
  const {
    extractUserId,
    extractTenantId,
    isServiceCall,
    isSuperAdmin,
    onDenied = defaultOnDenied,
    onError = defaultOnError,
  } = middlewareConfig;

  return {
    authorize(permissionKey: string) {
      return async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Service-to-service bypass
          if (isServiceCall?.(req)) return next();

          // Super-admin bypass
          if (isSuperAdmin?.(req)) return next();

          const userId = extractUserId(req);
          if (!userId) {
            onDenied(req, res, permissionKey);
            return;
          }
          validateUserId(userId);

          const tenantId = extractTenantId?.(req) ?? undefined;
          const result = await permx.authorize(userId, permissionKey, {
            tenantId: tenantId ?? undefined,
          });

          if (!result.authorized) {
            onDenied(req, res, permissionKey);
            return;
          }

          return next();
        } catch (error) {
          onError(req, res, error);
        }
      };
    },

    authorizeApi(service: string) {
      return async (req: Request, res: Response, next: NextFunction) => {
        try {
          // Service-to-service bypass
          if (isServiceCall?.(req)) return next();

          // Super-admin bypass
          if (isSuperAdmin?.(req)) return next();

          const userId = extractUserId(req);
          if (!userId) {
            onDenied(req, res, 'api_access');
            return;
          }
          validateUserId(userId);

          const tenantId = extractTenantId?.(req) ?? undefined;
          const result = await permx.authorizeApi(
            userId,
            service,
            req.method,
            req.path,
            { tenantId: tenantId ?? undefined },
          );

          if (!result.authorized) {
            onDenied(req, res, result.matched_key ?? 'api_access');
            return;
          }

          return next();
        } catch (error) {
          onError(req, res, error);
        }
      };
    },
  };
}
