import { exerciseLog, setLog, workout } from './__fixtures__';
import {
  completedSetCount,
  formatSet,
  improvements,
  lastPerformance,
  topSet,
  totalPlannedSets,
  workoutVolume,
} from './history';

const DAY = 86_400_000;

const history = [
  workout('old', 1 * DAY, [exerciseLog('press-banca', [setLog(8, 65), setLog(8, 65)])], {
    finishedAt: 1 * DAY + 3600_000,
  }),
  workout(
    'recent',
    5 * DAY,
    [
      exerciseLog('press-banca', [setLog(8, 70), setLog(6, 70), setLog(10, 60)]),
      exerciseLog('fondos', [setLog(12), setLog(10)]),
    ],
    { finishedAt: 5 * DAY + 3600_000 },
  ),
  // An unfinished workout must not count as "la última vez".
  workout('in-progress', 9 * DAY, [exerciseLog('press-banca', [setLog(1, 200)])]),
];

describe('lastPerformance', () => {
  it('returns the most recent finished workout that included the exercise', () => {
    const last = lastPerformance(history, 'press-banca');
    expect(last?.workoutId).toBe('recent');
    expect(last?.sets).toHaveLength(3);
  });

  it('ignores skipped sets and workouts where every set was skipped', () => {
    const h = [
      ...history,
      workout(
        'skipped',
        7 * DAY,
        [exerciseLog('press-banca', [setLog(8, 90, { skipped: true })])],
        {
          finishedAt: 7 * DAY,
        },
      ),
    ];
    expect(lastPerformance(h, 'press-banca')?.workoutId).toBe('recent');
  });

  it('can exclude the current workout and look only before a time', () => {
    expect(lastPerformance(history, 'press-banca', { before: 5 * DAY })?.workoutId).toBe('old');
    expect(lastPerformance(history, 'press-banca', { excludeId: 'recent' })?.workoutId).toBe('old');
  });

  it('returns null when the exercise was never done', () => {
    expect(lastPerformance(history, 'sentadilla')).toBeNull();
  });
});

describe('topSet / formatSet', () => {
  it('picks the heaviest set, then the one with most reps', () => {
    expect(topSet([setLog(8, 70), setLog(6, 70), setLog(10, 60)])).toMatchObject({
      weightKg: 70,
      reps: 8,
    });
    expect(topSet([setLog(12), setLog(15)])).toMatchObject({ reps: 15 });
    expect(topSet([])).toBeNull();
  });

  it('formats with Spanish decimal comma and body weight', () => {
    expect(formatSet({ weightKg: 70, reps: 8 })).toBe('70 kg × 8');
    expect(formatSet({ weightKg: 62.5, reps: 10 })).toBe('62,5 kg × 10');
    expect(formatSet({ reps: 12 })).toBe('Peso corporal × 12');
  });
});

describe('volume and counts', () => {
  it('sums weight × reps of completed sets only', () => {
    const w = workout('w', 0, [
      exerciseLog('a', [setLog(8, 70), setLog(6, 70), setLog(10, 60, { skipped: true })]),
      exerciseLog('b', [setLog(12)]),
    ]);
    expect(workoutVolume(w)).toBe(8 * 70 + 6 * 70);
    expect(completedSetCount(w)).toBe(3);
    expect(totalPlannedSets(w)).toBe(4);
  });
});

describe('improvements', () => {
  it('reports exercises whose top set beat the previous session', () => {
    const current = workout(
      'now',
      10 * DAY,
      [
        exerciseLog('press-banca', [setLog(8, 72.5)]), // heavier
        exerciseLog('fondos', [setLog(12)]), // equal → not an improvement
      ],
      { finishedAt: 10 * DAY },
    );
    expect(improvements(current, [...history, current])).toEqual([
      {
        exerciseId: 'press-banca',
        name: 'press-banca',
        previous: { weightKg: 70, reps: 8 },
        current: { weightKg: 72.5, reps: 8 },
      },
    ]);
  });

  it('counts more reps at the same weight as an improvement', () => {
    const current = workout('now', 10 * DAY, [exerciseLog('fondos', [setLog(14)])]);
    expect(improvements(current, history).map((i) => i.exerciseId)).toEqual(['fondos']);
  });
});
