import type { AccentName, ThemeMode } from '@/theme';

export type FolderView = 'list' | 'grid';
export type FolderSort = 'manual' | 'name' | 'updated' | 'created';

export type Preferences = {
  themeMode: ThemeMode;
  accent: AccentName;
  folderView: FolderView;
  folderSort: FolderSort;
};

export const DEFAULT_PREFERENCES: Preferences = {
  themeMode: 'system',
  accent: 'rose',
  folderView: 'list',
  folderSort: 'manual',
};
