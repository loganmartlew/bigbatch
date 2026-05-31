import type { ApiResponse, ApiErrorResponse } from '@bigbatch/shared';

const API_BASE = '/api';

interface ApiRequestOptions {
  householdId?: number | null;
}

class ApiClientError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: ApiRequestOptions,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const householdId = options?.householdId;
  if (householdId) {
    headers['X-Household-Id'] = String(householdId);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    credentials: 'include',
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = (await response.json()) as ApiErrorResponse;
    throw new ApiClientError(
      response.status,
      errorBody.error.code,
      errorBody.error.message,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    return undefined as T;
  }

  const result = (await response.json()) as ApiResponse<T>;
  return result.data;
}

export const api = {
  get: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: ApiRequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: ApiRequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export { ApiClientError };
