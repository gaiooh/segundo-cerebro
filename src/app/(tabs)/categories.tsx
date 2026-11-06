import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Icon, PressableScale, Screen, ScreenHeader, Text } from '@/components';
import {
  CreateFolderSheet,
  FolderActions,
  FolderBrowser,
  SortSheet,
  UNFILED_ID,
  useCategories,
  type Folder,
} from '@/features/categories';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { getChildren, getNotes, totalNotes, ready } = useCategories();
  const [sortOpen, setSortOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const categories = getChildren(null);
  const unfiled = getNotes(null).length;
  const open = (folder: Folder) => router.push({ pathname: '/folder/[id]', params: { id: folder.id } });

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Categorias"
          subtitle={
            reordering
              ? 'Use as setas para definir a ordem'
              : `${pluralize(categories.length, 'categoria', 'categorias')} · ${pluralize(totalNotes, 'nota', 'notas')}`
          }
          actions={
            <FolderActions
              reordering={reordering}
              onSearch={() => router.push('/search')}
              onSort={() => setSortOpen(true)}
              onCreate={() => setCreateOpen(true)}
              onDoneReordering={() => setReordering(false)}
            />
          }
        />

        {unfiled > 0 && !reordering ? (
          <UnfiledRow count={unfiled} onPress={() => router.push({ pathname: '/folder/[id]', params: { id: UNFILED_ID } })} />
        ) : null}

        <FolderBrowser parentId={null} onOpen={open} reordering={reordering} />

        {ready && categories.length === 0 ? (
          <View style={[styles.empty, { padding: theme.spacing.xxl }]}>
            <Icon name="folderPlus" size={28} color={theme.colors.textTertiary} />
            <Text variant="callout" color="tertiary" align="center" style={{ marginTop: theme.spacing.md }}>
              Nenhuma categoria ainda.{'\n'}Toque em + para criar a primeira.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <SortSheet visible={sortOpen} onClose={() => setSortOpen(false)} onStartReorder={() => setReordering(true)} />
      <CreateFolderSheet visible={createOpen} onClose={() => setCreateOpen(false)} />
    </Screen>
  );
}

/** Notes captured but not filed yet: always reachable, never hidden in a folder. */
function UnfiledRow({ count, onPress }: { count: number; onPress: () => void }) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <PressableScale
        onPress={onPress}
        pressedScale={0.985}
        accessibilityRole="button"
        accessibilityLabel={`Sem categoria, ${pluralize(count, 'nota', 'notas')}`}
        style={[styles.row, { paddingHorizontal: theme.layout.screenPadding, gap: spacing.md }]}>
        <View style={[styles.glyph, { backgroundColor: colors.accentSoft }]}>
          <Icon name="inbox" size={21} color={colors.accentText} strokeWidth={1.7} />
        </View>
        <View style={styles.flex}>
          <Text variant="bodyMedium">Sem categoria</Text>
          <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
            {pluralize(count, 'nota para organizar', 'notas para organizar')}
          </Text>
        </View>
        <Icon name="chevronRight" size={18} color={colors.textTertiary} />
      </PressableScale>
      <View
        style={[styles.divider, { backgroundColor: colors.separator, marginLeft: theme.layout.screenPadding + 38 + spacing.md }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', marginTop: 24 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: 10, paddingRight: 32 },
  glyph: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  divider: { height: StyleSheet.hairlineWidth * 2 },
});
