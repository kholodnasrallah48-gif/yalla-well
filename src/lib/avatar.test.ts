/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BODIES, logWeight, shapeFor, weightChange } from './avatar.ts';
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

test('avatar body gets slimmer as BMI drops, for every body type', () => {
  for (const body of BODIES) {
    const before = shapeFor(30, body, 'f'), after = shapeFor(26, body, 'f');
    assert.ok(after.waist < before.waist && after.hip < before.hip && after.arm < before.arm, body);
  }
});

test('every hair, top and bottom draws a valid picture', async () => {
  const { avatarSVG } = await import('./avatar-svg.ts');
  const { HAIRS_F, HAIRS_M, TOPS, BOTTOMS, defaultAvatar } = await import('./avatar.ts');
  for (const sex of ['f', 'm'] as const) for (const hair of [...HAIRS_F, ...HAIRS_M]) for (const top of TOPS) for (const bottom of BOTTOMS) {
    const svg = avatarSVG({ ...defaultAvatar(sex), hair, top, bottom }, 27, sex);
    assert.ok(svg.startsWith('<svg') && !svg.includes('NaN') && !svg.includes('undefined'), `${sex} ${hair} ${top} ${bottom}`);
  }
});
