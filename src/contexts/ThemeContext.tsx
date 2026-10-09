import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

export type AppTheme = 'dark' | 'light';

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'sda_theme_preference';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [theme, setThemeState] = useState<AppTheme>(() => {
    // 1. Try local storage
    const stored = localStorage.getItem(STORAGE_KEY) as AppTheme | null;
    if (stored === 'dark' || stored === 'light') {
      return stored;
    }
    // 2. Default to Dark Theme (Original Navy-Blue Branding)
    return 'dark';
  });

  // Sync when user logs in with saved account theme preference
  useEffect(() => {
    if (user && (user as any).communicationPreferences) {
      try {
        const commPrefs = typeof (user as any).communicationPreferences === 'string'
          ? JSON.parse((user as any).communicationPreferences)
          : (user as any).communicationPreferences;
        if (commPrefs?.themePreference && (commPrefs.themePreference === 'dark' || commPrefs.themePreference === 'light')) {
          setThemeState(commPrefs.themePreference);
          localStorage.setItem(STORAGE_KEY, commPrefs.themePreference);
        }
      } catch (e) {
        // Ignore parse error
      }
    }
  }, [user]);

  // Apply theme attributes to document element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (theme === 'dark') {
      root.classList.remove('theme-light');
      root.classList.add('theme-dark');
      root.style.colorScheme = 'dark';
      document.body.style.backgroundColor = '#050E20'; // Brand Navy Dark
      document.body.style.color = '#F8FAFC';
    } else {
      root.classList.remove('theme-dark');
      root.classList.add('theme-light');
      root.style.colorScheme = 'light';
      document.body.style.backgroundColor = '#F1F5F9';
      document.body.style.color = '#091C3E';
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    // Persist to user account if authenticated
    if (api.isAuthenticated()) {
      api.updateThemePreference(newTheme).catch((err) => {
        console.warn('[ThemeContext] Could not persist theme preference to backend:', err);
      });
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      setTheme,
      toggleTheme,
      isDark: theme === 'dark',
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
