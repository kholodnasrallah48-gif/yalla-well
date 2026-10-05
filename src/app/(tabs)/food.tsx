import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MacroChips } from '../../components/food.tsx';
import { MealIdea } from '../../components/MealIdea.tsx';
import { Card, MacroBar, Screen, T, styles } from '../../components/ui.tsx';
import { changePortion, fmt, mealTotals, planned, totals, type LoggedFood } from '../../lib/day.ts';
import { FOODS, MY_FOODS_CAT, itemAlerts, type Food } from '../../lib/foods.ts';
import { L, isEn, tx } from '../../lib/i18n.ts';
import { MEALS, MEAL_NAME, dayPlan, toMeal } from '../../lib/mealplan.ts';
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
      style={{ width: 32, height: 32, borderRadius: 9, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 18, lineHeight: 20, color: c.petrol, fontFamily: fonts.display }}>{label}</Text>
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
            <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{tx(f.n)}</T>
            <T kind="small">{L(`${f.u} · ${fmt(f.kcal * f.q)} سعرة`, `${showU(f.u)} · ${fmt(f.kcal * f.q)} kcal`)}</T>
          </View>
          <IconBtn label="−" a11y={L('أقل', 'Less')} onPress={() => updateDay((d) => changePortion(d, i, -0.5))} />
          <T kind="body" style={{ minWidth: 26, textAlign: 'center', fontFamily: fonts.displaySemi }}>{f.q}</T>
          <IconBtn label="+" a11y={L('أكتر', 'More')} onPress={() => updateDay((d) => changePortion(d, i, 0.5))} />
        </View>
        <MacroChips p={f.p * f.q} c={f.c * f.q} f={f.f * f.q} />
        {alerts.map((a, k) => (
          <View key={k} accessibilityRole="alert" style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: c.badBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: a.level === 'bad' ? 2 : 4, backgroundColor: a.level === 'bad' ? c.bad : c.warn, marginTop: 6 }} />
            <T kind="small" color={c.bad} style={[{ flex: 1 }, a.level === 'bad' ? { fontFamily: fonts.bodyMedium } : null]}>{a.text}</T>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Screen title={L('الأكل', 'Food')}>
      <Card>
        <View style={styles.rowBetween}>
          <View>
            <T kind="big" color={t.kcal > T0.kcal ? c.bad : undefined}>{fmt(t.kcal)}</T>
            <T kind="small">{L(`من ${fmt(T0.kcal)} سعرة`, `of ${fmt(T0.kcal)} kcal`)}</T>
          </View>
          <T kind="small" color={t.kcal > T0.kcal ? c.bad : c.ok}>
            {t.kcal > T0.kcal
              ? L(`${g('عديت', 'عديتي')} بـ ${fmt(t.kcal - T0.kcal)}`, `${fmt(t.kcal - T0.kcal)} over`)
              : L(`فاضل ${fmt(T0.kcal - t.kcal)} سعرة`, `${fmt(T0.kcal - t.kcal)} kcal left`)}
          </T>
        </View>
        <View style={{ gap: 8, marginTop: 4 }}>
          <MacroBar label={L('بروتين', 'Protein')} value={t.p} target={T0.protein} />
          <MacroBar label={L('كارب', 'Carbs')} value={t.c} target={T0.carbs} />
          <MacroBar label={L('دهون', 'Fat')} value={t.f} target={T0.fat} />
        </View>
        {waiting > 0 ? <T kind="small" color={c.warn}>{L(`+ ${fmt(waiting)} سعرة في وجبات لسه ${g('معلمتش', 'معلمتيش')} عليها. بتتحسب لما ${g('تعلّم', 'تعلّمي')} إنك ${g('خلصتها', 'خلصتيها')}.`, `+ ${fmt(waiting)} kcal in meals not ticked yet. They count once you tick the meal as done.`)}</T> : null}
      </Card>

      {MEALS.map((meal) => {
        const foods = day.foods.filter((x) => x.meal === meal);
        const done = ticked.includes(meal);
        const sum = mealTotals(day, meal);
        const entry = plan.find((e) => e.meal === meal)!;
        const r = entry.recipe;
        const canSuggest = !done && !foods.length && !!r;
        const showIdea = ideas === meal && canSuggest;
        return (
          <Card key={meal}>
            <View style={[styles.row, { gap: 10 }]}>
              <Pressable onPress={() => tick(meal)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: done }}
                accessibilityLabel={L(`${g('خلصت', 'خلصتي')} ${MEAL_NAME[meal]}`, `Finished ${tx(MEAL_NAME[meal])}`)}
                style={{ width: 28, height: 28, borderRadius: 9, borderWidth: 2, borderColor: c.petrol, backgroundColor: done ? c.petrol : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {done ? <Text style={{ color: c.onPetrol, fontSize: 16, fontWeight: '700' }}>✓</Text> : null}
              </Pressable>
              <View style={{ flex: 1 }}>
                <T kind="h3">{tx(MEAL_NAME[meal])}</T>
                <T kind="small" color={done ? c.ok : undefined}>
                  {done ? L(`${g('خلصته', 'خلصتيه')} · ${fmt(sum.kcal)} سعرة`, `Done · ${fmt(sum.kcal)} kcal`)
                    : foods.length ? L(`${fmt(sum.kcal)} سعرة · ${g('علّم', 'علّمي')} لما ${g('تخلص', 'تخلصي')} عشان تتحسب`, `${fmt(sum.kcal)} kcal · tick when done to count it`)
                    : L(`لسه ${g('مسجلتش', 'مسجلتيش')}`, 'Nothing logged yet')}
                </T>
              </View>
              <Pressable onPress={() => { play('tap'); router.push({ pathname: '/add', params: { meal } }); }} accessibilityRole="button"
                accessibilityLabel={L(`إضافة أكل ${toMeal(meal)}`, `Add food to ${tx(MEAL_NAME[meal])}`)}
                style={{ borderRadius: 99, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: c.lime, boxShadow: '0px 3px 10px rgba(255,214,10,0.35)' } as object}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.onLime }}>{L(`+ ${g('ضيف', 'ضيفي')}`, '+ Add')}</Text>
              </Pressable>
            </View>
            {foods.length ? <View>{foods.map((f, k) => foodRow(f, k === foods.length - 1))}</View> : null}
            {canSuggest ? (
              <Pressable onPress={() => { play('tap'); setIdeas(showIdea ? null : meal); }} accessibilityRole="button" accessibilityState={{ expanded: showIdea }}>
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
          </Card>
        );
      })}

      {loose.length ? (
        <Card>
          <T kind="h3">{L('أكل من غير وجبة', 'Other food')}</T>
          {loose.map((f, k) => foodRow(f, k === loose.length - 1))}
        </Card>
      ) : null}
    </Screen>
  );
}
