import { exerciseLog, setLog, workout } from './__fixtures__';
import {
  createMachine,
  currentExercise,
  nextPosition,
  reduce,
  type MachineState,
} from './sessionMachine';

const T0 = 1_700_000_000_000;
const pending = { completedAt: undefined };

function twoExerciseWorkout() {
  return workout('w1', 0, [
    exerciseLog('press-banca', [setLog(8, 60, pending), setLog(8, 60, pending)], {
      between: 90,
      after: 120,
    }),
    exerciseLog('fondos', [setLog(10, undefined, pending)], { between: 60, after: 0 }),
  ]);
}

function started(): MachineState {
  return reduce(createMachine(twoExerciseWorkout()), { type: 'START', now: T0 });
}

describe('sessionMachine', () => {
  it('starts idle and moves to the first set on START', () => {
    const idle = createMachine(twoExerciseWorkout());
    expect(idle.phase).toEqual({ type: 'idle' });

    const s = started();
    expect(s.phase).toEqual({ type: 'performing', exerciseIndex: 0, setIndex: 0 });
    expect(s.workout.startedAt).toBe(T0);
  });

  it('COMPLETE_SET records the values and starts the between-sets rest', () => {
    const s = reduce(started(), {
      type: 'COMPLETE_SET',
      weightKg: 62.5,
      reps: 7,
      now: T0 + 30_000,
    });
    const set = s.workout.exercises[0]!.sets[0]!;
    expect(set).toMatchObject({
      weightKg: 62.5,
      reps: 7,
      completedAt: T0 + 30_000,
      skipped: false,
    });
    expect(s.phase).toEqual({
      type: 'resting',
      kind: 'betweenSets',
      startedAt: T0 + 30_000,
      endsAt: T0 + 30_000 + 90_000,
      durationS: 90,
      next: { exerciseIndex: 0, setIndex: 1 },
    });
  });

  it('uses the after-exercise rest when the next set belongs to another exercise', () => {
    let s = started();
    s = reduce(s, { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    s = reduce(s, { type: 'SKIP_REST', now: T0 + 1000 });
    s = reduce(s, { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 + 2000 });
    expect(s.phase).toMatchObject({
      type: 'resting',
      kind: 'afterExercise',
      durationS: 120,
      endsAt: T0 + 2000 + 120_000,
      next: { exerciseIndex: 1, setIndex: 0 },
    });
  });

  it('does not rest after the last set of the last exercise: it finishes', () => {
    let s = started();
    s = reduce(s, { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    s = reduce(s, { type: 'SKIP_REST', now: T0 });
    s = reduce(s, { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    s = reduce(s, { type: 'SKIP_REST', now: T0 });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 12, weightKg: null, now: T0 + 5000 });
    expect(s.phase).toEqual({ type: 'finished', finishedAt: T0 + 5000 });
    expect(s.workout.finishedAt).toBe(T0 + 5000);
    expect(s.workout.exercises[1]!.sets[0]).toMatchObject({ reps: 12, weightKg: undefined });
  });

  it('skips the rest phase entirely when the rest is 0 s', () => {
    const w = workout('w', 0, [
      exerciseLog('a', [setLog(5, undefined, pending), setLog(5, undefined, pending)], {
        between: 0,
      }),
    ]);
    let s = reduce(createMachine(w), { type: 'START', now: T0 });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 5, weightKg: null, now: T0 });
    expect(s.phase).toEqual({ type: 'performing', exerciseIndex: 0, setIndex: 1 });
  });

  it('TICK only advances once endsAt has been reached', () => {
    let s = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    const before = reduce(s, { type: 'TICK', now: T0 + 89_999 });
    expect(before.phase.type).toBe('resting');
    s = reduce(s, { type: 'TICK', now: T0 + 90_000 });
    expect(s.phase).toEqual({ type: 'performing', exerciseIndex: 0, setIndex: 1 });
  });

  it('ADJUST_REST moves endsAt by ±15 s and never below now', () => {
    let s = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    s = reduce(s, { type: 'ADJUST_REST', deltaS: 15, now: T0 + 1000 });
    expect(s.phase).toMatchObject({ endsAt: T0 + 105_000, durationS: 105 });
    s = reduce(s, { type: 'ADJUST_REST', deltaS: -15, now: T0 + 1000 });
    s = reduce(s, { type: 'ADJUST_REST', deltaS: -15, now: T0 + 1000 });
    expect(s.phase).toMatchObject({ endsAt: T0 + 75_000, durationS: 75 });

    const late = reduce(s, { type: 'ADJUST_REST', deltaS: -15, now: T0 + 70_000 });
    expect(late.phase).toMatchObject({ endsAt: T0 + 70_000 });
  });

  it('EDIT_SET changes a completed set without moving the cursor', () => {
    let s = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    s = reduce(s, { type: 'SKIP_REST', now: T0 });
    s = reduce(s, { type: 'EDIT_SET', exerciseIndex: 0, setIndex: 0, weightKg: 57.5, reps: 9 });
    expect(s.workout.exercises[0]!.sets[0]).toMatchObject({ weightKg: 57.5, reps: 9 });
    expect(s.phase).toEqual({ type: 'performing', exerciseIndex: 0, setIndex: 1 });
  });

  it('EDIT_SET ignores sets that have not been completed yet', () => {
    const s = started();
    const edited = reduce(s, { type: 'EDIT_SET', exerciseIndex: 1, setIndex: 0, reps: 99 });
    expect(edited).toBe(s);
  });

  it('FINISH ends early and marks pending sets as skipped', () => {
    let s = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    s = reduce(s, { type: 'FINISH', now: T0 + 10_000 });
    expect(s.phase).toEqual({ type: 'finished', finishedAt: T0 + 10_000 });
    const flags = s.workout.exercises.flatMap((e) => e.sets.map((x) => x.skipped));
    expect(flags).toEqual([false, true, true]);
  });

  it('ignores events that are invalid for the current phase', () => {
    const idle = createMachine(twoExerciseWorkout());
    expect(reduce(idle, { type: 'COMPLETE_SET', reps: 1, weightKg: null, now: T0 })).toBe(idle);
    const s = started();
    expect(reduce(s, { type: 'SKIP_REST', now: T0 })).toBe(s);
    expect(reduce(s, { type: 'START', now: T0 })).toBe(s);
  });

  it('never mutates the previous state', () => {
    const s = started();
    const snapshot = JSON.stringify(s);
    reduce(s, { type: 'COMPLETE_SET', weightKg: 100, reps: 1, now: T0 });
    expect(JSON.stringify(s)).toBe(snapshot);
  });

  it('rejects invalid reps or weights', () => {
    const s = started();
    for (const bad of [0, -3, Number.NaN, 7.5, 101]) {
      expect(reduce(s, { type: 'COMPLETE_SET', reps: bad, weightKg: 60, now: T0 })).toBe(s);
    }
    expect(reduce(s, { type: 'COMPLETE_SET', reps: 8, weightKg: -1, now: T0 })).toBe(s);
    expect(reduce(s, { type: 'COMPLETE_SET', reps: 8, weightKg: Number.NaN, now: T0 })).toBe(s);
  });

  it('ADJUST_REST +15 s after the rest already expired counts from now', () => {
    const s = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    const late = T0 + 110_000; // 20 s after endsAt, no TICK yet
    const adj = reduce(s, { type: 'ADJUST_REST', deltaS: 15, now: late });
    expect(adj.phase).toMatchObject({ type: 'resting', endsAt: late + 15_000 });
  });

  it('EDIT_SET with weightKg null switches to body weight', () => {
    const s = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    const e = reduce(s, { type: 'EDIT_SET', exerciseIndex: 0, setIndex: 0, weightKg: null });
    expect(e.workout.exercises[0]!.sets[0]!.weightKg).toBeUndefined();
  });

  it('FINISH is ignored while idle but works while resting', () => {
    const idle = createMachine(twoExerciseWorkout());
    expect(reduce(idle, { type: 'FINISH', now: T0 })).toBe(idle);
    const resting = reduce(started(), { type: 'COMPLETE_SET', weightKg: 60, reps: 8, now: T0 });
    expect(reduce(resting, { type: 'FINISH', now: T0 + 1 }).phase.type).toBe('finished');
  });

  it('skips exercises without sets wherever they are', () => {
    const w = workout('w', 0, [
      exerciseLog('empty-a', []),
      exerciseLog('a', [setLog(5, undefined, pending)], { after: 30 }),
      exerciseLog('empty-b', []),
      exerciseLog('b', [setLog(5, undefined, pending)]),
      exerciseLog('empty-c', []),
    ]);
    let s = reduce(createMachine(w), { type: 'START', now: T0 });
    expect(s.phase).toEqual({ type: 'performing', exerciseIndex: 1, setIndex: 0 });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 5, weightKg: null, now: T0 });
    expect(s.phase).toMatchObject({
      kind: 'afterExercise',
      next: { exerciseIndex: 3, setIndex: 0 },
    });
    s = reduce(s, { type: 'SKIP_REST', now: T0 });
    s = reduce(s, { type: 'COMPLETE_SET', reps: 5, weightKg: null, now: T0 });
    expect(s.phase.type).toBe('finished');
  });

  it('a workout with no sets at all finishes immediately on START', () => {
    const w = workout('w', 0, [exerciseLog('x', [])]);
    expect(reduce(createMachine(w), { type: 'START', now: T0 }).phase.type).toBe('finished');
  });

  it('TICK is ignored when not resting', () => {
    const s = started();
    expect(reduce(s, { type: 'TICK', now: T0 + 999_999 })).toBe(s);
  });

  it('COMPLETE_SET for a stale position is ignored (double tap on HECHO)', () => {
    const w = workout('w', 0, [
      exerciseLog('a', [setLog(5, undefined, pending), setLog(5, undefined, pending)], {
        between: 0,
      }),
    ]);
    let s = reduce(createMachine(w), { type: 'START', now: T0 });
    const at = { exerciseIndex: 0, setIndex: 0 };
    s = reduce(s, { type: 'COMPLETE_SET', reps: 5, weightKg: null, now: T0, at });
    const again = reduce(s, { type: 'COMPLETE_SET', reps: 5, weightKg: null, now: T0, at });
    expect(again).toBe(s);
    expect(s.phase).toEqual({ type: 'performing', exerciseIndex: 0, setIndex: 1 });
  });

  it('nextPosition / currentExercise helpers', () => {
    const w = twoExerciseWorkout();
    expect(nextPosition(w, { exerciseIndex: 0, setIndex: 0 })).toEqual({
      exerciseIndex: 0,
      setIndex: 1,
    });
    expect(nextPosition(w, { exerciseIndex: 0, setIndex: 1 })).toEqual({
      exerciseIndex: 1,
      setIndex: 0,
    });
    expect(nextPosition(w, { exerciseIndex: 1, setIndex: 0 })).toBeNull();
    expect(currentExercise(started())?.exerciseId).toBe('press-banca');
  });
});
