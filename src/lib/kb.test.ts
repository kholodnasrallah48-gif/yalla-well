import assert from 'node:assert/strict';
import { test } from 'node:test';

import { foodLevel, healthNotes, type Food } from './foods.ts';
import { dueOn, doseText, repeatText, spacing, type MedPlan } from './health.ts';
import { allergyFood, effective, matchItems, splitItems } from './kb.ts';
import { medical, targets, type Profile } from './plan.ts';

const base: Profile = { name: '', sex: 'f', age: 30, height: 160, weight: 70, activity: 'mid', goal: 'lose', schedule: 'fb3', level: 'beg', conditions: [], meds: [], pains: [] };
const ids = (t: string) => splitItems(t).flatMap((x) => matchItems(x).map((i) => i.id));

test('typed conditions and medicines are recognised however they are written', () => {
  assert.deepEqual(ids('ضغط عالي'), ['htn']);
  assert.deepEqual(ids('ضغط واطي'), ['lowbp']);
  assert.deepEqual(ids('عندي ضغط وسكر').sort(), ['htn', 'k_t2d']);
  assert.deepEqual(ids('انزلاق غضروفي، أنيميا'), ['disc', 'anemia']);
  assert.deepEqual(ids('فيتامين د ٥٠ ألف'), ['v_d']);
  assert.deepEqual(ids('يوثيروكس'), ['m_thyrox']);
  assert.deepEqual(ids('Ozempic'), ['m_glp1']);
  assert.deepEqual(ids('MS'), ['k_ms']);
  assert.deepEqual(ids('msg'), []);
  assert.equal(allergyFood('حساسية من الجمبري'), 'جمبري');
});

test('a typed condition changes food alerts, workouts, water and the stop signs', () => {
  const p: Profile = { ...base, otherCond: 'ضغط عالي، انزلاق غضروفي، انيميا الفول' };
  const e = effective(p);
  assert.ok(e.ids.has('htn') && e.ids.has('disc') && e.ids.has('g6pd'));
  assert.deepEqual(e.pains, ['back']);
  const M = medical(p);
  assert.ok(M.mod.machines, 'no heavy free weights with high blood pressure');
  assert.ok(M.watch.length >= 3);
  const ful: Food = { id: 'x', cat: 'فطار', n: 'فول مدمس', u: 'طبق', kcal: 250, p: 13, c: 30, f: 8, tags: ['fiber'] };
  assert.equal(foodLevel(p, ful), 'bad');
  const pickles: Food = { id: 'y', cat: 'سناك', n: 'مخلل', u: 'طبق', kcal: 20, p: 0, c: 4, f: 0, tags: ['salty'] };
  assert.ok(healthNotes(p, pickles).some((n) => n.level === 'warn'));
});

test('answers about an unknown condition are applied', () => {
  const p: Profile = { ...base, otherCond: 'مرض نادر', extra: { 'مرض نادر': { food: ['dairy'], train: ['noJump'], watch: ['dizzy'] } } };
  const M = medical(p);
  assert.ok(M.mod.lowImpact);
  assert.ok(M.watch.length === 1);
  const milk: Food = { id: 'z', cat: 'مشروبات', n: 'لبن', u: 'كوب', kcal: 120, p: 8, c: 12, f: 5, tags: ['dairy'] };
  assert.ok(healthNotes(p, milk).some((n) => n.level === 'warn'));
});

test('kidney disease caps protein; kidney stones add water', () => {
  assert.ok(targets({ ...base, otherCond: 'فشل كلوي' }).protein <= 70);
  assert.ok(targets({ ...base, otherCond: 'حصوات' }).waterCups > targets(base).waterCups);
});

test('medicine schedules: every other day, some weekdays, every two weeks, monthly', () => {
  const d = (s: string) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  const other: MedPlan = { times: ['09:00'], repeat: 'days', n: 2, from: '2026-10-01' };
  assert.equal(dueOn(other, d('2026-10-03')), true);
  assert.equal(dueOn(other, d('2026-10-04')), false);
  assert.equal(dueOn(other, d('2026-09-29')), false, 'nothing before the first dose');
  // 2026-10-09 is a Friday (index 6), 2026-10-03 a Saturday (index 0).
  const days: MedPlan = { times: ['09:00'], repeat: 'week', n: 1, weekdays: [0, 6] };
  assert.equal(dueOn(days, d('2026-10-09')), true);
  assert.equal(dueOn(days, d('2026-10-08')), false);
  const biweekly: MedPlan = { times: ['10:00'], repeat: 'week', n: 2, weekdays: [6], from: '2026-10-09' };
  assert.equal(dueOn(biweekly, d('2026-10-16')), false);
  assert.equal(dueOn(biweekly, d('2026-10-23')), true);
  const monthly: MedPlan = { times: ['10:00'], repeat: 'month', n: 1, from: '2026-01-31' };
  assert.equal(dueOn(monthly, d('2026-02-28')), true, 'last day when the month is shorter');
  assert.equal(dueOn(monthly, d('2026-03-31')), true);
  assert.equal(dueOn(monthly, d('2026-03-30')), false);
  const legacy: MedPlan = { times: ['20:00'], day: 6, every: 1 };
  assert.equal(dueOn(legacy, d('2026-10-09')), true);
  assert.equal(repeatText(other), 'يوم ويوم');
  assert.equal(doseText({ times: [], count: 1.5, form: 'pill', dose: 50, unit: 'mcg' }), 'حباية ونص · 50 ميكروجرام');
  assert.equal(doseText({ times: [], count: 2, form: 'cap' }), 'كبسولتين');
});

test('thyroid pills and calcium too close together are flagged', () => {
  const p: Profile = { ...base, meds: ['thyroxine'], medPlan: { thyroxine: { times: ['07:00'] }, 'x:كالسيوم': { name: 'كالسيوم', kb: 'v_calc', times: ['09:00'] } } };
  assert.equal(spacing(p).length, 1);
  const ok: Profile = { ...p, medPlan: { ...p.medPlan, 'x:كالسيوم': { name: 'كالسيوم', kb: 'v_calc', times: ['14:00'] } } };
  assert.equal(spacing(ok).length, 0);
});
