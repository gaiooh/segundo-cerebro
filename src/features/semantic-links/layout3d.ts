import type { Random } from './random';

type LayoutInput = {
  nodeCount: number;
  edges: { source: number; target: number; strength: number }[];
  /** Category index per node. */
  groups: number[];
  groupCount: number;
  random: Random;
};

/**
 * Three-dimensional force-directed layout. Groups start around anchors spread
 * on a sphere (Fibonacci distribution); repulsion, edge springs and a soft pull
 * toward each anchor then shape an organic, interconnected network with real
 * depth on X, Y and Z. Pure function — run once, cached by the caller.
 */
export function layout3d({ nodeCount, edges, groups, groupCount, random }: LayoutInput): {
  positions: Float32Array;
  radius: number;
} {
  const anchors: [number, number, number][] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  // Small networks (a few notes) keep their groups close together, so they
  // don't end up at opposite edges of the screen; large ones use the full spread.
  const spread = Math.min(6.5, 1.5 + Math.sqrt(nodeCount) * 0.6);
  for (let i = 0; i < groupCount; i++) {
    const y = 1 - (i / Math.max(groupCount - 1, 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const theta = golden * i;
    anchors.push([Math.cos(theta) * r * spread, y * spread, Math.sin(theta) * r * spread]);
  }

  const pos = new Float32Array(nodeCount * 3);
  const vel = new Float32Array(nodeCount * 3);
  for (let i = 0; i < nodeCount; i++) {
    const a = anchors[groups[i]];
    pos[i * 3] = a[0] + random.gaussian() * 2.2;
    pos[i * 3 + 1] = a[1] + random.gaussian() * 2.2;
    pos[i * 3 + 2] = a[2] + random.gaussian() * 2.2;
  }

  const steps = 240;
  for (let step = 0; step < steps; step++) {
    const alpha = 1 - step / steps;

    // Short-range repulsion keeps nodes from clumping.
    for (let i = 0; i < nodeCount; i++) {
      const ix = i * 3;
      for (let j = i + 1; j < nodeCount; j++) {
        const jx = j * 3;
        const dx = pos[ix] - pos[jx];
        const dy = pos[ix + 1] - pos[jx + 1];
        const dz = pos[ix + 2] - pos[jx + 2];
        const d2 = dx * dx + dy * dy + dz * dz;
        if (d2 > 16) continue;
        const f = 0.06 / Math.max(d2, 0.04);
        vel[ix] += dx * f;
        vel[ix + 1] += dy * f;
        vel[ix + 2] += dz * f;
        vel[jx] -= dx * f;
        vel[jx + 1] -= dy * f;
        vel[jx + 2] -= dz * f;
      }
    }

    // Springs: related ideas stay close; cross-group links pull gently.
    for (const edge of edges) {
      const ax = edge.source * 3;
      const bx = edge.target * 3;
      const dx = pos[bx] - pos[ax];
      const dy = pos[bx + 1] - pos[ax + 1];
      const dz = pos[bx + 2] - pos[ax + 2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
      const same = groups[edge.source] === groups[edge.target];
      const k = (same ? 0.04 : 0.006) * (0.5 + edge.strength);
      const f = ((len - (same ? 1.3 : 3)) / len) * k;
      vel[ax] += dx * f;
      vel[ax + 1] += dy * f;
      vel[ax + 2] += dz * f;
      vel[bx] -= dx * f;
      vel[bx + 1] -= dy * f;
      vel[bx + 2] -= dz * f;
    }

    const maxStep = 0.4 * alpha + 0.02;
    for (let i = 0; i < nodeCount; i++) {
      const ix = i * 3;
      const a = anchors[groups[i]];
      for (let k = 0; k < 3; k++) {
        vel[ix + k] += (a[k] - pos[ix + k]) * 0.012 - pos[ix + k] * 0.0015;
        pos[ix + k] += Math.max(-maxStep, Math.min(maxStep, vel[ix + k]));
        vel[ix + k] *= 0.55;
      }
    }
  }

  // Center on the origin and measure the bounding sphere.
  let cx = 0;
  let cy = 0;
  let cz = 0;
  for (let i = 0; i < nodeCount; i++) {
    cx += pos[i * 3];
    cy += pos[i * 3 + 1];
    cz += pos[i * 3 + 2];
  }
  cx /= nodeCount;
  cy /= nodeCount;
  cz /= nodeCount;
  let radius = 0;
  for (let i = 0; i < nodeCount; i++) {
    pos[i * 3] -= cx;
    pos[i * 3 + 1] -= cy;
    pos[i * 3 + 2] -= cz;
    radius = Math.max(radius, Math.hypot(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]));
  }

  return { positions: pos, radius };
}
