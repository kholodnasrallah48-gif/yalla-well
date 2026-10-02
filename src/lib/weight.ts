// Weigh-ins: the first one is the starting weight; later ones show progress.
import type { Profile } from './plan.ts';

export const bmi = (kg: number, cm: number) => (cm > 0 ? kg / (cm / 100) ** 2 : 22);

const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Saves a new weight: one entry per day, the first ever entry is the starting point. */
export function logWeight(p: Profile, kg: number, date = todayKey()): Profile {
  const log = p.weights?.length ? p.weights : [{ d: p.start ?? date, kg: p.weight }];
  const [start, ...rest] = log;
  // The starting entry never changes; a second weigh-in on the same day replaces the first one.
  const later = [...rest.filter((w) => w.d !== date), { d: date, kg }].sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : 0));
  return { ...p, weight: kg, weights: [start, ...later] };
}

/** Starting weight and change so far (negative = lost). */
export function weightChange(p: Profile) {
  const start = p.weights?.[0]?.kg ?? p.weight;
  return { start, now: p.weight, diff: Math.round((p.weight - start) * 10) / 10 };
}
