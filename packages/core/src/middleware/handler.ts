import type { PermXInstance } from '../permx.js';
import { validateUserId } from '../validation.js';

/**
 * Framework-agnostic authorization request.
 * HTTP framework adapters map their request objects to this shape.
 */
export interface AuthorizationRequest {
  userId: string | null | undefined;
  tenantId?: string | null | undefined;
  isServiceCall: boolean;
  isSuperAdmin: boolean;
}

/**
 * Discriminated union returned by the generic authorization handlers.
 * Framework adapters map this to their own response format.
 */
export type AuthorizationOutcome =
  | { action: 'allow' }
  | { action: 'deny'; permissionKey: string }
  | { action: 'error'; error: unknown };

/**
 * Framework-agnostic permission check.
 *
 * Runs the full authorization pipeline (service bypass → super-admin bypass →
 * userId extraction → permx.authorize) and returns a plain outcome object.
 *
 * Express, Fastify, Hono, Koa, or any other framework adapter wraps this
 * function and maps the outcome to its own response format.
 */
export async function handleAuthorization(
  permx: PermXInstance,
  request: AuthorizationRequest,
  permissionKey: string,
): Promise<AuthorizationOutcome> {
  try {
    if (request.isServiceCall) return { action: 'allow' };
    if (request.isSuperAdmin) return { action: 'allow' };

    if (!request.userId) {
      return { action: 'deny', permissionKey };
    }

    validateUserId(request.userId);

    const result = await permx.authorize(request.userId, permissionKey, {
      tenantId: request.tenantId ?? undefined,
    });

    if (!result.authorized) {
      return { action: 'deny', permissionKey };
    }

    return { action: 'allow' };
  } catch (error) {
    return { action: 'error', error };
  }
}

/**
 * Framework-agnostic API-route authorization check.
 *
 * Same pipeline as `handleAuthorization` but matches against the API
 * permission map using the HTTP method and path.
 */
export async function handleApiAuthorization(
  permx: PermXInstance,
  request: AuthorizationRequest,
  service: string,
  method: string,
  path: string,
): Promise<AuthorizationOutcome> {
  try {
    if (request.isServiceCall) return { action: 'allow' };
    if (request.isSuperAdmin) return { action: 'allow' };

    if (!request.userId) {
      return { action: 'deny', permissionKey: 'api_access' };
    }

    validateUserId(request.userId);

    const result = await permx.authorizeApi(
      request.userId,
      service,
      method,
      path,
      { tenantId: request.tenantId ?? undefined },
    );

    if (!result.authorized) {
      return { action: 'deny', permissionKey: result.matched_key ?? 'api_access' };
    }

    return { action: 'allow' };
  } catch (error) {
    return { action: 'error', error };
  }
}
