import type { AuthSnapshot } from '../features/auth/types';

export interface RouterAppContext {
  auth: Pick<AuthSnapshot, 'households' | 'isAuthenticated' | 'isLoading'>;
  household: {
    activeHouseholdId: number | null;
  };
}
