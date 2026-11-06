import { View } from 'react-native';

import { FadeIn } from '@/components';
import { usePreferences } from '@/features/settings';

import type { Folder } from '../types';
import { FolderGrid } from './FolderGrid';
import { FolderTree } from './FolderTree';

type FolderBrowserProps = {
  parentId: string | null;
  onOpen: (folder: Folder) => void;
  reordering: boolean;
};

/** Renders folders in the user's chosen view, cross-fading on change. */
export function FolderBrowser({ parentId, onOpen, reordering }: FolderBrowserProps) {
  const { preferences } = usePreferences();
  // Manual reordering always happens in the list, where order reads clearly.
  const view = reordering ? 'list' : preferences.folderView;

  return (
    <View>
      <FadeIn key={view} offset={6}>
        {view === 'grid' ? (
          <FolderGrid parentId={parentId} onOpen={onOpen} />
        ) : (
          <FolderTree parentId={parentId} onOpen={onOpen} reordering={reordering} />
        )}
      </FadeIn>
    </View>
  );
}
