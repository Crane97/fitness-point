/**
 * Deterministic demo data: two routines (by days and by muscle group), four weeks of
 * history with progressive overload and daily body metrics. Everything is derived from
 * `now`, so the same `now` always yields the same state.
 */
import { dateKey } from '@/domain/dates';
import { createWorkout } from '@/domain/planning';
import { createMachine, reduce, type MachineState } from '@/domain/sessionMachine';
import type {
  BodyMetric,
  Exercise,
  Routine,
  SessionExercise,
  SetTemplate,
  WorkoutSession,
} from '@/domain/types';

import { BUILT_IN_EXERCISES } from './exercises';

const DAY = 86_400_000;
const CATALOG: Record<string, Exercise> = Object.fromEntries(
  BUILT_IN_EXERCISES.map((e) => [e.id, e]),
);

function sets(n: number, reps: number, weightKg?: number, repsMax?: number): SetTemplate[] {
  return Array.from({ length: n }, () => ({
    reps,
    ...(repsMax !== undefined ? { repsMax } : {}),
    ...(weightKg !== undefined ? { weightKg } : {}),
  }));
}

function ex(
  id: string,
  exerciseId: string,
  s: SetTemplate[],
  rest: [number, number] = [90, 120],
  notes = '',
): SessionExercise {
  return { id, exerciseId, sets: s, restBetweenSetsS: rest[0], restAfterExerciseS: rest[1], notes };
}

export function demoRoutines(now: number): Routine[] {
  const created = now - 40 * DAY;
  return [
    {
      id: 'r-grupos',
      name: 'Hipertrofia otoño',
      organization: 'muscle',
      createdAt: created,
      updatedAt: created,
      sessions: [
        {
          id: 's-pecho',
          name: 'Pecho y tríceps',
          exercises: [
            ex(
              'e-pb',
              'press-banca',
              [
                { reps: 10, weightKg: 60 },
                { reps: 8, weightKg: 65 },
                { reps: 6, weightKg: 70 },
                { reps: 6, weightKg: 70 },
              ],
              [120, 150],
              'Escápulas atrás, pies firmes.',
            ),
            ex('e-pi', 'press-inclinado-mancuernas', sets(3, 8, 24, 10), [90, 120]),
            ex('e-ap', 'aperturas-mancuernas', sets(3, 12, 14), [60, 90]),
            ex('e-fo', 'fondos', sets(3, 10), [90, 90]),
            ex('e-tp', 'extension-triceps-polea', sets(3, 12, 25), [60, 60]),
          ],
        },
        {
          id: 's-espalda',
          name: 'Espalda y bíceps',
          exercises: [
            ex('e-do', 'dominadas', sets(4, 8), [120, 120]),
            ex('e-rb', 'remo-barra', sets(4, 8, 60), [90, 120]),
            ex('e-jp', 'jalon-pecho', sets(3, 10, 50, 12), [90, 90]),
            ex('e-cb', 'curl-barra', sets(3, 10, 30), [60, 90]),
            ex('e-cm', 'curl-martillo', sets(3, 12, 14), [60, 60]),
          ],
        },
        {
          id: 's-pierna',
          name: 'Pierna',
          exercises: [
            ex('e-se', 'sentadilla', sets(4, 6, 90), [180, 150], 'Profundidad paralela.'),
            ex('e-pr', 'prensa', sets(3, 12, 160), [120, 120]),
            ex('e-pm', 'peso-muerto-rumano', sets(3, 10, 70), [120, 120]),
            ex('e-ec', 'extension-cuadriceps', sets(3, 15, 45), [60, 60]),
            ex('e-eg', 'elevacion-gemelos', sets(4, 15, 60), [45, 60]),
          ],
        },
      ],
    },
    {
      id: 'r-dias',
      name: 'Fuerza 5×5',
      organization: 'days',
      createdAt: created,
      updatedAt: created,
      sessions: [
        {
          id: 's-dia1',
          name: 'Día 1',
          exercises: [
            ex('d1-se', 'sentadilla', sets(5, 5, 100), [180, 180]),
            ex('d1-pb', 'press-banca', sets(5, 5, 75), [180, 180]),
            ex('d1-rb', 'remo-barra', sets(5, 5, 65), [150, 120]),
          ],
        },
        {
          id: 's-dia2',
          name: 'Día 2',
          exercises: [
            ex('d2-se', 'sentadilla', sets(5, 5, 100), [180, 180]),
            ex('d2-pm', 'press-militar', sets(5, 5, 45), [180, 180]),
            ex('d2-pd', 'peso-muerto', sets(1, 5, 130), [180, 120]),
            ex('d2-pl', 'plancha', sets(3, 45), [60, 0], 'Reps = segundos.'),
          ],
        },
      ],
    },
  ];
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function startOfDay(t: number): number {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Simulates a full workout with the real state machine, so seeds match real data. */
function simulate(
  routine: Routine,
  sessionId: string,
  startedAt: number,
  progress: number,
  rand: () => number,
): WorkoutSession {
  let s: MachineState = createMachine(
    createWorkout(routine, sessionId, CATALOG, {
      id: `w-${sessionId}-${startedAt}`,
      now: startedAt,
    }),
  );
  let t = startedAt;
  s = reduce(s, { type: 'START', now: t });
  while (s.phase.type === 'performing') {
    const { exerciseIndex, setIndex } = s.phase;
    const planned = s.workout.exercises[exerciseIndex]!.sets[setIndex]!;
    const w = planned.plannedWeightKg;
    // Weeks before today the weights were lower (progressive overload).
    const weight = w === undefined ? null : Math.max(0, Math.round((w - progress * 2.5) * 2) / 2);
    const reps = Math.max(1, planned.plannedReps - (rand() < 0.2 ? 1 : 0));
    t += 40_000 + Math.floor(rand() * 15_000);
    s = reduce(s, { type: 'COMPLETE_SET', reps, weightKg: weight, now: t });
    if (s.phase.type === 'resting') {
      t = s.phase.endsAt + Math.floor(rand() * 10_000);
      s = reduce(s, { type: 'TICK', now: t });
    }
  }
  return s.workout;
}

export function demoHistory(now: number, routines: Routine[]): WorkoutSession[] {
  const rand = rng(42);
  const routine = routines[0]!;
  const today = startOfDay(now);
  const out: WorkoutSession[] = [];
  // Mon / Wed / Fri-like pattern over the last 4 weeks, rotating the three sessions.
  const offsets = [27, 25, 23, 20, 18, 16, 13, 11, 9, 6, 4, 2];
  offsets.forEach((daysAgo, i) => {
    const session = routine.sessions[i % routine.sessions.length]!;
    const startedAt = today - daysAgo * DAY + 18 * 3_600_000 + Math.floor(rand() * 1_800_000);
    const weeksAgo = Math.floor(daysAgo / 7);
    out.push(simulate(routine, session.id, startedAt, weeksAgo, rand));
  });
  // A couple of sessions of the 5×5 routine too.
  out.push(simulate(routines[1]!, 's-dia1', today - 22 * DAY + 10 * 3_600_000, 3, rand));
  out.push(simulate(routines[1]!, 's-dia2', today - 15 * DAY + 10 * 3_600_000, 2, rand));
  return out.sort((a, b) => a.startedAt - b.startedAt);
}

export function demoBodyMetrics(now: number): BodyMetric[] {
  const rand = rng(7);
  const today = startOfDay(now);
  const out: BodyMetric[] = [];
  for (let daysAgo = 28; daysAgo >= 1; daysAgo -= 2) {
    const trend = 80.2 - ((28 - daysAgo) / 28) * 1.6;
    const weightKg = Math.round((trend + (rand() - 0.5) * 0.6) * 10) / 10;
    out.push({
      date: dateKey(today - daysAgo * DAY),
      weightKg,
      ...(daysAgo === 28 ? { heightCm: 178 } : {}),
    });
  }
  return out;
}
