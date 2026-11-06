import { useMemo } from 'react';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';

import { fontFamilies, useTheme } from '@/theme';

import { neighborsOf } from '../layout';
import type { IdeaGraph, PositionedNode } from '../types';

type GraphViewProps = {
  graph: IdeaGraph;
  nodes: PositionedNode[];
  width: number;
  height: number;
  /** Category highlighted by the filter, or null for all. */
  focusCategory: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
};

const truncate = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value);

/** Renders the idea graph: soft category halos, quiet edges, tinted nodes. */
export function GraphView({ graph, nodes, width, height, focusCategory, selectedId, onSelect }: GraphViewProps) {
  const theme = useTheme();
  const { colors } = theme;
  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const neighbors = useMemo(() => (selectedId ? neighborsOf(graph, selectedId) : new Set<string>()), [graph, selectedId]);
  const tintOf = useMemo(() => new Map(graph.categories.map((c) => [c.id, theme.tint(c.tint)])), [graph, theme]);

  const clusters = useMemo(
    () =>
      graph.categories
        .map((category) => {
          const members = nodes.filter((n) => n.categoryId === category.id);
          if (members.length === 0) return null;
          const x = members.reduce((s, n) => s + n.x, 0) / members.length;
          const y = members.reduce((s, n) => s + n.y, 0) / members.length;
          // Mean spread keeps halos compact; outliers simply sit on the edge.
          const mean = members.reduce((sum, n) => sum + Math.hypot(n.x - x, n.y - y), 0) / members.length;
          const r = Math.min(mean * 1.35 + 22, Math.min(width, height) * 0.3);
          return { category, x, y, r };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null),
    [graph, nodes, width, height],
  );

  const isDimmed = (node: PositionedNode) => {
    if (selectedId) return node.id !== selectedId && !neighbors.has(node.id);
    if (focusCategory) return node.categoryId !== focusCategory;
    return false;
  };

  const radiusOf = (node: PositionedNode) => 4.5 + Math.min(node.degree, 5) * 1.4;
  const haloOpacity = theme.scheme === 'dark' ? 0.7 : 0.75;

  return (
    <Svg width={width} height={height}>
      {/* Background catcher: tapping empty space clears the selection. */}
      <Rect x={0} y={0} width={width} height={height} fill="transparent" onPress={() => onSelect(null)} />

      {clusters.map(({ category, x, y, r }) => {
        const tint = tintOf.get(category.id)!;
        const active = !focusCategory || focusCategory === category.id;
        const opacity = selectedId ? 0.35 : active ? haloOpacity : 0.25;
        return (
          <G key={category.id} opacity={opacity}>
            <Circle cx={x} cy={y} r={r} fill={tint.fill} />
            <SvgText
              x={Math.min(Math.max(x, 44), width - 44)}
              y={Math.max(14, y - r - 6)}
              fill={tint.ink}
              fontSize={11}
              fontFamily={fontFamilies.bodyMedium}
              textAnchor="middle"
              letterSpacing={0.6}>
              {category.name.toUpperCase()}
            </SvgText>
          </G>
        );
      })}

      {graph.edges.map((edge) => {
        const a = byId.get(edge.source);
        const b = byId.get(edge.target);
        if (!a || !b) return null;
        const touchesSelected = selectedId !== null && (edge.source === selectedId || edge.target === selectedId);
        const inFocus = !selectedId && focusCategory !== null && a.categoryId === focusCategory && b.categoryId === focusCategory;
        const highlighted = touchesSelected || inFocus;
        const faded = (selectedId !== null && !touchesSelected) || (focusCategory !== null && !selectedId && !inFocus);
        return (
          <Line
            key={`${edge.source}-${edge.target}`}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={highlighted ? colors.accent : colors.textTertiary}
            strokeWidth={highlighted ? 1.6 : 0.6 + edge.strength}
            strokeOpacity={highlighted ? 0.9 : faded ? 0.12 : 0.22 + edge.strength * 0.3}
            strokeLinecap="round"
          />
        );
      })}

      {nodes.map((node) => {
        const tint = tintOf.get(node.categoryId)!;
        const r = radiusOf(node);
        const selected = node.id === selectedId;
        const dimmed = isDimmed(node);
        const showLabel = selected || neighbors.has(node.id);
        const labelAbove = node.y > height - 28;
        return (
          <G key={node.id} opacity={dimmed ? 0.25 : 1} onPress={() => onSelect(selected ? null : node.id)}>
            {/* Generous invisible hit area for fingers. */}
            <Circle cx={node.x} cy={node.y} r={Math.max(r + 10, 20)} fill="transparent" />
            {selected ? <Circle cx={node.x} cy={node.y} r={r + 6} fill={colors.accent} opacity={0.18} /> : null}
            <Circle
              cx={node.x}
              cy={node.y}
              r={r}
              fill={selected ? colors.accent : tint.dot}
              stroke={colors.background}
              strokeWidth={2}
            />
            {showLabel ? (
              <SvgText
                x={Math.min(Math.max(node.x, 64), width - 64)}
                y={labelAbove ? node.y - r - 7 : node.y + r + 14}
                fill={selected ? colors.text : colors.textSecondary}
                fontSize={selected ? 12 : 11}
                fontFamily={selected ? fontFamilies.bodySemibold : fontFamilies.body}
                textAnchor="middle">
                {truncate(node.label, 20)}
              </SvgText>
            ) : null}
          </G>
        );
      })}
    </Svg>
  );
}
