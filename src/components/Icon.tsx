/** Minimal square icon set (stroke icons on a 24 grid, square caps). */
import type { ReactElement } from 'react';
import Svg, { Line, Polyline, Rect } from 'react-native-svg';

import { colors } from '@/theme';

export type IconName =
  | 'back'
  | 'close'
  | 'plus'
  | 'minus'
  | 'up'
  | 'down'
  | 'copy'
  | 'trash'
  | 'check'
  | 'edit'
  | 'chevron'
  | 'search';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function Icon({
  name,
  size = 24,
  color = colors.text,
  strokeWidth = 2,
}: Props): ReactElement {
  const p = { stroke: color, strokeWidth, fill: 'none', strokeLinecap: 'square' as const };
  const shapes: Record<IconName, ReactElement> = {
    back: <Polyline points="15,5 8,12 15,19" {...p} strokeLinejoin="miter" />,
    chevron: <Polyline points="9,5 16,12 9,19" {...p} strokeLinejoin="miter" />,
    close: (
      <>
        <Line x1={6} y1={6} x2={18} y2={18} {...p} />
        <Line x1={18} y1={6} x2={6} y2={18} {...p} />
      </>
    ),
    plus: (
      <>
        <Line x1={12} y1={5} x2={12} y2={19} {...p} />
        <Line x1={5} y1={12} x2={19} y2={12} {...p} />
      </>
    ),
    minus: <Line x1={5} y1={12} x2={19} y2={12} {...p} />,
    up: <Polyline points="6,15 12,9 18,15" {...p} strokeLinejoin="miter" />,
    down: <Polyline points="6,9 12,15 18,9" {...p} strokeLinejoin="miter" />,
    copy: (
      <>
        <Rect x={8} y={8} width={11} height={11} {...p} />
        <Polyline points="5,15 5,5 15,5" {...p} strokeLinejoin="miter" />
      </>
    ),
    trash: (
      <>
        <Line x1={4} y1={7} x2={20} y2={7} {...p} />
        <Rect x={7} y={7} width={10} height={12} {...p} />
        <Line x1={10} y1={4} x2={14} y2={4} {...p} />
      </>
    ),
    check: <Polyline points="5,12 10,17 19,7" {...p} strokeLinejoin="miter" />,
    edit: (
      <>
        <Polyline points="14,6 18,10 9,19 5,19 5,15 14,6" {...p} strokeLinejoin="miter" />
      </>
    ),
    search: (
      <>
        <Rect x={5} y={5} width={10} height={10} {...p} />
        <Line x1={15} y1={15} x2={19} y2={19} {...p} />
      </>
    ),
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {shapes[name]}
    </Svg>
  );
}
