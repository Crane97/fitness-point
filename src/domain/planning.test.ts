import type { Exercise, Routine } from './types';
import { exerciseLog, setLog, workout } from './__fixtures__';
import {
  SECONDS_PER_SET,
  createWorkout,
  estimateSessionDurationS,
  formatDuration,
  suggestNextSession,
  suggestedSessionName,
} from './planning';

const catalog: Record<string, Exercise> = {
  'press-banca': {
    id: 'press-banca',
    name: 'Press banca',
    primaryMuscle: 'pecho',
    secondaryMuscles: ['triceps'],
    equipment: 'barra',
    illustrationKey: 'press-banca',
    isCustom: false,
  },
};

const routine: Routine = {
  id: 'r1',
  name: 'Fuerza',
  organization: 'days',
  createdAt: 0,
  updatedAt: 0,
  sessions: [
    {
      id: 's1',
      name: 'Día 1',
      exercises: [
        {
          id: 'se1',
          exerciseId: 'press-banca',
          sets: [
            { reps: 8, weightKg: 60 },
            { reps: 6, repsMax: 8, weightKg: 65 },
          ],
          restBetweenSetsS: 90,
          restAfterExerciseS: 120,
          notes: 'Codos a 45°',
        },
        {
          id: 'se2',
          exerciseId: 'press-banca',
          sets: [{ reps: 10 }],
          restBetweenSetsS: 60,
          restAfterExerciseS: 60,
          notes: '',
        },
      ],
    },
    { id: 's2', name: 'Día 2', exercises: [] },
    { id: 's3', name: 'Día 3', exercises: [] },
  ],
};

describe('estimateSessionDurationS', () => {
  it('adds work time per set plus rests (no rest after the last exercise)', () => {
    const s = routine.sessions[0]!;
    // 3 sets of work + 1 rest between sets of ex1 + rest after ex1
    expect(estimateSessionDurationS(s)).toBe(3 * SECONDS_PER_SET + 90 + 120);
  });

  it('formats durations in minutes', () => {
    expect(formatDuration(59)).toBe('1 min');
    expect(formatDuration(3000)).toBe('50 min');
    expect(formatDuration(4500)).toBe('1 h 15 min');
  });
});

describe('createWorkout', () => {
  it('snapshots the plan so editing the routine later does not alter history', () => {
    const w = createWorkout(routine, 's1', catalog, { id: 'w1', now: 1000 });
    expect(w).toMatchObject({
      id: 'w1',
      routineId: 'r1',
      routineName: 'Fuerza',
      sessionId: 's1',
      sessionName: 'Día 1',
      startedAt: 1000,
    });
    expect(w.exercises[0]).toMatchObject({
      exerciseId: 'press-banca',
      name: 'Press banca',
      notes: 'Codos a 45°',
      restBetweenSetsS: 90,
      restAfterExerciseS: 120,
    });
    expect(w.exercises[0]!.sets[1]).toEqual({
      plannedReps: 6,
      plannedRepsMax: 8,
      plannedWeightKg: 65,
      reps: 6,
      weightKg: 65,
      skipped: false,
    });

    routine.sessions[0]!.exercises[0]!.sets[0]!.weightKg = 999;
    expect(w.exercises[0]!.sets[0]!.plannedWeightKg).toBe(60);
    routine.sessions[0]!.exercises[0]!.sets[0]!.weightKg = 60;
  });

  it('falls back to a generic exercise when it is missing from the catalog', () => {
    const w = createWorkout(
      {
        ...routine,
        sessions: [
          {
            ...routine.sessions[0]!,
            exercises: [{ ...routine.sessions[0]!.exercises[0]!, exerciseId: 'gone' }],
          },
        ],
      },
      's1',
      catalog,
      { id: 'w', now: 0 },
    );
    expect(w.exercises[0]).toMatchObject({ name: 'Ejercicio', illustrationKey: 'generic-core' });
  });

  it('throws when the session does not exist', () => {
    expect(() => createWorkout(routine, 'nope', catalog, { id: 'w', now: 0 })).toThrow();
  });
});

describe('suggestNextSession', () => {
  it('suggests the first session when the routine was never trained', () => {
    expect(suggestNextSession(routine, [])).toBe('s1');
  });

  it('suggests the session after the last one done, wrapping around', () => {
    const h = [
      workout('a', 1, [exerciseLog('x', [setLog(1)])], { sessionId: 's1', finishedAt: 2 }),
      workout('b', 3, [exerciseLog('x', [setLog(1)])], { sessionId: 's2', finishedAt: 4 }),
    ];
    expect(suggestNextSession(routine, h)).toBe('s3');
    const h2 = [...h, workout('c', 5, [], { sessionId: 's3', finishedAt: 6 })];
    expect(suggestNextSession(routine, h2)).toBe('s1');
  });

  it('ignores workouts of other routines', () => {
    const h = [workout('a', 1, [], { routineId: 'other', sessionId: 's1', finishedAt: 2 })];
    expect(suggestNextSession(routine, h)).toBe('s1');
  });
});

describe('suggestedSessionName', () => {
  it('depends on the organization mode', () => {
    expect(suggestedSessionName('days', 2)).toBe('Día 3');
    expect(suggestedSessionName('muscle', 0)).toBe('Pecho y tríceps');
    expect(suggestedSessionName('muscle', 1)).toBe('Espalda y bíceps');
    expect(suggestedSessionName('free', 0)).toBe('Sesión 1');
  });
});
