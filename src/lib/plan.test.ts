/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXERCISES, SCHEDULES, SESSIONS } from './data.ts';
import { FOODS, foodAdvice, parseMeal } from './foods.ts';
import { fromOFF } from './barcode.ts';
import { fromOFFHit, fromUSDA, toEnglish, toFood } from './online.ts';
import { addFood, blankDay, changePortion, totals, weekIndex } from './day.ts';
import { medical, sessionFor, targets, type Profile } from './plan.ts';
import { PHASES, programWeek, suggestWeight } from './progress.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 28, height: 165, weight: 70, activity: 'low', goal: 'lose',
  schedule: '5mix', level: 'beg', conditions: [], meds: [], pains: [],
};

test('every exercise alternative and session exercise exists', () => {
  for (const [id, e] of Object.entries(EXERCISES)) if (e.alt) assert.ok(EXERCISES[e.alt], `${id} → ${e.alt}`);
  for (const [id, s] of Object.entries(SESSIONS)) for (const ex of [...s.ex, ...(s.exB ?? [])]) assert.ok(EXERCISES[ex], `${id}: ${ex}`);
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
  const s = sessionFor({ ...base, pains: ['knee'] }, 5, false)!; // Thursday: legs
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
  const bread = FOODS.find((f) => f.n === 'عيش بلدي')!;
  assert.equal(foodAdvice({ ...base, conditions: ['celiac'] }, bread, 2000).level, 'bad');
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

test('program week counts whole weeks from the start date', () => {
  assert.equal(programWeek('2026-10-03', new Date(2026, 9, 9)), 0);
  assert.equal(programWeek('2026-10-03', new Date(2026, 9, 10)), 1);
  assert.equal(programWeek(undefined, new Date()), 0);
});

test('weight goes up only after every set hit the top reps; deload week is lighter', () => {
  const last = { date: '2026-10-01', w: 40, reps: [12, 12, 12], top: 12 };
  assert.equal(suggestWeight('g_legpress', last, PHASES[1]), 42.5);
  assert.equal(suggestWeight('g_lateral', { ...last, w: 5 }, PHASES[1]), 6);
  assert.equal(suggestWeight('g_legpress', { ...last, reps: [12, 10, 9] }, PHASES[0]), 40);
  assert.equal(suggestWeight('g_legpress', { ...last, reps: [10] }, PHASES[3]), 32);
});

test('3-day plan is push / pull / legs and odd weeks swap machines', () => {
  const p3 = { ...base, schedule: '3' as const };
  assert.equal(sessionFor(p3, 0, false, 0)!.id, 'push');
  assert.equal(sessionFor(p3, 2, false, 0)!.id, 'pull');
  assert.equal(sessionFor(p3, 4, false, 0)!.id, 'legs');
  const a = sessionFor(p3, 0, false, 0)!.items.map((x) => x.id);
  const b = sessionFor(p3, 0, false, 1)!.items.map((x) => x.id);
  assert.notDeepEqual(a, b);
  assert.equal(sessionFor(p3, 0, false, 2)!.items[0].sets, sessionFor(p3, 0, false, 0)!.items[0].sets + 1);
});


test('soda is flagged for autoimmune conditions with healthier swaps', () => {
  const soda = FOODS.find((f) => f.tags?.includes('soda'))!;
  const a = foodAdvice({ ...base, conditions: ['ms'] }, soda, 2000);
  assert.equal(a.level, 'bad');
  assert.ok(a.notes.some((n) => n.text.includes('الالتهاب')));
  assert.ok(a.swaps.length > 0);
  assert.ok(a.swaps.every((s) => !s.tags?.includes('soda') && !s.tags?.includes('sugary')));
});

test('insulin resistance warns on high-GI foods and praises low-GI ones', () => {
  const p = { ...base, conditions: ['ir'] };
  const high = FOODS.find((f) => f.gi === 'high' && !f.tags?.includes('soda'))!;
  const low = FOODS.find((f) => f.gi === 'low' && f.c > 5)!;
  assert.equal(foodAdvice(p, high, 2000).level, 'bad');
  assert.equal(foodAdvice(p, low, 2000).notes.some((n) => n.level === 'good'), true);
});

test('going over the calorie budget is a warning', () => {
  const f = FOODS.find((x) => x.kcal > 300)!;
  assert.ok(foodAdvice(base, f, 100).notes.some((n) => n.text.includes('هتعدي')));
});

test('free-text meals are split into foods with quantities', () => {
  const r = parseMeal('٢ بيض وعيش بلدي وجبنة قريش');
  assert.deepEqual(r.unknown, []);
  assert.equal(r.items.length, 3);
  assert.ok(r.items[0].food.n.includes('بيض'));
  assert.equal(r.items[0].q, 2);
  assert.equal(r.items[1].food.n, 'عيش بلدي');
  assert.ok(r.items[2].food.n.includes('قريش'));
  const r2 = parseMeal('نص رغيف عيش بلدي، كوباية شاي بلبن، وطبق كشري');
  assert.equal(r2.items[0].q, 0.5);
  assert.ok(r2.items.some((x) => x.food.n.includes('كشري')));
  assert.ok(r2.items.some((x) => x.food.n.includes('شاي')));
  assert.equal(parseMeal('حاجة غريبة خالص').items.length, 0);
  assert.equal(parseMeal('بيبسي و٢ بيض').items[1].q, 2);
});

test('barcode products map to one serving with health tags', () => {
  const f = fromOFF('1', { product_name: 'Cola', serving_quantity: 330, categories_tags: ['en:sodas'], nova_group: 4,
    nutriments: { 'energy-kcal_100g': 42, 'sugars_100g': 10.6, 'carbohydrates_100g': 10.6 } })!;
  assert.equal(f.kcal, 139);
  assert.ok(f.tags?.includes('soda') && f.tags.includes('processed'));
});

test('parser keeps similar words apart and reads grams', () => {
  const r = parseMeal('زيتون مخلل\nتوست حبوب كاملة');
  assert.deepEqual(r.items.map((x) => x.food.n), ['زيتون مخلل', 'توست حبوب كاملة']);
  assert.equal(parseMeal('زيت زيتون').items[0].food.n, 'زيت زيتون');
  const g = parseMeal('٢٠٠ جم فول مدمس');
  assert.equal(g.items[0].food.n, 'فول مدمس');
  assert.equal(g.items[0].q, 1);
  assert.equal(parseMeal('١٠٠جم فول مدمس').items[0].q, 0.5);
  const u = parseMeal('٢ بيض و١٥٠ جرام كيمتشي كوري');
  assert.equal(u.items[0].q, 2);
  assert.deepEqual(u.unknown, [{ text: 'كيمتشي كوري', q: 1, grams: 150 }]);
});

test('online lookup: Arabic to English and nutrient mapping', () => {
  assert.equal(toEnglish('زيتون مخلل'), 'olives pickled');
  assert.equal(toEnglish('صدور فراخ مشوية'), 'breast chicken grilled');
  assert.equal(toEnglish('حاجة غريبة'), null);
  const o = fromUSDA({
    fdcId: 169094, description: 'Olives, pickled, canned or bottled, green', dataType: 'SR Legacy',
    foodNutrients: [
      { nutrientId: 1008, nutrientNumber: '208', nutrientName: 'Energy', unitName: 'KCAL', value: 145 },
      { nutrientId: 1003, nutrientNumber: '203', nutrientName: 'Protein', unitName: 'G', value: 1.03 },
      { nutrientId: 1004, nutrientNumber: '204', nutrientName: 'Total lipid (fat)', unitName: 'G', value: 15.3 },
      { nutrientId: 1005, nutrientNumber: '205', nutrientName: 'Carbohydrate, by difference', unitName: 'G', value: 3.84 },
      { nutrientId: 1093, nutrientNumber: '307', nutrientName: 'Sodium, Na', unitName: 'MG', value: 1556 },
    ],
  });
  assert.ok(o);
  assert.deepEqual(o!.tags, ['canned', 'salty']);
  const f = toFood(o!, 40, 'زيتون مخلل');
  assert.equal(f.kcal, 58);
  assert.equal(f.u, '40 جم');
  assert.equal(f.f, 6.1);
  const off = fromOFFHit({ code: '622', product_name: 'Chipsy', brands: 'PepsiCo', nova_group: 4, nutriments: { 'energy-kcal_100g': 536, proteins_100g: 6, carbohydrates_100g: 53, fat_100g: 33 } });
  assert.equal(off?.name, 'Chipsy (PepsiCo)');
  assert.deepEqual(off?.tags, ['processed']);
});
