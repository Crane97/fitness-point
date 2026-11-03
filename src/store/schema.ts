/**
 * Runtime validation of persisted data. Local storage is untrusted input (it can be
 * corrupted, edited by hand or written by an older version), so every field is parsed
 * on rehydration and invalid records are dropped instead of crashing the app.
 */
import { z } from 'zod';

import { EQUIPMENT, MUSCLE_GROUPS } from '@/domain/types';
import type { BodyMetric, Exercise, Routine, WorkoutSession } from '@/domain/types';
import type { MachineState } from '@/domain/sessionMachine';

const id = z.string().min(1).max(80);
const name = z.string().max(120);
const int = z.number().int();
const num = z.number().finite();
const muscle = z.enum(MUSCLE_GROUPS);

export const exerciseSchema = z.object({
  id,
  name: name.min(1),
  primaryMuscle: muscle,
  secondaryMuscles: z.array(muscle).max(10),
  equipment: z.enum(EQUIPMENT),
  illustrationKey: z.string().max(80),
  isCustom: z.boolean(),
});

const setTemplate = z.object({
  reps: int.min(0).max(1000),
  repsMax: int.min(0).max(1000).optional(),
  weightKg: num.min(0).max(2000).optional(),
});

const sessionExercise = z.object({
  id,
  exerciseId: id,
  sets: z.array(setTemplate).max(50),
  restBetweenSetsS: int.min(0).max(3600),
  restAfterExerciseS: int.min(0).max(3600),
  notes: z.string().max(1000),
});

export const routineSchema = z.object({
  id,
  name,
  organization: z.enum(['days', 'muscle', 'free']),
  sessions: z.array(z.object({ id, name, exercises: z.array(sessionExercise).max(60) })).max(30),
  createdAt: num,
  updatedAt: num,
});

const setLog = z.object({
  plannedReps: int.min(0).max(1000),
  plannedRepsMax: int.min(0).max(1000).optional(),
  plannedWeightKg: num.min(0).max(2000).optional(),
  reps: int.min(0).max(1000),
  weightKg: num.min(0).max(2000).optional(),
  completedAt: num.optional(),
  skipped: z.boolean(),
});

export const workoutSchema = z.object({
  id,
  routineId: id,
  routineName: name,
  sessionId: id,
  sessionName: name,
  startedAt: num,
  finishedAt: num.optional(),
  exercises: z
    .array(
      z.object({
        exerciseId: id,
        name,
        illustrationKey: z.string().max(80),
        primaryMuscle: muscle,
        notes: z.string().max(1000),
        restBetweenSetsS: int.min(0).max(3600),
        restAfterExerciseS: int.min(0).max(3600),
        sets: z.array(setLog).max(50),
      }),
    )
    .max(60),
});

export const bodyMetricSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weightKg: num.min(20).max(400).optional(),
  heightCm: num.min(80).max(260).optional(),
});

const position = z.object({ exerciseIndex: int.min(0), setIndex: int.min(0) });

const phaseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('idle') }),
  z.object({ type: z.literal('performing'), ...position.shape }),
  z.object({
    type: z.literal('resting'),
    kind: z.enum(['betweenSets', 'afterExercise']),
    startedAt: num,
    endsAt: num,
    durationS: num,
    next: position,
  }),
  z.object({ type: z.literal('finished'), finishedAt: num }),
]);

export const activeSchema = z.object({
  machine: z.object({ workout: workoutSchema, phase: phaseSchema }),
  transitionTo: int.min(0).nullable(),
  notificationId: z.string().max(200).nullable(),
});

const settingsSchema = z.object({
  keepAwake: z.boolean(),
  sound: z.boolean(),
  haptics: z.boolean(),
});

const profileSchema = z.object({ name: z.string().max(40) });

const draftSchema = z.object({ routine: routineSchema, sourceId: id.nullable() });

export interface ActiveWorkout {
  machine: MachineState;
  /** Index of the exercise we are transitioning to (shows the transition screen). */
  transitionTo: number | null;
  notificationId: string | null;
}

export interface PersistedState {
  profile: { name: string };
  settings: { keepAwake: boolean; sound: boolean; haptics: boolean };
  routines: Routine[];
  customExercises: Exercise[];
  draft: { routine: Routine; sourceId: string | null } | null;
  history: WorkoutSession[];
  bodyMetrics: BodyMetric[];
  active: ActiveWorkout | null;
}

function arrayOf<T>(schema: z.ZodType<T>, value: unknown): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.flatMap((v) => {
    const r = schema.safeParse(v);
    return r.success ? [r.data] : [];
  });
}

function one<T>(schema: z.ZodType<T>, value: unknown): T | undefined {
  const r = schema.safeParse(value);
  return r.success ? r.data : undefined;
}

/** Parses untrusted persisted data; returns only the fields that are valid. */
export function sanitizePersisted(raw: unknown): Partial<PersistedState> {
  if (typeof raw !== 'object' || raw === null) return {};
  const r = raw as Record<string, unknown>;
  const out: Partial<PersistedState> = {};
  const profile = one(profileSchema, r.profile);
  if (profile) out.profile = profile;
  const settings = one(settingsSchema, r.settings);
  if (settings) out.settings = settings;
  const routines = arrayOf(routineSchema, r.routines) as Routine[] | undefined;
  if (routines) out.routines = routines;
  const custom = arrayOf(exerciseSchema, r.customExercises);
  if (custom) out.customExercises = custom.map((e) => ({ ...e, isCustom: true }));
  const history = arrayOf(workoutSchema, r.history) as WorkoutSession[] | undefined;
  if (history) out.history = history;
  const metrics = arrayOf(bodyMetricSchema, r.bodyMetrics);
  if (metrics) out.bodyMetrics = metrics;
  if (r.draft === null) out.draft = null;
  else {
    const draft = one(draftSchema, r.draft);
    if (draft) out.draft = draft as PersistedState['draft'];
  }
  if (r.active === null) out.active = null;
  else {
    const active = one(activeSchema, r.active);
    if (active) out.active = active as ActiveWorkout;
  }
  return out;
}
