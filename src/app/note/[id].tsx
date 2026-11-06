import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeIn, Icon, IconButton, PressableScale, Screen, SegmentedControl, Sheet, Text, TextField } from '@/components';
import { FolderPickerSheet, useCategories } from '@/features/categories';
import { ExportCancelled, TITLE_MAX_LENGTH, useMarkdownExport, useNotes, type NoteDetail, type NoteLinkRef } from '@/features/notes';
import { formatFullDate, formatRelativeDate } from '@/lib/format';
import { useTheme } from '@/theme';

type Version = 'organized' | 'original';
type SaveState = 'idle' | 'pending' | 'saved' | 'error';

const AUTOSAVE_DELAY = 700;

/**
 * A note. The original is shown read-only; the title and the organized
 * version are edited in place and saved automatically.
 */
export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { service, notes, update, move, remove } = useNotes();
  const { folders, getPath } = useCategories();
  const { exportNote } = useMarkdownExport(folders);

  const [note, setNote] = useState<NoteDetail | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [organized, setOrganized] = useState('');
  const [version, setVersion] = useState<Version>('organized');
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [moveOpen, setMoveOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const initialized = useRef(false);
  const pending = useRef<{ title: string; organized: string } | null>(null);

  // (Re)load the stored note; drafts are only initialized on the first load.
  useEffect(() => {
    let cancelled = false;
    service.get(id).then((detail) => {
      if (cancelled) return;
      setNote(detail);
      if (detail && !initialized.current) {
        initialized.current = true;
        setTitle(detail.title);
        setOrganized(detail.organized ?? '');
        setVersion(detail.organized === null && detail.source === 'voice' ? 'original' : 'organized');
      }
    });
    return () => {
      cancelled = true;
    };
    // `notes` changes after every write anywhere, keeping links and dates fresh.
  }, [id, service, notes]);

  const flush = useCallback(async () => {
    const draft = pending.current;
    if (!draft) return;
    pending.current = null;
    try {
      await update(id, { title: draft.title, organized: draft.organized });
      setSaveState('saved');
    } catch {
      setSaveState('error');
    }
  }, [id, update]);

  // Debounced autosave.
  useEffect(() => {
    if (!pending.current) return;
    const timer = setTimeout(flush, AUTOSAVE_DELAY);
    return () => clearTimeout(timer);
  }, [title, organized, flush]);

  // Never lose the last keystrokes when leaving the screen.
  const flushRef = useRef(flush);
  useEffect(() => {
    flushRef.current = flush;
  }, [flush]);
  useEffect(() => () => void flushRef.current(), []);

  const edit = (patch: Partial<{ title: string; organized: string }>) => {
    const next = { title: patch.title ?? title, organized: patch.organized ?? organized };
    if (patch.title !== undefined) setTitle(patch.title);
    if (patch.organized !== undefined) setOrganized(patch.organized);
    pending.current = next;
    setSaveState('pending');
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/categories'));

  if (note === undefined) return <Screen>{null}</Screen>;
  if (note === null) {
    return (
      <Screen>
        <View style={{ padding: theme.layout.screenPadding }}>
          <IconButton icon="chevronLeft" accessibilityLabel="Voltar" onPress={back} color={colors.textSecondary} />
          <Text variant="title" style={{ marginTop: spacing.lg }}>
            Nota não encontrada
          </Text>
        </View>
      </Screen>
    );
  }

  const path = getPath(note.folderId);
  const handleExport = async () => {
    await flush();
    try {
      const file = await exportNote(note.id);
      setMessage(Platform.OS === 'web' ? `Baixado: ${file.name}` : null);
    } catch (error) {
      if (!(error instanceof ExportCancelled)) setMessage(error instanceof Error ? error.message : 'Falha ao exportar.');
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingHorizontal: theme.layout.screenPadding - spacing.sm, paddingTop: spacing.lg }]}>
          <IconButton icon="chevronLeft" accessibilityLabel="Voltar" onPress={back} color={colors.textSecondary} />
          <View style={styles.row}>
            <IconButton icon="folder" accessibilityLabel="Mover para categoria" onPress={() => setMoveOpen(true)} color={colors.textSecondary} />
            <IconButton icon="share" accessibilityLabel="Exportar em Markdown" onPress={handleExport} color={colors.textSecondary} />
            <IconButton icon="trash" accessibilityLabel="Excluir nota" onPress={() => setDeleteOpen(true)} color={colors.textSecondary} />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: theme.layout.screenPadding, paddingBottom: insets.bottom + spacing.xxxl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <PressableScale
            onPress={() => setMoveOpen(true)}
            accessibilityRole="button"
            accessibilityLabel="Categoria da nota"
            style={[styles.row, { marginTop: spacing.md, gap: 6 }]}>
            <Icon name={path.length ? 'folder' : 'inbox'} size={14} color={colors.textTertiary} />
            <Text variant="overline" color="tertiary">
              {(path.length ? path.join(' / ') : 'Sem categoria').toUpperCase()}
            </Text>
          </PressableScale>

          <TextField
            variant="title"
            value={title}
            onChangeText={(value) => edit({ title: value })}
            placeholder="Título"
            maxLength={TITLE_MAX_LENGTH}
            multiline
            autoGrow
            accessibilityLabel="Título da nota"
            style={{ marginTop: spacing.sm }}
          />

          <Text variant="caption" color="tertiary" style={{ marginTop: spacing.sm }}>
            {note.source === 'voice' ? 'Gravada' : 'Criada'} em {formatFullDate(note.createdAt)}
            {note.updatedAt !== note.createdAt ? ` · editada ${formatRelativeDate(note.updatedAt)}` : ''}
            {saveState === 'pending' ? ' · salvando…' : saveState === 'error' ? ' · não foi possível salvar' : ''}
          </Text>

          <View style={{ marginTop: spacing.xl }}>
            <SegmentedControl<Version>
              value={version}
              onChange={setVersion}
              segments={[
                { value: 'organized', label: 'Organizada', icon: 'compose' },
                { value: 'original', label: 'Original', icon: note.source === 'voice' ? 'mic' : 'keyboard' },
              ]}
            />
          </View>

          {version === 'organized' ? (
            <FadeIn key="organized" offset={6} style={{ marginTop: spacing.lg }}>
              <TextField
                value={organized}
                onChangeText={(value) => edit({ organized: value })}
                placeholder="Reescreva com calma: estruture, resuma, ligue a outras notas com [[Título]]."
                multiline
                autoGrow
                textAlignVertical="top"
                accessibilityLabel="Versão organizada"
                style={styles.editor}
              />
              {organized.length === 0 ? (
                <PressableScale
                  onPress={() => edit({ organized: note.original })}
                  accessibilityRole="button"
                  style={[styles.row, styles.start, { marginTop: spacing.md, gap: 6 }]}>
                  <Icon name="compose" size={16} color={colors.accentText} />
                  <Text variant="label" color="accent">
                    Começar a partir do original
                  </Text>
                </PressableScale>
              ) : null}
            </FadeIn>
          ) : (
            <FadeIn key="original" offset={6} style={{ marginTop: spacing.lg }}>
              <View
                style={[
                  styles.original,
                  { backgroundColor: colors.surface, borderRadius: theme.radius.lg, padding: spacing.lg },
                ]}>
                <Text variant="body" selectable>
                  {note.original}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: spacing.md, gap: spacing.sm }]}>
                <Icon name="shield" size={15} color={colors.textTertiary} />
                <Text variant="caption" color="tertiary" style={styles.flex}>
                  Preservado exatamente como foi registrado. Edições vão para a versão organizada.
                </Text>
              </View>
            </FadeIn>
          )}

          <LinksSection title="Ligações" items={note.links} empty="Escreva [[Título de outra nota]] na versão organizada para ligar notas." />
          {note.backlinks.length > 0 ? <LinksSection title="Mencionada em" items={note.backlinks} /> : null}

          {message ? (
            <Text variant="caption" color="secondary" style={{ marginTop: spacing.lg }}>
              {message}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <FolderPickerSheet
        visible={moveOpen}
        onClose={() => setMoveOpen(false)}
        selectedId={note.folderId}
        onSelect={(folderId) => {
          move(note.id, folderId).catch((e) => setMessage(e instanceof Error ? e.message : 'Falha ao mover.'));
        }}
      />

      <Sheet visible={deleteOpen} onClose={() => setDeleteOpen(false)} title="Excluir esta nota?">
        <View style={{ paddingHorizontal: spacing.xl, gap: spacing.lg }}>
          <Text variant="callout" color="secondary">
            A nota, o original e a versão organizada serão apagados deste aparelho. Isso não pode ser desfeito.
          </Text>
          <View style={[styles.row, { gap: spacing.sm }]}>
            <PressableScale
              onPress={() => setDeleteOpen(false)}
              accessibilityRole="button"
              containerStyle={styles.flex}
              style={[styles.button, { backgroundColor: colors.surface, borderRadius: theme.radius.md }]}>
              <Text variant="bodyMedium">Cancelar</Text>
            </PressableScale>
            <PressableScale
              onPress={async () => {
                pending.current = null;
                await remove(note.id);
                setDeleteOpen(false);
                back();
              }}
              accessibilityRole="button"
              containerStyle={styles.flex}
              style={[styles.button, { backgroundColor: colors.danger, borderRadius: theme.radius.md }]}>
              <Icon name="trash" size={18} color={colors.onInverse} strokeWidth={2} />
              <Text variant="bodyMedium" color="onInverse">
                Excluir
              </Text>
            </PressableScale>
          </View>
        </View>
      </Sheet>
    </Screen>
  );
}

function LinksSection({ title, items, empty }: { title: string; items: NoteLinkRef[]; empty?: string }) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  if (items.length === 0 && !empty) return null;
  return (
    <View style={{ marginTop: spacing.xxl }}>
      <Text variant="overline" color="tertiary" style={{ marginBottom: spacing.sm }}>
        {title.toUpperCase()}
      </Text>
      {items.length === 0 ? (
        <Text variant="caption" color="tertiary">
          {empty}
        </Text>
      ) : (
        items.map((item) => (
          <PressableScale
            key={item.id}
            onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
            accessibilityRole="link"
            style={[styles.row, { paddingVertical: spacing.sm, gap: spacing.sm }]}>
            <Icon name="links" size={16} color={colors.accent} />
            <Text variant="callout" numberOfLines={1} style={styles.flex}>
              {item.title}
            </Text>
            <Icon name="chevronRight" size={16} color={colors.textTertiary} />
          </PressableScale>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  flex: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  row: { flexDirection: 'row', alignItems: 'center' },
  start: { alignSelf: 'flex-start' },
  editor: { minHeight: 200 },
  original: {},
  button: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
