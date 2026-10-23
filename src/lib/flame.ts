// The streak: days in a row on calorie target, added by hand, with streak freezes ("shields" in the code) that cover
// a missed day. A freeze is earned every 7 days in a row (2 at most). A past day that missed the target uses a shield if there is
// one and the streak keeps going; otherwise the streak starts over. A finished day nobody lit still counts once it is
// over, so the streak never breaks because of a forgotten tap.
import { dayKey, type DayLog } from './day.ts';
import type { Profile } from './plan.ts';
import { scoreDay } from './streaks.ts';

export const SHIELD_EVERY = 7;
export const MAX_SHIELDS = 2;

export type FlameMark = 'ok' | 'shield' | 'miss';
export type FlameEvent = { key: string; kind: 'earn' | 'save' | 'lost'; n: number };

export type Flame = {
  /** Days in a row, today included once it is lit. */
  n: number;
  shields: number;
  /** Today reached the target. */
  todayOk: boolean;
  /** Today was lit by hand. */
  lit: boolean;
  /** Days left to the next shield (0 when shields are full). */
  toShield: number;
  best: number;
  /** How each past day (and today, once done) counted, by day key. */
  marks: Record<string, FlameMark>;
  /** Shield earned, shield used, or streak lost, newest last. Keyed by the day it happened on. */
  events: FlameEvent[];
};

export function flame(p: Profile, logs: Record<string, DayLog | null | undefined>, today: Date, days = 400): Flame {
  const start = p.start ?? '0000';
  const list: { key: string; ok: boolean; lit: boolean }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dayKey(d);
    if (key < start) continue;
    const log = logs[key];
    list.push({ key, ok: scoreDay(p, log, d).kcalOk, lit: !!log?.lit });
  }
  let n = 0, shields = 0, best = 0;
  const marks: Record<string, FlameMark> = {};
  const events: FlameEvent[] = [];
  const add = (key: string) => {
    n++;
    best = Math.max(best, n);
    marks[key] = 'ok';
    if (n % SHIELD_EVERY === 0 && shields < MAX_SHIELDS) { shields++; events.push({ key, kind: 'earn', n }); }
  };
  const last = list[list.length - 1];
  const todayKey = dayKey(today);
  for (const x of list) {
    const isToday = x.key === todayKey;
    if (isToday) {
      // Today only counts once lit; until midnight it never breaks anything.
      if (x.ok && x.lit) add(x.key);
      continue;
    }
    if (x.ok) add(x.key);
    else if (n > 0 && shields > 0) { shields--; marks[x.key] = 'shield'; events.push({ key: x.key, kind: 'save', n }); }
    else {
      if (n > 0) events.push({ key: x.key, kind: 'lost', n });
      n = 0;
      marks[x.key] = 'miss';
    }
  }
  const todayOk = !!last && last.key === todayKey && last.ok;
  const lit = todayOk && last.lit;
  const toShield = shields >= MAX_SHIELDS ? 0 : SHIELD_EVERY - (n % SHIELD_EVERY);
  return { n, shields, todayOk, lit, toShield, best, marks, events };
}
