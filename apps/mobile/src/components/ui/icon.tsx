import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { palette, size as sizes } from '@/theme/tokens';

/**
 * COVERT's own icon set: 24-unit grid, 1.8 stroke, round joins. Icons are
 * decorative; the control that contains one carries the accessible label.
 */

const paths = {
  back: <Path d="M15 5l-7 7 7 7" />,
  close: <Path d="M6 6l12 12M18 6L6 18" />,
  chevronRight: <Path d="M9.5 5.5L16 12l-6.5 6.5" />,
  chevronDown: <Path d="M5.5 9.5L12 16l6.5-6.5" />,
  arrowUpRight: <Path d="M7 17L17 7M8.5 7H17v8.5" />,
  camera: (
    <>
      <Path d="M3.5 8.5A2 2 0 015.5 6.5h2l1.6-2h5.8l1.6 2h2a2 2 0 012 2v9a2 2 0 01-2 2h-13a2 2 0 01-2-2z" />
      <Circle cx={12} cy={13} r={3.6} />
    </>
  ),
  viewfinder: (
    <Path d="M4 9V6a2 2 0 012-2h3M15 4h3a2 2 0 012 2v3M20 15v3a2 2 0 01-2 2h-3M9 20H6a2 2 0 01-2-2v-3M8 12h8" />
  ),
  upload: <Path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M4.5 14v4a2 2 0 002 2h11a2 2 0 002-2v-4" />,
  image: (
    <>
      <Rect x={3.5} y={4.5} width={17} height={15} rx={2} />
      <Circle cx={9} cy={10} r={1.6} />
      <Path d="M20.5 16l-4.5-4.5-8.5 8" />
    </>
  ),
  file: (
    <>
      <Path d="M13.5 3.5H7a2 2 0 00-2 2v13a2 2 0 002 2h10a2 2 0 002-2V9z" />
      <Path d="M13.5 3.5V9H19M9 13h6M9 16.5h4" />
    </>
  ),
  table: (
    <>
      <Rect x={3.5} y={4.5} width={17} height={15} rx={2} />
      <Path d="M3.5 9.5h17M3.5 14.5h17M9.5 9.5v10" />
    </>
  ),
  history: (
    <>
      <Path d="M4 12a8 8 0 102.4-5.7M4 4.5v3.5h3.5" />
      <Path d="M12 8v4.2l2.8 1.8" />
    </>
  ),
  settings: <Path d="M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4" />,
  play: <Path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />,
  stop: <Rect x={7} y={7} width={10} height={10} rx={1.5} fill="currentColor" />,
  previous: <Path d="M7 6v12M18 6l-8 6 8 6z" />,
  next: <Path d="M17 6v12M6 6l8 6-8 6z" />,
  speaker: <Path d="M4.5 9.5h3l4.5-4v13l-4.5-4h-3zM15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />,
  share: (
    <Path d="M12 3.5v11M8 7.5l4-4 4 4M6 11H5.5a1.5 1.5 0 00-1.5 1.5v6A1.5 1.5 0 005.5 20h13a1.5 1.5 0 001.5-1.5v-6a1.5 1.5 0 00-1.5-1.5H18" />
  ),
  copy: (
    <>
      <Rect x={8.5} y={8.5} width={11} height={11} rx={2} />
      <Path d="M15.5 8.5V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7.5a2 2 0 002 2h2.5" />
    </>
  ),
  check: <Path d="M5 12.5l4.5 4.5L19 7.5" />,
  rotate: <Path d="M19.5 12a7.5 7.5 0 11-2.2-5.3M19.5 4v4.5H15" />,
  crop: <Path d="M7 3.5V17h13.5M3.5 7H17v13.5" />,
  trash: (
    <Path d="M4.5 7h15M9.5 7V5a1.5 1.5 0 011.5-1.5h2A1.5 1.5 0 0114.5 5v2M6.5 7l1 12a1.5 1.5 0 001.5 1.4h6a1.5 1.5 0 001.5-1.4l1-12M10 11v6M14 11v6" />
  ),
  edit: <Path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16zM13.5 6.5l4 4" />,
  more: (
    <>
      <Circle cx={5.5} cy={12} r={1.4} fill="currentColor" stroke="none" />
      <Circle cx={12} cy={12} r={1.4} fill="currentColor" stroke="none" />
      <Circle cx={18.5} cy={12} r={1.4} fill="currentColor" stroke="none" />
    </>
  ),
  flash: <Path d="M13 3L5.5 13.5H12L11 21l7.5-10.5H12z" />,
  flashOff: (
    <Path d="M13 3l-2.6 3.6M8.3 9.6l-2.8 3.9H12L11 21l3.6-5M16.4 13.2l2.1-2.7H14M4 4l16 16" />
  ),
  plus: <Path d="M12 5v14M5 12h14" />,
  eye: (
    <>
      <Path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
      <Circle cx={12} cy={12} r={3} />
    </>
  ),
  eyeOff: (
    <Path d="M4 4l16 16M10 5.7A9.5 9.5 0 0112 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 01-2.6 3.4M6.6 6.9C4 8.6 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 004.4-1.1M9.9 10a3 3 0 004.1 4.1" />
  ),
  alert: (
    <>
      <Circle cx={12} cy={12} r={8.5} />
      <Path d="M12 7.5v5.5M12 16.2v.3" />
    </>
  ),
  offline: (
    <Path d="M4 4l16 16M8.5 16a5 5 0 017 0M5 12.5a10 10 0 014.3-2.4M14.5 10a10 10 0 014.5 2.5M2 9a14 14 0 014.1-2.6M12 5.5a14 14 0 0110 3.5M12 19.5v.01" />
  ),
} as const;

export type IconName = keyof typeof paths;

interface IconProps {
  name: IconName;
  color?: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({
  name,
  color = palette.ink,
  size = sizes.icon,
  strokeWidth = 1.8,
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      color={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {paths[name]}
    </Svg>
  );
}
