import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/theme';

/**
 * Minimal line-icon set drawn for the app (24×24 grid, rounded caps).
 * Kept in-house so the visual language stays consistent and no icon
 * font has to be bundled.
 */
const icons = {
  folder: (
    <Path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
  ),
  folderPlus: (
    <>
      <Path d="M3.5 7.5a2 2 0 0 1 2-2h3.6l2 2h7.4a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" />
      <Path d="M12 10.5v5M9.5 13h5" />
    </>
  ),
  list: <Path d="M8.5 7h11M8.5 12h11M8.5 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01" />,
  grid: (
    <>
      <Rect x="4" y="4" width="6.5" height="6.5" rx="1.6" />
      <Rect x="13.5" y="4" width="6.5" height="6.5" rx="1.6" />
      <Rect x="4" y="13.5" width="6.5" height="6.5" rx="1.6" />
      <Rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.6" />
    </>
  ),
  sort: <Path d="M7 5v14M4 16l3 3 3-3M17 19V5M14 8l3-3 3 3" />,
  plus: <Path d="M12 5v14M5 12h14" />,
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  chevronRight: <Path d="M10 6l6 6-6 6" />,
  chevronLeft: <Path d="M14 6l-6 6 6 6" />,
  chevronDown: <Path d="M6 10l6 6 6-6" />,
  arrowUp: <Path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <Path d="M12 5v14M6 13l6 6 6-6" />,
  mic: (
    <>
      <Rect x="9" y="3.5" width="6" height="11" rx="3" />
      <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5" />
    </>
  ),
  keyboard: (
    <>
      <Rect x="3" y="6" width="18" height="12" rx="2.5" />
      <Path d="M7 10h.01M10.3 10h.01M13.7 10h.01M17 10h.01M7.5 14h9" />
    </>
  ),
  stop: <Rect x="7" y="7" width="10" height="10" rx="2.2" />,
  note: (
    <>
      <Path d="M7 3.5h7l4.5 4.5v10.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2z" />
      <Path d="M13.5 3.5V8h5M8.5 13h7M8.5 16.5h4.5" />
    </>
  ),
  links: (
    <>
      <Circle cx="6" cy="7" r="2.3" />
      <Circle cx="18" cy="6" r="2.3" />
      <Circle cx="12" cy="17.5" r="2.3" />
      <Path d="M8.2 7.7l7.6-1.3M7.2 9l3.6 6.5M16.8 8.1l-3.6 7.4" />
    </>
  ),
  sparkle: (
    <Path d="M12 3.5c.6 4.4 2.6 6.4 7 7-4.4.6-6.4 2.6-7 7-.6-4.4-2.6-6.4-7-7 4.4-.6 6.4-2.6 7-7zM18.5 16.5c.2 1.4.8 2 2.2 2.2-1.4.2-2 .8-2.2 2.2-.2-1.4-.8-2-2.2-2.2 1.4-.2 2-.8 2.2-2.2z" />
  ),
  settings: (
    <>
      <Path d="M4 7h9M17 7h3M4 17h3M11 17h9" />
      <Circle cx="15" cy="7" r="2" />
      <Circle cx="9" cy="17" r="2" />
    </>
  ),
  history: (
    <>
      <Path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3L4.5 9" />
      <Path d="M4.5 4.5V9H9M12 8.5V12l2.5 2" />
    </>
  ),
  more: <Path d="M6 12h.01M12 12h.01M18 12h.01" />,
  compose: (
    <>
      <Path d="M12 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V12" />
      <Path d="M17.5 3.8a1.8 1.8 0 0 1 2.6 2.6L12.5 14l-3.3.8.8-3.3z" />
    </>
  ),
  sun: (
    <>
      <Circle cx="12" cy="12" r="3.8" />
      <Path d="M12 3v1.6M12 19.4V21M3 12h1.6M19.4 12H21M5.6 5.6l1.1 1.1M17.3 17.3l1.1 1.1M5.6 18.4l1.1-1.1M17.3 6.7l1.1-1.1" />
    </>
  ),
  moon: <Path d="M19.5 14.5A7.5 7.5 0 0 1 9.5 4.5a7.5 7.5 0 1 0 10 10z" />,
  auto: (
    <>
      <Circle cx="12" cy="12" r="8" />
      <Path d="M12 4a8 8 0 0 1 0 16z" />
    </>
  ),
  shield: <Path d="M12 3.5l7 2.8v5.2c0 4.3-3 7.6-7 9-4-1.4-7-4.7-7-9V6.3z" />,
  palette: (
    <>
      <Path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.3 0 2-.8 2-1.8 0-1.4-1.2-1.6-1.2-2.9 0-1 .8-1.8 1.8-1.8h2.2a3.7 3.7 0 0 0 3.7-3.7C20.5 6.6 16.7 3.5 12 3.5z" />
      <Path d="M7.5 11.5h.01M9.5 7.5h.01M14 7h.01" />
    </>
  ),
  drag: <Path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />,
  pencil: <Path d="M15.5 4.5l4 4L9 19H5v-4z" />,
  trash: <Path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5" />,
  search: (
    <>
      <Circle cx="11" cy="11" r="6.5" />
      <Path d="M16 16l4 4" />
    </>
  ),
  share: <Path d="M12 14.5V4M8 7.5L12 3.5l4 4M7 10.5H6a1.5 1.5 0 0 0-1.5 1.5v6.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V12a1.5 1.5 0 0 0-1.5-1.5h-1" />,
  inbox: (
    <>
      <Path d="M4 13.5l2.2-7.3A1.8 1.8 0 0 1 8 5h8a1.8 1.8 0 0 1 1.8 1.2l2.2 7.3V18a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18z" />
      <Path d="M4 13.5h4.5l1.2 2h4.6l1.2-2H20" />
    </>
  ),
} as const;

export type IconName = keyof typeof icons;

type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  /** Fill closed shapes (used for the "stop" glyph). */
  filled?: boolean;
};

export function Icon({ name, size = 22, color, strokeWidth = 1.6, filled = false }: IconProps) {
  const theme = useTheme();
  const stroke = color ?? theme.colors.text;
  // Dot-style glyphs need a thicker stroke to read as dots.
  const isDotted = name === 'more' || name === 'drag';
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? stroke : 'none'}
      stroke={stroke}
      strokeWidth={isDotted ? strokeWidth * 1.9 : strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {icons[name]}
    </Svg>
  );
}
