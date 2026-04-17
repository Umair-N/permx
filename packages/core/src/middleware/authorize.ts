import type { Request, Response, NextFunction } from 'express';
import type { PermXInstance } from '../permx.js';
import type { PermXMiddlewareConfig } from './types.js';
import type { AuthorizationRequest } from './handler.js';
import { handleAuthorization, handleApiAuthorization } from './handler.js';

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
 * Thin wrapper around the framework-agnostic `handleAuthorization` and
 * `handleApiAuthorization` functions. Maps Express request/response
 * objects to the generic `AuthorizationRequest` / `AuthorizationOutcome`.
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

  const toAuthRequest = (req: Request): AuthorizationRequest => ({
    userId: extractUserId(req),
    tenantId: extractTenantId?.(req),
    isServiceCall: isServiceCall?.(req) ?? false,
    isSuperAdmin: isSuperAdmin?.(req) ?? false,
  });

  return {
    authorize(permissionKey: string) {
      return async (req: Request, res: Response, next: NextFunction) => {
        const outcome = await handleAuthorization(permx, toAuthRequest(req), permissionKey);
        if (outcome.action === 'allow') return next();
        if (outcome.action === 'deny') return onDenied(req, res, outcome.permissionKey);
        onError(req, res, outcome.error);
      };
    },

    authorizeApi(service: string) {
      return async (req: Request, res: Response, next: NextFunction) => {
        const outcome = await handleApiAuthorization(permx, toAuthRequest(req), service, req.method, req.path);
        if (outcome.action === 'allow') return next();
        if (outcome.action === 'deny') return onDenied(req, res, outcome.permissionKey);
        onError(req, res, outcome.error);
      };
    },
  };
}
