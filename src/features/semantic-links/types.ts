import type { TintName } from '@/theme';

export type IdeaNode = {
  id: string;
  label: string;
  /** Top-level category the idea belongs to. */
  categoryId: string;
};

export type IdeaEdge = {
  source: string;
  target: string;
  /** 0..1 — how strongly the ideas are related. */
  strength: number;
};

export type GraphCategory = { id: string; name: string; tint: TintName };

export type IdeaGraph = {
  nodes: IdeaNode[];
  edges: IdeaEdge[];
  categories: GraphCategory[];
};

export type PositionedNode = IdeaNode & { x: number; y: number; degree: number };
