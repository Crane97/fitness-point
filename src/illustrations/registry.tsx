/**
 * Illustration registry: illustrationKey → React component.
 * Built-in keys equal the exercise id; custom exercises use `generic-<muscle>`.
 */
import { memo, type ComponentType, type ReactElement } from 'react';
import Svg, { Rect } from 'react-native-svg';

import { MUSCLE_GROUPS, type MuscleGroup } from '@/domain/types';
import { colors, illustration } from '@/theme';

import type { Art } from './art';
import { Figure } from './Figure';
import { Floor } from './gear';
import { GENERIC, LOWER } from './poses/lower';
import { UPPER } from './poses/upper';
import { solve } from './skeleton';

export interface IllustrationProps {
  size?: number;
  primary?: MuscleGroup;
  secondary?: readonly MuscleGroup[];
  /** Background of the square (pure black by default). */
  background?: string;
}

const ARTS: Record<string, Art> = { ...UPPER, ...LOWER };
for (const m of MUSCLE_GROUPS) ARTS[`generic-${m}`] = GENERIC;

/** Renders one Art definition at any size; every drawing shares viewBox and stroke. */
export const ArtSvg = memo(function ArtSvg({
  art,
  size = 120,
  primary,
  secondary,
  background = colors.bg,
}: IllustrationProps & { art: Art }): ReactElement {
  const s = solve(art.start);
  const e = art.end ? solve(art.end) : null;
  return (
    <Svg width={size} height={size} viewBox={illustration.viewBox}>
      <Rect width={120} height={120} fill={background} />
      {art.floor === false ? null : <Floor />}
      {art.scene?.(s)}
      {e ? <Figure j={e} ghost hold={art.hold?.(e)} /> : null}
      <Figure j={s} primary={primary} secondary={secondary} hold={art.hold?.(s)} />
    </Svg>
  );
});

function bind(art: Art): ComponentType<IllustrationProps> {
  const Bound = (props: IllustrationProps) => <ArtSvg art={art} {...props} />;
  return Bound;
}

export const ILLUSTRATIONS: Readonly<Record<string, ComponentType<IllustrationProps>>> =
  Object.fromEntries(Object.entries(ARTS).map(([k, art]) => [k, bind(art)]));

export function hasIllustration(key: string): boolean {
  return key in ARTS;
}

export function artFor(key: string, primary: MuscleGroup): Art {
  return ARTS[key] ?? ARTS[`generic-${primary}`]!;
}

export function illustrationFor(
  key: string,
  primary: MuscleGroup,
): ComponentType<IllustrationProps> {
  return ILLUSTRATIONS[key] ?? ILLUSTRATIONS[`generic-${primary}`]!;
}
