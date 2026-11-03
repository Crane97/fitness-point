import { describeSets } from './describe';

describe('describeSets', () => {
  it('summarises uniform and custom sets', () => {
    expect(
      describeSets([
        { reps: 8, repsMax: 10, weightKg: 60 },
        { reps: 8, repsMax: 10, weightKg: 60 },
      ]),
    ).toBe('2 × 8-10 · 60 kg');
    expect(describeSets([{ reps: 10 }, { reps: 10 }, { reps: 10 }])).toBe('3 × 10 · Peso corporal');
    expect(
      describeSets([
        { reps: 10, weightKg: 60 },
        { reps: 6, weightKg: 72.5 },
      ]),
    ).toBe('2 series · 60–72,5 kg');
    expect(describeSets([])).toBe('Sin series');
  });
});
