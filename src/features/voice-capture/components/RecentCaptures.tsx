import { ScrollView, StyleSheet, View } from 'react-native';

import { FadeIn, Icon, PressableScale, Text } from '@/components';
import { formatRelativeDate } from '@/lib/format';
import { useTheme } from '@/theme';

import type { RecentCapture } from '../useRecentCaptures';

type RecentCapturesProps = {
  items: RecentCapture[];
  onOpen?: (noteId: string) => void;
};

/** Discreet horizontal strip of the latest captures. */
export function RecentCaptures({ items, onOpen }: RecentCapturesProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;

  if (items.length === 0) return null;

  return (
    <View>
      <Text
        variant="overline"
        color="tertiary"
        style={{ paddingHorizontal: theme.layout.screenPadding, marginBottom: spacing.sm }}>
        RECENTES
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenPadding, gap: spacing.sm }}>
        {items.map((item) => (
          <FadeIn key={item.id} offset={4}>
            <PressableScale
              onPress={item.noteId && onOpen ? () => onOpen(item.noteId!) : undefined}
              disabled={!item.noteId || !onOpen}
              accessibilityRole={item.noteId ? 'button' : undefined}
              accessibilityLabel={item.title}
              style={[
                styles.card,
                {
                  borderColor: item.pending ? colors.accent : colors.border,
                  backgroundColor: item.pending ? colors.accentSoft : colors.background,
                  borderRadius: theme.radius.md,
                  padding: spacing.md,
                },
              ]}>
              <Text variant="label" numberOfLines={2} style={styles.title}>
                {item.title}
              </Text>
              <View style={[styles.meta, { gap: 5 }]}>
                <Icon
                  name={item.source === 'voice' ? 'mic' : 'keyboard'}
                  size={12}
                  color={item.pending ? colors.accentText : colors.textTertiary}
                />
                <Text variant="caption" style={{ color: item.pending ? colors.accentText : colors.textTertiary }}>
                  {item.pending ? 'Agora · demonstração' : formatRelativeDate(item.createdAt)}
                </Text>
              </View>
            </PressableScale>
          </FadeIn>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 168, height: 84, borderWidth: StyleSheet.hairlineWidth * 2, justifyContent: 'space-between' },
  title: { lineHeight: 18 },
  meta: { flexDirection: 'row', alignItems: 'center' },
});
