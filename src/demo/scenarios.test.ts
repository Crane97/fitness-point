import { buildScenario, parseScenario, SCENARIOS } from './scenarios';

const NOW = new Date(2026, 10, 3, 10, 0).getTime();

describe('demo scenarios', () => {
  it('only accepts whitelisted names', () => {
    expect(parseScenario('activa')).toBe('activa');
    expect(parseScenario('<script>')).toBeNull();
    expect(parseScenario(undefined)).toBeNull();
  });

  it('builds every scenario deterministically', () => {
    for (const s of SCENARIOS) {
      expect(JSON.stringify(buildScenario(s, NOW))).toBe(JSON.stringify(buildScenario(s, NOW)));
    }
  });

  it('puts the workout in the expected phase', () => {
    expect(buildScenario('activa', NOW).active!.machine.phase).toEqual({
      type: 'performing',
      exerciseIndex: 1,
      setIndex: 1,
    });
    expect(buildScenario('descanso', NOW).active!.machine.phase).toMatchObject({
      type: 'resting',
      kind: 'betweenSets',
      endsAt: NOW + 74_000,
    });
    expect(buildScenario('transicion', NOW).active).toMatchObject({
      transitionTo: 2,
      machine: { phase: { type: 'performing', exerciseIndex: 2, setIndex: 0 } },
    });
    expect(buildScenario('resumen', NOW).active!.machine.phase.type).toBe('finished');
  });
});
