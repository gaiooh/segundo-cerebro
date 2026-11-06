import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, PressableScale, Sheet, Text, TextField } from '@/components';
import { pluralize } from '@/lib/format';
import { tintNames, useTheme, type TintName } from '@/theme';

import { useCategories } from '../CategoriesProvider';
import { FOLDER_NAME_MAX_LENGTH } from '../services/folders-service';
import type { Folder } from '../types';

type CreateFolderSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When set, the new folder is created as a subfolder. */
  parent?: Folder;
  onCreated?: (folder: Folder) => void;
};

export function CreateFolderSheet({ visible, onClose, parent, onCreated }: CreateFolderSheetProps) {
  const { createFolder } = useCategories();
  return (
    <Sheet visible={visible} onClose={onClose} title={parent ? `Nova subpasta em ${parent.name}` : 'Nova categoria'}>
      {/* The form remounts on every opening, so it always starts empty. */}
      <FolderForm
        initialName=""
        initialTint={parent?.tint ?? 'rose'}
        submitLabel="Criar"
        submitIcon="plus"
        onSubmit={async (name, tint) => {
          const folder = await createFolder({ name, parentId: parent?.id ?? null, tint });
          onClose();
          onCreated?.(folder);
        }}
      />
    </Sheet>
  );
}

type EditFolderSheetProps = {
  visible: boolean;
  onClose: () => void;
  folder: Folder;
  /** Called after the folder was deleted (e.g. to leave its screen). */
  onDeleted?: () => void;
};

/** Rename, recolor or delete a category. Deleting never deletes notes. */
export function EditFolderSheet({ visible, onClose, folder, onDeleted }: EditFolderSheetProps) {
  const theme = useTheme();
  const { updateFolder, deleteFolder, countNotes, getChildren, getFolder } = useCategories();
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setConfirming(false);
    onClose();
  };
  const notes = countNotes(folder.id);
  const subfolders = getChildren(folder.id).length;
  const destination = folder.parentId ? (getFolder(folder.parentId)?.name ?? 'pasta acima') : 'Sem categoria';

  return (
    <Sheet visible={visible} onClose={close} title={confirming ? `Excluir ${folder.name}?` : 'Editar pasta'}>
      {confirming ? (
        <View style={{ paddingHorizontal: theme.spacing.xl, gap: theme.spacing.lg }}>
          <Text variant="callout" color="secondary">
            {notes + subfolders === 0
              ? 'A pasta está vazia.'
              : `${[
                  notes > 0 ? pluralize(notes, 'nota', 'notas') : null,
                  subfolders > 0 ? pluralize(subfolders, 'subpasta', 'subpastas') : null,
                ]
                  .filter(Boolean)
                  .join(' e ')} ${notes + subfolders === 1 ? 'será movida' : 'serão movidas'} para “${destination}”. Nenhuma nota é apagada.`}
          </Text>
          <View style={[styles.row, { gap: theme.spacing.sm }]}>
            <PressableScale
              onPress={() => setConfirming(false)}
              accessibilityRole="button"
              containerStyle={styles.flex}
              style={[styles.button, { backgroundColor: theme.colors.surface, borderRadius: theme.radius.md }]}>
              <Text variant="bodyMedium">Cancelar</Text>
            </PressableScale>
            <PressableScale
              onPress={async () => {
                await deleteFolder(folder.id);
                close();
                onDeleted?.();
              }}
              accessibilityRole="button"
              containerStyle={styles.flex}
              style={[styles.button, { backgroundColor: theme.colors.danger, borderRadius: theme.radius.md }]}>
              <Icon name="trash" size={18} color={theme.colors.onInverse} strokeWidth={2} />
              <Text variant="bodyMedium" color="onInverse">
                Excluir pasta
              </Text>
            </PressableScale>
          </View>
        </View>
      ) : (
        <FolderForm
          initialName={folder.name}
          initialTint={folder.tint}
          submitLabel="Salvar"
          submitIcon="check"
          onSubmit={async (name, tint) => {
            await updateFolder(folder.id, { name, tint });
            close();
          }}
          footer={
            <PressableScale
              onPress={() => setConfirming(true)}
              accessibilityRole="button"
              style={[styles.button, styles.row]}>
              <Icon name="trash" size={18} color={theme.colors.danger} />
              <Text variant="bodyMedium" color="danger">
                Excluir pasta
              </Text>
            </PressableScale>
          }
        />
      )}
    </Sheet>
  );
}

type FolderFormProps = {
  initialName: string;
  initialTint: TintName;
  submitLabel: string;
  submitIcon: 'plus' | 'check';
  onSubmit: (name: string, tint: TintName) => Promise<void>;
  footer?: React.ReactNode;
};

function FolderForm({ initialName, initialTint, submitLabel, submitIcon, onSubmit, footer }: FolderFormProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const [name, setName] = useState(initialName);
  const [tint, setTint] = useState<TintName>(initialTint);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = name.trim().length > 0 && !busy;
  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit(name, tint);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.');
      setBusy(false);
    }
  };

  return (
    <View style={{ paddingHorizontal: spacing.xl, gap: spacing.xl }}>
      <View
        style={[
          styles.field,
          { backgroundColor: colors.surface, borderRadius: theme.radius.md, paddingHorizontal: spacing.lg },
        ]}>
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="Nome"
          autoFocus
          returnKeyType="done"
          onSubmitEditing={submit}
          maxLength={FOLDER_NAME_MAX_LENGTH}
          style={styles.input}
          accessibilityLabel="Nome da pasta"
        />
      </View>

      <View>
        <Text variant="overline" color="tertiary" style={{ marginBottom: spacing.md }}>
          COR
        </Text>
        <View style={styles.tints}>
          {tintNames.map((option) => {
            const swatch = theme.tint(option);
            const selected = option === tint;
            return (
              <Pressable
                key={option}
                onPress={() => setTint(option)}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={`Cor ${tintLabels[option]}`}
                style={[styles.swatchRing, { borderColor: selected ? colors.text : 'transparent' }]}>
                <View style={[styles.swatch, { backgroundColor: swatch.fill, borderColor: swatch.dot }]} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? (
        <Text variant="caption" color="danger">
          {error}
        </Text>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <PressableScale
          onPress={submit}
          disabled={!canSubmit}
          accessibilityRole="button"
          style={[
            styles.button,
            { backgroundColor: colors.inverse, borderRadius: theme.radius.md, opacity: canSubmit ? 1 : 0.3 },
          ]}>
          <Icon name={submitIcon} size={18} color={colors.onInverse} strokeWidth={2} />
          <Text variant="bodyMedium" color="onInverse">
            {submitLabel}
          </Text>
        </PressableScale>
        {footer}
      </View>
    </View>
  );
}

const tintLabels: Record<TintName, string> = {
  rose: 'rosa',
  sand: 'areia',
  sage: 'sálvia',
  mist: 'névoa',
  lilac: 'lilás',
  stone: 'pedra',
};

const styles = StyleSheet.create({
  field: { height: 52, justifyContent: 'center' },
  input: { height: 52 },
  tints: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  swatchRing: { padding: 3, borderRadius: 22, borderWidth: 1.5 },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 1 },
  button: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  row: { flexDirection: 'row' },
  flex: { flex: 1 },
});
