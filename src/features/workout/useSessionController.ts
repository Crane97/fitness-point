/**
 * Side effects of an active workout, mounted once in the session layout:
 * - routes to the screen matching the machine phase
 * - ticks the rest timer (derived from endsAt) and gives haptic + sound feedback at 0
 * - schedules / cancels the native "rest over" notification
 * - keeps the screen awake (setting)
 */
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { router, usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

import type { Phase } from '@/domain/sessionMachine';
import { restEndFeedback } from '@/services/haptics';
import { cancelRestEnd, scheduleRestEnd } from '@/services/notifications';
import { now } from '@/services/clock';
import { playRestEnd } from '@/services/sound';
import { useApp } from '@/store';

const KEEP_AWAKE_TAG = 'fitness-point-session';

export type SessionRoute =
  '/sesion/activa' | '/sesion/descanso' | '/sesion/transicion' | '/sesion/resumen';

export function routeFor(phase: Phase, transitionTo: number | null): SessionRoute | null {
  switch (phase.type) {
    case 'finished':
      return '/sesion/resumen';
    case 'resting':
      return '/sesion/descanso';
    case 'performing':
      return transitionTo !== null ? '/sesion/transicion' : '/sesion/activa';
    default:
      return null;
  }
}

export function useSessionController(): void {
  const active = useApp((s) => s.active);
  const dispatch = useApp((s) => s.dispatch);
  const settings = useApp((s) => s.settings);
  const setNotificationId = useApp((s) => s.setNotificationId);
  const pathname = usePathname();
  const prevPhase = useRef<Phase | null>(null);

  const phase = active?.machine.phase ?? null;
  const target = phase ? routeFor(phase, active?.transitionTo ?? null) : null;

  // 1. Route to the screen for the current phase.
  useEffect(() => {
    if (!active) {
      router.replace('/');
      return;
    }
    if (target && pathname !== target) router.replace(target);
  }, [active, target, pathname]);

  // 2. Tick while resting (time is derived from endsAt, so this is only a refresh).
  const endsAt = phase?.type === 'resting' ? phase.endsAt : null;
  useEffect(() => {
    if (endsAt === null) return;
    const tick = () => dispatch({ type: 'TICK', now: now() });
    tick();
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [endsAt, dispatch]);

  // 3. Feedback when a rest reaches 0 on its own (not when skipped).
  useEffect(() => {
    const prev = prevPhase.current;
    prevPhase.current = phase;
    const t = now();
    // Only when it ends on screen (not skipped, and not long after, e.g. back from background).
    if (
      prev?.type === 'resting' &&
      phase?.type === 'performing' &&
      t >= prev.endsAt - 250 &&
      t - prev.endsAt < 1500
    ) {
      if (settings.haptics) restEndFeedback();
      if (settings.sound) playRestEnd();
    }
  }, [phase, settings.haptics, settings.sound]);

  // 4. Native notification at the end of the rest; cancelled if skipped. The id is persisted
  //    as `${endsAt}:${id}` so reopening the app does not schedule a duplicate.
  const stored = active?.notificationId ?? null;
  const nextName =
    phase?.type === 'resting'
      ? (active?.machine.workout.exercises[phase.next.exerciseIndex]?.name ?? '')
      : '';
  useEffect(() => {
    if (endsAt === null) {
      if (stored) {
        void cancelRestEnd(stored.split(':')[1] ?? null);
        setNotificationId(null);
      }
      return;
    }
    if (stored?.startsWith(`${endsAt}:`)) return;
    let cancelled = false;
    if (stored) void cancelRestEnd(stored.split(':')[1] ?? null);
    void scheduleRestEnd(endsAt, `Siguiente: ${nextName}`, settings.sound).then((id) => {
      if (cancelled) void cancelRestEnd(id);
      else setNotificationId(id ? `${endsAt}:${id}` : null);
    });
    return () => {
      cancelled = true;
    };
  }, [endsAt, stored, nextName, setNotificationId, settings.sound]);

  // 5. Keep the screen on during the session.
  useEffect(() => {
    if (!settings.keepAwake) return;
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => undefined);
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => undefined);
    };
  }, [settings.keepAwake]);
}
