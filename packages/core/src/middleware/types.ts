import type { Request, Response } from 'express';

export interface PermXMiddlewareConfig {
  extractUserId: (req: Request) => string | null | undefined;
  extractTenantId?: (req: Request) => string | null | undefined;
  isServiceCall?: (req: Request) => boolean;
  isSuperAdmin?: (req: Request) => boolean;
  onDenied?: (req: Request, res: Response, permissionKey: string) => void;
  onError?: (req: Request, res: Response, error: unknown) => void;
}
