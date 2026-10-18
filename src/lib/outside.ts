// "أنا برة البيت": quick picks from the kind of place the person is at (grill, fast food, healthy, cafe), sized to
// what's left of the day, and the places near them from OpenStreetMap. Calories are estimates for a usual portion:
// shop menus aren't published anywhere open.
import { FOODS, foodLevel, type Food } from './foods.ts';
import { L } from './i18n.ts';
import type { Profile } from './plan.ts';

export type Kind = 'grill' | 'fast' | 'healthy' | 'cafe';
export const KINDS: Kind[] = ['grill', 'fast', 'healthy', 'cafe'];
export const KIND_NAME: Record<Kind, [string, string]> = {
  grill: ['مشويات', 'Grill'], fast: ['أكل سريع', 'Fast food'], healthy: ['أكل صحي', 'Healthy'], cafe: ['كافيه', 'Cafe'],
};
export const kindName = (k: Kind) => L(...KIND_NAME[k]);

const MENU: Record<Kind, string[]> = {
  grill: ['ربع فرخة مشوية من غير جلد', 'شيش طاووق', 'سمك بلطي مشوي', 'ربع فرخة مشوية', 'كفتة مشوية', 'كباب مشوي', 'فرخة مشوية'],
  fast: ['ساندوتش فراخ مشوية', 'شاورما فراخ', 'سلطة سيزر بالفراخ', 'ساندوتش تونة', 'تشيز برجر', 'بيتزا مارجريتا', 'قطعة فراخ كرسبي (كنتاكي)', 'سوشي', 'ساندوتش كفتة', 'ساندوتش فراخ كرسبي', 'بيج ماك', 'كشري'],
  healthy: ['سلطة تونة بالخضار', 'بول فراخ مشوية برز بني بالخضار', 'سلطة كينوا بالفراخ', 'راب فراخ مشوية بالخضار', 'سلمون مشوي بالخضار السوتيه'],
  cafe: ['أمريكانو', 'لاتيه بلبن خالي الدسم', 'كابتشينو', 'زبادي جرانولا بالفاكهة', 'ساندوتش تركي بالجبنة', 'عصير برتقان فريش', 'كرواسون سادة', 'مافن شوكولاتة'],
};

const byName = new Map(FOODS.map((f) => [f.n, f]));
export const menu = (k: Kind): Food[] => MENU[k].map((n) => byName.get(n)).filter((f): f is Food => !!f);

export type Pick = { food: Food; fits: boolean };

// A place that serves one kind of dish (a koshari shop, a pizzeria) gets those dishes, not the whole kind's menu.
const CUISINE_DISHES: [RegExp, string[]][] = [
  [/koshar/, ['كشري']], [/pizza/, ['بيتزا']], [/burger/, ['تشيز برجر', 'بيج ماك']], [/shawarma/, ['شاورما']],
  [/fried_chicken|chicken_wings/, ['كرسبي', 'ناجتس']], [/sushi/, ['سوشي']], [/kebab|kofta/, ['كباب', 'كفتة', 'شيش طاووق']],
  [/fish|seafood/, ['سمك', 'سلمون']], [/crepe/, ['كريب']], [/mandi|yemeni|kabsa/, ['مندي', 'كبسة']],
];
/** The dishes a specific cuisine (OpenStreetMap's cuisine tag) points to, or null for a general place. */
export function cuisineDishes(cuisine: string | undefined): Food[] | null {
  if (!cuisine) return null;
  const words = CUISINE_DISHES.filter(([re]) => re.test(cuisine.toLowerCase())).flatMap(([, w]) => w);
  if (!words.length) return null;
  const out = FOODS.filter((f) => words.some((w) => f.n.includes(w)));
  return out.length ? out : null;
}

/**
 * Up to `n` dishes from this kind of place for what's left today: dishes the person's health or allergies rule out
 * are dropped, ones that fit the calories come first (most protein per calorie first). When nothing fits, the
 * lightest ones are shown, marked as over.
 */
export function picks(p: Profile, kind: Kind, kcalLeft: number, n = 4, cuisine?: string): Pick[] {
  const ok = (cuisineDishes(cuisine) ?? menu(kind)).filter((f) => foodLevel(p, f) !== 'bad');
  const room = Math.max(kcalLeft, 0) * 1.05;
  const fit = ok.filter((f) => f.kcal <= room).sort((a, b) => b.p / Math.max(b.kcal, 1) - a.p / Math.max(a.kcal, 1) || b.kcal - a.kcal);
  if (fit.length) return fit.slice(0, n).map((food) => ({ food, fits: true }));
  return [...ok].sort((a, b) => a.kcal - b.kcal).slice(0, Math.min(n, 2)).map((food) => ({ food, fits: false }));
}

export type Place = { id: string; name: string; kind: Kind; m: number; lat: number; lon: number; cuisine?: string };

const has = (tag: string | undefined, re: RegExp) => !!tag && re.test(tag.toLowerCase());

/** What kind of place an OpenStreetMap restaurant, fast food or cafe is, from its amenity and cuisine tags. */
export function kindOf(tags: Record<string, string>): Kind {
  const a = tags.amenity, cu = tags.cuisine;
  if (a === 'cafe' || has(cu, /coffee|cafe|tea|juice|dessert|ice_cream|bakery|pastry|breakfast/)) return 'cafe';
  if (has(cu, /salad|health|vegan|vegetarian|poke|bowl|diet/) || Object.keys(tags).some((k) => k.startsWith('diet:') && tags[k] === 'only')) return 'healthy';
  if (has(cu, /burger|pizza|sandwich|fried_chicken|shawarma|fast_food|hot_dog|sushi|crepe|koshari|falafel|chicken_wings/)) return 'fast';
  if (has(cu, /grill|barbecue|bbq|kebab|chicken|lebanese|turkish|arab|syrian|egyptian|middle_eastern|seafood|fish|steak|mandi|yemeni/)) return 'grill';
  return a === 'fast_food' ? 'fast' : 'grill';
}

/** Distance in meters between two points. */
export function meters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

type OsmEl = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

/** Turns an Overpass answer into named places, nearest first, one per name. */
export function toPlaces(els: OsmEl[], lat: number, lon: number, ar: boolean): Place[] {
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const e of els) {
    const t = e.tags ?? {};
    const name = (ar ? t['name:ar'] : t['name:en']) || t.name;
    const pLat = e.lat ?? e.center?.lat, pLon = e.lon ?? e.center?.lon;
    if (!name || pLat == null || pLon == null) continue;
    const key = name.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ id: `${e.type}/${e.id}`, name: name.trim(), kind: kindOf(t), m: meters(lat, lon, pLat, pLon), lat: pLat, lon: pLon, cuisine: t.cuisine });
  }
  return out.sort((a, b) => a.m - b.m);
}

const OVERPASS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter'];

/** Restaurants, fast food and cafes around a point (the radius grows once when there are few). Only the point is sent. */
export async function nearby(lat: number, lon: number, ar: boolean): Promise<Place[] | null> {
  let last: Place[] | null = null;
  for (const r of [700, 2000]) {
    const q = `[out:json][timeout:15];nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:${r},${lat.toFixed(4)},${lon.toFixed(4)});out center 60;`;
    let got: Place[] | null = null;
    for (const url of OVERPASS) {
      try {
        const ctl = new AbortController();
        const timer = setTimeout(() => ctl.abort(), 15000);
        const res = await fetch(url, { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, signal: ctl.signal });
        clearTimeout(timer);
        if (!res.ok) continue;
        const j = (await res.json()) as { elements?: OsmEl[] };
        got = toPlaces(j.elements ?? [], lat, lon, ar);
        break;
      } catch { /* try the next server */ }
    }
    if (got == null) return last;
    last = got;
    if (got.length >= 4) break;
  }
  return last;
}
