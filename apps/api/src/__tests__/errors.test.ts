import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
} from '../modules/core/errors.js';
import { ERROR_CODES } from '@bigbatch/shared';

describe('Error Classes', () => {
  it('ValidationError has status 400', () => {
    const err = new ValidationError('bad input');
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(err.message).toBe('bad input');
    expect(err).toBeInstanceOf(AppError);
    expect(err).toBeInstanceOf(Error);
  });

  it('AuthenticationError has status 401', () => {
    const err = new AuthenticationError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe(ERROR_CODES.AUTHENTICATION_ERROR);
  });

  it('ForbiddenError has status 403', () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe(ERROR_CODES.FORBIDDEN);
  });

  it('NotFoundError has status 404', () => {
    const err = new NotFoundError();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe(ERROR_CODES.NOT_FOUND);
  });

  it('ConflictError has status 409', () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe(ERROR_CODES.CONFLICT);
  });

  it('RateLimitError has status 429', () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe(ERROR_CODES.RATE_LIMIT);
  });

  it('ExternalServiceError has status 502', () => {
    const err = new ExternalServiceError();
    expect(err.statusCode).toBe(502);
    expect(err.code).toBe(ERROR_CODES.EXTERNAL_SERVICE_ERROR);
  });

  it('uses default messages when none provided', () => {
    expect(new ValidationError().message).toBe('Validation failed');
    expect(new AuthenticationError().message).toBe('Authentication required');
    expect(new ForbiddenError().message).toBe('Insufficient permissions');
    expect(new NotFoundError().message).toBe('Resource not found');
    expect(new ConflictError().message).toBe('Resource already exists');
    expect(new RateLimitError().message).toBe('Too many requests');
    expect(new ExternalServiceError().message).toBe(
      'External service unavailable',
    );
  });
});
