'use client';

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  THEME_PREFERENCES,
  applyTheme,
  getSystemTheme,
  persistPreference,
  resolveTheme,
} from '../../lib/theme';

const ThemeContext = createContext(null);

// useLayoutEffect warns during SSR; fall back to useEffect on the server.
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function ThemeProvider({ initialPreference, children }) {
  const [preference, setPreferenceState] = useState(initialPreference);
  const [systemTheme, setSystemTheme] = useState('dark');

  // Keep <html> in sync with the preference (also after server re-renders).
  useIsoLayoutEffect(() => {
    applyTheme(preference);
  }, [preference]);

  // Track the OS setting; it only matters while the preference is "system".
  useEffect(() => {
    setSystemTheme(getSystemTheme());
    if (preference !== 'system' || !window.matchMedia) return undefined;
    const query = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => {
      setSystemTheme(getSystemTheme());
      applyTheme('system');
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((next) => {
    if (!THEME_PREFERENCES.includes(next)) return;
    persistPreference(next);
    setPreferenceState(next);
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolvedTheme: preference === 'system' ? systemTheme : resolveTheme(preference),
      setPreference,
    }),
    [preference, systemTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
