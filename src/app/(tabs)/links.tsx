import { router, useIsFocused } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chip, IconButton, Scrim, Text } from '@/components';
import {
  countNoteLinks,
  getDemoNetwork,
  IdeaDetail,
  KnowledgeNetwork3D,
  useNoteNetwork,
  type KnowledgeNetwork,
  type NetworkNode,
} from '@/features/semantic-links';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

/**
 * Ligações — an immersive 3D map of the knowledge network. The network fills
 * the screen; title, filters and the selection card float above it.
 *
 * It shows the user's real notes, folders and [[links]]. Only while there are
 * no notes yet, a fictional demo network is shown, clearly labeled as such.
 */
export default function LinksScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { network: noteNetwork, ready } = useNoteNetwork(focused);
  const isDemo = ready && noteNetwork === null;
  const network = useMemo(() => noteNetwork ?? getDemoNetwork(), [noteNetwork]);
  const sceneKey = useMemo(() => (noteNetwork ? `notes-${networkVersion(noteNetwork)}` : 'demo'), [noteNetwork]);
  const [focusCategory, setFocusCategory] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [resetSignal, setResetSignal] = useState(0);
  const [shownNetwork, setShownNetwork] = useState(network);
  // Node indices belong to one network: a rebuilt network starts unselected
  // (derived state, adjusted during render).
  if (shownNetwork !== network) {
    setShownNetwork(network);
    setSelected(null);
    if (focusCategory && !network.categories.some((c) => c.id === focusCategory)) setFocusCategory(null);
  }

  const chooseCategory = (id: string | null) => {
    setSelected(null);
    setFocusCategory((current) => (current === id ? null : id));
  };

  const idea = selected !== null ? network.nodes[selected] : undefined;
  const openIdea = (node: NetworkNode) =>
    node.kind === 'note'
      ? router.push({ pathname: '/note/[id]', params: { id: node.id } })
      : router.push({ pathname: '/folder/[id]', params: { id: node.id } });
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
      {/* A new network means a new scene: remount instead of patching the renderer. */}
      <KnowledgeNetwork3D
        key={sceneKey}
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
              {!ready
                ? ' '
                : isDemo
                  ? 'Exemplo fictício · suas notas aparecem aqui'
                  : `${pluralize(network.nodes.filter((n) => n.kind === 'note').length, 'nota', 'notas')} · ${pluralize(
                      countNoteLinks(network),
                      'ligação',
                      'ligações',
                    )}`}
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
              onOpen={isDemo || idea.kind === 'concept' ? undefined : () => openIdea(idea)}
            />
          ) : (
            <Text variant="caption" color="tertiary" align="center" pointerEvents="none">
              {isDemo
                ? 'Registre ideias e ligue notas com [[Título]] para formar a sua rede'
                : 'Arraste para girar · pinça para aproximar · toque em uma ideia'}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

/** Changes whenever nodes (ids, labels, groups) or edges change, even with equal counts. */
function networkVersion(network: KnowledgeNetwork): string {
  let hash = 0;
  const add = (text: string) => {
    for (let i = 0; i < text.length; i++) hash = (Math.imul(hash, 31) + text.charCodeAt(i)) | 0;
  };
  for (const node of network.nodes) add(`${node.id}|${node.label}|${node.categoryId};`);
  for (const edge of network.edges) add(`${edge.source}-${edge.target};`);
  return (hash >>> 0).toString(36);
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
