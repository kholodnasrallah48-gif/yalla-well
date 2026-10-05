// Today's suggested meals: one recipe per meal, ranked for the person's conditions and medicines,
// sized to the calories still left today, changing from day to day, with a per-meal "another one" counter.
import { recipeFits } from './foods.ts';
import { L } from './i18n.ts';
import { genderFor, targets, type Profile } from './plan.ts';
import { RECIPES, type Meal, type Recipe } from './recipes-data.ts';

export const MEALS: Meal[] = ['breakfast', 'lunch', 'snack', 'dinner'];
/** Meal names in the app language (getters, so `MEAL_NAME[meal]` reads the current language). */
export const MEAL_NAME: Readonly<Record<Meal, string>> = {
  get breakfast() { return L('الفطار', 'Breakfast'); },
  get lunch() { return L('الغدا', 'Lunch'); },
  get snack() { return L('السناك', 'Snack'); },
  get dinner() { return L('العشا', 'Dinner'); },
};
/** Share of the day's calories for each meal. */
export const SHARE: Record<Meal, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.12, dinner: 0.28 };
const AUTOIMMUNE = ['hashimoto', 'graves', 'ra', 'psoriasis', 'lupus', 'ms', 'ibd', 'celiac', 't1d'];
const SUGAR = ['t1d', 't2d', 'ir', 'pcos'];

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

/** How well a recipe suits this person (higher is better) and the reasons to show them. */
export function suitability(p: Profile, r: Recipe): { score: number; why: string[] } {
  const g = genderFor(p.sex);
  const has = (id: string) => p.conditions.includes(id) || p.meds.includes(id);
  const t = new Set(r.tags);
  const protein = r.p >= 25 || (r.meal === 'snack' && r.p >= 8);
  let score = 0;
  const why: string[] = [];
  let highProtein = false;
  if (p.conditions.some((x) => AUTOIMMUNE.includes(x))) {
    if (t.has('omega3')) { score += 3; why.push(L('فيه أوميجا ٣ اللي بتقلل الالتهاب', 'Has omega-3, which lowers inflammation')); }
    if (t.has('redmeat')) score -= 3;
    if (t.has('processed') || t.has('canned') || t.has('refined')) score -= 2;
    if (t.has('fiber') || t.has('whole')) { score += 1; if (!why.length) why.push(L('أكل طبيعي وألياف، مفيد للمناعة', 'Whole food with fiber, good for immunity')); }
  }
  if (SUGAR.some(has) || has('insulin')) {
    if (r.gi === 'low' || r.gi === 'none') { score += 3; why.push(L('بيرفع السكر ببطء', 'Raises blood sugar slowly')); }
    if (r.gi === 'mid') score -= 2;
    if (t.has('fiber')) score += 1;
  }
  if (has('steroids')) {
    if (t.has('salty') || t.has('sugary') || r.gi === 'high') score -= 3;
    if (protein) { score += 2; highProtein = true; why.push(L('بروتين عالي، مهم مع الكورتيزون', 'High protein, important with steroids')); }
    if (t.has('dairy')) { score += 1; why.push(L('فيه كالسيوم للعضم', 'Has calcium for your bones')); }
  }
  if (has('thyroxine') && r.meal === 'breakfast' && (t.has('caffeine') || t.has('dairy') || t.has('fiber'))) {
    score -= 2; why.push(L(`${g('خده', 'خديه')} بعد دوا الغدة بساعة على الأقل`, 'Have it at least an hour after your thyroid medicine'));
  }
  if (has('ibd') && t.has('fiber')) score -= 1;
  if (p.goal === 'lose' && protein) { score += 1; if (!highProtein) why.push(L(`بروتين عالي يشبّع${g('ك', 'كي')}`, 'High protein, keeps you full')); }
  if (p.goal === 'gain' && r.kcal >= 450) score += 1;
  return { score, why: why.slice(0, 2) };
}

/** Recipes for one meal that suit this person, best-suited and closest to `budget` first. */
export function mealOptions(p: Profile, meal: Meal, budget = targets(p).kcal * SHARE[meal]): Recipe[] {
  const ok = RECIPES.filter((r) => r.meal === meal && recipeFits(p, r) && r.kcal <= Math.max(budget * 1.3, 120));
  const near = ok.filter((r) => r.kcal >= budget * 0.5);
  const list = near.length >= 3 ? near : ok;
  return list
    .map((r) => ({ r, s: suitability(p, r).score - Math.abs(r.kcal - budget) / Math.max(budget, 1) * 2 }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
}

export type PlanEntry = {
  meal: Meal; recipe: Recipe | null; budget: number;
  /** The person ticked this meal as eaten (or logged its suggested dish). */
  eaten: boolean;
  why: string[];
  /** Even the lightest fitting dish is more than the budget: eat this part of it (e.g. 0.5 = half). */
  portion: number;
};

/**
 * The plan for a day. Meals the person ticked (`doneMeals`) or whose suggested dish they logged count as eaten;
 * the calories left today are split over the meals not ticked or started yet by their usual share.
 * `shuffle[meal]` moves that meal to the next option.
 */
export function dayPlan(p: Profile, date: string, shuffle: Partial<Record<Meal, number>> = {}, loggedRefs: string[] = [], eatenKcal = 0, doneMeals: Meal[] = [], startedMeals: Meal[] = []): PlanEntry[] {
  const target = targets(p).kcal;
  const used = new Set<string>();
  // The day's dish for each meal from the best-suited few, so it changes daily but stays a good fit.
  const pick = (meal: Meal, budget: number) => {
    const opts = mealOptions(p, meal, budget).filter((r) => !used.has(r.n));
    if (!opts.length) return null;
    const top = Math.min(opts.length, 4);
    const k = ((hash(date + meal) % top) + (shuffle[meal] ?? 0)) % opts.length;
    return opts[k];
  };
  // Nothing fits under the budget: the lightest fitting dishes, to eat part of.
  const lightest = (meal: Meal) => {
    const opts = RECIPES.filter((r) => r.meal === meal && recipeFits(p, r) && !used.has(r.n)).sort((a, b) => a.kcal - b.kcal).slice(0, 3);
    return opts.length ? opts[(shuffle[meal] ?? 0) % opts.length] : null;
  };
  const loggedDish = (m: Meal) => RECIPES.find((r) => r.meal === m && loggedRefs.includes('r_' + r.id)) ?? null;
  const eaten = (m: Meal) => doneMeals.includes(m) || !!loggedDish(m);
  // Meals with food logged already are being eaten: the calories left go to the meals not started yet.
  const open = (m: Meal) => !eaten(m) && !startedMeals.includes(m);
  const leftShare = MEALS.filter(open).reduce((a, m) => a + SHARE[m], 0) || 1;
  const left = Math.max(0, target - eatenKcal);
  return MEALS.map((meal) => {
    const done = eaten(meal);
    const budget = open(meal) ? (left * SHARE[meal]) / leftShare : 0;
    let recipe: Recipe | null = null;
    let portion = 1;
    if (done) recipe = loggedDish(meal);
    else if (open(meal) && left >= 80) {
      recipe = pick(meal, budget);
      if (!recipe) {
        recipe = lightest(meal);
        if (recipe && recipe.kcal > budget * 1.3) portion = budget >= recipe.kcal * 0.6 ? 0.75 : 0.5;
      }
    }
    if (recipe) used.add(recipe.n);
    return { meal, recipe, budget: Math.round(budget), eaten: done, portion, why: recipe ? suitability(p, recipe).why : [] };
  });
}

/**
 * Calories to aim for in one meal now: the plan's share when the meal is still open, otherwise (started or ticked)
 * the meal's usual share minus what's already in it, never more than what's left today.
 */
export function mealBudget(p: Profile, plan: PlanEntry[], meal: Meal, inMealKcal: number, leftToday: number): number {
  const e = plan.find((x) => x.meal === meal);
  if (e && e.budget > 0) return e.budget;
  return Math.max(0, Math.round(Math.min(leftToday, targets(p).kcal * SHARE[meal] - inMealKcal)));
}

/** "للفطار": Arabic "for the meal" (لـ + الفطار contracts to للفطار). */
export const toMeal = (m: Meal) => 'لل' + MEAL_NAME[m].replace(/^ال/, '');

export const videoURL = (r: Recipe) => `https://www.youtube.com/results?search_query=${encodeURIComponent(r.video)}`;
