import { useEffect, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

type FadeInProps = {
  children: ReactNode;
  delay?: number;
  /** Vertical distance travelled while fading in. */
  offset?: number;
  style?: StyleProp<ViewStyle>;
};

/** Subtle entrance animation (fade + small rise). */
export function FadeIn({ children, delay = 0, offset = 8, style }: FadeInProps) {
  const progress = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(progress, {
      toValue: 1,
      duration: 380,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
        },
      ]}>
      {children}
    </Animated.View>
  );
}
