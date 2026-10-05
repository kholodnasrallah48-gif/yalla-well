// Recipes from TheMealDB (free, no key) for dishes we don't have: search by the dish's English name, the full
// recipe by id, and a rough calorie estimate from the ingredient amounts and USDA calories per 100 g.
import { cacheGet, cacheSet } from './cache.ts';
import { DISH_EN } from './food-words.ts';
import { norm } from './foods.ts';
import { getJSON, searchUSDA, toEnglish } from './online.ts';

const API = 'https://www.themealdb.com/api/json/v1/1';

export type OnlineRecipe = {
  /** 'mdb_<idMeal>' */
  id: string;
  name: string;
  thumb?: string;
  category?: string;
  area?: string;
  ingredients: { name: string; measure: string }[];
  steps: string[];
  youtube?: string;
  source?: string;
};

type MealDBMeal = Record<string, string | null | undefined>;

/** One TheMealDB meal in our shape (null without a name). */
export function fromMealDB(x: MealDBMeal): OnlineRecipe | null {
  const name = (x.strMeal ?? '').trim();
  if (!x.idMeal || !name) return null;
  const ingredients: OnlineRecipe['ingredients'] = [];
  for (let i = 1; i <= 20; i++) {
    const n = (x['strIngredient' + i] ?? '').trim();
    if (n) ingredients.push({ name: n, measure: (x['strMeasure' + i] ?? '').trim() });
  }
  return {
    id: 'mdb_' + x.idMeal, name, thumb: x.strMealThumb || undefined, category: x.strCategory || undefined, area: x.strArea || undefined,
    ingredients, steps: splitSteps(x.strInstructions ?? ''), youtube: x.strYoutube || undefined, source: x.strSource || undefined,
  };
}

/** Instructions text → short steps: by line, without "STEP 1" headers and numbering; one long paragraph by sentence. */
export function splitSteps(text: string): string[] {
  let lines = text.replace(/\r/g, '').split(/\n+/).map((s) => s.trim())
    .map((s) => s.replace(/^(step\s*\d+[:.)-]?|\d+[.)]|[-•▢*])\s*/i, '').trim())
    .filter((s) => s.length > 1 && !/^step\s*\d*$/i.test(s));
  if (lines.length <= 1 && (lines[0]?.length ?? 0) > 220) lines = lines[0].split(/(?<=[.!?])\s+(?=[A-Z])/).map((s) => s.trim()).filter(Boolean);
  return lines;
}

/** English words to look a dish up by: dish names first ("كشري" → koshari), then the food dictionary; Latin text as is. */
export function dishQuery(text: string): string | null {
  const t = norm(text);
  if (/^[a-z0-9\s'-]+$/.test(t)) return t.trim() || null;
  const ws = t.replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  for (let i = 0; i < ws.length; i++) {
    const two = i + 1 < ws.length ? `${ws[i]} ${ws[i + 1]}` : '';
    if (two && DISH_EN[two]) { out.push(DISH_EN[two]); i++; continue; }
    const w = ['بال', 'ال', 'ب', 'و'].reduce((acc, p) => (!DISH_EN[acc] && acc.startsWith(p) && DISH_EN[acc.slice(p.length)] ? acc.slice(p.length) : acc), ws[i]);
    if (DISH_EN[w]) out.push(DISH_EN[w]);
    else { const en = toEnglish(ws[i]); if (en) out.push(en); }
  }
  return out.length ? Array.from(new Set(out.join(' ').split(' '))).join(' ') : null;
}

// Cooking words that are too weak to search by alone.
const WEAK = new Set(['grilled', 'fried', 'boiled', 'baked', 'cooked', 'raw', 'fresh', 'with', 'and', 'stuffed', 'healthy', 'green', 'white', 'red', 'black', 'whole']);

/** Results ranked by how many query words their name has (all words first), then shorter names. */
export function rankMeals(en: string, list: OnlineRecipe[]): OnlineRecipe[] {
  const q = en.toLowerCase().split(/\s+/).filter(Boolean);
  const score = (r: OnlineRecipe) => {
    const n = r.name.toLowerCase();
    return q.filter((w) => n.includes(w.replace(/s$/, ''))).length * 10 - n.length / 20;
  };
  return list.map((r) => ({ r, s: score(r) })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).map((x) => x.r);
}

/**
 * Online recipes for a dish name (Arabic or English). Searches the whole phrase, then each strong word,
 * and keeps the ones whose names share the most words with the query. Empty when offline or nothing matches.
 */
export async function searchMealDB(text: string, max = 8): Promise<OnlineRecipe[]> {
  const en = dishQuery(text);
  if (!en) return [];
  const key = 'mdbq:' + en;
  const cached = await cacheGet<OnlineRecipe[]>(key);
  if (cached) return cached.slice(0, max);
  const terms = [en, ...en.split(' ').filter((w) => w.length > 2 && !WEAK.has(w))];
  const seen = new Set<string>();
  const all: OnlineRecipe[] = [];
  let answered = false;
  for (const term of Array.from(new Set(terms)).slice(0, 4)) {
    const j = await getJSON<{ meals?: MealDBMeal[] | null }>(`${API}/search.php?s=${encodeURIComponent(term)}`, 10000);
    if (j) answered = true;
    for (const m of (Array.isArray(j?.meals) ? j!.meals! : [])) {
      const r = (() => { try { return fromMealDB(m); } catch { return null; } })();
      if (r && !seen.has(r.id)) { seen.add(r.id); all.push(r); }
    }
    if (all.length >= max && term === en) break;
  }
  const out = rankMeals(en, all).slice(0, max);
  if (answered) await cacheSet(key, out, out.length ? 14 : 2);
  return out;
}

/** The full recipe by id ('mdb_52772' or '52772'), cached for a month so it opens offline next time. */
export async function lookupMealDB(id: string): Promise<OnlineRecipe | null> {
  const raw = id.replace(/^mdb_/, '');
  if (!/^\d+$/.test(raw)) return null;
  const key = 'mdb:' + raw;
  const cached = await cacheGet<OnlineRecipe>(key);
  if (cached) return cached;
  const j = await getJSON<{ meals?: MealDBMeal[] | null }>(`${API}/lookup.php?i=${raw}`, 10000);
  const m = Array.isArray(j?.meals) ? j!.meals![0] : null;
  const r = m ? fromMealDB(m) : null;
  if (r) await cacheSet(key, r, 30);
  return r;
}

/** Keeps a search hit so the recipe screen can show it at once (search results already carry the full recipe). */
export const rememberMeal = (r: OnlineRecipe) => cacheSet('mdb:' + r.id.replace(/^mdb_/, ''), r, 30);

// ---- calorie estimate ----

const FRACTIONS: Record<string, string> = { '½': '.5', '¼': '.25', '¾': '.75', '⅓': '.33', '⅔': '.67', '⅛': '.125' };
/** Typical weight of one piece, by ingredient word. */
const PIECE: [RegExp, number][] = [
  [/egg yolk/, 17], [/egg white/, 33], [/egg/, 50], [/garlic/, 5], [/shallot/, 40], [/onion/, 110], [/cherry tomato/, 15], [/tomato/, 120],
  [/sweet potato/, 150], [/potato/, 170], [/carrot/, 60], [/lemon/, 60], [/lime/, 45], [/orange/, 150], [/apple/, 180], [/banana/, 120],
  [/avocado/, 150], [/chicken breast/, 170], [/chicken thigh/, 120], [/chicken leg|drumstick/, 150], [/chicken/, 1200], [/chilli|chili|jalape/, 15],
  [/pepper/, 120], [/cucumber/, 200], [/aubergine|eggplant/, 300], [/courgette|zucchini/, 200], [/tortilla|wrap/, 45], [/pitta|pita/, 60],
  [/bread|bun|roll/, 40], [/bay lea|leaves|leaf/, 0], [/mushroom/, 20], [/fillet|steak/, 170], [/sausage/, 60], [/stock cube|bouillon/, 10],
];
const CUP: [RegExp, number][] = [[/flour/, 125], [/sugar/, 200], [/rice/, 185], [/oat/, 90], [/milk|water|stock|broth|cream|juice|yogurt|yoghurt/, 240]];
/** Weightless or nearly calorie-free: not looked up. */
const FREE = /^(water|ice|salt|sea salt|black pepper|pepper|salt and pepper|baking soda|baking powder|bay leaf|bay leaves|vinegar)$/i;

/**
 * Grams of one ingredient from its TheMealDB measure ("1 cup", "200g", "2 large", "1 1/2 tbs", "pinch").
 * 0 for pinches and "to taste"; null when the amount can't be told.
 */
export function measureGrams(measure: string, name: string): number | null {
  let m = measure.toLowerCase().replace(/[½¼¾⅓⅔⅛]/g, (f) => ' ' + FRACTIONS[f]).replace(/,/g, '.').trim();
  const n = name.toLowerCase();
  if (FREE.test(n.trim())) return 0;
  if (/pinch|dash|to taste|sprinkl|garnish|to serve|drizzle|splash|few|sprig/.test(m)) return 0;
  // "1 1/2" / "1/2" / "1 .5" / "2-3" (take the first)
  let qty = 0;
  const mixed = m.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)/);
  const frac = m.match(/^(\d+)\s*\/\s*(\d+)/);
  const dec = m.match(/^(\d*\.?\d+)(?:\s+(\.\d+))?/);
  if (mixed) { qty = +mixed[1] + +mixed[2] / +mixed[3]; m = m.slice(mixed[0].length); }
  else if (frac) { qty = +frac[1] / +frac[2]; m = m.slice(frac[0].length); }
  else if (dec) { qty = +dec[1] + (dec[2] ? +dec[2] : 0); m = m.slice(dec[0].length); }
  m = m.replace(/^\s*[-–]\s*\d+(\.\d+)?/, '').trim();
  const has = qty > 0;
  if (!has) qty = 1;
  const unit = (re: RegExp) => re.test(m);
  if (unit(/^(kg|kilo)/)) return qty * 1000;
  if (unit(/^(g|gr|gram|grams)\b/) || /^\d+g$/.test(measure.trim().toLowerCase())) return qty;
  if (unit(/^ml\b|^millilit/)) return qty;
  if (unit(/^(l|litre|liter)s?\b/)) return qty * 1000;
  if (unit(/^(lb|lbs|pound)/)) return qty * 453.6;
  if (unit(/^oz|^ounce/)) return qty * 28.35;
  if (unit(/^(tbsp|tbs|tblsp|tablespoon|tbls)/)) return qty * 15;
  if (unit(/^(tsp|teaspoon)/)) return qty * 5;
  if (unit(/^cups?\b/)) return qty * (CUP.find(([re]) => re.test(n))?.[1] ?? 200);
  if (unit(/^(can|tin)s?\b/)) return qty * 400;
  if (unit(/^handful/)) return qty * 30;
  if (unit(/^slices?\b/)) return qty * 30;
  if (unit(/^(cloves?)\b/)) return qty * 5;
  if (unit(/^sticks?\b/)) return qty * 113;
  if (!has) return null;
  const piece = PIECE.find(([re]) => re.test(n));
  return piece ? qty * piece[1] : null;
}

export type KcalEstimate = {
  /** Calories of the whole recipe, from the ingredients that could be counted. */
  total: number;
  /** Ingredients counted (with a known amount and calories). */
  counted: number;
  /** Ingredient names left out: amount or calories unknown. */
  missing: string[];
};

/** Calories per 100 g of an ingredient from USDA (the top generic match), null when unknown or offline. */
export async function usdaKcal100(name: string): Promise<number | null> {
  const key = 'kcal100:' + name.toLowerCase();
  const c = await cacheGet<number>(key);
  if (c != null) return c;
  const hits = await searchUSDA(name.toLowerCase()).catch(() => []);
  const v = hits[0]?.per100.kcal;
  if (v != null) await cacheSet(key, v, 60);
  return v ?? null;
}

/**
 * A rough calorie total for an online recipe: each ingredient's grams × its calories per 100 g. Lookups run a few at
 * a time. Null when no ingredient could be counted (usually offline).
 */
export async function estimateKcal(r: OnlineRecipe, kcal100: (name: string) => Promise<number | null> = usdaKcal100): Promise<KcalEstimate | null> {
  const key = 'mdbkcal:' + r.id;
  if (kcal100 === usdaKcal100) { const c = await cacheGet<KcalEstimate>(key); if (c) return c; }
  const missing: string[] = [];
  let total = 0;
  let counted = 0;
  const jobs = r.ingredients.map((ing) => async () => {
    const g = measureGrams(ing.measure, ing.name);
    if (g === 0) { counted++; return; }
    if (g == null) { missing.push(ing.name); return; }
    const k = await kcal100(ing.name).catch(() => null);
    if (k == null) { missing.push(ing.name); return; }
    total += (g * k) / 100;
    counted++;
  });
  let next = 0;
  await Promise.all(Array.from({ length: 3 }, async () => { while (next < jobs.length) await jobs[next++](); }));
  if (!counted || total <= 0) return null;
  const out = { total: Math.round(total), counted, missing };
  if (kcal100 === usdaKcal100) await cacheSet(key, out, 30);
  return out;
}
