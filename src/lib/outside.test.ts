/// <reference types="node" />
// "أنا برة البيت": dishes fit what's left of the day and the person's health, and nearby places are sorted by kind.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { fromPhoton, KINDS, kindOf, menu, meters, picks, toPlaces } from './outside.ts';
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
  assert.equal(kindOf({ amenity: 'restaurant', cuisine: 'lebanese' }), 'grill');
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
    ['كشري التحرير', 'fast', 'koshari'], ['Pizza Hut', 'fast', 'pizza'], ['Cilantro', 'cafe', undefined], ['Rouh Beirut', 'grill', undefined],
  ]);
});
