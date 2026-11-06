import { StyleSheet, View } from 'react-native';

import { FadeIn, Icon, Text } from '@/components';
import { useTheme } from '@/theme';

import type { ChatMessage } from '../types';

/** User messages sit in a soft bubble; assistant replies read as plain prose. */
export function MessageItem({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const { colors, spacing } = theme;

  if (message.role === 'user') {
    return (
      <FadeIn offset={6} style={styles.userRow}>
        <View
          style={[
            styles.userBubble,
            { backgroundColor: colors.surface, borderRadius: theme.radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
          ]}>
          <Text variant="body">{message.text}</Text>
        </View>
      </FadeIn>
    );
  }

  return (
    <FadeIn offset={6} style={[styles.assistantRow, { gap: spacing.md }]}>
      <View style={[styles.avatar, { backgroundColor: colors.accentSoft }]}>
        <Icon name="sparkle" size={15} color={colors.accent} strokeWidth={1.7} />
      </View>
      <Text variant="body" style={styles.flex}>
        {message.text}
      </Text>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  userRow: { alignItems: 'flex-end' },
  userBubble: { maxWidth: '85%', borderBottomRightRadius: 6 },
  assistantRow: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: -2 },
  flex: { flex: 1 },
});
