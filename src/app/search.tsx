import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, IconButton, Screen, Text, TextField } from '@/components';
import { useCategories } from '@/features/categories';
import { NoteRow, useNotes, type NoteSummary } from '@/features/notes';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

/** Search across every note: title, organized version and original. */
export default function SearchScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const insets = useSafeAreaInsets();
  const { service, notes } = useNotes();
  const { getPath } = useCategories();
  const [query, setQuery] = useState('');
  // Results are tagged with their query, so a stale or pending search never shows as "no results".
  const [results, setResults] = useState<{ query: string; items: NoteSummary[] } | null>(null);
  const [failed, setFailed] = useState(false);

  const trimmed = query.trim();
  useEffect(() => {
    if (!trimmed) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      service
        .search(trimmed)
        .then((items) => {
          if (cancelled) return;
          setFailed(false);
          setResults({ query: trimmed, items });
        })
        .catch(() => !cancelled && setFailed(true));
    }, 150);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [trimmed, service, notes]);

  // Without a query, every note is listed (newest first).
  const searching = trimmed.length > 0 && results?.query !== trimmed && !failed;
  const list = trimmed ? (results?.query === trimmed ? results.items : []) : notes;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/categories'));

  return (
    <Screen>
      <View style={[styles.bar, { paddingHorizontal: theme.layout.screenPadding - spacing.sm, paddingTop: spacing.lg, gap: spacing.xs }]}>
        <IconButton icon="chevronLeft" accessibilityLabel="Voltar" onPress={back} color={colors.textSecondary} />
        <View
          style={[
            styles.field,
            { backgroundColor: colors.surface, borderRadius: theme.radius.md, paddingHorizontal: spacing.md, gap: spacing.sm },
          ]}>
          <Icon name="search" size={18} color={colors.textTertiary} />
          <TextField
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar nas notas"
            autoFocus
            returnKeyType="search"
            autoCorrect={false}
            accessibilityLabel="Buscar nas notas"
            style={styles.input}
          />
          {query ? <IconButton icon="close" size={28} accessibilityLabel="Limpar busca" onPress={() => setQuery('')} color={colors.textTertiary} /> : null}
        </View>
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}
        ListHeaderComponent={
          <Text variant="overline" color="tertiary" style={{ paddingHorizontal: theme.layout.screenPadding, marginTop: spacing.xl, marginBottom: spacing.xs }}>
            {(searching
              ? 'Buscando…'
              : failed && trimmed
                ? 'Não foi possível buscar'
                : trimmed
                  ? pluralize(list.length, 'resultado', 'resultados')
                  : `Todas as notas · ${list.length}`
            ).toUpperCase()}
          </Text>
        }
        ListEmptyComponent={
          searching || failed ? undefined : (
            <View style={[styles.empty, { padding: spacing.xxl }]}>
              <Icon name={trimmed ? 'search' : 'note'} size={28} color={colors.textTertiary} />
              <Text variant="callout" color="tertiary" align="center" style={{ marginTop: spacing.md }}>
                {trimmed ? `Nada encontrado para “${trimmed}”.` : 'Nenhuma nota ainda.\nO que você registrar aparece aqui.'}
              </Text>
            </View>
          )
        }
        renderItem={({ item, index }) => {
          const path = getPath(item.folderId);
          return (
            <NoteRow
              note={item}
              context={path.length ? path.join(' / ') : 'Sem categoria'}
              showDivider={index < list.length - 1}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
            />
          );
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center' },
  field: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center' },
  input: { flex: 1, height: 44 },
  empty: { alignItems: 'center', marginTop: 24 },
});
