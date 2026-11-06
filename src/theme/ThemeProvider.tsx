import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import {
  accentPalettes,
  basePalettes,
  tintPalettes,
  type AccentColors,
  type AccentName,
  type BaseColors,
  type ColorScheme,
  type Tint,
  type TintName,
} from './palettes';
import { layout, motion, radius, spacing, typography } from './tokens';

export type ThemeMode = ColorScheme | 'system';

export type Theme = {
  scheme: ColorScheme;
  colors: BaseColors & AccentColors;
  tint: (name: TintName) => Tint;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  motion: typeof motion;
  layout: typeof layout;
};

export function createTheme(scheme: ColorScheme, accent: AccentName): Theme {
  return {
    scheme,
    colors: { ...basePalettes[scheme], ...accentPalettes[accent][scheme] },
    tint: (name) => tintPalettes[name][scheme],
    spacing,
    radius,
    typography,
    motion,
    layout,
  };
}

const ThemeContext = createContext<Theme | null>(null);

type ThemeProviderProps = {
  mode: ThemeMode;
  accent: AccentName;
  children: ReactNode;
};

export function ThemeProvider({ mode, accent, children }: ThemeProviderProps) {
  const systemScheme = useColorScheme();
  const scheme: ColorScheme = mode === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : mode;
  const theme = useMemo(() => createTheme(scheme, accent), [scheme, accent]);
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside <ThemeProvider>');
  return theme;
}
