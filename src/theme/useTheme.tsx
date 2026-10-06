import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { ThemeDefinition, ThemeId } from './types';
import { THEMES, THEME_IDS, getTheme, themeTokensToCssVariables } from './themes';

interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeDefinition;
  setTheme: (id: ThemeId) => void;
  toggleMode: () => void;
  allThemes: ThemeDefinition[];
}

const STORAGE_KEY = 'swrite_active_theme';
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function applyThemeToDocument(theme: ThemeDefinition) {
  const root = document.documentElement;
  const variables = themeTokensToCssVariables(theme);
  for (const [key, value] of Object.entries(variables)) {
    root.style.setProperty(key, value);
  }
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-mode', theme.mode);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode; initialThemeId?: ThemeId }> = ({
  children,
  initialThemeId,
}) => {
  const [themeId, setThemeIdState] = useState<ThemeId>(() => {
    if (initialThemeId && THEMES[initialThemeId]) {
      return initialThemeId;
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && (stored in THEMES)) {
        return stored as ThemeId;
      }
    } catch {
      // localStorage may fail in some environments
    }
    return 'studio';
  });

  const theme = useMemo(() => getTheme(themeId), [themeId]);

  const setTheme = (id: ThemeId) => {
    if (THEMES[id]) {
      setThemeIdState(id);
      try {
        localStorage.setItem(STORAGE_KEY, id);
      } catch {
        // ignore storage errors
      }
    }
  };

  const toggleMode = () => {
    const currentMode = theme.mode;
    const targetMode = currentMode === 'light' ? 'dark' : 'light';
    // Find first theme in opposite mode or fallback
    const targetTheme = THEME_IDS.map((id) => THEMES[id]).find((t) => t.mode === targetMode);
    if (targetTheme) {
      setTheme(targetTheme.id);
    }
  };

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const allThemes = useMemo(() => THEME_IDS.map((id) => THEMES[id]), []);

  const value = useMemo(
    () => ({
      themeId,
      theme,
      setTheme,
      toggleMode,
      allThemes,
    }),
    [themeId, theme, allThemes]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
