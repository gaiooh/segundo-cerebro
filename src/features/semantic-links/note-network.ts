import type { Folder } from '../categories/types.ts';
import { layout3d } from './layout3d.ts';
import { createRandom } from './random.ts';
import type { KnowledgeNetwork, NetworkCategory, NetworkEdge, NetworkNode } from './types.ts';

/**
 * Builds the 3D knowledge network from the user's real data. Pure function
 * (no React, no storage), so it is tested in Node like the notes services.
 *
 * - Nodes: every note, plus every category/subcategory that contains notes
 *   (directly or below it).
 * - Edges: [[links]] between notes ("link"), and the filing structure
 *   note → folder and subfolder → parent folder ("structure").
 * - Groups (colors and filters): the top-level category of each node.
 *   Notes not filed yet form their own group.
 */
export type NetworkNoteInput = { id: string; title: string; folderId: string | null };
export type NetworkLinkInput = { source_id: string; target_id: string };

/** Group id for notes without a category (matches the "Sem categoria" route id). */
export const UNFILED_GROUP_ID = 'sem-categoria';

const LINK_STRENGTH = 1;
const NOTE_IN_FOLDER_STRENGTH = 0.55;
const SUBFOLDER_STRENGTH = 0.7;
/** The layout needs some extent even for one or two nodes. */
const MIN_RADIUS = 2;

export function buildNoteNetwork(
  notes: NetworkNoteInput[],
  folders: Folder[],
  links: NetworkLinkInput[],
): KnowledgeNetwork | null {
  if (notes.length === 0) return null;

  const byId = new Map(folders.map((f) => [f.id, f]));
  const rootOf = (folderId: string): Folder | undefined => {
    let folder = byId.get(folderId);
    const seen = new Set<string>();
    while (folder?.parentId && !seen.has(folder.id)) {
      seen.add(folder.id);
      const parent = byId.get(folder.parentId);
      if (!parent) break;
      folder = parent;
    }
    return folder;
  };

  // Folders that hold notes somewhere in their subtree (empty ones add no meaning).
  const used = new Set<string>();
  for (const note of notes) {
    let folder = note.folderId ? byId.get(note.folderId) : undefined;
    while (folder && !used.has(folder.id)) {
      used.add(folder.id);
      folder = folder.parentId ? byId.get(folder.parentId) : undefined;
    }
  }

  // Groups: used top-level categories in their manual order, then "Sem categoria".
  const categories: NetworkCategory[] = folders
    .filter((f) => f.parentId === null && used.has(f.id))
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
    .map((f) => ({ id: f.id, name: f.name, tint: f.tint }));
  const groupOfNote = (note: NetworkNoteInput) =>
    (note.folderId ? rootOf(note.folderId)?.id : undefined) ?? UNFILED_GROUP_ID;
  if (notes.some((n) => groupOfNote(n) === UNFILED_GROUP_ID)) {
    categories.push({ id: UNFILED_GROUP_ID, name: 'Sem categoria', tint: 'stone' });
  }

  // Stable order (creation) so the same data always yields the same layout.
  const orderedFolders = folders
    .filter((f) => used.has(f.id))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
  const nodes: NetworkNode[] = [];
  const indexOf = new Map<string, number>();
  for (const folder of orderedFolders) {
    indexOf.set(`folder:${folder.id}`, nodes.length);
    nodes.push({ id: folder.id, label: folder.name, categoryId: rootOf(folder.id)?.id ?? folder.id, kind: 'folder' });
  }
  for (const note of notes) {
    indexOf.set(`note:${note.id}`, nodes.length);
    nodes.push({ id: note.id, label: note.title, categoryId: groupOfNote(note), kind: 'note' });
  }

  const edges: NetworkEdge[] = [];
  const seen = new Set<string>();
  const connect = (a: number | undefined, b: number | undefined, strength: number, kind: NetworkEdge['kind']) => {
    if (a === undefined || b === undefined || a === b) return;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ source: a, target: b, strength, kind });
  };

  // Links first: a link and a structure edge between the same pair count as a link.
  for (const link of links) {
    connect(indexOf.get(`note:${link.source_id}`), indexOf.get(`note:${link.target_id}`), LINK_STRENGTH, 'link');
  }
  for (const folder of orderedFolders) {
    if (folder.parentId) {
      connect(indexOf.get(`folder:${folder.id}`), indexOf.get(`folder:${folder.parentId}`), SUBFOLDER_STRENGTH, 'structure');
    }
  }
  for (const note of notes) {
    if (note.folderId) {
      connect(indexOf.get(`note:${note.id}`), indexOf.get(`folder:${note.folderId}`), NOTE_IN_FOLDER_STRENGTH, 'structure');
    }
  }

  const groupIndex = new Map(categories.map((c, i) => [c.id, i]));
  const { positions, radius } = layout3d({
    nodeCount: nodes.length,
    edges,
    groups: nodes.map((n) => groupIndex.get(n.categoryId) ?? 0),
    groupCount: categories.length,
    random: createRandom(nodes.length * 7919 + edges.length),
  });

  const degree = new Uint16Array(nodes.length);
  const neighbors: number[][] = nodes.map(() => []);
  for (const edge of edges) {
    degree[edge.source]++;
    degree[edge.target]++;
    neighbors[edge.source].push(edge.target);
    neighbors[edge.target].push(edge.source);
  }

  return { nodes, edges, categories, positions, degree, neighbors, radius: Math.max(radius, MIN_RADIUS) };
}

/** Number of [[links]] between notes (structure edges excluded). */
export function countNoteLinks(network: KnowledgeNetwork): number {
  return network.edges.reduce((sum, edge) => sum + (edge.kind === 'link' ? 1 : 0), 0);
}
