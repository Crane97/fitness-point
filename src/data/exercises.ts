/**
 * Built-in exercise catalog. To add an exercise: add an entry here and a pose in
 * `src/illustrations/poses.ts` with the same `illustrationKey` (see README).
 */
import type { Equipment, Exercise, MuscleGroup } from '@/domain/types';

type Def = [
  id: string,
  name: string,
  primary: MuscleGroup,
  secondary: MuscleGroup[],
  equipment: Equipment,
];

const DEFS: Def[] = [
  // Pecho
  ['press-banca', 'Press banca', 'pecho', ['triceps', 'hombro'], 'barra'],
  [
    'press-inclinado-mancuernas',
    'Press inclinado con mancuernas',
    'pecho',
    ['hombro', 'triceps'],
    'mancuernas',
  ],
  ['aperturas-mancuernas', 'Aperturas con mancuernas', 'pecho', ['hombro'], 'mancuernas'],
  ['cruce-poleas', 'Cruce de poleas', 'pecho', ['hombro'], 'polea'],
  ['flexiones', 'Flexiones', 'pecho', ['triceps', 'core'], 'peso-corporal'],
  // Espalda
  ['dominadas', 'Dominadas', 'espalda', ['biceps'], 'peso-corporal'],
  ['remo-barra', 'Remo con barra', 'espalda', ['biceps', 'femoral'], 'barra'],
  ['jalon-pecho', 'Jalón al pecho', 'espalda', ['biceps'], 'polea'],
  ['remo-polea-baja', 'Remo en polea baja', 'espalda', ['biceps'], 'polea'],
  ['remo-mancuerna', 'Remo con mancuerna', 'espalda', ['biceps'], 'mancuernas'],
  // Hombro
  ['press-militar', 'Press militar', 'hombro', ['triceps'], 'barra'],
  ['elevaciones-laterales', 'Elevaciones laterales', 'hombro', [], 'mancuernas'],
  ['face-pull', 'Face pull', 'hombro', ['espalda'], 'polea'],
  // Bíceps
  ['curl-barra', 'Curl con barra', 'biceps', [], 'barra'],
  ['curl-martillo', 'Curl martillo', 'biceps', [], 'mancuernas'],
  ['curl-predicador', 'Curl en banco Scott', 'biceps', [], 'maquina'],
  // Tríceps
  ['fondos', 'Fondos en paralelas', 'triceps', ['pecho', 'hombro'], 'peso-corporal'],
  ['extension-triceps-polea', 'Extensión de tríceps en polea', 'triceps', [], 'polea'],
  ['press-frances', 'Press francés', 'triceps', [], 'barra'],
  // Cuádriceps
  ['sentadilla', 'Sentadilla', 'cuadriceps', ['gluteo', 'femoral'], 'barra'],
  ['prensa', 'Prensa', 'cuadriceps', ['gluteo'], 'maquina'],
  ['zancadas', 'Zancadas', 'cuadriceps', ['gluteo'], 'mancuernas'],
  ['extension-cuadriceps', 'Extensión de cuádriceps', 'cuadriceps', [], 'maquina'],
  // Femoral
  ['peso-muerto', 'Peso muerto', 'femoral', ['gluteo', 'espalda'], 'barra'],
  ['peso-muerto-rumano', 'Peso muerto rumano', 'femoral', ['gluteo'], 'barra'],
  ['curl-femoral', 'Curl femoral tumbado', 'femoral', [], 'maquina'],
  // Glúteo
  ['hip-thrust', 'Hip thrust', 'gluteo', ['femoral'], 'barra'],
  ['patada-gluteo-polea', 'Patada de glúteo en polea', 'gluteo', ['femoral'], 'polea'],
  // Gemelo
  ['elevacion-gemelos', 'Elevación de gemelos de pie', 'gemelo', [], 'maquina'],
  ['elevacion-gemelos-sentado', 'Elevación de gemelos sentado', 'gemelo', [], 'maquina'],
  // Core
  ['plancha', 'Plancha', 'core', ['hombro'], 'peso-corporal'],
  ['crunch', 'Crunch', 'core', [], 'peso-corporal'],
  ['elevacion-piernas', 'Elevación de piernas colgado', 'core', [], 'peso-corporal'],
  ['rueda-abdominal', 'Rueda abdominal', 'core', ['hombro'], 'peso-corporal'],
];

export const BUILT_IN_EXERCISES: readonly Exercise[] = DEFS.map(
  ([id, name, primaryMuscle, secondaryMuscles, equipment]) => ({
    id,
    name,
    primaryMuscle,
    secondaryMuscles,
    equipment,
    illustrationKey: id,
    isCustom: false,
  }),
);

export const MUSCLE_LABEL: Record<MuscleGroup, string> = {
  pecho: 'Pecho',
  espalda: 'Espalda',
  hombro: 'Hombro',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  cuadriceps: 'Cuádriceps',
  femoral: 'Femoral',
  gluteo: 'Glúteo',
  gemelo: 'Gemelo',
  core: 'Core',
};

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barra: 'Barra',
  mancuernas: 'Mancuernas',
  maquina: 'Máquina',
  polea: 'Polea',
  'peso-corporal': 'Peso corporal',
};

export function genericIllustrationKey(muscle: MuscleGroup): string {
  return `generic-${muscle}`;
}

/** Case- and accent-insensitive search on name, muscle and equipment labels. */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function filterExercises(
  list: readonly Exercise[],
  query: string,
  muscle: MuscleGroup | null,
): Exercise[] {
  const q = normalize(query);
  return list.filter((e) => {
    if (muscle && e.primaryMuscle !== muscle && !e.secondaryMuscles.includes(muscle)) return false;
    if (!q) return true;
    const hay = normalize(
      `${e.name} ${MUSCLE_LABEL[e.primaryMuscle]} ${EQUIPMENT_LABEL[e.equipment]}`,
    );
    return q.split(/\s+/).every((t) => hay.includes(t));
  });
}
