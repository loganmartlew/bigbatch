import type { ErrorCode } from '@bigbatch/shared';
import { ERROR_CODES } from '@bigbatch/shared';

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(400, ERROR_CODES.VALIDATION_ERROR, message);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(401, ERROR_CODES.AUTHENTICATION_ERROR, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(403, ERROR_CODES.FORBIDDEN, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(404, ERROR_CODES.NOT_FOUND, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(409, ERROR_CODES.CONFLICT, message);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(429, ERROR_CODES.RATE_LIMIT, message);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service unavailable') {
    super(502, ERROR_CODES.EXTERNAL_SERVICE_ERROR, message);
  }
}
