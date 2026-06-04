export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface HouseholdMembership {
  id: number;
  name: string;
  role: string;
}

export interface AuthSession {
  user: User;
  households: HouseholdMembership[];
}

export interface AuthSnapshot {
  user: User | null;
  households: HouseholdMembership[];
  isLoading: boolean;
  isAuthenticated: boolean;
}
