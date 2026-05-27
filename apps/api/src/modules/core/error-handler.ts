import type { FastifyInstance } from 'fastify';
import { ERROR_CODES } from '@bigbatch/shared';
import type { ApiErrorResponse } from '@bigbatch/shared';
import { AppError } from './errors.js';

type ValidationLikeError = Error & {
  validation: unknown;
};

function isValidationLikeError(error: unknown): error is ValidationLikeError {
  return typeof error === 'object' && error !== null && 'validation' in error;
}

export function registerErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      request.log.warn(
        { err: error, statusCode: error.statusCode, code: error.code },
        error.message,
      );

      const body: ApiErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
        },
      };

      return reply.status(error.statusCode).send(body);
    }

    // Fastify validation errors
    if (isValidationLikeError(error)) {
      request.log.warn({ err: error }, 'Validation error');

      const body: ApiErrorResponse = {
        error: {
          code: ERROR_CODES.VALIDATION_ERROR,
          message: error.message,
        },
      };

      return reply.status(400).send(body);
    }

    // Unknown errors — log full details, return generic message
    request.log.error({ err: error }, 'Unhandled error');

    const body: ApiErrorResponse = {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: 'An unexpected error occurred',
      },
    };

    return reply.status(500).send(body);
  });
}
