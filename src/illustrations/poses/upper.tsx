/** Chest, back, shoulders and arms. Coordinates in the shared 120×120 viewBox. */
import { G } from 'react-native-svg';

import type { Art } from '../art';
import {
  BarFront,
  Bench,
  Block,
  Cable,
  Column,
  Dumbbell,
  DumbbellFront,
  Pad,
  Plate,
  Pulley,
  Seg,
} from '../gear';

const LYING = { hip: [72, 80] as const, torso: 180, leg: [15, 85] as const, foot: 0 };
const flatBench = () => <Bench x1={24} x2={80} y={83} />;

export const UPPER: Record<string, Art> = {
  /* ---------------- Pecho ---------------- */
  'press-banca': {
    start: { ...LYING, arm: [-90, -90] },
    end: { ...LYING, arm: [40, -110] },
    scene: flatBench,
    hold: (j) => <Plate at={j.wrist} />,
  },
  'press-inclinado-mancuernas': {
    start: { hip: [64, 84], torso: -135, arm: [-80, -90], leg: [0, 90] },
    end: { hip: [64, 84], torso: -135, arm: [45, -100], leg: [0, 90] },
    scene: () => (
      <G>
        <Pad a={[61.2, 88.8]} b={[38, 65.6]} />
        <Pad a={[56, 89]} b={[80, 89]} />
        <Seg a={[60, 91]} b={[60, 106]} />
        <Seg a={[46, 76]} b={[46, 106]} />
      </G>
    ),
    hold: (j) => <Dumbbell at={j.wrist} />,
  },
  'aperturas-mancuernas': {
    floor: false,
    start: {
      view: 'front',
      hip: [60, 72],
      torso: -90,
      arm: [-5, -20],
      arm2: [185, 200],
      leg: [90, 90],
      leg2: [90, 90],
    },
    end: {
      view: 'front',
      hip: [60, 72],
      torso: -90,
      arm: [-60, -120],
      arm2: [-120, -60],
      leg: [90, 90],
      leg2: [90, 90],
    },
    scene: () => <Block x={51} y={28} w={18} h={68} />,
    hold: (j) => (
      <G>
        <DumbbellFront at={j.wrist} />
        <DumbbellFront at={j.wrist2} />
      </G>
    ),
  },
  'cruce-poleas': {
    start: {
      view: 'front',
      hip: [60, 63],
      torso: -90,
      arm: [100, 120],
      arm2: [80, 60],
      leg: [85, 90],
      leg2: [95, 90],
    },
    end: {
      view: 'front',
      hip: [60, 63],
      torso: -90,
      arm: [-20, -10],
      arm2: [200, 190],
      leg: [85, 90],
      leg2: [95, 90],
    },
    scene: (j) => (
      <G>
        <Column x={112} />
        <Column x={8} />
        <Pulley at={[109, 10]} />
        <Pulley at={[11, 10]} />
        <Cable from={[109, 10]} to={j.wrist} />
        <Cable from={[11, 10]} to={j.wrist2} />
      </G>
    ),
  },
  flexiones: {
    start: { hip: [62, 85.8], torso: -27, arm: [90, 90], leg: [153, 153], foot: 60 },
    end: { hip: [62, 97], torso: -12, arm: [160, 20], leg: [168, 168], foot: 60 },
  },

  /* ---------------- Espalda ---------------- */
  dominadas: {
    floor: false,
    start: {
      view: 'front',
      hip: [60, 70.5],
      torso: -90,
      arm: [-75, -75],
      arm2: [-105, -105],
      leg: [92, 90],
      leg2: [88, 90],
    },
    end: {
      view: 'front',
      hip: [60, 52],
      torso: -90,
      arm: [15, -100],
      arm2: [165, -80],
      leg: [92, 90],
      leg2: [88, 90],
    },
    scene: () => (
      <G>
        <Seg a={[14, 12]} b={[106, 12]} w={3} />
        <Seg a={[14, 4]} b={[14, 12]} />
        <Seg a={[106, 4]} b={[106, 12]} />
      </G>
    ),
  },
  'remo-barra': {
    start: { hip: [48, 63.6], torso: -28, arm: [200, 100], leg: [80, 100] },
    end: { hip: [48, 63.6], torso: -28, arm: [90, 90], leg: [80, 100] },
    hold: (j) => <Plate at={j.wrist} />,
  },
  'jalon-pecho': {
    start: { hip: [52, 85], torso: -100, arm: [100, -60], leg: [0, 90] },
    end: { hip: [52, 85], torso: -100, arm: [-80, -85], leg: [0, 90] },
    scene: (j) => (
      <G>
        <Column x={92} />
        <Seg a={[52, 6]} b={[92, 6]} w={3} />
        <Pulley at={[56, 9]} />
        <Cable from={[56, 9]} to={j.wrist} />
        <Pad a={[36, 89]} b={[64, 89]} />
        <Seg a={[50, 91]} b={[50, 106]} />
        <Block x={67} y={76} w={10} h={5} />
      </G>
    ),
    hold: (j) => <Block x={j.wrist[0] - 3} y={j.wrist[1] - 3} w={6} h={6} />,
  },
  'remo-polea-baja': {
    start: { hip: [40, 86], torso: -90, arm: [140, -20], leg: [-10, 10], foot: -80 },
    end: { hip: [40, 86], torso: -90, arm: [5, 5], leg: [-10, 10], foot: -80 },
    scene: (j) => (
      <G>
        <Column x={106} top={60} />
        <Pulley at={[103, 82]} />
        <Cable from={[103, 82]} to={j.wrist} />
        <Bench x1={18} x2={58} y={89} />
        <Seg a={[86, 76]} b={[86, 94]} w={3} />
      </G>
    ),
  },
  'remo-mancuerna': {
    start: {
      hip: [36, 63],
      torso: -12,
      arm: [200, 95],
      arm2: [80, 90],
      leg: [88, 92],
      leg2: [95, 180],
    },
    end: {
      hip: [36, 63],
      torso: -12,
      arm: [95, 90],
      arm2: [80, 90],
      leg: [88, 92],
      leg2: [95, 180],
    },
    scene: () => <Bench x1={10} x2={76} y={89} />,
    hold: (j) => <Dumbbell at={j.wrist} />,
  },

  /* ---------------- Hombro ---------------- */
  'press-militar': {
    start: {
      view: 'front',
      hip: [60, 63],
      torso: -90,
      arm: [-70, -95],
      arm2: [-110, -85],
      leg: [85, 90],
      leg2: [95, 90],
    },
    end: {
      view: 'front',
      hip: [60, 63],
      torso: -90,
      arm: [70, -95],
      arm2: [110, -85],
      leg: [85, 90],
      leg2: [95, 90],
    },
    hold: (j) => <BarFront y={j.wrist[1]} x1={24} x2={96} />,
  },
  'elevaciones-laterales': {
    start: {
      view: 'front',
      hip: [60, 63],
      torso: -90,
      arm: [-5, -5],
      arm2: [185, 185],
      leg: [85, 90],
      leg2: [95, 90],
    },
    end: {
      view: 'front',
      hip: [60, 63],
      torso: -90,
      arm: [80, 90],
      arm2: [100, 90],
      leg: [85, 90],
      leg2: [95, 90],
    },
    hold: (j) => (
      <G>
        <Dumbbell at={j.wrist} />
        <Dumbbell at={j.wrist2} />
      </G>
    ),
  },
  'face-pull': {
    start: { hip: [50, 63], torso: -90, arm: [180, -90], leg: [85, 95], leg2: [95, 85] },
    end: { hip: [50, 63], torso: -90, arm: [-5, -5], leg: [85, 95], leg2: [95, 85] },
    scene: (j) => (
      <G>
        <Column x={112} />
        <Pulley at={[109, 26]} />
        <Cable from={[109, 26]} to={j.wrist} />
      </G>
    ),
  },

  /* ---------------- Bíceps ---------------- */
  'curl-barra': {
    start: { hip: [52, 63], torso: -90, arm: [95, -60], leg: [90, 90] },
    end: { hip: [52, 63], torso: -90, arm: [95, 95], leg: [90, 90] },
    hold: (j) => <Plate at={j.wrist} size={13} />,
  },
  'curl-martillo': {
    start: { hip: [52, 63], torso: -90, arm: [90, -75], leg: [90, 90] },
    end: { hip: [52, 63], torso: -90, arm: [90, 90], leg: [90, 90] },
    hold: (j) => <Dumbbell at={j.wrist} />,
  },
  'curl-predicador': {
    start: { hip: [38, 82], torso: -80, arm: [45, -80], leg: [0, 90] },
    end: { hip: [38, 82], torso: -80, arm: [45, 30], leg: [0, 90] },
    scene: () => (
      <G>
        <Pad a={[48, 60]} b={[64, 76]} />
        <Seg a={[66, 78]} b={[74, 106]} />
        <Pad a={[24, 85.5]} b={[52, 85.5]} />
        <Seg a={[38, 87]} b={[38, 106]} />
      </G>
    ),
    hold: (j) => <Plate at={j.wrist} size={13} />,
  },

  /* ---------------- Tríceps ---------------- */
  fondos: {
    start: { hip: [58, 52], torso: -90, arm: [90, 90], leg: [100, 150] },
    end: { hip: [60, 66], torso: -80, arm: [150, 50], leg: [105, 150] },
    scene: () => (
      <G>
        <Seg a={[40, 57.5]} b={[80, 57.5]} w={3} />
        <Seg a={[44, 57.5]} b={[44, 106]} />
        <Seg a={[76, 57.5]} b={[76, 106]} />
      </G>
    ),
  },
  'extension-triceps-polea': {
    start: { hip: [48, 63], torso: -86, arm: [95, 75], leg: [88, 92] },
    end: { hip: [48, 63], torso: -86, arm: [95, -30], leg: [88, 92] },
    scene: (j) => (
      <G>
        <Column x={86} />
        <Pulley at={[83, 8]} />
        <Cable from={[83, 8]} to={j.wrist} />
      </G>
    ),
  },
  'press-frances': {
    start: { ...LYING, arm: [-100, -90] },
    end: { ...LYING, arm: [-100, 150] },
    scene: flatBench,
    hold: (j) => <Plate at={j.wrist} size={13} />,
  },
};
