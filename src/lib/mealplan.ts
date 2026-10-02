// Today's suggested meals: one recipe per meal that fits the person's conditions and calorie target,
// changing from day to day, with a per-meal "another one" counter.
import { targets, type Profile } from './plan.ts';
import { RECIPES, type Meal, type Recipe } from './recipes-data.ts';
import { recipeFits } from './foods.ts';

export const MEALS: Meal[] = ['breakfast', 'lunch', 'snack', 'dinner'];
export const MEAL_NAME: Record<Meal, string> = { breakfast: 'الفطار', lunch: 'الغدا', snack: 'السناك', dinner: 'العشا' };
/** Share of the day's calories for each meal. */
const SHARE: Record<Meal, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.12, dinner: 0.28 };

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** Recipes for one meal that suit this person, closest to that meal's calorie share first. */
export function mealOptions(p: Profile, meal: Meal): Recipe[] {
  const budget = targets(p).kcal * SHARE[meal];
  const ok = RECIPES.filter((r) => r.meal === meal && recipeFits(p, r));
  const near = ok.filter((r) => r.kcal <= budget * 1.3 && r.kcal >= budget * 0.5);
  return (near.length >= 3 ? near : ok).slice().sort((a, b) => Math.abs(a.kcal - budget) - Math.abs(b.kcal - budget));
}

/** The plan for a day; `shuffle[meal]` moves that meal to the next option. Lunch and dinner never repeat the same dish. */
export function dayPlan(p: Profile, date: string, shuffle: Partial<Record<Meal, number>> = {}): Record<Meal, Recipe | null> {
  const out = {} as Record<Meal, Recipe | null>;
  for (const meal of MEALS) {
    const opts = mealOptions(p, meal).filter((r) => !Object.values(out).some((x) => x?.n === r.n));
    out[meal] = opts.length ? opts[(hash(date + meal) + (shuffle[meal] ?? 0)) % opts.length] : null;
  }
  return out;
}

export const videoURL = (r: Recipe) => `https://www.youtube.com/results?search_query=${encodeURIComponent(r.video)}`;
