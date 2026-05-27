import { Select } from '@mantine/core';
import {
  setActiveHouseholdId,
  useActiveHouseholdId,
} from '../lib/household-context';
import { useAuth } from '../lib/auth-context';

export function HouseholdSelector() {
  const { households } = useAuth();
  const activeId = useActiveHouseholdId();

  if (households.length <= 1) return null;

  return (
    <Select
      size='sm'
      w={180}
      value={activeId ? String(activeId) : null}
      data={households.map(h => ({ value: String(h.id), label: h.name }))}
      onChange={value => {
        if (value) {
          setActiveHouseholdId(parseInt(value, 10));
        }
      }}
    />
  );
}
