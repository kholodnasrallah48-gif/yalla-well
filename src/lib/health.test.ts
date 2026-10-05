// Medicine schedules, the easy day after weekly doses, check-ins, labs and the doctor report.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankDay } from './day.ts';
import { addLab, afterWeeklyDose, doctorHTML, doctorSummary, dosesOn, dueOn, isTime, labsFor, medIds, nextLab, roughDay, timeText } from './health.ts';
import type { Profile } from './plan.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 70, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [],
};
// 2026-10-08 is a Thursday (weekday index 5, Saturday = 0).
const thu = new Date(2026, 9, 8), fri = new Date(2026, 9, 9), sat = new Date(2026, 9, 10);

test('daily medicines are due every day with their default times and hints', () => {
  const p: Profile = { ...base, meds: ['thyroxine', 'steroids'] };
  const d = dosesOn(p, thu);
  assert.deepEqual(d.map((x) => x.key), ['thyroxine@07:00', 'steroids@08:00']);
  assert.match(d[0].how, /معدة فاضية/);
});

test('weekly doses follow the weekday and the every-n-weeks count', () => {
  const p: Profile = { ...base, meds: ['mtx', 'bio'], medPlan: { bio: { times: ['10:00'], day: 5, every: 2, from: '2026-10-08' } } };
  assert.deepEqual(dosesOn(p, thu).map((x) => x.id), ['bio', 'mtx']);
  assert.equal(dosesOn(p, fri).length, 0);
  const nextThu = new Date(2026, 9, 15), twoWeeks = new Date(2026, 9, 22);
  assert.equal(dueOn(p.medPlan!.bio, nextThu), false);
  assert.equal(dueOn(p.medPlan!.bio, twoWeeks), true);
  // The day after a weekly dose is an easy day.
  assert.ok(afterWeeklyDose(p, fri));
  assert.equal(afterWeeklyDose(p, sat), null);
});

test('medicines the person added get their own schedule', () => {
  const p: Profile = { ...base, medPlan: { 'x:فيتامين د': { times: ['21:00'], name: 'فيتامين د' } } };
  assert.deepEqual(medIds(p), ['x:فيتامين د']);
  assert.equal(dosesOn(p, thu)[0].name, 'فيتامين د');
});

test('times and check-ins', () => {
  assert.ok(isTime('7:30') && isTime('23:59') && !isTime('24:00') && !isTime('7'));
  assert.equal(timeText('07:00'), '7:00 ص');
  assert.equal(timeText('20:15'), '8:15 م');
  assert.equal(roughDay({ energy: 0, pain: 2, sleep: 0 }), true);
  assert.equal(roughDay({ energy: 2, pain: 0, sleep: 2 }), true);
  assert.equal(roughDay({ energy: 1, pain: 1, sleep: 1 }), false);
  assert.equal(roughDay(undefined), false);
});

test('labs that matter and when to repeat them', () => {
  const p: Profile = { ...base, conditions: ['t2d', 'hashimoto'], meds: ['hcq'] };
  const ks = labsFor(p);
  assert.ok(ks.includes('hba1c') && ks.includes('tsh') && ks.includes('eye') && ks.includes('vitd'));
  assert.ok(!labsFor({ ...base, sex: 'm' }).includes('tsh'));
  const q = addLab(p, { kind: 'hba1c', value: 7.2, date: '2026-09-01' });
  assert.equal(nextLab(q, 'hba1c'), '2026-12-01');
  assert.equal(nextLab(q, 'tsh'), null);
});

test('doctor report counts doses, check-ins and workouts', () => {
  const p: Profile = { ...base, meds: ['thyroxine'], conditions: ['hashimoto'], labs: [{ kind: 'tsh', value: 3.1, date: '2026-09-20' }] };
  const days = [
    { key: '2026-10-08', log: { ...blankDay(), medsTaken: ['thyroxine@07:00'], check: { energy: 0 as const, pain: 1 as const, sleep: 0 as const }, done: ['a', 'b'] } },
    { key: '2026-10-09', log: { ...blankDay(), check: { energy: 2 as const, pain: 2 as const, sleep: 1 as const } } },
    { key: '2026-10-10', log: null },
  ];
  const input = { profile: p, days, planned: { '2026-10-08': ['a', 'b', 'c'], '2026-10-10': ['a'] } };
  const s = doctorSummary(input);
  assert.equal(s.dosesDue, 3);
  assert.equal(s.dosesTaken, 1);
  assert.equal(s.checks, 2);
  assert.equal(s.rough, 1);
  assert.deepEqual([s.workoutsDone, s.workoutsPlanned], [1, 2]);
  const html = doctorHTML(input);
  assert.match(html, /تقرير للدكتور/);
  assert.match(html, /3.1 mIU\/L/);
});

test('easy days: flare, the day after a weekly dose, a rough check-in, unless turned off', async () => {
  const { easyDay } = await import('./health.ts');
  const p: Profile = { ...base, meds: ['mtx'] };
  assert.deepEqual(easyDay(p, { ...blankDay(), flare: true }, sat), { easy: true, why: 'flare' });
  assert.equal(easyDay(p, blankDay(), fri).why, 'dose');
  assert.equal(easyDay(p, { ...blankDay(), normalDay: true }, fri).easy, false);
  assert.equal(easyDay(p, { ...blankDay(), check: { energy: 2, pain: 2, sleep: 0 } }, sat).why, 'check');
  assert.equal(easyDay(p, blankDay(), sat).easy, false);
});

test('logged lab results drive the medical notes, and doses get phone reminders', async () => {
  const { medical } = await import('./plan.ts');
  const { planReminders } = await import('./reminders.ts');
  const p: Profile = { ...base, conditions: ['t2d'], meds: ['thyroxine'], condInfo: { t2d: { lab: '6.5' } }, labs: [{ kind: 'hba1c', value: 9.4, date: '2026-09-30' }] };
  assert.ok(medical(p).train.some((n) => /9.4/.test(n.text)));
  const rs = planReminders({ profile: p, day: blankDay(), now: new Date(2026, 9, 8, 6, 0), lang: 'ar', days: 2 });
  const meds = rs.filter((r) => r.kind === 'med');
  assert.equal(meds.length, 2);
  assert.equal(meds[0].date.getHours(), 7);
  const taken = planReminders({ profile: p, day: { ...blankDay(), medsTaken: ['thyroxine@07:00'] }, now: new Date(2026, 9, 8, 6, 0), lang: 'ar', days: 1 });
  assert.equal(taken.filter((r) => r.kind === 'med').length, 0);
});
