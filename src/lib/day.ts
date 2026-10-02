// One day's log and date helpers.
import type { Food, FoodTag, GI } from './foods.ts';
import type { SetLog } from './progress.ts';
import type { Meal } from './recipes-data.ts';

export type LoggedFood = {
  ref: string; n: string; u: string; kcal: number; p: number; c: number; f: number; q: number; gi?: GI; tags?: FoodTag[];
  /** The meal it was logged under (older logs have none). */
  meal?: Meal;
};
export type DayLog = {
  foods: LoggedFood[]; water: number; flare: boolean; done: string[]; sets: Record<string, SetLog[]>;
  /** How many times each suggested meal was swapped for another today. */
  shuffle?: Partial<Record<Meal, number>>;
  /** Meals the person ticked as eaten today. */
  meals?: Meal[];
};

export const blankDay = (): DayLog => ({ foods: [], water: 0, flare: false, done: [], sets: {} });

const pad = (n: number) => String(n).padStart(2, '0');
export const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** 0 = Saturday … 6 = Friday. */
export const weekIndex = (d: Date) => (d.getDay() + 1) % 7;

/** Whether a logged food counts toward the day yet: foods in a meal count once that meal is ticked as eaten. */
export const counted = (day: DayLog, x: LoggedFood) => !x.meal || (day.meals ?? []).includes(x.meal);

/** What was eaten today: foods without a meal, and foods in meals ticked as done. */
export function totals(day: DayLog) {
  return planned({ ...day, foods: day.foods.filter((x) => counted(day, x)) });
}

/** Everything logged, ticked or not. */
export function planned(day: DayLog) {
  return day.foods.reduce(
    (a, f) => ({ kcal: a.kcal + f.kcal * f.q, p: a.p + f.p * f.q, c: a.c + f.c * f.q, f: a.f + f.f * f.q }),
    { kcal: 0, p: 0, c: 0, f: 0 },
  );
}

/** Adds `q` portions to a meal, merging with an existing entry for the same food in that meal. */
export function addFood(day: DayLog, food: Food, meal?: Meal, q = 1): DayLog {
  const i = day.foods.findIndex((x) => x.ref === food.id && x.meal === meal);
  if (i >= 0) return { ...day, foods: day.foods.map((x, j) => (j === i ? { ...x, q: x.q + q } : x)) };
  const { id, n, u, kcal, p, c, f, gi, tags } = food;
  return { ...day, foods: [...day.foods, { ref: id, n, u, kcal, p, c, f, q, gi, tags, ...(meal ? { meal } : {}) }] };
}

/** Totals for the foods logged under one meal. */
export const mealTotals = (day: DayLog, meal: Meal) => planned({ ...day, foods: day.foods.filter((x) => x.meal === meal) });

/** Changes a logged portion by delta (in halves); removes it at zero. */
export function changePortion(day: DayLog, index: number, delta: number): DayLog {
  const foods = day.foods
    .map((x, j) => (j === index ? { ...x, q: Math.round((x.q + delta) * 2) / 2 } : x))
    .filter((x) => x.q > 0);
  return { ...day, foods };
}

export const fmt = (n: number) => Math.round(n).toLocaleString('en-US');
