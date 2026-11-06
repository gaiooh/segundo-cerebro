/**
 * Color palettes. The base (neutral) palette follows the color scheme:
 * white is the primary color in light mode, black in dark mode.
 * The accent is a separate, swappable layer (default: rose).
 */

export type ColorScheme = 'light' | 'dark';

export type BaseColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfacePressed: string;
  border: string;
  separator: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  /** High-contrast inverse: the "ink" color used for primary filled controls. */
  inverse: string;
  onInverse: string;
  overlay: string;
  danger: string;
};

export const basePalettes: Record<ColorScheme, BaseColors> = {
  light: {
    background: '#FFFFFF',
    surface: '#F6F5F3',
    surfaceElevated: '#FFFFFF',
    surfacePressed: '#EEEDEA',
    border: '#E7E5E1',
    separator: '#EFEDEA',
    text: '#151413',
    textSecondary: '#5F5C57',
    textTertiary: '#8E8A84',
    inverse: '#151413',
    onInverse: '#FFFFFF',
    overlay: 'rgba(20, 19, 18, 0.32)',
    danger: '#B4413C',
  },
  dark: {
    background: '#000000',
    surface: '#111111',
    surfaceElevated: '#1A1A1A',
    surfacePressed: '#222222',
    border: '#2A2A2A',
    separator: '#1E1E1E',
    text: '#F4F3F1',
    textSecondary: '#A6A39E',
    textTertiary: '#77746F',
    inverse: '#F4F3F1',
    onInverse: '#000000',
    overlay: 'rgba(0, 0, 0, 0.6)',
    danger: '#E07A73',
  },
};

export type AccentColors = {
  /** Interactive details, highlights, active states. */
  accent: string;
  /** Text/icons placed on top of `accent`. */
  onAccent: string;
  /** Very soft tint for backgrounds behind accent content. */
  accentSoft: string;
  /** Accent used as text on `accentSoft` / background. */
  accentText: string;
};

export type AccentName = 'rose' | 'clay' | 'sage' | 'iris';

export const accentPalettes: Record<AccentName, { label: string } & Record<ColorScheme, AccentColors>> = {
  rose: {
    label: 'Rosa',
    light: { accent: '#B9506F', onAccent: '#FFFFFF', accentSoft: '#F8EBEF', accentText: '#9E3F5C' },
    dark: { accent: '#E592AB', onAccent: '#1C0A10', accentSoft: '#2A161D', accentText: '#EFA9BE' },
  },
  clay: {
    label: 'Argila',
    light: { accent: '#A9583A', onAccent: '#FFFFFF', accentSoft: '#F6ECE6', accentText: '#8E4528' },
    dark: { accent: '#E09A7C', onAccent: '#1C0D06', accentSoft: '#2A1B14', accentText: '#EBAE94' },
  },
  sage: {
    label: 'Sálvia',
    light: { accent: '#4F7A63', onAccent: '#FFFFFF', accentSoft: '#E9F1EC', accentText: '#3D624F' },
    dark: { accent: '#93C2A7', onAccent: '#08150E', accentSoft: '#15231B', accentText: '#A8D1B9' },
  },
  iris: {
    label: 'Íris',
    light: { accent: '#5E5AA8', onAccent: '#FFFFFF', accentSoft: '#EDECF8', accentText: '#4B4790' },
    dark: { accent: '#A7A3EC', onAccent: '#0E0C24', accentSoft: '#1B1A30', accentText: '#BAB7F2' },
  },
};

/**
 * Discreet tints for folders/categories. Each has a soft fill and a deeper ink
 * for icons and labels, tuned per scheme for legibility.
 */
export type TintName = 'rose' | 'sand' | 'sage' | 'mist' | 'lilac' | 'stone';

export type Tint = { fill: string; ink: string; dot: string };

export const tintPalettes: Record<TintName, Record<ColorScheme, Tint>> = {
  rose: {
    light: { fill: '#F7E9EC', ink: '#93445C', dot: '#C76B87' },
    dark: { fill: '#24161A', ink: '#E7A7BA', dot: '#D98BA3' },
  },
  sand: {
    light: { fill: '#F4EEE3', ink: '#7D6237', dot: '#BC9658' },
    dark: { fill: '#221D15', ink: '#DCC294', dot: '#C9A86E' },
  },
  sage: {
    light: { fill: '#E9F0EA', ink: '#3F6A50', dot: '#6E9E80' },
    dark: { fill: '#152019', ink: '#A6CDB3', dot: '#7FB091' },
  },
  mist: {
    light: { fill: '#E8EEF3', ink: '#3E5F78', dot: '#6F93AF' },
    dark: { fill: '#141C23', ink: '#A9C3D8', dot: '#7FA3BF' },
  },
  lilac: {
    light: { fill: '#EEEBF6', ink: '#5A4F8A', dot: '#8C80C2' },
    dark: { fill: '#1B1826', ink: '#C3BAEA', dot: '#A196D8' },
  },
  stone: {
    light: { fill: '#EFEEEC', ink: '#55524D', dot: '#8F8B84' },
    dark: { fill: '#1A1A19', ink: '#C9C6C0', dot: '#9E9A94' },
  },
};

export const tintNames = Object.keys(tintPalettes) as TintName[];
export const accentNames = Object.keys(accentPalettes) as AccentName[];
