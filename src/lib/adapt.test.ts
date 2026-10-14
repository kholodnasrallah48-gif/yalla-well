/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { calorieCheck, weeklyRate } from './adapt.ts';
import { bodyFat, logBody, bodyChanges } from './body.ts';
import { hasEquip, ketoBlocked, sessionFor, targets, withEquip, type Profile } from './plan.ts';
import { addToHistory, liftTrend } from './progress.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 80, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-09-01',
} as Profile;
const today = new Date(2026, 9, 12);

test('weekly rate needs two weigh-ins 10+ days apart in the last 4 weeks', () => {
  assert.equal(weeklyRate([{ d: '2026-10-08', kg: 80 }, { d: '2026-10-12', kg: 79.8 }], today), null);
  const r = weeklyRate([{ d: '2026-09-28', kg: 80 }, { d: '2026-10-05', kg: 79.5 }, { d: '2026-10-12', kg: 79 }], today)!;
  assert.equal(r.kgPerWeek, -0.5);
});

test('a stall when losing suggests 100 kcal less; too fast suggests 150 more', () => {
  const stall = { ...base, weights: [{ d: '2026-09-28', kg: 80 }, { d: '2026-10-12', kg: 80 }] };
  const a = calorieCheck(stall, today)!;
  assert.equal(a.kind, 'change');
  assert.equal(a.kind === 'change' && a.delta, -100);
  const fast = { ...base, weights: [{ d: '2026-09-28', kg: 82 }, { d: '2026-10-12', kg: 80 }] };
  const b = calorieCheck(fast, today)!;
  assert.equal(b.kind === 'change' && b.delta, 150);
  // On track: nothing to do. Answered this week: nothing either.
  assert.equal(calorieCheck({ ...base, weights: [{ d: '2026-09-28', kg: 81 }, { d: '2026-10-12', kg: 80 }] }, today), null);
  assert.equal(calorieCheck({ ...stall, adjAt: '2026-10-10' }, today), null);
});

test('conditions that cap the deficit are sent to the doctor instead of eating less', () => {
  const p = { ...base, conditions: ['hashimoto'], weights: [{ d: '2026-09-28', kg: 80 }, { d: '2026-10-12', kg: 80 }] };
  assert.equal(calorieCheck(p, today)?.kind, 'doctor');
});

test('the adjustment moves the target and never goes under the floor', () => {
  assert.equal(targets({ ...base, kcalAdj: -100 }).kcal, targets(base).kcal - 100);
  assert.equal(targets({ ...base, weight: 45, height: 150, age: 60, kcalAdj: -300 }).kcal, 1200);
});

test('macro splits: low carb, keto blocked with insulin, custom percentages', () => {
  const lc = targets({ ...base, macro: { mode: 'lowcarb' } });
  assert.equal(lc.carbs, Math.round((lc.kcal * 0.25) / 4));
  assert.ok(ketoBlocked({ ...base, meds: ['insulin'] }));
  assert.equal(ketoBlocked(base), null);
  const k = targets({ ...base, meds: ['insulin'], macro: { mode: 'keto' } });
  assert.equal(k.carbs, targets(base).carbs);
  const cu = targets({ ...base, macro: { mode: 'custom', p: 30, c: 40, f: 30 } });
  assert.equal(cu.protein, Math.round((cu.kcal * 0.3) / 4));
});

test('missing equipment switches to a version the gym has', () => {
  const noDb = { ...base, equip: ['machine', 'cable', 'barbell'] } as Profile;
  assert.equal(hasEquip(noDb, 'g_bench'), false);
  assert.equal(withEquip(noDb, 'g_bench'), 'g_chestm');
  const s = sessionFor({ ...noDb, schedule: '3' }, 0, false, 0)!;
  assert.ok(s.items.every((x) => hasEquip(noDb, x.id) || x.ex.k !== 'str' || !x.id.startsWith('g_')), s.items.map((x) => x.id).join(','));
});

test('logbook keeps one session per day and reports the change', () => {
  let h = addToHistory(undefined, { date: '2026-10-01', w: 20, reps: [12, 12], top: 12 });
  h = addToHistory(h, { date: '2026-10-08', w: 22.5, reps: [10, 10], top: 12 });
  h = addToHistory(h, { date: '2026-10-08', w: 25, reps: [8], top: 12 });
  assert.equal(h.length, 2);
  assert.equal(liftTrend(h)!.diff, 5);
});

test('measurements and the tape body-fat estimate', () => {
  let p = logBody(base, { waist: 90, hips: 110, neck: 34 }, '2026-10-01');
  p = logBody(p, { waist: 87 }, '2026-10-12');
  assert.equal(bodyChanges(p).waist!.diff, -3);
  const f = bodyFat('f', 165, { waist: 87, hips: 110, neck: 34 })!;
  assert.ok(f > 30 && f < 45, String(f));
  assert.equal(bodyFat('m', 175, { waist: 30, neck: 40 }), null);
});

test('liftRecord picks the heaviest session and the next goal', async () => {
  const { liftRecord } = await import('./progress.ts');
  const h = [
    { date: '2026-09-01', w: 30, reps: [12, 12, 10], top: 12 },
    { date: '2026-09-08', w: 42.5, reps: [10, 9, 8], top: 12 },
    { date: '2026-09-15', w: 42.5, reps: [12, 11, 10], top: 12 },
    { date: '2026-09-22', w: 40, reps: [12, 12, 12], top: 12 },
  ];
  const r = liftRecord('g_squat', h)!;
  assert.equal(r.best.date, '2026-09-15');
  assert.ok(r.goal > 42.5);
  assert.equal(r.change, -2.5);
  assert.equal(liftRecord('g_squat', [h[0]])!.change, null);
  assert.equal(liftRecord('g_squat', []), null);
});
