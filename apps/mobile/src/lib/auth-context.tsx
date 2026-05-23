import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from './api-client';
import {
  clearActiveHouseholdId,
  setActiveHouseholdId,
} from './household-context';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

interface HouseholdMembership {
  id: number;
  name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  households: HouseholdMembership[];
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setHouseholds: (households: HouseholdMembership[]) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    households: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<{
        user: User;
        households: HouseholdMembership[];
      }>('/auth/me');
      setState({
        user: data.user,
        households: data.households,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setState({
        user: null,
        households: [],
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{
      user: User;
      households: HouseholdMembership[];
    }>('/auth/login', { email, password });
    setState({
      user: data.user,
      households: data.households,
      isLoading: false,
      isAuthenticated: true,
    });
    if (data.households.length > 0) {
      await setActiveHouseholdId(data.households[0]!.id);
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      const data = await api.post<{
        user: User;
        households: HouseholdMembership[];
      }>('/auth/register', { email, password, firstName, lastName });
      setState({
        user: data.user,
        households: data.households,
        isLoading: false,
        isAuthenticated: true,
      });
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post('/auth/logout');
    await AsyncStorage.removeItem('bigbatch_session');
    setState({
      user: null,
      households: [],
      isLoading: false,
      isAuthenticated: false,
    });
    await clearActiveHouseholdId();
  }, []);

  const setHouseholds = useCallback((households: HouseholdMembership[]) => {
    setState(prev => ({ ...prev, households }));
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser, setHouseholds }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
