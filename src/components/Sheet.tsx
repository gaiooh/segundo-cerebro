import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Text } from './Text';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Bottom sheet used for every secondary option (sorting, creating, menus),
 * keeping screens free of permanent controls.
 */
export function Sheet({ visible, onClose, title, children }: SheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useAnimatedValue(0);
  const [mounted, setMounted] = useState(visible);
  // Mount as soon as it should be visible (derived state, set during render).
  if (visible && !mounted) setMounted(true);

  useEffect(() => {
    if (visible) {
      Animated.timing(progress, {
        toValue: 1,
        duration: theme.motion.normal,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: theme.motion.fast,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible, progress, theme.motion.fast, theme.motion.normal]);

  if (!mounted) return null;

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.overlay, opacity: progress }]}>
          <Pressable style={styles.fill} onPress={onClose} accessibilityLabel="Fechar" />
        </Animated.View>
        <View style={styles.anchor} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.sheet,
              {
                maxWidth: theme.layout.maxContentWidth,
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                borderTopLeftRadius: theme.radius.xl,
                borderTopRightRadius: theme.radius.xl,
                paddingBottom: Math.max(insets.bottom, theme.spacing.lg) + theme.spacing.sm,
                transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [360, 0] }) }],
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
            {title ? (
              <Text variant="headline" style={{ paddingHorizontal: theme.spacing.xl, paddingBottom: theme.spacing.md }}>
                {title}
              </Text>
            ) : null}
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  anchor: { ...StyleSheet.absoluteFill, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { width: '100%', borderWidth: StyleSheet.hairlineWidth, borderBottomWidth: 0, paddingTop: 10 },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 14 },
});
