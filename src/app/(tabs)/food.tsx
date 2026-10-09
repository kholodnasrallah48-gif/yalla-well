import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MacroChips } from '../../components/food.tsx';
import { CaptainCard } from '../../components/match.tsx';
import { TourTarget } from '../../components/TourTarget.tsx';
import { foodLine } from '../../lib/captain.ts';
import { MealIdea } from '../../components/MealIdea.tsx';
import { RecipeFinder } from '../../components/RecipeFinder.tsx';
import { Card, CountUp, MacroBar, Num, RADIUS, RoundCheck, Rise, Screen, T, styles } from '../../components/ui.tsx';
import { changePortion, fmt, mealTotals, planned, totals, type LoggedFood } from '../../lib/day.ts';
import { FOODS, MY_FOODS_CAT, itemAlerts, type Food } from '../../lib/foods.ts';
import { L, isEn, tx } from '../../lib/i18n.ts';
import { MEALS, MEAL_NAME, dayPlan, mealBudget, toMeal } from '../../lib/mealplan.ts';
import { portionFor } from '../../lib/recipe-search.ts';
import { genderFor, targets } from '../../lib/plan.ts';
import type { Meal } from '../../lib/recipes-data.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

function IconBtn({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={() => { play(label === '−' ? 'remove' : 'tap'); onPress(); }}
      style={({ pressed }) => [{ width: 32, height: 32, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
      <Text style={{ fontSize: 18, lineHeight: 20, color: c.petrol, fontFamily: fonts.displaySemi }}>{label}</Text>
    </Pressable>
  );
}

// A food's portion for display; online foods carry a computed "<grams> جم" unit.
const showU = (u: string) => (isEn() ? tx(u).replace(/(\d) جم$/, '$1 g') : u);

/** Today's food by meal: the day's totals, then each meal with what was logged in it, a tick when it's done,
 * an add button, and a suggestion that opens only when asked for. */
export default function FoodScreen() {
  const c = useColors();
  const { profile, day, today, custom, updateDay } = useStore();
  const [ideas, setIdeas] = useState<Meal | null>(null);
  const all = useMemo(() => [...FOODS, ...custom.map((f) => ({ ...f, cat: MY_FOODS_CAT }))], [custom]);
  const byId = useMemo(() => new Map(all.map((f) => [f.id, f])), [all]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  // Logged in meals not ticked yet: shown, but not counted until the meal is ticked.
  const waiting = planned(day).kcal - t.kcal;
  const ticked = day.meals ?? [];
  const started = MEALS.filter((m) => day.foods.some((x) => x.meal === m));
  const plan = dayPlan(profile, today, day.shuffle, day.foods.map((x) => x.ref), t.kcal + waiting, ticked, started);
  const loose = day.foods.filter((x) => !x.meal);
  // What each meal can still take, for the recipe finder's portions.
  const left = T0.kcal - t.kcal - waiting;
  const budgets = Object.fromEntries(MEALS.map((m) => [m, mealBudget(profile, plan, m, mealTotals(day, m).kcal, left)])) as Record<Meal, number>;
  const nextMeal = MEALS.find((m) => !ticked.includes(m)) ?? 'snack';

  const tick = (meal: Meal) => {
    const on = ticked.includes(meal);
    play(on ? 'remove' : ticked.length === MEALS.length - 1 ? 'win' : 'check');
    updateDay((d) => ({ ...d, meals: on ? (d.meals ?? []).filter((m) => m !== meal) : [...(d.meals ?? []), meal] }));
  };

  const foodRow = (f: LoggedFood, last: boolean) => {
    const i = day.foods.indexOf(f);
    const src = byId.get(f.ref);
    const food: Food = { id: f.ref, cat: '', n: f.n, u: f.u, kcal: f.kcal, p: f.p, c: f.c, f: f.f, gi: f.gi ?? src?.gi, tags: f.tags ?? src?.tags };
    const alerts = itemAlerts(profile, food, f.q, totals({ ...day, foods: day.foods.slice(0, i) }), T0);
    return (
      <View key={f.ref + (f.meal ?? '')} style={{ gap: 6, paddingVertical: 8, borderBottomWidth: last ? 0 : 1, borderColor: c.line }}>
        <View style={[styles.row, { gap: 8 }]}>
          <View style={{ flex: 1 }}>
            <T kind="body" style={{ fontFamily: fonts.bodyMedium, fontSize: 14 }}>{tx(f.n)}</T>
            <T kind="small">{L(`${f.u} · ${fmt(f.kcal * f.q)} سعرة`, `${showU(f.u)} · ${fmt(f.kcal * f.q)} kcal`)}</T>
          </View>
          <IconBtn label="−" a11y={L('أقل', 'Less')} onPress={() => updateDay((d) => changePortion(d, i, -0.5))} />
          <Num size={20} style={{ minWidth: 26, textAlign: 'center' }}>{String(f.q)}</Num>
          <IconBtn label="+" a11y={L('أكتر', 'More')} onPress={() => updateDay((d) => changePortion(d, i, 0.5))} />
        </View>
        <MacroChips p={f.p * f.q} c={f.c * f.q} f={f.f * f.q} />
        {alerts.map((a, k) => (
          <View key={k} accessibilityRole="alert" style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: c.badBg, borderRadius: RADIUS, paddingHorizontal: 10, paddingVertical: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: a.level === 'bad' ? 2 : 4, backgroundColor: a.level === 'bad' ? c.bad : c.warn, marginTop: 6 }} />
            <T kind="small" color={c.bad} style={[{ flex: 1 }, a.level === 'bad' ? { fontFamily: fonts.bodyMedium } : null]}>{a.text}</T>
          </View>
        ))}
      </View>
    );
  };

  // The captain talks about the next meal with nothing logged yet, or reminds to tick a meal that has food in it.
  const empty = MEALS.find((m) => !ticked.includes(m) && !day.foods.some((x) => x.meal === m));
  const pending = MEALS.find((m) => !ticked.includes(m) && day.foods.some((x) => x.meal === m));
  const nextEntry = empty ? plan.find((e) => e.meal === empty) : undefined;
  const idea = nextEntry?.recipe ? { name: tx(nextEntry.recipe.n), kcal: nextEntry.recipe.kcal * Math.min(nextEntry.portion, portionFor(nextEntry.recipe.kcal, nextEntry.budget, 1).factor) } : null;
  const say = foodLine({ g, left, budget: empty ? budgets[empty] : 0, meal: empty ? L(toMeal(empty), tx(MEAL_NAME[empty]).toLowerCase()) : null, idea,
    pending: pending ? L(MEAL_NAME[pending], tx(MEAL_NAME[pending]).toLowerCase()) : null });
  const over = t.kcal > T0.kcal;

  return (
    <Screen title={L('الأكل', 'Food')} name="food">
      <TourTarget id="food.score" style={{ gap: 14 }}>
        <Rise>
          <CaptainCard pose="eat" height={112}>
            <T kind="body" style={{ fontSize: 14, lineHeight: 22, marginTop: 2 }}>{say}</T>
            {idea ? (
              <Pressable onPress={() => { play('swoosh'); setIdeas(ideas === empty ? null : empty ?? null); }} accessibilityRole="button" hitSlop={8} style={{ alignSelf: 'flex-start', minHeight: 30, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 13, color: c.petrol }}>{ideas === empty ? L('اخفي الوصفة', 'Hide recipe') : L('وريني الوصفة', 'Show me the recipe')}</Text>
              </Pressable>
            ) : null}
          </CaptainCard>
        </Rise>
        <Rise i={1}>
          <View style={[styles.row, { gap: 6, alignItems: 'flex-end' }]}>
            <CountUp value={t.kcal} format={fmt} size={64} weight="black" color={over ? c.bad : c.ink} style={{ lineHeight: 62 }} />
            <Num size={26} color={c.dim} style={{ paddingBottom: 6 }}>/ {fmt(T0.kcal)}</Num>
            <View style={{ flex: 1 }} />
            <View style={{ marginBottom: 8, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 3, backgroundColor: over ? c.bad : c.petrol }}>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 13, lineHeight: 18, color: over ? '#FFFFFF' : c.onPetrol }}>
                {over ? L(`زيادة ${fmt(t.kcal - T0.kcal)}`, `${fmt(t.kcal - T0.kcal)} over`) : L(`فاضل ${fmt(T0.kcal - t.kcal)}`, `${fmt(T0.kcal - t.kcal)} left`)}
              </Text>
            </View>
          </View>
          <MacroBar label={L('بروتين', 'Protein')} value={t.p} target={T0.protein} />
          <MacroBar label={L('كارب', 'Carbs')} value={t.c} target={T0.carbs} />
          <MacroBar label={L('دهون', 'Fat')} value={t.f} target={T0.fat} />
          {waiting > 0 ? <T kind="small" color={c.warn} style={{ marginTop: 6 }}>{L(`+ ${fmt(waiting)} سعرة في وجبات لسه ${g('معلمتش', 'معلمتيش')} عليها. بتتحسب لما ${g('تعلّم', 'تعلّمي')} إنك ${g('خلصتها', 'خلصتيها')}.`, `+ ${fmt(waiting)} kcal in meals not ticked yet. They count once you tick the meal as done.`)}</T> : null}
        </Rise>
      </TourTarget>

      <Rise i={2} style={{ borderTopWidth: 1, borderColor: c.line }}>
        {MEALS.map((meal, mi) => {
          const foods = day.foods.filter((x) => x.meal === meal);
          const done = ticked.includes(meal);
          const sum = mealTotals(day, meal);
          const entry = plan.find((e) => e.meal === meal)!;
          const r = entry.recipe;
          const canSuggest = !done && !foods.length && !!r;
          const showIdea = ideas === meal && canSuggest;
          const names = foods.map((f) => tx(f.n)).join(L('، ', ', '));
          const row = (
            <View style={{ paddingVertical: 8, borderBottomWidth: 1, borderColor: c.line, gap: 6 }}>
              <View style={[styles.row, { gap: 12, minHeight: 48 }]}>
                <RoundCheck on={done} dashed={!foods.length} onPress={() => tick(meal)} label={L(`${g('خلصت', 'خلصتي')} ${MEAL_NAME[meal]}`, `Finished ${tx(MEAL_NAME[meal])}`)} />
                <View style={{ flex: 1 }}>
                  <T kind="h2" style={{ fontSize: 19, lineHeight: 28 }}>{tx(MEAL_NAME[meal])}</T>
                  <T kind="small" numberOfLines={1} color={done ? c.ok : undefined}>
                    {foods.length ? (done ? names : L(`${names} · ${g('علّم', 'علّمي')} لما ${g('تخلص', 'تخلصي')}`, `${names} · tick when done`)) : done ? L('اتعلّمت', 'Ticked') : L('لسه', 'Nothing yet')}
                  </T>
                </View>
                {foods.length ? <Num size={24} color={done ? c.ink : c.dim}>{fmt(sum.kcal)}</Num> : null}
                <Pressable onPress={() => { play('tap'); router.push({ pathname: '/add', params: { meal } }); }} accessibilityRole="button"
                  accessibilityLabel={L(`إضافة أكل ${toMeal(meal)}`, `Add food to ${tx(MEAL_NAME[meal])}`)}
                  style={({ pressed }) => [{ minHeight: 36, minWidth: 36, borderRadius: 3, borderWidth: 1.5, borderColor: c.petrol, paddingHorizontal: foods.length ? 0 : 12, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
                  <Text style={{ fontFamily: fonts.displaySemi, fontSize: foods.length ? 18 : 13, lineHeight: 20, color: c.petrol }}>{foods.length ? '+' : L(`+ ${g('ضيف', 'ضيفي')}`, '+ Add')}</Text>
                </Pressable>
              </View>
              {foods.length ? <View style={{ paddingStart: 36 }}>{foods.map((f, k) => foodRow(f, k === foods.length - 1))}</View> : null}
              {canSuggest ? (
                <Pressable onPress={() => { play('swoosh'); setIdeas(showIdea ? null : meal); }} accessibilityRole="button" accessibilityState={{ expanded: showIdea }} style={{ paddingStart: 36 }}>
                  <T kind="small" color={c.petrol} style={{ fontFamily: fonts.bodyMedium }}>
                    {showIdea ? L('اخفي الاقتراح', 'Hide suggestion') : L(`${g('عايز', 'عايزة')} اقتراح ${toMeal(meal)}؟`, `Want an idea for ${tx(MEAL_NAME[meal])}?`)}
                  </T>
                </Pressable>
              ) : null}
              {showIdea && r ? (
                <MealIdea recipe={r} meal={meal} budget={entry.budget} why={entry.why} g={g}
                  factor={Math.min(entry.portion, portionFor(r.kcal, entry.budget, 1).factor)}
                  onAnother={() => updateDay((d) => ({ ...d, shuffle: { ...d.shuffle, [meal]: (d.shuffle?.[meal] ?? 0) + 1 } }))} />
              ) : null}
            </View>
          );
          return mi === 0 ? <TourTarget key={meal} id="food.meal">{row}</TourTarget> : <View key={meal}>{row}</View>;
        })}
      </Rise>

      {loose.length ? (
        <Card>
          <T kind="h3">{L('أكل من غير وجبة', 'Other food')}</T>
          {loose.map((f, k) => foodRow(f, k === loose.length - 1))}
        </Card>
      ) : null}

      <TourTarget id="food.finder">
        <RecipeFinder budgets={budgets} start={nextMeal} g={g} />
      </TourTarget>
    </Screen>
  );
}
