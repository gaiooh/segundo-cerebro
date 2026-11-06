import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

type LiveWaveformProps = {
  levels: number[];
  active: boolean;
  height?: number;
};

/** Thin rounded bars showing the (simulated) voice level. */
export function LiveWaveform({ levels, active, height = 36 }: LiveWaveformProps) {
  const theme = useTheme();
  return (
    <View style={[styles.row, { height }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {levels.map((level, index) => {
        // Fade the oldest bars on the left for a sense of flow.
        const opacity = active ? 0.25 + 0.75 * (index / levels.length) : 0.25;
        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height: Math.max(3, level * height),
                backgroundColor: active ? theme.colors.accent : theme.colors.textTertiary,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  bar: { width: 3, borderRadius: 2 },
});
