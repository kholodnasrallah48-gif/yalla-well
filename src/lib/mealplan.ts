// Today's suggested meals: one recipe per meal, ranked for the person's conditions and medicines,
// sized to the calories still left today, changing from day to day, with a per-meal "another one" counter.
import { recipeFits } from './foods.ts';
import { genderFor, targets, type Profile } from './plan.ts';
import { RECIPES, type Meal, type Recipe } from './recipes-data.ts';

export const MEALS: Meal[] = ['breakfast', 'lunch', 'snack', 'dinner'];
export const MEAL_NAME: Record<Meal, string> = { breakfast: 'الفطار', lunch: 'الغدا', snack: 'السناك', dinner: 'العشا' };
/** Share of the day's calories for each meal. */
const SHARE: Record<Meal, number> = { breakfast: 0.25, lunch: 0.35, snack: 0.12, dinner: 0.28 };
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
  if (p.conditions.some((x) => AUTOIMMUNE.includes(x))) {
    if (t.has('omega3')) { score += 3; why.push('فيه أوميجا ٣ اللي بتقلل الالتهاب'); }
    if (t.has('redmeat')) score -= 3;
    if (t.has('processed') || t.has('canned') || t.has('refined')) score -= 2;
    if (t.has('fiber') || t.has('whole')) { score += 1; if (!why.length) why.push('أكل طبيعي وألياف، مفيد للمناعة'); }
  }
  if (SUGAR.some(has) || has('insulin')) {
    if (r.gi === 'low' || r.gi === 'none') { score += 3; why.push('بيرفع السكر ببطء'); }
    if (r.gi === 'mid') score -= 2;
    if (t.has('fiber')) score += 1;
  }
  if (has('steroids')) {
    if (t.has('salty') || t.has('sugary') || r.gi === 'high') score -= 3;
    if (protein) { score += 2; why.push('بروتين عالي، مهم مع الكورتيزون'); }
    if (t.has('dairy')) { score += 1; why.push('فيه كالسيوم للعضم'); }
  }
  if (has('thyroxine') && r.meal === 'breakfast' && (t.has('caffeine') || t.has('dairy') || t.has('fiber'))) {
    score -= 2; why.push(`${g('خده', 'خديه')} بعد دوا الغدة بساعة على الأقل`);
  }
  if (has('ibd') && t.has('fiber')) score -= 1;
  if (p.goal === 'lose' && protein) { score += 1; if (!why.some((w) => w.includes('بروتين'))) why.push(`بروتين عالي يشبّع${g('ك', 'كي')}`); }
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

export type PlanEntry = { meal: Meal; recipe: Recipe | null; budget: number; eaten: boolean; why: string[] };

/**
 * The plan for a day. Meals whose suggested dish was already logged count as eaten; the calories left today
 * are split over the other meals by their usual share. `shuffle[meal]` moves that meal to the next option.
 */
export function dayPlan(p: Profile, date: string, shuffle: Partial<Record<Meal, number>> = {}, loggedRefs: string[] = [], eatenKcal = 0): PlanEntry[] {
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
  const eaten = (m: Meal) => loggedRefs.some((ref) => RECIPES.some((r) => r.meal === m && 'r_' + r.id === ref));
  const leftShare = MEALS.filter((m) => !eaten(m)).reduce((a, m) => a + SHARE[m], 0) || 1;
  const left = Math.max(0, target - eatenKcal);
  return MEALS.map((meal) => {
    const done = eaten(meal);
    const budget = done ? 0 : (left * SHARE[meal]) / leftShare;
    const recipe = done
      ? RECIPES.find((r) => r.meal === meal && loggedRefs.includes('r_' + r.id)) ?? null
      : budget < 80 ? null : pick(meal, budget);
    if (recipe) used.add(recipe.n);
    return { meal, recipe, budget: Math.round(budget), eaten: done, why: recipe ? suitability(p, recipe).why : [] };
  });
}

export const videoURL = (r: Recipe) => `https://www.youtube.com/results?search_query=${encodeURIComponent(r.video)}`;
