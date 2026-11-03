import { BUILT_IN_EXERCISES } from '@/data/exercises';
import { formatSet, lastPerformance, topSet } from '@/domain/history';
import { addExercise, updateExercise } from '@/domain/routineEditing';

import { createAppStore, memoryStorage, STORAGE_KEY, transitionTarget } from './appStore';

jest.mock('@/services/notifications', () => ({
  cancelRestEnd: jest.fn(async () => undefined),
  scheduleRestEnd: jest.fn(async () => null),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const byId = (id: string) => BUILT_IN_EXERCISES.find((e) => e.id === id)!;
let counter = 0;
const id = () => `t${++counter}`;

function buildChestRoutine(store: ReturnType<typeof createAppStore>) {
  const s = store.getState();
  s.openDraft(null, 'muscle');
  s.updateDraft((r) => ({ ...r, name: 'Mi rutina' }));
  const sessionId = store.getState().draft!.routine.sessions[0]!.id;
  for (const ex of [
    'press-banca',
    'press-inclinado-mancuernas',
    'fondos',
    'extension-triceps-polea',
  ]) {
    s.updateDraft((r) => addExercise(r, sessionId, byId(ex), id));
  }
  return sessionId;
}

/** Completes the whole active workout only with "HECHO" and "SALTAR". */
function trainOnlyDoneAndSkip(store: ReturnType<typeof createAppStore>, t0: number) {
  let t = t0;
  for (let guard = 0; guard < 200; guard++) {
    const phase = store.getState().active!.machine.phase;
    if (phase.type === 'finished') return;
    t += 1000;
    if (phase.type === 'resting') {
      store.getState().dispatch({ type: 'SKIP_REST', now: t });
      continue;
    }
    if (phase.type === 'performing') {
      const set =
        store.getState().active!.machine.workout.exercises[phase.exerciseIndex]!.sets[
          phase.setIndex
        ]!;
      store.getState().dispatch({
        type: 'COMPLETE_SET',
        reps: set.reps,
        weightKg: set.weightKg ?? null,
        now: t,
      });
    }
  }
  throw new Error('workout did not finish');
}

describe('app store', () => {
  it('validates the draft before saving and keeps it on errors', () => {
    const store = createAppStore(memoryStorage());
    store.getState().openDraft(null, 'muscle');
    const errors = store.getState().saveDraft();
    expect(errors.map((e) => e.message)).toEqual(
      expect.arrayContaining(['Ponle un nombre a la rutina.']),
    );
    expect(store.getState().draft).not.toBeNull();
  });

  it('acceptance: create routine → train with HECHO/SALTAR → summary → "la última vez"', () => {
    const store = createAppStore(memoryStorage());
    const sessionId = buildChestRoutine(store);
    // Customise the bench press plan: 4 × 8 × 60 kg.
    store.getState().updateDraft((r) => {
      const ex = r.sessions[0]!.exercises[0]!;
      return updateExercise(r, sessionId, ex.id, {
        sets: Array.from({ length: 4 }, () => ({ reps: 8, weightKg: 60 })),
        restBetweenSetsS: 120,
      });
    });
    expect(store.getState().saveDraft()).toEqual([]);
    const routine = store.getState().routines[0]!;
    expect(routine.name).toBe('Mi rutina');

    expect(store.getState().startWorkout(routine.id, sessionId)).toBe(true);
    // Adjust the first set: 62,5 kg × 7.
    store.getState().dispatch({ type: 'COMPLETE_SET', reps: 7, weightKg: 62.5, now: 10_000 });
    expect(store.getState().active!.machine.phase).toMatchObject({
      type: 'resting',
      durationS: 120,
    });
    trainOnlyDoneAndSkip(store, 11_000);
    store.getState().saveWorkout();

    const { history, active } = store.getState();
    expect(active).toBeNull();
    expect(history).toHaveLength(1);
    const last = lastPerformance(history, 'press-banca');
    expect(last?.sets[0]).toEqual({ reps: 7, weightKg: 62.5 });
    expect(formatSet(topSet(last!.sets)!)).toBe('62,5 kg × 7');
  });

  it('editing a routine later does not alter the recorded history', () => {
    const store = createAppStore(memoryStorage());
    const sessionId = buildChestRoutine(store);
    store.getState().saveDraft();
    const routine = store.getState().routines[0]!;
    store.getState().startWorkout(routine.id, sessionId);
    trainOnlyDoneAndSkip(store, 0);
    store.getState().saveWorkout();

    store.getState().openDraft(routine.id);
    store.getState().updateDraft((r) => ({
      ...r,
      name: 'Renombrada',
      sessions: [{ ...r.sessions[0]!, exercises: [r.sessions[0]!.exercises[0]!] }],
    }));
    store.getState().saveDraft();
    const w = store.getState().history[0]!;
    expect(w.routineName).toBe('Mi rutina');
    expect(w.exercises).toHaveLength(4);
  });

  it('flags a transition when the workout moves to the next exercise', () => {
    expect(
      transitionTarget(
        {
          type: 'resting',
          kind: 'afterExercise',
          startedAt: 0,
          endsAt: 1,
          durationS: 1,
          next: { exerciseIndex: 1, setIndex: 0 },
        },
        { type: 'performing', exerciseIndex: 1, setIndex: 0 },
        null,
      ),
    ).toBe(1);
    expect(
      transitionTarget(
        {
          type: 'resting',
          kind: 'betweenSets',
          startedAt: 0,
          endsAt: 1,
          durationS: 1,
          next: { exerciseIndex: 0, setIndex: 1 },
        },
        { type: 'performing', exerciseIndex: 0, setIndex: 1 },
        null,
      ),
    ).toBeNull();
    expect(
      transitionTarget(
        { type: 'performing', exerciseIndex: 0, setIndex: 2 },
        { type: 'performing', exerciseIndex: 1, setIndex: 0 },
        null,
      ),
    ).toBe(1);
  });

  it('persists every action and restores the rest timer from endsAt', async () => {
    const storage = memoryStorage();
    const store = createAppStore(storage);
    const sessionId = buildChestRoutine(store);
    store.getState().saveDraft();
    const routine = store.getState().routines[0]!;
    store.getState().startWorkout(routine.id, sessionId);
    const t = Date.now();
    store.getState().dispatch({ type: 'COMPLETE_SET', reps: 10, weightKg: 20, now: t });
    const saved = JSON.parse((await storage.getItem(STORAGE_KEY)) as string);
    expect(saved.state.active.machine.phase).toMatchObject({ type: 'resting', endsAt: t + 90_000 });

    // "Reopen the app": a new store on the same storage sees the same endsAt.
    const reopened = createAppStore(storage);
    await reopened.persist.rehydrate();
    expect(reopened.getState().active!.machine.phase).toMatchObject({
      type: 'resting',
      endsAt: t + 90_000,
    });
  });

  it('cancels the pending rest notification when the workout is discarded', () => {
    const { cancelRestEnd } = jest.requireMock('@/services/notifications') as {
      cancelRestEnd: jest.Mock;
    };
    const store = createAppStore(memoryStorage());
    const sessionId = buildChestRoutine(store);
    store.getState().saveDraft();
    store.getState().startWorkout(store.getState().routines[0]!.id, sessionId);
    store.getState().setNotificationId('123:abc');
    store.getState().discardWorkout();
    expect(cancelRestEnd).toHaveBeenCalledWith('abc');
  });

  it('«Nueva rutina» resumes a pending new draft instead of wiping it', () => {
    const store = createAppStore(memoryStorage());
    store.getState().openDraft(null);
    store.getState().updateDraft((r) => ({ ...r, name: 'A medias' }));
    store.getState().openDraft(null);
    expect(store.getState().draft!.routine.name).toBe('A medias');
  });

  it('upserts one body metric per day', () => {
    const store = createAppStore(memoryStorage());
    store.getState().upsertBodyMetric('2026-11-03', { weightKg: 78.4 });
    store.getState().upsertBodyMetric('2026-11-03', { heightCm: 178 });
    store.getState().upsertBodyMetric('2026-11-01', { weightKg: 78.9 });
    expect(store.getState().bodyMetrics).toEqual([
      { date: '2026-11-01', weightKg: 78.9 },
      { date: '2026-11-03', weightKg: 78.4, heightCm: 178 },
    ]);
  });
});
