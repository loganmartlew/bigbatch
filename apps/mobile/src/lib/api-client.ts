import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ApiResponse, ApiErrorResponse } from '@bigbatch/shared';
import { getActiveHouseholdId } from './household-context';

const API_BASE =
  process.env['EXPO_PUBLIC_API_URL'] ?? 'http://localhost:3000/api';

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

async function getSessionCookie(): Promise<string | null> {
  return AsyncStorage.getItem('bigbatch_session');
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const householdId = await getActiveHouseholdId();
  if (householdId) {
    headers['X-Household-Id'] = String(householdId);
  }

  const session = await getSessionCookie();
  if (session) {
    headers['Cookie'] = `session=${session}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
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

  const result = (await response.json()) as ApiResponse<T>;
  return result.data;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path),
};

export { ApiClientError };
