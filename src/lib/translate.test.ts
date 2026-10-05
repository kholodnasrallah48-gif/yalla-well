/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getLang, setLang } from './i18n.ts';
import { medical, type Profile } from './plan.ts';
import { freeTexts, needsTr, quoteUx, scriptOf, translateMissing, untranslated, ux, withTr } from './translate.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 28, height: 165, weight: 70, activity: 'low', goal: 'lose',
  schedule: '5mix', level: 'beg', conditions: [], meds: [], pains: [],
};

test('script detection: any Arabic letter makes it Arabic', () => {
  assert.equal(scriptOf('بلاش صيام'), 'ar');
  assert.equal(scriptOf('no fasting'), 'en');
  assert.equal(scriptOf('HbA1c عالي'), 'ar');
  assert.equal(scriptOf('١٢٣'), 'ar');
  assert.equal(needsTr('بلاش صيام', 'en'), true);
  assert.equal(needsTr('بلاش صيام', 'ar'), false);
  assert.equal(needsTr('no fasting', 'ar'), true);
  assert.equal(needsTr('7.2', 'ar'), false, 'numbers need no translation');
});

test('ux shows the saved translation only when the script differs from the app language', () => {
  const p = { tr: { 'بلاش صيام': 'No fasting', 'gluten': 'جلوتين' } };
  assert.equal(ux(p, 'بلاش صيام', 'en'), 'No fasting');
  assert.equal(ux(p, ' بلاش صيام ', 'en'), 'No fasting', 'trimmed before lookup');
  assert.equal(ux(p, 'بلاش صيام', 'ar'), 'بلاش صيام');
  assert.equal(ux(p, 'gluten', 'ar'), 'جلوتين');
  assert.equal(ux(p, 'gluten', 'en'), 'gluten');
  assert.equal(ux({}, 'بلاش صيام', 'en'), 'بلاش صيام', 'falls back to the original');
  assert.equal(ux(p, undefined, 'en'), '');
  assert.equal(untranslated({}, 'بلاش صيام', 'en'), true);
  assert.equal(untranslated(p, 'بلاش صيام', 'en'), false);
});

test('quoteUx marks untranslated Arabic as the person\'s own words in English only', () => {
  assert.equal(quoteUx({}, 'بلاش صيام', 'en'), '"بلاش صيام" (in your words)');
  assert.equal(quoteUx({ tr: { 'بلاش صيام': 'No fasting' } }, 'بلاش صيام', 'en'), '"No fasting"');
  assert.equal(quoteUx({}, 'بلاش صيام', 'ar'), 'بلاش صيام');
  assert.equal(quoteUx({}, 'no fasting', 'en'), '"no fasting"');
});

test('medical notes show the doctor\'s note in the app language', () => {
  const was = getLang();
  try {
    setLang('en');
    const p: Profile = { ...base, doctorSaid: 'بلاش صيام', otherPain: 'الكوع' };
    const raw = medical(p);
    assert.ok(raw.train[0].text.startsWith('"بلاش صيام" (in your words).'), raw.train[0].text);
    const done = medical(withTr(p, { 'بلاش صيام': 'No fasting', 'الكوع': 'elbow' }));
    assert.ok(done.train[0].text.startsWith('"No fasting".'), done.train[0].text);
    assert.ok(!/[؀-ۿ]/.test(done.train.map((n) => n.title + n.text).join(' ')), 'no Arabic left');
    setLang('ar');
    assert.ok(medical(p).train[0].text.includes('بلاش صيام'));
  } finally {
    setLang(was);
  }
});

test('translateMissing asks only for new text and withTr drops stale entries', async () => {
  const p: Profile = { ...base, doctorSaid: 'بلاش صيام', otherCond: 'بلاش صيام', condInfo: { celiac: { trigger: 'لبن' } }, tr: { 'لبن': 'milk', 'قديم': 'old' } };
  assert.deepEqual(freeTexts(p), ['بلاش صيام', 'لبن']);
  const asked: string[] = [];
  const add = await translateMissing(p, async (s) => { asked.push(s); return 'No fasting'; });
  assert.deepEqual(asked, ['بلاش صيام']);
  assert.deepEqual(withTr(p, add!).tr, { 'لبن': 'milk', 'بلاش صيام': 'No fasting' });
  assert.equal(await translateMissing(p, async () => null), null, 'offline: nothing to save');
});
