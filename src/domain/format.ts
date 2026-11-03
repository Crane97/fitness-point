/** Spanish number formatting helpers (decimal comma). */

export function formatKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded).replace('.', ',');
}

export function formatThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatReps(reps: number, repsMax?: number): string {
  return repsMax !== undefined && repsMax > reps ? `${reps}-${repsMax}` : String(reps);
}

/** Rounds to the nearest 0,5 kg. */
export function roundHalf(kg: number): number {
  return Math.round(kg * 2) / 2;
}
