import { StyleSheet, View } from 'react-native';

import { Icon, PressableScale, Text } from '@/components';
import { formatRelativeDate } from '@/lib/format';
import { useTheme } from '@/theme';

import type { NoteSummary } from '../model';

type NoteRowProps = {
  note: NoteSummary;
  showDivider?: boolean;
  onPress?: () => void;
  /** Optional context shown before the date (e.g. the category path). */
  context?: string;
};

/** Collapses Markdown syntax so list previews read as plain text. */
function plain(text: string): string {
  return text
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function NoteRow({ note, showDivider = true, onPress, context }: NoteRowProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  return (
    <View style={{ paddingHorizontal: theme.layout.screenPadding }}>
      <PressableScale
        onPress={onPress}
        disabled={!onPress}
        pressedScale={0.985}
        accessibilityRole="button"
        accessibilityLabel={note.title}
        style={[styles.row, { paddingVertical: spacing.lg, gap: spacing.md }]}>
        <View style={styles.texts}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {note.title}
          </Text>
          <Text variant="callout" color="secondary" numberOfLines={2} style={{ marginTop: spacing.xs }}>
            {plain(note.excerpt)}
          </Text>
          <View style={[styles.meta, { marginTop: spacing.sm, gap: spacing.xs }]}>
            {note.source === 'voice' ? <Icon name="mic" size={13} color={colors.textTertiary} /> : null}
            <Text variant="caption" color="tertiary" numberOfLines={1} style={styles.flexShrink}>
              {context ? `${context} · ` : ''}
              {formatRelativeDate(note.updatedAt)}
            </Text>
          </View>
        </View>
      </PressableScale>
      {showDivider ? <View style={[styles.divider, { backgroundColor: colors.separator }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  texts: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  flexShrink: { flexShrink: 1 },
  divider: { height: StyleSheet.hairlineWidth * 2 },
});
