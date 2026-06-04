import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { api } from './api-client';
import type { AuthSession, AuthSnapshot } from '../features/auth/types';

interface AuthContextValue extends AuthSnapshot {
  login: (email: string, password: string) => Promise<AuthSession>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<AuthSession>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthSession | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthSnapshot>({
    user: null,
    households: [],
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshUser = useCallback(async () => {
    try {
      const data = await api.get<AuthSession>('/auth/me');
      setState({
        user: data.user,
        households: data.households,
        isLoading: false,
        isAuthenticated: true,
      });
      return data;
    } catch {
      setState({
        user: null,
        households: [],
        isLoading: false,
        isAuthenticated: false,
      });
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<AuthSession>('/auth/login', {
      email,
      password,
    });
    setState({
      user: data.user,
      households: data.households,
      isLoading: false,
      isAuthenticated: true,
    });
    return data;
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      const data = await api.post<AuthSession>('/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      setState({
        user: data.user,
        households: data.households,
        isLoading: false,
        isAuthenticated: true,
      });
      return data;
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.post<void>('/auth/logout');
    setState({
      user: null,
      households: [],
      isLoading: false,
      isAuthenticated: false,
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, refreshUser }}
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
