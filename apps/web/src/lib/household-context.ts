import { useSyncExternalStore } from 'react';

const STORAGE_KEY = 'bigbatch_active_household_id';

function readStoredHouseholdId(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  const parsed = parseInt(stored, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

type HouseholdListener = () => void;

let activeHouseholdId = readStoredHouseholdId();

const householdListeners = new Set<HouseholdListener>();

function emitHouseholdChange() {
  for (const listener of householdListeners) {
    listener();
  }
}

function syncHouseholdFromStorage() {
  const nextHouseholdId = readStoredHouseholdId();

  if (nextHouseholdId === activeHouseholdId) {
    return;
  }

  activeHouseholdId = nextHouseholdId;
  emitHouseholdChange();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY) {
      syncHouseholdFromStorage();
    }
  });
}

function subscribe(listener: HouseholdListener) {
  householdListeners.add(listener);

  return () => {
    householdListeners.delete(listener);
  };
}

export function getActiveHouseholdId(): number | null {
  return activeHouseholdId;
}

export function useActiveHouseholdId(): number | null {
  return useSyncExternalStore(subscribe, getActiveHouseholdId, () => null);
}

export function setActiveHouseholdId(id: number): void {
  activeHouseholdId = id;

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, String(id));
  }

  emitHouseholdChange();
}

export function clearActiveHouseholdId(): void {
  activeHouseholdId = null;

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }

  emitHouseholdChange();
}
