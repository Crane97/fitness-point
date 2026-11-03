/** Local notification at the end of a rest (native only; see notifications.web.ts). */
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';

let configured = false;
let granted: boolean | null = null;

function configure(): void {
  if (configured) return;
  configured = true;
  Notifications.setNotificationHandler({
    // In the foreground the app itself beeps/vibrates: do not duplicate it with a banner.
    handleNotification: async () => {
      const foreground = AppState.currentState === 'active';
      return {
        shouldShowBanner: !foreground,
        shouldShowList: !foreground,
        shouldPlaySound: !foreground,
        shouldSetBadge: false,
      };
    },
  });
}

async function ensurePermission(): Promise<boolean> {
  if (granted !== null) return granted;
  try {
    const current = await Notifications.getPermissionsAsync();
    granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  } catch {
    granted = false;
  }
  return granted;
}

/** Schedules the "rest is over" notification. Returns its id, or null if it could not be scheduled. */
export async function scheduleRestEnd(
  endsAt: number,
  body: string,
  sound = true,
): Promise<string | null> {
  configure();
  if (endsAt <= Date.now() || !(await ensurePermission())) return null;
  try {
    return await Notifications.scheduleNotificationAsync({
      content: { title: 'Descanso terminado', body, sound },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: endsAt },
    });
  } catch {
    return null;
  }
}

export async function cancelRestEnd(id: string | null): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // Already delivered or never scheduled.
  }
}
