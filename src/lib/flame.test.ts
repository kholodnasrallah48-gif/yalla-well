/// <reference types="node" />
// The flame streak: lit by hand, shields every 7 days cover a missed day, and a missed day without one starts over.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { blankDay, dayKey, type DayLog } from './day.ts';
import { flame } from './flame.ts';
import { targets, type Profile } from './plan.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 30, height: 165, weight: 80, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [], start: '2026-09-01',
} as Profile;
const kcal = targets(base).kcal;
const today = new Date(2026, 9, 18);
const ago = (i: number) => dayKey(new Date(2026, 9, 18 - i));
const good = (lit = false): DayLog => ({ ...blankDay(), foods: [{ ref: 'x', n: 'x', u: 'g', kcal, p: 0, c: 0, f: 0, q: 1 }], lit });
/** Logs for the past days given as a string, oldest first: o = on target, x = missed. Today is last. */
const logs = (s: string) => {
  const out: Record<string, DayLog> = {};
  [...s].forEach((ch, i) => { if (ch === 'o' || ch === 'L') out[ago(s.length - 1 - i)] = good(ch === 'L'); });
  return out;
};
const p = { ...base, start: ago(30) } as Profile;

test('today counts only once lit, and never breaks the streak before midnight', () => {
  assert.equal(flame(p, logs('ooo-'), today).n, 3);
  const ready = flame(p, logs('oooo'), today);
  assert.equal(ready.n, 3); assert.ok(ready.todayOk && !ready.lit);
  assert.equal(flame(p, logs('oooL'), today).n, 4);
});

test('a finished day nobody lit still counts once it is over', () => {
  assert.equal(flame(p, logs('ooooo-'), today).n, 5);
});

test('7 days earn a shield, at most 2', () => {
  const f = flame(p, logs('ooooooo-'), today);
  assert.equal(f.shields, 1); assert.equal(f.toShield, 7);
  assert.deepEqual(f.events.map((e) => e.kind), ['earn']);
  assert.equal(flame(p, logs('ooooooooooooooooooooo-'), today).shields, 2);
});

test('a missed day uses a shield and the streak goes on', () => {
  const f = flame(p, logs('oooooooxoo-'), today);
  assert.equal(f.n, 9); assert.equal(f.shields, 0);
  assert.equal(f.marks[ago(3)], 'shield');
  assert.deepEqual(f.events.map((e) => e.kind), ['earn', 'save']);
});

test('a missed day with no shield starts over', () => {
  const f = flame(p, logs('oooxoo-'), today);
  assert.equal(f.n, 2); assert.equal(f.best, 3); assert.equal(f.marks[ago(3)], 'miss');
  assert.deepEqual(f.events.map((e) => e.kind), ['lost']);
});

test('days before the plan started are ignored', () => {
  assert.equal(flame({ ...base, start: ago(2) } as Profile, logs('xxxoo-'), today).n, 2);
});
