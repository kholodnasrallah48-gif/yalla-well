/// <reference types="node" />
// The weekly report's score and its scoreboard page. Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankDay, type DayLog } from './day.ts';
import { setLang } from './i18n.ts';
import { targets, type Profile } from './plan.ts';
import { kcalState, reportHTML, weekReport, weekScore, weekStart } from './report.ts';

const p: Profile = {
  name: 'مريم', sex: 'f', age: 29, height: 165, weight: 78, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-09-01',
};
const T = targets(p);
const food = (kcal: number) => ({ ref: 'x', n: 'أكل', u: '1', kcal, p: T.protein, c: 0, f: 10, q: 1 });
const day = (kcal: number | null, water = 0): DayLog => ({ ...blankDay(), foods: kcal === null ? [] : [food(kcal)], water });

test('calorie state: in range, over, well under, not logged', () => {
  assert.equal(kcalState(1500, 1500, true), 'ok');
  assert.equal(kcalState(1600, 1500, true), 'over');
  assert.equal(kcalState(1000, 1500, true), 'under');
  assert.equal(kcalState(0, 1500, false), 'none');
});

test('week score averages calories, water and workouts over the days so far', () => {
  const today = new Date(2026, 9, 23); // Friday: the whole week is past
  const start = weekStart(today);
  const keys = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
  const k = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // 4 days in range with all the water, 1 day over, 2 days not logged; no workouts ticked.
  const logs: Record<string, DayLog | null> = {};
  keys.forEach((d, i) => { logs[k(d)] = i < 4 ? day(T.kcal, T.waterCups) : i === 4 ? day(T.kcal * 1.4) : null; });
  const r = weekReport(p, start, logs, today);
  const s = weekScore(p, r);
  assert.equal(s.kcal, 4 / 7);
  assert.equal(s.water, 4 / 7);
  assert.equal(s.workouts, 0);
  assert.equal(s.score, Math.round(((4 / 7 + 4 / 7 + 0) / 3) * 100));
  // Without planned workouts the score is calories and water only; nothing past means 0.
  const rest = { ...r, days: r.days.map((d) => ({ ...d, workout: null })) };
  assert.equal(weekScore(p, rest).score, 57);
  assert.equal(weekScore(p, { ...r, days: r.days.map((d) => ({ ...d, future: true })) }).score, 0);

  setLang('ar');
  const html = reportHTML(p, r);
  assert.match(html, /YALLA WELL/);
  assert.match(html, /Be well\. Live more\./);
  assert.match(html, new RegExp(`${s.score}%`));
  assert.match(html, /print-color-adjust:exact/);
  assert.equal((html.match(/<svg/g) ?? []).length, 5); // the score ring and 4 goal rings
  assert.match(html, /حققتي/);
  setLang('en');
  assert.match(reportHTML(p, r), /dir="ltr"[\s\S]*Wins/);
  setLang('ar');
});
