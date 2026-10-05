// One recipe: photo, what it gives, how much of it fits the calories left for the meal (when opened with a budget),
// ingredients (scaled to that portion), steps, a cooking video, and add it to today's food.
// Ids starting with "mdb_" are online recipes from TheMealDB (English), with a rough calorie estimate on request.
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FoodPhoto } from '../../components/FoodPhoto.tsx';
import { AdviceView, MacroChips, arNum } from '../../components/food.tsx';
import { Bg, Btn, Card, T, styles } from '../../components/ui.tsx';
import { addFood, fmt, planned } from '../../lib/day.ts';
import { foodAdvice, recipeFood } from '../../lib/foods.ts';
import { L, isEn, num, tx } from '../../lib/i18n.ts';
import { MEALS, MEAL_NAME, suitability, toMeal, videoURL } from '../../lib/mealplan.ts';
import { estimateKcal, lookupMealDB, type KcalEstimate, type OnlineRecipe } from '../../lib/online-recipes.ts';
import { genderFor, targets } from '../../lib/plan.ts';
import { portionFor, portionText, scaleLine } from '../../lib/recipe-search.ts';
import { RECIPES, type Meal } from '../../lib/recipes-data.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

type Params = { id: string; budget?: string; meal?: string; max?: string };

const openPage = (url: string, color: string) => WebBrowser.openBrowserAsync(url, {
  presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, controlsColor: color,
}).catch(() => {});

function Header({ label }: { label: string }) {
  const c = useColors();
  return (
    <View style={[styles.rowBetween, { gap: 8 }]}>
      <T kind="label" color={c.petrol} style={{ flexShrink: 1 }}>{label}</T>
      <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
    </View>
  );
}

function Bullets({ items }: { items: string[] }) {
  const c = useColors();
  return items.map((x, i) => (
    <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.lime, marginTop: 9 }} />
      <T kind="body" style={{ flex: 1 }}>{x}</T>
    </View>
  ));
}

function Steps({ items }: { items: string[] }) {
  const c = useColors();
  return items.map((x, i) => (
    <View key={i} style={[styles.row, { gap: 10, alignItems: 'flex-start' }]}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.petrol, alignItems: 'center', justifyContent: 'center' }}>
        <T kind="small" color={c.onPetrol} style={{ fontFamily: fonts.displaySemi }}>{arNum(i + 1)}</T>
      </View>
      <T kind="body" style={{ flex: 1 }}>{x}</T>
    </View>
  ));
}

/** Two-way switch: ingredients for my portion / for the whole serving. */
function Toggle({ on, onChange, a, b }: { on: boolean; onChange: (v: boolean) => void; a: string; b: string }) {
  const c = useColors();
  const pill = (sel: boolean, label: string, v: boolean) => (
    <Pressable key={label} onPress={() => { play('tap'); onChange(v); }} accessibilityRole="radio" accessibilityState={{ selected: sel }}
      style={{ flex: 1, alignItems: 'center', borderRadius: 99, paddingVertical: 6, backgroundColor: sel ? c.petrol : 'transparent' }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: sel ? c.onPetrol : c.ink }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.row, { gap: 4, padding: 3, borderRadius: 99, borderWidth: 1, borderColor: c.line, backgroundColor: c.soft }]}>
      {pill(on, a, true)}{pill(!on, b, false)}
    </View>
  );
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<Params>();
  return id?.startsWith('mdb_') ? <OnlineRecipeScreen /> : <LocalRecipeScreen />;
}

function LocalRecipeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id, budget: b, meal: m, max: mx } = useLocalSearchParams<Params>();
  const { profile, day, updateDay } = useStore();
  const [mine, setMine] = useState(true);
  const r = RECIPES.find((x) => x.id === id);
  if (!profile || !r) return null;
  const g = genderFor(profile.sex);
  const food = recipeFood(r);
  const adv = foodAdvice(profile, food, targets(profile).kcal - planned(day).kcal);
  const meal: Meal = MEALS.includes(m as Meal) ? (m as Meal) : r.meal;
  const added = day.foods.some((x) => x.ref === food.id && x.meal === meal);
  // Opened with the calories left for a meal: how much of the dish fits them.
  const budget = b != null && b !== '' && isFinite(+b) ? +b : null;
  const pt = budget != null ? portionFor(r.kcal, budget, +(mx ?? '') > 0 ? +(mx as string) : 1.5) : null;
  const factor = pt && budget! >= 80 ? pt.factor : 1;
  const scaled = factor !== 1 && mine;
  const lines = r.ingredients.map((x) => (scaled ? scaleLine(tx(x), factor, isEn()) : tx(x)));

  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <Header label={`${tx(MEAL_NAME[r.meal])} · ${arNum(r.mins)} ${L('دقيقة', 'min')}`} />
      <FoodPhoto item={{ id: r.id, n: r.n }} size={140} height={190} radius={20} style={{ width: '100%' }} />
      <T kind="h1">{tx(r.n)}</T>
      <Card>
        <View style={styles.rowBetween}>
          <T kind="big">{fmt(r.kcal)}</T>
          <T kind="small" style={{ flexShrink: 1 }}>{L('سعرة', 'kcal')} · {tx(r.serving)}</T>
        </View>
        <MacroChips p={r.p} c={r.c} f={r.f} />
        {suitability(profile, r).why.map((w) => <T key={w} kind="small" color={c.ok}>✓ {w}</T>)}
      </Card>
      {pt && budget != null ? (
        <Card>
          <T kind="h2">{L('على قد سعراتك', 'Fitted to your calories')}</T>
          {budget < 80 ? (
            <T kind="body" color={c.warn}>{L(`مفضلش سعرات تقريبًا ${toMeal(meal)} النهارده. لو ${g('هتاكلها', 'هتاكليها')} ${g('خد', 'خدي')} حاجة صغيرة، أو خليها لبكرة.`, `There are almost no calories left for ${tx(MEAL_NAME[meal]).toLowerCase()} today. If you have it, keep it very small, or save it for tomorrow.`)}</T>
          ) : (
            <>
              <T kind="body">{L(`${toMeal(meal)} فاضلك حوالي ${fmt(budget)} سعرة، ف${g('كُل', 'كُلي')} `, `You have about ${fmt(budget)} kcal left for ${tx(MEAL_NAME[meal]).toLowerCase()}, so have `)}
                <Text style={{ fontFamily: fonts.displaySemi, color: c.petrol }}>{portionText(pt.factor)}</Text>
                {L(` (≈ ${fmt(pt.kcal)} سعرة).`, ` (≈ ${fmt(pt.kcal)} kcal).`)}</T>
              {pt.tight ? <T kind="small" color={c.warn}>{L(`حتى ربع الطبق أكتر من اللي فاضلك. ${g('اختار', 'اختاري')} أكلة أخف لو ${g('تقدر', 'تقدري')}.`, 'Even a quarter is more than you have left. Pick a lighter dish if you can.')}</T> : null}
              <T kind="small">{L('ده تقدير تقريبي: الكميات مقربة لأقرب ربع.', 'This is approximate: amounts are rounded to the nearest quarter.')}</T>
            </>
          )}
        </Card>
      ) : null}
      {adv.level === 'warn' || adv.level === 'bad' ? <AdviceView advice={adv} female={profile.sex !== 'm'} /> : null}
      <Card>
        <T kind="h2">{L('المكونات', 'Ingredients')}</T>
        {factor !== 1 ? (
          <Toggle on={mine} onChange={setMine} a={L(`نصيبي (${portionText(factor)})`, `My portion (${portionText(factor)})`)} b={L('الطبق كامل', 'Full serving')} />
        ) : null}
        <Bullets items={lines} />
        {scaled ? <T kind="small">{L('الكميات اللي فيها أرقام متظبطة على نصيبك، والتوابل زي ما هي.', 'Amounts with numbers are scaled to your portion; spices stay as they are.')}</T> : null}
      </Card>
      <Card>
        <T kind="h2">{L('الطريقة', 'Steps')}</T>
        <Steps items={r.steps.map((x) => tx(x))} />
      </Card>
      <Btn kind="outline" title={L(g('شوف فيديو الطريقة', 'شوفي فيديو الطريقة'), 'Watch the how-to video')} onPress={() => openPage(videoURL(r), c.petrol)} />
      <Btn disabled={added}
        title={added ? L(`اتضافت ${toMeal(meal)} ✓`, `Added to ${tx(MEAL_NAME[meal])} ✓`)
          : factor !== 1 ? L(`${g('ضيف', 'ضيفي')} ${portionText(factor)} ${toMeal(meal)}`, `Add ${portionText(factor)} to ${tx(MEAL_NAME[meal])}`)
          : L(`${g('ضيفها', 'ضيفيها')} ${toMeal(meal)}`, `Add to ${tx(MEAL_NAME[meal])}`)}
        onPress={() => { updateDay((d) => addFood(d, food, meal, factor)); router.back(); }} />
      <T kind="small">{L(`بتتحسب في سعراتك لما ${g('تعلّم', 'تعلّمي')} إنك ${g('خلصت', 'خلصتي')} الوجبة.`, 'It counts toward your calories once you tick the meal as done.')}</T>
    </ScrollView></Bg>
  );
}

function OnlineRecipeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id, budget: b, meal: m } = useLocalSearchParams<Params>();
  const { profile } = useStore();
  const [r, setR] = useState<OnlineRecipe | null | undefined>(undefined);
  const [est, setEst] = useState<KcalEstimate | null | 'loading' | undefined>(undefined);
  useEffect(() => {
    let live = true;
    setR(undefined);
    lookupMealDB(id).then((x) => { if (live) setR(x); }).catch(() => { if (live) setR(null); });
    return () => { live = false; };
  }, [id]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const meal: Meal | null = MEALS.includes(m as Meal) ? (m as Meal) : null;
  const budget = b != null && b !== '' && isFinite(+b) ? +b : null;
  const estimate = () => {
    if (!r) return;
    setEst('loading');
    estimateKcal(r).then(setEst).catch(() => setEst(null));
  };
  const pct = (x: number) => Math.max(5, Math.round((x * 100) / 5) * 5);

  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <Header label={L('وصفة من النت · TheMealDB', 'Online recipe · TheMealDB')} />
      {r === undefined ? (
        <View style={{ paddingVertical: 40, alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color={c.petrol} />
          <T kind="small">{L('بنجيب الوصفة…', 'Loading the recipe…')}</T>
        </View>
      ) : r === null ? (
        <Card>
          <T kind="h2">{L('مقدرناش نفتح الوصفة', "Couldn't open the recipe")}</T>
          <T kind="body">{L(`غالبًا مفيش نت دلوقتي. ${g('جرب', 'جربي')} تاني بعدين.`, "You're probably offline. Try again later.")}</T>
        </Card>
      ) : (
        <>
          <FoodPhoto item={{ id: r.id, n: r.name, img: r.thumb }} size={140} height={190} radius={20} style={{ width: '100%' }} />
          <T kind="h1">{r.name}</T>
          <T kind="small">{[r.area, r.category].filter(Boolean).join(' · ')}{L(' · المكونات والطريقة بالإنجليزي زي ما هي في المصدر', ' · ingredients and steps as given by the source')}</T>
          <Card>
            <T kind="h2">{L('السعرات', 'Calories')}</T>
            {est === undefined ? (
              <>
                <T kind="body">{L('السعرات مش معروفة للوصفة دي. نقدر نحسبها تقريبًا من المكونات وكمياتها.', "This recipe's calories aren't known. We can estimate them roughly from the ingredients and amounts.")}</T>
                <Btn kind="outline" title={L('احسب السعرات تقريبًا', 'Estimate the calories')} onPress={estimate} />
              </>
            ) : est === 'loading' ? (
              <View style={[styles.row, { gap: 8 }]}>
                <ActivityIndicator color={c.petrol} />
                <T kind="small">{L('بنحسب كل مكون…', 'Working out each ingredient…')}</T>
              </View>
            ) : est === null ? (
              <T kind="body" color={c.warn}>{L('مقدرناش نحسب السعرات دلوقتي (محتاج نت)، فالسعرات مش معروفة.', "Couldn't estimate the calories right now (needs internet), so they're unknown.")}</T>
            ) : (
              <>
                <T kind="body">{L(`الوصفة كلها ≈ ${fmt(est.total)} سعرة (تقدير تقريبي من ${num(est.counted)} مكون).`, `The whole recipe ≈ ${fmt(est.total)} kcal (a rough estimate from ${est.counted} ingredients).`)}</T>
                {budget != null && budget >= 80 && meal ? (
                  <T kind="body" color={c.petrol} style={{ fontFamily: fonts.bodyMedium }}>
                    {budget >= est.total
                      ? L(`الوصفة كلها في حدود الـ ${fmt(budget)} سعرة الفاضلين ${toMeal(meal)}.`, `The whole recipe fits the ${fmt(budget)} kcal left for ${tx(MEAL_NAME[meal]).toLowerCase()}.`)
                      : L(`نصيبك ${toMeal(meal)} (≈ ${fmt(budget)} سعرة) حوالي ${num(pct(budget / est.total))}٪ من الكمية كلها.`, `Your share for ${tx(MEAL_NAME[meal]).toLowerCase()} (≈ ${fmt(budget)} kcal) is about ${pct(budget / est.total)}% of the whole recipe.`)}
                  </T>
                ) : null}
                {est.missing.length ? <T kind="small" color={c.warn}>{L(`مش محسوب: ${est.missing.join('، ')}، فالرقم الحقيقي أعلى شوية.`, `Not counted: ${est.missing.join(', ')}, so the real number is a bit higher.`)}</T> : null}
                <T kind="small">{L(`عشان ${g('تسجلها', 'تسجليها')}، ${g('ضيفها', 'ضيفيها')} كأكلة خاصة بالسعرات دي.`, 'To log it, add it as your own food with these calories.')}</T>
              </>
            )}
          </Card>
          <Card>
            <T kind="h2">{L('المكونات (بالإنجليزي)', 'Ingredients')}</T>
            <Bullets items={r.ingredients.map((x) => (x.measure ? `${x.measure} ${x.name}` : x.name))} />
          </Card>
          <Card>
            <T kind="h2">{L('الطريقة (بالإنجليزي)', 'Steps')}</T>
            {r.steps.length ? <Steps items={r.steps} /> : <T kind="small">{L('مفيش خطوات مكتوبة للوصفة دي.', 'No written steps for this recipe.')}</T>}
          </Card>
          {r.youtube ? <Btn kind="outline" title={L(g('شوف فيديو الطريقة', 'شوفي فيديو الطريقة'), 'Watch the how-to video')} onPress={() => openPage(r.youtube!, c.petrol)} /> : null}
        </>
      )}
    </ScrollView></Bg>
  );
}
