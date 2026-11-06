import { useEffect } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { Icon } from '@/components';
import { useTheme } from '@/theme';

/** Three softly pulsing dots shown while a reply is on its way. */
export function ThinkingIndicator() {
  const theme = useTheme();
  const progress = useAnimatedValue(0);

  useEffect(() => {
    const loop = Animated.loop(Animated.timing(progress, { toValue: 1, duration: 1200, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [progress]);

  return (
    <View style={[styles.row, { gap: theme.spacing.md }]} accessibilityLabel="Pensando">
      <View style={[styles.avatar, { backgroundColor: theme.colors.accentSoft }]}>
        <Icon name="sparkle" size={15} color={theme.colors.accent} strokeWidth={1.7} />
      </View>
      <View style={styles.dots}>
        {[0, 1, 2].map((i) => (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: theme.colors.textTertiary,
                opacity: progress.interpolate({
                  inputRange: [0, (i + 0.5) / 4, (i + 1.5) / 4, 1],
                  outputRange: [0.25, 1, 0.25, 0.25],
                  extrapolate: 'clamp',
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  dots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
