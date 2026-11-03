import type { Exercise, Routine } from './types';
import {
  addExercise,
  addSession,
  defaultSessionExercise,
  duplicateExercise,
  duplicateRoutine,
  duplicateSession,
  isUniform,
  moveItem,
  newRoutine,
  removeExercise,
  removeSession,
  setOrganization,
  setUniformSets,
  updateExercise,
} from './routineEditing';

let n = 0;
const id = () => `id${++n}`;

const bench: Exercise = {
  id: 'press-banca',
  name: 'Press banca',
  primaryMuscle: 'pecho',
  secondaryMuscles: [],
  equipment: 'barra',
  illustrationKey: 'press-banca',
  isCustom: false,
};
const dips: Exercise = { ...bench, id: 'fondos', equipment: 'peso-corporal' };

function base(): Routine {
  n = 0;
  return newRoutine('muscle', { id, now: 1 });
}

describe('routineEditing', () => {
  it('creates a routine with one suggested session for its organization', () => {
    const r = base();
    expect(r).toMatchObject({ name: '', organization: 'muscle', createdAt: 1, updatedAt: 1 });
    expect(r.sessions.map((s) => s.name)).toEqual(['Pecho y tríceps']);
  });

  it('adds sessions with the next suggested name', () => {
    const r = addSession(base(), id);
    expect(r.sessions.map((s) => s.name)).toEqual(['Pecho y tríceps', 'Espalda y bíceps']);
  });

  it('renames default session names when the organization changes, keeping custom ones', () => {
    let r = addSession(base(), id);
    r = { ...r, sessions: [r.sessions[0]!, { ...r.sessions[1]!, name: 'Mi espalda' }] };
    r = setOrganization(r, 'days');
    expect(r.sessions.map((s) => s.name)).toEqual(['Día 1', 'Mi espalda']);
  });

  it('uses sensible defaults depending on the equipment', () => {
    expect(defaultSessionExercise(bench, id)).toMatchObject({
      sets: [
        { reps: 10, weightKg: 20 },
        { reps: 10, weightKg: 20 },
        { reps: 10, weightKg: 20 },
      ],
      restBetweenSetsS: 90,
      restAfterExerciseS: 120,
    });
    expect(defaultSessionExercise(dips, id).sets[0]!.weightKg).toBeUndefined();
  });

  it('adds, updates, duplicates, moves and removes exercises immutably', () => {
    const r0 = base();
    const sid = r0.sessions[0]!.id;
    let r = addExercise(r0, sid, bench, id);
    r = addExercise(r, sid, dips, id);
    expect(r0.sessions[0]!.exercises).toHaveLength(0);

    const [a, b] = r.sessions[0]!.exercises;
    r = updateExercise(r, sid, a!.id, { notes: 'Codos a 45°' });
    r = duplicateExercise(r, sid, a!.id, id);
    expect(r.sessions[0]!.exercises.map((e) => e.exerciseId)).toEqual([
      'press-banca',
      'press-banca',
      'fondos',
    ]);
    expect(r.sessions[0]!.exercises[1]!.notes).toBe('Codos a 45°');
    expect(r.sessions[0]!.exercises[1]!.id).not.toBe(a!.id);

    r = {
      ...r,
      sessions: [{ ...r.sessions[0]!, exercises: moveItem(r.sessions[0]!.exercises, 2, -2) }],
    };
    expect(r.sessions[0]!.exercises[0]!.id).toBe(b!.id);

    r = removeExercise(r, sid, b!.id);
    expect(r.sessions[0]!.exercises.map((e) => e.exerciseId)).toEqual([
      'press-banca',
      'press-banca',
    ]);
  });

  it('moveItem clamps to the list bounds', () => {
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c']);
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, 5)).toEqual(['a', 'b', 'c']);
  });

  it('duplicates and removes sessions', () => {
    let r = addExercise(base(), 'id2', bench, id);
    r = duplicateSession(r, r.sessions[0]!.id, id);
    expect(r.sessions.map((s) => s.name)).toEqual(['Pecho y tríceps', 'Pecho y tríceps (copia)']);
    expect(r.sessions[1]!.exercises[0]!.id).not.toBe(r.sessions[0]!.exercises[0]!.id);
    r = removeSession(r, r.sessions[0]!.id);
    expect(r.sessions).toHaveLength(1);
  });

  it('duplicates a routine with new ids everywhere', () => {
    const r = addExercise(base(), 'id2', bench, id);
    const copy = duplicateRoutine(r, { id, now: 5 });
    expect(copy.name).toBe('(copia)');
    expect(copy.id).not.toBe(r.id);
    expect(copy.sessions[0]!.id).not.toBe(r.sessions[0]!.id);
    expect(copy.createdAt).toBe(5);
  });

  it('sets uniform sets and detects them', () => {
    const r = addExercise(base(), 'id2', bench, id);
    const ex = r.sessions[0]!.exercises[0]!;
    const sets = setUniformSets(5, { reps: 5, weightKg: 80 });
    expect(sets).toHaveLength(5);
    expect(isUniform(sets)).toBe(true);
    expect(isUniform([...sets.slice(0, 4), { reps: 3, weightKg: 85 }])).toBe(false);
    expect(isUniform(ex.sets)).toBe(true);
  });
});
