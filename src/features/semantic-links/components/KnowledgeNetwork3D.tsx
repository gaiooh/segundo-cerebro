import { GLView, type ExpoWebGLRenderingContext } from 'expo-gl';
import { useEffect, useMemo, useRef, useState, type ComponentRef } from 'react';
import { Animated, PanResponder, Platform, StyleSheet, View } from 'react-native';

import { Text } from '@/components';
import { useTheme } from '@/theme';

import { NetworkScene, type SceneColors, type ScreenPoint } from '../scene/NetworkScene';
import type { KnowledgeNetwork } from '../types';

type KnowledgeNetwork3DProps = {
  network: KnowledgeNetwork;
  focusCategory: string | null;
  selected: number | null;
  onSelect: (index: number | null) => void;
  /** Incrementing this value recenters the camera. */
  resetSignal: number;
};

const LABEL_SLOTS = 7;
const LABEL_WIDTH = 170;

/**
 * Interactive 3D view of the knowledge network.
 * Drag to rotate (with inertia), pinch or scroll to zoom, tap an idea to focus it.
 */
export function KnowledgeNetwork3D({ network, focusCategory, selected, onSelect, resetSignal }: KnowledgeNetwork3DProps) {
  const theme = useTheme();
  const sceneRef = useRef<NetworkScene | null>(null);
  const containerRef = useRef<ComponentRef<typeof View>>(null);
  const size = useRef({ width: 1, height: 1 });
  const [ready, setReady] = useState(false);

  const sceneColors = useMemo<SceneColors>(
    () => ({
      background: theme.colors.background,
      accent: theme.colors.accent,
      edge: theme.colors.textTertiary,
      scheme: theme.scheme,
      tints: Object.fromEntries(network.categories.map((c) => [c.id, theme.tint(c.tint).dot])),
    }),
    [theme, network],
  );
  const colorsRef = useRef(sceneColors);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    colorsRef.current = sceneColors;
    onSelectRef.current = onSelect;
  });

  // Floating labels: selected idea + a few neighbors, positioned every frame
  // through Animated values (no React re-render per frame).
  const [slots] = useState(() =>
    Array.from({ length: LABEL_SLOTS }, () => ({
      x: new Animated.Value(-1000),
      y: new Animated.Value(-1000),
      opacity: new Animated.Value(0),
    })),
  );
  const labelNodes = useMemo(
    () => (selected === null ? [] : [selected, ...network.neighbors[selected].slice(0, LABEL_SLOTS - 1)]),
    [selected, network],
  );

  const onContextCreate = (gl: ExpoWebGLRenderingContext) => {
    if (Platform.OS !== 'web') patchNativeContext(gl);
    const scene = new NetworkScene(gl, size.current.width, size.current.height, network, colorsRef.current);
    sceneRef.current = scene;
    setReady(true);
  };

  useEffect(() => () => sceneRef.current?.dispose(), []);

  useEffect(() => {
    sceneRef.current?.setColors(sceneColors);
  }, [sceneColors, ready]);

  useEffect(() => {
    sceneRef.current?.setFilter(focusCategory);
  }, [focusCategory, ready]);

  useEffect(() => {
    sceneRef.current?.select(selected);
  }, [selected, ready]);

  useEffect(() => {
    if (resetSignal > 0) sceneRef.current?.resetView();
  }, [resetSignal]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;
    scene.track(labelNodes);
    scene.onFrame = (points: ScreenPoint[]) => {
      slots.forEach((slot, i) => {
        const point = points[i];
        if (!point || !point.visible) {
          slot.opacity.setValue(0);
          return;
        }
        slot.x.setValue(point.x - LABEL_WIDTH / 2);
        slot.y.setValue(point.y + (i === 0 ? 16 : 10));
        slot.opacity.setValue(i === 0 ? 1 : 0.85);
      });
    };
    if (labelNodes.length === 0) slots.forEach((slot) => slot.opacity.setValue(0));
  }, [labelNodes, slots, ready]);

  // Mouse wheel / trackpad zoom on web.
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const element = containerRef.current as unknown as HTMLElement | null;
    if (!element?.addEventListener) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      sceneRef.current?.zoomBy(Math.exp(event.deltaY * 0.0012));
    };
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, []);

  // PanResponder handlers only run on touch events, never during render; the
  // React Compiler lint cannot know that, so its render-purity rules are
  // disabled for this documented React Native pattern.
  /* eslint-disable react-hooks/refs, react-hooks/purity, react-hooks/immutability */
  const responder = useMemo(() => {
    let start = { x: 0, y: 0, time: 0 };
    let last = { dx: 0, dy: 0 };
    let pinch: number | null = null;
    let moved = false;
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        start = { x: event.nativeEvent.locationX, y: event.nativeEvent.locationY, time: Date.now() };
        last = { dx: 0, dy: 0 };
        pinch = null;
        moved = false;
        sceneRef.current?.beginDrag();
      },
      onPanResponderMove: (event, gesture) => {
        const touches = event.nativeEvent.touches;
        if (touches && touches.length >= 2) {
          const distance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
          if (pinch !== null && distance > 0) sceneRef.current?.zoomBy(pinch / distance);
          pinch = distance;
          moved = true;
          last = { dx: gesture.dx, dy: gesture.dy };
          return;
        }
        pinch = null;
        sceneRef.current?.rotateBy(gesture.dx - last.dx, gesture.dy - last.dy);
        last = { dx: gesture.dx, dy: gesture.dy };
        if (Math.abs(gesture.dx) + Math.abs(gesture.dy) > 6) moved = true;
      },
      onPanResponderRelease: () => {
        sceneRef.current?.endDrag();
        if (!moved && Date.now() - start.time < 350) {
          const index = sceneRef.current?.pick(start.x, start.y) ?? null;
          onSelectRef.current(index);
        }
      },
      onPanResponderTerminate: () => sceneRef.current?.endDrag(),
    });
  }, []);
  /* eslint-enable react-hooks/refs, react-hooks/purity, react-hooks/immutability */

  return (
    <View
      ref={containerRef}
      style={styles.fill}
      onLayout={(e) => {
        size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height };
        sceneRef.current?.resize(size.current.width, size.current.height);
      }}>
      <GLView style={StyleSheet.absoluteFill} onContextCreate={onContextCreate} />
      <View
        style={StyleSheet.absoluteFill}
        {...responder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Rede de ideias em 3D. Arraste para girar, use dois dedos para aproximar e toque em uma ideia."
      />
      {slots.map((slot, i) => {
        const node = labelNodes[i] !== undefined ? network.nodes[labelNodes[i]] : undefined;
        if (!node) return null;
        const primary = i === 0;
        return (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={[
              styles.label,
              { opacity: slot.opacity, transform: [{ translateX: slot.x }, { translateY: slot.y }] },
            ]}>
            <View
              style={[
                styles.labelPill,
                primary
                  ? { backgroundColor: theme.colors.inverse }
                  : { backgroundColor: theme.colors.background, borderColor: theme.colors.border, borderWidth: StyleSheet.hairlineWidth },
              ]}>
              <Text
                variant={primary ? 'label' : 'caption'}
                numberOfLines={1}
                style={{ color: primary ? theme.colors.onInverse : theme.colors.textSecondary }}>
                {node.label}
              </Text>
            </View>
          </Animated.View>
        );
      })}
    </View>
  );
}

/**
 * expo-gl on native implements a subset of pixelStorei; Three.js calls a few
 * unsupported parameters. Ignore those, as expo-three does.
 */
function patchNativeContext(gl: ExpoWebGLRenderingContext) {
  const pixelStorei = gl.pixelStorei.bind(gl);
  gl.pixelStorei = (parameter: number, value: number | boolean) => {
    if (parameter === gl.UNPACK_FLIP_Y_WEBGL) pixelStorei(parameter, value as number);
  };
}

const styles = StyleSheet.create({
  fill: { flex: 1, overflow: 'hidden' },
  label: { position: 'absolute', left: 0, top: 0, width: LABEL_WIDTH, alignItems: 'center' },
  labelPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, maxWidth: LABEL_WIDTH },
});
