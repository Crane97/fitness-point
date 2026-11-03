/** Legs, calves and core. Coordinates in the shared 120×120 viewBox. */
import { G } from 'react-native-svg';

import type { Art } from '../art';
import { add, dir, type Joints } from '../skeleton';
import { Bench, Block, Cable, Column, Dumbbell, Pad, Plate, Pulley, Seg } from '../gear';

/** Barbell resting on the upper back, behind the neck. */
const backBar = (j: Joints) => {
  const back = dir(j.torsoAngle - 90 * j.facing);
  return <Plate at={add(j.neck, back, 5)} />;
};

/** Leg-press foot platform, perpendicular to the 45° sled. */
const platform = (j: Joints) => {
  const d = dir(45);
  return <Pad a={add(j.ankle, d, -10)} b={add(j.ankle, d, 10)} />;
};

export const LOWER: Record<string, Art> = {
  /* ---------------- Cuádriceps ---------------- */
  sentadilla: {
    start: { hip: [44, 84], torso: -55, arm: [150, -50], leg: [10, 115] },
    end: { hip: [52, 63], torso: -88, arm: [130, -60], leg: [90, 90] },
    hold: backBar,
  },
  prensa: {
    start: { hip: [50, 84], torso: -150, arm: [60, 0], leg: [-95, 9], foot: -135 },
    end: { hip: [50, 84], torso: -150, arm: [60, 0], leg: [-45, -45], foot: -135 },
    scene: () => (
      <G>
        <Pad a={[48, 88]} b={[22, 73]} />
        <Pad a={[40, 90]} b={[60, 90]} />
        <Seg a={[50, 92]} b={[50, 106]} />
        <Seg a={[74, 80]} b={[106, 48]} />
        <Seg a={[96, 58]} b={[96, 106]} />
      </G>
    ),
    hold: platform,
  },
  zancadas: {
    start: {
      hip: [52, 84],
      torso: -90,
      arm: [90, 90],
      leg: [5, 95],
      leg2: [120, 180],
      foot2: 0,
    },
    end: { hip: [52, 63], torso: -90, arm: [90, 90], leg: [90, 90] },
    hold: (j) => <Dumbbell at={j.wrist} />,
  },
  'extension-cuadriceps': {
    start: { hip: [44, 80], torso: -95, arm: [95, 20], leg: [0, -5], foot: -80 },
    end: { hip: [44, 80], torso: -95, arm: [95, 20], leg: [0, 90] },
    scene: () => (
      <G>
        <Pad a={[30, 83.5]} b={[66, 83.5]} />
        <Pad a={[36, 84]} b={[32, 50]} />
        <Seg a={[46, 86]} b={[46, 106]} />
      </G>
    ),
    hold: (j) => <Block x={j.ankle[0] - 4} y={j.ankle[1] + 2} w={8} h={6} />,
  },

  /* ---------------- Femoral ---------------- */
  'peso-muerto': {
    start: { hip: [36, 73], torso: -35, arm: [90, 90], leg: [40, 105] },
    end: { hip: [55, 63], torso: -90, arm: [90, 90], leg: [90, 90] },
    hold: (j) => <Plate at={j.wrist} />,
  },
  'peso-muerto-rumano': {
    start: { hip: [44, 64], torso: -15, arm: [90, 90], leg: [85, 95] },
    end: { hip: [48, 63], torso: -88, arm: [90, 90], leg: [88, 92] },
    hold: (j) => <Plate at={j.wrist} />,
  },
  'curl-femoral': {
    start: { hip: [70, 72], torso: 180, facing: -1, arm: [120, 180], leg: [0, -80], foot: 10 },
    end: { hip: [70, 72], torso: 180, facing: -1, arm: [120, 180], leg: [0, 0], foot: 90 },
    scene: () => <Bench x1={20} x2={96} y={75.5} />,
    hold: (j) => <Block x={j.ankle[0] - 3} y={j.ankle[1] - 3} w={6} h={6} />,
  },

  /* ---------------- Glúteo ---------------- */
  'hip-thrust': {
    start: { hip: [62, 79], torso: 180, arm: [0, -30], leg: [20, 90] },
    end: { hip: [58, 94], torso: -152, arm: [20, 0], leg: [-20, 95] },
    scene: () => <Bench x1={6} x2={38} y={82.5} />,
    hold: (j) => <Plate at={add(j.hip, [0, -1], 9)} />,
  },
  'patada-gluteo-polea': {
    start: {
      hip: [52, 63],
      torso: -70,
      arm: [10, 0],
      leg: [140, 150],
      leg2: [90, 90],
      foot: 60,
    },
    end: { hip: [52, 63], torso: -70, arm: [10, 0], leg: [95, 85], leg2: [90, 90] },
    scene: (j) => (
      <G>
        <Column x={98} />
        <Pulley at={[95, 100]} />
        <Cable from={[95, 100]} to={j.ankle} />
      </G>
    ),
  },

  /* ---------------- Gemelo ---------------- */
  'elevacion-gemelos': {
    start: { hip: [56.1, 50.4], torso: -90, arm: [80, -100], leg: [90, 90], foot: 50 },
    end: { hip: [54.4, 57.1], torso: -90, arm: [80, -100], leg: [90, 90], foot: -20 },
    scene: () => (
      <G>
        <Block x={58} y={96} w={28} h={10} />
        <Column x={98} top={14} />
        <Pad a={[60, 18]} b={[98, 18]} />
      </G>
    ),
  },
  'elevacion-gemelos-sentado': {
    start: { hip: [42.8, 73.8], torso: -90, arm: [50, 60], leg: [0, 90], foot: 45 },
    end: { hip: [42.8, 73.8], torso: -90, arm: [50, 60], leg: [16, 90], foot: -20 },
    scene: () => (
      <G>
        <Block x={64} y={98} w={22} h={8} />
        <Pad a={[28, 77.5]} b={[52, 77.5]} />
        <Seg a={[40, 79]} b={[40, 106]} />
        <Pad a={[54, 69]} b={[72, 69]} />
      </G>
    ),
  },

  /* ---------------- Core ---------------- */
  plancha: {
    start: { hip: [57.6, 93.6], torso: -12, arm: [90, 0], leg: [168, 168], foot: 70 },
  },
  crunch: {
    start: { hip: [60, 102], torso: -150, arm: [20, -150], leg: [-55, 65] },
    end: { hip: [60, 102], torso: 180, arm: [20, -160], leg: [-55, 65] },
  },
  'elevacion-piernas': {
    floor: false,
    start: { hip: [50, 70], torso: -90, arm: [-72, -84], leg: [0, 0], foot: -90 },
    end: { hip: [50, 70], torso: -90, arm: [-72, -84], leg: [90, 90] },
    scene: () => (
      <G>
        <Seg a={[24, 12]} b={[96, 12]} w={3} />
        <Seg a={[24, 4]} b={[24, 12]} />
        <Seg a={[96, 4]} b={[96, 12]} />
      </G>
    ),
  },
  'rueda-abdominal': {
    start: { hip: [44.5, 83.8], torso: -15, arm: [37, 37], leg: [114, 180], foot: 180 },
    end: { hip: [38, 83], torso: -45, arm: [80, 80], leg: [96, 180], foot: 180 },
    hold: (j) => <Block x={j.wrist[0] - 6} y={j.wrist[1] - 1} w={12} h={12} />,
  },
};

/** Neutral front-view figure used for custom exercises (`generic-<muscle>`). */
export const GENERIC: Art = {
  start: {
    view: 'front',
    hip: [60, 63],
    torso: -90,
    arm: [80, 95],
    arm2: [100, 85],
    leg: [85, 90],
    leg2: [95, 90],
  },
};
