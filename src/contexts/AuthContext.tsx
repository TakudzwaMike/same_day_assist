import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { initSocket, disconnectSocket } from '../services/socket';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
  phone: string;
  address: string;
  status?: string;
  package?: string;
  memberSince?: string;
  repairsCount?: number;
  totalPaid?: number;
  specialty?: string;
  isAvailable?: boolean;
  rating?: number;
  lat?: number;
  lng?: number;
  certifications?: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  // Load user from cache + validate token on mount
  useEffect(() => {
    const init = async () => {
      const cachedUser = api.getCachedUser();
      if (cachedUser && api.isAuthenticated()) {
        setUser(cachedUser);
        // Validate token by fetching fresh user data
        try {
          const freshUser = await api.getMe();
          setUser(freshUser);
          localStorage.setItem('sda_user', JSON.stringify(freshUser));
          // Initialize real-time socket connection
          initSocket(freshUser.id, freshUser.role);
        } catch {
          // Token invalid — force logout
          setUser(null);
          localStorage.removeItem('sda_user');
        }
      }
      setIsLoading(false);
    };
    init();

    return () => {
      disconnectSocket();
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const userData = await api.login(email, password);
      setUser(userData);
      initSocket(userData.id, userData.role);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
      throw err;
    }
  }, []);

  const register = useCallback(async (payload: any) => {
    setError(null);
    try {
      const userData = await api.register(payload);
      setUser(userData);
      initSocket(userData.id, userData.role);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      setUser(null);
      disconnectSocket();
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const freshUser = await api.getMe();
      setUser(freshUser);
      localStorage.setItem('sda_user', JSON.stringify(freshUser));
    } catch (err: any) {
      console.error('[Auth] Failed to refresh user:', err);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshUser,
      error,
      clearError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
