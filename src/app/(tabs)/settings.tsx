import Constants from 'expo-constants';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Icon, OptionRow, Screen, ScreenHeader, SegmentedControl, Sheet, Text } from '@/components';
import { sortLabels, useCategories } from '@/features/categories';
import { canExportVault, ExportCancelled, useMarkdownExport, useNotes } from '@/features/notes';
import { usePreferences, type FolderSort } from '@/features/settings';
import { accentNames, accentPalettes, useTheme, type ThemeMode } from '@/theme';

const sortOrder: FolderSort[] = ['manual', 'name', 'updated', 'created'];

export default function SettingsScreen() {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const { preferences, update } = usePreferences();
  const [sortOpen, setSortOpen] = useState(false);
  const { folders } = useCategories();
  const { notes } = useNotes();
  const { exportAll } = useMarkdownExport(folders);
  const [exportState, setExportState] = useState<{ busy: boolean; message?: string }>({ busy: false });

  const runExport = async () => {
    setExportState({ busy: true });
    try {
      const { folder, count } = await exportAll();
      setExportState({ busy: false, message: `${count} ${count === 1 ? 'nota exportada' : 'notas exportadas'} na pasta “${folder}”.` });
    } catch (error) {
      setExportState({
        busy: false,
        message: error instanceof ExportCancelled ? undefined : error instanceof Error ? error.message : 'Falha ao exportar.',
      });
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Configurações" />

        <Section title="Aparência">
          <Field label="Tema">
            <SegmentedControl<ThemeMode>
              value={preferences.themeMode}
              onChange={(themeMode) => update({ themeMode })}
              segments={[
                { value: 'light', label: 'Claro', icon: 'sun' },
                { value: 'dark', label: 'Escuro', icon: 'moon' },
                { value: 'system', label: 'Automático', icon: 'auto' },
              ]}
            />
          </Field>
          <Field label="Cor de destaque">
            <View style={[styles.swatches, { gap: spacing.lg }]}>
              {accentNames.map((name) => {
                const swatch = accentPalettes[name][theme.scheme];
                const selected = preferences.accent === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => update({ accent: name })}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={accentPalettes[name].label}
                    style={styles.swatchItem}>
                    <View style={[styles.swatchRing, { borderColor: selected ? swatch.accent : 'transparent' }]}>
                      <View style={[styles.swatch, { backgroundColor: swatch.accent }]}>
                        {selected ? <Icon name="check" size={16} color={swatch.onAccent} strokeWidth={2.4} /> : null}
                      </View>
                    </View>
                    <Text variant="caption" color={selected ? 'primary' : 'tertiary'} style={{ marginTop: 6 }}>
                      {accentPalettes[name].label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </Field>
        </Section>

        <Section title="Organização">
          <Field label="Visualização das pastas">
            <SegmentedControl
              value={preferences.folderView}
              onChange={(folderView) => update({ folderView })}
              segments={[
                { value: 'list', label: 'Lista', icon: 'list' },
                { value: 'grid', label: 'Grade', icon: 'grid' },
              ]}
            />
          </Field>
          <View>
            <OptionRow
              inset={theme.layout.screenPadding}
              label="Ordenar pastas por"
              onPress={() => setSortOpen(true)}
              trailing={
                <View style={styles.trailing}>
                  <Text variant="callout" color="tertiary">
                    {sortLabels[preferences.folderSort]}
                  </Text>
                  <Icon name="chevronRight" size={16} color={colors.textTertiary} />
                </View>
              }
            />
          </View>
        </Section>

        <Section title="Privacidade e dados">
          <View style={{ paddingHorizontal: theme.layout.screenPadding, flexDirection: 'row', gap: spacing.md }}>
            <Icon name="shield" size={20} color={colors.accent} />
            <Text variant="callout" color="secondary" style={styles.flex}>
              Seus registros ficam neste aparelho. Nesta versão, nada é enviado para servidores.
            </Text>
          </View>
          <View style={{ marginTop: spacing.sm }}>
            <OptionRow
              inset={theme.layout.screenPadding}
              label="Exportar em Markdown"
              description={
                canExportVault
                  ? 'Escolha uma pasta (ex.: seu cofre do Obsidian). As categorias viram pastas.'
                  : 'Disponível no app para Android e iOS. Na web, exporte cada nota pela tela da nota.'
              }
              onPress={canExportVault && !exportState.busy && notes.length > 0 ? runExport : undefined}
              trailing={
                <Text variant="callout" color="tertiary">
                  {exportState.busy ? 'Exportando…' : String(notes.length)}
                </Text>
              }
            />
            {exportState.message ? (
              <Text variant="caption" color="secondary" style={{ paddingHorizontal: theme.layout.screenPadding, marginBottom: spacing.sm }}>
                {exportState.message}
              </Text>
            ) : null}
            <OptionRow inset={theme.layout.screenPadding} label="Apagar todos os dados" trailing={<Soon />} />
          </View>
        </Section>

        <Text variant="caption" color="tertiary" align="center" style={{ marginTop: spacing.xl }}>
          Segundo Cérebro · versão {Constants.expoConfig?.version ?? '1.0.0'}
        </Text>
      </ScrollView>

      <Sheet visible={sortOpen} onClose={() => setSortOpen(false)} title="Ordenar pastas por">
        {sortOrder.map((sort) => (
          <OptionRow
            key={sort}
            label={sortLabels[sort]}
            selected={preferences.folderSort === sort}
            onPress={() => {
              update({ folderSort: sort });
              setSortOpen(false);
            }}
          />
        ))}
      </Sheet>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ marginBottom: theme.spacing.xxl }}>
      <Text
        variant="overline"
        color="tertiary"
        style={{ paddingHorizontal: theme.layout.screenPadding, marginBottom: theme.spacing.md }}>
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ paddingHorizontal: theme.layout.screenPadding, marginBottom: theme.spacing.xl }}>
      <Text variant="bodyMedium" style={{ marginBottom: theme.spacing.md }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function Soon() {
  const theme = useTheme();
  return (
    <View style={[styles.soon, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.pill }]}>
      <Text variant="caption" color="tertiary">
        Em breve
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap' },
  swatchItem: { alignItems: 'center' },
  swatchRing: { padding: 3, borderRadius: 26, borderWidth: 2 },
  swatch: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  soon: { paddingHorizontal: 10, paddingVertical: 3 },
  flex: { flex: 1 },
});
