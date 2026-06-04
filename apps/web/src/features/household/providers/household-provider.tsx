import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { HouseholdMembership } from '../../auth/types';

const STORAGE_KEY = 'bigbatch_active_household_id';

function parseHouseholdId(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function readStoredActiveHouseholdId(): number | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return parseHouseholdId(window.localStorage.getItem(STORAGE_KEY));
}

function getNextActiveHouseholdId(
  currentHouseholdId: number | null,
  households: HouseholdMembership[],
) {
  if (households.length === 0) {
    return null;
  }

  if (
    currentHouseholdId !== null &&
    households.some(household => household.id === currentHouseholdId)
  ) {
    return currentHouseholdId;
  }

  return households[0]!.id;
}

interface HouseholdContextValue {
  activeHouseholdId: number | null;
  switchHousehold: (householdId: number) => void;
  clearActiveHousehold: () => void;
}

interface HouseholdProviderProps {
  children: ReactNode;
  households: HouseholdMembership[];
  isLoading: boolean;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function HouseholdProvider({
  children,
  households,
  isLoading,
}: HouseholdProviderProps) {
  const [activeHouseholdId, setActiveHouseholdId] = useState<number | null>(
    () => readStoredActiveHouseholdId(),
  );

  useEffect(() => {
    if (isLoading) {
      return;
    }

    setActiveHouseholdId(currentHouseholdId =>
      getNextActiveHouseholdId(currentHouseholdId, households),
    );
  }, [households, isLoading]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (activeHouseholdId === null) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, String(activeHouseholdId));
  }, [activeHouseholdId]);

  return (
    <HouseholdContext.Provider
      value={{
        activeHouseholdId,
        switchHousehold: setActiveHouseholdId,
        clearActiveHousehold: () => setActiveHouseholdId(null),
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold(): HouseholdContextValue {
  const context = useContext(HouseholdContext);

  if (!context) {
    throw new Error('useHousehold must be used within a HouseholdProvider');
  }

  return context;
}
