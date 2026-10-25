// ============================================================================
// ThemeContext.tsx
// Contexto global de tema (Light / Dark) da Plataforma Operacional.
// Persiste a preferência do usuário via localStorage.
// ============================================================================

import * as React from 'react';

export interface IThemeContext {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = React.createContext<IThemeContext>({
  isDark: false,
  toggleTheme: () => { /* noop */ },
});

const STORAGE_KEY = 'platform-theme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = React.useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'dark';
    } catch {
      return false;
    }
  });

  const toggleTheme = React.useCallback(() => {
    setIsDark((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      } catch { /* noop */ }
      return next;
    });
  }, []);

  const value = React.useMemo(() => ({ isDark, toggleTheme }), [isDark, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): IThemeContext => React.useContext(ThemeContext);
