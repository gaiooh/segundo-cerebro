import { useEffect } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { Icon, PressableScale } from '@/components';
import { useTheme } from '@/theme';

import type { CaptureStatus } from '../useCaptureSimulation';

type CaptureOrbProps = {
  status: CaptureStatus;
  onPress: () => void;
  size?: number;
};

/**
 * The main capture control. Idle: a calm, slowly breathing orb.
 * Recording: soft halos ripple outward. Not a classic red record button.
 */
export function CaptureOrb({ status, onPress, size = 132 }: CaptureOrbProps) {
  const theme = useTheme();
  const { colors } = theme;
  const breath = useAnimatedValue(0);
  const ripple = useAnimatedValue(0);
  const recording = status === 'recording';

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 2600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  useEffect(() => {
    if (!recording) {
      ripple.stopAnimation();
      ripple.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ripple, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [recording, ripple]);

  const halo = size * 1.75;

  return (
    <View style={[styles.wrap, { width: halo, height: halo }]}>
      {/* Static soft aura */}
      <Animated.View
        style={[
          styles.circle,
          {
            width: halo,
            height: halo,
            borderRadius: halo / 2,
            backgroundColor: colors.accentSoft,
            opacity: breath.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] }),
            transform: [{ scale: breath.interpolate({ inputRange: [0, 1], outputRange: [0.86, 0.94] }) }],
          },
        ]}
      />
      {/* Ripples while recording */}
      {[0, 0.5].map((offset) => (
        <Animated.View
          key={offset}
          pointerEvents="none"
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: 1.5,
              borderColor: colors.accent,
              opacity: recording
                ? Animated.modulo(Animated.add(ripple, offset), 1).interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 0],
                  })
                : 0,
              transform: [
                {
                  scale: Animated.modulo(Animated.add(ripple, offset), 1).interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.7],
                  }),
                },
              ],
            },
          ]}
        />
      ))}
      <PressableScale
        onPress={onPress}
        disabled={status === 'saving'}
        pressedScale={0.94}
        accessibilityRole="button"
        accessibilityLabel={recording ? 'Parar gravação' : 'Começar a gravar'}
        style={[
          styles.orb,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: recording ? colors.inverse : colors.accent,
            shadowColor: colors.accent,
          },
        ]}>
        {recording ? (
          <Icon name="stop" size={size * 0.26} color={colors.onInverse} filled strokeWidth={1} />
        ) : (
          <Icon name="mic" size={size * 0.3} color={colors.onAccent} strokeWidth={1.7} />
        )}
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute' },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
});
