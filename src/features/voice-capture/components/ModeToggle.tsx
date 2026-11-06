import { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { Icon } from '@/components';
import { useTheme } from '@/theme';

export type CaptureMode = 'voice' | 'text';

type ModeToggleProps = {
  mode: CaptureMode;
  onChange: (mode: CaptureMode) => void;
  disabled?: boolean;
};

const SLOT = 44;

/** Compact two-icon switch: microphone ↔ keyboard, with a sliding highlight. */
export function ModeToggle({ mode, onChange, disabled }: ModeToggleProps) {
  const theme = useTheme();
  const { colors } = theme;
  const position = useAnimatedValue(mode === 'voice' ? 0 : 1);

  useEffect(() => {
    Animated.spring(position, {
      toValue: mode === 'voice' ? 0 : 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 260,
    }).start();
  }, [mode, position]);

  return (
    <View
      accessibilityRole="radiogroup"
      style={[
        styles.track,
        { backgroundColor: colors.surface, borderColor: colors.border, opacity: disabled ? 0.4 : 1 },
      ]}>
      <Animated.View
        style={[
          styles.thumb,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            transform: [{ translateX: position.interpolate({ inputRange: [0, 1], outputRange: [0, SLOT] }) }],
          },
        ]}
      />
      {(['voice', 'text'] as const).map((value) => {
        const selected = mode === value;
        return (
          <Pressable
            key={value}
            disabled={disabled}
            onPress={() => onChange(value)}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={value === 'voice' ? 'Modo voz' : 'Modo texto'}
            style={styles.slot}>
            <Icon
              name={value === 'voice' ? 'mic' : 'keyboard'}
              size={19}
              color={selected ? colors.accent : colors.textTertiary}
              strokeWidth={selected ? 1.9 : 1.6}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 3, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  thumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: SLOT,
    height: 36,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  slot: { width: SLOT, height: 36, alignItems: 'center', justifyContent: 'center' },
});
