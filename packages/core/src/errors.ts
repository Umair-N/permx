export class PermXError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string, statusCode: number = 500) {
    super(message);
    this.name = 'PermXError';
    this.code = code;
    this.statusCode = statusCode;
  }

  /** Type guard for narrowing unknown errors */
  static isPermXError(err: unknown): err is PermXError {
    return err instanceof PermXError;
  }
}

export class PermissionDeniedError extends PermXError {
  constructor(message: string = 'You do not have permission to access this resource') {
    super(message, 'PERMISSION_DENIED', 403);
    this.name = 'PermissionDeniedError';
  }
}

export class CircularInheritanceError extends PermXError {
  public readonly chain: string[];

  constructor(chain: string[]) {
    super(
      `Circular inheritance detected: ${chain.join(' → ')}`,
      'CIRCULAR_INHERITANCE',
      400,
    );
    this.name = 'CircularInheritanceError';
    this.chain = chain;
  }
}

export class RoleNotFoundError extends PermXError {
  constructor(roleId: string) {
    super(`Role ${roleId} not found`, 'ROLE_NOT_FOUND', 404);
    this.name = 'RoleNotFoundError';
  }
}

export class PermissionNotFoundError extends PermXError {
  constructor(identifier: string) {
    super(`Permission ${identifier} not found`, 'PERMISSION_NOT_FOUND', 404);
    this.name = 'PermissionNotFoundError';
  }
}

export class ValidationError extends PermXError {
  public readonly field?: string;

  constructor(message: string, field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
    this.field = field;
  }
}

export interface DataProviderErrorContext {
  operation: string;
  userId?: string;
  tenantId?: string;
  [key: string]: unknown;
}

export class DataProviderError extends PermXError {
  public readonly context: DataProviderErrorContext;
  public readonly cause: unknown;

  constructor(message: string, context: DataProviderErrorContext, cause?: unknown) {
    super(message, 'DATA_PROVIDER_ERROR', 500);
    this.name = 'DataProviderError';
    this.context = context;
    this.cause = cause;
  }
}
