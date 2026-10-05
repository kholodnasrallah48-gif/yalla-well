// Finding a dish by name in our recipes, and fitting a dish to the calories left for a meal:
// a portion factor (in quarters) and the ingredient quantities scaled by it. Approximate by design.
import { EN_RECIPES } from './en/recipes.ts';
import { norm } from './foods.ts';
import { L } from './i18n.ts';
import { RECIPES, type Recipe } from './recipes-data.ts';

/** Words that don't name a dish ("طريقة عمل ...", "how to make ..."). */
const STOP = new Set([
  'طريقه', 'عمل', 'وصفه', 'وصفات', 'اكله', 'اكلات', 'طبق', 'صحي', 'صحيه', 'في', 'من', 'مع', 'و', 'عايز', 'عايزه', 'نفسي', 'ازاي', 'اعمل',
  'the', 'with', 'and', 'a', 'an', 'of', 'recipe', 'recipes', 'how', 'to', 'make', 'healthy',
]);
const PREFIXES = ['بال', 'وال', 'ال', 'ب', 'و'];

/** A word and its form without a leading "ال/بال/ب/و" ("بالليمون" → "ليمون"); both are kept, since "بطاطس" starts with ب too. */
function forms(w: string): string[] {
  const out = [w];
  for (const p of PREFIXES) if (w.startsWith(p) && w.length - p.length > 2) out.push(w.slice(p.length));
  return out;
}
/** Normalized search words of a text, without stop words. */
export function words(s: string): string[] {
  return norm(s).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((w) => w.length > 1 && !STOP.has(w));
}
const close = (a: string, b: string) => {
  if (a === b) return true;
  const d = Math.abs(a.length - b.length);
  const short = Math.min(a.length, b.length);
  return short > 2 && (a.startsWith(b) || b.startsWith(a)) && (d <= 1 || (d === 2 && short >= 4));
};
/** How well one query word matches a list of words: 1 exact, 0.8 near (prefix, plural), 0 none. */
function hit(q: string, toks: string[]): number {
  let best = 0;
  for (const qf of forms(q)) for (const t of toks) for (const tf of forms(t)) {
    if (qf === tf) return 1;
    if (close(qf, tf)) best = 0.8;
  }
  return best;
}

export type RecipeHit = { r: Recipe; score: number };

/**
 * Recipes whose name (Arabic or English) matches the query, best first. Ingredients count a little,
 * so "عدس" finds the lentil soup and "فراخ" every chicken dish. Empty when nothing reasonable matches.
 */
export function searchRecipes(query: string, list: Recipe[] = RECIPES, max = 6): RecipeHit[] {
  const q = words(query);
  if (!q.length) return [];
  const out: RecipeHit[] = [];
  for (const r of list) {
    const name = [...words(r.n), ...words(EN_RECIPES[r.n] ?? '')];
    const ing = r.ingredients.flatMap((x) => words(x).concat(words(EN_RECIPES[x] ?? '')));
    let s = 0;
    for (const w of q) {
      const n = hit(w, name);
      s += n || hit(w, ing) * 0.35;
    }
    const score = s / q.length;
    if (score >= 0.5) out.push({ r, score });
  }
  return out.sort((a, b) => b.score - a.score || a.r.n.length - b.r.n.length).slice(0, max);
}

export type Portion = {
  /** Share of one serving to eat, in quarters (0.25 … max). */
  factor: number;
  /** Calories of that share. */
  kcal: number;
  /** Even a quarter is well over what's left: better another dish or another day. */
  tight: boolean;
};

/** How much of a dish of `kcal` per serving fits `budget` calories, rounded to a quarter serving. */
export function portionFor(kcal: number, budget: number, max = 1.5): Portion {
  if (!(kcal > 0)) return { factor: 1, kcal: 0, tight: false };
  const raw = Math.max(0, budget) / kcal;
  const factor = Math.min(max, Math.max(0.25, Math.round(raw * 4) / 4));
  return { factor, kcal: Math.round(kcal * factor), tight: raw < 0.2 };
}

/** "تلات تربع الطبق" / "three quarters of the serving". */
export function portionText(f: number): string {
  const ar: Record<string, string> = { '0.25': 'ربع الطبق', '0.5': 'نص الطبق', '0.75': 'تلات تربع الطبق', '1': 'الطبق كله', '1.25': 'طبق وربع', '1.5': 'طبق ونص' };
  const en: Record<string, string> = { '0.25': 'a quarter of the serving', '0.5': 'half the serving', '0.75': 'three quarters of the serving', '1': 'the full serving', '1.25': '1¼ servings', '1.5': '1½ servings' };
  return L(ar[String(f)] ?? `${f} من الطبق`, en[String(f)] ?? `${f} servings`);
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const toWestern = (s: string) => s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/٫/g, '.');
const toArabic = (s: string) => s.replace(/\d/g, (d) => AR_DIGITS[+d]).replace(/\./g, '٫');
const AR_WORDS: Record<string, number> = { 'تلات تربع': 0.75, 'نص': 0.5, 'ربع': 0.25, 'تلت': 0.33 };
const VULGAR: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.33, '⅔': 0.67 };
const GRAMS = /^\s*(جم|جرام|مل|g\b|gm\b|grams?\b|ml\b|kg\b|كيلو)/i;

/** A quantity in quarters for counts ("١ ونص", "1½"), or to 5 for grams and millilitres. */
function fmtQty(v: number, grams: boolean, en: boolean): string {
  if (grams && v >= 20) return en ? String(Math.round(v / 5) * 5) : toArabic(String(Math.round(v / 5) * 5));
  const q = Math.max(0.25, Math.round(v * 4) / 4);
  const whole = Math.floor(q);
  const part = q - whole;
  if (en) return `${whole || ''}${({ 0.25: '¼', 0.5: '½', 0.75: '¾' } as Record<number, string>)[part] ?? ''}` || '0';
  const w = whole ? toArabic(String(whole)) : '';
  const p = ({ 0.25: 'ربع', 0.5: 'نص', 0.75: 'تلات تربع' } as Record<number, string>)[part];
  return w && p ? `${w} و${p}` : w || p || '٠';
}

/**
 * One ingredient line with its leading quantity times `factor` ("٢٠٠ جم فول" × 0.75 → "١٥٠ جم فول",
 * "1/2 onion" × 1.5 → "¾ onion"). Lines without a leading quantity (spices, "to taste") come back unchanged.
 */
export function scaleLine(text: string, factor: number, en = false): string {
  if (factor === 1) return text;
  const s = toWestern(text);
  let m = s.match(/^\s*(\d+(?:\.\d+)?)\s*\/\s*(\d+)/);
  let v: number | null = null;
  let len = 0;
  if (m) { v = +m[1] / +m[2]; len = m[0].length; }
  else if ((m = s.match(/^\s*(\d+(?:\.\d+)?)(?:\s*([½¼¾⅓⅔]))?/)) && !/^\s*\d+(?:\.\d+)?\s*[-–]\s*\d/.test(s)) { v = +m[1] + (m[2] ? VULGAR[m[2]] : 0); len = m[0].length; }
  else if ((m = s.match(/^\s*([½¼¾⅓⅔])/))) { v = VULGAR[m[1]]; len = m[0].length; }
  else for (const [w, x] of Object.entries(AR_WORDS)) if (s.trimStart().startsWith(w + ' ')) { v = x; len = s.indexOf(w) + w.length; break; }
  if (v == null || !(v > 0)) return text;
  // Digit conversion keeps lengths, so the rest of the original line (with its own digits) starts at `len`.
  return fmtQty(v * factor, GRAMS.test(s.slice(len)), en) + text.slice(len);
}
