import { useMemo } from 'react';

import { BUILT_IN_EXERCISES } from '@/data/exercises';
import type { Exercise } from '@/domain/types';

import { useApp } from './index';

/** Built-in + custom exercises. */
export function useCatalog(): { list: Exercise[]; byId: Record<string, Exercise> } {
  const custom = useApp((s) => s.customExercises);
  return useMemo(() => {
    const list = [...BUILT_IN_EXERCISES, ...custom];
    return { list, byId: Object.fromEntries(list.map((e) => [e.id, e])) };
  }, [custom]);
}
