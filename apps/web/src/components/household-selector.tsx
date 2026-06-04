import { Select } from '@mantine/core';
import { useAuth } from '../lib/auth-context';
import { useHousehold } from '../lib/household-context';

export function HouseholdSelector() {
  const { households } = useAuth();
  const { activeHouseholdId, switchHousehold } = useHousehold();

  if (households.length === 0) return null;

  return (
    <Select
      allowDeselect={false}
      aria-label='Active household'
      data={households.map(household => ({
        label: household.name,
        value: String(household.id),
      }))}
      label='Household'
      onChange={(value: string | null) => {
        if (!value) {
          return;
        }

        switchHousehold(Number.parseInt(value, 10));
      }}
      value={activeHouseholdId === null ? null : String(activeHouseholdId)}
      w={220}
    />
  );
}
