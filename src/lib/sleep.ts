// Sleep: hours from bed and wake times, the range that suits the person's age, and the week so far.
import { dayKey, type DayLog } from './day.ts';

const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

/** Hours slept from bed to wake time, across midnight when needed. */
export function sleepHours(s: { bed: string; wake: string } | undefined): number | null {
  if (!s) return null;
  let d = mins(s.wake) - mins(s.bed);
  if (d <= 0) d += 24 * 60;
  return Math.round((d / 60) * 10) / 10;
}

/** Recommended hours for the age (American Academy of Sleep Medicine and National Sleep Foundation ranges). */
export function sleepRange(age: number): [number, number] {
  if (age < 18) return [8, 10];
  if (age >= 65) return [7, 8];
  return [7, 9];
}

export type SleepVerdict = 'short' | 'ok' | 'long';
export function sleepVerdict(h: number, age: number): SleepVerdict {
  const [lo, hi] = sleepRange(age);
  return h < lo ? 'short' : h > hi + 1 ? 'long' : 'ok';
}

/** The last 7 nights (oldest first), each with its hours or null when not logged. */
export function sleepWeek(history: Record<string, DayLog | null | undefined>, today: Date): { key: string; h: number | null }[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + i);
    const key = dayKey(d);
    return { key, h: sleepHours(history[key]?.sleep) };
  });
}

/** Average of the logged nights, or null. */
export function sleepAvg(nights: { h: number | null }[]): number | null {
  const hs = nights.map((x) => x.h).filter((x): x is number => x !== null);
  return hs.length ? Math.round((hs.reduce((a, b) => a + b, 0) / hs.length) * 10) / 10 : null;
}
