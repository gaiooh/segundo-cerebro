import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn, Icon, IconButton, OptionRow, Screen, ScreenHeader, Sheet, Text } from '@/components';
import {
  CreateFolderSheet,
  EditFolderSheet,
  FolderActions,
  FolderBrowser,
  SortSheet,
  UNFILED_ID,
  useCategories,
  type Folder,
} from '@/features/categories';
import { NoteRow, type NoteSummary } from '@/features/notes';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

const openNote = (note: NoteSummary) => router.push({ pathname: '/note/[id]', params: { id: note.id } });
const back = () => (router.canGoBack() ? router.back() : router.replace('/categories'));

export default function FolderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return id === UNFILED_ID ? <UnfiledScreen /> : <CategoryScreen id={id} />;
}

/** Notes captured without a category. */
function UnfiledScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getNotes } = useCategories();
  const notes = getNotes(null);
  return (
    <Screen>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + theme.spacing.xxxl }}
        showsVerticalScrollIndicator={false}>
        <ScreenHeader
          title="Sem categoria"
          subtitle={pluralize(notes.length, 'nota para organizar', 'notas para organizar')}
          leading={<BackButton onPress={back} />}
          actions={
            <IconButton
              icon="plus"
              accessibilityLabel="Nova nota"
              onPress={() => router.push('/note/new')}
              variant="tonal"
              size={38}
            />
          }
        />
        {notes.length > 0 ? (
          <FadeIn delay={60}>
            {notes.map((note, index) => (
              <NoteRow key={note.id} note={note} onPress={() => openNote(note)} showDivider={index < notes.length - 1} />
            ))}
          </FadeIn>
        ) : (
          <Empty text={'Tudo organizado.\nNovas capturas sem categoria aparecem aqui.'} />
        )}
      </ScrollView>
    </Screen>
  );
}

function CategoryScreen({ id }: { id: string }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { getFolder, getChildren, getNotes, countNotes } = useCategories();
  const [sortOpen, setSortOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reordering, setReordering] = useState(false);

  const folder = getFolder(id);

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
              onEdit={() => setEditOpen(true)}
              onSort={() => setSortOpen(true)}
              onCreate={() => setAddOpen(true)}
              createLabel="Adicionar"
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
              <NoteRow key={note.id} note={note} onPress={() => openNote(note)} showDivider={index < notes.length - 1} />
            ))}
          </FadeIn>
        ) : subfolders.length === 0 ? (
          <Empty text={'Nenhuma nota aqui ainda.\nO que você registrar nesta categoria aparece aqui.'} />
        ) : null}
      </ScrollView>

      <Sheet visible={addOpen} onClose={() => setAddOpen(false)} title={`Adicionar em ${folder.name}`}>
        <OptionRow
          icon="note"
          label="Nova nota"
          description="Escreva um pensamento nesta pasta"
          onPress={() => {
            setAddOpen(false);
            router.push({ pathname: '/note/new', params: { folderId: folder.id } });
          }}
        />
        <OptionRow
          icon="folderPlus"
          label="Nova subpasta"
          description="Organize em mais um nível"
          onPress={() => {
            setAddOpen(false);
            setCreateOpen(true);
          }}
        />
      </Sheet>
      <SortSheet visible={sortOpen} onClose={() => setSortOpen(false)} onStartReorder={() => setReordering(true)} />
      <CreateFolderSheet visible={createOpen} onClose={() => setCreateOpen(false)} parent={folder} />
      <EditFolderSheet visible={editOpen} onClose={() => setEditOpen(false)} folder={folder} onDeleted={back} />
    </Screen>
  );
}

function BackButton({ onPress }: { onPress: () => void }) {
  const theme = useTheme();
  return (
    <IconButton icon="chevronLeft" accessibilityLabel="Voltar" onPress={onPress} color={theme.colors.textSecondary} />
  );
}

function Empty({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { padding: theme.spacing.xxl }]}>
      <Icon name="note" size={28} color={theme.colors.textTertiary} />
      <Text variant="callout" color="tertiary" align="center" style={{ marginTop: theme.spacing.md }}>
        {text}
      </Text>
    </View>
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
