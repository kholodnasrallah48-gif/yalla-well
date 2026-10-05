// Food photos without API keys: TheMealDB's dish photo when the dish matches, else the Wikipedia (English, then
// Arabic) article thumbnail, else the Open Food Facts product image for packaged foods. Results (and misses) are
// cached; lookups run a few at a time and never throw. The UI shows a drawn placeholder until (unless) one arrives.
import { cacheGet, cachePeek, cacheSet } from './cache.ts';
import { EN_DATA } from './en/index.ts';
import { norm } from './foods.ts';

/** What a photo is looked up by. */
export type ImageKey = {
  /** Food or recipe id ('f12', 'b_foul_oil', 'off123_100', 'bc622…', 'mdb_52772', 'c17…'). */
  id: string;
  /** Arabic name (or the online name). */
  n: string;
  /** A photo URL we already have (TheMealDB thumb, Open Food Facts image). */
  img?: string;
};

/**
 * Wikipedia titles (tried in order) for our recipes, by id, where the English name wouldn't find an article.
 * The first title is also tried on TheMealDB.
 */
export const RECIPE_TITLES: Record<string, string[]> = {
  b_foul_oil: ['Ful medames'], b_egg_baladi: ['Boiled egg'], b_shakshuka: ['Shakshouka'], b_oats_milk_fruit: ['Porridge'],
  b_qareish_veg: ['Areesh cheese', 'Cottage cheese'], b_veg_omelette: ['Omelette'], b_greek_yogurt_bowl: ['Strained yogurt'], b_foul_tahini: ['Ful medames'],
  b_cheese_egg_wrap: ['Wrap (food)'], b_sweet_potato_egg: ['Sweet potato'], b_labneh_zaatar: ['Labneh'], b_belila: ['Belila', 'Wheat berry'],
  b_banana_oat_pancake: ['Pancake'], b_taameya_air: ['Falafel'],
  l_chicken_lemon_garlic: ['Roast chicken'], l_tilapia_grilled: ['Tilapia as food', 'Tilapia'], l_salmon_oven: ['Salmon as food'],
  l_potato_chicken_tray: ['Roast chicken'], l_molokhia_chicken: ['Mulukhiyah'], l_brown_rice_veg: ['Brown rice'], l_whole_pasta_chicken: ['Pasta'],
  l_kofta_meat: ['Kofta'], l_shish_tawook: ['Shish taouk'], l_mahshi_zucchini: ['Mahshi', 'Dolma'], l_kebab_hala: ['Beef stew', 'Stew'],
  l_koshary_healthy: ['Koshary'], l_okra_chicken: ['Bamia', 'Okra'], l_white_beans: ['Fasolada', 'Baked beans'], l_sardine_oven: ['Sardines as food', 'Sardine'],
  l_freekeh_chicken: ['Freekeh'],
  d_lentil_soup: ['Lentil soup'], d_tuna_salad: ['Tuna salad'], d_chicken_kofta_sandwich: ['Kofta'], d_oven_kebab: ['Kebab'],
  d_grilled_chicken_salad: ['Chicken salad'], d_mackerel_grilled: ['Mackerel as food'], d_veg_chicken_soup: ['Chicken soup'], d_hummus_plate: ['Hummus'],
  d_mushroom_omelette: ['Omelette'], d_shrimp_grilled: ['Shrimp and prawn as food'], d_baked_eggplant: ['Moussaka'], d_chicken_shawarma_bowl: ['Shawarma'],
  d_bisara: ['Bissara'], d_tilapia_fillet_veg: ['Tilapia as food', 'Tilapia'],
  s_popcorn: ['Popcorn'], s_roasted_chickpeas: ['Chickpea'], s_termis: ['Lupin bean'], s_dates_almonds: ['Medjool', 'Date palm'],
  s_sweet_potato_chips: ['Sweet potato fries', 'Sweet potato'], s_zucchini_chips: ['Zucchini'], s_yogurt_fruit: ['Strained yogurt'],
  s_banana_pb: ['Peanut butter'], s_banana_icecream: ['Banana'], s_veggie_hummus: ['Hummus'], s_nuts_mix: ['Mixed nuts', 'Nut (fruit)'],
  s_grilled_corn: ['Corn on the cob'],
};

/** Wikipedia titles for foods in our list whose English names wouldn't find the right article, by Arabic name. */
export const FOOD_TITLES: Record<string, string[]> = {
  'فول مدمس': ['Ful medames'], 'فول بالزيت الحار': ['Ful medames'], 'فول بالطحينة': ['Ful medames'], 'فول إسكندراني': ['Ful medames'],
  'فول بالسجق': ['Ful medames'], 'طعمية': ['Falafel'], 'ساندوتش طعمية': ['Falafel'], 'ساندوتش فول': ['Ful medames'], 'شكشوكة': ['Shakshouka'],
  'جبنة قريش': ['Areesh cheese', 'Cottage cheese'], 'جبنة قريش لايت': ['Areesh cheese', 'Cottage cheese'], 'جبنة رومي': ['Roumy cheese', 'Kashkaval'],
  'جبنة مثلثات (نستو)': ['Processed cheese'], 'جبنة ميش': ['Mish (food)'], 'قشطة': ['Clotted cream'], 'فطير مشلتت': ['Feteer meshaltet'],
  'فطير مشلتت بالعسل والقشطة': ['Feteer meshaltet'], 'شوفان باللبن': ['Porridge'], 'شوفان بالمية والموز': ['Porridge'],
  'كورن فليكس باللبن': ['Corn flakes'], 'حلاوة طحينية': ['Halva'], 'بليلة باللبن': ['Belila', 'Wheat berry'],
  'عيش بلدي': ['Eish baladi', 'Pita'], 'عيش سن': ['Eish baladi', 'Whole-wheat flour'], 'عيش شامي': ['Pita'], 'عيش فينو': ['Bread roll'],
  'توست أبيض': ['Toast'], 'توست بني': ['Toast'], 'توست حبوب كاملة': ['Whole-wheat bread'], 'رز أبيض': ['Rice'], 'رز بالشعرية': ['Rice'],
  'رز معمر': ['Rice'], 'مكرونة مسلوقة': ['Pasta'], 'مكرونة بالصلصة': ['Pasta'], 'بطاطس محمرة بيتي': ['French fries'], 'بطاطس بالفرن': ['Baked potato'],
  'صدر فراخ مشوي': ['Chicken as food'], 'ربع فرخة مشوية': ['Roast chicken'], 'فراخ بانيه': ['Schnitzel'], 'استربس فراخ': ['Chicken fingers'],
  'شيش طاووق': ['Shish taouk'], 'كفتة مشوية': ['Kofta'], 'ريش ضاني': ['Lamb and mutton'], 'سجق': ['Sujuk'], 'بسطرمة': ['Pastirma'],
  'سمك بلطي مشوي': ['Tilapia as food', 'Tilapia'], 'سمك بلطي مقلي': ['Fried fish'], 'بوري مشوي': ['Flathead grey mullet'],
  'سالمون مشوي': ['Salmon as food'], 'سردين مشوي': ['Sardines as food'], 'جمبري مشوي': ['Shrimp and prawn as food'], 'رنجة': ['Kipper'],
  'فسيخ': ['Fesikh'], 'عدس بجبة': ['Lentil'], 'بيصارة': ['Bissara'], 'ملوخية': ['Mulukhiyah'], 'بامية باللحمة': ['Bamia', 'Okra'],
  'مسقعة': ['Moussaka'], 'محشي كرنب': ['Cabbage roll'], 'محشي ورق عنب': ['Dolma'], 'محشي كوسة وباذنجان': ['Mahshi', 'Dolma'],
  'محشي فلفل وطماطم': ['Stuffed peppers'], 'ممبار': ['Mumbar'], 'مكرونة بشاميل': ['Macarona béchamel', 'Pastitsio'], 'فتة باللحمة': ['Fatteh'],
  'كفتة داوود باشا': ['Kofta'], 'كوارع': ['Trotters'], 'حمام محشي فريك': ['Hamam mahshi', 'Squab (food)'], 'كبيبة': ['Kibbeh'],
  'شوربة لسان عصفور': ['Orzo'], 'كشري': ['Koshary'], 'حواوشي': ['Hawawshi'], 'شاورما فراخ': ['Shawarma'], 'شاورما لحمة': ['Shawarma'],
  'وجبة شاورما عربي': ['Shawarma'], 'ناجتس': ['Chicken nugget'], 'فرايز': ['French fries'], 'كبسة فراخ': ['Kabsa'], 'لحمة مندي': ['Mandi (food)'],
  'سلطة خضرا بلدي': ['Salad'], 'سلطة طحينة': ['Tahini'], 'سلطة زبادي بالخيار': ['Tzatziki'], 'جرجير': ['Eruca vesicaria'], 'مخلل مشكل': ['Torshi'],
  'مخلل مشكل (طرشي)': ['Torshi'], 'كاكا': ['Persimmon'], 'برتقان': ['Orange (fruit)'], 'بلح سيوي': ['Date palm'], 'بلح مجدول': ['Medjool'],
  'بلح أمهات': ['Date palm'], 'بسبوسة': ['Basbousa'], 'بسبوسة بالقشطة': ['Basbousa'], 'كنافة بالقشطة': ['Knafeh'], 'كنافة بالمكسرات': ['Knafeh'],
  'قطايف بالمكسرات': ['Qatayef'], 'أم علي': ['Umm Ali'], 'رز بلبن': ['Rice pudding'], 'مهلبية': ['Muhallebi'], 'بلح الشام': ['Tulumba'],
  'لقمة القاضي': ['Luqaimat'], 'كحك بالعجمية': ['Kahk'], 'سمسمية': ['Sesame seed candy'], 'فولية': ['Peanut brittle'], 'لب أبيض': ['Pumpkin seed'],
  'ترمس': ['Lupin bean'], 'حمص الشام': ['Chickpea'], 'شاي بمعلقتين سكر': ['Tea'], 'شاي من غير سكر': ['Tea'], 'شاي بلبن': ['Milk tea'],
  'كركديه بالسكر': ['Hibiscus tea'], 'نسكافيه ٣ في ١': ['Instant coffee'], 'نسكافيه بلبن من غير سكر': ['Instant coffee'],
  'قهوة تركي سادة': ['Turkish coffee'], 'قهوة تركي مظبوط': ['Turkish coffee'], 'سحلب بالمكسرات': ['Salep'], 'لبن كامل الدسم': ['Milk'],
  'عصير برتقان فريش': ['Orange juice'], 'عصير مانجا بالسكر': ['Mango'], 'عصير قصب': ['Sugarcane juice'], 'سوبيا': ['Sobia'],
  'خروب': ['Carob'], 'تمر هندي': ['Tamarind'], 'عرقسوس': ['Liquorice'], 'قمر الدين': ['Qamar al-Din'], 'مية': ['Drinking water'],
  'شيبسي': ['Potato chip'], 'شيبسي كيس كبير': ['Potato chip'], 'مولتو': ['Croissant'], 'إندومي': ['Instant noodles'], 'لانشون لحمة': ['Luncheon meat'],
  'لانشون فراخ': ['Luncheon meat'], 'جبنة سايحة': ['Processed cheese'], 'لبن رايب': ['Buttermilk'], 'عصير كرتونة (جهينة)': ['Juice'],
  'سمنة بلدي': ['Ghee'], 'سمنة نباتي': ['Vegetable shortening'], 'ثومية': ['Toum'], 'صلصة طماطم': ['Tomato paste'], 'طحينة خام': ['Tahini'],
  'عسل أسود': ['Molasses'], 'مربى': ['Fruit preserves'], 'محلي صناعي': ['Sugar substitute'],
};

/** "Ful medames (fava beans)" → "Ful medames"; null for names that read like portions rather than a dish. */
export function cleanTitle(en: string): string | null {
  const t = en.replace(/\([^)]*\)/g, '').replace(/[,;].*$/, '').replace(/\s+/g, ' ').trim();
  if (!t || /\d/.test(t) || t.split(' ').length > 4) return null;
  return t;
}

/** Wikipedia titles to try for one item, best first (English titles; the Arabic name is tried after these). */
export function titlesFor(k: ImageKey): string[] {
  const out: string[] = [];
  const rid = k.id.replace(/^r_/, '');
  if (RECIPE_TITLES[rid]) out.push(...RECIPE_TITLES[rid]);
  const name = k.n.trim();
  if (FOOD_TITLES[name]) out.push(...FOOD_TITLES[name]);
  const en = EN_DATA[name];
  const clean = en ? cleanTitle(en) : /^[\x20-\x7E]+$/.test(name) ? cleanTitle(name) : null;
  if (clean && !out.includes(clean)) out.push(clean);
  return out;
}

const UA = 'YallaWell/1.0 (github.com/kholodnasrallah48-gif/yalla-well)';
type Got<T> = { ok: true; data: T | null } | { ok: false };
/** GET JSON: `ok: true, data: null` for a definite miss (404), `ok: false` when the network failed (not cached). */
async function get<T>(url: string, ms = 8000): Promise<Got<T>> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    // Browsers refuse a custom User-Agent (and it would add a CORS preflight); native apps and node send one.
    const headers: Record<string, string> = typeof document === 'undefined' ? { 'User-Agent': UA, Accept: 'application/json' } : { Accept: 'application/json' };
    const res = await fetch(url, { headers, signal: ctl.signal });
    if (res.status === 404) return { ok: true, data: null };
    if (!res.ok) return { ok: false };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(t);
  }
}

type WikiSummary = { type?: string; thumbnail?: { source?: string }; originalimage?: { source?: string } };
/** The thumbnail of one Wikipedia article (redirects followed; disambiguation pages skipped). */
export async function wikiThumb(title: string, lang: 'en' | 'ar' = 'en'): Promise<Got<string>> {
  const r = await get<WikiSummary>(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`);
  if (!r.ok) return r;
  const j = r.data;
  if (!j || j.type === 'disambiguation') return { ok: true, data: null };
  return { ok: true, data: j.thumbnail?.source ?? null };
}

/** TheMealDB's photo for a dish name, only when the meal's name contains every word of it. */
export async function mealDBThumb(title: string): Promise<Got<string>> {
  const r = await get<{ meals?: { strMeal?: string; strMealThumb?: string }[] | null }>(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(title)}`);
  if (!r.ok) return r;
  const ws = title.toLowerCase().split(/\s+/);
  const m = (r.data?.meals ?? []).find((x) => ws.every((w) => (x.strMeal ?? '').toLowerCase().includes(w)));
  // A small version of the photo (TheMealDB serves /preview at 250 px).
  return { ok: true, data: m?.strMealThumb ? m.strMealThumb + '/preview' : null };
}

/** The front image of an Open Food Facts product by barcode. */
export async function offImage(code: string): Promise<Got<string>> {
  const r = await get<{ status?: number; product?: { image_front_small_url?: string; image_small_url?: string; image_front_url?: string } }>(
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=image_front_small_url,image_small_url,image_front_url`,
  );
  if (!r.ok) return r;
  const p = r.data?.product;
  return { ok: true, data: p?.image_front_small_url || p?.image_small_url || p?.image_front_url || null };
}

/**
 * A sharper version of a photo URL for big displays (the recipe page): TheMealDB's full photo instead of the
 * 250 px preview, a 1280 px Wikipedia thumbnail instead of the ~320 px one, Open Food Facts' 400 px image.
 * The same URL when there's nothing bigger to ask for.
 */
export function hiRes(url: string): string {
  if (/themealdb\.com/.test(url)) return url.replace(/\/(preview|small|medium)$/, '');
  if (/upload\.wikimedia\.org\/.*\/thumb\//.test(url)) return url.replace(/\/\d+px-([^/]+)$/, '/1280px-$1');
  if (/openfoodfacts\.org/.test(url)) return url.replace(/\.(100|200)\.jpg$/, '.400.jpg');
  return url;
}

/** The barcode of a packaged food from its id ('bc<code>' from scanning, 'off<code>_<grams>' from online search). */
export const barcodeOf = (id: string): string | null => id.match(/^(?:bc|off)(\d{6,14})(?:_\d+)?$/)?.[1] ?? null;

/** Finds a photo for one item: null when none was found (or we're offline). Never throws. */
async function find(k: ImageKey): Promise<{ url: string | null; sure: boolean }> {
  let sure = true;
  const take = (g: Got<string>) => { if (!g.ok) { sure = false; return null; } return g.data; };
  const code = barcodeOf(k.id);
  if (code) {
    const u = take(await offImage(code));
    if (u) return { url: u, sure };
  }
  const titles = titlesFor(k);
  if (titles.length && !code) {
    const u = take(await mealDBThumb(titles[0]));
    if (u) return { url: u, sure };
  }
  for (const t of titles.slice(0, 3)) {
    const u = take(await wikiThumb(t, 'en'));
    if (u) return { url: u, sure };
  }
  // Arabic article by the Arabic name ("فول مدمس", "كشري"); only short names can be an article title.
  const ar = k.n.replace(/\([^)]*\)/g, '').trim();
  if (/[؀-ۿ]/.test(ar) && ar.split(/\s+/).length <= 3) {
    const u = take(await wikiThumb(ar, 'ar'));
    if (u) return { url: u, sure };
  }
  return { url: null, sure };
}

/** Cache key: our recipes by id, everything else by its name (same name → same photo). */
const keyOf = (k: ImageKey) => {
  const rid = k.id.replace(/^r_/, '');
  return RECIPE_TITLES[rid] ? 'img:r:' + rid : 'img:n:' + norm(k.n).slice(0, 80);
};

const running = new Map<string, Promise<string | null>>();
const queue: (() => void)[] = [];
let active = 0;
const MAX = 3;
function slot<T>(job: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve) => {
    const run = () => { active++; job().then(resolve, () => resolve(null as T)).finally(() => { active--; queue.shift()?.(); }); };
    if (active < MAX) run(); else queue.push(run);
  });
}

/** A photo already known in memory (for the first render), undefined when it hasn't been looked up yet. */
export function peekImage(k: ImageKey): string | null | undefined {
  if (k.img) return k.img;
  return cachePeek<string | null>(keyOf(k));
}

/** The photo URL for a food or dish, or null. Found photos are kept for 60 days, misses for 5 (not when offline). */
export function foodImage(k: ImageKey): Promise<string | null> {
  if (k.img) return Promise.resolve(k.img);
  const key = keyOf(k);
  const busy = running.get(key);
  if (busy) return busy;
  const p = (async () => {
    const hit = await cacheGet<string | null>(key);
    if (hit !== undefined) return hit;
    const { url, sure } = await slot(() => find(k));
    if (url || sure) await cacheSet(key, url, url ? 60 : 5);
    return url;
  })().catch(() => null).finally(() => running.delete(key));
  running.set(key, p);
  return p;
}
