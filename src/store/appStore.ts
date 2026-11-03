/**
 * App store (Zustand + persist). Everything is local: one demo user, no backend.
 * State is saved after every action; on start it is re-validated (see schema.ts).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { BUILT_IN_EXERCISES, genericIllustrationKey } from '@/data/exercises';
import { uid } from '@/domain/id';
import { createWorkout } from '@/domain/planning';
import { duplicateRoutine, newRoutine } from '@/domain/routineEditing';
import {
  validateCustomExercise,
  validateRoutine,
  type CustomExerciseInput,
  type ValidationError,
} from '@/domain/routineValidation';
import { createMachine, reduce, type MachineEvent, type Phase } from '@/domain/sessionMachine';
import type { BodyMetric, Exercise, Organization, Routine } from '@/domain/types';
import { now } from '@/services/clock';

import { sanitizePersisted, type PersistedState } from './schema';

export const STORAGE_KEY = 'fitness-point/v1';

export interface AppState extends PersistedState {
  /* Rutinas y borrador */
  openDraft: (sourceId: string | null, org?: Organization) => void;
  updateDraft: (fn: (r: Routine) => Routine) => void;
  saveDraft: () => ValidationError[];
  discardDraft: () => void;
  duplicateRoutine: (id: string) => void;
  deleteRoutine: (id: string) => void;
  addCustomExercise: (input: CustomExerciseInput) => { exercise?: Exercise; errors: string[] };

  /* Entrenamiento */
  startWorkout: (routineId: string, sessionId: string) => boolean;
  dispatch: (event: MachineEvent) => void;
  clearTransition: () => void;
  setNotificationId: (id: string | null) => void;
  saveWorkout: () => void;
  discardWorkout: () => void;

  /* Perfil y ajustes */
  upsertBodyMetric: (date: string, patch: Omit<BodyMetric, 'date'>) => void;
  setSetting: (key: keyof PersistedState['settings'], value: boolean) => void;
  setProfileName: (name: string) => void;

  /* Demo */
  replaceAll: (state: PersistedState) => void;
}

export const INITIAL: PersistedState = {
  profile: { name: 'Atleta' },
  settings: { keepAwake: true, sound: true, haptics: true },
  routines: [],
  customExercises: [],
  draft: null,
  history: [],
  bodyMetrics: [],
  active: null,
};

/** In-memory storage: demo mode must never overwrite the user's real data. */
export function memoryStorage(): StateStorage {
  const data = new Map<string, string>();
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => {
      data.set(k, v);
    },
    removeItem: (k) => {
      data.delete(k);
    },
  };
}

/** Exercise index to announce with the transition screen when the workout moves to a new exercise. */
export function transitionTarget(prev: Phase, next: Phase, pending: number | null): number | null {
  if (next.type !== 'performing') return null;
  if (prev.type === 'resting' && prev.kind === 'afterExercise') return next.exerciseIndex;
  if (prev.type === 'performing' && prev.exerciseIndex !== next.exerciseIndex) {
    return next.exerciseIndex;
  }
  return pending;
}

export function createAppStore(storage: StateStorage) {
  return create<AppState>()(
    persist(
      (set, get) => ({
        ...INITIAL,

        openDraft: (sourceId, org = 'muscle') => {
          const { draft, routines } = get();
          if (draft && draft.sourceId === sourceId && sourceId !== null) return;
          if (sourceId === null) {
            set({ draft: { routine: newRoutine(org, { id: uid, now: now() }), sourceId: null } });
            return;
          }
          const src = routines.find((r) => r.id === sourceId);
          if (src) set({ draft: { routine: structuredClone(src), sourceId } });
        },

        updateDraft: (fn) => {
          const { draft } = get();
          if (draft)
            set({ draft: { ...draft, routine: { ...fn(draft.routine), updatedAt: now() } } });
        },

        saveDraft: () => {
          const { draft, routines } = get();
          if (!draft) return [];
          const routine = { ...draft.routine, name: draft.routine.name.trim() };
          const errors = validateRoutine(routine);
          if (errors.length > 0) return errors;
          const exists = routines.some((r) => r.id === routine.id);
          set({
            routines: exists
              ? routines.map((r) => (r.id === routine.id ? routine : r))
              : [...routines, routine],
            draft: null,
          });
          return [];
        },

        discardDraft: () => set({ draft: null }),

        duplicateRoutine: (id) => {
          const src = get().routines.find((r) => r.id === id);
          if (src)
            set({ routines: [...get().routines, duplicateRoutine(src, { id: uid, now: now() })] });
        },

        deleteRoutine: (id) => {
          const { draft } = get();
          set({
            routines: get().routines.filter((r) => r.id !== id),
            draft: draft?.sourceId === id ? null : draft,
          });
        },

        addCustomExercise: (input) => {
          const errors = validateCustomExercise(input);
          if (errors.length > 0 || !input.primaryMuscle || !input.equipment) return { errors };
          const exercise: Exercise = {
            id: uid('custom'),
            name: input.name.trim(),
            primaryMuscle: input.primaryMuscle,
            secondaryMuscles: [],
            equipment: input.equipment,
            illustrationKey: genericIllustrationKey(input.primaryMuscle),
            isCustom: true,
          };
          set({ customExercises: [...get().customExercises, exercise] });
          return { exercise, errors: [] };
        },

        startWorkout: (routineId, sessionId) => {
          const { routines, customExercises } = get();
          const routine = routines.find((r) => r.id === routineId);
          if (!routine?.sessions.some((s) => s.id === sessionId)) return false;
          const catalog = Object.fromEntries(
            [...BUILT_IN_EXERCISES, ...customExercises].map((e) => [e.id, e]),
          );
          const t = now();
          const workout = createWorkout(routine, sessionId, catalog, { id: uid('w'), now: t });
          const machine = reduce(createMachine(workout), { type: 'START', now: t });
          set({ active: { machine, transitionTo: null, notificationId: null } });
          return true;
        },

        dispatch: (event) => {
          const { active } = get();
          if (!active) return;
          const machine = reduce(active.machine, event);
          if (machine === active.machine) return;
          set({
            active: {
              ...active,
              machine,
              transitionTo: transitionTarget(
                active.machine.phase,
                machine.phase,
                active.transitionTo,
              ),
            },
          });
        },

        clearTransition: () => {
          const { active } = get();
          if (active?.transitionTo !== null && active)
            set({ active: { ...active, transitionTo: null } });
        },

        setNotificationId: (id) => {
          const { active } = get();
          if (active) set({ active: { ...active, notificationId: id } });
        },

        saveWorkout: () => {
          const { active, history } = get();
          if (!active || active.machine.phase.type !== 'finished') return;
          set({ history: [...history, active.machine.workout], active: null });
        },

        discardWorkout: () => set({ active: null }),

        upsertBodyMetric: (date, patch) => {
          const metrics = get().bodyMetrics;
          const existing = metrics.find((m) => m.date === date);
          const merged: BodyMetric = { ...existing, ...patch, date };
          const next = existing
            ? metrics.map((m) => (m.date === date ? merged : m))
            : [...metrics, merged];
          set({ bodyMetrics: next.sort((a, b) => a.date.localeCompare(b.date)) });
        },

        setSetting: (key, value) => set({ settings: { ...get().settings, [key]: value } }),
        setProfileName: (name) => set({ profile: { name: name.slice(0, 40) } }),

        replaceAll: (state) => set({ ...state }),
      }),
      {
        name: STORAGE_KEY,
        version: 1,
        storage: createJSONStorage(() => storage),
        partialize: (s): PersistedState => ({
          profile: s.profile,
          settings: s.settings,
          routines: s.routines,
          customExercises: s.customExercises,
          draft: s.draft,
          history: s.history,
          bodyMetrics: s.bodyMetrics,
          active: s.active,
        }),
        merge: (persisted, current) => ({ ...current, ...sanitizePersisted(persisted) }),
        onRehydrateStorage: () => (state) => {
          state?.dispatch({ type: 'TICK', now: now() });
          useHydration.setState({ hydrated: true });
        },
      },
    ),
  );
}

export const useHydration = create<{ hydrated: boolean }>(() => ({ hydrated: false }));

/** Real storage on device / browser. AsyncStorage maps to localStorage on web. */
export const asyncStorage: StateStorage = AsyncStorage;
