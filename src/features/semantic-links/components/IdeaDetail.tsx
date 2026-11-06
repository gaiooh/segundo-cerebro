import { StyleSheet, View } from 'react-native';

import { FadeIn, IconButton, PressableScale, Text } from '@/components';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

import type { GraphCategory, IdeaNode } from '../types';

type IdeaDetailProps = {
  idea: IdeaNode;
  category?: GraphCategory;
  related: IdeaNode[];
  onSelect: (id: string) => void;
  onClose: () => void;
};

/** Compact card describing the selected idea and its connections. */
export function IdeaDetail({ idea, category, related, onSelect, onClose }: IdeaDetailProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const tint = category ? theme.tint(category.tint) : undefined;

  return (
    <FadeIn key={idea.id} offset={12}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: colors.border,
            borderRadius: theme.radius.lg,
            padding: spacing.lg,
            shadowColor: '#000',
          },
        ]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            {category && tint ? (
              <View style={[styles.categoryRow, { gap: 6 }]}>
                <View style={[styles.dot, { backgroundColor: tint.dot }]} />
                <Text variant="caption" color="tertiary">
                  {category.name} · {pluralize(related.length, 'ligação', 'ligações')}
                </Text>
              </View>
            ) : null}
            <Text variant="headline" numberOfLines={2} style={{ marginTop: 4 }}>
              {idea.label}
            </Text>
          </View>
          <IconButton icon="close" size={32} accessibilityLabel="Fechar" onPress={onClose} color={colors.textTertiary} />
        </View>
        {related.length > 0 ? (
          <View style={[styles.related, { marginTop: spacing.md, gap: spacing.xs }]}>
            {related.slice(0, 3).map((item) => (
              <PressableScale
                key={item.id}
                onPress={() => onSelect(item.id)}
                accessibilityRole="button"
                style={[styles.relatedRow, { gap: spacing.sm }]}>
                <View style={[styles.line, { backgroundColor: colors.accent }]} />
                <Text variant="callout" color="secondary" numberOfLines={1} style={styles.flex}>
                  {item.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        ) : null}
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  headerText: { flex: 1, paddingRight: 8 },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  related: {},
  relatedRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  line: { width: 12, height: 1.5, borderRadius: 1 },
  flex: { flex: 1 },
});
