/// <reference types="node" />
// Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { EXERCISES, SCHEDULES, SESSIONS } from './data.ts';
import { FOODS, byUse, findSwaps, foodAdvice, itemAlerts, oftenFoods, parseMeal } from './foods.ts';
import { dayPlan, mealOptions, suitability } from './mealplan.ts';
import { reportHTML, weekReport, weekStart } from './report.ts';
import { fromOFF } from './barcode.ts';
import { fromOFFHit, fromUSDA, toEnglish, toFood } from './online.ts';
import { addFood, blankDay, changePortion, dayKey, totals, weekIndex, type DayLog } from './day.ts';
import { medical, sessionFor, targets, weekSessions, type Profile } from './plan.ts';
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

test('Open Food Facts fast-search shapes (arrays, language maps) map safely', () => {
  const o = fromOFFHit({ code: 622, product_name: { ar: 'شيبسي', en: 'Chipsy' }, brands: ['Chipsy', 'PepsiCo'], nutriments: { 'energy-kcal_100g': 536 } });
  assert.equal(o?.name, 'شيبسي (Chipsy)');
  assert.equal(fromOFFHit({ code: '1', product_name: 5 as unknown as string, nutriments: { 'energy-kcal_100g': 1 } }), null);
});

test('weekly report counts wins and misses from saved days', () => {
  const p: Profile = { ...base, schedule: '3', start: '2026-09-01' };
  const today = new Date(2026, 9, 1); // Thursday 1 Oct 2026
  const start = weekStart(today);
  assert.equal(dayKey(start), '2026-09-26'); // Saturday
  const pepsi = FOODS.find((f) => f.n === 'بيبسي')!;
  const chicken = FOODS.find((f) => f.p >= 25)!;
  const T = targets(p);
  const logs: Record<string, DayLog | null> = {
    '2026-09-26': { ...blankDay(), foods: [{ ref: chicken.id, n: chicken.n, u: chicken.u, kcal: T.kcal, p: T.protein, c: 0, f: 10, q: 1 }], water: T.waterCups, done: sessionFor(p, 0, false, 3)!.items.map((x) => x.id) },
    '2026-09-27': { ...blankDay(), foods: [{ ref: pepsi.id, n: pepsi.n, u: pepsi.u, kcal: T.kcal * 1.5, p: 10, c: 200, f: T.fat + 20, q: 1 }] },
  };
  const r = weekReport({ ...p, conditions: ['ms'] }, start, logs, today);
  assert.equal(r.days.filter((d) => d.future).length, 1);
  assert.ok(r.wins.some((w) => w.includes('حدود السعرات')));
  assert.ok(r.misses.some((m) => m.includes('عديتي السعرات')));
  assert.ok(r.misses.some((m) => m.includes('بيبسي')));
  assert.ok(r.misses.some((m) => m.includes('مسجلتيش أكل ٤ أيام')));
  assert.match(reportHTML(p, r), /تقرير الأسبوع/);
});

test('logged items warn in red when they cross the fat limit or are salty', () => {
  const T = targets(base);
  const f = { ...FOODS[0], f: 30, tags: ['salty' as const] };
  const a = itemAlerts(base, f, 1, { kcal: 500, p: 20, c: 50, f: T.fat - 10 }, T);
  assert.equal(a[0].level, 'bad');
  assert.ok(a[0].text.includes('الدهون'));
  assert.ok(a.some((x) => x.text.includes('ملح')));
});

test('swaps stay in the same craving and suit the person', () => {
  const p: Profile = { ...base, conditions: ['celiac'] };
  const chips = findSwaps(p, { id: 'x', cat: 'أكلاتي', n: 'Pringles Paprika', u: '30 g', kcal: 157, p: 2, c: 15, f: 10, tags: ['processed'] });
  assert.ok(chips.length >= 2);
  assert.ok(chips.every((x) => !/فراخ|سمك|لحم/.test(x.n)), chips.map((x) => x.n).join());
  const pastry = findSwaps(p, FOODS.find((f) => f.n === 'فطير مشلتت')!);
  assert.ok(pastry.every((x) => !(x.tags ?? []).includes('gluten')));
  assert.notDeepEqual(chips.map((x) => x.n), pastry.map((x) => x.n));
});

test('meal plan fits conditions, ranks by them, follows calories left and shuffles', () => {
  const p: Profile = { ...base, conditions: ['celiac', 'ir'] };
  const a = dayPlan(p, '2026-10-02');
  for (const e of a) assert.ok(e.recipe && !(e.recipe.avoid ?? []).some((x) => p.conditions.includes(x)), e.meal);
  const lunch = (x: ReturnType<typeof dayPlan>) => x.find((e) => e.meal === 'lunch')!;
  assert.notEqual(lunch(dayPlan(p, '2026-10-02', { lunch: 1 })).recipe!.id, lunch(a).recipe!.id);
  // MS: lunches with omega-3 come before red meat.
  const ms: Profile = { ...base, conditions: ['ms'] };
  const opts = mealOptions(ms, 'lunch');
  const firstRed = opts.findIndex((r) => r.tags.includes('redmeat'));
  const firstOmega = opts.findIndex((r) => r.tags.includes('omega3'));
  assert.ok(firstOmega >= 0 && (firstRed < 0 || firstOmega < firstRed));
  assert.ok(suitability(ms, opts[firstOmega]).why[0].includes('أوميجا'));
  // Eating a suggested breakfast marks it eaten; eating a lot shrinks the rest.
  const bf = a.find((e) => e.meal === 'breakfast')!.recipe!;
  const after = dayPlan(p, '2026-10-02', {}, ['r_' + bf.id], 1100);
  assert.ok(after.find((e) => e.meal === 'breakfast')!.eaten);
  const total = targets(p).kcal;
  assert.ok(after.filter((e) => !e.eaten).reduce((s, e) => s + e.budget, 0) <= total - 1100 + 1);
});

test('ticked meals hand the calories left to the meals not ticked yet', () => {
  // 733 eaten of the target, breakfast and lunch ticked: snack and dinner share the rest, whatever the hour.
  const p: Profile = { ...base, conditions: ['hashimoto'] };
  const total = targets(p).kcal;
  const x = dayPlan(p, '2026-10-02', {}, [], total - 557, ['breakfast', 'lunch']);
  const get = (m: string) => x.find((e) => e.meal === m)!;
  assert.ok(get('breakfast').eaten && get('lunch').eaten);
  assert.ok(get('dinner').recipe && !get('dinner').eaten, 'dinner');
  assert.ok(get('snack').recipe && !get('snack').eaten, 'snack');
  assert.ok(Math.abs(get('dinner').budget + get('snack').budget - 557) <= 2);
  // Nothing ticked: every meal still gets a dish, a part of it when even the lightest is too much.
  const none = dayPlan(p, '2026-10-02', {}, [], total - 557);
  assert.ok(none.every((e) => e.recipe && !e.eaten));
  assert.ok(none.some((e) => e.portion < 1));
});

test('food menu puts the usual foods first', () => {
  const [a, b, c] = FOODS;
  const use = { [c.id]: 5, [b.id]: 2, [a.id]: 1 };
  assert.deepEqual(oftenFoods([a, b, c], use).map((f) => f.id), [c.id, b.id]);
  assert.deepEqual(byUse([a, b, c], use).map((f) => f.id), [c.id, b.id, a.id]);
  assert.deepEqual(byUse([a, b, c], {}).map((f) => f.id), [a.id, b.id, c.id]);
});

test('picking gym, home or rest per day changes that day and keeps the week balanced', () => {
  const p: Profile = { ...base, schedule: '5mix' };
  assert.deepEqual(weekSessions(p), ['push', 'homeA', 'pull', null, 'homeB', 'legs', null]);
  // Sunday to gym, Thursday home, Friday home.
  const q: Profile = { ...p, places: { 1: 'gym', 5: 'home', 6: 'home' } };
  assert.deepEqual(weekSessions(q), ['push', 'pull', 'legs', null, 'homeA', 'homeB', 'homeA']);
  assert.equal(sessionFor(q, 1, false)!.place, 'gym');
  assert.equal(sessionFor({ ...p, places: { 0: 'rest' } }, 0, false), null);
});
