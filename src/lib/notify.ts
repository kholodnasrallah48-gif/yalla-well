// Phone reminders (local notifications): breakfast, lunch, dinner, water, the workout and an empty log.
// They can be turned off from the profile tab. What to schedule is decided in ./reminders.ts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import type { DayLog } from './day.ts';
import { getLang } from './i18n.ts';
import type { Profile } from './plan.ts';
import { planReminders, REMINDER_PREFIX } from './reminders.ts';

const KEY = 'yallawell:notify';
let on = true;
const listeners = new Set<(v: boolean) => void>();

AsyncStorage.getItem(KEY).then((v) => { if (v === 'off') { on = false; listeners.forEach((f) => f(on)); } }).catch(() => {});

export const notifyOn = () => on;
export function setNotifyOn(v: boolean) {
  on = v;
  AsyncStorage.setItem(KEY, v ? 'on' : 'off').catch(() => {});
  listeners.forEach((f) => f(v));
}
export function onNotifyChange(f: (v: boolean) => void) { listeners.add(f); return () => { listeners.delete(f); }; }

type N = typeof import('expo-notifications');
let mod: N | null | undefined;
/** The native module, loaded on first use; null on web or when it isn't available. */
function native(): N | null {
  if (mod !== undefined) return mod;
  mod = null;
  if (Platform.OS === 'web') return mod;
  try {
    const m: N = require('expo-notifications');
    m.setNotificationHandler({
      handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
    });
    mod = m;
  } catch { /* reminders are a nicety */ }
  return mod;
}

let asked = false;
async function allowed(N: N): Promise<boolean> {
  const cur = await N.getPermissionsAsync();
  if (cur.granted || cur.ios?.status === N.IosAuthorizationStatus.PROVISIONAL) return true;
  if (asked || !cur.canAskAgain) return false;
  asked = true;
  const res = await N.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return res.granted;
}

async function cancelOurs(N: N) {
  const all = await N.getAllScheduledNotificationsAsync();
  await Promise.all(all.filter((r) => r.identifier.startsWith(REMINDER_PREFIX)).map((r) => N.cancelScheduledNotificationAsync(r.identifier).catch(() => {})));
}

export type ReminderState = { profile: Profile | null; day: DayLog };

let running: Promise<void> = Promise.resolve();
/** Replaces this app's scheduled reminders with fresh ones for today and the next 6 days. Never throws. */
export function scheduleReminders(state: ReminderState): Promise<void> {
  // Runs one at a time so overlapping calls don't double-schedule.
  running = running.then(() => run(state)).catch(() => {});
  return running;
}

async function run({ profile, day }: ReminderState) {
  const N = native();
  if (!N) return;
  try {
    if (!on || !profile) { await cancelOurs(N); return; }
    if (!(await allowed(N))) return;
    await cancelOurs(N);
    const list = planReminders({ profile, day, now: new Date(), lang: getLang() });
    for (const r of list) {
      await N.scheduleNotificationAsync({
        identifier: r.id,
        content: { title: r.title, body: r.body, sound: true, data: { kind: r.kind } },
        trigger: { type: N.SchedulableTriggerInputTypes.DATE, date: r.date },
      }).catch(() => {});
    }
  } catch { /* permission or native errors: no reminders, no crash */ }
}

/** Sends one sample reminder a few seconds from now, so the person can see how reminders look. */
export async function testReminder(title: string, body: string, seconds = 5): Promise<'sent' | 'denied' | 'unavailable'> {
  const N = native();
  if (!N) return 'unavailable';
  try {
    if (!(await allowed(N))) return 'denied';
    await N.scheduleNotificationAsync({
      identifier: `yw-test-${Date.now()}`,
      content: { title, body, sound: true },
      trigger: { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
    });
    return 'sent';
  } catch {
    return 'unavailable';
  }
}
