import { mockFolders } from '@/features/categories';
import { mockNotes } from '@/features/notes';

import type { IdeaEdge, IdeaGraph } from './types';

/**
 * DEMO DATA — hand-picked relations between the demo notes, standing in for
 * the semantic links the AI will compute in the future.
 */
const relations: [string, string, number][] = [
  ['n6', 'n7', 0.9],
  ['n6', 'n22', 0.6],
  ['n6', 'n3', 0.7],
  ['n7', 'n8', 0.6],
  ['n7', 'n9', 0.5],
  ['n8', 'n10', 0.7],
  ['n8', 'n14', 0.5],
  ['n2', 'n5', 0.8],
  ['n5', 'n14', 0.7],
  ['n5', 'n10', 0.4],
  ['n1', 'n4', 0.9],
  ['n1', 'n2', 0.5],
  ['n3', 'n21', 0.8],
  ['n11', 'n19', 0.8],
  ['n11', 'n9', 0.5],
  ['n12', 'n15', 0.6],
  ['n12', 'n4', 0.4],
  ['n15', 'n16', 0.8],
  ['n16', 'n19', 0.4],
  ['n20', 'n2', 0.6],
  ['n20', 'n15', 0.5],
  ['n17', 'n18', 0.5],
  ['n17', 'n20', 0.4],
  ['n13', 'n22', 0.6],
  ['n13', 'n14', 0.4],
];

function rootOf(folderId: string): string {
  let folder = mockFolders.find((f) => f.id === folderId);
  while (folder?.parentId) folder = mockFolders.find((f) => f.id === folder?.parentId);
  return folder?.id ?? folderId;
}

export const mockGraph: IdeaGraph = {
  nodes: mockNotes.map((note) => ({ id: note.id, label: note.title, categoryId: rootOf(note.folderId) })),
  edges: relations.map<IdeaEdge>(([source, target, strength]) => ({ source, target, strength })),
  categories: mockFolders
    .filter((f) => f.parentId === null)
    .map((f) => ({ id: f.id, name: f.name, tint: f.tint })),
};
