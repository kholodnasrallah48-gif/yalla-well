/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { logWeight, weightChange } from './weight.ts';
import type { Profile } from './plan.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 28, height: 165, weight: 80, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-09-01',
} as Profile;

test('first weigh-in keeps the starting weight, same-day weigh-ins replace each other', () => {
  let p = logWeight(base, 79, '2026-09-08');
  assert.deepEqual(p.weights, [{ d: '2026-09-01', kg: 80 }, { d: '2026-09-08', kg: 79 }]);
  p = logWeight(p, 78.5, '2026-09-08');
  assert.deepEqual(p.weights, [{ d: '2026-09-01', kg: 80 }, { d: '2026-09-08', kg: 78.5 }]);
  p = logWeight(p, 77, '2026-09-15');
  assert.equal(p.weight, 77);
  assert.deepEqual(weightChange(p), { start: 80, now: 77, diff: -3 });
});

