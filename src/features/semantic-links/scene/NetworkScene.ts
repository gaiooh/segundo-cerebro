import * as THREE from 'three';

import type { KnowledgeNetwork } from '../types';

export type SceneColors = {
  background: string;
  accent: string;
  /** Neutral tone mixed into edges. */
  edge: string;
  /** Node color per category id. */
  tints: Record<string, string>;
  scheme: 'light' | 'dark';
};

export type ScreenPoint = { x: number; y: number; visible: boolean };

/** Minimal WebGL context shape we rely on (expo-gl or a browser context). */
type GLContext = WebGLRenderingContext & {
  endFrameEXP?: () => void;
  canvas?: HTMLCanvasElement | OffscreenCanvas;
};

const tmpMatrix = new THREE.Matrix4();
const tmpColor = new THREE.Color();
const tmpVector = new THREE.Vector3();

/**
 * Imperative Three.js controller for the 3D knowledge network.
 * Owns the renderer, camera, meshes and animation loop; the React component
 * only forwards gestures and reads projected points for overlays.
 */
export class NetworkScene {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private nodesMesh: THREE.InstancedMesh;
  private halo: THREE.Mesh;
  private edges: THREE.LineSegments;
  private highlight: THREE.LineSegments;
  private ambient = new THREE.AmbientLight(0xffffff, 0.75);
  private keyLight = new THREE.DirectionalLight(0xffffff, 1.1);

  private live: Float32Array;
  private drift: Float32Array;
  private phases: Float32Array;
  private baseScale: Float32Array;
  private edgeColors: Float32Array;
  /** Per-node emphasis, eased toward 1 (focused) or 0 (dimmed) every frame. */
  private mix: Float32Array;
  private mixTarget: Float32Array;
  private baseColors: Float32Array;
  private dimAmount = 0.9;

  private colors: SceneColors;
  private focusCategory: string | null = null;
  private selected: number | null = null;
  private neighborSet = new Set<number>();

  // Orbit camera state (spherical coordinates around a target).
  private theta = 0.6;
  private phi = 1.2;
  private radius: number;
  private radiusGoal: number;
  private target = new THREE.Vector3();
  private targetGoal = new THREE.Vector3();
  private velTheta = 0;
  private velPhi = 0;
  private dragging = false;
  private lastInteraction = 0;

  private cssWidth: number;
  private cssHeight: number;
  private frame = 0;
  private startedAt = Date.now();
  private disposed = false;

  /** Called every frame with screen positions of the tracked nodes. */
  onFrame?: (points: ScreenPoint[]) => void;
  private tracked: number[] = [];

  constructor(
    private gl: GLContext,
    cssWidth: number,
    cssHeight: number,
    private network: KnowledgeNetwork,
    colors: SceneColors,
  ) {
    this.cssWidth = Math.max(cssWidth, 1);
    this.cssHeight = Math.max(cssHeight, 1);
    this.colors = colors;

    this.renderer = new THREE.WebGLRenderer({
      canvas: (gl.canvas as HTMLCanvasElement | undefined) ?? createCanvasShim(gl),
      context: gl as unknown as WebGL2RenderingContext,
      antialias: true,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);

    this.camera = new THREE.PerspectiveCamera(48, this.cssWidth / this.cssHeight, 0.1, 400);
    this.radius = this.radiusGoal = this.fitRadius();
    this.scene.add(this.camera, this.ambient);
    // Light rides with the camera so nodes are always lit from the viewer's side.
    this.keyLight.position.set(4, 6, 8);
    this.camera.add(this.keyLight);

    const count = network.nodes.length;
    this.live = new Float32Array(network.positions);
    this.drift = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.baseScale = new Float32Array(count);
    this.mix = new Float32Array(count).fill(1);
    this.mixTarget = new Float32Array(count).fill(1);
    this.baseColors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Each node drifts gently along its own direction: the network "breathes".
      const angle = (i * 2.399963) % (Math.PI * 2);
      const z = ((i * 0.618034) % 1) * 2 - 1;
      const r = Math.sqrt(1 - z * z);
      this.drift[i * 3] = Math.cos(angle) * r;
      this.drift[i * 3 + 1] = z;
      this.drift[i * 3 + 2] = Math.sin(angle) * r;
      this.phases[i] = (i * 1.7) % (Math.PI * 2);
      const degree = Math.min(network.degree[i], 10);
      this.baseScale[i] = (network.nodes[i].kind === 'note' ? 0.2 : 0.13) + degree * 0.018;
    }

    // Nodes: one instanced sphere mesh, lit, with per-instance color.
    const sphere = new THREE.SphereGeometry(1, 20, 14);
    const material = new THREE.MeshStandardMaterial({ roughness: 0.42, metalness: 0.08 });
    this.nodesMesh = new THREE.InstancedMesh(sphere, material, count);
    this.nodesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < count; i++) this.nodesMesh.setColorAt(i, tmpColor.set('#ffffff'));
    this.scene.add(this.nodesMesh);

    // Soft halo around the selected node.
    this.halo = new THREE.Mesh(
      new THREE.SphereGeometry(1, 24, 16),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.16, depthWrite: false }),
    );
    this.halo.visible = false;
    this.scene.add(this.halo);

    // Edges: delicate lines, tinted by the categories they connect.
    const edgeGeometry = new THREE.BufferGeometry();
    edgeGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(network.edges.length * 6), 3));
    this.edgeColors = new Float32Array(network.edges.length * 6);
    edgeGeometry.setAttribute('color', new THREE.BufferAttribute(this.edgeColors, 3));
    this.edges = new THREE.LineSegments(
      edgeGeometry,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }),
    );
    this.scene.add(this.edges);

    // Connections of the selected node, drawn on top in the accent color.
    this.highlight = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ transparent: true, opacity: 0.95, depthWrite: false }),
    );
    this.scene.add(this.highlight);

    this.applyColors();
    this.loop();
  }

  // ───────────────────────── Public API ─────────────────────────

  setColors(colors: SceneColors) {
    this.colors = colors;
    this.applyColors();
  }

  setFilter(categoryId: string | null) {
    this.focusCategory = categoryId;
    if (categoryId) {
      // Fly toward the region of the network where the category lives.
      const center = this.centroid((i) => this.network.nodes[i].categoryId === categoryId);
      this.targetGoal.copy(center);
      // Frame the category's own extent, so its region fills the view.
      let extent = 0;
      for (let i = 0; i < this.network.nodes.length; i++) {
        if (this.network.nodes[i].categoryId !== categoryId) continue;
        tmpVector.set(this.network.positions[i * 3], this.network.positions[i * 3 + 1], this.network.positions[i * 3 + 2]);
        extent = Math.max(extent, tmpVector.distanceTo(center));
      }
      this.radiusGoal = this.fitRadius() * Math.min(0.7, Math.max(0.3, (extent * 1.15) / this.network.radius));
    } else if (this.selected === null) {
      this.targetGoal.set(0, 0, 0);
      this.radiusGoal = this.fitRadius();
    }
    this.applyColors();
  }

  select(index: number | null) {
    this.selected = index;
    this.neighborSet = new Set(index === null ? [] : this.network.neighbors[index]);
    if (index !== null) {
      this.targetGoal.set(this.live[index * 3], this.live[index * 3 + 1], this.live[index * 3 + 2]);
      this.radiusGoal = Math.min(this.radiusGoal, this.network.radius * 1.15);
    }
    this.rebuildHighlight();
    this.applyColors();
  }

  /** Nodes whose screen position is reported through `onFrame`. */
  track(indices: number[]) {
    this.tracked = indices;
  }

  beginDrag() {
    this.dragging = true;
    this.velTheta = 0;
    this.velPhi = 0;
    this.touch();
  }

  /** Rotate by a screen-space delta in CSS pixels. */
  rotateBy(dx: number, dy: number) {
    const k = 3.2 / Math.min(this.cssWidth, this.cssHeight);
    this.velTheta = -dx * k;
    this.velPhi = -dy * k;
    this.theta += this.velTheta;
    this.phi = clamp(this.phi + this.velPhi, 0.15, Math.PI - 0.15);
    this.touch();
  }

  endDrag() {
    this.dragging = false;
    this.touch();
  }

  /** factor > 1 moves away, < 1 moves closer. */
  zoomBy(factor: number) {
    const fit = this.fitRadius();
    this.radiusGoal = clamp(this.radiusGoal * factor, this.network.radius * 0.35, fit * 1.8);
    this.touch();
  }

  resetView() {
    this.targetGoal.set(0, 0, 0);
    this.radiusGoal = this.fitRadius();
    this.touch();
  }

  /** Nearest node under a tap (CSS pixels), or null. */
  pick(x: number, y: number): number | null {
    let best: number | null = null;
    let bestScore = Infinity;
    const halfFov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    for (let i = 0; i < this.network.nodes.length; i++) {
      tmpVector.set(this.live[i * 3], this.live[i * 3 + 1], this.live[i * 3 + 2]);
      const depth = tmpVector.distanceTo(this.camera.position);
      tmpVector.project(this.camera);
      if (tmpVector.z > 1) continue;
      const sx = ((tmpVector.x + 1) / 2) * this.cssWidth;
      const sy = ((1 - tmpVector.y) / 2) * this.cssHeight;
      const projected = (this.baseScale[i] * (this.cssHeight / 2)) / (Math.tan(halfFov) * depth);
      const distance = Math.hypot(sx - x, sy - y);
      if (distance > Math.max(22, projected + 10)) continue;
      // Prefer what is closest to the finger, then closest to the viewer.
      const score = distance + depth * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    }
    return best;
  }

  resize(cssWidth: number, cssHeight: number) {
    this.cssWidth = Math.max(cssWidth, 1);
    this.cssHeight = Math.max(cssHeight, 1);
    this.camera.aspect = this.cssWidth / this.cssHeight;
    this.camera.updateProjectionMatrix();
    if (this.selected === null && this.focusCategory === null) this.radiusGoal = this.fitRadius();
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.scene.traverse((object) => {
      const mesh = object as THREE.Mesh;
      mesh.geometry?.dispose();
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
    this.renderer.dispose();
  }

  // ───────────────────────── Internals ─────────────────────────

  private touch() {
    this.lastInteraction = Date.now();
  }

  /** Camera distance that fits the whole network for the current aspect ratio. */
  private fitRadius() {
    const vfov = THREE.MathUtils.degToRad(48);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (this.cssWidth / this.cssHeight));
    return (this.network.radius / Math.sin(Math.min(vfov, hfov) / 2)) * 1.02;
  }

  private centroid(filter: (i: number) => boolean) {
    const c = new THREE.Vector3();
    let n = 0;
    for (let i = 0; i < this.network.nodes.length; i++) {
      if (!filter(i)) continue;
      c.x += this.network.positions[i * 3];
      c.y += this.network.positions[i * 3 + 1];
      c.z += this.network.positions[i * 3 + 2];
      n++;
    }
    return n ? c.divideScalar(n) : c;
  }

  private isFocused(i: number) {
    if (this.selected !== null) return i === this.selected || this.neighborSet.has(i);
    if (this.focusCategory !== null) return this.network.nodes[i].categoryId === this.focusCategory;
    return true;
  }

  private applyColors() {
    const { colors, network } = this;
    const background = new THREE.Color(colors.background);
    const accent = new THREE.Color(colors.accent);
    const edgeTone = new THREE.Color(colors.edge);
    const dark = colors.scheme === 'dark';

    this.scene.background = background;
    this.scene.fog = new THREE.Fog(background, 1, 2);
    this.ambient.intensity = dark ? 0.7 : 1.55;
    this.keyLight.intensity = dark ? 1.5 : 1.25;

    this.dimAmount = dark ? 0.88 : 0.93;
    for (let i = 0; i < network.nodes.length; i++) {
      tmpColor.set(colors.tints[network.nodes[i].categoryId] ?? colors.edge);
      if (i === this.selected) tmpColor.copy(accent);
      this.baseColors.set([tmpColor.r, tmpColor.g, tmpColor.b], i * 3);
      this.mixTarget[i] = this.isFocused(i) ? 1 : 0;
    }
    this.paintNodes(true);

    const nodeColor = new THREE.Color();
    network.edges.forEach((edge, e) => {
      const visible =
        this.selected === null &&
        (this.focusCategory === null ||
          (network.nodes[edge.source].categoryId === this.focusCategory &&
            network.nodes[edge.target].categoryId === this.focusCategory));
      [edge.source, edge.target].forEach((node, end) => {
        nodeColor.set(colors.tints[network.nodes[node].categoryId] ?? colors.edge).lerp(edgeTone, 0.45);
        if (!visible) nodeColor.lerp(background, 0.8);
        this.edgeColors.set([nodeColor.r, nodeColor.g, nodeColor.b], e * 6 + end * 3);
      });
    });
    (this.edges.geometry.getAttribute('color') as THREE.BufferAttribute).needsUpdate = true;
    (this.edges.material as THREE.LineBasicMaterial).opacity = dark ? 0.45 : 0.42;

    (this.halo.material as THREE.MeshBasicMaterial).color.copy(accent);
    (this.highlight.material as THREE.LineBasicMaterial).color.copy(accent);
  }

  /** Eases every node toward its target emphasis and repaints while it changes. */
  private paintNodes(force = false) {
    let changed = force;
    for (let i = 0; i < this.mix.length; i++) {
      const delta = this.mixTarget[i] - this.mix[i];
      if (delta === 0) continue;
      this.mix[i] = Math.abs(delta) < 0.003 ? this.mixTarget[i] : this.mix[i] + delta * 0.14;
      changed = true;
    }
    if (!changed) return;
    const background = tmpBackground.set(this.colors.background);
    for (let i = 0; i < this.mix.length; i++) {
      tmpColor.setRGB(this.baseColors[i * 3], this.baseColors[i * 3 + 1], this.baseColors[i * 3 + 2]);
      tmpColor.lerp(background, this.dimAmount * (1 - this.mix[i]));
      this.nodesMesh.setColorAt(i, tmpColor);
    }
    if (this.nodesMesh.instanceColor) this.nodesMesh.instanceColor.needsUpdate = true;
  }

  private rebuildHighlight() {
    const geometry = this.highlight.geometry;
    if (this.selected === null) {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      this.halo.visible = false;
      return;
    }
    const pairs = this.network.neighbors[this.selected];
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3));
    this.halo.visible = true;
  }

  private updatePositions(time: number) {
    const { network, live, drift, phases } = this;
    const amplitude = 0.07;
    for (let i = 0; i < network.nodes.length; i++) {
      const s = Math.sin(time * 0.45 + phases[i]) * amplitude;
      live[i * 3] = network.positions[i * 3] + drift[i * 3] * s;
      live[i * 3 + 1] = network.positions[i * 3 + 1] + drift[i * 3 + 1] * s;
      live[i * 3 + 2] = network.positions[i * 3 + 2] + drift[i * 3 + 2] * s;

      // Dimmed ideas also shrink, so the focused region reads clearly.
      let scale = this.baseScale[i] * (0.55 + 0.45 * this.mix[i]);
      if (i === this.selected) scale *= 1.25 + Math.sin(time * 2.2) * 0.06;
      else if (this.neighborSet.has(i)) scale *= 1.1;
      tmpMatrix.makeScale(scale, scale, scale);
      tmpMatrix.setPosition(live[i * 3], live[i * 3 + 1], live[i * 3 + 2]);
      this.nodesMesh.setMatrixAt(i, tmpMatrix);
    }
    this.nodesMesh.instanceMatrix.needsUpdate = true;

    const edgePositions = this.edges.geometry.getAttribute('position') as THREE.BufferAttribute;
    const array = edgePositions.array as Float32Array;
    network.edges.forEach((edge, e) => {
      array.set(live.subarray(edge.source * 3, edge.source * 3 + 3), e * 6);
      array.set(live.subarray(edge.target * 3, edge.target * 3 + 3), e * 6 + 3);
    });
    edgePositions.needsUpdate = true;

    if (this.selected !== null) {
      const sel = this.selected;
      const attribute = this.highlight.geometry.getAttribute('position') as THREE.BufferAttribute;
      const out = attribute.array as Float32Array;
      network.neighbors[sel].forEach((n, k) => {
        out.set(live.subarray(sel * 3, sel * 3 + 3), k * 6);
        out.set(live.subarray(n * 3, n * 3 + 3), k * 6 + 3);
      });
      attribute.needsUpdate = true;
      const scale = this.baseScale[sel] * 2.6;
      this.halo.scale.set(scale, scale, scale);
      this.halo.position.set(live[sel * 3], live[sel * 3 + 1], live[sel * 3 + 2]);
    }
  }

  private updateCamera() {
    const idle = Date.now() - this.lastInteraction > 3500;
    if (!this.dragging) {
      // Inertia after a swipe, then a very slow idle rotation.
      this.theta += this.velTheta;
      this.phi = clamp(this.phi + this.velPhi, 0.15, Math.PI - 0.15);
      this.velTheta *= 0.93;
      this.velPhi *= 0.93;
      if (idle) this.theta += 0.0009;
    }
    this.radius += (this.radiusGoal - this.radius) * 0.09;
    this.target.lerp(this.targetGoal, 0.07);

    const sinPhi = Math.sin(this.phi);
    this.camera.position.set(
      this.target.x + this.radius * sinPhi * Math.sin(this.theta),
      this.target.y + this.radius * Math.cos(this.phi),
      this.target.z + this.radius * sinPhi * Math.cos(this.theta),
    );
    this.camera.lookAt(this.target);

    // Fog gives real depth: far ideas fade into the background.
    const fog = this.scene.fog as THREE.Fog;
    const distanceToCenter = this.camera.position.length();
    fog.near = Math.max(0.1, distanceToCenter - this.network.radius * 0.4);
    fog.far = distanceToCenter + this.network.radius * 1.35;
  }

  private reportTracked() {
    if (!this.onFrame || this.tracked.length === 0) return;
    const points = this.tracked.map((i) => {
      tmpVector.set(this.live[i * 3], this.live[i * 3 + 1], this.live[i * 3 + 2]).project(this.camera);
      return {
        x: ((tmpVector.x + 1) / 2) * this.cssWidth,
        y: ((1 - tmpVector.y) / 2) * this.cssHeight,
        visible: tmpVector.z < 1 && Math.abs(tmpVector.x) < 1.05 && Math.abs(tmpVector.y) < 1.05,
      };
    });
    this.onFrame(points);
  }

  private loop = () => {
    if (this.disposed) return;
    const time = (Date.now() - this.startedAt) / 1000;
    const { gl } = this;
    if (this.renderer.getSize(tmpSize).x !== gl.drawingBufferWidth || tmpSize.y !== gl.drawingBufferHeight) {
      this.renderer.setSize(gl.drawingBufferWidth, gl.drawingBufferHeight, false);
    }
    this.paintNodes();
    this.updatePositions(time);
    this.updateCamera();
    this.renderer.render(this.scene, this.camera);
    gl.endFrameEXP?.();
    this.reportTracked();
    this.frame = requestAnimationFrame(this.loop);
  };
}

const tmpSize = new THREE.Vector2();
const tmpBackground = new THREE.Color();

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Native GL contexts have no <canvas>; Three.js only needs a few members. */
function createCanvasShim(gl: GLContext): HTMLCanvasElement {
  return {
    width: gl.drawingBufferWidth,
    height: gl.drawingBufferHeight,
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    clientWidth: gl.drawingBufferWidth,
    clientHeight: gl.drawingBufferHeight,
    getContext: () => gl,
  } as unknown as HTMLCanvasElement;
}
