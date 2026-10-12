/// <reference types="node" />
// Week story numbers and headline. Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankDay, dayKey, type DayLog } from './day.ts';
import { targets, type Profile } from './plan.ts';
import { weekStart } from './report.ts';
import { weekStory } from './story.ts';

const p: Profile = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 75, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-01-01',
};
const onTarget = (): DayLog => {
  const k = targets(p).kcal;
  return { ...blankDay(), water: 20, meals: ['breakfast', 'lunch', 'dinner'], foods: [{ ref: 'x', n: 'أكل', u: 'طبق', kcal: k, p: 0, c: 0, f: 0, q: 1 }] };
};

test('weekStory counts the days so far and ignores the future', () => {
  const today = new Date(2026, 9, 13); // Tuesday: Sat, Sun, Mon, Tue so far
  const start = weekStart(today);
  const logs: Record<string, DayLog> = {};
  for (let i = 0; i < 3; i++) { const d = new Date(start); d.setDate(d.getDate() + i); logs[dayKey(d)] = onTarget(); }
  const s = weekStory(p, start, logs, today);
  assert.equal(s.past, 4);
  assert.equal(s.kcalDays, 3);
  assert.equal(s.waterDays, 3);
  assert.ok(s.points > 0);
  assert.equal(s.days.filter((d) => d.future).length, 3);
  assert.ok(s.headline.length > 0);
});

test('weekStory with nothing logged gives a gentle headline', () => {
  const today = new Date(2026, 9, 13);
  const s = weekStory(p, weekStart(today), {}, today);
  assert.equal(s.kcalDays, 0);
  assert.equal(s.headline, 'لسه في الأول');
});
