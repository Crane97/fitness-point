import { sanitizePersisted } from './schema';

const routine = {
  id: 'r1',
  name: 'Mi rutina',
  organization: 'muscle',
  sessions: [{ id: 's1', name: 'Pecho', exercises: [] }],
  createdAt: 1,
  updatedAt: 1,
};

describe('sanitizePersisted', () => {
  it('ignores non-object input', () => {
    expect(sanitizePersisted(null)).toEqual({});
    expect(sanitizePersisted('{"routines":[]}')).toEqual({});
  });

  it('keeps valid records and drops invalid ones', () => {
    const out = sanitizePersisted({
      routines: [routine, { ...routine, id: 'bad', organization: 'evil' }, 42],
      bodyMetrics: [
        { date: '2026-11-01', weightKg: 78.4 },
        { date: 'yesterday', weightKg: 1 },
      ],
    });
    expect(out.routines?.map((r) => r.id)).toEqual(['r1']);
    expect(out.bodyMetrics).toEqual([{ date: '2026-11-01', weightKg: 78.4 }]);
  });

  it('strips unknown keys (no prototype pollution through spread)', () => {
    const evil = JSON.parse(
      `{"routines":[${JSON.stringify(routine).slice(0, -1)},"__proto__":{"x":1},"admin":true}]}`,
    );
    const out = sanitizePersisted(evil);
    expect(out.routines?.[0]).not.toHaveProperty('admin');
    expect(({} as Record<string, unknown>).x).toBeUndefined();
  });

  it('forces customExercises to be flagged as custom', () => {
    const out = sanitizePersisted({
      customExercises: [
        {
          id: 'c1',
          name: 'Press Larsen',
          primaryMuscle: 'pecho',
          secondaryMuscles: [],
          equipment: 'barra',
          illustrationKey: 'generic-pecho',
          isCustom: false,
        },
      ],
    });
    expect(out.customExercises?.[0]?.isCustom).toBe(true);
  });

  it('drops a corrupted active workout instead of crashing', () => {
    expect(sanitizePersisted({ active: { machine: { phase: { type: 'resting' } } } })).toEqual({});
    expect(sanitizePersisted({ active: null })).toEqual({ active: null });
  });

  it('drops an active workout whose position points outside the workout', () => {
    const workout = {
      id: 'w',
      routineId: 'r',
      routineName: 'R',
      sessionId: 's',
      sessionName: 'S',
      startedAt: 0,
      exercises: [],
    };
    const active = {
      machine: { workout, phase: { type: 'performing', exerciseIndex: 3, setIndex: 0 } },
      transitionTo: null,
      notificationId: null,
    };
    expect(sanitizePersisted({ active })).toEqual({});
  });
});
