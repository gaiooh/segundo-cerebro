import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, IconButton, PressableScale, Screen, Text, TextField } from '@/components';
import { useCategories } from '@/features/categories';
import { TITLE_MAX_LENGTH, useNotes } from '@/features/notes';
import { useTheme } from '@/theme';

/**
 * Write a new note. What is typed here becomes the note's original —
 * saved exactly as written; later edits go to the organized version.
 */
export default function NewNoteScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const { folderId } = useLocalSearchParams<{ folderId?: string }>();
  const { getPath, getFolder } = useCategories();
  const { create } = useNotes();
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetFolder = folderId && getFolder(folderId) ? folderId : null;
  const path = getPath(targetFolder);
  const canSave = text.trim().length > 0 && !saving;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/categories'));

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const note = await create({ title, text, source: 'text', folderId: targetFolder });
      router.replace({ pathname: '/note/[id]', params: { id: note.id } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.bar, { paddingHorizontal: theme.layout.screenPadding - spacing.sm, paddingTop: spacing.lg }]}>
          <IconButton icon="close" accessibilityLabel="Cancelar" onPress={back} color={colors.textSecondary} />
          <PressableScale
            onPress={save}
            disabled={!canSave}
            accessibilityRole="button"
            style={[styles.save, { backgroundColor: colors.inverse, borderRadius: theme.radius.pill, opacity: canSave ? 1 : 0.3 }]}>
            <Icon name="check" size={16} color={colors.onInverse} strokeWidth={2.2} />
            <Text variant="label" color="onInverse">
              Salvar
            </Text>
          </PressableScale>
        </View>
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: theme.layout.screenPadding, paddingBottom: spacing.xxxl }}
          keyboardShouldPersistTaps="handled">
          <Text variant="overline" color="tertiary" style={{ marginTop: spacing.lg }}>
            {(path.length > 0 ? path.join(' / ') : 'Sem categoria').toUpperCase()}
          </Text>
          <TextField
            variant="title"
            value={title}
            onChangeText={setTitle}
            placeholder="Título (opcional)"
            maxLength={TITLE_MAX_LENGTH}
            multiline
            autoGrow
            accessibilityLabel="Título da nota"
            style={{ marginTop: spacing.sm }}
          />
          <TextField
            value={text}
            onChangeText={setText}
            placeholder="Escreva livremente, sem filtro…"
            multiline
            autoGrow
            autoFocus
            textAlignVertical="top"
            accessibilityLabel="Texto da nota"
            style={[styles.body, { marginTop: spacing.lg }]}
          />
          {error ? (
            <Text variant="caption" color="danger" style={{ marginTop: spacing.md }}>
              {error}
            </Text>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  save: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36, paddingHorizontal: 16 },
  body: { minHeight: 240 },
});
