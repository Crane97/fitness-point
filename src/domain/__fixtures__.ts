import type { ExerciseLog, SetLog, WorkoutSession } from './types';

export function setLog(reps: number, weightKg?: number, extra: Partial<SetLog> = {}): SetLog {
  return {
    plannedReps: reps,
    plannedWeightKg: weightKg,
    reps,
    weightKg,
    completedAt: 1,
    skipped: false,
    ...extra,
  };
}

export function exerciseLog(
  exerciseId: string,
  sets: SetLog[],
  rest: { between?: number; after?: number } = {},
): ExerciseLog {
  return {
    exerciseId,
    name: exerciseId,
    illustrationKey: exerciseId,
    primaryMuscle: 'pecho',
    notes: '',
    restBetweenSetsS: rest.between ?? 90,
    restAfterExerciseS: rest.after ?? 120,
    sets,
  };
}

export function workout(
  id: string,
  startedAt: number,
  exercises: ExerciseLog[],
  extra: Partial<WorkoutSession> = {},
): WorkoutSession {
  return {
    id,
    routineId: 'r1',
    routineName: 'Rutina',
    sessionId: 's1',
    sessionName: 'Sesión',
    startedAt,
    exercises,
    ...extra,
  };
}
