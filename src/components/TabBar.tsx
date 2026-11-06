import { useEffect, useState } from 'react';
import { Animated, Keyboard, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import type { BottomTabBarProps } from 'expo-router/tabs';

import { useTheme } from '@/theme';

import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export type TabMeta = { label: string; icon: IconName; primary?: boolean };

type TabBarProps = BottomTabBarProps & {
  /** Visual metadata per route name. */
  meta: Record<string, TabMeta>;
};

/**
 * Custom bottom bar: four quiet tabs and one prominent central action (Falar).
 */
export function TabBar({ state, descriptors, emitter, navigateToTab, insets, meta }: TabBarProps) {
  const theme = useTheme();
  const { colors } = theme;
  const keyboardVisible = useKeyboardVisible();

  // On Android the bar would ride above the keyboard; hide it while typing.
  if (keyboardVisible && Platform.OS === 'android') return null;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background,
          borderTopColor: colors.separator,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}>
      <View style={[styles.row, { maxWidth: theme.layout.maxContentWidth }]}>
        {state.routes.map((route, index) => {
          const focused = index === state.index;
          const info = meta[route.name];
          if (!info) return null;
          const { options } = descriptors[route.key];

          const onPress = () => {
            const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigateToTab(route.key);
          };

          if (info.primary) {
            return <PrimaryTab key={route.key} label={info.label} icon={info.icon} focused={focused} onPress={onPress} />;
          }

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? info.label}
              style={styles.tab}>
              <TabIcon icon={info.icon} focused={focused} />
              <Text variant="tab" style={{ color: focused ? colors.text : colors.textTertiary, marginTop: 4 }}>
                {info.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ icon, focused }: { icon: IconName; focused: boolean }) {
  const theme = useTheme();
  const progress = useAnimatedValue(focused ? 1 : 0);

  useEffect(() => {
    Animated.spring(progress, { toValue: focused ? 1 : 0, useNativeDriver: true, damping: 16, stiffness: 240 }).start();
  }, [focused, progress]);

  return (
    <View style={styles.iconWrap}>
      <Animated.View
        style={{ transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }}>
        <Icon
          name={icon}
          size={23}
          color={focused ? theme.colors.text : theme.colors.textTertiary}
          strokeWidth={focused ? 1.9 : 1.6}
        />
      </Animated.View>
      <Animated.View
        style={[
          styles.dot,
          {
            backgroundColor: theme.colors.accent,
            opacity: progress,
            transform: [{ scale: progress }],
          },
        ]}
      />
    </View>
  );
}

function PrimaryTab({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const { colors } = theme;
  return (
    <View style={styles.tab}>
      <PressableScale
        onPress={onPress}
        pressedScale={0.9}
        accessibilityRole="tab"
        accessibilityState={{ selected: focused }}
        accessibilityLabel={label}
        style={[
          styles.primary,
          {
            backgroundColor: focused ? colors.accentSoft : colors.accent,
            shadowColor: colors.accent,
            // On the Falar screen the big orb is the hero; the tab steps back.
            shadowOpacity: focused ? 0 : 0.28,
            elevation: focused ? 0 : 6,
            borderColor: colors.background,
          },
        ]}>
        <Icon name={icon} size={26} color={focused ? colors.accent : colors.onAccent} strokeWidth={1.9} />
      </PressableScale>
      <Text variant="tab" style={{ color: focused ? colors.text : colors.textTertiary, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setVisible(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
}

const PRIMARY_SIZE = 58;

const styles = StyleSheet.create({
  bar: { borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  row: { flexDirection: 'row', width: '100%', height: 60, alignItems: 'flex-end' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 6 },
  iconWrap: { alignItems: 'center', height: 28 },
  dot: { position: 'absolute', bottom: -3, width: 4, height: 4, borderRadius: 2 },
  primary: {
    width: PRIMARY_SIZE,
    height: PRIMARY_SIZE,
    borderRadius: PRIMARY_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -22,
    borderWidth: 4,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 6,
  },
});
