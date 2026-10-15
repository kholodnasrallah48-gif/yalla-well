/// <reference types="node" />
// Food allergies and the dietitian's own plan. Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calorieCheck } from './adapt.ts';
import { typedAllergies } from './allergy.ts';
import { FOODS, healthNotes, recipeFits } from './foods.ts';
import { targets, type Profile } from './plan.ts';
import { RECIPES } from './recipes-data.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 80, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-09-01',
} as Profile;

test('a picked allergy hides recipes with it in the ingredients and flags foods red', () => {
  const tahini = RECIPES.find((r) => r.ingredients.some((x) => x.includes('طحينة')))!;
  assert.ok(recipeFits(base, tahini));
  const p = { ...base, allergies: ['sesame'] };
  assert.equal(recipeFits(p, tahini), false);
  const halawa = FOODS.find((f) => f.n === 'حلاوة طحينية')!;
  assert.ok(healthNotes(p, halawa).some((n) => n.level === 'bad'));
});

test('a milk allergy also catches foods tagged dairy', () => {
  const p = { ...base, allergies: ['milk'] };
  const dairy = FOODS.find((f) => f.tags?.includes('dairy'))!;
  assert.ok(healthNotes(p, dairy).some((n) => n.level === 'bad'));
});

test('typed allergies drop "حساسية من" and "ال"', () => {
  assert.deepEqual(typedAllergies('حساسية من الفراولة، كيوي'), ['فراوله', 'كيوي']);
  const p = { ...base, otherAllergy: 'الفراولة' };
  const straw = FOODS.find((f) => f.n.includes('فراولة'));
  if (straw) assert.ok(healthNotes(p, straw).some((n) => n.level === 'bad'));
});

test("a dietitian's plan is used as written and skips the weekly calorie check", () => {
  const p: Profile = { ...base, macro: { mode: 'own', own: { kcal: 1500, p: 110, c: 140, f: 50 } }, weights: [{ d: '2026-09-28', kg: 80 }, { d: '2026-10-12', kg: 80 }] };
  const T = targets(p);
  assert.deepEqual([T.kcal, T.protein, T.carbs, T.fat], [1500, 110, 140, 50]);
  assert.equal(calorieCheck(p, new Date(2026, 9, 12)), null);
  // Calories only: grams are split the usual way around those calories.
  const k = targets({ ...base, macro: { mode: 'own', own: { kcal: 1500, p: 0, c: 0, f: 0 } } });
  assert.equal(k.kcal, 1500);
  assert.ok(k.protein > 0 && k.carbs > 0 && k.fat > 0);
});
