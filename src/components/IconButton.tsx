import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

type IconButtonProps = {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  /** "plain": icon only; "tonal": soft surface circle; "filled": ink circle. */
  variant?: 'plain' | 'tonal' | 'filled' | 'accent';
  color?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 40,
  variant = 'plain',
  color,
  disabled,
  style,
}: IconButtonProps) {
  const theme = useTheme();
  const { colors } = theme;

  const background =
    variant === 'tonal'
      ? colors.surface
      : variant === 'filled'
        ? colors.inverse
        : variant === 'accent'
          ? colors.accent
          : 'transparent';
  const iconColor =
    color ??
    (variant === 'filled' ? colors.onInverse : variant === 'accent' ? colors.onAccent : colors.text);

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      pressedScale={0.92}
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: background, opacity: disabled ? 0.35 : 1 },
        style,
      ]}>
      <Icon name={icon} size={Math.round(size * 0.52)} color={iconColor} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
