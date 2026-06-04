import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  HouseholdProvider,
  useHousehold,
} from '../../../lib/household-context';

const STORAGE_KEY = 'bigbatch_active_household_id';

function HouseholdConsumer() {
  const { activeHouseholdId, clearActiveHousehold, switchHousehold } =
    useHousehold();

  return (
    <>
      <div data-testid='active-household'>
        {activeHouseholdId === null ? 'none' : activeHouseholdId}
      </div>
      <button onClick={() => switchHousehold(42)} type='button'>
        Switch
      </button>
      <button onClick={clearActiveHousehold} type='button'>
        Clear
      </button>
    </>
  );
}

describe('HouseholdProvider', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('hydrates the current household selection from local storage', () => {
    window.localStorage.setItem(STORAGE_KEY, '7');

    render(
      <HouseholdProvider
        households={[{ id: 7, name: 'Test household', role: 'owner' }]}
        isLoading={false}
      >
        <HouseholdConsumer />
      </HouseholdProvider>,
    );

    expect(screen.getByTestId('active-household')).toHaveTextContent('7');
  });

  it('switches and clears the active household without a page reload', async () => {
    const user = userEvent.setup();

    render(
      <HouseholdProvider households={[]} isLoading={false}>
        <HouseholdConsumer />
      </HouseholdProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Switch' }));

    expect(screen.getByTestId('active-household')).toHaveTextContent('42');
    expect(window.localStorage.getItem('bigbatch_active_household_id')).toBe(
      '42',
    );

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.getByTestId('active-household')).toHaveTextContent('none');
    expect(
      window.localStorage.getItem('bigbatch_active_household_id'),
    ).toBeNull();
  });

  it('clears an invalid stored household once memberships load', () => {
    window.localStorage.setItem(STORAGE_KEY, '99');

    render(
      <HouseholdProvider
        households={[{ id: 7, name: 'Test household', role: 'owner' }]}
        isLoading={false}
      >
        <HouseholdConsumer />
      </HouseholdProvider>,
    );

    expect(screen.getByTestId('active-household')).toHaveTextContent('7');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('7');
  });
});
