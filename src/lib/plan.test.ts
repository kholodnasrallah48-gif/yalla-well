/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXERCISES, FOODS, SCHEDULES, SESSIONS } from './data.ts';
import { addFood, blankDay, changePortion, totals, weekIndex } from './day.ts';
import { medical, sessionFor, targets, type Profile } from './plan.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 28, height: 165, weight: 70, activity: 'low', goal: 'lose',
  schedule: '5mix', level: 'beg', conditions: [], meds: [], pains: [],
};

test('every exercise alternative and session exercise exists', () => {
  for (const [id, e] of Object.entries(EXERCISES)) if (e.alt) assert.ok(EXERCISES[e.alt], `${id} → ${e.alt}`);
  for (const [id, s] of Object.entries(SESSIONS)) for (const ex of s.ex) assert.ok(EXERCISES[ex], `${id}: ${ex}`);
  for (const s of Object.values(SCHEDULES)) for (const sid of Object.values(s.map)) assert.ok(SESSIONS[sid], sid);
});

test('calorie target follows Mifflin-St Jeor with a 20% deficit', () => {
  // BMR = 700 + 1031.25 - 140 - 161 = 1430.25; TDEE = × (1.2 + 0.17) = 1959.4; × 0.8 = 1567.5 → 1570
  const t = targets(base);
  assert.equal(t.tdee, 1959);
  assert.equal(t.kcal, 1570);
  assert.equal(t.protein, 126);
  assert.equal(t.waterCups, 10);
});

test('hashimoto caps the deficit at 15% and graves removes it', () => {
  assert.equal(targets({ ...base, conditions: ['hashimoto'] }).kcal, 1670);
  assert.equal(targets({ ...base, conditions: ['graves'] }).kcal, 1960);
});

test('steroids raise protein to 2 g/kg', () => {
  assert.equal(targets({ ...base, meds: ['steroids'] }).protein, 140);
});

test('calories never go below the floor', () => {
  assert.equal(targets({ ...base, weight: 40, height: 150, age: 60 }).kcal, 1200);
  assert.equal(targets({ ...base, sex: 'm', weight: 45, height: 150, age: 70 }).kcal, 1500);
});

test('knee pain swaps squats and lunges for gentler exercises', () => {
  const s = sessionFor({ ...base, pains: ['knee'] }, 2, false)!; // Monday: lower body
  const ids = s.items.map((x) => x.id);
  for (const id of ids) assert.ok(!EXERCISES[id].stress.includes('knee'), id);
  assert.ok(s.items.some((x) => x.why?.includes('الركبة')));
});

test('low-impact conditions remove jumping', () => {
  const s = sessionFor({ ...base, conditions: ['ra'] }, 4, false)!; // Wednesday: home cardio
  assert.ok(s.items.every((x) => x.ex.impact !== 'high'));
});

test('blood thinners prefer machines over free weights', () => {
  const s = sessionFor({ ...base, meds: ['anticoag'] }, 0, false)!;
  assert.ok(s.items.every((x) => !x.ex.free));
});

test('flare day becomes a recovery session; rest days have none', () => {
  assert.equal(sessionFor(base, 0, true)!.id, 'gentle');
  assert.equal(sessionFor(base, 3, false), null);
});

test('celiac turns on gluten flags; notes appear for each med', () => {
  const m = medical({ ...base, conditions: ['celiac'], meds: ['thyroxine', 'insulin'] });
  assert.ok(m.mod.glutenFree);
  assert.ok(m.food.some((n) => n.title === 'دوا الغدة'));
  assert.ok(m.train.some((n) => n.title === 'السكر'));
});

test('masculine wording for men', () => {
  const m = medical({ ...base, sex: 'm', meds: ['thyroxine'] });
  assert.ok(m.food[0].text.startsWith('خده'));
});

test('food log adds, merges and removes portions', () => {
  let d = addFood(blankDay(), FOODS[0]);
  d = addFood(d, FOODS[0]);
  assert.equal(d.foods[0].q, 2);
  assert.equal(totals(d).kcal, FOODS[0].kcal * 2);
  d = changePortion(d, 0, -0.5);
  assert.equal(d.foods[0].q, 1.5);
  d = changePortion(changePortion(changePortion(d, 0, -0.5), 0, -0.5), 0, -0.5);
  assert.equal(d.foods.length, 0);
});

test('week starts on Saturday', () => {
  assert.equal(weekIndex(new Date(2026, 9, 3)), 0); // Sat 3 Oct 2026
  assert.equal(weekIndex(new Date(2026, 9, 2)), 6); // Fri
});
