/** View-model helpers for the guided workout screens. */
import { formatKg, formatReps } from '@/domain/format';
import type { MachineState, SetPosition } from '@/domain/sessionMachine';
import type { ExerciseLog, SetLog } from '@/domain/types';

export function setTarget(s: SetLog): string {
  const reps = formatReps(s.plannedReps, s.plannedRepsMax);
  return s.plannedWeightKg === undefined
    ? `${reps} reps`
    : `${formatKg(s.plannedWeightKg)} kg × ${reps}`;
}

export function setDone(s: SetLog): string {
  return s.weightKg === undefined ? `${s.reps} reps` : `${formatKg(s.weightKg)} kg × ${s.reps}`;
}

export function exerciseAt(m: MachineState, pos: SetPosition | null): ExerciseLog | null {
  return pos ? (m.workout.exercises[pos.exerciseIndex] ?? null) : null;
}

/** Name of the exercise that comes after the given one, or null if it is the last one. */
export function nextExerciseName(m: MachineState, exerciseIndex: number): string | null {
  for (let i = exerciseIndex + 1; i < m.workout.exercises.length; i++) {
    const e = m.workout.exercises[i]!;
    if (e.sets.length > 0) return e.name;
  }
  return null;
}

export function exerciseCount(m: MachineState): number {
  return m.workout.exercises.filter((e) => e.sets.length > 0).length;
}

/** 1-based ordinal of an exercise among the non-empty ones. */
export function exerciseOrdinal(m: MachineState, exerciseIndex: number): number {
  return m.workout.exercises.slice(0, exerciseIndex + 1).filter((e) => e.sets.length > 0).length;
}
