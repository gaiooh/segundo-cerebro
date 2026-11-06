import { randomUUID } from 'expo-crypto';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useNotes, type NoteSummary } from '@/features/notes';
import { usePreferences } from '@/features/settings';
import { useDatabase } from '@/lib/database';
import type { TintName } from '@/theme';

import { createFoldersService } from './services/folders-service';
import type { Folder } from './types';
import { sortFolders } from './utils';

type CategoriesContextValue = {
  folders: Folder[];
  ready: boolean;
  getFolder: (id: string) => Folder | undefined;
  /** Children of a folder (or top-level when null), in the user's sort order. */
  getChildren: (parentId: string | null) => Folder[];
  /** Notes stored directly in a folder (null = not filed), newest first. */
  getNotes: (folderId: string | null) => NoteSummary[];
  /** Notes in a folder and all of its subfolders. */
  countNotes: (folderId: string) => number;
  totalNotes: number;
  /** Most recent activity in the folder subtree. */
  getUpdatedAt: (folder: Folder) => string;
  /** "Carreira / Liderança" style path, for pickers and subtitles. */
  getPath: (id: string | null) => string[];
  createFolder: (input: { name: string; parentId: string | null; tint?: TintName }) => Promise<Folder>;
  updateFolder: (id: string, patch: { name?: string; tint?: TintName }) => Promise<Folder>;
  /** Deletes a folder; its notes and subfolders move up to its parent. */
  deleteFolder: (id: string) => Promise<void>;
  /** Manual ordering: move a folder one position among its siblings. */
  moveFolder: (id: string, direction: -1 | 1) => void;
};

const CategoriesContext = createContext<CategoriesContextValue | null>(null);

/** Categories tree, persisted in SQLite; note counts come from the notes store. */
export function CategoriesProvider({ children }: { children: ReactNode }) {
  const db = useDatabase();
  const { preferences } = usePreferences();
  const { notes, refresh: refreshNotes } = useNotes();
  const service = useMemo(() => createFoldersService({ db, newId: randomUUID }), [db]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    setFolders(await service.list());
    setReady(true);
  }, [service]);

  // Initial load from the database.
  useEffect(() => {
    let cancelled = false;
    service
      .list()
      .then((rows) => !cancelled && setFolders(rows))
      .catch((error) => console.error('Falha ao carregar categorias', error))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [service]);

  const derived = useMemo(() => {
    const byId = new Map(folders.map((f) => [f.id, f]));
    const childrenOf = new Map<string | null, Folder[]>();
    for (const folder of folders) {
      const siblings = childrenOf.get(folder.parentId) ?? [];
      siblings.push(folder);
      childrenOf.set(folder.parentId, siblings);
    }
    // Summaries already arrive newest first, so each list keeps that order.
    const notesOf = new Map<string | null, NoteSummary[]>();
    for (const note of notes) {
      const list = notesOf.get(note.folderId) ?? [];
      list.push(note);
      notesOf.set(note.folderId, list);
    }

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
    const path = (id: string | null): string[] => {
      const names: string[] = [];
      let current = id ? byId.get(id) : undefined;
      while (current) {
        names.unshift(current.name);
        current = current.parentId ? byId.get(current.parentId) : undefined;
      }
      return names;
    };
    return { byId, childrenOf, notesOf, count, updated, path };
  }, [folders, notes]);

  const getChildren = useCallback(
    (parentId: string | null) =>
      sortFolders(derived.childrenOf.get(parentId) ?? [], preferences.folderSort, derived.updated),
    [derived, preferences.folderSort],
  );

  const createFolder = useCallback<CategoriesContextValue['createFolder']>(
    async ({ name, parentId, tint }) => {
      const parent = parentId ? derived.byId.get(parentId) : undefined;
      const folder = await service.create({ name, parentId, tint: tint ?? parent?.tint ?? 'stone' });
      await refresh();
      return folder;
    },
    [derived, service, refresh],
  );

  const updateFolder = useCallback<CategoriesContextValue['updateFolder']>(
    async (id, patch) => {
      const folder = await service.update(id, patch);
      await refresh();
      return folder;
    },
    [service, refresh],
  );

  const deleteFolder = useCallback(
    async (id: string) => {
      await service.remove(id);
      await Promise.all([refresh(), refreshNotes()]);
    },
    [service, refresh, refreshNotes],
  );

  const moveFolder = useCallback(
    (id: string, direction: -1 | 1) => {
      service
        .reorder(id, direction)
        .then(refresh)
        .catch((error) => console.error('Falha ao reordenar', error));
    },
    [service, refresh],
  );

  const value = useMemo<CategoriesContextValue>(
    () => ({
      folders,
      ready,
      getFolder: (id) => derived.byId.get(id),
      getChildren,
      getNotes: (folderId) => derived.notesOf.get(folderId) ?? [],
      countNotes: derived.count,
      totalNotes: notes.length,
      getUpdatedAt: derived.updated,
      getPath: derived.path,
      createFolder,
      updateFolder,
      deleteFolder,
      moveFolder,
    }),
    [folders, ready, derived, getChildren, notes.length, createFolder, updateFolder, deleteFolder, moveFolder],
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): CategoriesContextValue {
  const value = useContext(CategoriesContext);
  if (!value) throw new Error('useCategories must be used inside <CategoriesProvider>');
  return value;
}
