import { Animated, Pressable, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

type PressableScaleProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Layout style for the outer touch target (e.g. `{ flex: 1 }` inside a row). */
  containerStyle?: StyleProp<ViewStyle>;
  /** Scale applied while pressed. Subtle by default. */
  pressedScale?: number;
};

/**
 * Pressable with a soft scale + fade feedback. Base building block for every
 * tappable element so interactions feel consistent across the app.
 */
export function PressableScale({
  style,
  containerStyle,
  pressedScale = 0.97,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const progress = useAnimatedValue(0);
  // A static opacity (e.g. a disabled look) goes on the container so the
  // press animation, which also animates opacity, cannot override it.
  const { opacity, ...innerStyle } = flattenStyle(style);

  const animateTo = (value: number) =>
    Animated.spring(progress, { toValue: value, useNativeDriver: true, damping: 20, stiffness: 300, mass: 0.6 }).start();

  return (
    <Pressable
      {...rest}
      style={[containerStyle, opacity !== undefined ? { opacity } : null]}
      onPressIn={(e) => {
        animateTo(1);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        animateTo(0);
        onPressOut?.(e);
      }}>
      {(state) => (
        <Animated.View
          style={[
            innerStyle,
            {
              opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] }),
              transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, pressedScale] }) }],
            },
          ]}>
          {typeof children === 'function' ? children(state) : children}
        </Animated.View>
      )}
    </Pressable>
  );
}

/** Merges nested style arrays into one object (works on native and web). */
function flattenStyle(style: StyleProp<ViewStyle>): ViewStyle {
  if (!style) return {};
  if (Array.isArray(style)) return style.reduce<ViewStyle>((acc, item) => ({ ...acc, ...flattenStyle(item) }), {});
  return typeof style === 'object' ? (style as ViewStyle) : {};
}
