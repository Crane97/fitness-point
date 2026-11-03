/** Geometric equipment primitives shared by every illustration (square, no curves). */
import type { ReactElement } from 'react';
import { G, Line, Rect } from 'react-native-svg';

import { colors } from '@/theme';

import type { Vec } from './skeleton';

export const GEAR = colors.textSecondary;
export const FLOOR_Y = 106;

const W = 2;

export function Floor({ from = 8, to = 112 }: { from?: number; to?: number }): ReactElement {
  return <Line x1={from} y1={FLOOR_Y} x2={to} y2={FLOOR_Y} stroke={GEAR} strokeWidth={W} />;
}

export function Seg({ a, b, w = W }: { a: Vec; b: Vec; w?: number }): ReactElement {
  return (
    <Line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke={GEAR}
      strokeWidth={w}
      strokeLinecap="square"
    />
  );
}

/** Barbell seen end-on (profile view): a square plate with a hub. */
export function Plate({ at, size = 15 }: { at: Vec; size?: number }): ReactElement {
  const h = size / 2;
  return (
    <G>
      <Rect
        x={at[0] - h}
        y={at[1] - h}
        width={size}
        height={size}
        stroke={GEAR}
        strokeWidth={W}
        fill={colors.bg}
      />
      <Rect x={at[0] - 2} y={at[1] - 2} width={4} height={4} fill={GEAR} />
    </G>
  );
}

/** Dumbbell seen end-on. */
export function Dumbbell({ at }: { at: Vec }): ReactElement {
  return (
    <Rect
      x={at[0] - 4}
      y={at[1] - 4}
      width={8}
      height={8}
      stroke={GEAR}
      strokeWidth={W}
      fill={colors.bg}
    />
  );
}

/** Barbell seen from the front: bar plus two plates. */
export function BarFront({ y, x1, x2 }: { y: number; x1: number; x2: number }): ReactElement {
  return (
    <G>
      <Line x1={x1} y1={y} x2={x2} y2={y} stroke={GEAR} strokeWidth={W} />
      <Rect
        x={x1 + 1}
        y={y - 7}
        width={5}
        height={14}
        stroke={GEAR}
        strokeWidth={W}
        fill={colors.bg}
      />
      <Rect
        x={x2 - 6}
        y={y - 7}
        width={5}
        height={14}
        stroke={GEAR}
        strokeWidth={W}
        fill={colors.bg}
      />
    </G>
  );
}

/** Dumbbell seen from the front. */
export function DumbbellFront({ at }: { at: Vec }): ReactElement {
  return (
    <Rect
      x={at[0] - 5}
      y={at[1] - 3}
      width={10}
      height={6}
      stroke={GEAR}
      strokeWidth={W}
      fill={colors.bg}
    />
  );
}

/** Flat bench: pad + two legs to the floor. */
export function Bench({ x1, x2, y }: { x1: number; x2: number; y: number }): ReactElement {
  return (
    <G>
      <Rect
        x={x1}
        y={y}
        width={x2 - x1}
        height={4}
        stroke={GEAR}
        strokeWidth={W}
        fill={colors.bg}
      />
      <Seg a={[x1 + 5, y + 4]} b={[x1 + 5, FLOOR_Y]} />
      <Seg a={[x2 - 5, y + 4]} b={[x2 - 5, FLOOR_Y]} />
    </G>
  );
}

export function Pulley({ at }: { at: Vec }): ReactElement {
  return <Rect x={at[0] - 3} y={at[1] - 3} width={6} height={6} fill={GEAR} />;
}

export function Cable({ from, to }: { from: Vec; to: Vec }): ReactElement {
  return <Line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke={GEAR} strokeWidth={1.25} />;
}

/** Vertical machine column. */
export function Column({ x, top = 6 }: { x: number; top?: number }): ReactElement {
  return <Seg a={[x, top]} b={[x, FLOOR_Y]} w={3} />;
}

/** Thick pad (seat back, Scott pad, knee pad...). */
export function Pad({ a, b }: { a: Vec; b: Vec }): ReactElement {
  return <Seg a={a} b={b} w={4} />;
}

export function Block({
  x,
  y,
  w,
  h,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
}): ReactElement {
  return <Rect x={x} y={y} width={w} height={h} stroke={GEAR} strokeWidth={W} fill={colors.bg} />;
}
