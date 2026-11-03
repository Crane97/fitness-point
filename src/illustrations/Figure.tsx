import type { ReactElement, ReactNode } from 'react';
import { G, Line, Polygon } from 'react-native-svg';

import type { MuscleGroup } from '@/domain/types';
import { colors, illustration } from '@/theme';

import { headSquare, muscleBands, torsoQuad, type Joints, type Vec } from './skeleton';

const FIG = colors.text;
const pts = (ps: Vec[]) => ps.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ');

function Bone({ a, b, opacity = 1 }: { a: Vec; b: Vec; opacity?: number }): ReactElement {
  return (
    <Line
      x1={a[0]}
      y1={a[1]}
      x2={b[0]}
      y2={b[1]}
      stroke={FIG}
      strokeOpacity={opacity}
      strokeWidth={illustration.stroke}
      strokeLinecap="square"
    />
  );
}

function Limb({ points, opacity }: { points: Vec[]; opacity?: number }): ReactElement {
  return (
    <G>
      {points.slice(1).map((p, i) => (
        <Bone key={i} a={points[i]!} b={p} opacity={opacity} />
      ))}
    </G>
  );
}

function Block({ points, ghost }: { points: Vec[]; ghost: boolean }): ReactElement {
  return (
    <Polygon
      points={pts(points)}
      stroke={FIG}
      strokeWidth={illustration.stroke}
      strokeLinejoin="miter"
      fill={ghost ? 'none' : colors.bg}
    />
  );
}

export interface FigureProps {
  j: Joints;
  primary?: MuscleGroup;
  secondary?: readonly MuscleGroup[];
  ghost?: boolean;
  /** Equipment held by the figure, drawn above it. */
  hold?: ReactNode;
}

/** A single body pose. Ghost figures (end position) are drawn faint and without muscles. */
export function Figure({
  j,
  primary,
  secondary = [],
  ghost = false,
  hold,
}: FigureProps): ReactElement {
  const farOpacity = j.view === 'front' ? 1 : 0.42;
  const bands = ghost
    ? []
    : [
        ...secondary.flatMap((m) => muscleBands(j, m).map((b) => ({ ...b, o: 0.45 }))),
        ...(primary ? muscleBands(j, primary).map((b) => ({ ...b, o: 1 })) : []),
      ];

  const body = (
    <G>
      <Limb points={[j.hip2, j.knee2, j.ankle2, j.toe2]} opacity={farOpacity} />
      <Limb points={[j.shoulder2, j.elbow2, j.wrist2]} opacity={farOpacity} />
      <Bone a={j.neck} b={j.head} />
      <Block points={torsoQuad(j)} ghost={ghost} />
      <Limb points={[j.hip1, j.knee, j.ankle, j.toe]} />
      {bands.map((b, i) => (
        <Line
          key={`m${i}`}
          x1={b.a[0]}
          y1={b.a[1]}
          x2={b.b[0]}
          y2={b.b[1]}
          stroke={colors.accent}
          strokeOpacity={b.o}
          strokeWidth={b.width}
          strokeLinecap="butt"
        />
      ))}
      <Block points={headSquare(j)} ghost={ghost} />
      <Limb points={[j.shoulder, j.elbow, j.wrist]} />
      {hold}
    </G>
  );

  return ghost ? <G opacity={0.24}>{body}</G> : body;
}
