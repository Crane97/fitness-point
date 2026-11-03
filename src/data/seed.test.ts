import { isValidRoutine } from '@/domain/routineValidation';
import { completedSetCount } from '@/domain/history';

import { demoBodyMetrics, demoHistory, demoRoutines } from './seed';

const NOW = new Date(2026, 10, 3, 10, 0).getTime();

describe('demo seed', () => {
  const routines = demoRoutines(NOW);
  const history = demoHistory(NOW, routines);

  it('has one routine by muscle group and one by days, all valid', () => {
    expect(routines.map((r) => r.organization).sort()).toEqual(['days', 'muscle']);
    for (const r of routines) expect(isValidRoutine({ ...r })).toBe(true);
  });

  it('has four weeks of finished workouts, sorted and fully completed', () => {
    expect(history.length).toBeGreaterThanOrEqual(12);
    expect(history.every((w) => w.finishedAt !== undefined)).toBe(true);
    const span = history.at(-1)!.startedAt - history[0]!.startedAt;
    expect(span).toBeGreaterThan(20 * 86_400_000);
    for (const w of history) expect(completedSetCount(w)).toBeGreaterThan(0);
  });

  it('is deterministic', () => {
    expect(JSON.stringify(demoHistory(NOW, demoRoutines(NOW)))).toBe(JSON.stringify(history));
    expect(demoBodyMetrics(NOW)).toEqual(demoBodyMetrics(NOW));
  });
});
