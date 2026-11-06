import { useState } from 'react';
import { Animated } from 'react-native';

/**
 * Stable Animated.Value for the component's lifetime.
 * Cross-platform replacement for React Native's `useAnimatedValue`,
 * which react-native-web does not provide.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const [value] = useState(() => new Animated.Value(initialValue));
  return value;
}
