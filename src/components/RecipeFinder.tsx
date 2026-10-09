// "Find a recipe" on the Food tab: type a dish name (or tap a popular one), pick the meal, and get recipes with
// the portion that fits that meal's calories; tapping one opens its ingredients and steps scaled to that portion.
// Nothing from our list matches → one tap searches online recipes.
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { fmt } from '../lib/day.ts';
import { L, isEn, tx } from '../lib/i18n.ts';
import { MEALS, MEAL_NAME, toMeal } from '../lib/mealplan.ts';
import { rememberMeal, searchMealDB, type OnlineRecipe } from '../lib/online-recipes.ts';
import { portionFor, portionText, searchRecipes } from '../lib/recipe-search.ts';
import type { Meal } from '../lib/recipes-data.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { FoodPhoto } from './FoodPhoto.tsx';
import { openRecipe } from './MealIdea.tsx';
import { Card, START, T, styles } from './ui.tsx';

const POPULAR: [string, string][] = [
  ['كشري', 'Koshary'], ['ملوخية', 'Molokhia'], ['شكشوكة', 'Shakshuka'], ['شوربة عدس', 'Lentil soup'],
  ['شيش طاووق', 'Shish tawook'], ['محشي', 'Mahshi'], ['فول', 'Fava beans'], ['تونة', 'Tuna'],
];

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={6.5} fill="none" stroke={color} strokeWidth={2} />
      <Path d="M16 16l4.5 4.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function RecipeFinder({ budgets, start, g }: {
  /** Calories each meal can still take. */
  budgets: Record<Meal, number>;
  /** The meal picked at first (the next one not ticked yet). */
  start: Meal;
  g: (m: string, f: string) => string;
}) {
  const c = useColors();
  const [q, setQ] = useState('');
  const [meal, setMeal] = useState<Meal>(start);
  const [net, setNet] = useState<{ q: string; loading: boolean; hits: OnlineRecipe[] } | null>(null);
  const hits = useMemo(() => searchRecipes(q, undefined, 5), [q]);
  const budget = budgets[meal];
  const text = q.trim();

  const type = (v: string) => { setQ(v); setNet(null); };
  const online = () => {
    play('tap');
    setNet({ q: text, loading: true, hits: [] });
    searchMealDB(text).then((h) => setNet((w) => (w && w.q === text ? { ...w, loading: false, hits: h } : w)))
      .catch(() => setNet((w) => (w && w.q === text ? { ...w, loading: false } : w)));
  };
  const arrow = <Text style={{ fontFamily: fonts.displaySemi, fontSize: 18, color: c.petrol }}>{L('‹', '›')}</Text>;

  return (
    <Card>
      <T kind="h2">{L('دوّر على وصفة', 'Find a recipe')}</T>
      <T kind="small">{L(`${g('اكتب', 'اكتبي')} اسم الأكلة، وهنطلعلك المكونات والطريقة بالكمية اللي تناسب سعراتك.`, "Type a dish and we'll show the ingredients and steps in the amount that fits your calories.")}</T>

      <View style={[styles.row, { gap: 8, borderWidth: 1.5, borderColor: text ? c.petrol : c.line, backgroundColor: c.soft, borderRadius: 4, paddingHorizontal: 12 }]}>
        <SearchIcon color={c.muted} />
        <TextInput value={q} onChangeText={type} placeholder={L('مثلًا: كشري، مكرونة بالفراخ…', 'e.g. koshary, chicken pasta…')} placeholderTextColor={c.muted}
          returnKeyType="search" onSubmitEditing={() => { if (text.length > 1 && !hits.length) online(); }}
          style={{ flex: 1, paddingVertical: 11, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() }} />
        {q ? (
          <Pressable onPress={() => type('')} hitSlop={10} accessibilityRole="button" accessibilityLabel={L('امسح', 'Clear')}>
            <Text style={{ color: c.muted, fontSize: 18 }}>×</Text>
          </Pressable>
        ) : null}
      </View>

      {!text ? (
        <View style={styles.wrap}>
          {POPULAR.map(([ar, en]) => (
            <Pressable key={ar} onPress={() => { play('tap'); type(isEn() ? en : ar); }} accessibilityRole="button"
              style={({ pressed }) => [{ borderRadius: 4, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, paddingHorizontal: 12, paddingVertical: 6 }, pressed && styles.pressed]}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: c.ink }}>{L(ar, en)}</Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <>
          <View style={{ gap: 6 }}>
            <T kind="small">{L('الكمية محسوبة على:', 'Portion sized for:')}</T>
            <View style={[styles.row, { gap: 6 }]}>
              {MEALS.map((m) => (
                <Pressable key={m} onPress={() => { play('tap'); setMeal(m); }} accessibilityRole="radio" accessibilityState={{ selected: m === meal }}
                  style={{ flex: 1, alignItems: 'center', borderWidth: 1.5, borderColor: m === meal ? c.petrol : c.line, backgroundColor: m === meal ? c.petrol : c.surface, borderRadius: 4, paddingVertical: 6 }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: m === meal ? c.onPetrol : c.ink }}>{tx(MEAL_NAME[m])}</Text>
                </Pressable>
              ))}
            </View>
            <T kind="small" color={budget >= 80 ? c.muted : c.warn}>
              {budget >= 80 ? L(`فاضل ${toMeal(meal)} حوالي ${fmt(budget)} سعرة`, `About ${fmt(budget)} kcal left for ${tx(MEAL_NAME[meal]).toLowerCase()}`)
                : L(`مفيش سعرات كتير فاضلة ${toMeal(meal)}، فالكمية هتبقى صغيرة.`, `Not many calories left for ${tx(MEAL_NAME[meal]).toLowerCase()}, so the portion will be small.`)}
            </T>
          </View>

          {hits.map(({ r }, i) => {
            const pt = portionFor(r.kcal, Math.max(budget, 0));
            return (
              <Pressable key={r.id} onPress={() => { play('tap'); openRecipe(r.id, meal, budget, 1.5); }} accessibilityRole="button"
                style={({ pressed }) => [styles.row, { gap: 12, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderColor: c.line }, pressed && styles.pressed]}>
                <FoodPhoto item={{ id: r.id, n: r.n }} size={64} radius={14} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{tx(r.n)}</T>
                  <T kind="small">{L(`الطبق ${fmt(r.kcal)} سعرة · ${fmt(r.mins)} دقيقة`, `${fmt(r.kcal)} kcal a serving · ${r.mins} min`)}</T>
                  <T kind="small" color={pt.tight ? c.warn : c.ok} style={{ fontFamily: fonts.bodyMedium }}>
                    {L(`${g('خد', 'خدي')} ${portionText(pt.factor)} ≈ ${fmt(pt.kcal)} سعرة`, `Have ${portionText(pt.factor)} ≈ ${fmt(pt.kcal)} kcal`)}
                  </T>
                </View>
                {arrow}
              </Pressable>
            );
          })}

          {!hits.length && text.length > 1 && !net ? (
            <Pressable onPress={online} accessibilityRole="button"
              style={({ pressed }) => [{ alignItems: 'center', borderRadius: 4, paddingVertical: 10, borderWidth: 1.5, borderColor: c.petrol }, pressed && styles.pressed]}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 14, color: c.petrol }}>{L(`دوّر على "${text}" في وصفات النت`, `Search online recipes for "${text}"`)}</Text>
            </Pressable>
          ) : null}
          {hits.length && text.length > 1 && !net ? (
            <Pressable onPress={online} accessibilityRole="button" hitSlop={6}>
              <T kind="small" color={c.petrol}>{L(`${g('مش لاقي اللي عايزه', 'مش لاقية اللي عايزاه')}؟ ${g('دوّر', 'دوّري')} في وصفات النت`, 'Not what you want? Search online recipes')}</T>
            </Pressable>
          ) : null}

          {net ? (
            <View style={{ gap: 6 }}>
              <T kind="h3">{L('وصفات من النت', 'Recipes online')}</T>
              {net.loading ? <ActivityIndicator color={c.petrol} /> : net.hits.length ? net.hits.slice(0, 5).map((r, i) => (
                <Pressable key={r.id} onPress={() => { play('tap'); rememberMeal(r); openRecipe(r.id, meal, budget, 1.5); }} accessibilityRole="button"
                  style={({ pressed }) => [styles.row, { gap: 12, paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderColor: c.line }, pressed && styles.pressed]}>
                  <FoodPhoto item={{ id: r.id, n: r.name, img: r.thumb ? r.thumb + '/preview' : undefined }} size={64} radius={14} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{r.name}</T>
                    <T kind="small">{L('الكمية بتتظبط على سعراتك جوه الوصفة', 'Portion is fitted to your calories inside')}</T>
                  </View>
                  {arrow}
                </Pressable>
              )) : <T kind="small" color={c.warn}>{L(`ملقيناش وصفة "${net.q}"، أو مفيش نت دلوقتي. ${g('جرب', 'جربي')} اسم تاني أو بالإنجليزي.`, `No recipe found for "${net.q}", or you're offline. Try another name.`)}</T>}
            </View>
          ) : null}
        </>
      )}
    </Card>
  );
}
