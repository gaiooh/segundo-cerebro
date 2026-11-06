import type { SqlDatabase } from '../../../lib/database/types.ts';
import { EXCERPT_LENGTH, type Note, type NoteLinkRef, type NoteSummary } from '../model.ts';

/**
 * Persistence for notes and note links. SQL only: business rules live in
 * notes-service.ts.
 */
type NoteRow = {
  id: string;
  folder_id: string | null;
  title: string;
  original: string;
  organized: string | null;
  source: Note['source'];
  created_at: string;
  updated_at: string;
};

type SummaryRow = Omit<NoteRow, 'original' | 'organized'> & { excerpt: string; has_organized: number };

const toNote = (row: NoteRow): Note => ({
  id: row.id,
  folderId: row.folder_id,
  title: row.title,
  original: row.original,
  organized: row.organized,
  source: row.source,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const toSummary = (row: SummaryRow): NoteSummary => ({
  id: row.id,
  folderId: row.folder_id,
  title: row.title,
  source: row.source,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  excerpt: row.excerpt,
  hasOrganized: row.has_organized === 1,
});

const SUMMARY_COLUMNS = `id, folder_id, title, source, created_at, updated_at,
  substr(COALESCE(organized, original), 1, ${EXCERPT_LENGTH}) AS excerpt,
  (organized IS NOT NULL) AS has_organized`;

const escapeLike = (value: string) => value.replace(/[\\%_]/g, (c) => `\\${c}`);

export function createNotesRepository(db: SqlDatabase) {
  return {
    async insert(note: Note, searchText: string): Promise<void> {
      await db.runAsync(
        `INSERT INTO notes (id, folder_id, title, original, organized, source, search_text, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [note.id, note.folderId, note.title, note.original, note.organized, note.source, searchText, note.createdAt, note.updatedAt],
      );
    },

    /** Updates everything except `original`, which is immutable. */
    async update(note: Note, searchText: string): Promise<void> {
      await db.runAsync(
        `UPDATE notes SET folder_id = ?, title = ?, organized = ?, search_text = ?, updated_at = ? WHERE id = ?`,
        [note.folderId, note.title, note.organized, searchText, note.updatedAt, note.id],
      );
    },

    async delete(id: string): Promise<boolean> {
      const result = await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
      return result.changes > 0;
    },

    async get(id: string): Promise<Note | null> {
      const row = await db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
      return row ? toNote(row) : null;
    },

    async listAll(): Promise<Note[]> {
      const rows = await db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY updated_at DESC');
      return rows.map(toNote);
    },

    async listSummaries(): Promise<NoteSummary[]> {
      const rows = await db.getAllAsync<SummaryRow>(`SELECT ${SUMMARY_COLUMNS} FROM notes ORDER BY updated_at DESC`);
      return rows.map(toSummary);
    },

    /** Every term must appear (accent/case-insensitive, already normalized). */
    async search(terms: string[], limit = 100): Promise<NoteSummary[]> {
      if (terms.length === 0) return [];
      const where = terms.map(() => `search_text LIKE ? ESCAPE '\\'`).join(' AND ');
      const rows = await db.getAllAsync<SummaryRow>(
        `SELECT ${SUMMARY_COLUMNS} FROM notes WHERE ${where} ORDER BY updated_at DESC LIMIT ?`,
        [...terms.map((t) => `%${escapeLike(t)}%`), limit],
      );
      return rows.map(toSummary);
    },

    async listTitles(): Promise<NoteLinkRef[]> {
      return db.getAllAsync<NoteLinkRef>('SELECT id, title FROM notes');
    },

    /** Notes whose text may contain [[title…]], to re-resolve their links. */
    async findMentioning(normalizedTitle: string): Promise<Note[]> {
      const rows = await db.getAllAsync<NoteRow>(`SELECT * FROM notes WHERE search_text LIKE ? ESCAPE '\\'`, [
        `%[[${escapeLike(normalizedTitle)}%`,
      ]);
      return rows.map(toNote);
    },

    async replaceLinks(sourceId: string, targetIds: string[], now: string): Promise<void> {
      await db.runAsync('DELETE FROM note_links WHERE source_id = ?', [sourceId]);
      for (const targetId of targetIds) {
        await db.runAsync('INSERT OR IGNORE INTO note_links (source_id, target_id, created_at) VALUES (?, ?, ?)', [
          sourceId,
          targetId,
          now,
        ]);
      }
    },

    async outgoingLinks(id: string): Promise<NoteLinkRef[]> {
      return db.getAllAsync<NoteLinkRef>(
        `SELECT n.id, n.title FROM note_links l JOIN notes n ON n.id = l.target_id WHERE l.source_id = ? ORDER BY n.title`,
        [id],
      );
    },

    async backlinks(id: string): Promise<NoteLinkRef[]> {
      return db.getAllAsync<NoteLinkRef>(
        `SELECT n.id, n.title FROM note_links l JOIN notes n ON n.id = l.source_id WHERE l.target_id = ? ORDER BY n.title`,
        [id],
      );
    },

    async allLinks(): Promise<{ source_id: string; target_id: string }[]> {
      return db.getAllAsync('SELECT source_id, target_id FROM note_links');
    },
  };
}

export type NotesRepository = ReturnType<typeof createNotesRepository>;
