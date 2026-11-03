/**
 * Pose geometry for the exercise illustrations.
 *
 * Every figure is built by forward kinematics from absolute segment angles (degrees,
 * SVG convention: 0 = right, 90 = down, -90 = up) and fixed limb lengths, so all
 * illustrations share proportions, viewBox (120×120) and stroke width.
 */
import type { MuscleGroup } from '@/domain/types';

export type Vec = readonly [number, number];

export interface Pose {
  /** 'side' = profile (default). 'front' = seen from the front/back/top, symmetric limbs. */
  view?: 'side' | 'front';
  /** Profile direction the chest faces. Used to place muscles on the front/back of a limb. */
  facing?: 1 | -1;
  hip: Vec;
  /** Angle hip → neck. */
  torso: number;
  /** Near arm [upper, forearm]. */
  arm: readonly [number, number];
  /** Far arm (defaults to the near arm). */
  arm2?: readonly [number, number];
  leg: readonly [number, number];
  leg2?: readonly [number, number];
  foot?: number;
  foot2?: number;
}

export interface Joints {
  view: 'side' | 'front';
  facing: 1 | -1;
  torsoAngle: number;
  hip: Vec;
  neck: Vec;
  head: Vec;
  shoulder: Vec;
  shoulder2: Vec;
  elbow: Vec;
  wrist: Vec;
  elbow2: Vec;
  wrist2: Vec;
  hip1: Vec;
  hip2: Vec;
  knee: Vec;
  ankle: Vec;
  toe: Vec;
  knee2: Vec;
  ankle2: Vec;
  toe2: Vec;
}

export const LIMB = {
  torso: 30,
  shoulderDrop: 3,
  head: 9.5,
  headSize: 11,
  upperArm: 16,
  forearm: 15,
  thigh: 21,
  shin: 20,
  foot: 6,
  shoulderSpread: 9,
  hipSpread: 5,
} as const;

const rad = (deg: number) => (deg * Math.PI) / 180;
export const dir = (deg: number): Vec => [Math.cos(rad(deg)), Math.sin(rad(deg))];
export const add = (a: Vec, b: Vec, k = 1): Vec => [a[0] + b[0] * k, a[1] + b[1] * k];
export const lerp = (a: Vec, b: Vec, t: number): Vec => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

export function solve(pose: Pose): Joints {
  const view = pose.view ?? 'side';
  const facing = pose.facing ?? 1;
  const t = dir(pose.torso);
  const neck = add(pose.hip, t, LIMB.torso);
  const head = add(neck, t, LIMB.head);
  const shoulderCenter = add(pose.hip, t, LIMB.torso - LIMB.shoulderDrop);
  const perp = dir(pose.torso + 90);
  const sSpread = view === 'front' ? LIMB.shoulderSpread : 0;
  const hSpread = view === 'front' ? LIMB.hipSpread : 0;
  const shoulder = add(shoulderCenter, perp, sSpread);
  const shoulder2 = add(shoulderCenter, perp, -sSpread);
  const hip1 = add(pose.hip, perp, hSpread);
  const hip2 = add(pose.hip, perp, -hSpread);

  const [u1, f1] = pose.arm;
  const [u2, f2] = pose.arm2 ?? pose.arm;
  const elbow = add(shoulder, dir(u1), LIMB.upperArm);
  const wrist = add(elbow, dir(f1), LIMB.forearm);
  const elbow2 = add(shoulder2, dir(u2), LIMB.upperArm);
  const wrist2 = add(elbow2, dir(f2), LIMB.forearm);

  const [t1, s1] = pose.leg;
  const [t2, s2] = pose.leg2 ?? pose.leg;
  const knee = add(hip1, dir(t1), LIMB.thigh);
  const ankle = add(knee, dir(s1), LIMB.shin);
  const knee2 = add(hip2, dir(t2), LIMB.thigh);
  const ankle2 = add(knee2, dir(s2), LIMB.shin);

  const footLen = view === 'front' ? LIMB.foot - 2 : LIMB.foot;
  const defaultFoot = (shin: number, near: boolean) =>
    view === 'front' ? (near ? 0 : 180) : shin - 90 * facing;
  const toe = add(ankle, dir(pose.foot ?? defaultFoot(s1, true)), footLen);
  const toe2 = add(ankle2, dir(pose.foot2 ?? defaultFoot(s2, false)), footLen);

  return {
    view,
    facing,
    torsoAngle: pose.torso,
    hip: pose.hip,
    neck,
    head,
    shoulder,
    shoulder2,
    elbow,
    wrist,
    elbow2,
    wrist2,
    hip1,
    hip2,
    knee,
    ankle,
    toe,
    knee2,
    ankle2,
    toe2,
  };
}

/** A highlighted muscle: a straight band along a bone, optionally offset to its front/back. */
export interface Band {
  a: Vec;
  b: Vec;
  width: number;
}

const LIMB_OFFSET = 3.6;
const TORSO_OFFSET = 2;
const TORSO_HALF = { neck: 5.5, hip: 4.5 } as const;

function normal(a: Vec, b: Vec): Vec {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  return [dy / len, -dx / len];
}

function band(
  a: Vec,
  b: Vec,
  t0: number,
  t1: number,
  side: -1 | 0 | 1,
  facing: 1 | -1,
  opts: { off?: number; width?: number } = {},
): Band {
  const n = normal(a, b);
  const k = side * facing * (opts.off ?? LIMB_OFFSET);
  return { a: add(lerp(a, b, t0), n, k), b: add(lerp(a, b, t1), n, k), width: opts.width ?? 5 };
}

/** Outline of the torso block (quad), so the figure reads as a solid, square body. */
export function torsoQuad(j: Joints): Vec[] {
  if (j.view === 'front') return [j.shoulder2, j.shoulder, j.hip1, j.hip2];
  const n = normal(j.neck, j.hip);
  return [
    add(j.neck, n, TORSO_HALF.neck),
    add(j.hip, n, TORSO_HALF.hip),
    add(j.hip, n, -TORSO_HALF.hip),
    add(j.neck, n, -TORSO_HALF.neck),
  ];
}

/** Bands for one muscle group on a solved figure. */
export function muscleBands(j: Joints, m: MuscleGroup): Band[] {
  const f = j.facing;
  const inTorso = { off: TORSO_OFFSET, width: 4 };
  if (j.view === 'front') {
    const down = dir(j.torsoAngle + 180);
    const up = dir(j.torsoAngle);
    switch (m) {
      case 'pecho':
        return [
          band(add(j.shoulder2, down, 6.5), add(j.shoulder, down, 6.5), 0.14, 0.86, 0, f, {
            width: 6,
          }),
        ];
      case 'espalda':
        return [
          band(
            add(lerp(j.shoulder, j.shoulder2, 0.2), down, 3),
            lerp(j.hip1, j.hip, 0.3),
            0,
            0.8,
            0,
            f,
            { width: 4 },
          ),
          band(
            add(lerp(j.shoulder2, j.shoulder, 0.2), down, 3),
            lerp(j.hip2, j.hip, 0.3),
            0,
            0.8,
            0,
            f,
            { width: 4 },
          ),
        ];
      case 'core':
        return [band(j.hip, j.neck, 0.1, 0.5, 0, f, { width: 5 })];
      case 'hombro':
        return [
          band(j.shoulder, j.elbow, 0, 0.38, 0, f, { width: 7 }),
          band(j.shoulder2, j.elbow2, 0, 0.38, 0, f, { width: 7 }),
        ];
      case 'biceps':
      case 'triceps':
        return [
          band(j.shoulder, j.elbow, 0.45, 0.95, 0, f, { width: 7 }),
          band(j.shoulder2, j.elbow2, 0.45, 0.95, 0, f, { width: 7 }),
        ];
      case 'cuadriceps':
      case 'femoral':
        return [
          band(j.hip1, j.knee, 0.15, 0.85, 0, f, { width: 7 }),
          band(j.hip2, j.knee2, 0.15, 0.85, 0, f, { width: 7 }),
        ];
      case 'gluteo':
        return [band(add(j.hip2, up, 2.5), add(j.hip1, up, 2.5), 0.05, 0.95, 0, f, { width: 4 })];
      case 'gemelo':
        return [
          band(j.knee, j.ankle, 0.1, 0.55, 0, f, { width: 7 }),
          band(j.knee2, j.ankle2, 0.1, 0.55, 0, f, { width: 7 }),
        ];
    }
  }
  switch (m) {
    case 'pecho':
      return [band(j.neck, j.hip, 0.1, 0.45, 1, f, inTorso)];
    case 'espalda':
      return [band(j.neck, j.hip, 0.08, 0.62, -1, f, inTorso)];
    case 'core':
      return [band(j.neck, j.hip, 0.55, 0.92, 1, f, inTorso)];
    case 'hombro':
      return [band(j.shoulder, j.elbow, 0, 0.4, 0, f, { width: 7 })];
    case 'biceps':
      return [band(j.shoulder, j.elbow, 0.42, 0.95, 1, f)];
    case 'triceps':
      return [band(j.shoulder, j.elbow, 0.42, 0.95, -1, f)];
    case 'cuadriceps':
      return [band(j.hip, j.knee, 0.14, 0.9, 1, f)];
    case 'femoral':
      return [band(j.hip, j.knee, 0.3, 0.9, -1, f)];
    case 'gluteo':
      return [band(j.hip, j.knee, -0.04, 0.3, -1, f)];
    case 'gemelo':
      return [band(j.knee, j.ankle, 0.1, 0.58, -1, f)];
  }
}

/** Square head, rotated with the torso, as polygon points. */
export function headSquare(j: Joints): Vec[] {
  const h = LIMB.headSize / 2;
  const u = dir(j.torsoAngle);
  const v = dir(j.torsoAngle + 90);
  return [
    add(add(j.head, u, h), v, h),
    add(add(j.head, u, h), v, -h),
    add(add(j.head, u, -h), v, -h),
    add(add(j.head, u, -h), v, h),
  ];
}
