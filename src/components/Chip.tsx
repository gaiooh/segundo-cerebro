import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Optional color dot (e.g. category tint). */
  dotColor?: string;
};

export function Chip({ label, selected = false, onPress, dotColor }: ChipProps) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      pressedScale={0.95}
      style={[
        styles.chip,
        {
          borderRadius: theme.radius.pill,
          backgroundColor: selected ? colors.inverse : 'transparent',
          borderColor: selected ? colors.inverse : colors.border,
        },
      ]}>
      {dotColor ? <View style={[styles.dot, { backgroundColor: dotColor }]} /> : null}
      <Text variant="label" style={{ color: selected ? colors.onInverse : colors.textSecondary }}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
