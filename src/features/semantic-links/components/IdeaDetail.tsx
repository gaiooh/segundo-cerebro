import { ScrollView, StyleSheet, View } from 'react-native';

import { FadeIn, Icon, IconButton, PressableScale, Text } from '@/components';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

import type { NetworkCategory, NetworkNode } from '../types';

type RelatedIdea = { index: number; node: NetworkNode; category?: NetworkCategory };

type IdeaDetailProps = {
  idea: NetworkNode;
  category?: NetworkCategory;
  related: RelatedIdea[];
  onSelect: (index: number) => void;
  onClose: () => void;
};

/** Compact card with the selected idea and its connections, over the network. */
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
            paddingTop: spacing.lg,
            paddingBottom: spacing.sm,
            shadowColor: '#000',
          },
        ]}>
        <View style={[styles.header, { paddingHorizontal: spacing.lg }]}>
          <View style={styles.headerText}>
            <View style={[styles.row, { gap: 6 }]}>
              {tint ? <View style={[styles.dot, { backgroundColor: tint.dot }]} /> : null}
              <Text variant="caption" color="tertiary">
                {[category?.name, idea.kind === 'note' ? 'Nota' : 'Conceito', pluralize(related.length, 'ligação', 'ligações')]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <Text variant="headline" numberOfLines={2} style={{ marginTop: 4 }}>
              {idea.label}
            </Text>
          </View>
          <IconButton icon="close" size={32} accessibilityLabel="Fechar" onPress={onClose} color={colors.textTertiary} />
        </View>

        {related.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm, paddingVertical: spacing.md }}>
            {related.map(({ index, node, category: relatedCategory }) => (
              <PressableScale
                key={node.id}
                onPress={() => onSelect(index)}
                accessibilityRole="button"
                accessibilityLabel={`Ir para ${node.label}`}
                pressedScale={0.95}
                style={[
                  styles.chip,
                  { borderColor: colors.border, backgroundColor: colors.background, borderRadius: theme.radius.pill },
                ]}>
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: relatedCategory ? theme.tint(relatedCategory.tint).dot : colors.textTertiary },
                  ]}
                />
                <Text variant="label" color="secondary" numberOfLines={1} style={styles.chipText}>
                  {node.label}
                </Text>
                <Icon name="chevronRight" size={14} color={colors.textTertiary} />
              </PressableScale>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </FadeIn>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start' },
  headerText: { flex: 1, paddingRight: 8 },
  row: { flexDirection: 'row', alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingLeft: 12,
    paddingRight: 8,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  chipText: { maxWidth: 170 },
});
