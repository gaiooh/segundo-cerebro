import type { Folder } from '../categories/types.ts';
import { normalizeForSearch, rewriteWikiLinks, type Note } from './model.ts';

/**
 * Obsidian-compatible Markdown export. Pure functions: they build file paths
 * and contents; writing them to disk is the platform layer's job (export.ts).
 *
 * File layout mirrors the categories tree:
 *   <Categoria>/<Subcategoria>/<Título da nota>.md
 *   Sem categoria/<Título>.md   (notes not filed yet)
 *
 * Each file has YAML front matter carrying the stable `id`, so a future
 * import (or sync) can match files to notes even if titles change.
 */
export const UNFILED_FOLDER_NAME = 'Sem categoria';
export const ORIGINAL_HEADING = 'Pensamento original';

export type MarkdownFile = {
  noteId: string;
  /** Folder segments, already sanitized. Empty = vault root. */
  dir: string[];
  /** File name including ".md". */
  name: string;
  content: string;
};

/** Characters Obsidian, Windows, Android and iOS reject in file names (and in link targets). */
export function safeFileName(value: string, fallback = 'Sem título'): string {
  const cleaned = value
    .replace(/[\\/:*?"<>|#^[\]\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+/, '')
    .replace(/[. ]+$/, '')
    .slice(0, 100)
    .trim();
  return cleaned || fallback;
}

const yamlString = (value: string) => JSON.stringify(value);

export function folderPath(folderId: string | null, folders: Map<string, Folder>): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  let current = folderId ? folders.get(folderId) : undefined;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    names.unshift(current.name);
    current = current.parentId ? folders.get(current.parentId) : undefined;
  }
  return names;
}

type RenderOptions = {
  categoryPath: string[];
  /** Exported basenames of linked notes (from note_links), by note id. */
  linkTargets?: { id: string; basename: string }[];
  /** Maps a [[target]] written in the text to its exported basename. */
  resolveLink?: (target: string) => string | undefined;
};

export function noteToMarkdown(note: Note, { categoryPath, linkTargets = [], resolveLink }: RenderOptions): string {
  const front = [
    '---',
    `id: ${note.id}`,
    `title: ${yamlString(note.title)}`,
    `created: ${note.createdAt}`,
    `updated: ${note.updatedAt}`,
    `source: ${note.source}`,
  ];
  if (categoryPath.length > 0) front.push(`category: ${yamlString(categoryPath.join('/'))}`);
  if (linkTargets.length > 0) {
    front.push('links:');
    for (const link of linkTargets) front.push(`  - ${yamlString(`[[${link.basename}]]`)}`);
  }
  front.push('---', '', '');

  const rewrite = (text: string) => (resolveLink ? rewriteWikiLinks(text, resolveLink) : text);

  // Without an organized version the body *is* the original, untouched.
  if (note.organized === null) return `${front.join('\n')}${note.original}\n`;

  // With one, the organized text comes first and the original follows,
  // verbatim, under its own heading (links inside it are not rewritten).
  return `${front.join('\n')}${rewrite(note.organized)}\n\n## ${ORIGINAL_HEADING}\n\n${note.original}\n`;
}

/** Builds every file of an Obsidian vault from the notes and categories. */
export function buildVault(
  notes: Note[],
  folders: Folder[],
  links: { source_id: string; target_id: string }[] = [],
): MarkdownFile[] {
  const byId = new Map(folders.map((f) => [f.id, f]));

  // 1. Pick a unique file name per note inside its directory.
  const placed = new Map<string, { dir: string[]; basename: string; categoryPath: string[] }>();
  const taken = new Map<string, Set<string>>();
  const ordered = [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  for (const note of ordered) {
    const categoryPath = folderPath(note.folderId, byId);
    const dir = (categoryPath.length > 0 ? categoryPath : [UNFILED_FOLDER_NAME]).map((n) => safeFileName(n, 'Categoria'));
    const dirKey = dir.join('/').toLowerCase();
    const used = taken.get(dirKey) ?? new Set<string>();
    const base = safeFileName(note.title);
    let basename = base;
    for (let i = 2; used.has(basename.toLowerCase()); i++) basename = `${base} (${i})`;
    used.add(basename.toLowerCase());
    taken.set(dirKey, used);
    placed.set(note.id, { dir, basename, categoryPath });
  }

  // 2. Map titles and ids to the exported names, so [[links]] keep working in Obsidian.
  const byTitle = new Map<string, string>();
  for (const note of ordered) {
    const key = normalizeForSearch(note.title);
    if (!byTitle.has(key)) byTitle.set(key, placed.get(note.id)!.basename);
  }
  const resolveLink = (target: string) => placed.get(target)?.basename ?? byTitle.get(normalizeForSearch(target));

  const outgoing = new Map<string, string[]>();
  for (const link of links) {
    const list = outgoing.get(link.source_id) ?? [];
    list.push(link.target_id);
    outgoing.set(link.source_id, list);
  }

  return ordered.map((note) => {
    const place = placed.get(note.id)!;
    const linkTargets = (outgoing.get(note.id) ?? [])
      .filter((id) => placed.has(id))
      .map((id) => ({ id, basename: placed.get(id)!.basename }));
    return {
      noteId: note.id,
      dir: place.dir,
      name: `${place.basename}.md`,
      content: noteToMarkdown(note, { categoryPath: place.categoryPath, linkTargets, resolveLink }),
    };
  });
}
