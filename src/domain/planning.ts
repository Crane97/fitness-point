/** Planning helpers: duration estimates, workout creation and session suggestions. */
import { completedSetCount } from './history';
import type { Exercise, Organization, Routine, Session, WorkoutSession } from './types';

/** Average time under load + setup per set, used only for estimates. */
export const SECONDS_PER_SET = 45;

export function estimateSessionDurationS(session: Session): number {
  let total = 0;
  session.exercises.forEach((ex, i) => {
    const n = ex.sets.length;
    total += n * SECONDS_PER_SET + Math.max(0, n - 1) * ex.restBetweenSetsS;
    if (i < session.exercises.length - 1) total += ex.restAfterExerciseS;
  });
  return total;
}

export function formatDuration(totalSeconds: number): string {
  const min = Math.max(1, Math.round(totalSeconds / 60));
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

export function createWorkout(
  routine: Routine,
  sessionId: string,
  catalog: Readonly<Record<string, Exercise>>,
  opts: { id: string; now: number },
): WorkoutSession {
  const session = routine.sessions.find((s) => s.id === sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found in routine ${routine.id}`);

  return {
    id: opts.id,
    routineId: routine.id,
    routineName: routine.name,
    sessionId: session.id,
    sessionName: session.name,
    startedAt: opts.now,
    exercises: session.exercises.map((se) => {
      const ex = catalog[se.exerciseId];
      return {
        exerciseId: se.exerciseId,
        name: ex?.name ?? 'Ejercicio',
        illustrationKey: ex?.illustrationKey ?? 'generic-core',
        primaryMuscle: ex?.primaryMuscle ?? 'core',
        notes: se.notes,
        restBetweenSetsS: se.restBetweenSetsS,
        restAfterExerciseS: se.restAfterExerciseS,
        sets: se.sets.map((t) => ({
          plannedReps: t.reps,
          ...(t.repsMax !== undefined ? { plannedRepsMax: t.repsMax } : {}),
          plannedWeightKg: t.weightKg,
          reps: t.reps,
          weightKg: t.weightKg,
          skipped: false,
        })),
      };
    }),
  };
}

/** Next session in order after the last finished one of this routine (wraps around). */
export function suggestNextSession(
  routine: Routine,
  history: readonly WorkoutSession[],
): string | null {
  if (routine.sessions.length === 0) return null;
  let last: WorkoutSession | null = null;
  for (const w of history) {
    if (w.routineId !== routine.id || w.finishedAt === undefined) continue;
    if (completedSetCount(w) === 0) continue;
    if (!last || w.startedAt > last.startedAt) last = w;
  }
  const idx = last ? routine.sessions.findIndex((s) => s.id === last.sessionId) : -1;
  return routine.sessions[(idx + 1) % routine.sessions.length]!.id;
}

const MUSCLE_SPLITS = [
  'Pecho y tríceps',
  'Espalda y bíceps',
  'Pierna',
  'Hombro y core',
  'Torso',
  'Full body',
];

export function suggestedSessionName(org: Organization, index: number): string {
  if (org === 'days') return `Día ${index + 1}`;
  if (org === 'muscle') return MUSCLE_SPLITS[index] ?? `Sesión ${index + 1}`;
  return `Sesión ${index + 1}`;
}

export const ORGANIZATION_LABEL: Record<Organization, string> = {
  days: 'Por días',
  muscle: 'Por grupo muscular',
  free: 'Libre',
};
