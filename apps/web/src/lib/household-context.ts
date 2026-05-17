const STORAGE_KEY = 'bigbatch_active_household_id';

export function getActiveHouseholdId(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function setActiveHouseholdId(id: number): void {
  localStorage.setItem(STORAGE_KEY, String(id));
}

export function clearActiveHouseholdId(): void {
  localStorage.removeItem(STORAGE_KEY);
}
