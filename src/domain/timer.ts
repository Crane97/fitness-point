/**
 * Rest timer maths. The timer is stored as an absolute `endsAt` timestamp so that
 * the remaining time stays correct while the app is backgrounded or the phone is locked.
 */

export function remainingMs(endsAt: number, now: number): number {
  return Math.max(0, endsAt - now);
}

/** Whole seconds left, rounded up: "0" is shown only when the rest is really over. */
export function remainingSeconds(endsAt: number, now: number): number {
  return Math.ceil(remainingMs(endsAt, now) / 1000);
}

/** 0 → just started, 1 → finished. */
export function restProgress(startedAt: number, endsAt: number, now: number): number {
  const total = endsAt - startedAt;
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now - startedAt) / total));
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}
