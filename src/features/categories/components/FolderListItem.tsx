import { useEffect } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useAnimatedValue } from '@/hooks/useAnimatedValue';

import { Icon, IconButton, PressableScale, Text } from '@/components';
import { pluralize } from '@/lib/format';
import { useTheme } from '@/theme';

import type { Folder } from '../types';
import { FolderGlyph } from './FolderGlyph';

type FolderListItemProps = {
  folder: Folder;
  noteCount: number;
  depth: number;
  hasChildren: boolean;
  expanded: boolean;
  onToggle: () => void;
  onPress: () => void;
  showDivider: boolean;
  reorder?: { canMoveUp: boolean; canMoveDown: boolean; onMove: (direction: -1 | 1) => void };
};

const INDENT = 28;

export function FolderListItem({
  folder,
  noteCount,
  depth,
  hasChildren,
  expanded,
  onToggle,
  onPress,
  showDivider,
  reorder,
}: FolderListItemProps) {
  const theme = useTheme();
  const { colors, spacing } = theme;
  const rotation = useAnimatedValue(expanded ? 1 : 0);

  useEffect(() => {
    Animated.timing(rotation, { toValue: expanded ? 1 : 0, duration: theme.motion.fast, useNativeDriver: true }).start();
  }, [expanded, rotation, theme.motion.fast]);

  const glyphSize = depth === 0 ? 38 : 32;
  const leftInset = theme.layout.screenPadding + depth * INDENT;

  return (
    <View>
      {/* Row = main pressable area + sibling trailing controls (never nested buttons). */}
      <View style={[styles.row, { paddingRight: spacing.sm }]}>
        <PressableScale
          onPress={reorder ? undefined : onPress}
          disabled={!!reorder}
          pressedScale={0.985}
          accessibilityRole="button"
          accessibilityLabel={`${folder.name}, ${pluralize(noteCount, 'nota', 'notas')}`}
          containerStyle={styles.flex}
          style={[styles.main, { paddingLeft: leftInset, gap: spacing.md }]}>
          <FolderGlyph tint={folder.tint} size={glyphSize} />
          <View style={styles.texts}>
            <Text variant={depth === 0 ? 'bodyMedium' : 'callout'} numberOfLines={1}>
              {folder.name}
            </Text>
            <Text variant="caption" color="tertiary" style={{ marginTop: 2 }}>
              {pluralize(noteCount, 'nota', 'notas')}
            </Text>
          </View>
        </PressableScale>

        {reorder ? (
          <View style={styles.reorder}>
            <IconButton
              icon="arrowUp"
              size={36}
              accessibilityLabel={`Mover ${folder.name} para cima`}
              disabled={!reorder.canMoveUp}
              onPress={() => reorder.onMove(-1)}
              color={colors.textSecondary}
            />
            <IconButton
              icon="arrowDown"
              size={36}
              accessibilityLabel={`Mover ${folder.name} para baixo`}
              disabled={!reorder.canMoveDown}
              onPress={() => reorder.onMove(1)}
              color={colors.textSecondary}
            />
          </View>
        ) : hasChildren ? (
          <Pressable
            onPress={onToggle}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={expanded ? `Recolher ${folder.name}` : `Expandir ${folder.name}`}
            style={styles.toggle}>
            <Animated.View
              style={{
                transform: [{ rotate: rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '90deg'] }) }],
              }}>
              <Icon name="chevronRight" size={18} color={colors.textTertiary} />
            </Animated.View>
          </Pressable>
        ) : (
          <View style={styles.toggle} />
        )}
      </View>
      {showDivider ? (
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.separator, marginLeft: leftInset + glyphSize + spacing.md },
          ]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  flex: { flex: 1 },
  main: { flexDirection: 'row', alignItems: 'center', minHeight: 64, paddingVertical: 10 },
  texts: { flex: 1 },
  toggle: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  reorder: { flexDirection: 'row' },
  divider: { height: StyleSheet.hairlineWidth * 2 },
});
