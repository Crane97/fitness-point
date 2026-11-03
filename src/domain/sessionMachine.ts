/**
 * Guided-workout engine: a pure state machine.
 *
 *   idle → performing(set) → resting(betweenSets | afterExercise) → … → finished
 *
 * `reduce` never mutates its input and returns the same reference for events that
 * are not valid in the current phase.
 */
import { LIMITS } from './routineValidation';
import type { ExerciseLog, SetLog, WorkoutSession } from './types';

const validReps = (r: number): boolean =>
  Number.isInteger(r) && r >= LIMITS.repsMin && r <= LIMITS.repsMax;
const validWeight = (w: number | null | undefined): boolean =>
  w === null || w === undefined || (Number.isFinite(w) && w >= 0 && w <= LIMITS.weightMax);

export interface SetPosition {
  exerciseIndex: number;
  setIndex: number;
}

export type RestKind = 'betweenSets' | 'afterExercise';

export type Phase =
  | { type: 'idle' }
  | ({ type: 'performing' } & SetPosition)
  | {
      type: 'resting';
      kind: RestKind;
      startedAt: number;
      endsAt: number;
      durationS: number;
      next: SetPosition;
    }
  | { type: 'finished'; finishedAt: number };

export interface MachineState {
  workout: WorkoutSession;
  phase: Phase;
}

export type MachineEvent =
  | { type: 'START'; now: number }
  /** weightKg: null = body weight (explicit, so a missing value never erases a weight). */
  | {
      type: 'COMPLETE_SET';
      reps: number;
      weightKg: number | null;
      now: number;
      /** Set the user saw when tapping HECHO; a stale value (double tap) is ignored. */
      at?: SetPosition;
    }
  | { type: 'SKIP_REST'; now: number }
  | { type: 'ADJUST_REST'; deltaS: number; now: number }
  | { type: 'TICK'; now: number }
  | ({ type: 'EDIT_SET'; reps?: number; weightKg?: number | null } & SetPosition)
  | { type: 'FINISH'; now: number };

export function createMachine(workout: WorkoutSession): MachineState {
  return { workout, phase: { type: 'idle' } };
}

export function nextPosition(workout: WorkoutSession, pos: SetPosition): SetPosition | null {
  const ex = workout.exercises[pos.exerciseIndex];
  if (ex && pos.setIndex + 1 < ex.sets.length) {
    return { exerciseIndex: pos.exerciseIndex, setIndex: pos.setIndex + 1 };
  }
  for (let i = pos.exerciseIndex + 1; i < workout.exercises.length; i++) {
    if ((workout.exercises[i]?.sets.length ?? 0) > 0) return { exerciseIndex: i, setIndex: 0 };
  }
  return null;
}

function firstPosition(workout: WorkoutSession): SetPosition | null {
  return nextPosition(workout, { exerciseIndex: -1, setIndex: 0 });
}

/** The position the user is looking at: the current set, or the one after the rest. */
export function focusPosition(state: MachineState): SetPosition | null {
  const { phase } = state;
  if (phase.type === 'performing') return phase;
  if (phase.type === 'resting') return phase.next;
  return null;
}

export function currentExercise(state: MachineState): ExerciseLog | null {
  const pos = focusPosition(state);
  return pos ? (state.workout.exercises[pos.exerciseIndex] ?? null) : null;
}

function updateSet(
  workout: WorkoutSession,
  pos: SetPosition,
  patch: (set: SetLog) => SetLog,
): WorkoutSession {
  return {
    ...workout,
    exercises: workout.exercises.map((ex, ei) =>
      ei !== pos.exerciseIndex
        ? ex
        : { ...ex, sets: ex.sets.map((s, si) => (si === pos.setIndex ? patch(s) : s)) },
    ),
  };
}

function finish(workout: WorkoutSession, now: number): MachineState {
  return {
    workout: {
      ...workout,
      finishedAt: now,
      exercises: workout.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => (s.completedAt === undefined ? { ...s, skipped: true } : s)),
      })),
    },
    phase: { type: 'finished', finishedAt: now },
  };
}

export function reduce(state: MachineState, event: MachineEvent): MachineState {
  const { phase, workout } = state;

  switch (event.type) {
    case 'START': {
      if (phase.type !== 'idle') return state;
      const first = firstPosition(workout);
      const started = { ...workout, startedAt: event.now };
      if (!first) return finish(started, event.now);
      return { workout: started, phase: { type: 'performing', ...first } };
    }

    case 'COMPLETE_SET': {
      if (phase.type !== 'performing') return state;
      if (!validReps(event.reps) || !validWeight(event.weightKg)) return state;
      if (
        event.at &&
        (event.at.exerciseIndex !== phase.exerciseIndex || event.at.setIndex !== phase.setIndex)
      ) {
        return state;
      }
      const done = updateSet(workout, phase, (s) => ({
        ...s,
        reps: event.reps,
        weightKg: event.weightKg ?? undefined,
        completedAt: event.now,
        skipped: false,
      }));
      const next = nextPosition(done, phase);
      if (!next) return finish(done, event.now);

      const ex = done.exercises[phase.exerciseIndex]!;
      const kind: RestKind =
        next.exerciseIndex === phase.exerciseIndex ? 'betweenSets' : 'afterExercise';
      const durationS = kind === 'betweenSets' ? ex.restBetweenSetsS : ex.restAfterExerciseS;
      if (durationS <= 0) return { workout: done, phase: { type: 'performing', ...next } };
      return {
        workout: done,
        phase: {
          type: 'resting',
          kind,
          startedAt: event.now,
          endsAt: event.now + durationS * 1000,
          durationS,
          next,
        },
      };
    }

    case 'SKIP_REST': {
      if (phase.type !== 'resting') return state;
      return { workout, phase: { type: 'performing', ...phase.next } };
    }

    case 'TICK': {
      if (phase.type !== 'resting' || event.now < phase.endsAt) return state;
      return { workout, phase: { type: 'performing', ...phase.next } };
    }

    case 'ADJUST_REST': {
      if (phase.type !== 'resting') return state;
      const base = event.deltaS > 0 ? Math.max(phase.endsAt, event.now) : phase.endsAt;
      const endsAt = Math.max(event.now, base + event.deltaS * 1000);
      return {
        workout,
        phase: { ...phase, endsAt, durationS: Math.round((endsAt - phase.startedAt) / 1000) },
      };
    }

    case 'EDIT_SET': {
      const target = workout.exercises[event.exerciseIndex]?.sets[event.setIndex];
      if (!target || target.completedAt === undefined) return state;
      if (event.reps !== undefined && !validReps(event.reps)) return state;
      if (!validWeight(event.weightKg)) return state;
      return {
        phase,
        workout: updateSet(workout, event, (s) => ({
          ...s,
          reps: event.reps ?? s.reps,
          weightKg:
            event.weightKg === undefined
              ? s.weightKg
              : event.weightKg === null
                ? undefined
                : event.weightKg,
        })),
      };
    }

    case 'FINISH': {
      if (phase.type === 'finished' || phase.type === 'idle') return state;
      return finish(workout, event.now);
    }
  }
}
