import {
  getActiveHouseholdId,
  setActiveHouseholdId,
} from '../lib/household-context';
import { useAuth } from '../lib/auth-context';

export function HouseholdSelector() {
  const { households } = useAuth();
  const activeId = getActiveHouseholdId();

  if (households.length === 0) return null;

  return (
    <select
      value={activeId ?? ''}
      onChange={e => {
        const id = parseInt(e.target.value, 10);
        if (!Number.isNaN(id)) {
          setActiveHouseholdId(id);
          window.location.reload();
        }
      }}
    >
      {households.map(h => (
        <option key={h.id} value={h.id}>
          {h.name}
        </option>
      ))}
    </select>
  );
}
