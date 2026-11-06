/**
 * Design tokens that do not depend on the color scheme.
 * Everything visual in the app should come from here or from the theme colors,
 * so appearance can be customized later from a single place.
 */

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

/** Moderate rounding: soft, never "bubbly". */
export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

/**
 * Font families are referenced by role, never by name, so the typeface can be
 * swapped (or made user-selectable) without touching components.
 */
export const fontFamilies = {
  display: 'Newsreader_500Medium',
  displayItalic: 'Newsreader_400Regular_Italic',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;

export type FontRole = keyof typeof fontFamilies;

export const typography = {
  /** Large serif screen titles. */
  display: { fontFamily: fontFamilies.display, fontSize: 34, lineHeight: 40, letterSpacing: -0.6 },
  /** Serif section / hero text. */
  title: { fontFamily: fontFamilies.display, fontSize: 26, lineHeight: 32, letterSpacing: -0.4 },
  /** Serif italic, used sparingly for guidance phrases. */
  prompt: { fontFamily: fontFamilies.displayItalic, fontSize: 22, lineHeight: 30, letterSpacing: -0.2 },
  headline: { fontFamily: fontFamilies.bodySemibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fontFamilies.body, fontSize: 16, lineHeight: 23, letterSpacing: -0.1 },
  bodyMedium: { fontFamily: fontFamilies.bodyMedium, fontSize: 16, lineHeight: 22, letterSpacing: -0.1 },
  callout: { fontFamily: fontFamilies.body, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  label: { fontFamily: fontFamilies.bodyMedium, fontSize: 14, lineHeight: 18, letterSpacing: -0.05 },
  caption: { fontFamily: fontFamilies.body, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  overline: { fontFamily: fontFamilies.bodyMedium, fontSize: 12, lineHeight: 16, letterSpacing: 0.6 },
  tab: { fontFamily: fontFamilies.bodyMedium, fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },
} as const;

export type TypographyVariant = keyof typeof typography;

export const motion = {
  fast: 160,
  normal: 240,
  slow: 420,
  /** Spring used for presses and toggles: quick, no visible bounce. */
  spring: { damping: 18, stiffness: 220, mass: 0.8 },
} as const;

/** Widest content column, so layouts stay comfortable on tablets/web. */
export const layout = {
  maxContentWidth: 640,
  screenPadding: 20,
  tabBarHeight: 64,
} as const;
