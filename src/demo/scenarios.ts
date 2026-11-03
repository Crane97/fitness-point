/**
 * Demo scenarios loaded with `?demo=<scenario>`. Each one is a deterministic state built
 * from `now`, used for screenshots and E2E. Demo state lives only in memory.
 */
import { BUILT_IN_EXERCISES } from '@/data/exercises';
import { demoBodyMetrics, demoHistory, demoRoutines } from '@/data/seed';
import { createWorkout } from '@/domain/planning';
import { createMachine, reduce, type MachineState } from '@/domain/sessionMachine';
import type { PersistedState } from '@/store/schema';

export const SCENARIOS = [
  'inicio',
  'vacio',
  'editor',
  'activa',
  'descanso',
  'transicion',
  'resumen',
] as const;
export type Scenario = (typeof SCENARIOS)[number];

export function parseScenario(value: unknown): Scenario | null {
  return typeof value === 'string' && (SCENARIOS as readonly string[]).includes(value)
    ? (value as Scenario)
    : null;
}

const CATALOG = Object.fromEntries(BUILT_IN_EXERCISES.map((e) => [e.id, e]));
const MIN = 60_000;

function base(now: number): PersistedState {
  const routines = demoRoutines(now);
  return {
    profile: { name: 'Álex' },
    settings: { keepAwake: true, sound: true, haptics: true },
    routines,
    customExercises: [],
    draft: null,
    history: demoHistory(now, routines),
    bodyMetrics: demoBodyMetrics(now),
    active: null,
  };
}

/**
 * Plays the "Pecho y tríceps" session completing `sets` sets, ending at `now`.
 * `bump` adds kg to every completed set (to show improvements in the summary).
 */
function playChest(state: PersistedState, now: number, sets: number, bump = 0): MachineState {
  const routine = state.routines.find((r) => r.id === 'r-grupos')!;
  const workout = createWorkout(routine, 's-pecho', CATALOG, { id: 'w-demo', now: 0 });
  const total = workout.exercises.reduce((n, e) => n + e.sets.length, 0);
  // ~2,6 min per set (work + rest), ending just before `now`.
  const step = Math.round(2.6 * MIN);
  const startedAt = now - Math.min(sets, total) * step - 30_000;
  let m = reduce(createMachine(workout), { type: 'START', now: startedAt });
  let t = startedAt;
  for (let i = 0; i < sets && m.phase.type === 'performing'; i++) {
    const p = m.workout.exercises[m.phase.exerciseIndex]!.sets[m.phase.setIndex]!;
    t += step;
    const w = p.plannedWeightKg;
    m = reduce(m, {
      type: 'COMPLETE_SET',
      reps: p.plannedReps,
      weightKg: w === undefined ? null : w + bump,
      now: t,
    });
    if (m.phase.type === 'resting' && i < sets - 1) m = reduce(m, { type: 'SKIP_REST', now: t });
  }
  return m;
}

export function buildScenario(name: Scenario, now: number): PersistedState {
  if (name === 'vacio') {
    return { ...base(now), routines: [], history: [], bodyMetrics: [], profile: { name: 'Álex' } };
  }
  const s = base(now);
  switch (name) {
    case 'inicio':
      return s;
    case 'editor': {
      const r = s.routines.find((x) => x.id === 'r-grupos')!;
      return { ...s, draft: { routine: structuredClone(r), sourceId: r.id } };
    }
    case 'activa': {
      // Exercise 2/5, set 2/3 in progress (4 + 1 sets done, rest skipped).
      let m = playChest(s, now - 30_000, 5);
      if (m.phase.type === 'resting') m = reduce(m, { type: 'SKIP_REST', now: now - 30_000 });
      return { ...s, active: { machine: m, transitionTo: null, notificationId: null } };
    }
    case 'descanso': {
      // Just completed set 2/3 of exercise 2: 1:14 left of a 1:30 rest.
      let m = playChest(s, now - 16_000, 6);
      if (m.phase.type === 'resting') {
        m = { ...m, phase: { ...m.phase, startedAt: now - 16_000, endsAt: now + 74_000 } };
      }
      return { ...s, active: { machine: m, transitionTo: null, notificationId: null } };
    }
    case 'transicion': {
      let m = playChest(s, now - 2_000, 7);
      if (m.phase.type === 'resting') m = reduce(m, { type: 'SKIP_REST', now: now - 1_000 });
      return { ...s, active: { machine: m, transitionTo: 2, notificationId: null } };
    }
    case 'resumen': {
      const m = playChest(s, now, 99, 2.5);
      return { ...s, active: { machine: m, transitionTo: null, notificationId: null } };
    }
  }
}

/** Reads `?demo=` from the URL on web. Native builds never start in demo mode. */
export function scenarioFromLocation(): Scenario | null {
  const loc = (globalThis as { location?: { search?: string } }).location;
  if (!loc?.search) return null;
  try {
    return parseScenario(new URLSearchParams(loc.search).get('demo'));
  } catch {
    return null;
  }
}
