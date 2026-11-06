import { useState } from 'react';
import { View } from 'react-native';

import { FadeIn } from '@/components';

import { useCategories } from '../CategoriesProvider';
import type { Folder } from '../types';
import { FolderListItem } from './FolderListItem';

type FolderTreeProps = {
  parentId: string | null;
  onOpen: (folder: Folder) => void;
  /** Manual reordering mode: shows move controls, hides expansion. */
  reordering?: boolean;
};

/** Vertical list of folders; subfolders expand inline with indentation. */
export function FolderTree({ parentId, onOpen, reordering = false }: FolderTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const toggle = (id: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <Branch
      parentId={parentId}
      depth={0}
      expanded={expanded}
      onToggle={toggle}
      onOpen={onOpen}
      reordering={reordering}
    />
  );
}

type BranchProps = {
  parentId: string | null;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (folder: Folder) => void;
  reordering: boolean;
};

function Branch({ parentId, depth, expanded, onToggle, onOpen, reordering }: BranchProps) {
  const { getChildren, countNotes, moveFolder } = useCategories();
  const folders = getChildren(parentId);

  return (
    <View>
      {folders.map((folder, index) => {
        const children = getChildren(folder.id);
        const isExpanded = !reordering && expanded.has(folder.id);
        const isLast = index === folders.length - 1;
        return (
          <View key={folder.id}>
            <FolderListItem
              folder={folder}
              noteCount={countNotes(folder.id)}
              depth={depth}
              hasChildren={children.length > 0}
              expanded={isExpanded}
              onToggle={() => onToggle(folder.id)}
              onPress={() => onOpen(folder)}
              showDivider={!isLast || isExpanded}
              reorder={
                reordering
                  ? {
                      canMoveUp: index > 0,
                      canMoveDown: !isLast,
                      onMove: (direction) => moveFolder(folder.id, direction),
                    }
                  : undefined
              }
            />
            {isExpanded ? (
              <FadeIn offset={-4}>
                <Branch
                  parentId={folder.id}
                  depth={depth + 1}
                  expanded={expanded}
                  onToggle={onToggle}
                  onOpen={onOpen}
                  reordering={reordering}
                />
              </FadeIn>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
