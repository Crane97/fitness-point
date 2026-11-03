import { formatKg, formatReps } from '@/domain/format';
import type { SessionExercise, SetTemplate } from '@/domain/types';

export function weightLabel(kg: number | undefined): string {
  return kg === undefined ? 'Peso corporal' : `${formatKg(kg)} kg`;
}

/** "4 × 8-10 · 60 kg" for uniform sets, "4 series · 60–72,5 kg" otherwise. */
export function describeSets(sets: readonly SetTemplate[]): string {
  if (sets.length === 0) return 'Sin series';
  const first = sets[0]!;
  const uniform = sets.every(
    (s) => s.reps === first.reps && s.repsMax === first.repsMax && s.weightKg === first.weightKg,
  );
  if (uniform)
    return `${sets.length} × ${formatReps(first.reps, first.repsMax)} · ${weightLabel(first.weightKg)}`;
  const weights = sets.map((s) => s.weightKg).filter((w): w is number => w !== undefined);
  const range =
    weights.length === 0
      ? 'Peso corporal'
      : Math.min(...weights) === Math.max(...weights)
        ? `${formatKg(weights[0]!)} kg`
        : `${formatKg(Math.min(...weights))}–${formatKg(Math.max(...weights))} kg`;
  return `${sets.length} series · ${range}`;
}

export function describeExercise(e: SessionExercise): string {
  return `${describeSets(e.sets)} · ${e.restBetweenSetsS} s`;
}
