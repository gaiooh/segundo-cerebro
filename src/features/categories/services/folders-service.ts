import type { SqlDatabase } from '../../../lib/database/types.ts';
import type { Folder } from '../types.ts';

/**
 * Categories and subcategories: persistence (SQL) and rules (validation,
 * ordering, safe deletion). Pure TypeScript, testable outside React Native.
 */
type FolderRow = {
  id: string;
  name: string;
  parent_id: string | null;
  tint: Folder['tint'];
  sort_order: number;
  created_at: string;
  updated_at: string;
};

const toFolder = (row: FolderRow): Folder => ({
  id: row.id,
  name: row.name,
  parentId: row.parent_id,
  tint: row.tint,
  order: row.sort_order,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const FOLDER_NAME_MAX_LENGTH = 40;

export class FolderValidationError extends Error {}

type Deps = { db: SqlDatabase; newId: () => string; now?: () => string };

export function createFoldersService({ db, newId, now = () => new Date().toISOString() }: Deps) {
  const get = async (id: string) => {
    const row = await db.getFirstAsync<FolderRow>('SELECT * FROM folders WHERE id = ?', [id]);
    return row ? toFolder(row) : null;
  };

  const cleanName = (name: string) => {
    const value = name.trim().replace(/\s+/g, ' ').slice(0, FOLDER_NAME_MAX_LENGTH);
    if (!value) throw new FolderValidationError('Dê um nome à categoria.');
    return value;
  };

  return {
    get,

    async list(): Promise<Folder[]> {
      const rows = await db.getAllAsync<FolderRow>('SELECT * FROM folders ORDER BY sort_order, created_at');
      return rows.map(toFolder);
    },

    async create(input: { name: string; parentId: string | null; tint: Folder['tint'] }): Promise<Folder> {
      const name = cleanName(input.name);
      let folder: Folder | undefined;
      await db.transaction(async () => {
        if (input.parentId && !(await get(input.parentId))) {
          throw new FolderValidationError('Categoria mãe não encontrada.');
        }
        const max = await db.getFirstAsync<{ value: number | null }>(
          'SELECT MAX(sort_order) AS value FROM folders WHERE parent_id IS ?',
          [input.parentId],
        );
        const timestamp = now();
        folder = {
          id: newId(),
          name,
          parentId: input.parentId,
          tint: input.tint,
          order: (max?.value ?? -1) + 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        };
        await db.runAsync(
          `INSERT INTO folders (id, name, parent_id, tint, sort_order, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [folder.id, folder.name, folder.parentId, folder.tint, folder.order, folder.createdAt, folder.updatedAt],
        );
      });
      return folder!;
    },

    async update(id: string, patch: { name?: string; tint?: Folder['tint'] }): Promise<Folder> {
      const current = await get(id);
      if (!current) throw new FolderValidationError('Categoria não encontrada.');
      const next: Folder = {
        ...current,
        name: patch.name === undefined ? current.name : cleanName(patch.name),
        tint: patch.tint ?? current.tint,
      };
      if (next.name === current.name && next.tint === current.tint) return current;
      next.updatedAt = now();
      await db.runAsync('UPDATE folders SET name = ?, tint = ?, updated_at = ? WHERE id = ?', [
        next.name,
        next.tint,
        next.updatedAt,
        id,
      ]);
      return next;
    },

    /** Manual ordering: swap with the previous/next sibling. */
    async reorder(id: string, direction: -1 | 1): Promise<void> {
      await db.transaction(async () => {
        const folder = await get(id);
        if (!folder) return;
        const siblings = (
          await db.getAllAsync<FolderRow>('SELECT * FROM folders WHERE parent_id IS ? ORDER BY sort_order, created_at', [
            folder.parentId,
          ])
        ).map(toFolder);
        const index = siblings.findIndex((f) => f.id === id);
        const target = siblings[index + direction];
        if (!target) return;
        // Re-number the whole sibling list so equal or sparse orders never get stuck.
        [siblings[index], siblings[index + direction]] = [target, siblings[index]];
        for (const [position, sibling] of siblings.entries()) {
          await db.runAsync('UPDATE folders SET sort_order = ? WHERE id = ?', [position, sibling.id]);
        }
      });
    },

    /**
     * Deletes a category without losing anything inside it: its notes and
     * subcategories move up to the parent (or to "no category" at the top).
     */
    async remove(id: string): Promise<void> {
      await db.transaction(async () => {
        const folder = await get(id);
        if (!folder) return;
        await db.runAsync('UPDATE notes SET folder_id = ? WHERE folder_id = ?', [folder.parentId, id]);
        const max = await db.getFirstAsync<{ value: number | null }>(
          'SELECT MAX(sort_order) AS value FROM folders WHERE parent_id IS ? AND id <> ?',
          [folder.parentId, id],
        );
        const children = await db.getAllAsync<{ id: string }>(
          'SELECT id FROM folders WHERE parent_id = ? ORDER BY sort_order',
          [id],
        );
        let order = (max?.value ?? -1) + 1;
        for (const child of children) {
          await db.runAsync('UPDATE folders SET parent_id = ?, sort_order = ? WHERE id = ?', [folder.parentId, order++, child.id]);
        }
        await db.runAsync('DELETE FROM folders WHERE id = ?', [id]);
      });
    },
  };
}

export type FoldersService = ReturnType<typeof createFoldersService>;
