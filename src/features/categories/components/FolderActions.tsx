import { IconButton, PressableScale, Text } from '@/components';
import { usePreferences } from '@/features/settings';
import { useTheme } from '@/theme';

type FolderActionsProps = {
  reordering: boolean;
  onSort: () => void;
  onCreate: () => void;
  onDoneReordering: () => void;
};

/** The three discreet header controls: view, sort, create. */
export function FolderActions({ reordering, onSort, onCreate, onDoneReordering }: FolderActionsProps) {
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
      <IconButton
        icon={isGrid ? 'list' : 'grid'}
        accessibilityLabel={isGrid ? 'Ver em lista' : 'Ver em grade'}
        onPress={() => update({ folderView: isGrid ? 'list' : 'grid' })}
        color={theme.colors.textSecondary}
      />
      <IconButton icon="sort" accessibilityLabel="Ordenar" onPress={onSort} color={theme.colors.textSecondary} />
      <IconButton icon="plus" accessibilityLabel="Nova pasta" onPress={onCreate} variant="tonal" size={38} />
    </>
  );
}
