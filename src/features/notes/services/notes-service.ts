import type { SqlDatabase } from '../../../lib/database/types.ts';
import {
  buildSearchText,
  currentText,
  deriveTitle,
  looksLikeId,
  normalizeForSearch,
  normalizeOrganized,
  parseWikiLinks,
  type Note,
  type NoteLinkRef,
  type NoteSource,
  type NoteSummary,
} from '../model.ts';
import { createNotesRepository } from './notes-repository.ts';

export type ServiceDeps = {
  db: SqlDatabase;
  newId: () => string;
  now?: () => string;
};

export type CreateNoteInput = {
  text: string;
  title?: string;
  source: NoteSource;
  folderId?: string | null;
};

export type UpdateNoteInput = {
  title?: string;
  /** New organized version. null or "" removes it (falls back to the original). */
  organized?: string | null;
};

export type NoteDetail = Note & { links: NoteLinkRef[]; backlinks: NoteLinkRef[] };

export class NoteValidationError extends Error {}

/**
 * Business rules for notes: what can change, what must be preserved, and how
 * links between notes are resolved. Every multi-step write is atomic.
 */
export function createNotesService({ db, newId, now = () => new Date().toISOString() }: ServiceDeps) {
  const repo = createNotesRepository(db);

  /** Resolves [[…]] targets to note ids, by id or (case/accent-insensitive) title. */
  const resolveLinks = async (note: Note): Promise<string[]> => {
    const targets = parseWikiLinks(currentText(note));
    if (targets.length === 0) return [];
    const all = await repo.listTitles();
    const byTitle = new Map<string, string>();
    for (const ref of all) {
      const key = normalizeForSearch(ref.title);
      if (!byTitle.has(key)) byTitle.set(key, ref.id);
    }
    const ids = new Set(all.map((ref) => ref.id));
    const resolved = new Set<string>();
    for (const target of targets) {
      const id = looksLikeId(target) && ids.has(target.trim()) ? target.trim() : byTitle.get(normalizeForSearch(target));
      if (id && id !== note.id) resolved.add(id);
    }
    return [...resolved];
  };

  const syncLinks = async (note: Note) => {
    await repo.replaceLinks(note.id, await resolveLinks(note), now());
  };

  /** A new or renamed note may complete links other notes already wrote. */
  const syncMentionsOf = async (title: string, exceptId: string) => {
    for (const other of await repo.findMentioning(normalizeForSearch(title))) {
      if (other.id !== exceptId) await syncLinks(other);
    }
  };

  const requireNote = async (id: string): Promise<Note> => {
    const note = await repo.get(id);
    if (!note) throw new NoteValidationError('Nota não encontrada.');
    return note;
  };

  return {
    async create(input: CreateNoteInput): Promise<Note> {
      if (input.text.trim().length === 0) throw new NoteValidationError('A nota está vazia.');
      const timestamp = now();
      const note: Note = {
        id: newId(),
        folderId: input.folderId ?? null,
        title: deriveTitle(input.title, input.text),
        // Stored byte-for-byte as captured: no trimming, no formatting.
        original: input.text,
        organized: null,
        source: input.source,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
      await db.transaction(async () => {
        await repo.insert(note, buildSearchText(note));
        await syncLinks(note);
        await syncMentionsOf(note.title, note.id);
      });
      return note;
    },

    /** Edits the title and/or the organized version. The original is never touched. */
    async update(id: string, input: UpdateNoteInput): Promise<Note> {
      let result: Note | undefined;
      await db.transaction(async () => {
        const current = await requireNote(id);
        const title = input.title === undefined ? current.title : deriveTitle(input.title, current.original);
        const organized =
          input.organized === undefined ? current.organized : normalizeOrganized(current.original, input.organized);
        if (title === current.title && organized === current.organized) {
          result = current;
          return;
        }
        const next: Note = { ...current, title, organized, updatedAt: now() };
        await repo.update(next, buildSearchText(next));
        await syncLinks(next);
        if (title !== current.title) await syncMentionsOf(title, id);
        result = next;
      });
      return result!;
    },

    async move(id: string, folderId: string | null): Promise<Note> {
      let result: Note | undefined;
      await db.transaction(async () => {
        const current = await requireNote(id);
        if (current.folderId === folderId) {
          result = current;
          return;
        }
        if (folderId !== null) {
          const folder = await db.getFirstAsync<{ id: string }>('SELECT id FROM folders WHERE id = ?', [folderId]);
          if (!folder) throw new NoteValidationError('Categoria não encontrada.');
        }
        const next: Note = { ...current, folderId, updatedAt: now() };
        await repo.update(next, buildSearchText(next));
        result = next;
      });
      return result!;
    },

    async remove(id: string): Promise<void> {
      // Links pointing to/from the note are removed by ON DELETE CASCADE.
      await repo.delete(id);
    },

    async get(id: string): Promise<NoteDetail | null> {
      const note = await repo.get(id);
      if (!note) return null;
      const [links, backlinks] = await Promise.all([repo.outgoingLinks(id), repo.backlinks(id)]);
      return { ...note, links, backlinks };
    },

    listSummaries: (): Promise<NoteSummary[]> => repo.listSummaries(),

    listAll: (): Promise<Note[]> => repo.listAll(),

    allLinks: () => repo.allLinks(),

    /** Accent/case-insensitive search over title, organized version and original. */
    async search(query: string): Promise<NoteSummary[]> {
      const terms = normalizeForSearch(query).split(' ').filter(Boolean);
      return repo.search(terms);
    },
  };
}

export type NotesService = ReturnType<typeof createNotesService>;
