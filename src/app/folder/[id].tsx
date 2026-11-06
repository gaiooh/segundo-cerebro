import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn, Icon, IconButton, Screen, ScreenHeader, Text } from '@/components';
import {
  CreateFolderSheet,
  FolderActions,
  FolderBrowser,
  SortSheet,
  useCategories,
  type Folder,
} from '@/features/categories';
import { NoteRow } from '@/features/notes';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

export default function FolderScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getFolder, getChildren, getNotes, countNotes } = useCategories();
  const [sortOpen, setSortOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const folder = getFolder(id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/categories'));

  if (!folder) {
    return (
      <Screen>
        <ScreenHeader title="Pasta não encontrada" leading={<BackButton onPress={back} />} />
      </Screen>
    );
  }

  const parent = folder.parentId ? getFolder(folder.parentId) : undefined;
  const subfolders = getChildren(folder.id);
  const notes = getNotes(folder.id);
  const open = (child: Folder) => router.push({ pathname: '/folder/[id]', params: { id: child.id } });
  const tint = theme.tint(folder.tint);

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title={folder.name}
          subtitle={[parent?.name, pluralize(countNotes(folder.id), 'nota', 'notas')].filter(Boolean).join(' · ')}
          leading={<BackButton onPress={back} />}
          actions={
            <FolderActions
              reordering={reordering}
              onSort={() => setSortOpen(true)}
              onCreate={() => setCreateOpen(true)}
              onDoneReordering={() => setReordering(false)}
            />
          }
        />

        <View style={[styles.accent, { backgroundColor: tint.dot, marginLeft: theme.layout.screenPadding }]} />

        {subfolders.length > 0 ? (
          <View style={{ marginBottom: theme.spacing.xl }}>
            <SectionLabel>Subpastas</SectionLabel>
            <FolderBrowser parentId={folder.id} onOpen={open} reordering={reordering} />
          </View>
        ) : null}

        {notes.length > 0 ? (
          <FadeIn delay={60}>
            <SectionLabel>Notas</SectionLabel>
            {notes.map((note, index) => (
              <NoteRow key={note.id} note={note} showDivider={index < notes.length - 1} />
            ))}
          </FadeIn>
        ) : subfolders.length === 0 ? (
          <View style={[styles.empty, { padding: theme.spacing.xxl }]}>
            <Icon name="note" size={28} color={theme.colors.textTertiary} />
            <Text variant="callout" color="tertiary" align="center" style={{ marginTop: theme.spacing.md }}>
              Nenhuma nota aqui ainda.{'\n'}O que você registrar nesta categoria aparece aqui.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <SortSheet visible={sortOpen} onClose={() => setSortOpen(false)} onStartReorder={() => setReordering(true)} />
      <CreateFolderSheet visible={createOpen} onClose={() => setCreateOpen(false)} parent={folder} />
    </Screen>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <IconButton icon="chevronLeft" accessibilityLabel="Voltar" onPress={onPress} color={theme.colors.textSecondary} />
  );
}

function SectionLabel({ children }: { children: string }) {
  const theme = useTheme();
  return (
    <Text
      variant="overline"
      color="tertiary"
      style={{ paddingHorizontal: theme.layout.screenPadding, marginBottom: theme.spacing.sm, marginTop: theme.spacing.sm }}>
      {children.toUpperCase()}
    </Text>
  );
}

const styles = StyleSheet.create({
  accent: { width: 24, height: 3, borderRadius: 2, marginTop: -6, marginBottom: 20 },
  empty: { alignItems: 'center', marginTop: 40 },
});
