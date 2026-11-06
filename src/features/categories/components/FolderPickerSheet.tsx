import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Icon, PressableScale, Sheet, Text } from '@/components';
import { useTheme } from '@/theme';

import { useCategories } from '../CategoriesProvider';
import type { Folder } from '../types';
import { FolderGlyph } from './FolderGlyph';

type FolderPickerSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  /** Current folder of the item being moved (null = not filed). */
  selectedId: string | null;
  onSelect: (folderId: string | null) => void;
};

/** Pick a destination category: the whole tree, indented, plus "Sem categoria". */
export function FolderPickerSheet({ visible, onClose, title = 'Mover para', selectedId, onSelect }: FolderPickerSheetProps) {
  const theme = useTheme();
  const { height } = useWindowDimensions();
  const { getChildren } = useCategories();

  const rows: { folder: Folder; depth: number }[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const folder of getChildren(parentId)) {
      rows.push({ folder, depth });
      walk(folder.id, depth + 1);
    }
  };
  walk(null, 0);

  const pick = (id: string | null) => {
    onSelect(id);
    onClose();
  };

  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <ScrollView style={{ maxHeight: height * 0.6 }} keyboardShouldPersistTaps="handled">
        <Row
          label="Sem categoria"
          depth={0}
          selected={selectedId === null}
          onPress={() => pick(null)}
          glyph={
            <View style={[styles.inbox, { backgroundColor: theme.colors.surface }]}>
              <Icon name="inbox" size={18} color={theme.colors.textSecondary} />
            </View>
          }
        />
        {rows.map(({ folder, depth }) => (
          <Row
            key={folder.id}
            label={folder.name}
            depth={depth}
            selected={selectedId === folder.id}
            onPress={() => pick(folder.id)}
            glyph={<FolderGlyph tint={folder.tint} size={depth === 0 ? 32 : 28} />}
          />
        ))}
        {rows.length === 0 ? (
          <Text variant="caption" color="tertiary" style={{ paddingHorizontal: theme.spacing.xl, paddingTop: theme.spacing.sm }}>
            Crie categorias na aba Categorias para organizar suas notas.
          </Text>
        ) : null}
      </ScrollView>
    </Sheet>
  );
}

function Row({
  label,
  depth,
  selected,
  onPress,
  glyph,
}: {
  label: string;
  depth: number;
  selected: boolean;
  onPress: () => void;
  glyph: React.ReactNode;
}) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.985}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={[styles.row, { paddingLeft: theme.spacing.xl + depth * 24, paddingRight: theme.spacing.xl, gap: theme.spacing.md }]}>
      {glyph}
      <Text variant={depth === 0 ? 'bodyMedium' : 'callout'} numberOfLines={1} style={styles.flex}>
        {label}
      </Text>
      {selected ? <Icon name="check" size={20} color={theme.colors.accent} strokeWidth={2} /> : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 52 },
  flex: { flex: 1 },
  inbox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
