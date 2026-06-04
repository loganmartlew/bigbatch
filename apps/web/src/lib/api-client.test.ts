import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from './api-client';

describe('api client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not send a json body or content-type header for empty post requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { id: 42 } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    await api.post<{ id: number }>('/recipes/12/duplicate', undefined, {
      householdId: 7,
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/recipes/12/duplicate', {
      method: 'POST',
      headers: {
        'X-Household-Id': '7',
      },
      credentials: 'include',
      body: undefined,
    });
  });

  it('sends json headers and a serialized body when a payload is present', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
        },
      }),
    );

    await api.post<{ ok: boolean }>(
      '/recipes',
      { name: 'Soup' },
      {
        householdId: 7,
      },
    );

    expect(fetchSpy).toHaveBeenCalledWith('/api/recipes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Household-Id': '7',
      },
      credentials: 'include',
      body: JSON.stringify({ name: 'Soup' }),
    });
  });
});
