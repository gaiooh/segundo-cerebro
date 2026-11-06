import type { IdeaGraph, PositionedNode } from './types';

/** Small deterministic PRNG so the layout is identical on every render. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export type GraphInsets = { top: number; right: number; bottom: number; left: number };

/**
 * Lightweight force-directed layout: nodes repel each other, related ideas
 * attract, and each idea is pulled toward its category's anchor so groups read
 * as distinct clusters. Computed in a unit square, then fitted with a uniform
 * scale (no stretching). Pure function — no rendering concerns.
 */
export function layoutGraph(
  graph: IdeaGraph,
  width: number,
  height: number,
  insets: GraphInsets = { top: 28, right: 28, bottom: 28, left: 28 },
): PositionedNode[] {
  const rand = seeded(11);
  const count = graph.categories.length;

  // Category anchors on an ellipse matching the canvas proportions.
  const aspect = Math.max(0.6, Math.min(1.8, height / Math.max(width, 1)));
  const anchors = new Map(
    graph.categories.map((category, index) => {
      const angle = (index / count) * Math.PI * 2 - Math.PI / 2;
      return [category.id, { x: Math.cos(angle), y: Math.sin(angle) * aspect }];
    }),
  );

  const nodes = graph.nodes.map((node) => {
    const anchor = anchors.get(node.categoryId) ?? { x: 0, y: 0 };
    return { ...node, x: anchor.x + (rand() - 0.5) * 0.3, y: anchor.y + (rand() - 0.5) * 0.3, vx: 0, vy: 0, degree: 0 };
  });
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  for (const edge of graph.edges) {
    const a = index.get(edge.source);
    const b = index.get(edge.target);
    if (a !== undefined) nodes[a].degree++;
    if (b !== undefined) nodes[b].degree++;
  }

  const ideal = 0.32;
  const steps = 360;
  for (let step = 0; step < steps; step++) {
    const cooling = 1 - step / steps;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist2 = Math.max(dx * dx + dy * dy, 0.0004);
        const dist = Math.sqrt(dist2);
        const force = (ideal * ideal * 0.12) / dist2;
        nodes[i].vx += (dx / dist) * force;
        nodes[i].vy += (dy / dist) * force;
        nodes[j].vx -= (dx / dist) * force;
        nodes[j].vy -= (dy / dist) * force;
      }
    }
    for (const edge of graph.edges) {
      const a = nodes[index.get(edge.source) ?? -1];
      const b = nodes[index.get(edge.target) ?? -1];
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 0.001);
      // Links across categories pull gently so clusters stay readable.
      const sameGroup = a.categoryId === b.categoryId;
      const k = (sameGroup ? 0.08 : 0.015) * (0.5 + edge.strength);
      const force = ((dist - ideal * 0.6) / dist) * k;
      a.vx += dx * force;
      a.vy += dy * force;
      b.vx -= dx * force;
      b.vy -= dy * force;
    }
    for (const node of nodes) {
      const anchor = anchors.get(node.categoryId) ?? { x: 0, y: 0 };
      node.vx += (anchor.x - node.x) * 0.09;
      node.vy += (anchor.y - node.y) * 0.09;
      const max = 0.06 * cooling + 0.004;
      node.x += Math.max(-max, Math.min(max, node.vx * 0.5));
      node.y += Math.max(-max, Math.min(max, node.vy * 0.5));
      node.vx *= 0.4;
      node.vy *= 0.4;
    }
  }

  // Uniform fit into the available box, centered.
  const minX = Math.min(...nodes.map((n) => n.x));
  const maxX = Math.max(...nodes.map((n) => n.x));
  const minY = Math.min(...nodes.map((n) => n.y));
  const maxY = Math.max(...nodes.map((n) => n.y));
  const boxW = width - insets.left - insets.right;
  const boxH = height - insets.top - insets.bottom;
  const scale = Math.min(boxW / Math.max(maxX - minX, 0.001), boxH / Math.max(maxY - minY, 0.001));
  const offsetX = insets.left + (boxW - (maxX - minX) * scale) / 2;
  const offsetY = insets.top + (boxH - (maxY - minY) * scale) / 2;

  return nodes.map(({ vx: _vx, vy: _vy, ...node }) => ({
    ...node,
    x: offsetX + (node.x - minX) * scale,
    y: offsetY + (node.y - minY) * scale,
  }));
}

/** Ids directly connected to a node. */
export function neighborsOf(graph: IdeaGraph, id: string): Set<string> {
  const result = new Set<string>();
  for (const edge of graph.edges) {
    if (edge.source === id) result.add(edge.target);
    if (edge.target === id) result.add(edge.source);
  }
  return result;
}
