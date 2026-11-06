import { IconButton, PressableScale, Text } from '@/components';
import { usePreferences } from '@/features/settings';
import { useTheme } from '@/theme';

type FolderActionsProps = {
  reordering: boolean;
  onSort: () => void;
  onCreate: () => void;
  onDoneReordering: () => void;
  /** Opens note search (top-level screen). */
  onSearch?: () => void;
  /** Rename / recolor / delete the current folder. */
  onEdit?: () => void;
  createLabel?: string;
};

/** Discreet header controls: search or edit, view, sort, create. */
export function FolderActions({
  reordering,
  onSort,
  onCreate,
  onDoneReordering,
  onSearch,
  onEdit,
  createLabel = 'Nova pasta',
}: FolderActionsProps) {
  const theme = useTheme();
  const { preferences, update } = usePreferences();

  if (reordering) {
    return (
      <PressableScale
        onPress={onDoneReordering}
        accessibilityRole="button"
        style={{
          backgroundColor: theme.colors.inverse,
          borderRadius: theme.radius.pill,
          paddingHorizontal: 16,
          height: 36,
          justifyContent: 'center',
        }}>
        <Text variant="label" color="onInverse">
          Concluir
        </Text>
      </PressableScale>
    );
  }

  const isGrid = preferences.folderView === 'grid';
  return (
    <>
      {onSearch ? (
        <IconButton icon="search" accessibilityLabel="Buscar notas" onPress={onSearch} color={theme.colors.textSecondary} />
      ) : null}
      {onEdit ? (
        <IconButton icon="pencil" accessibilityLabel="Editar pasta" onPress={onEdit} color={theme.colors.textSecondary} />
      ) : null}
      <IconButton
        icon={isGrid ? 'list' : 'grid'}
        accessibilityLabel={isGrid ? 'Ver em lista' : 'Ver em grade'}
        onPress={() => update({ folderView: isGrid ? 'list' : 'grid' })}
        color={theme.colors.textSecondary}
      />
      <IconButton icon="sort" accessibilityLabel="Ordenar" onPress={onSort} color={theme.colors.textSecondary} />
      <IconButton icon="plus" accessibilityLabel={createLabel} onPress={onCreate} variant="tonal" size={38} />
    </>
  );
}
