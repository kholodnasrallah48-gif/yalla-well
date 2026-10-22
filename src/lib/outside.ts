// "أنا برة البيت": picks from the place the person is at, sized to what's left of the day, and the places near them
// from OpenStreetMap. Big chains (McDonald's, KFC, Starbucks and others) use the calories they publish (lib/chains-data);
// any other place gets dishes from our food list for its kind of food, with calories for a usual portion (approximate).
import { CHAINS, itemName, type Chain, type ChainItem, type Kind, type Role } from './chains-data.ts';
import { FOODS, foodLevel, norm, type Food } from './foods.ts';
import { L } from './i18n.ts';
import type { Profile } from './plan.ts';

export type { Kind, Role } from './chains-data.ts';
export const KINDS: Kind[] = ['grill', 'fast', 'healthy', 'cafe', 'lebanese', 'turkish', 'indian', 'asian', 'italian'];
export const KIND_NAME: Record<Kind, [string, string]> = {
  grill: ['مشويات', 'Grill'], fast: ['أكل سريع', 'Fast food'], healthy: ['أكل صحي', 'Healthy'], cafe: ['كافيه', 'Cafe'],
  lebanese: ['شامي', 'Levantine'], turkish: ['تركي', 'Turkish'], indian: ['هندي', 'Indian'], asian: ['آسيوي', 'Asian'], italian: ['إيطالي', 'Italian'],
};
export const kindName = (k: Kind) => L(...KIND_NAME[k]);

// Each kind's usual dishes from our food list: mains, then sides and drinks (the first side and drink are what people
// usually order with the main).
type Menu = { main: string[]; side: string[]; drink: string[] };
const MENU: Record<Kind, Menu> = {
  grill: {
    main: ['ربع فرخة مشوية من غير جلد', 'شيش طاووق', 'سمك بلطي مشوي', 'ربع فرخة مشوية', 'كفتة مشوية', 'كباب مشوي', 'فرخة مشوية'],
    side: ['رز أبيض', 'عيش بلدي', 'سلطة طحينة', 'سلطة خضرا بلدي'], drink: ['كوكاكولا', 'بيبسي دايت', 'شاي من غير سكر'],
  },
  fast: {
    main: ['ساندوتش فراخ مشوية', 'شاورما فراخ', 'سلطة سيزر بالفراخ', 'ساندوتش تونة', 'تشيز برجر', 'بيتزا مارجريتا', 'قطعة فراخ كرسبي (كنتاكي)', 'سوشي', 'ساندوتش كفتة', 'ساندوتش فراخ كرسبي', 'بيج ماك', 'كشري'],
    side: ['بطاطس محمرة بيتي', 'سلطة خضرا بلدي'], drink: ['كوكاكولا', 'بيبسي دايت'],
  },
  healthy: {
    main: ['سلطة تونة بالخضار', 'بول فراخ مشوية برز بني بالخضار', 'سلطة كينوا بالفراخ', 'راب فراخ مشوية بالخضار', 'سلمون مشوي بالخضار السوتيه'],
    side: [], drink: ['عصير برتقان فريش', 'شاي أخضر'],
  },
  cafe: {
    main: ['زبادي جرانولا بالفاكهة', 'ساندوتش تركي بالجبنة', 'كرواسون سادة', 'مافن شوكولاتة'],
    side: [], drink: ['كابتشينو', 'لاتيه بلبن خالي الدسم', 'أمريكانو', 'عصير برتقان فريش'],
  },
  lebanese: {
    main: ['شيش طاووق', 'شاورما فراخ', 'كفتة مشوية', 'مشاوي مشكلة', 'فلافل شامي', 'كبة مقلية', 'محشي ورق عنب'],
    side: ['حمص بالطحينة', 'تبولة', 'فتوش', 'بابا غنوج', 'عيش شامي'], drink: ['كوكاكولا', 'بيبسي دايت', 'شاي من غير سكر'],
  },
  turkish: {
    main: ['أضنة كباب', 'إسكندر كباب', 'شيش طاووق', 'كفتة مشوية', 'لحم بعجين', 'بيدا بالجبنة'],
    side: ['شوربة عدس', 'سلطة راعي', 'عيش شامي'], drink: ['كوكاكولا', 'عيران', 'بيبسي دايت'],
  },
  indian: {
    main: ['فراخ تندوري', 'فراخ تكا ماسالا', 'برياني فراخ', 'دال عدس'],
    side: ['رز بسمتي', 'عيش نان', 'سلطة زبادي بالخيار'], drink: ['كوكاكولا', 'بيبسي دايت', 'شاي من غير سكر'],
  },
  asian: {
    main: ['فراخ بالخضار صيني', 'سوشي', 'جمبري مشوي', 'نودلز بالفراخ', 'فراخ سويت أند ساور'],
    side: ['رز مقلي بالخضار', 'رز أبيض'], drink: ['كوكاكولا', 'بيبسي دايت', 'شاي أخضر'],
  },
  italian: {
    main: ['بيتزا مارجريتا', 'سلطة سيزر بالفراخ', 'بيني أرابياتا', 'سباجيتي بولونيز', 'بيتزا بيبروني', 'لازانيا', 'مكرونة ألفريدو بالفراخ'],
    side: ['سلطة كابريزي', 'سلطة خضرا بلدي'], drink: ['كوكاكولا', 'بيبسي دايت'],
  },
};
/** A lighter version of a generic dish (grilled for fried, salad for rice, skinless for with skin). */
const LIGHTER: Record<string, string> = {
  'ربع فرخة مشوية': 'ربع فرخة مشوية من غير جلد', 'فرخة مشوية': 'ربع فرخة مشوية', 'كباب مشوي': 'شيش طاووق', 'كفتة مشوية': 'شيش طاووق',
  'رز أبيض': 'سلطة خضرا بلدي', 'عيش بلدي': 'سلطة خضرا بلدي', 'سلطة طحينة': 'سلطة خضرا بلدي', 'بطاطس محمرة بيتي': 'سلطة خضرا بلدي',
  'ساندوتش فراخ كرسبي': 'ساندوتش فراخ مشوية', 'قطعة فراخ كرسبي (كنتاكي)': 'ساندوتش فراخ مشوية', 'بيج ماك': 'تشيز برجر', 'بيتزا بيبروني': 'بيتزا مارجريتا',
  'مافن شوكولاتة': 'زبادي جرانولا بالفاكهة', 'كرواسون سادة': 'زبادي جرانولا بالفاكهة', 'كابتشينو': 'لاتيه بلبن خالي الدسم', 'لاتيه بلبن خالي الدسم': 'أمريكانو',
  'مشاوي مشكلة': 'شيش طاووق', 'كبة مقلية': 'محشي ورق عنب', 'حمص بالطحينة': 'تبولة', 'فتوش': 'تبولة', 'عيش شامي': 'سلطة خضرا بلدي',
  'إسكندر كباب': 'أضنة كباب', 'أضنة كباب': 'شيش طاووق', 'بيدا بالجبنة': 'لحم بعجين', 'شوربة عدس': 'سلطة راعي',
  'فراخ تكا ماسالا': 'فراخ تندوري', 'برياني فراخ': 'فراخ تندوري', 'رز بسمتي': 'سلطة زبادي بالخيار', 'عيش نان': 'سلطة زبادي بالخيار',
  'فراخ سويت أند ساور': 'فراخ بالخضار صيني', 'نودلز بالفراخ': 'فراخ بالخضار صيني', 'رز مقلي بالخضار': 'رز أبيض',
  'مكرونة ألفريدو بالفراخ': 'بيني أرابياتا', 'لازانيا': 'سباجيتي بولونيز', 'سلطة كابريزي': 'سلطة خضرا بلدي',
  'كوكاكولا': 'بيبسي دايت', 'عصير برتقان فريش': 'شاي أخضر',
};

/** One dish on a menu: the food it logs as, its part in a meal, and where its calories come from. */
export type Dish = {
  food: Food; role: Role;
  /** The usual side or drink people order with a main. */
  usual?: boolean;
  /** Food id of a lighter version on the same menu. */
  alt?: string;
  /** Allergens it obviously has (ids from lib/allergy); generic dishes are judged by name and tags instead. */
  al?: string[];
  /** The chain whose published numbers these are; none for our approximate dishes. */
  chain?: string;
};

const byName = new Map(FOODS.map((f) => [f.n, f]));
const generic = (n: string, role: Role, usual = false): Dish | null => {
  const food = byName.get(n);
  if (!food) return null;
  const alt = LIGHTER[n] ? byName.get(LIGHTER[n])?.id : undefined;
  return { food, role, ...(usual ? { usual } : {}), ...(alt ? { alt } : {}) };
};
const real = <T,>(x: T | null | undefined): x is T => x != null;

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

/** A kind of place's dishes from our food list (approximate calories); a specific cuisine narrows the mains. */
export function kindDishes(kind: Kind, cuisine?: string): Dish[] {
  const m = MENU[kind];
  const only = cuisineDishes(cuisine);
  const mains = only ? only.map((f) => generic(f.n, 'main')) : m.main.map((n) => generic(n, 'main'));
  return [...mains, ...m.side.map((n, i) => generic(n, 'side', i === 0)), ...m.drink.map((n, i) => generic(n, 'drink', i === 0))].filter(real);
}
/** The foods on a kind's menu. */
export const menu = (k: Kind): Food[] => kindDishes(k).map((d) => d.food);

export const chainById = (id: string | undefined): Chain | undefined => (id ? CHAINS.find((c) => c.id === id) : undefined);
/** The chain a place's name belongs to ("ماكدونالدز", "McDonald's", "KFC مدينة نصر"), if any. */
export const chainOf = (name: string): Chain | undefined => { const t = norm(name); return CHAINS.find((c) => c.re.test(t)); };

/** A chain item as a loggable food: its published numbers (missing macros are 0). */
export function chainFood(ch: Chain, it: ChainItem): Food {
  return { id: `ch_${ch.id}_${it.k}`, cat: 'أكل برا وفاست فود', n: itemName(ch, it)[0], u: it.u[0], kcal: it.kcal, p: it.p ?? 0, c: it.c ?? 0, f: it.f ?? 0, gi: it.gi, tags: it.tags };
}
/** A chain's dishes; chains that publish no drinks get plain drinks from our list (approximate). */
export function chainDishes(ch: Chain): Dish[] {
  const own: Dish[] = ch.items.map((it) => ({
    food: chainFood(ch, it), role: it.role, chain: ch.id, ...(it.usual ? { usual: true } : {}), ...(it.alt ? { alt: `ch_${ch.id}_${it.alt}` } : {}), ...(it.al ? { al: it.al } : {}),
  }));
  const drinks = own.some((d) => d.role === 'drink') ? [] : (ch.drinks ?? []).map((n, i) => generic(n, 'drink', i === 0)).filter(real);
  if (drinks.length > 1) drinks[0] = { ...drinks[0], alt: drinks[drinks.length - 1].food.id };
  return [...own, ...drinks];
}

/** What a chosen place offers: a chain's own menu, or its kind of food. */
export type Source = { kind: Kind; cuisine?: string; chain?: string };
export const dishesFor = (s: Source): Dish[] => { const ch = chainById(s.chain); return ch ? chainDishes(ch) : kindDishes(s.kind, s.cuisine); };

/** Allergens this person can't have: their allergies, plus nuts with a nut allergy condition and wheat with celiac. */
function blocked(p: Profile): Set<string> {
  const s = new Set(p.allergies ?? []);
  if (p.conditions.includes('nuts')) { s.add('nuts'); s.add('peanut'); }
  if (p.conditions.includes('celiac')) s.add('wheat');
  return s;
}
/** The person can have it: no allergen they have, and nothing their health rules out. */
export const canEat = (p: Profile, d: Dish) => { const b = blocked(p); return !(d.al ?? []).some((a) => b.has(a)) && foodLevel(p, d.food) !== 'bad'; };

export type Pick = { food: Food; fits: boolean; dish: Dish };

/**
 * Up to `n` dishes from this place for what's left today: dishes the person's health or allergies rule out are
 * dropped, ones that fit the calories come first (most protein per calorie first). When nothing fits, the lightest
 * ones are shown, marked as over. Mains only, plus drinks at a cafe (or a chain that only has drinks).
 */
export function picks(p: Profile, kind: Kind, kcalLeft: number, n = 4, cuisine?: string, chain?: string): Pick[] {
  const all = dishesFor({ kind, cuisine, chain }).filter((d) => canEat(p, d));
  const cafe = (chainById(chain)?.kind ?? kind) === 'cafe';
  let ok = all.filter((d) => d.role === 'main' || (cafe && d.role === 'drink' && !!d.chain === !!chain));
  if (!ok.length) ok = all;
  const room = Math.max(kcalLeft, 0) * 1.05;
  const ppk = (f: Food) => f.p / Math.max(f.kcal, 1);
  const fit = ok.filter((d) => d.food.kcal <= room).sort((a, b) => ppk(b.food) - ppk(a.food) || b.food.kcal - a.food.kcal);
  if (fit.length) return fit.slice(0, n).map((dish) => ({ food: dish.food, fits: true, dish }));
  return [...ok].sort((a, b) => a.food.kcal - b.food.kcal).slice(0, Math.min(n, 2)).map((dish) => ({ food: dish.food, fits: false, dish }));
}

// ---- A whole meal within the calories ----

export type Swap = { from: Dish; to: Dish | null };
export type Combo = {
  /** Main, then side and drink (a cafe: main and drink, or just a drink). */
  items: Dish[];
  kcal: number; p: number;
  /** Fits the budget (a little over, up to 3%, still counts). */
  fits: boolean;
  /** What was changed from the usual order to make it fit. */
  swaps: Swap[];
  /** Calories of the usual order (main with the usual side and drink). */
  usual: number;
};

const sum = (xs: (Dish | null)[]) => xs.reduce((a, d) => ({ kcal: a.kcal + (d?.food.kcal ?? 0), p: a.p + (d?.food.p ?? 0) }), { kcal: 0, p: 0 });

/**
 * A meal at this place that fits `budget` calories: a main with the usual side and drink, made lighter step by step
 * until it fits (a diet or plain drink, a smaller or lighter side, no side, a lighter main). Among the mains that
 * fit, the one with the most protein for its calories and the fewest changes wins. When nothing fits, the lightest
 * meal, marked as over. Null when the place has nothing this person can have.
 */
export function buildCombo(p: Profile, dishes: Dish[], budget: number, cafe = false): Combo | null {
  const ok = dishes.filter((d) => canEat(p, d));
  const byId = new Map(ok.map((d) => [d.food.id, d]));
  const mains = ok.filter((d) => d.role === 'main');
  const sides = cafe ? [] : ok.filter((d) => d.role === 'side');
  const drinks = ok.filter((d) => d.role === 'drink');
  if (!mains.length && !drinks.length) return null;
  const usualSide = sides.find((d) => d.usual) ?? null;
  const usualDrink = drinks.find((d) => d.usual) ?? drinks[0] ?? null;
  const lightestDrink = [...drinks].sort((a, b) => a.food.kcal - b.food.kcal)[0] ?? null;
  const room = Math.max(budget, 0) * 1.03;
  const lighter = (d: Dish | null) => (d?.alt ? byId.get(d.alt) ?? null : null);

  const tries: Combo[] = [];
  for (const start of (mains.length ? mains : [null]) as (Dish | null)[]) {
    let main: Dish | null = start, side: Dish | null = usualSide, drink: Dish | null = usualDrink;
    const swaps: Swap[] = [];
    const usual = sum([main, side, drink]).kcal;
    const total = () => sum([main, side, drink]).kcal;
    const swap = (from: Dish | null, to: Dish | null) => { if (from && from !== to) swaps.push({ from, to }); return to; };
    // Lighter step by step, stopping as soon as it fits.
    const steps: (() => void)[] = [
      () => { if (drink && lightestDrink && lightestDrink.food.kcal < drink.food.kcal) drink = swap(drink, lighter(drink) && lighter(drink)!.food.kcal <= lightestDrink.food.kcal + 5 ? lighter(drink) : lightestDrink); },
      () => { const s = lighter(side); if (s) side = swap(side, s); },
      () => { const s = lighter(side); if (s) side = swap(side, s); },
      () => { if (side) side = swap(side, null); },
      () => { const m = lighter(main); if (m) main = swap(main, m); },
      () => { const m = lighter(main); if (m) main = swap(main, m); },
    ];
    for (const step of steps) { if (total() <= room) break; step(); }
    const t = sum([main, side, drink]);
    tries.push({ items: [main, side, drink].filter(real), kcal: t.kcal, p: t.p, fits: t.kcal <= room, swaps, usual });
  }
  const fits = tries.filter((c) => c.fits);
  if (fits.length) {
    const score = (c: Combo) => (c.p * 4) / Math.max(c.kcal, 1) * 100 + Math.min(c.kcal, budget) / Math.max(budget, 1) * 30 - c.swaps.length * 6;
    return fits.sort((a, b) => score(b) - score(a))[0];
  }
  return tries.sort((a, b) => a.kcal - b.kcal)[0];
}

// ---- Places ----

export type Place = {
  id: string; name: string; kind: Kind;
  /** Meters away, NaN when we don't know where the person is. */
  m: number; lat: number; lon: number; cuisine?: string;
  /** A big chain we have the menu of. */
  chain?: string;
  /** Street or area, from a name search. */
  area?: string;
};

const has = (tag: string | undefined, re: RegExp) => !!tag && re.test(tag.toLowerCase());

/** What kind of place an OpenStreetMap restaurant, fast food or cafe is, from its amenity and cuisine tags. */
export function kindOf(tags: Record<string, string>): Kind {
  const ch = tags.name ? chainOf(tags.name) : undefined;
  if (ch) return ch.kind;
  const a = tags.amenity, cu = tags.cuisine ?? (tags.name ? guessCuisine(tags.name) : undefined);
  if (a === 'cafe' || has(cu, /coffee|cafe|tea|juice|dessert|ice_cream|bakery|pastry|breakfast/)) return 'cafe';
  if (has(cu, /salad|health|vegan|vegetarian|poke|bowl|diet/) || Object.keys(tags).some((k) => k.startsWith('diet:') && tags[k] === 'only')) return 'healthy';
  if (has(cu, /burger|pizza|sandwich|fried_chicken|shawarma|fast_food|hot_dog|crepe|koshari|falafel|chicken_wings/)) return 'fast';
  if (has(cu, /lebanese|syrian|levantine|mezze/)) return 'lebanese';
  if (has(cu, /turkish|doner|kebap/)) return 'turkish';
  if (has(cu, /indian|pakistani|curry|tandoori|biryani/)) return 'indian';
  if (has(cu, /chinese|asian|thai|japanese|korean|vietnamese|sushi|noodle|ramen|wok/)) return 'asian';
  if (has(cu, /italian|pasta/)) return 'italian';
  if (has(cu, /grill|barbecue|bbq|kebab|chicken|arab|egyptian|middle_eastern|seafood|fish|steak|mandi|yemeni/)) return 'grill';
  return a === 'fast_food' ? 'fast' : 'grill';
}

/** Distance in meters between two points. */
export function meters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000, rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad, dLon = (lon2 - lon1) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

type OsmEl = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string>; area?: string };

/** Turns an Overpass answer into named places, nearest first, one per name. Without a point, in the order given. */
export function toPlaces(els: OsmEl[], lat: number | undefined, lon: number | undefined, ar: boolean): Place[] {
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
    const ch = chainOf(name) ?? (t.name ? chainOf(t.name) : undefined);
    out.push({
      id: `${e.type}/${e.id}`, name: name.trim(), kind: ch?.kind ?? kindOf(t), m: lat != null && lon != null ? meters(lat, lon, pLat, pLon) : NaN, lat: pLat, lon: pLon,
      cuisine: t.cuisine ?? guessCuisine(name), ...(ch ? { chain: ch.id } : {}), ...(e.area ? { area: e.area } : {}),
    });
  }
  return lat != null ? out.sort((a, b) => a.m - b.m) : out;
}

// A cuisine guessed from the place's name when the map has none ("Pizza Hut", "كشري التحرير", "Rouh Beirut"). A country's
// food comes before plain grill or fish, so "Istanbul Grill" is Turkish.
const NAME_CUISINE: [RegExp, string][] = [
  [/koshar|كشري/i, 'koshari'], [/pizza|بيتزا/i, 'pizza'], [/burger|برجر|hardee|mcdonald|ماكدونالدز|كنتاكي|kfc/i, 'burger'],
  [/shawarma|شاورما/i, 'shawarma'], [/sushi|سوشي/i, 'sushi'], [/fried chicken|crispy|كرسبي|broasted|بروستد/i, 'fried_chicken'],
  [/lebanese|leban|beirut|levant|syrian|damascus|aleppo|لبناني|بيروت|سوري|دمشق|الشام|شامي|حلبي/i, 'lebanese'],
  [/turk|istanbul|anatolia|doner|döner|kebap|تركي|اسطنبول|إسطنبول|استانبول/i, 'turkish'],
  [/india|curry|tandoor|biryani|masala|هندي|برياني|تندوري|ماسالا|كاري(\s|$)/i, 'indian'],
  [/chinese|china|asian|wok|noodle|thai|japan|korea|ramen|صيني|آسيوي|اسيوي|تايلاندي|ياباني|كوري(\s|$)|نودلز/i, 'asian'],
  [/italian|itali|pasta|trattoria|ristorante|إيطالي|ايطالي|باستا/i, 'italian'],
  [/kebab|kabab|kofta|كباب|كبابجي|كفتة/i, 'kebab'], [/fish|seafood|سمك|اسماك|أسماك|بحري/i, 'seafood'], [/grill|مشويات|مشاوي|شواية/i, 'grill'],
  [/mandi|مندي|kabsa|كبسة/i, 'mandi'], [/salad|سلطة|healthy|صحي/i, 'salad'], [/juice|عصير|عصاير/i, 'juice'],
  [/coffee|cafe|café|كافيه|قهوة|بن /i, 'coffee_shop'], [/crepe|كريب/i, 'crepe'], [/bakery|مخبز|فرن/i, 'bakery'],
];
export const guessCuisine = (name: string): string | undefined => NAME_CUISINE.find(([re]) => re.test(name))?.[1];

type PhotonFeature = { geometry?: { coordinates?: [number, number] }; properties?: { name?: string; osm_value?: string; osm_type?: string; osm_id?: number; street?: string; district?: string; city?: string } };

/** Turns a Photon answer (OpenStreetMap places) into places, nearest first when the person's point is known. */
export function fromPhoton(features: PhotonFeature[], lat?: number, lon?: number): Place[] {
  return toPlaces(features.map((f) => {
    const [pLon, pLat] = f.geometry?.coordinates ?? [];
    const pr = f.properties ?? {};
    const name = pr.name ?? '';
    const area = [pr.street, pr.district ?? pr.city].filter(Boolean).join('، ');
    return { type: pr.osm_type ?? 'n', id: pr.osm_id ?? 0, lat: pLat, lon: pLon, ...(area ? { area } : {}),
      tags: { amenity: pr.osm_value ?? 'restaurant', name, ...(guessCuisine(name) ? { cuisine: guessCuisine(name)! } : {}) } };
  }), lat, lon, false);
}

async function getJSON<T>(url: string, init?: RequestInit, ms = 12000): Promise<T | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { ...init, signal: ctl.signal });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

const AMENITIES = ['restaurant', 'fast_food', 'cafe'].map((t) => `&osm_tag=amenity:${t}`).join('');

/**
 * Restaurants, fast food and cafes around a point, nearest first. Photon (komoot's OpenStreetMap search) answers in
 * about a second; the public Overpass servers are the fallback since they are often busy. Only the point is sent.
 */
export async function nearby(lat: number, lon: number, ar: boolean): Promise<Place[] | null> {
  const la = lat.toFixed(4), lo = lon.toFixed(4);
  for (const km of [1, 2.5]) {
    const j = await getJSON<{ features?: PhotonFeature[] }>(`https://photon.komoot.io/reverse?lat=${la}&lon=${lo}&radius=${km}&limit=30${AMENITIES}`);
    if (!j) break;
    const got = fromPhoton(j.features ?? [], lat, lon);
    if (got.length >= 4 || km > 1) return got;
  }
  const q = `[out:json][timeout:20];node["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:1000,${la},${lo});out 60;`;
  const o = await getJSON<{ elements?: OsmEl[] }>('https://overpass-api.de/api/interpreter',
    { method: 'POST', body: 'data=' + encodeURIComponent(q), headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }, 30000);
  return o ? toPlaces(o.elements ?? [], lat, lon, ar) : null;
}

/** Chains we have the menu of whose name matches what the person typed (works offline). */
export function searchChains(q: string): Chain[] {
  const t = norm(q).replace(/['’.]/g, '');
  if (t.length < 2) return [];
  return CHAINS.filter((c) => c.re.test(t) || norm(c.ar).includes(t) || c.en.toLowerCase().replace(/['’.]/g, '').includes(t));
}

/**
 * Restaurants by name for delivery or a place not nearby: Photon's OpenStreetMap search, nearer ones first when the
 * person's point is known (it's only sent to rank the results). Null when the search can't be reached.
 */
export async function searchPlaces(q: string, near?: { lat: number; lon: number } | null): Promise<Place[] | null> {
  const text = q.trim();
  if (text.length < 2) return [];
  const bias = near ? `&lat=${near.lat.toFixed(3)}&lon=${near.lon.toFixed(3)}` : '';
  const j = await getJSON<{ features?: PhotonFeature[] }>(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=12${AMENITIES}${bias}`);
  return j ? fromPhoton(j.features ?? [], near?.lat, near?.lon).slice(0, 8) : null;
}
