import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

export type Segment<T extends string> = { value: T; label: string; icon?: IconName };

type SegmentedControlProps<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

/** Segmented control with a sliding indicator. */
export function SegmentedControl<T extends string>({ segments, value, onChange }: SegmentedControlProps<T>) {
  const theme = useTheme();
  const { colors } = theme;
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.value === value));
  const position = useAnimatedValue(index);

  useEffect(() => {
    Animated.spring(position, { toValue: index, useNativeDriver: true, damping: 22, stiffness: 260 }).start();
  }, [index, position]);

  const segmentWidth = width > 0 ? (width - 8) / segments.length : 0;
  // On narrow screens, drop icons so labels never get clipped.
  const showIcons = segmentWidth === 0 || segmentWidth >= 104;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessibilityRole="tablist"
      style={[styles.track, { backgroundColor: colors.surface, borderRadius: theme.radius.md }]}>
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: segmentWidth,
              borderRadius: theme.radius.sm + 1,
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.border,
              transform: [{ translateX: Animated.multiply(position, segmentWidth) }],
            },
          ]}
        />
      ) : null}
      {segments.map((segment) => {
        const selected = segment.value === value;
        return (
          <Pressable
            key={segment.value}
            onPress={() => onChange(segment.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={styles.segment}>
            {segment.icon && showIcons ? (
              <Icon name={segment.icon} size={16} color={selected ? colors.text : colors.textTertiary} />
            ) : null}
            <Text variant="label" style={{ color: selected ? colors.text : colors.textTertiary }}>
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 4, height: 44 },
  indicator: { position: 'absolute', top: 4, bottom: 4, left: 4, borderWidth: StyleSheet.hairlineWidth },
  segment: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
});
