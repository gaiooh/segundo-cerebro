import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

type ScreenProps = {
  children: ReactNode;
  /** Apply the top safe-area inset (default true). */
  safeTop?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Root container for every screen: themed background, safe area and a
 * centered max-width column so layouts stay comfortable on large screens.
 */
export function Screen({ children, safeTop = true, style }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background, paddingTop: safeTop ? insets.top : 0 }]}>
      <View style={[styles.column, { maxWidth: theme.layout.maxContentWidth }, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center' },
  column: { flex: 1, width: '100%' },
});
