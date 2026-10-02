// One day's log and date helpers.
import type { Food } from './data.ts';

export type LoggedFood = { ref: string; n: string; u: string; kcal: number; p: number; c: number; f: number; q: number };
export type DayLog = { foods: LoggedFood[]; water: number; flare: boolean; done: string[] };

export const blankDay = (): DayLog => ({ foods: [], water: 0, flare: false, done: [] });

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 0 = Saturday … 6 = Friday. */
export const weekIndex = (d: Date) => (d.getDay() + 1) % 7;

export function totals(day: DayLog) {
  return day.foods.reduce(
    (a, f) => ({ kcal: a.kcal + f.kcal * f.q, p: a.p + f.p * f.q, c: a.c + f.c * f.q, f: a.f + f.f * f.q }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

/** Adds one portion, merging with an existing entry for the same food. */
export function addFood(day: DayLog, food: Food): DayLog {
  const i = day.foods.findIndex((x) => x.ref === food.id);
  if (i >= 0) return { ...day, foods: day.foods.map((x, j) => (j === i ? { ...x, q: x.q + 1 } : x)) };
  const { id, n, u, kcal, p, c, f } = food;
  return { ...day, foods: [...day.foods, { ref: id, n, u, kcal, p, c, f, q: 1 }] };
}

/** Changes a logged portion by delta (in halves); removes it at zero. */
export function changePortion(day: DayLog, index: number, delta: number): DayLog {
  const foods = day.foods
    .map((x, j) => (j === index ? { ...x, q: Math.round((x.q + delta) * 2) / 2 } : x))
    .filter((x) => x.q > 0);
  return { ...day, foods };
}

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
