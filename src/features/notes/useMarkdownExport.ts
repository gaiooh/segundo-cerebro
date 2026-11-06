import { useCallback } from 'react';

import type { Folder } from '@/features/categories/types';

import { exportVaultToPickedFolder, shareMarkdownFile } from './export';
import { buildVault } from './markdown';
import { useNotes } from './NotesProvider';

/**
 * Markdown export actions. Files are generated on demand from the database,
 * so there is never a second copy of the notes to keep in sync.
 */
export function useMarkdownExport(folders: Folder[]) {
  const { service } = useNotes();

  const exportNote = useCallback(
    async (id: string) => {
      const [notes, links] = await Promise.all([service.listAll(), service.allLinks()]);
      // Built from the whole vault so file names and [[links]] match a full export.
      const file = buildVault(notes, folders, links).find((f) => f.noteId === id);
      if (!file) throw new Error('Nota não encontrada.');
      await shareMarkdownFile(file);
      return file;
    },
    [service, folders],
  );

  const exportAll = useCallback(async () => {
    const [notes, links] = await Promise.all([service.listAll(), service.allLinks()]);
    const files = buildVault(notes, folders, links);
    const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ').replace(':', 'h');
    const folder = await exportVaultToPickedFolder(files, `Segundo Cérebro ${stamp}`);
    return { folder, count: files.length };
  }, [service, folders]);

  return { exportNote, exportAll };
}
