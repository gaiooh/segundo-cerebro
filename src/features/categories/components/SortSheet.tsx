import { View } from 'react-native';

import { OptionRow, Sheet } from '@/components';
import { usePreferences, type FolderSort } from '@/features/settings';
import { useTheme } from '@/theme';

import { sortDescriptions, sortLabels } from '../utils';

type SortSheetProps = {
  visible: boolean;
  onClose: () => void;
  onStartReorder: () => void;
};

const order: FolderSort[] = ['manual', 'name', 'updated', 'created'];

export function SortSheet({ visible, onClose, onStartReorder }: SortSheetProps) {
  const theme = useTheme();
  const { preferences, update } = usePreferences();

  return (
    <Sheet visible={visible} onClose={onClose} title="Ordenar por">
      {order.map((sort) => (
        <OptionRow
          key={sort}
          label={sortLabels[sort]}
          description={sortDescriptions[sort]}
          selected={preferences.folderSort === sort}
          onPress={() => {
            update({ folderSort: sort });
            onClose();
          }}
        />
      ))}
      <View style={{ height: 1, backgroundColor: theme.colors.separator, marginVertical: theme.spacing.sm, marginHorizontal: theme.spacing.xl }} />
      <OptionRow
        icon="drag"
        label="Organizar manualmente"
        description="Mover pastas para cima ou para baixo"
        onPress={() => {
          update({ folderSort: 'manual' });
          onClose();
          onStartReorder();
        }}
      />
    </Sheet>
  );
}
