/**
 * Note domain model and pure rules. No React, no storage, no platform code.
 */
export type NoteSource = 'voice' | 'text';

export type Note = {
  /** Stable unique identifier (UUID v4). Links and exports refer to it. */
  id: string;
  /** null = not filed in any category yet. */
  folderId: string | null;
  title: string;
  /** The thought exactly as it was captured. Never changes after creation. */
  original: string;
  /** Organized version, edited separately. null = not written yet. */
  organized: string | null;
  source: NoteSource;
  createdAt: string;
  updatedAt: string;
};

/** Lightweight shape used by lists, counts and the categories tree. */
export type NoteSummary = Pick<Note, 'id' | 'folderId' | 'title' | 'source' | 'createdAt' | 'updatedAt'> & {
  /** Start of the current text (organized version, or the original). */
  excerpt: string;
  hasOrganized: boolean;
};

export type NoteLinkRef = { id: string; title: string };

export const TITLE_MAX_LENGTH = 120;
export const EXCERPT_LENGTH = 240;

/** The text that represents the note today: organized version first, else the original. */
export function currentText(note: Pick<Note, 'original' | 'organized'>): string {
  return note.organized ?? note.original;
}

/** Title typed by the user, or the first meaningful line of the text. */
export function deriveTitle(title: string | undefined, text: string): string {
  const typed = (title ?? '').trim().replace(/\s+/g, ' ');
  if (typed) return typed.slice(0, TITLE_MAX_LENGTH);
  const firstLine =
    text
      .split('\n')
      .map((line) =>
        line
          .replace(/^#+\s*/, '')
          // [[Target|alias]] → alias, [[Target]] → Target
          .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
          .replace(/\[\[([^\]]+)\]\]/g, '$1')
          .replace(/\s+/g, ' ')
          .trim(),
      )
      .find((line) => line.length > 0) ?? '';
  if (!firstLine) return 'Sem título';
  if (firstLine.length <= 60) return firstLine;
  const cut = firstLine.slice(0, 60);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/**
 * An organized version identical to the original is not stored, so the same
 * text is never kept twice.
 */
export function normalizeOrganized(original: string, organized: string | null | undefined): string | null {
  if (organized == null) return null;
  if (organized.trim().length === 0) return null;
  if (organized === original) return null;
  return organized;
}

/** Lowercase, accent-free text, so "cafe" finds "Café". */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildSearchText(note: Pick<Note, 'title' | 'original' | 'organized'>): string {
  return normalizeForSearch([note.title, note.organized ?? '', note.original].join('\n'));
}

/**
 * Obsidian-style wiki links: [[Target]], [[Target|alias]], [[Target#heading]].
 * Returns the raw targets, in order, without duplicates.
 */
const WIKI_LINK = /\[\[([^\]|#\n]+)(?:#[^\]|\n]*)?(?:\|[^\]\n]*)?\]\]/g;

export function parseWikiLinks(text: string): string[] {
  const seen = new Set<string>();
  const targets: string[] = [];
  for (const match of text.matchAll(WIKI_LINK)) {
    const target = match[1].trim();
    const key = normalizeForSearch(target);
    if (!target || seen.has(key)) continue;
    seen.add(key);
    targets.push(target);
  }
  return targets;
}

/** Rewrites each [[target…]] through `map`; unknown targets are left untouched. */
export function rewriteWikiLinks(text: string, map: (target: string) => string | undefined): string {
  return text.replace(/\[\[([^\]|#\n]+)((?:#[^\]|\n]*)?)((?:\|[^\]\n]*)?)\]\]/g, (whole, target: string, heading: string, alias: string) => {
    const replacement = map(target.trim());
    if (replacement === undefined) return whole;
    const label = alias || (replacement !== target.trim() ? `|${target.trim()}` : '');
    return `[[${replacement}${heading}${label}]]`;
  });
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function looksLikeId(value: string): boolean {
  return UUID.test(value.trim());
}
