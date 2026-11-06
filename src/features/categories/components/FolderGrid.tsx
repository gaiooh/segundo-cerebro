import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { FadeIn, Icon, PressableScale, Text } from '@/components';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

import { useCategories } from '../CategoriesProvider';
import type { Folder } from '../types';

type FolderGridProps = {
  parentId: string | null;
  onOpen: (folder: Folder) => void;
};

const GAP = 12;

/** Visual folder cards in a responsive grid (2 columns on phones). */
export function FolderGrid({ parentId, onOpen }: FolderGridProps) {
  const theme = useTheme();
  const { getChildren, countNotes } = useCategories();
  const [width, setWidth] = useState(0);
  const folders = getChildren(parentId);

  const columns = width >= 560 ? 3 : 2;
  const cardWidth = width > 0 ? (width - GAP * (columns - 1)) / columns : 0;

  return (
    <View
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.grid, { marginHorizontal: theme.layout.screenPadding }]}>
      {cardWidth > 0
        ? folders.map((folder, index) => (
            <FadeIn key={folder.id} delay={index * 30} style={{ width: cardWidth }}>
              <FolderCard
                folder={folder}
                noteCount={countNotes(folder.id)}
                subfolderCount={getChildren(folder.id).length}
                onPress={() => onOpen(folder)}
              />
            </FadeIn>
          ))
        : null}
    </View>
  );
}

type FolderCardProps = {
  folder: Folder;
  noteCount: number;
  subfolderCount: number;
  onPress: () => void;
};

function FolderCard({ folder, noteCount, subfolderCount, onPress }: FolderCardProps) {
  const theme = useTheme();
  const tint = theme.tint(folder.tint);
  const { spacing } = theme;

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${folder.name}, ${pluralize(noteCount, 'nota', 'notas')}`}
      style={[styles.card, { backgroundColor: tint.fill, borderRadius: theme.radius.lg, padding: spacing.lg }]}>
      {/* Folder-tab silhouette: a quiet nod to a physical folder. */}
      <Svg width={64} height={16} viewBox="0 0 64 16" style={styles.tab}>
        <Path d="M0 16V6a6 6 0 0 1 6-6h22c3 0 4.5 1.4 6 3.5L42 16z" fill={tint.dot} opacity={0.18} />
      </Svg>
      <Icon name="folder" size={22} color={tint.ink} strokeWidth={1.7} />
      <View style={styles.spacer} />
      <Text variant="headline" numberOfLines={2} style={{ color: tint.ink }}>
        {folder.name}
      </Text>
      <Text variant="caption" style={{ color: tint.ink, opacity: 0.72, marginTop: 4 }}>
        {pluralize(noteCount, 'nota', 'notas')}
        {subfolderCount > 0 ? `  ·  ${pluralize(subfolderCount, 'pasta', 'pastas')}` : ''}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  card: { aspectRatio: 1.08, overflow: 'hidden' },
  tab: { position: 'absolute', top: 0, right: 16 },
  spacer: { flex: 1 },
});
