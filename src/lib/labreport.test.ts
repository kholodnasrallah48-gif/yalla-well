// The lab comparison report: last 3 results per test, change toward the range, status words, notes, empty page.
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { setLang } from './i18n.ts';
import { labNotes, labReportHTML, labRows, labStatus, labSummary, noValueRows, rangeText } from './labreport.ts';
import type { Profile } from './plan.ts';

const base: Profile = {
  name: 'مريم', sex: 'f', age: 29, height: 165, weight: 78, activity: 'low', goal: 'lose',
  schedule: '3', level: 'beg', conditions: [], meds: [], pains: [],
};
const today = new Date(2026, 9, 23);
const p: Profile = {
  ...base,
  weights: [{ d: '2026-09-01', kg: 78.4 }, { d: '2026-10-20', kg: 77.6 }],
  labs: [
    { kind: 'hba1c', value: 7.2, date: '2025-12-01' },
    { kind: 'hba1c', value: 6.9, date: '2026-03-03' },
    { kind: 'hba1c', value: 6.4, date: '2026-06-08' },
    { kind: 'hba1c', value: 6.1, date: '2026-10-12' },
    { kind: 'vitd', value: 14, date: '2026-03-15' },
    { kind: 'vitd', value: 31, date: '2026-10-12' },
    { kind: 'ferritin', value: 24, date: '2026-10-12' },
    { kind: 'lipids', value: 190, date: '2026-03-03' },
    { kind: 'lipids', value: 230, date: '2026-10-12' },
    { kind: 'cbc', date: '2026-06-12', next: '2026-09-12' },
    { kind: 'eye', date: '2026-03-03' },
  ],
};

test('ranges and status words follow the range and the test hint', () => {
  setLang('ar');
  assert.match(rangeText('hba1c'), /أقل من .*5\.7/);
  assert.match(rangeText('tsh'), /من .*0\.4.* لـ .*4\.5/);
  assert.equal(labStatus('vitd', 31), 'ok');
  assert.equal(labStatus('vitd', 25), 'warn'); // the hint says fine, but it is under the usual range
  assert.equal(labStatus('vitd', 8), 'bad');
  assert.equal(labStatus('hba1c', 9.5), 'bad');
});

test('rows keep the last 3 results, oldest first, with change and improvement', () => {
  const rows = labRows(p);
  assert.deepEqual(rows.map((r) => r.kind), ['hba1c', 'vitd', 'ferritin', 'lipids']);
  const a1c = rows[0];
  assert.deepEqual(a1c.shown.map((x) => x.value), [6.9, 6.4, 6.1]);
  assert.equal(a1c.change, -12);
  assert.equal(a1c.improved, true);
  assert.equal(a1c.status, 'warn');
  assert.equal(rows[1].improved, true); // 14 -> 31, into the range
  assert.equal(rows[2].change, null); // one result
  assert.equal(rows[3].worse, true); // 190 -> 230, out of range
  assert.deepEqual(labSummary(rows), { improved: 2, inRange: 1, follow: 3 });
});

test('tests without a number show when they are due', () => {
  const nv = noValueRows(p, today);
  assert.deepEqual(nv.map((x) => [x.kind, x.due]), [['cbc', true], ['eye', false]]);
});

test('notes are plain sentences from the numbers', () => {
  setLang('ar');
  const notes = labNotes(labRows(p), noValueRows(p, today));
  assert.ok(notes.some((x) => x.includes('نتيجة السكر التراكمي نزلت من ٦٫٩'.replace('٫', '.')) && x.includes('لسه أعلى من المعدل')));
  assert.ok(notes.some((x) => x.includes('فيتامين د') && x.includes('بقت في المعدل')));
  assert.ok(notes.some((x) => x.includes('ميعاد صورة دم ووظائف كبد جه')));
});

test('the Arabic page: header, tiles, table, sections, no signature lines', () => {
  setLang('ar');
  const html = labReportHTML(p, today);
  assert.match(html, /dir="rtl"/);
  assert.match(html, /تقرير مقارنة التحاليل/);
  assert.match(html, /YALLA WELL/);
  assert.match(html, /@page\{size:A4/);
  assert.match(html, /اتحسنت من أول نتيجة/);
  assert.match(html, /آخر ٣ نتايج لكل تحليل/);
  assert.match(html, /المعدلات الطبيعية تقريبية/);
  assert.match(html, /تحاليل من غير رقم/);
  assert.match(html, /ومش تشخيص طبي/);
  assert.match(html, /77\.6 kg/);
  // One result: the two earlier cells are empty.
  const ferr = html.slice(html.indexOf('مخزون الحديد'), html.indexOf('</tr>', html.indexOf('مخزون الحديد')));
  assert.equal((ferr.match(/—/g) ?? []).length, 3);
  assert.doesNotMatch(html, /التوقيع|ملاحظات الدكتور|<polyline/);
  assert.doesNotMatch(html, /fonts\.googleapis/);
});

test('English page is left-to-right', () => {
  setLang('en');
  const html = labReportHTML(p, today);
  assert.match(html, /dir="ltr"/);
  assert.match(html, /Lab results comparison/);
  assert.match(html, /Improved since the first result/);
  assert.match(html, /HbA1c fell from 6\.9 to 6\.1/);
  setLang('ar');
});

test('no labs at all gives a friendly empty page', () => {
  setLang('ar');
  const html = labReportHTML(base, today);
  assert.match(html, /لسه مفيش نتايج تحاليل متسجلة/);
  assert.doesNotMatch(html, /<table/);
  // Old entries that still carry a photo id are just shown as results.
  const old = labReportHTML({ ...base, labs: [{ kind: 'tsh', value: 2.4, date: '2026-10-12', photo: '123' } as never] }, today);
  assert.match(old, /2\.4/);
});
