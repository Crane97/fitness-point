/**
 * Domain model. Pure data, serialisable to JSON (persisted locally).
 * Array order is the source of truth for ordering (sessions, exercises, sets).
 */

export const MUSCLE_GROUPS = [
  'pecho',
  'espalda',
  'hombro',
  'biceps',
  'triceps',
  'cuadriceps',
  'femoral',
  'gluteo',
  'gemelo',
  'core',
] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export const EQUIPMENT = ['barra', 'mancuernas', 'maquina', 'polea', 'peso-corporal'] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export interface Exercise {
  id: string;
  name: string;
  primaryMuscle: MuscleGroup;
  secondaryMuscles: MuscleGroup[];
  equipment: Equipment;
  /** Key in the illustration registry. Custom exercises use `generic-<muscle>`. */
  illustrationKey: string;
  isCustom: boolean;
}

export interface SetTemplate {
  reps: number;
  /** Upper bound when the target is a range (8-10). */
  repsMax?: number;
  /** Undefined = body weight. */
  weightKg?: number;
}

export interface SessionExercise {
  /** Instance id (the same exercise may appear twice in a session). */
  id: string;
  exerciseId: string;
  sets: SetTemplate[];
  restBetweenSetsS: number;
  restAfterExerciseS: number;
  notes: string;
}

export interface Session {
  id: string;
  name: string;
  exercises: SessionExercise[];
}

export type Organization = 'days' | 'muscle' | 'free';

export interface Routine {
  id: string;
  name: string;
  organization: Organization;
  sessions: Session[];
  createdAt: number;
  updatedAt: number;
}

/* ---------- History (immutable snapshots, never linked back to a routine's live data) ---------- */

export interface SetLog {
  plannedReps: number;
  plannedRepsMax?: number;
  plannedWeightKg?: number;
  reps: number;
  weightKg?: number;
  completedAt?: number;
  skipped: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  illustrationKey: string;
  primaryMuscle: MuscleGroup;
  notes: string;
  restBetweenSetsS: number;
  restAfterExerciseS: number;
  sets: SetLog[];
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineName: string;
  sessionId: string;
  sessionName: string;
  startedAt: number;
  finishedAt?: number;
  exercises: ExerciseLog[];
}

export interface BodyMetric {
  /** Local date, YYYY-MM-DD. One entry per day. */
  date: string;
  weightKg?: number;
  heightCm?: number;
}
