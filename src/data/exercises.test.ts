import { BUILT_IN_EXERCISES, filterExercises } from './exercises';

describe('catalog', () => {
  it('has ~30 exercises with unique ids covering every muscle group', () => {
    expect(BUILT_IN_EXERCISES.length).toBeGreaterThanOrEqual(30);
    const ids = BUILT_IN_EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const muscles = new Set(BUILT_IN_EXERCISES.map((e) => e.primaryMuscle));
    expect(muscles.size).toBe(10);
  });

  it('searches ignoring case and accents', () => {
    const names = filterExercises(BUILT_IN_EXERCISES, 'jalon', null).map((e) => e.id);
    expect(names).toEqual(['jalon-pecho']);
    expect(filterExercises(BUILT_IN_EXERCISES, 'TRÍCEPS polea', null).map((e) => e.id)).toEqual([
      'extension-triceps-polea',
    ]);
  });

  it('filters by primary or secondary muscle', () => {
    const triceps = filterExercises(BUILT_IN_EXERCISES, '', 'triceps').map((e) => e.id);
    expect(triceps).toContain('fondos');
    expect(triceps).toContain('press-banca');
  });
});
