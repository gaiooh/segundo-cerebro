import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

type ScrimProps = {
  color: string;
  /** Side where the scrim is opaque. */
  from: 'top' | 'bottom';
  style?: StyleProp<ViewStyle>;
};

/**
 * Soft fade from a solid color to transparent, placed behind floating UI so it
 * stays legible over rich content (e.g. the 3D network).
 */
export function Scrim({ color, from, style }: ScrimProps) {
  const id = `scrim-${from}`;
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, style]}>
      <Svg width="100%" height="100%" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id={id} x1="0" y1={from === 'top' ? '0' : '1'} x2="0" y2={from === 'top' ? '1' : '0'}>
            <Stop offset="0" stopColor={color} stopOpacity={0.96} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0.75} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
