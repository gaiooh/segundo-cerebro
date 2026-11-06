import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type Theme, type TypographyVariant } from '@/theme';

type ColorRole = 'primary' | 'secondary' | 'tertiary' | 'accent' | 'onAccent' | 'onInverse' | 'danger';

export type TextProps = RNTextProps & {
  variant?: TypographyVariant;
  color?: ColorRole;
  align?: 'left' | 'center' | 'right';
};

function resolveColor(theme: Theme, role: ColorRole): string {
  switch (role) {
    case 'primary':
      return theme.colors.text;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'tertiary':
      return theme.colors.textTertiary;
    case 'accent':
      return theme.colors.accentText;
    case 'onAccent':
      return theme.colors.onAccent;
    case 'onInverse':
      return theme.colors.onInverse;
    case 'danger':
      return theme.colors.danger;
  }
}

/** Themed text. Always use this instead of React Native's <Text>. */
export function Text({ variant = 'body', color = 'primary', align, style, ...rest }: TextProps) {
  const theme = useTheme();
  return (
    <RNText
      {...rest}
      style={[theme.typography[variant], { color: resolveColor(theme, color), textAlign: align }, style]}
    />
  );
}
