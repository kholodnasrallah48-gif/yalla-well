// Food list, personal food advice (conditions, blood sugar, calorie budget) and a free-text meal parser.
import { AR_EN } from './food-words.ts';
import { FOOD_ROWS } from './foods-data.ts';
import { RECIPES, type Meal, type Recipe } from './recipes-data.ts';
import { genderFor, type Profile } from './plan.ts';

export type GI = 'low' | 'mid' | 'high' | 'none';
export type FoodTag =
  | 'soda' | 'sugary' | 'fried' | 'processed' | 'canned' | 'redmeat' | 'refined' | 'dairy' | 'gluten'
  | 'sweetener' | 'caffeine' | 'salty' | 'omega3' | 'fiber' | 'whole';
export type Food = {
  id: string; cat: string; n: string; u: string; kcal: number; p: number; c: number; f: number;
  gi?: GI; tags?: FoodTag[];
};

export const FOODS: Food[] = FOOD_ROWS.map((r, i) => ({
  id: 'f' + i, cat: r[0], n: r[1], u: r[2], kcal: r[3], p: r[4], c: r[5], f: r[6], gi: r[7], tags: r[8],
}));
export const MY_FOODS_CAT = 'أكلاتي';
export const ALL_CAT = 'الكل';
export const FOOD_CATS = [ALL_CAT, ...Array.from(new Set(FOODS.map((f) => f.cat))), MY_FOODS_CAT];
/** A food logged on at least this many recent days is shown as one the person eats often. */
export const OFTEN = 2;
/** Most-used foods first (keeping the list's own order otherwise). */
export function byUse(list: Food[], usage: Record<string, number>): Food[] {
  return list.map((f, i) => ({ f, i, n: usage[f.id] ?? 0 })).sort((a, b) => b.n - a.n || a.i - b.i).map((x) => x.f);
}
/** The person's usual foods, most used first. */
export function oftenFoods(list: Food[], usage: Record<string, number>, max = 6): Food[] {
  return byUse(list.filter((f) => (usage[f.id] ?? 0) >= OFTEN), usage).slice(0, max);
}

const AUTOIMMUNE = ['hashimoto', 'graves', 'ra', 'psoriasis', 'lupus', 'ms', 'ibd', 'celiac', 't1d'];
const SUGAR = ['t1d', 't2d', 'ir', 'pcos'];
const COND_NAME: Record<string, string> = {
  hashimoto: 'الهاشيموتو', graves: 'الغدة', ra: 'الروماتويد', psoriasis: 'الصدفية', lupus: 'اللوبس', ms: 'الـ MS',
  ibd: 'القولون', celiac: 'السيلياك', t1d: 'السكر',
};

export type Level = 'good' | 'ok' | 'warn' | 'bad';
export type Advice = { level: Level; notes: { level: Level; text: string }[]; swaps: Food[] };
const RANK: Record<Level, number> = { good: 0, ok: 1, warn: 2, bad: 3 };

/** Health notes for one food and this person, without calorie budget or swaps. */
function judge(p: Profile, f: Food): { level: Level; text: string }[] {
  const g = genderFor(p.sex);
  const t = new Set(f.tags ?? []);
  const has = (id: string) => p.conditions.includes(id) || p.meds.includes(id);
  const auto = p.conditions.filter((x) => AUTOIMMUNE.includes(x));
  const sugar = SUGAR.some(has) || has('insulin');
  const disease = auto.length ? COND_NAME[auto[0]] : '';
  const out: { level: Level; text: string }[] = [];

  if (has('celiac') && t.has('gluten')) out.push({ level: 'bad', text: 'فيه جلوتين، وده ممنوع مع السيلياك.' });
  if (auto.length) {
    if (t.has('soda')) out.push({ level: 'bad', text: `المياه الغازية فيها سكر وإضافات ممكن تزود الالتهاب في الجسم وتهيج ${disease}.` });
    else if (t.has('sugary')) out.push({ level: 'warn', text: `السكر الكتير بيزود الالتهاب، وده مش في صالح ${disease}.` });
    if (t.has('processed') || t.has('canned')) out.push({ level: 'warn', text: `أكل مصنّع أو معلب، فيه مواد حافظة وملح ممكن يزودوا الالتهاب. ${g('خليه', 'خليه')} مرة على قد ما ${g('تقدر', 'تقدري')}.` });
    if (t.has('fried')) out.push({ level: 'warn', text: 'المقلي بيزود الالتهاب. المشوي أو اللي في الفرن أحسن.' });
    if (t.has('redmeat')) out.push({ level: 'ok', text: 'اللحمة الحمرا كويسة مرة أو مرتين في الأسبوع، والفراخ والسمك أحسن لباقي الأيام.' });
    if (t.has('omega3')) out.push({ level: 'good', text: 'فيه أوميجا ٣، وده بيقلل الالتهاب.' });
    if (has('ibd') && t.has('fiber')) out.push({ level: 'ok', text: `لو القولون نشط النهارده ${g('قلل', 'قللي')} الألياف الخشنة.` });
  }
  if (sugar) {
    if (t.has('soda') || t.has('sugary') || f.gi === 'high') out.push({ level: 'bad', text: `هيرفع السكر في الدم بسرعة. لو ${g('هتاكله', 'هتاكليه')} خليه كمية صغيرة وبعد أكل فيه بروتين.` });
    else if (f.gi === 'mid') out.push({ level: 'warn', text: `بيرفع السكر بدرجة متوسطة. ${g('كله', 'كليه')} مع بروتين أو سلطة عشان يبطأ الامتصاص.` });
    else if (f.gi === 'low' && f.c > 5) out.push({ level: 'good', text: 'مناسب للسكر ومقاومة الإنسولين، بيرفع السكر ببطء.' });
    if (t.has('sweetener')) out.push({ level: 'ok', text: 'من غير سكر وده أحسن، بس المحليات بتزود الرغبة في الحلو. المياه أحسن.' });
  }
  if (has('steroids') && (t.has('salty') || t.has('sugary') || t.has('soda'))) out.push({ level: 'warn', text: 'مع الكورتيزون قللي الملح والسكر عشان الضغط والسكر والمياه في الجسم.' });
  if (has('thyroxine') && t.has('caffeine')) out.push({ level: 'ok', text: `القهوة والشاي بعد دوا الغدة بساعة على الأقل.` });
  if (!auto.length && !sugar && (t.has('soda') || t.has('sugary'))) out.push({ level: 'warn', text: 'سكر كتير وقيمة غذائية قليلة.' });
  if (f.p >= 20 && !out.some((x) => x.level === 'bad')) out.push({ level: 'good', text: 'مصدر بروتين كويس.' });
  return out;
}

/** Health notes for one food and this person (conditions, meds, blood sugar), without the calorie budget. */
export const healthNotes = judge;

type Macros = { kcal: number; p: number; c: number; f: number };
type Limits = { kcal: number; protein: number; carbs: number; fat: number };
/**
 * Warnings for one logged item: health notes for this person, a lot of salt, a big share of the day's fat or carbs,
 * and the moment this item pushes the day past its calorie, fat or carb limit. `before` is the day's total before it.
 */
export function itemAlerts(p: Profile, f: Food, q: number, before: Macros, T: Limits): { level: Level; text: string }[] {
  const g = genderFor(p.sex);
  const out = judge(p, f).filter((n) => n.level === 'warn' || n.level === 'bad');
  const t = new Set(f.tags ?? []);
  if (t.has('salty') && !out.some((n) => n.text.includes('ملح'))) out.push({ level: 'warn', text: 'فيها ملح كتير، وده بيحبس المياه في الجسم ويرفع الضغط.' });
  const fat = f.f * q, carbs = f.c * q, kcal = f.kcal * q;
  const pct = (a: number, b: number) => Math.round((a / Math.max(b, 1)) * 100);
  const after = { kcal: before.kcal + kcal, c: before.c + carbs, f: before.f + fat };
  const crossed = (name: string, was: number, now: number, lim: number, unit: string) =>
    was <= lim && now > lim ? { level: 'bad' as Level, text: `مع دي ${g('عديت', 'عديتي')} المسموح ${g('ليك', 'ليكي')} من ${name} النهارده (${Math.round(now)} من ${lim}${unit}).` } : null;
  const over = [
    crossed('السعرات', before.kcal, after.kcal, T.kcal, ' سعرة'),
    crossed('الدهون', before.f, after.f, T.fat, ' جم'),
    crossed('الكارب', before.c, after.c, T.carbs, ' جم'),
  ].filter((x): x is { level: Level; text: string } => !!x);
  out.push(...over);
  if (!over.some((n) => n.text.includes('الدهون')) && fat >= T.fat * 0.4) out.push({ level: 'warn', text: `فيها دهون كتير: ${Math.round(fat)} جم، يعني ${pct(fat, T.fat)}٪ من المسموح في اليوم.` });
  if (!over.some((n) => n.text.includes('الكارب')) && carbs >= T.carbs * 0.45) out.push({ level: 'warn', text: `فيها كارب كتير: ${Math.round(carbs)} جم، يعني ${pct(carbs, T.carbs)}٪ من المسموح في اليوم.` });
  return out.sort((a, b) => RANK[b.level] - RANK[a.level]);
}

const worst = (notes: { level: Level }[]): Level => notes.reduce<Level>((a, n) => (RANK[n.level] > RANK[a] ? n.level : a), notes.length ? 'good' : 'ok');

/** Verdict for adding one portion now, with better swaps when it doesn't fit. */
export function foodAdvice(p: Profile, f: Food, remaining: number, pool: Food[] = FOODS): Advice {
  const g = genderFor(p.sex);
  const notes = judge(p, f);
  if (f.kcal > remaining) {
    notes.push({ level: 'warn', text: remaining > 0 ? `هتعدي هدف النهارده بـ ${Math.round(f.kcal - remaining)} سعرة.` : `${g('خلصت', 'خلصتي')} سعرات النهارده، فأي زيادة هتعدي الهدف.` });
  }
  const level = worst(notes);
  const swaps = RANK[level] >= RANK.warn ? findSwaps(p, f, pool) : [];
  return { level, notes: notes.sort((a, b) => RANK[b.level] - RANK[a.level]), swaps };
}

// ---- Swaps that fit what the person wanted to eat ----

const MEAL_CAT: Record<Meal, string> = { breakfast: 'فطار', lunch: 'غدا', dinner: 'عشا', snack: 'سناك' };
/** A recipe as a loggable food. */
export const recipeFood = (r: Recipe): Food => ({ id: 'r_' + r.id, cat: MEAL_CAT[r.meal], n: r.n, u: r.serving, kcal: r.kcal, p: r.p, c: r.c, f: r.f, gi: r.gi, tags: r.tags });
export const recipeFits = (p: Profile, r: Recipe) => !(r.avoid ?? []).some((x) => p.conditions.includes(x));

type Kind = { re: RegExp; alts: string[]; recipes?: RegExp; meal?: Meal; drink?: boolean };
// What the food is, so a swap stays in the same craving: crunchy snack → crunchy snack, dessert → something sweet.
const KINDS: Kind[] = [
  { re: /شيبس|برينجلز|pringles|chips|crisps|تورتيلا شيبس|doritos|دوريتوس|كرانشي|فرايز|fries|بطاطس محمره|لب |سوداني محمص|سناك|snack|popcorn|كراكرز|crackers/,
    alts: ['فشار', 'ترمس', 'حمص الشام', 'لوز'], recipes: /فشار|مقرمش|شيبس|ترمس|مكسرات/ },
  { re: /شوكولا|chocolate|كيك|cake|جاتوه|دونات|donut|كنافه|قطايف|بسبوسه|جلاش|بقلاوه|حلاوه|رز بلبن|مهلبيه|كريم كراميل|بسكوت|biscuit|cookie|wafer|ويفر|نوتيلا|nutella|ايس ?كريم|ice cream|حلويات|candy|بونبون|تورته|كب ?كيك/,
    alts: ['زبادي يوناني لايت', 'فراولة', 'بلح سيوي', 'تفاح'], recipes: /تمر|بلح|زبادي|موز|ايس كريم|فاكه|شوفان|بان ?كيك/ },
  { re: /فطير|مشلتت|كرواسون|croissant|بان ?كيك|pancake|وافل|waffle|باتيه|كورن ?فليكس|cereal|بليله|كسكسي|معجنات|pastry|muffin|مافن|دوناتس/,
    alts: ['شوفان باللبن', 'توست حبوب كاملة', 'بيضة مسلوقة', 'جبنة قريش'], meal: 'breakfast' },
  { re: /عصير|juice|ريد ?بول|سحلب|سوبيا|قصب|فراوله باللبن|لبن بالشوكولاته|فرابتشينو|كولا|cola|soda|بيبسي|سبرايت|فانتا|fanta|ميرندا|شويبس|نسكافيه ٣|energy drink/,
    alts: ['شاي من غير سكر', 'شاي أخضر', 'قهوة تركي سادة', 'نسكافيه بلبن من غير سكر'], drink: true },
  { re: /برجر|burger|بيتزا|pizza|شاورما|shawarma|كريسبي|نجتس|nugget|هوت ?دوج|كشري|حواوشي|ساندوتش|sandwich|بانيه|كنتاكي|kfc|فاست ?فود|وجبه/,
    alts: ['صدر فراخ مشوي', 'كفتة مشوية', 'سمك بلطي مشوي'], recipes: /ساندوتش|كباب|شيش|كفته|مشوي|فرن|طاووق/ },
  { re: /توست ابيض|عيش فينو|عيش شامي|white bread|تورتيلا|بقسماط/, alts: ['عيش سن', 'توست حبوب كاملة', 'عيش شوفان'] },
  { re: /رز ابيض|رز بالشعريه|رز معمر|مكرونه|pasta|spaghetti|بطاطس|potato|rice/, alts: ['رز بني', 'كينوا', 'مكرونة قمح كامل', 'بطاطس بالفرن'], recipes: /رز بني|كينوا|سن|بطاطا/ },
];

/** Up to 3 healthier foods in the same craving as `f`, suited to this person's conditions. */
export function findSwaps(p: Profile, f: Food, pool: Food[] = FOODS): Food[] {
  const text = norm(f.n);
  const kind = KINDS.find((k) => k.re.test(text)) ?? (f.tags?.includes('soda') ? KINDS[3] : undefined);
  const byName = new Map(pool.map((x) => [norm(x.n), x]));
  const healthy = (x: Food) => x.id !== f.id && RANK[worst(judge(p, x))] <= RANK.ok && !(x.tags ?? []).some((t) => ['soda', 'sugary', 'processed', 'fried'].includes(t));
  let cands: Food[] = [];
  if (kind) {
    const recipes = RECIPES.filter((r) => recipeFits(p, r) && (kind.meal ? r.meal === kind.meal : kind.recipes ? kind.recipes.test(norm(r.n)) : false)).map(recipeFood);
    cands = [...recipes, ...kind.alts.map((n) => byName.get(norm(n))).filter((x): x is Food => !!x)];
    if (kind.drink) cands.push(...pool.filter((x) => x.cat === 'مشروبات' && x.kcal <= 20));
  } else if (f.tags?.includes('fried')) {
    cands = pool.filter((x) => x.cat === f.cat && /مشوي|فرن|مسلوق|سوتيه/.test(norm(x.n)));
  }
  if (!cands.length) {
    // Same section, closest in what it's made of (share of energy from protein, carbs and fat) and in name.
    const mix = (x: Food) => { const e = Math.max(x.kcal, 1); return [(x.p * 4) / e, (x.c * 4) / e, (x.f * 9) / e]; };
    const [a, b, c] = mix(f);
    const words = new Set(norm(f.n).split(/\s+/));
    cands = pool.filter((x) => x.cat === f.cat).map((x) => {
      const [d, e, g] = mix(x);
      const shared = norm(x.n).split(/\s+/).filter((w) => words.has(w)).length;
      return { x, s: Math.abs(a - d) + Math.abs(b - e) + Math.abs(c - g) - shared * 0.4 };
    }).sort((u, v) => u.s - v.s).map((u) => u.x);
  }
  const seen = new Set<string>();
  // Prefer swaps that share words with the original (كفتة → ساندوتش كفتة فراخ), then the healthier, then list order.
  const words = norm(f.n).split(/\s+/).filter((w) => w.length > 2);
  const shared = (x: Food) => norm(x.n).split(/\s+/).filter((w) => words.some((v) => v === w || (w.length > 3 && v.length > 3 && (v.startsWith(w) || w.startsWith(v))))).length;
  return cands
    .filter((x) => healthy(x) && x.kcal <= Math.max(f.kcal * 1.3, 150) && !seen.has(x.n) && seen.add(x.n))
    .map((x, i) => ({ x, i, s: RANK[worst(judge(p, x))], w: shared(x) }))
    .sort((u, v) => v.w - u.w || u.s - v.s || u.i - v.i)
    .slice(0, 3)
    .map((u) => u.x);
}

/** The colour-dot level for the food list, ignoring the calorie budget. */
export const foodLevel = (p: Profile, f: Food): Level => worst(judge(p, f));

// ---- Free-text meal parser ----

const DIGITS: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
export const norm = (s: string) =>
  s.replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[٠-٩]/g, (d) => DIGITS[d]).toLowerCase().trim();

const QTY_WORDS: Record<string, number> = {
  'نص': 0.5, 'ربع': 0.25, 'تلت': 0.33, 'واحد': 1, 'واحده': 1, 'اتنين': 2, 'اثنين': 2, 'تلاته': 3, 'تلات': 3, 'ثلاثه': 3,
  'اربعه': 4, 'اربع': 4, 'خمسه': 5, 'خمس': 5, 'سته': 6, 'ست': 6, 'سبعه': 7, 'تمانيه': 8, 'تسعه': 9, 'عشره': 10,
  'رغيفين': 2, 'بيضتين': 2, 'معلقتين': 2, 'كوبايتين': 2, 'طبقين': 2, 'حبتين': 2, 'قطعتين': 2,
};
// Plural or dual words mapped to the singular stem used in food names.
const STEMS: Record<string, string> = { 'بيضتين': 'بيضه', 'بيض': 'بيضه', 'رغيفين': 'عيش', 'رغيف': 'عيش', 'كوبايتين': 'كوب', 'تفاحتين': 'تفاحه', 'موزتين': 'موزه', 'بلحات': 'بلح', 'عيشه': 'عيش', 'اسمر': 'بني', 'سمرا': 'بني', 'فراخ': 'فراخ' };
const FILLER = new Set(['طبق', 'كوبايه', 'كوب', 'حبه', 'حبايه', 'قطعه', 'معلقه', 'علبه', 'جم', 'جرام', 'من', 'في', 'شويه', 'صغير', 'صغيره', 'كبير', 'كبيره', 'متوسط', 'متوسطه', 'حته', 'اكلت', 'شربت', 'فطرت', 'تغديت', 'اتعشيت']);

export type ParsedItem = { food: Food; q: number; text: string; grams?: number };
export type Unknown = { text: string; q: number; grams?: number };

const GRAM_WORDS = new Set(['جم', 'جرام', 'جرامات', 'g', 'gm', 'مل']);
/** Grams in one portion from its text, e.g. "طبق ٢٠٠ جم" → 200. */
export function portionGrams(u: string): number | null {
  const m = norm(u).match(/(\d+(?:\.\d+)?)\s*(جم|مل|جرام)/);
  return m ? parseFloat(m[1]) : null;
}

/** Best one-to-one match of query words to name tokens (each word and token used once). */
function matchScore(rest: string[], toks: string[]): { hit: number; covered: number } {
  const m = (w: string, t: string) => (t === w ? 1 : w.length > 2 && t.length > 2 && Math.abs(w.length - t.length) <= 1 && (t.startsWith(w) || w.startsWith(t)) ? 0.8 : 0);
  const pairs: { i: number; j: number; s: number }[] = [];
  rest.forEach((w, i) => toks.forEach((t, j) => { const s = m(w, t); if (s) pairs.push({ i, j, s }); }));
  pairs.sort((a, b) => b.s - a.s);
  const ui = new Set<number>(), uj = new Set<number>();
  let total = 0;
  for (const x of pairs) if (!ui.has(x.i) && !uj.has(x.j)) { ui.add(x.i); uj.add(x.j); total += x.s; }
  return { hit: total, covered: total };
}

/** Splits "٢ بيض وعيش بلدي وجبنة قريش" into foods from the list with quantities; the rest is returned as unknown. */
export function parseMeal(text: string, pool: Food[] = FOODS): { items: ParsedItem[]; unknown: Unknown[] } {
  const names = pool.map((f) => ({ f, toks: norm(f.n).split(/\s+/) }));
  const vocab = new Set(names.flatMap((x) => x.toks));
  const known = (w: string) => vocab.has(w) || vocab.has(STEMS[w] ?? '') || [...vocab].some((v) => v.length > 2 && Math.abs(v.length - w.length) <= 1 && (v.startsWith(w) || w.startsWith(v)));
  // "بسكر" → "سكر", "الفول" → "فول" when only the bare word is a food word.
  const strip = (w: string) => known(w) ? w : (['بال', 'ال', 'ب'].map((p) => (w.startsWith(p) ? w.slice(p.length) : '')).find((x) => x.length > 1 && known(x)) ?? w);
  const words = norm(text).replace(/(\d)(جم|جرام|g)/g, '$1 $2').replace(/[،,+\n.؛;]/g, ' | ').replace(/\s(مع|و)\s/g, ' | ').split(/\s+/).filter(Boolean);
  const chunks: string[][] = [[]];
  for (const w of words) {
    if (w === '|') { chunks.push([]); continue; }
    if (/^و\d/.test(w)) { chunks.push([w.slice(1)]); continue; }
    // "وعيش" → boundary + "عيش" when the word itself isn't a food word.
    if (w.length > 2 && w.startsWith('و') && !known(w) && (known(w.slice(1)) || !!AR_EN[w.slice(1)])) { chunks.push([w.slice(1)]); continue; }
    chunks[chunks.length - 1].push(w);
  }
  const items: ParsedItem[] = [];
  const unknown: Unknown[] = [];
  for (const ch of chunks) {
    if (!ch.length) continue;
    let q = 1;
    let grams: number | undefined;
    const rest: string[] = [];
    const label: string[] = [];
    for (let k = 0; k < ch.length; k++) {
      const w = ch[k];
      const next = ch[k + 1];
      if (/^\d+(\.\d+)?$/.test(w) && next && GRAM_WORDS.has(next)) { grams = parseFloat(w); k++; }
      else if (w === 'كيلو') grams = q * 1000;
      else if (/^\d+(\.\d+)?$/.test(w)) q = parseFloat(w);
      else if (QTY_WORDS[w] != null && !vocab.has(w)) { q = QTY_WORDS[w]; if (STEMS[w] && !FILLER.has(STEMS[w])) { rest.push(STEMS[w]); label.push(w); } }
      else if (!FILLER.has(w)) { rest.push(STEMS[w] ?? strip(w)); label.push(w); }
    }
    if (!rest.length) continue;
    let best: { f: Food; s: number } | null = null;
    for (const { f, toks } of names) {
      const { hit, covered } = matchScore(rest, toks);
      if (!hit) continue;
      const s = hit / rest.length + (0.5 * covered) / toks.length;
      if (!best || s > best.s) best = { f, s };
    }
    if (best && best.s >= 0.9) {
      const pg = grams != null ? portionGrams(best.f.u) : null;
      items.push({ food: best.f, q: grams != null && pg ? Math.round((grams / pg) * 100) / 100 : q, text: ch.join(' '), grams });
    } else unknown.push({ text: label.join(' '), q, grams });
  }
  return { items, unknown };
}
