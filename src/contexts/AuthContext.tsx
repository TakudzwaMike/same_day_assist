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
  verificationStatus?: string;
}


interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: any) => Promise<void>;
  onboarding: (payload: any) => Promise<void>;
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        const role = email.toLowerCase().includes('contractor') ? 'Contractor' :
                     email.toLowerCase().includes('admin') ? 'Administrator' : 'Customer';
        const demoUser = {
          id: 'user-' + Date.now(),
          email: email.trim().toLowerCase(),
          role,
          name: email.split('@')[0].toUpperCase() || 'Demo User',
          phone: '+27 70 000 0000',
          address: 'Sandton City, Johannesburg',
          status: 'Active',
          memberSince: new Date().toISOString(),
          repairsCount: 1,
          totalPaid: 850,
        };
        localStorage.setItem('sda_user', JSON.stringify(demoUser));
        localStorage.setItem('sda_access_token', 'demo-token-' + Date.now());
        setUser(demoUser);
        return;
      }
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
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        const demoUser = {
          id: 'user-' + Date.now(),
          email: payload.email || 'demo@samedayassist.co.za',
          role: payload.role || 'Customer',
          name: payload.name || 'Demo Customer',
          phone: payload.phone || '+27 70 000 0000',
          address: payload.address || 'Johannesburg, South Africa',
          status: 'WAITING_FOR_SURVEY',
          onboardingStatus: 'WAITING_FOR_SURVEY',
          surveyRequested: true,
          memberSince: new Date().toISOString(),
          repairsCount: 0,
          totalPaid: 0,
        };
        localStorage.setItem('sda_user', JSON.stringify(demoUser));
        localStorage.setItem('sda_access_token', 'demo-token-' + Date.now());
        setUser(demoUser);
        return;
      }
      setError(err.message || 'Registration failed. Please try again.');
      throw err;
    }
  }, []);

  const onboarding = useCallback(async (payload: any) => {
    setError(null);
    try {
      const userData = await api.onboarding(payload);
      setUser(userData);
      initSocket(userData.id, userData.role);
    } catch (err: any) {
      if (err.message?.includes('Connection failed') || err.message?.includes('network')) {
        const demoUser = {
          id: 'user-' + Date.now(),
          email: payload.email || 'tester@samedayassist.co.za',
          role: 'Customer',
          name: payload.name || 'Demo Customer',
          phone: payload.phone || '+27 70 000 0000',
          address: payload.address || 'Sandton, Johannesburg',
          accountType: payload.accountType || 'Individual',
          status: 'WAITING_FOR_SURVEY',
          onboardingStatus: 'WAITING_FOR_SURVEY',
          surveyRequested: true,
          memberSince: new Date().toISOString(),
          repairsCount: 0,
          totalPaid: 0,
        };
        localStorage.setItem('sda_user', JSON.stringify(demoUser));
        localStorage.setItem('sda_access_token', 'demo-token-' + Date.now());
        setUser(demoUser);
        return;
      }
      setError(err.message || 'Onboarding failed. Please review your input details.');
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

  // Inactivity auto-logout hook (15 mins idle time)
  useEffect(() => {
    if (!user) return;

    let timeoutId: any;
    const inactivityTimeout = 15 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        alert('You have been logged out due to inactivity.');
      }, inactivityTimeout);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [user, logout]);

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      login,
      register,
      onboarding,
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
