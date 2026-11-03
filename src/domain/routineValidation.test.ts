import type { Routine, SessionExercise } from './types';
import {
  LIMITS,
  isValidRoutine,
  validateCustomExercise,
  validateRoutine,
  validateSessionExercise,
} from './routineValidation';

function ex(over: Partial<SessionExercise> = {}): SessionExercise {
  return {
    id: 'se1',
    exerciseId: 'press-banca',
    sets: [{ reps: 8, weightKg: 60 }],
    restBetweenSetsS: 90,
    restAfterExerciseS: 120,
    notes: '',
    ...over,
  };
}

function routine(over: Partial<Routine> = {}): Routine {
  return {
    id: 'r1',
    name: 'Mi rutina',
    organization: 'muscle',
    sessions: [{ id: 's1', name: 'Pecho y tríceps', exercises: [ex()] }],
    createdAt: 0,
    updatedAt: 0,
    ...over,
  };
}

const messages = (r: Routine) => validateRoutine(r).map((e) => e.message);

describe('validateRoutine', () => {
  it('accepts a well-formed routine', () => {
    expect(validateRoutine(routine())).toEqual([]);
    expect(isValidRoutine(routine())).toBe(true);
  });

  it('requires a non-blank name', () => {
    expect(messages(routine({ name: '   ' }))).toContain('Ponle un nombre a la rutina.');
  });

  it('limits the name length', () => {
    expect(messages(routine({ name: 'x'.repeat(LIMITS.nameMax + 1) }))).toContain(
      `El nombre no puede superar ${LIMITS.nameMax} caracteres.`,
    );
  });

  it('requires at least one session', () => {
    expect(messages(routine({ sessions: [] }))).toContain('Añade al menos una sesión.');
  });

  it('requires a session name and at least one exercise per session', () => {
    const errors = validateRoutine(routine({ sessions: [{ id: 's1', name: '', exercises: [] }] }));
    expect(errors).toEqual(
      expect.arrayContaining([
        { path: 'sessions.0.name', message: 'La sesión 1 necesita un nombre.' },
        { path: 'sessions.0.exercises', message: '«Sesión 1» necesita al menos un ejercicio.' },
      ]),
    );
  });

  it('reports exercise errors with a path to the offending field', () => {
    const errors = validateRoutine(
      routine({
        sessions: [{ id: 's1', name: 'Pecho', exercises: [ex({ sets: [] })] }],
      }),
    );
    expect(errors).toEqual([
      { path: 'sessions.0.exercises.0.sets', message: 'Añade al menos una serie.' },
    ]);
  });
});

describe('validateSessionExercise', () => {
  const msgs = (e: SessionExercise) => validateSessionExercise(e).map((x) => x.message);

  it('validates reps', () => {
    expect(msgs(ex({ sets: [{ reps: 0 }] }))).toEqual([
      'Serie 1: las repeticiones van de 1 a 100.',
    ]);
    expect(msgs(ex({ sets: [{ reps: 101 }] }))).toHaveLength(1);
    expect(msgs(ex({ sets: [{ reps: 7.5 }] }))).toHaveLength(1);
  });

  it('validates the optional reps range', () => {
    expect(msgs(ex({ sets: [{ reps: 8, repsMax: 10 }] }))).toEqual([]);
    expect(msgs(ex({ sets: [{ reps: 10, repsMax: 8 }] }))).toEqual([
      'Serie 1: el máximo del rango debe ser mayor que el mínimo.',
    ]);
  });

  it('validates weight range and 0,5 kg steps; empty means body weight', () => {
    expect(msgs(ex({ sets: [{ reps: 8 }] }))).toEqual([]);
    expect(msgs(ex({ sets: [{ reps: 8, weightKg: 62.5 }] }))).toEqual([]);
    expect(msgs(ex({ sets: [{ reps: 8, weightKg: 62.3 }] }))).toEqual([
      'Serie 1: el peso va en pasos de 0,5 kg.',
    ]);
    expect(msgs(ex({ sets: [{ reps: 8, weightKg: -5 }] }))).toEqual([
      `Serie 1: el peso va de 0 a ${LIMITS.weightMax} kg.`,
    ]);
  });

  it('validates rests', () => {
    expect(msgs(ex({ restBetweenSetsS: -1 }))).toEqual([
      `El descanso entre series va de 0 a ${LIMITS.restMaxS} s.`,
    ]);
    expect(msgs(ex({ restAfterExerciseS: LIMITS.restMaxS + 1 }))).toEqual([
      `El descanso tras el ejercicio va de 0 a ${LIMITS.restMaxS} s.`,
    ]);
  });

  it('limits the number of sets', () => {
    const sets = Array.from({ length: LIMITS.setsMax + 1 }, () => ({ reps: 5 }));
    expect(msgs(ex({ sets }))).toEqual([`Máximo ${LIMITS.setsMax} series por ejercicio.`]);
  });
});

describe('validateCustomExercise', () => {
  it('requires a name, a muscle group and equipment', () => {
    expect(
      validateCustomExercise({ name: '', primaryMuscle: undefined, equipment: undefined }),
    ).toEqual([
      'Escribe el nombre del ejercicio.',
      'Elige el grupo muscular.',
      'Elige el material.',
    ]);
    expect(
      validateCustomExercise({ name: 'Press Larsen', primaryMuscle: 'pecho', equipment: 'barra' }),
    ).toEqual([]);
  });
});
