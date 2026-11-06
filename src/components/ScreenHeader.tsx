import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Text } from './Text';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  /** Small, discreet controls aligned to the title baseline. */
  actions?: ReactNode;
  /** Optional element above the title (e.g. a back button). */
  leading?: ReactNode;
};

export function ScreenHeader({ title, subtitle, actions, leading }: ScreenHeaderProps) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.layout.screenPadding, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.lg }}>
      {leading ? <View style={{ marginBottom: theme.spacing.sm, marginLeft: -theme.spacing.sm }}>{leading}</View> : null}
      <View style={styles.row}>
        <View style={styles.titleBlock}>
          <Text variant="display" numberOfLines={2} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="callout" color="tertiary" style={{ marginTop: theme.spacing.xs }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {actions ? <View style={[styles.actions, { gap: theme.spacing.xs }]}>{actions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  titleBlock: { flex: 1, paddingRight: 12 },
  actions: { flexDirection: 'row', alignItems: 'center', paddingBottom: 2 },
});
