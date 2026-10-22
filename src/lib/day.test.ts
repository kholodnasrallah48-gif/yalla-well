/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankDay, tickMeal, totals } from './day.ts';
test('ticking a meal held for eating out counts the held calories when nothing is logged in it', () => {
  const d0 = { ...blankDay(), out: { meal: 'lunch' as const, kcal: 600 } };
  const d1 = tickMeal(d0, 'lunch');
  assert.equal(Math.round(totals(d1).kcal), 600);
  const d2 = tickMeal(d1, 'lunch');
  assert.equal(totals(d2).kcal, 0);
  assert.equal(d2.foods.length, 0);
  // Food logged in the held meal is what counts, not the hold.
  const d3 = tickMeal({ ...d0, foods: [{ ref: 'x', n: 'x', u: '', kcal: 450, p: 0, c: 0, f: 0, q: 1, meal: 'lunch' }] }, 'lunch');
  assert.equal(totals(d3).kcal, 450);
});
