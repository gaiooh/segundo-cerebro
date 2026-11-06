import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

type OptionRowProps = {
  label: string;
  description?: string;
  icon?: IconName;
  selected?: boolean;
  /** Right-side content (value text, switch, chevron...). */
  trailing?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  /** Horizontal padding; defaults to the sheet inset. */
  inset?: number;
};

/** A single selectable row, used in sheets and settings lists. */
export function OptionRow({ label, description, icon, selected, trailing, onPress, destructive, inset }: OptionRowProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const tone = destructive ? colors.danger : colors.text;

  return (
    <PressableScale
      onPress={onPress}
      disabled={!onPress}
      pressedScale={0.985}
      accessibilityRole="button"
      accessibilityState={selected !== undefined ? { selected } : undefined}
      style={[styles.row, { paddingHorizontal: inset ?? spacing.xl, paddingVertical: spacing.md + 2, gap: spacing.md }]}>
      {icon ? <Icon name={icon} size={20} color={destructive ? colors.danger : colors.textSecondary} /> : null}
      <View style={styles.texts}>
        <Text variant="bodyMedium" style={{ color: tone }}>
          {label}
        </Text>
        {description ? (
          <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
            {description}
          </Text>
        ) : null}
      </View>
      {trailing}
      {selected ? <Icon name="check" size={20} color={colors.accent} strokeWidth={2} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  texts: { flex: 1 },
});
