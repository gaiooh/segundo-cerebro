import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Chip, FadeIn, Screen, ScreenHeader, Text } from '@/components';
import { GraphView, IdeaDetail, layoutGraph, mockGraph, neighborsOf } from '@/features/semantic-links';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

export default function LinksScreen() {
  const theme = useTheme();
  const { spacing } = theme;
  const graph = mockGraph;
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focusCategory, setFocusCategory] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const nodes = useMemo(
    () => (size.width > 0 && size.height > 0 ? layoutGraph(graph, size.width, size.height, { top: 40, right: 48, bottom: 64, left: 48 }) : []),
    [graph, size.width, size.height],
  );

  const selected = selectedId ? graph.nodes.find((n) => n.id === selectedId) : undefined;
  const related = useMemo(() => {
    if (!selectedId) return [];
    const ids = neighborsOf(graph, selectedId);
    return graph.nodes.filter((n) => ids.has(n.id));
  }, [graph, selectedId]);

  const chooseCategory = (id: string | null) => {
    setSelectedId(null);
    setFocusCategory((current) => (current === id ? null : id));
  };

  return (
    <Screen>
      <ScreenHeader
        title="Ligações"
        subtitle={`${pluralize(graph.nodes.length, 'ideia', 'ideias')} · ${pluralize(graph.edges.length, 'conexão', 'conexões')}`}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chips}
        contentContainerStyle={{ paddingHorizontal: theme.layout.screenPadding, gap: spacing.sm }}>
        <Chip label="Todas" selected={focusCategory === null} onPress={() => chooseCategory(null)} />
        {graph.categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            dotColor={theme.tint(category.tint).dot}
            selected={focusCategory === category.id}
            onPress={() => chooseCategory(category.id)}
          />
        ))}
      </ScrollView>

      <View
        style={styles.canvas}
        onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
        {nodes.length > 0 ? (
          <FadeIn offset={0} style={StyleSheet.absoluteFill}>
            <GraphView
              graph={graph}
              nodes={nodes}
              width={size.width}
              height={size.height}
              focusCategory={focusCategory}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </FadeIn>
        ) : null}

        <View style={[styles.overlay, { padding: theme.layout.screenPadding }]} pointerEvents="box-none">
          {selected ? (
            <IdeaDetail
              idea={selected}
              category={graph.categories.find((c) => c.id === selected.categoryId)}
              related={related}
              onSelect={setSelectedId}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <Text variant="caption" color="tertiary" align="center">
              Toque em uma ideia para ver suas ligações
            </Text>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexGrow: 0, marginBottom: 4 },
  canvas: { flex: 1 },
  overlay: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
