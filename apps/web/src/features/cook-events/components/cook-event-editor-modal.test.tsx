import { MantineProvider } from '@mantine/core';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updatedCookEvent = {
  id: 42,
  recipeId: 10,
  userId: 4,
  recipeName: 'Baked Pasta',
  userDisplayName: 'Alex Cook',
  date: '2026-06-01',
  batchSize: 6,
  notes: 'Tasted better chilled',
  createdAt: '2026-06-01T12:00:00.000Z',
  updatedAt: '2026-06-01T12:30:00.000Z',
  deletedAt: null,
};

const updateCookEventMutateMock = vi.fn(
  (
    _input: unknown,
    options?: { onSuccess?: (result: typeof updatedCookEvent) => void },
  ) => {
    options?.onSuccess?.(updatedCookEvent);
  },
);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

vi.mock('../api', () => ({
  useUpdateCookEvent: () => ({
    mutate: updateCookEventMutateMock,
    isPending: false,
    error: null,
  }),
}));

import { CookEventEditorModal } from './cook-event-editor-modal';

describe('CookEventEditorModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits the updated cook date and notes', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();

    render(
      <MantineProvider>
        <CookEventEditorModal
          opened
          cookEvent={{
            id: 42,
            recipeName: 'Baked Pasta',
            batchSize: 6,
            date: '2026-05-31',
            notes: '',
          }}
          onClose={vi.fn()}
          onSaved={onSaved}
        />
      </MantineProvider>,
    );

    fireEvent.change(screen.getByLabelText(/Cook date/i), {
      target: { value: '2026-06-01' },
    });
    await user.type(screen.getByLabelText(/Notes/i), 'Tasted better chilled');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateCookEventMutateMock).toHaveBeenCalledWith(
      {
        date: '2026-06-01',
        notes: 'Tasted better chilled',
      },
      expect.objectContaining({ onSuccess: expect.any(Function) }),
    );
    expect(onSaved).toHaveBeenCalledWith(updatedCookEvent);
  });
});
