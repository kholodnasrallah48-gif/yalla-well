/// <reference types="node" />
// Recipe search, portion fitting, online recipes and photo lookup helpers. Run with: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { barcodeOf, cleanTitle, titlesFor, RECIPE_TITLES } from './food-images.ts';
import { FOODS } from './foods.ts';
import { dayPlan, mealBudget } from './mealplan.ts';
import { dishQuery, estimateKcal, fromMealDB, measureGrams, rankMeals, splitSteps, type OnlineRecipe } from './online-recipes.ts';
import { targets, type Profile } from './plan.ts';
import { portionFor, portionText, scaleLine, searchRecipes } from './recipe-search.ts';
import { RECIPES } from './recipes-data.ts';

const base: Profile = {
  name: 'تجربة', sex: 'f', age: 28, height: 165, weight: 70, activity: 'low', goal: 'lose',
  schedule: '5mix', level: 'beg', conditions: [], meds: [], pains: [],
};

test('portionFor rounds to quarters within the budget, capped', () => {
  assert.deepEqual(portionFor(400, 400), { factor: 1, kcal: 400, tight: false });
  assert.equal(portionFor(400, 300).factor, 0.75);
  assert.equal(portionFor(400, 200).factor, 0.5);
  assert.equal(portionFor(400, 360).factor, 1); // within ~10% counts as the full serving
  assert.equal(portionFor(200, 600).factor, 1.5); // never more than the cap
  assert.equal(portionFor(200, 600, 1).factor, 1);
  const tiny = portionFor(500, 50);
  assert.equal(tiny.factor, 0.25);
  assert.equal(tiny.tight, true);
  assert.equal(portionFor(500, -100).factor, 0.25);
  assert.equal(portionFor(0, 300).factor, 1);
  assert.equal(portionFor(400, 300).kcal, 300);
});

test('portionText names the share in Egyptian Arabic', () => {
  assert.equal(portionText(0.75), 'تلات تربع الطبق');
  assert.equal(portionText(0.5), 'نص الطبق');
  assert.equal(portionText(1.5), 'طبق ونص');
});

test('scaleLine scales the leading quantity only', () => {
  assert.equal(scaleLine('٢٠٠ جم فول مدمس', 0.75), '١٥٠ جم فول مدمس');
  assert.equal(scaleLine('٢ بيضة', 0.75), '١ ونص بيضة');
  assert.equal(scaleLine('نص بصلة خضرا مفرومة', 0.5), 'ربع بصلة خضرا مفرومة');
  assert.equal(scaleLine('كمون وملح خفيف', 0.5), 'كمون وملح خفيف');
  assert.equal(scaleLine('١ رغيف عيش بلدي سن صغير (٧٠ جم)', 0.5), 'نص رغيف عيش بلدي سن صغير (٧٠ جم)');
  assert.equal(scaleLine('200 g ful medames', 0.75, true), '150 g ful medames');
  assert.equal(scaleLine('1/2 green onion, chopped', 1.5, true), '¾ green onion, chopped');
  assert.equal(scaleLine('2 eggs', 1.25, true), '2½ eggs');
  assert.equal(scaleLine('2-3 cloves garlic', 0.5, true), '2-3 cloves garlic');
  assert.equal(scaleLine('٢ بيضة', 1), '٢ بيضة');
});

test('searchRecipes finds dishes by Arabic or English name', () => {
  const ids = (q: string) => searchRecipes(q).map((x) => x.r.id);
  assert.equal(ids('كشري')[0], 'l_koshary_healthy');
  assert.equal(ids('طريقة عمل الشكشوكة')[0], 'b_shakshuka');
  assert.equal(ids('ملوخية')[0], 'l_molokhia_chicken');
  assert.ok(ids('فراخ مشوية').slice(0, 3).includes('l_chicken_lemon_garlic'));
  assert.ok(ids('فراخ').length >= 3);
  assert.equal(ids('shakshuka')[0], 'b_shakshuka');
  assert.ok(ids('عدس').includes('d_lentil_soup'));
  assert.deepEqual(ids('بيتزا'), []);
  assert.deepEqual(ids(''), []);
});

test('mealBudget: the plan share while open, the share minus what is in it once started', () => {
  const T = targets(base).kcal;
  const plan = dayPlan(base, '2026-10-02');
  const lunch = plan.find((e) => e.meal === 'lunch')!;
  assert.equal(mealBudget(base, plan, 'lunch', 0, T), lunch.budget);
  const started = dayPlan(base, '2026-10-02', {}, [], 200, [], ['lunch']);
  assert.equal(mealBudget(base, started, 'lunch', 200, T - 200), Math.round(T * 0.35 - 200));
  assert.equal(mealBudget(base, started, 'lunch', 200, 50), 50);
  assert.equal(mealBudget(base, started, 'lunch', 5000, 0), 0);
});

test('TheMealDB meals become recipes with steps', () => {
  const m = fromMealDB({
    idMeal: '52772', strMeal: 'Teriyaki Chicken Casserole', strCategory: 'Chicken', strArea: 'Japanese', strMealThumb: 'https://x/y.jpg',
    strInstructions: 'STEP 1\r\nPreheat oven to 350.\r\n\r\nSTEP 2\r\nCombine soy sauce.\r\n3. Bake 15 minutes.',
    strIngredient1: 'soy sauce', strMeasure1: '3/4 cup', strIngredient2: '', strMeasure2: '', strIngredient3: 'water', strMeasure3: '1/2 cup',
  })!;
  assert.equal(m.id, 'mdb_52772');
  assert.deepEqual(m.ingredients, [{ name: 'soy sauce', measure: '3/4 cup' }, { name: 'water', measure: '1/2 cup' }]);
  assert.deepEqual(m.steps, ['Preheat oven to 350.', 'Combine soy sauce.', 'Bake 15 minutes.']);
  assert.equal(fromMealDB({ idMeal: '1', strMeal: '' }), null);
  assert.ok(splitSteps('A'.repeat(120) + '. Then do this. ' + 'B'.repeat(120) + '.').length >= 2);
});

test('dishQuery translates dish names for TheMealDB', () => {
  assert.equal(dishQuery('كشري'), 'koshari');
  assert.equal(dishQuery('مسقعة'), 'moussaka');
  assert.equal(dishQuery('فراخ مشوية'), 'chicken grilled');
  assert.equal(dishQuery('Beef Stew'), 'beef stew');
  assert.equal(dishQuery('زززز'), null);
  const r = (name: string): OnlineRecipe => ({ id: name, name, ingredients: [], steps: [] });
  assert.deepEqual(rankMeals('chicken grilled', [r('Beef Wellington'), r('Chicken Curry'), r('Grilled Chicken')]).map((x) => x.name), ['Grilled Chicken', 'Chicken Curry']);
});

test('measureGrams reads TheMealDB amounts', () => {
  assert.equal(measureGrams('200g', 'rice'), 200);
  assert.equal(measureGrams('1 kg', 'chicken'), 1000);
  assert.equal(measureGrams('2 tbs', 'olive oil'), 30);
  assert.equal(measureGrams('1 1/2 tsp', 'sugar'), 7.5);
  assert.equal(measureGrams('1 cup', 'flour'), 125);
  assert.equal(measureGrams('½ cup', 'milk'), 120);
  assert.equal(measureGrams('2', 'eggs'), 100);
  assert.equal(measureGrams('3 cloves', 'garlic'), 15);
  assert.equal(measureGrams('pinch', 'cinnamon'), 0);
  assert.equal(measureGrams('', 'salt'), 0);
  assert.equal(measureGrams('to taste', 'chilli flakes'), 0);
  assert.equal(measureGrams('', 'mystery'), null);
  assert.equal(measureGrams('3', 'unknown thing'), null);
});

test('estimateKcal adds grams × calories, listing what it could not count', async () => {
  const r: OnlineRecipe = { id: 'mdb_1', name: 'x', steps: [], ingredients: [
    { name: 'rice', measure: '200g' }, { name: 'olive oil', measure: '1 tbsp' }, { name: 'salt', measure: 'pinch' }, { name: 'dragon', measure: '1 handful' }, { name: 'weird', measure: '' },
  ] };
  const table: Record<string, number> = { rice: 130, 'olive oil': 884 };
  const e = await estimateKcal(r, async (n) => table[n] ?? null);
  assert.ok(e);
  assert.equal(e!.total, Math.round(260 + 132.6));
  assert.equal(e!.counted, 3);
  assert.deepEqual(e!.missing.sort(), ['dragon', 'weird']);
  assert.equal(await estimateKcal(r, async () => null), null);
});

test('photo titles: explicit names for Egyptian dishes, cleaned English otherwise', () => {
  for (const r of RECIPES) assert.ok(RECIPE_TITLES[r.id]?.length, `photo title for ${r.id}`);
  assert.deepEqual(titlesFor({ id: 'r_l_koshary_healthy', n: 'x' }).slice(0, 1), ['Koshary']);
  const foul = FOODS.find((f) => f.n === 'فول مدمس')!;
  assert.equal(titlesFor({ id: foul.id, n: foul.n })[0], 'Ful medames');
  const guava = FOODS.find((f) => f.n === 'جوافة')!;
  assert.deepEqual(titlesFor({ id: guava.id, n: guava.n }), ['Guava']);
  assert.equal(cleanTitle('Persimmon (kaka)'), 'Persimmon');
  assert.equal(cleanTitle('Olives, pickled, canned'), 'Olives');
  assert.equal(cleanTitle('Tea with 2 spoons of sugar'), null);
  assert.equal(barcodeOf('bc6221007015114'), '6221007015114');
  assert.equal(barcodeOf('off3017620422003_100'), '3017620422003');
  assert.equal(barcodeOf('usda123'), null);
  assert.equal(barcodeOf('f12'), null);
});
