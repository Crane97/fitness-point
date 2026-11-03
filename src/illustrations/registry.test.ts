import { BUILT_IN_EXERCISES } from '@/data/exercises';
import { MUSCLE_GROUPS } from '@/domain/types';

import { hasIllustration, illustrationFor, ILLUSTRATIONS } from './registry';

describe('illustration registry', () => {
  it('has an illustration for every built-in exercise', () => {
    const missing = BUILT_IN_EXERCISES.filter((e) => !hasIllustration(e.illustrationKey));
    expect(missing.map((e) => e.id)).toEqual([]);
  });

  it('has a generic illustration per muscle group and falls back to it', () => {
    for (const m of MUSCLE_GROUPS) expect(hasIllustration(`generic-${m}`)).toBe(true);
    expect(illustrationFor('does-not-exist', 'pecho')).toBe(ILLUSTRATIONS['generic-pecho']);
  });
});
