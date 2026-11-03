import { useEffect, useState } from 'react';

import { now } from '@/services/clock';

/** Re-renders every `intervalMs` with the current time (timers derive from it, never count). */
export function useNow(intervalMs = 250, enabled = true): number {
  const [t, setT] = useState(now);
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => setT(now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, enabled]);
  return t;
}
