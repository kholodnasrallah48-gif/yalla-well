// What the captain says follows the day and speaks to the person (male / female), with no gaps in either language.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { foodLine, homeLine, trainLine } from './captain.ts';
import { setLang } from './i18n.ts';
import { genderFor } from './plan.ts';

const f = genderFor('f'), m = genderFor('m');
const all = (fn: () => string) => { for (const l of ['ar', 'en'] as const) { setLang(l); const s = fn(); assert.ok(s && !/undefined|NaN|null/.test(s), s); } setLang('ar'); };

test('home line follows the day', () => {
  const base = { g: f, name: 'خلود', hour: 18, kcalStreak: 0, left: 500, target: 1500, eaten: 1000, workout: 'سحب', done: 0, total: 6 };
  assert.match(homeLine({ ...base, kcalStreak: 6 }).head, /6 أيام ورا بعض/);
  assert.match(homeLine({ ...base, done: 6 }).head, /كسبتي/);
  assert.match(homeLine({ ...base, g: m, done: 6 }).head, /كسبت ماتش/);
  assert.match(homeLine({ ...base, left: -100 }).head, /عدّينا/);
  assert.match(homeLine({ ...base, workout: null }).body, /راحة/);
  for (const o of [base, { ...base, hour: 8, eaten: 0 }, { ...base, kcalStreak: 3 }]) all(() => Object.values(homeLine(o)).join(' '));
});

test('food line talks about the next empty meal and reminds to tick a meal with food in it', () => {
  assert.equal(foodLine({ g: f, left: 690, budget: 690, meal: 'للعشا', idea: { name: 'شوربة عدس', kcal: 380 } }), 'عندك 690 سعرة للعشا. شوربة عدس بـ380 وتكسبي الماتش.');
  assert.match(foodLine({ g: f, left: 290, budget: 0, meal: null, pending: 'السناك' }), /علّمي على السناك لما تخلصيه/);
  assert.match(foodLine({ g: m, left: -50, budget: 0, meal: null }), /عديت بـ50/);
  all(() => foodLine({ g: f, left: 400, budget: 400, meal: 'dinner', idea: null, pending: 'lunch' }));
});

test('train line goes from warm-up to the final whistle', () => {
  assert.match(trainLine({ g: f, done: 0, total: 6, rest: false }), /سخّني/);
  assert.match(trainLine({ g: f, done: 3, total: 6, rest: false }), /نص الماتش/);
  assert.match(trainLine({ g: f, done: 5, total: 6, rest: false }), /آخر واحد/);
  assert.match(trainLine({ g: m, done: 6, total: 6, rest: false }), /كسبت الماتش/);
  for (const d of [0, 1, 3, 4, 5, 6]) all(() => trainLine({ g: f, done: d, total: 6, rest: false }));
});
