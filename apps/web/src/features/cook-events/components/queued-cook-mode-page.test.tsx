import { MantineProvider } from '@mantine/core';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const navigateMock = vi.fn();
const finishMutateMock = vi.fn();

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

const queuedCookModeData = {
  queuedCookId: 7,
  recipeId: 11,
  recipeName: 'Tomato Soup',
  selectedBatchSize: 4,
  ingredients: [
    {
      id: 1,
      ingredientId: 2,
      ingredientName: 'Carrot',
      unit: 'g',
      requiredQuantity: 300,
      isSatisfied: true,
    },
  ],
  instructions: [
    { id: 10, stepNumber: 1, text: 'Prep vegetables' },
    { id: 11, stepNumber: 2, text: 'Simmer stock' },
  ],
};

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigateMock,
}));

vi.mock('../api', () => ({
  useQueuedCookMode: () => ({
    data: queuedCookModeData,
    isLoading: false,
  }),
  useFinishQueuedCook: () => ({
    mutate: finishMutateMock,
    isPending: false,
    error: null,
  }),
  useUpdateCookEvent: () => ({
    mutate: vi.fn(),
    isPending: false,
    error: null,
  }),
}));

import { QueuedCookModePage } from './queued-cook-mode-page';

describe('QueuedCookModePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows ingredients expanded by default and renders every step as a checkbox list', async () => {
    const user = userEvent.setup();

    render(
      <MantineProvider>
        <QueuedCookModePage queuedCookId={7} />
      </MantineProvider>,
    );

    expect(screen.getByText('Carrot')).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Prep vegetables/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: /Simmer stock/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Previous' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Next' }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', { name: /Prep vegetables/i }),
    );

    expect(screen.getByText('1 / 2 steps completed')).toBeInTheDocument();
  });
});
