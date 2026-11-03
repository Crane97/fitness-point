/** Pure, immutable edits on a routine draft. */
import { suggestedSessionName } from './planning';
import type {
  Equipment,
  Exercise,
  Organization,
  Routine,
  Session,
  SessionExercise,
  SetTemplate,
} from './types';

export type IdFn = () => string;

export const DEFAULT_REST_BETWEEN_S = 90;
export const DEFAULT_REST_AFTER_S = 120;
export const REST_PRESETS_S = [30, 60, 90, 120, 180] as const;

const DEFAULT_WEIGHT: Record<Equipment, number | undefined> = {
  barra: 20,
  mancuernas: 10,
  maquina: 20,
  polea: 15,
  'peso-corporal': undefined,
};

export function newRoutine(org: Organization, opts: { id: IdFn; now: number }): Routine {
  return {
    id: opts.id(),
    name: '',
    organization: org,
    sessions: [{ id: opts.id(), name: suggestedSessionName(org, 0), exercises: [] }],
    createdAt: opts.now,
    updatedAt: opts.now,
  };
}

export function moveItem<T>(list: readonly T[], index: number, delta: number): T[] {
  const to = index + delta;
  if (index < 0 || index >= list.length || to < 0 || to >= list.length) return [...list];
  const copy = [...list];
  const [item] = copy.splice(index, 1);
  copy.splice(to, 0, item as T);
  return copy;
}

function mapSession(r: Routine, sessionId: string, fn: (s: Session) => Session): Routine {
  return { ...r, sessions: r.sessions.map((s) => (s.id === sessionId ? fn(s) : s)) };
}

export function addSession(r: Routine, id: IdFn): Routine {
  const name = suggestedSessionName(r.organization, r.sessions.length);
  return { ...r, sessions: [...r.sessions, { id: id(), name, exercises: [] }] };
}

export function renameSession(r: Routine, sessionId: string, name: string): Routine {
  return mapSession(r, sessionId, (s) => ({ ...s, name }));
}

function cloneSession(s: Session, id: IdFn, name = s.name): Session {
  return {
    id: id(),
    name,
    exercises: s.exercises.map((e) => ({ ...e, id: id(), sets: e.sets.map((t) => ({ ...t })) })),
  };
}

export function duplicateSession(r: Routine, sessionId: string, id: IdFn): Routine {
  const i = r.sessions.findIndex((s) => s.id === sessionId);
  if (i < 0) return r;
  const copy = cloneSession(r.sessions[i]!, id, `${r.sessions[i]!.name} (copia)`);
  const sessions = [...r.sessions];
  sessions.splice(i + 1, 0, copy);
  return { ...r, sessions };
}

export function removeSession(r: Routine, sessionId: string): Routine {
  return { ...r, sessions: r.sessions.filter((s) => s.id !== sessionId) };
}

export function moveSession(r: Routine, sessionId: string, delta: number): Routine {
  const i = r.sessions.findIndex((s) => s.id === sessionId);
  return { ...r, sessions: moveItem(r.sessions, i, delta) };
}

/** Changing the mode renames sessions that still carry a suggested name of the old mode. */
export function setOrganization(r: Routine, org: Organization): Routine {
  return {
    ...r,
    organization: org,
    sessions: r.sessions.map((s, i) =>
      s.name === suggestedSessionName(r.organization, i)
        ? { ...s, name: suggestedSessionName(org, i) }
        : s,
    ),
  };
}

export function setUniformSets(count: number, template: SetTemplate): SetTemplate[] {
  return Array.from({ length: Math.max(0, count) }, () => ({ ...template }));
}

export function isUniform(sets: readonly SetTemplate[]): boolean {
  const [first] = sets;
  return sets.every(
    (s) => s.reps === first?.reps && s.repsMax === first?.repsMax && s.weightKg === first?.weightKg,
  );
}

export function defaultSessionExercise(ex: Exercise, id: IdFn): SessionExercise {
  const weightKg = DEFAULT_WEIGHT[ex.equipment];
  return {
    id: id(),
    exerciseId: ex.id,
    sets: setUniformSets(3, weightKg === undefined ? { reps: 10 } : { reps: 10, weightKg }),
    restBetweenSetsS: DEFAULT_REST_BETWEEN_S,
    restAfterExerciseS: DEFAULT_REST_AFTER_S,
    notes: '',
  };
}

export function addExercise(r: Routine, sessionId: string, ex: Exercise, id: IdFn): Routine {
  return mapSession(r, sessionId, (s) => ({
    ...s,
    exercises: [...s.exercises, defaultSessionExercise(ex, id)],
  }));
}

export function updateExercise(
  r: Routine,
  sessionId: string,
  instanceId: string,
  patch: Partial<Omit<SessionExercise, 'id' | 'exerciseId'>>,
): Routine {
  return mapSession(r, sessionId, (s) => ({
    ...s,
    exercises: s.exercises.map((e) => (e.id === instanceId ? { ...e, ...patch } : e)),
  }));
}

export function duplicateExercise(
  r: Routine,
  sessionId: string,
  instanceId: string,
  id: IdFn,
): Routine {
  return mapSession(r, sessionId, (s) => {
    const i = s.exercises.findIndex((e) => e.id === instanceId);
    if (i < 0) return s;
    const src = s.exercises[i]!;
    const exercises = [...s.exercises];
    exercises.splice(i + 1, 0, { ...src, id: id(), sets: src.sets.map((t) => ({ ...t })) });
    return { ...s, exercises };
  });
}

export function removeExercise(r: Routine, sessionId: string, instanceId: string): Routine {
  return mapSession(r, sessionId, (s) => ({
    ...s,
    exercises: s.exercises.filter((e) => e.id !== instanceId),
  }));
}

export function moveExercise(
  r: Routine,
  sessionId: string,
  instanceId: string,
  delta: number,
): Routine {
  return mapSession(r, sessionId, (s) => ({
    ...s,
    exercises: moveItem(
      s.exercises,
      s.exercises.findIndex((e) => e.id === instanceId),
      delta,
    ),
  }));
}

export function duplicateRoutine(r: Routine, opts: { id: IdFn; now: number }): Routine {
  return {
    id: opts.id(),
    name: `${r.name} (copia)`.trim(),
    organization: r.organization,
    sessions: r.sessions.map((s) => cloneSession(s, opts.id)),
    createdAt: opts.now,
    updatedAt: opts.now,
  };
}
