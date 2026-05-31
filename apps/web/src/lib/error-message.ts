import { ApiClientError } from './api-client';

export function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
): string {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
