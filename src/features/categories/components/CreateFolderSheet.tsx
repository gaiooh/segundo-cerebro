import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, PressableScale, Sheet, Text, TextField } from '@/components';
import { tintNames, useTheme, type TintName } from '@/theme';

import { useCategories } from '../CategoriesProvider';
import type { Folder } from '../types';

type CreateFolderSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When set, the new folder is created as a subfolder. */
  parent?: Folder;
  onCreated?: (folder: Folder) => void;
};

export function CreateFolderSheet({ visible, onClose, parent, onCreated }: CreateFolderSheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title={parent ? `Nova subpasta em ${parent.name}` : 'Nova categoria'}>
      {/* The form remounts on every opening, so it always starts empty. */}
      <CreateFolderForm onClose={onClose} parent={parent} onCreated={onCreated} />
    </Sheet>
  );
}

function CreateFolderForm({ onClose, parent, onCreated }: Omit<CreateFolderSheetProps, 'visible'>) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const { createFolder } = useCategories();
  const [name, setName] = useState('');
  const [tint, setTint] = useState<TintName>(parent?.tint ?? 'rose');

  const canCreate = name.trim().length > 0;
  const submit = () => {
    if (!canCreate) return;
    const folder = createFolder({ name, parentId: parent?.id ?? null, tint });
    onClose();
    onCreated?.(folder);
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
            maxLength={40}
            style={styles.input}
            accessibilityLabel="Nome da pasta"
          />
        </View>

        <View>
          <Text variant="overline" color="tertiary" style={{ marginBottom: spacing.md }}>
            COR
          </Text>
          <View style={styles.tints}>
            {tintNames.map((name) => {
              const swatch = theme.tint(name);
              const selected = name === tint;
              return (
                <Pressable
                  key={name}
                  onPress={() => setTint(name)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Cor ${tintLabels[name]}`}
                  style={[styles.swatchRing, { borderColor: selected ? colors.text : 'transparent' }]}>
                  <View style={[styles.swatch, { backgroundColor: swatch.fill, borderColor: swatch.dot }]} />
                </Pressable>
              );
            })}
          </View>
        </View>

        <PressableScale
          onPress={submit}
          disabled={!canCreate}
          accessibilityRole="button"
          style={[
            styles.button,
            { backgroundColor: colors.inverse, borderRadius: theme.radius.md, opacity: canCreate ? 1 : 0.3 },
          ]}>
          <Icon name="plus" size={18} color={colors.onInverse} strokeWidth={2} />
          <Text variant="bodyMedium" color="onInverse">
            Criar
          </Text>
        </PressableScale>
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
});
