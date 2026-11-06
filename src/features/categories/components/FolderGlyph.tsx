import { View } from 'react-native';

import { Icon } from '@/components';
import { useTheme, type TintName } from '@/theme';

type FolderGlyphProps = {
  tint: TintName;
  size?: number;
};

/** Folder icon on a soft tinted tile. */
export function FolderGlyph({ tint, size = 38 }: FolderGlyphProps) {
  const theme = useTheme();
  const colors = theme.tint(tint);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.3),
        backgroundColor: colors.fill,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Icon name="folder" size={Math.round(size * 0.55)} color={colors.ink} strokeWidth={1.7} />
    </View>
  );
}
