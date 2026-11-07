import type { TintName } from '@/theme';

export type NetworkNode = {
  id: string;
  label: string;
  /** Top-level category the idea belongs to. */
  categoryId: string;
  /** Notes are things the user wrote; concepts are recurring themes. */
  kind: 'note' | 'concept';
};

export type NetworkEdge = {
  /** Node indices (not ids) for fast access in the renderer. */
  source: number;
  target: number;
  /** 0..1 — how strongly the ideas are related. */
  strength: number;
};

export type NetworkCategory = { id: string; name: string; tint: TintName };

export type KnowledgeNetwork = {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  categories: NetworkCategory[];
  /** xyz per node, laid out in 3D (world units, centered on the origin). */
  positions: Float32Array;
  /** Connection count per node. */
  degree: Uint16Array;
  /** Neighbor indices per node. */
  neighbors: number[][];
  /** Radius of the sphere that contains every node. */
  radius: number;
};
