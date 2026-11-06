import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';

import { Screen, ScreenHeader } from '@/components';
import {
  CreateFolderSheet,
  FolderActions,
  FolderBrowser,
  SortSheet,
  useCategories,
  type Folder,
} from '@/features/categories';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

export default function CategoriesScreen() {
  const theme = useTheme();
  const { getChildren, totalNotes } = useCategories();
  const [sortOpen, setSortOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const categories = getChildren(null);
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
              onSort={() => setSortOpen(true)}
              onCreate={() => setCreateOpen(true)}
              onDoneReordering={() => setReordering(false)}
            />
          }
        />
        <FolderBrowser parentId={null} onOpen={open} reordering={reordering} />
      </ScrollView>

      <SortSheet visible={sortOpen} onClose={() => setSortOpen(false)} onStartReorder={() => setReordering(true)} />
      <CreateFolderSheet visible={createOpen} onClose={() => setCreateOpen(false)} />
    </Screen>
  );
}
