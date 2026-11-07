import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, IconButton, Scrim, Text } from '@/components';
import { getDemoNetwork, IdeaDetail, KnowledgeNetwork3D } from '@/features/semantic-links';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

/**
 * Ligações — an immersive 3D map of the knowledge network. The network fills
 * the screen; title, filters and the selection card float above it.
 */
export default function LinksScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const network = useMemo(() => getDemoNetwork(), []);
  const [focusCategory, setFocusCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [resetSignal, setResetSignal] = useState(0);

  const chooseCategory = (id: string | null) => {
    setSelected(null);
    setFocusCategory((current) => (current === id ? null : id));
  };

  const idea = selected !== null ? network.nodes[selected] : undefined;
  const categoryOf = (id: string) => network.categories.find((c) => c.id === id);
  const related = useMemo(
    () =>
      selected === null
        ? []
        : network.neighbors[selected].map((index) => ({
            index,
            node: network.nodes[index],
            category: network.categories.find((c) => c.id === network.nodes[index].categoryId),
          })),
    [network, selected],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <KnowledgeNetwork3D
        network={network}
        focusCategory={focusCategory}
        selected={selected}
        onSelect={(index) => setSelected((current) => (index === current ? null : index))}
        resetSignal={resetSignal}
      />

      {/* Top overlay: title + filters. Empty areas let gestures through. */}
      <View style={[styles.top, { paddingTop: insets.top }]} pointerEvents="box-none">
        <Scrim color={colors.background} from="top" style={styles.topScrim} />
        <View
          style={[styles.header, { paddingHorizontal: theme.layout.screenPadding, paddingTop: spacing.lg }]}
          pointerEvents="box-none">
          <View pointerEvents="none" style={styles.flex}>
            <Text variant="display" accessibilityRole="header">
              Ligações
            </Text>
            <Text variant="callout" color="tertiary" style={{ marginTop: spacing.xs }}>
              {pluralize(network.nodes.length, 'ideia', 'ideias')} · {pluralize(network.edges.length, 'conexão', 'conexões')}
            </Text>
          </View>
          <IconButton
            icon="focus"
            variant="tonal"
            size={40}
            accessibilityLabel="Recentralizar a rede"
            onPress={() => {
              setSelected(null);
              setFocusCategory(null);
              setResetSignal((n) => n + 1);
            }}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chips}
          contentContainerStyle={{
            paddingHorizontal: theme.layout.screenPadding,
            gap: spacing.sm,
            paddingVertical: spacing.md,
          }}>
          <Chip label="Todas" selected={focusCategory === null} onPress={() => chooseCategory(null)} />
          {network.categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              dotColor={theme.tint(category.tint).dot}
              selected={focusCategory === category.id}
              onPress={() => chooseCategory(category.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Bottom overlay: selection context, or a quiet hint. */}
      <View style={[styles.bottom, { padding: theme.layout.screenPadding }]} pointerEvents="box-none">
        <Scrim color={colors.background} from="bottom" />
        <View style={[styles.column, { maxWidth: theme.layout.maxContentWidth }]} pointerEvents="box-none">
          {idea ? (
            <IdeaDetail
              idea={idea}
              category={categoryOf(idea.categoryId)}
              related={related}
              onSelect={setSelected}
              onClose={() => setSelected(null)}
            />
          ) : (
            <Text variant="caption" color="tertiary" align="center" pointerEvents="none">
              Arraste para girar · pinça para aproximar · toque em uma ideia
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  top: { position: 'absolute', left: 0, right: 0, top: 0 },
  header: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  chips: { flexGrow: 0 },
  // Extends below the chips so the fade ends softly over the network.
  topScrim: { bottom: -36 },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center', paddingTop: 40 },
  column: { width: '100%' },
});
