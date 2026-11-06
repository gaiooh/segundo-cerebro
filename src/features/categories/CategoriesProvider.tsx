import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { mockNotes, type Note } from '@/features/notes';
import { usePreferences } from '@/features/settings';
import type { TintName } from '@/theme';

import { mockFolders } from './mock-folders';
import type { Folder } from './types';
import { sortFolders } from './utils';

type CategoriesContextValue = {
  folders: Folder[];
  getFolder: (id: string) => Folder | undefined;
  /** Children of a folder (or top-level when null), in the user's sort order. */
  getChildren: (parentId: string | null) => Folder[];
  /** Notes stored directly in a folder, newest first. */
  getNotes: (folderId: string) => Note[];
  /** Notes in a folder and all of its subfolders. */
  countNotes: (folderId: string) => number;
  totalNotes: number;
  /** Most recent activity in the folder subtree. */
  getUpdatedAt: (folder: Folder) => string;
  createFolder: (input: { name: string; parentId: string | null; tint?: TintName }) => Folder;
  /** Manual ordering: move a folder one position among its siblings. */
  moveFolder: (id: string, direction: -1 | 1) => void;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

/**
 * In-memory categories store, seeded with demo data.
 * Persistence will replace the seed once the notes storage exists.
 */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences();
  const [folders, setFolders] = useState<Folder[]>(mockFolders);
  const notes = mockNotes;

  const derived = useMemo(() => {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const childrenOf = new Map<string | null, Folder[]>();
    for (const folder of folders) {
      const siblings = childrenOf.get(folder.parentId) ?? [];
      siblings.push(folder);
      childrenOf.set(folder.parentId, siblings);
    }
    const notesOf = new Map<string, Note[]>();
    for (const note of notes) {
      const list = notesOf.get(note.folderId) ?? [];
      list.push(note);
      notesOf.set(note.folderId, list);
    }
    for (const list of notesOf.values()) list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    const countCache = new Map<string, number>();
    const updatedCache = new Map<string, string>();
    const count = (id: string): number => {
      const cached = countCache.get(id);
      if (cached !== undefined) return cached;
      const total =
        (notesOf.get(id)?.length ?? 0) + (childrenOf.get(id) ?? []).reduce((sum, child) => sum + count(child.id), 0);
      countCache.set(id, total);
      return total;
    };
    const updated = (folder: Folder): string => {
      const cached = updatedCache.get(folder.id);
      if (cached) return cached;
      let latest = folder.updatedAt;
      for (const note of notesOf.get(folder.id) ?? []) if (note.updatedAt > latest) latest = note.updatedAt;
      for (const child of childrenOf.get(folder.id) ?? []) {
        const childLatest = updated(child);
        if (childLatest > latest) latest = childLatest;
      }
      updatedCache.set(folder.id, latest);
      return latest;
    };
    return { byId, childrenOf, notesOf, count, updated };
  }, [folders, notes]);

  const getChildren = useCallback(
    (parentId: string | null) =>
      sortFolders(derived.childrenOf.get(parentId) ?? [], preferences.folderSort, derived.updated),
    [derived, preferences.folderSort],
  );

  const createFolder = useCallback<CategoriesContextValue['createFolder']>(
    ({ name, parentId, tint }) => {
      const now = new Date().toISOString();
      const parent = parentId ? derived.byId.get(parentId) : undefined;
      const siblings = derived.childrenOf.get(parentId) ?? [];
      const folder: Folder = {
        id: `folder-${Date.now().toString(36)}`,
        name: name.trim(),
        parentId,
        tint: tint ?? parent?.tint ?? 'stone',
        order: siblings.reduce((max, f) => Math.max(max, f.order), -1) + 1,
        createdAt: now,
        updatedAt: now,
      };
      setFolders((current) => [...current, folder]);
      return folder;
    },
    [derived],
  );

  const moveFolder = useCallback((id: string, direction: -1 | 1) => {
    setFolders((current) => {
      const folder = current.find((f) => f.id === id);
      if (!folder) return current;
      const siblings = current.filter((f) => f.parentId === folder.parentId).sort((a, b) => a.order - b.order);
      const index = siblings.findIndex((f) => f.id === id);
      const target = siblings[index + direction];
      if (!target) return current;
      return current.map((f) =>
        f.id === folder.id ? { ...f, order: target.order } : f.id === target.id ? { ...f, order: folder.order } : f,
      );
    });
  }, []);

  const value = useMemo<CategoriesContextValue>(
    () => ({
      folders,
      getFolder: (id) => derived.byId.get(id),
      getChildren,
      getNotes: (folderId) => derived.notesOf.get(folderId) ?? [],
      countNotes: derived.count,
      totalNotes: notes.length,
      getUpdatedAt: derived.updated,
      createFolder,
      moveFolder,
    }),
    [folders, derived, getChildren, notes.length, createFolder, moveFolder],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesContextValue {
  const value = useContext(CategoriesContext);
  if (!value) throw new Error('useCategories must be used inside <CategoriesProvider>');
  return value;
}
