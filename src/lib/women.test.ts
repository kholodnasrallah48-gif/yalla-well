/// <reference types="node" />
// Women's health, sleep, age and injuries.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { UPPER } from './data.ts';
import { easyDay } from './health.ts';
import { effective } from './kb.ts';
import { medical, sessionFor, targets, weekSessions, type Profile } from './plan.ts';
import { sleepHours, sleepRange, sleepVerdict } from './sleep.ts';
import { cycleInfo, dayKind, endPeriod, pregWeek, startFromMonth, startPeriod, trimester } from './women.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 70, activity: 'low', goal: 'lose',
  schedule: '5mix', level: 'beg', conditions: [], meds: [], pains: [],
};
const gymDay = (p: Profile) => weekSessions(p).findIndex((id) => id === 'push' || id === 'upper' || id === 'fullA' || id === 'chest');

test('the cycle: next period, fertile window and lighter first days', () => {
  let c = startPeriod(undefined, '2026-08-01');
  c = startPeriod(c, '2026-08-30');
  c = endPeriod(startPeriod(c, '2026-09-28'), '2026-10-02');
  const i = cycleInfo(c, new Date(2026, 9, 10));
  assert.equal(i.len, 29);
  assert.equal(i.days, 5);
  assert.equal(i.day, 13);
  assert.equal(i.next, '2026-10-27');
  assert.equal(i.ovulation, '2026-10-13');
  assert.deepEqual(i.fertile, ['2026-10-08', '2026-10-14']);
  assert.equal(i.phase, 'fertile');
  assert.equal(dayKind(c, i, '2026-10-01'), 'period');
  assert.equal(dayKind(c, i, '2026-10-13'), 'ovulation');
  assert.equal(dayKind(c, i, '2026-10-28'), 'expected');
  // First two days of a period make the workout easy, unless the person says they're fine.
  const p: Profile = { ...base, cycle: startPeriod(undefined, '2026-10-09') };
  assert.equal(easyDay(p, null, new Date(2026, 9, 10)).why, 'period');
  assert.equal(easyDay(p, null, new Date(2026, 9, 12)).easy, false);
  assert.equal(easyDay({ ...p, sex: 'm' }, null, new Date(2026, 9, 10)).easy, false);
  // A late period stops guessing ovulation.
  assert.equal(cycleInfo(c, new Date(2026, 10, 5)).fertile, null);
  assert.ok(cycleInfo(c, new Date(2026, 10, 5)).late > 0);
});

test('pregnancy: week, extra calories by trimester, no deficit and nothing lying flat after month 3', () => {
  const today = new Date();
  const w4 = startFromMonth(5, today);
  const p: Profile = { ...base, women: { married: true, preg: 'yes', pregStart: w4 } };
  const wk = pregWeek(p.women, today)!;
  assert.ok(wk >= 18 && wk <= 22, String(wk));
  assert.equal(trimester(wk), 2);
  const noPreg = targets({ ...base, goal: 'maintain' });
  assert.equal(targets(p).kcal, Math.round((noPreg.tdee + 340) / 10) * 10);
  assert.ok(effective(p).ids.has('preg'));
  assert.equal(medical(p).mod.deficit, 0);
  const s = sessionFor(p, gymDay(p), false, 0)!;
  assert.ok(s.items.every((x) => !['g_bench', 'g_benchbb', 'g_legcurl', 'g_deadbug'].includes(x.id)), s.items.map((x) => x.id).join());
  assert.ok(s.items.every((x) => x.ex.impact !== 'high'));
});

test('an injury being treated takes out all upper-body work; mild pain only swaps', () => {
  const day = gymDay(base);
  const hurt: Profile = { ...base, pains: ['shoulder', 'neck'], hurt: { shoulder: 'injury', neck: 'injury' } };
  const s = sessionFor(hurt, day, false, 0)!;
  assert.ok(s.items.length >= 3, 'filled with other work');
  assert.ok(s.items.every((x) => !UPPER.has(x.id)), s.items.map((x) => x.id).join());
  assert.ok(medical(hurt).train.some((n) => n.title.includes('إصابة') || n.title.includes('Injury')));
  const mild = sessionFor({ ...hurt, hurt: {} }, day, false, 0)!;
  assert.ok(mild.items.some((x) => UPPER.has(x.id)), 'pain keeps gentler upper-body versions');
  assert.ok(mild.items.every((x) => !['g_ohp', 'g_ohpbb', 'g_latpull'].includes(x.id)));
});

test('age changes the plan; picked common conditions bring their rules', () => {
  assert.equal(medical({ ...base, age: 58 }).mod.lowImpact, true);
  assert.equal(medical({ ...base, age: 70 }).mod.machines, true);
  assert.equal(medical(base).mod.lowImpact, false);
  const htn = effective({ ...base, conditions: ['htn'] });
  assert.ok(htn.food.has('salt'));
  const ob = medical({ ...base, conditions: ['obesity'] });
  assert.equal(ob.mod.lowImpact, true);
  const ca = medical({ ...base, conditions: ['cancer'] });
  assert.ok(ca.mod.deficit <= 0.1);
});

test('sleep hours across midnight and the range for the age', () => {
  assert.equal(sleepHours({ bed: '23:30', wake: '07:00' }), 7.5);
  assert.equal(sleepHours({ bed: '01:00', wake: '06:00' }), 5);
  assert.deepEqual(sleepRange(15), [8, 10]);
  assert.equal(sleepVerdict(5, 30), 'short');
  assert.equal(sleepVerdict(8, 30), 'ok');
});
