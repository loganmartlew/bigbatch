// ─── API Response Envelope ───────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
  };
}

// ─── Error Codes ─────────────────────────────────────────────

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
