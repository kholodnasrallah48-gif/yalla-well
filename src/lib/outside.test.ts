/// <reference types="node" />
// "أنا برة البيت": dishes fit what's left of the day and the person's health, and nearby places are sorted by kind.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { CHAINS } from './chains-data.ts';
import { EN_DATA } from './en/index.ts';
import { dayPlan, outReserve, outSplit, SHARE } from './mealplan.ts';
import { buildCombo, chainDishes, chainOf, dishesFor, fromPhoton, guessCuisine, KINDS, kindDishes, kindOf, menu, meters, picks, searchChains, toPlaces } from './outside.ts';
import { targets } from './plan.ts';
import type { Profile } from './plan.ts';

const base = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 80, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-09-01',
} as unknown as Profile;

test('every dish on every menu is a real food', () => {
  for (const k of KINDS) assert.ok(menu(k).length >= 5, k);
});

test('picks fit the calories left, most protein per calorie first', () => {
  const p = picks(base, 'grill', 400);
  assert.ok(p.length && p.every((x) => x.fits && x.food.kcal <= 420));
  assert.equal(p[0].food.n, 'سمك بلطي مشوي');
});

test('nothing fits: the lightest two, marked as over', () => {
  const p = picks(base, 'fast', 50);
  assert.equal(p.length, 2);
  assert.ok(p.every((x) => !x.fits));
  assert.ok(p[0].food.kcal <= p[1].food.kcal);
});

test('allergies drop the dishes', () => {
  const fishy = { ...base, allergies: ['fish'] } as unknown as Profile;
  const names = picks(fishy, 'grill', 2000, 10).map((x) => x.food.n);
  assert.ok(!names.includes('سمك بلطي مشوي'), names.join(','));
});

test('places are sorted by kind and distance', () => {
  assert.equal(kindOf({ amenity: 'cafe' }), 'cafe');
  assert.equal(kindOf({ amenity: 'restaurant', cuisine: 'burger;american' }), 'fast');
  assert.equal(kindOf({ amenity: 'restaurant', cuisine: 'lebanese' }), 'lebanese');
  assert.equal(kindOf({ amenity: 'restaurant', cuisine: 'salad' }), 'healthy');
  assert.equal(kindOf({ amenity: 'fast_food' }), 'fast');
  assert.equal(meters(30, 31, 30, 31), 0);
  const places = toPlaces([
    { type: 'node', id: 1, lat: 30.01, lon: 31, tags: { amenity: 'cafe', name: 'Far Cafe' } },
    { type: 'way', id: 2, center: { lat: 30.001, lon: 31 }, tags: { amenity: 'restaurant', name: 'Near', 'name:ar': 'قريب', cuisine: 'grill' } },
    { type: 'node', id: 3, lat: 30.002, lon: 31, tags: { amenity: 'restaurant' } },
  ], 30, 31, true);
  assert.deepEqual(places.map((x) => [x.name, x.kind]), [['قريب', 'grill'], ['Far Cafe', 'cafe']]);
});

test('a koshari shop or a pizzeria gets its own dishes', () => {
  assert.deepEqual(picks(base, 'fast', 1000, 4, 'koshari').map((x) => x.food.n), ['كشري']);
  assert.ok(picks(base, 'fast', 1000, 4, 'pizza').every((x) => x.food.n.includes('بيتزا')));
  assert.ok(picks(base, 'grill', 1000, 4, 'lebanese').length >= 3);
});

test('Photon places get a kind from their name when the map has no cuisine', () => {
  const at = (name: string, v: string, lat: number) => ({ geometry: { coordinates: [31, lat] as [number, number] }, properties: { name, osm_value: v, osm_type: 'N', osm_id: lat * 1e6 } });
  const places = fromPhoton([at('كشري التحرير', 'fast_food', 30.001), at('Pizza Hut', 'restaurant', 30.002), at('Cilantro', 'cafe', 30.003), at('Rouh Beirut', 'restaurant', 30.004)], 30, 31);
  assert.deepEqual(places.map((x) => [x.name, x.kind, x.cuisine]), [
    ['كشري التحرير', 'fast', 'koshari'], ['Pizza Hut', 'fast', 'pizza'], ['Cilantro', 'cafe', undefined], ['Rouh Beirut', 'lebanese', 'lebanese'],
  ]);
});

// ---- Chains ----

test('chain names match in Arabic and Latin letters', () => {
  const id = (n: string) => chainOf(n)?.id;
  assert.equal(id('ماكدونالدز'), 'mcd');
  assert.equal(id("McDonald's Nasr City"), 'mcd');
  assert.equal(id('KFC'), 'kfc');
  assert.equal(id('كنتاكي مدينة نصر'), 'kfc');
  assert.equal(id('زعتر و زيت'), 'zwz');
  assert.equal(id('Zaatar W Zeit'), 'zwz');
  assert.equal(id('Starbucks'), 'sbux');
  assert.equal(id('ستاربكس'), 'sbux');
  assert.equal(id('Tim Hortons'), 'tims');
  assert.equal(id('شاورمر'), 'shawarmer');
  assert.equal(id('Kebabji'), undefined);
  assert.equal(id('Rouh Beirut'), undefined);
  // A chain on the map gets its own menu and kind.
  assert.deepEqual(toPlaces([{ type: 'node', id: 9, lat: 30, lon: 31, tags: { amenity: 'restaurant', name: 'كنتاكي' } }], 30, 31, true).map((x) => [x.kind, x.chain]), [['fast', 'kfc']]);
});

test('typing part of a chain name finds it (offline)', () => {
  assert.deepEqual(searchChains('ماك').map((c) => c.id), ['mcd']);
  assert.ok(searchChains('star').some((c) => c.id === 'sbux'));
  assert.ok(searchChains('kfc').some((c) => c.id === 'kfc'));
  assert.deepEqual(searchChains('x'), []);
});

test('every chain item has real numbers, a role and an English name', () => {
  for (const ch of CHAINS) {
    assert.ok(ch.src.startsWith('https://'), ch.id);
    const ds = chainDishes(ch);
    assert.ok(ds.some((d) => d.role === 'main' || ch.kind === 'cafe'), ch.id);
    for (const d of ds) {
      assert.ok(d.food.kcal > 0 || !d.chain, d.food.n);
      assert.ok(EN_DATA[d.food.n], 'no English for ' + d.food.n);
      assert.ok(!/(^|\s)نص(\s|$)/.test(d.food.n), d.food.n);
      if (d.alt) assert.ok(ds.some((x) => x.food.id === d.alt), `${d.food.n} -> ${d.alt}`);
    }
    assert.equal(new Set(ds.map((d) => d.food.id)).size, ds.length, ch.id);
  }
});

test('chain items are dropped for an allergy the chain lists', () => {
  const noWheat = { ...base, allergies: ['wheat'] } as unknown as Profile;
  const names = picks(noWheat, 'fast', 3000, 50, undefined, 'mcd').map((x) => x.food.n);
  assert.ok(names.length > 0);
  assert.ok(!names.some((n) => n.includes('بيج ماك')), names.join(','));
  const celiac = { ...base, conditions: ['celiac'] } as unknown as Profile;
  assert.ok(!picks(celiac, 'fast', 3000, 50, undefined, 'mcd').some((x) => x.food.n.includes('بيج ماك')));
});

// ---- A whole meal ----

test('the combo fits the budget by making the usual order lighter', () => {
  const ds = dishesFor({ kind: 'fast', chain: 'mcd' });
  const big = buildCombo(base, ds, 2000)!;
  assert.ok(big.fits && big.items.length === 3, JSON.stringify(big.items.map((d) => d.food.n)));
  assert.equal(big.swaps.length, 0);
  const small = buildCombo(base, ds, 600)!;
  assert.ok(small.fits && small.kcal <= 600 * 1.03, String(small.kcal));
  assert.ok(small.items.some((d) => d.role === 'main'));
  assert.ok(small.swaps.length > 0 || small.kcal === small.usual);
  assert.equal(small.kcal, small.items.reduce((a, d) => a + d.food.kcal, 0));
});

test('a generic place gets a combo too, and nothing fits means the lightest, marked over', () => {
  const c = buildCombo(base, kindDishes('grill'), 700)!;
  assert.ok(c.fits && c.items[0].role === 'main' && c.kcal <= 721);
  const over = buildCombo(base, kindDishes('grill'), 50)!;
  assert.ok(!over.fits);
  // A cafe is main and drink, no side.
  const cafe = buildCombo(base, dishesFor({ kind: 'cafe' }), 500, true)!;
  assert.ok(cafe.items.every((d) => d.role !== 'side'));
});

test('an allergy drops items from the combo', () => {
  const noMilk = { ...base, allergies: ['milk'] } as unknown as Profile;
  const c = buildCombo(noMilk, dishesFor({ kind: 'cafe', chain: 'sbux' }), 400, true);
  assert.ok(!c || c.items.every((d) => !(d.al ?? []).includes('milk')));
  const fishy = { ...base, allergies: ['fish'] } as unknown as Profile;
  const g = buildCombo(fishy, kindDishes('grill'), 2000)!;
  assert.ok(g.items.every((d) => !d.food.n.includes('سمك')));
});

// ---- More cuisines ----

test('cuisines are found from the name and the map tags, in Arabic and Latin', () => {
  const k = (name: string, tags: Record<string, string> = {}) => kindOf({ amenity: 'restaurant', name, ...tags });
  assert.equal(k('Beirut Nights'), 'lebanese');
  assert.equal(k('مطعم بيروت'), 'lebanese');
  assert.equal(k('Istanbul Grill'), 'turkish');
  assert.equal(k('مطعم اسطنبول'), 'turkish');
  assert.equal(k('Taj India'), 'indian');
  assert.equal(k('مطعم هندي'), 'indian');
  assert.equal(k('Golden Wok Chinese'), 'asian');
  assert.equal(k('مطعم صيني'), 'asian');
  assert.equal(k('Trattoria Roma'), 'italian');
  assert.equal(k('مطعم إيطالي'), 'italian');
  assert.equal(k('X', { cuisine: 'turkish' }), 'turkish');
  assert.equal(k('X', { cuisine: 'indian' }), 'indian');
  assert.equal(k('X', { cuisine: 'chinese' }), 'asian');
  assert.equal(k('X', { cuisine: 'italian' }), 'italian');
  assert.equal(guessCuisine('Koshary El Tahrir'), 'koshari');
  for (const kind of ['lebanese', 'turkish', 'indian', 'asian', 'italian'] as const) {
    const ds = kindDishes(kind);
    assert.ok(ds.filter((d) => d.role === 'main').length >= 4, kind);
    for (const d of ds) assert.ok(EN_DATA[d.food.n], 'no English for ' + d.food.n);
  }
});

// ---- Eating out tonight ----

test('a meal out holds its calories and the rest share what is left', () => {
  const t = targets(base).kcal;
  assert.equal(outReserve(base, 'dinner', 'light'), Math.round((t * SHARE.dinner) / 10) * 10);
  assert.ok(outReserve(base, 'dinner', 'big') > outReserve(base, 'dinner', 'usual'));
  const open = ['breakfast', 'lunch', 'snack', 'dinner'] as const;
  const s = outSplit(1800, [...open], { meal: 'dinner', kcal: 800 });
  assert.equal(s.dinner, 800);
  const rest = 1000, share = SHARE.breakfast + SHARE.lunch + SHARE.snack;
  assert.ok(Math.abs(s.lunch! - (rest * SHARE.lunch) / share) < 0.01);
  assert.ok(Math.abs(open.reduce((a, m) => a + s[m]!, 0) - 1800) < 0.01);
  // Never more than what's left, and a held meal that isn't open anymore changes nothing.
  assert.equal(outSplit(500, ['dinner', 'snack'], { meal: 'dinner', kcal: 800 }).dinner, 500);
  assert.equal(outSplit(500, ['dinner', 'snack'], { meal: 'dinner', kcal: 800 }).snack, 0);
  const none = outSplit(1000, ['lunch', 'snack'], { meal: 'dinner', kcal: 800 });
  assert.ok(Math.abs(none.lunch! + none.snack! - 1000) < 0.01);
});

test('the day plan holds the meal out and makes the others lighter', () => {
  const plain = dayPlan(base, '2026-10-22');
  const out = dayPlan(base, '2026-10-22', {}, [], 0, [], [], { meal: 'dinner', kcal: 900 });
  const d = out.find((e) => e.meal === 'dinner')!;
  assert.ok(d.out && d.recipe == null && d.budget === 900);
  const lunch = (pl: typeof plain) => pl.find((e) => e.meal === 'lunch')!.budget;
  assert.ok(lunch(out) < lunch(plain));
  assert.ok(plain.every((e) => !e.out));
  // Once the meal is ticked, the hold is over.
  const ticked = dayPlan(base, '2026-10-22', {}, [], 900, ['dinner'], [], { meal: 'dinner', kcal: 900 });
  assert.ok(!ticked.find((e) => e.meal === 'dinner')!.out);
});
