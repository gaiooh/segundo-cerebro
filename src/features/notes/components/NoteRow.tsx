import { StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components';
import { formatRelativeDate } from '@/lib/format';
import { useTheme } from '@/theme';

import type { Note } from '../types';

type NoteRowProps = {
  note: Note;
  showDivider?: boolean;
};

export function NoteRow({ note, showDivider = true }: NoteRowProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  return (
    <View style={{ paddingHorizontal: theme.layout.screenPadding }}>
      <View style={[styles.row, { paddingVertical: spacing.lg, gap: spacing.md }]}>
        <View style={styles.texts}>
          <Text variant="bodyMedium" numberOfLines={1}>
            {note.title}
          </Text>
          <Text variant="callout" color="secondary" numberOfLines={2} style={{ marginTop: spacing.xs }}>
            {note.body}
          </Text>
          <View style={[styles.meta, { marginTop: spacing.sm, gap: spacing.xs }]}>
            {note.source === 'voice' ? <Icon name="mic" size={13} color={colors.textTertiary} /> : null}
            <Text variant="caption" color="tertiary">
              {formatRelativeDate(note.updatedAt)}
            </Text>
          </View>
        </View>
      </View>
      {showDivider ? <View style={[styles.divider, { backgroundColor: colors.separator }]} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  texts: { flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth * 2 },
});
