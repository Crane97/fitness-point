/** Derived data from the workout history: "la última vez", volume and improvements. */
import { formatKg } from './format';
import type { SetLog, WorkoutSession } from './types';

export interface PerformedSet {
  reps: number;
  weightKg?: number;
}

export interface LastPerformance {
  workoutId: string;
  date: number;
  sets: PerformedSet[];
}

export interface Improvement {
  exerciseId: string;
  name: string;
  previous: PerformedSet;
  current: PerformedSet;
}

const isDone = (s: SetLog): boolean => !s.skipped && s.completedAt !== undefined;

function performedSets(sets: SetLog[]): PerformedSet[] {
  return sets.filter(isDone).map((s) => ({ reps: s.reps, weightKg: s.weightKg }));
}

export function lastPerformance(
  history: readonly WorkoutSession[],
  exerciseId: string,
  opts: { before?: number; excludeId?: string } = {},
): LastPerformance | null {
  let best: LastPerformance | null = null;
  for (const w of history) {
    if (w.finishedAt === undefined || w.id === opts.excludeId) continue;
    if (opts.before !== undefined && w.startedAt >= opts.before) continue;
    if (best && w.startedAt <= best.date) continue;
    const sets = w.exercises
      .filter((e) => e.exerciseId === exerciseId)
      .flatMap((e) => performedSets(e.sets));
    if (sets.length > 0) best = { workoutId: w.id, date: w.startedAt, sets };
  }
  return best;
}

/** Heaviest set; ties broken by reps. Body weight counts as 0 kg. */
export function topSet(sets: readonly PerformedSet[]): PerformedSet | null {
  let top: PerformedSet | null = null;
  for (const s of sets) {
    if (!top) {
      top = s;
      continue;
    }
    const w = s.weightKg ?? 0;
    const tw = top.weightKg ?? 0;
    if (w > tw || (w === tw && s.reps > top.reps)) top = s;
  }
  return top ? { reps: top.reps, weightKg: top.weightKg } : null;
}

export function formatSet(s: PerformedSet): string {
  return s.weightKg === undefined
    ? `Peso corporal × ${s.reps}`
    : `${formatKg(s.weightKg)} kg × ${s.reps}`;
}

function counted(w: WorkoutSession): SetLog[] {
  return w.exercises.flatMap((e) => e.sets.filter(isDone));
}

export function workoutVolume(w: WorkoutSession): number {
  return counted(w).reduce((acc, s) => acc + (s.weightKg ?? 0) * s.reps, 0);
}

export function completedSetCount(w: WorkoutSession): number {
  return counted(w).length;
}

export function totalPlannedSets(w: WorkoutSession): number {
  return w.exercises.reduce((acc, e) => acc + e.sets.length, 0);
}

function beats(a: PerformedSet, b: PerformedSet): boolean {
  const wa = a.weightKg ?? 0;
  const wb = b.weightKg ?? 0;
  return wa > wb || (wa === wb && a.reps > b.reps);
}

export function improvements(
  current: WorkoutSession,
  history: readonly WorkoutSession[],
): Improvement[] {
  const result: Improvement[] = [];
  const seen = new Set<string>();
  for (const ex of current.exercises) {
    if (seen.has(ex.exerciseId)) continue;
    seen.add(ex.exerciseId);
    const now = topSet(
      current.exercises
        .filter((e) => e.exerciseId === ex.exerciseId)
        .flatMap((e) => performedSets(e.sets)),
    );
    const last = lastPerformance(history, ex.exerciseId, {
      before: current.startedAt,
      excludeId: current.id,
    });
    const prev = last ? topSet(last.sets) : null;
    if (now && prev && beats(now, prev)) {
      result.push({ exerciseId: ex.exerciseId, name: ex.name, previous: prev, current: now });
    }
  }
  return result;
}
