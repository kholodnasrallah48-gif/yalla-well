// Food list, personal food advice (conditions, blood sugar, calorie budget) and a free-text meal parser.
import { AR_EN } from './food-words.ts';
import { FOOD_ROWS } from './foods-data.ts';
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

const worst = (notes: { level: Level }[]): Level => notes.reduce<Level>((a, n) => (RANK[n.level] > RANK[a] ? n.level : a), notes.length ? 'good' : 'ok');

/** Verdict for adding one portion now, with better swaps when it doesn't fit. */
export function foodAdvice(p: Profile, f: Food, remaining: number, pool: Food[] = FOODS): Advice {
  const g = genderFor(p.sex);
  const notes = judge(p, f);
  if (f.kcal > remaining) {
    notes.push({ level: 'warn', text: remaining > 0 ? `هتعدي هدف النهارده بـ ${Math.round(f.kcal - remaining)} سعرة.` : `${g('خلصت', 'خلصتي')} سعرات النهارده، فأي زيادة هتعدي الهدف.` });
  }
  const level = worst(notes);
  let swaps: Food[] = [];
  if (RANK[level] >= RANK.warn) {
    const sameCat = f.tags?.includes('soda') ? 'مشروبات' : f.cat;
    swaps = pool
      .filter((x) => x.id !== f.id && x.cat === sameCat && x.kcal <= Math.max(f.kcal, 60) * 1.1)
      .map((x) => ({ x, s: RANK[worst(judge(p, x))] }))
      .filter(({ x, s }) => s <= RANK.ok && !(x.tags ?? []).some((t) => ['soda', 'sugary', 'processed', 'fried'].includes(t)))
      .sort((a, b) => a.s - b.s || (sameCat === 'مشروبات' ? a.x.kcal - b.x.kcal : b.x.p / Math.max(b.x.kcal, 1) - a.x.p / Math.max(a.x.kcal, 1)))
      .slice(0, 3)
      .map(({ x }) => x);
  }
  return { level, notes: notes.sort((a, b) => RANK[b.level] - RANK[a.level]), swaps };
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
