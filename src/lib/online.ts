// Online calorie lookup for foods that aren't in our list: USDA FoodData Central (generic foods, per 100 g)
// searched in English through a small Arabic→English food dictionary, plus Open Food Facts (packaged products).
import { AR_EN, SKIP } from './food-words.ts';
import { norm, type Food, type FoodTag, type GI } from './foods.ts';

// Free key from api.data.gov, injected at publish time from the repo secret USDA_KEY.
// Without it DEMO_KEY works but allows only a few searches an hour per network.
export const USDA_KEY = process.env.EXPO_PUBLIC_USDA_KEY || 'DEMO_KEY';
/** Last HTTP problem per host, for the smoke check. */
export const lastError: Record<string, string> = {};
const UA = 'YallaWell/1.0 (github.com/kholodnasrallah48-gif/yalla-well)';

/** "زيتون مخلل" → "olives pickled". Null when no food word was understood. */
export function toEnglish(text: string): string | null {
  const words = norm(text).replace(/[^\p{L}\s]/gu, ' ').split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let food = false;
  for (let i = 0; i < words.length; i++) {
    const two = i + 1 < words.length ? `${words[i]} ${words[i + 1]}` : '';
    if (two && AR_EN[two]) { out.push(AR_EN[two]); food = true; i++; continue; }
    let w = words[i];
    if (SKIP.has(w)) continue;
    if (!AR_EN[w]) w = ['بال', 'ال', 'ب', 'و'].map((p) => (w.startsWith(p) ? w.slice(p.length) : '')).find((x) => x.length > 1 && AR_EN[x]) ?? w;
    if (AR_EN[w]) { out.push(AR_EN[w]); food = true; }
  }
  return food ? Array.from(new Set(out.join(' ').split(' '))).join(' ') : null;
}

export type Per100 = { kcal: number; p: number; c: number; f: number; sugar?: number; fiber?: number; salt?: number };
export type OnlineFood = { id: string; name: string; src: 'USDA' | 'Open Food Facts'; per100: Per100; tags: FoodTag[]; nova?: number; servingG?: number };

type USDANutrient = { nutrientId?: number; nutrientNumber?: string; nutrientName?: string; unitName?: string; value?: number };
type USDAFood = { fdcId: number; description: string; dataType?: string; brandOwner?: string; brandName?: string; servingSize?: number; servingSizeUnit?: string; foodNutrients?: USDANutrient[] };

/** One USDA search hit as values per 100 g. */
export function fromUSDA(x: USDAFood): OnlineFood | null {
  const ns = x.foodNutrients ?? [];
  const get = (ids: number[], nums: string[]) => ns.find((n) => (n.nutrientId != null && ids.includes(n.nutrientId)) || (n.nutrientNumber != null && nums.includes(n.nutrientNumber)))?.value;
  let kcal = ns.find((n) => n.unitName?.toUpperCase() === 'KCAL' && /energy/i.test(n.nutrientName ?? ''))?.value;
  if (kcal == null) { const kj = get([1062], ['268']); if (kj != null) kcal = kj / 4.184; }
  if (kcal == null) return null;
  const desc = x.description.toLowerCase();
  const tags: FoodTag[] = [];
  const sugar = get([2000], ['269']);
  const fiber = get([1079], ['291']);
  const sodium = get([1093], ['307']);
  if (/carbonated|cola|soft drink|soda/.test(desc)) tags.push(sugar ? 'soda' : 'sweetener');
  else if ((sugar ?? 0) >= 15) tags.push('sugary');
  if (/fried|breaded/.test(desc) && !/stir-fried|not fried/.test(desc)) tags.push('fried');
  if (/canned|bottled|pickled/.test(desc)) tags.push('canned');
  if (/sausage|frankfurter|bologna|luncheon|bacon|salami|pastrami|nugget/.test(desc)) tags.push('processed');
  if (/^beef|^lamb|^veal/.test(desc)) tags.push('redmeat');
  if (/salmon|sardine|mackerel|herring|tuna/.test(desc)) tags.push('omega3');
  if (/bread|pasta|wheat|flour|cake|cookie|biscuit|cracker|pizza|croissant|bulgur/.test(desc)) tags.push('gluten');
  if (/milk|cheese|yogurt|cream|butter/.test(desc) && !/peanut butter|almond milk|soy milk/.test(desc)) tags.push('dairy');
  if ((fiber ?? 0) >= 6) tags.push('fiber');
  if ((sodium ?? 0) >= 600) tags.push('salty');
  const brand = x.brandName || x.brandOwner;
  const servingG = x.servingSizeUnit && /^g|grm$/i.test(x.servingSizeUnit) ? x.servingSize : undefined;
  return {
    id: 'usda' + x.fdcId, name: brand ? `${x.description} (${brand})` : x.description, src: 'USDA',
    per100: { kcal: Math.round(kcal), p: get([1003], ['203']) ?? 0, c: get([1005], ['205']) ?? 0, f: get([1004], ['204']) ?? 0, sugar, fiber, salt: sodium != null ? (sodium * 2.5) / 1000 : undefined },
    tags, servingG,
  };
}

type OFFHit = { code?: string | number; product_name?: unknown; product_name_ar?: unknown; product_name_en?: unknown; brands?: unknown; nova_group?: number; serving_quantity?: number | string; nutriments?: Record<string, number | undefined> };

/** One Open Food Facts product as values per 100 g. */
export function fromOFFHit(x: OFFHit): OnlineFood | null {
  const n = x.nutriments ?? {};
  const kcal = n['energy-kcal_100g'] ?? (n['energy_100g'] != null ? n['energy_100g']! / 4.184 : undefined);
  // The fast search returns some fields as arrays or language maps, the classic one as strings.
  const str = (v: unknown): string => typeof v === 'string' ? v : Array.isArray(v) ? str(v[0]) : v && typeof v === 'object' ? str(Object.values(v)[0]) : '';
  const name = (str(x.product_name_ar) || str(x.product_name) || str(x.product_name_en)).trim();
  const brand = str(x.brands).split(',')[0].trim();
  if (kcal == null || !name || !x.code) return null;
  const sugar = n['sugars_100g'];
  const tags: FoodTag[] = [];
  if ((sugar ?? 0) >= 15) tags.push('sugary');
  if (x.nova_group === 4) tags.push('processed');
  if ((n['salt_100g'] ?? 0) >= 1.5) tags.push('salty');
  if ((n['fiber_100g'] ?? 0) >= 6) tags.push('fiber');
  const serving = Number(x.serving_quantity) || undefined;
  return {
    id: 'off' + x.code, name: brand ? `${name} (${brand})` : name, src: 'Open Food Facts',
    per100: { kcal: Math.round(kcal), p: n['proteins_100g'] ?? 0, c: n['carbohydrates_100g'] ?? 0, f: n['fat_100g'] ?? 0, sugar, fiber: n['fiber_100g'], salt: n['salt_100g'] },
    tags, nova: x.nova_group, servingG: serving,
  };
}

/** A portion of an online food in our Food shape, named with the user's own words. */
export function toFood(o: OnlineFood, grams: number, label?: string): Food {
  const k = grams / 100;
  const r = (v: number) => Math.round(v * k * 10) / 10;
  const { sugar = 0, fiber = 0 } = o.per100;
  const carbs = o.per100.c;
  const gi: GI = carbs < 5 ? 'none' : sugar >= 15 || (carbs > 50 && fiber < 3) ? 'high' : sugar >= 6 || (carbs > 30 && fiber < 2) ? 'mid' : 'low';
  return {
    id: `${o.id}_${Math.round(grams)}`, cat: 'أكلاتي', n: label?.trim() || o.name, u: `${Math.round(grams)} جم`,
    kcal: Math.round(o.per100.kcal * k), p: r(o.per100.p), c: r(carbs), f: r(o.per100.f), gi, tags: o.tags,
  };
}

async function getJSON<T>(url: string, ms = 12000): Promise<T | null> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  const host = new URL(url).host;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: ctl.signal });
    if (!res.ok) { lastError[host] = `HTTP ${res.status}`; return null; }
    return (await res.json()) as T;
  } catch (e) {
    lastError[host] = String(e);
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function searchUSDA(en: string, key = USDA_KEY): Promise<OnlineFood[]> {
  const base = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${key}&pageSize=12&dataType=${encodeURIComponent('Foundation,SR Legacy,Survey (FNDDS)')}&query=`;
  // One request per search keeps us inside the key's hourly limit; USDA ranks the best word matches first.
  const j = await getJSON<{ foods?: USDAFood[] }>(base + encodeURIComponent(en));
  return (Array.isArray(j?.foods) ? j.foods : []).map((x) => { try { return fromUSDA(x); } catch { return null; } }).filter((x): x is OnlineFood => !!x);
}

export async function searchOFF(query: string): Promise<OnlineFood[]> {
  const fields = 'code,product_name,product_name_ar,product_name_en,brands,nova_group,serving_quantity,nutriments';
  const fast = await getJSON<{ hits?: OFFHit[] }>(`https://search.openfoodfacts.org/search?q=${encodeURIComponent(query)}&page_size=10&fields=${fields}`);
  let list = fast?.hits;
  if (!list) {
    const j = await getJSON<{ products?: OFFHit[] }>(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=10&fields=${fields}`,
    );
    list = j?.products;
  }
  return (Array.isArray(list) ? list : []).map((x) => { try { return fromOFFHit(x); } catch { return null; } }).filter((x): x is OnlineFood => !!x);
}

/** Searches generic foods (USDA, in English) and packaged products (Open Food Facts, in Arabic) together. */
export async function searchOnline(text: string): Promise<OnlineFood[]> {
  const en = toEnglish(text);
  const [usda, off] = await Promise.all([en ? searchUSDA(en).catch(() => []) : Promise.resolve([]), searchOFF(text).catch(() => [])]);
  // Generic foods first; they fit typed descriptions like "زيتون مخلل" better than one brand's product.
  const seen = new Set<string>();
  return [...usda.slice(0, 6), ...off.slice(0, 4), ...usda.slice(6)].filter((x) => !seen.has(x.id) && seen.add(x.id));
}
