import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AdviceView, Dot, MacroChips } from '../components/food.tsx';
import { FoodPhoto, kindOf } from '../components/FoodPhoto.tsx';
import { MealIdea, openRecipe } from '../components/MealIdea.tsx';
import { Bg, Btn, Card, START, T, styles } from '../components/ui.tsx';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { addFood, fmt, mealTotals, planned } from '../lib/day.ts';
import { ALL_CAT, FOOD_CATS, FOODS, MY_FOODS_CAT, OFTEN, byUse, oftenFoods, foodAdvice, foodLevel, norm, parseMeal, type Food, type ParsedItem, type Unknown } from '../lib/foods.ts';
import { L, isEn, num, tx } from '../lib/i18n.ts';
import { searchOnline, toFood, type OnlineFood } from '../lib/online.ts';
import { MEALS, MEAL_NAME, dayPlan, mealBudget, mealOptions, toMeal } from '../lib/mealplan.ts';
import { rememberMeal, searchMealDB, type OnlineRecipe } from '../lib/online-recipes.ts';
import { portionFor, portionText, searchRecipes } from '../lib/recipe-search.ts';
import type { Meal } from '../lib/recipes-data.ts';
import { genderFor, targets } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

function IconBtn({ label, a11y, onPress, silent }: { label: string; a11y: string; onPress: () => void; silent?: boolean }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={() => { if (!silent) play(label === '−' ? 'remove' : 'tap'); onPress(); }}
      style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, lineHeight: 22, color: c.petrol, fontFamily: fonts.display }}>{label}</Text>
    </Pressable>
  );
}

type Found = { loading: boolean; hits: OnlineFood[]; pick: number; grams: string };

// A food's portion for display; online foods carry a computed "<grams> جم" unit.
const showU = (u: string) => (isEn() ? tx(u).replace(/(\d) جم$/, '$1 g') : u);

/** Adding food to one meal: type a meal in words, pick from the menu, search online, scan, or save your own. */
export default function AddFood() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ meal?: string }>();
  const [target, setTarget] = useState<Meal>(MEALS.includes(params.meal as Meal) ? (params.meal as Meal) : 'breakfast');
  // A short "added" line after each add, so it's clear where the food went.
  const [added, setAdded] = useState<string | null>(null);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flash = (name: string) => { setAdded(name); if (addedTimer.current) clearTimeout(addedTimer.current); addedTimer.current = setTimeout(() => setAdded(null), 2500); };
  const { profile, day, today, custom, updateDay, addCustomFood, usage } = useStore();
  const [q, setQ] = useState('');
  // The open section of the food menu (null = all closed).
  const [cat, setCat] = useState<string | null>(null);
  const [form, setForm] = useState({ n: '', u: '', kcal: '', p: '', c: '', f: '' });
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<{ items: ParsedItem[]; unknown: Unknown[] } | null>(null);
  // Online matches for each unknown part of the typed meal, by its index.
  const [found, setFound] = useState<Record<number, Found>>({});
  const [web, setWeb] = useState<{ q: string; loading: boolean; hits: OnlineFood[]; grams: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => [...FOODS, ...custom.map((f) => ({ ...f, cat: MY_FOODS_CAT }))], [custom]);
  const byId = useMemo(() => new Map(all.map((f) => [f.id, f])), [all]);
  // Typing searches every section; otherwise only the open section is listed.
  const pool = useMemo(() => {
    const s = norm(q);
    if (s) return byUse(all.filter((f) => norm(f.n).includes(s) || norm(f.u).includes(s)), usage).slice(0, 25);
    return cat ? byUse(all.filter((f) => f.cat === cat), usage) : [];
  }, [q, cat, all, usage]);
  const often = useMemo(() => oftenFoods(all, usage), [all, usage]);
  // Our recipes whose name matches the search, and online ones (TheMealDB) when asked for.
  const dishes = useMemo(() => searchRecipes(q, undefined, 4), [q]);
  const [netDishes, setNetDishes] = useState<{ q: string; loading: boolean; hits: OnlineRecipe[] } | null>(null);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = planned(day);
  const remaining = T0.kcal - t.kcal;
  const female = profile.sex !== 'm';
  const add = (f: Food) => { play(profile && foodLevel(profile, f) === 'bad' ? 'warn' : 'add'); updateDay((d) => addFood(d, f, target)); setOpen(null); flash(tx(f.n)); };
  // Online foods are kept in "أكلاتي" so next time they come from the list without internet.
  const remember = (f: Food) => { if (!custom.some((x) => x.id === f.id)) addCustomFood(f); };
  const calc = () => {
    const r = parseMeal(text, all);
    setParsed(r);
    const start: Record<number, Found> = {};
    r.unknown.forEach((u, i) => { start[i] = { loading: true, hits: [], pick: 0, grams: u.grams ? String(u.grams) : '' }; });
    setFound(start);
    r.unknown.forEach((u, i) => {
      searchOnline(u.text).then((hits) => setFound((prev) => {
        const cur = prev[i];
        if (!cur) return prev;
        const grams = cur.grams || String(Math.round((hits[0]?.servingG ?? 100) * u.q));
        return { ...prev, [i]: { ...cur, loading: false, hits, grams } };
      }));
    });
  };
  const onlineFoods = parsed ? parsed.unknown.map((u, i) => {
    const x = found[i];
    const hit = x?.hits[x.pick];
    return hit && +x.grams > 0 ? toFood(hit, +x.grams, u.text) : null;
  }) : [];
  const searchWeb = () => {
    const text = q.trim();
    if (!text) return;
    setWeb({ q: text, loading: true, hits: [], grams: '100' });
    searchOnline(text).then((hits) => setWeb((w) => (w && w.q === text ? { ...w, loading: false, hits } : w)));
  };
  const addParsed = () => {
    if (!parsed) return;
    const extra = onlineFoods.filter((f): f is Food => !!f);
    play('add');
    updateDay((d) => extra.reduce((acc, f) => addFood(acc, f, target), parsed.items.reduce((acc, it) => addFood(acc, it.food, target, it.q), d)));
    extra.forEach(remember);
    flash(L(`${fmt(mealKcal)} سعرة`, `${fmt(mealKcal)} kcal`));
    setText(''); setParsed(null); setFound({});
  };
  const mealKcal = parsed ? parsed.items.reduce((a, it) => a + it.food.kcal * it.q, 0) + onlineFoods.reduce((a, f) => a + (f?.kcal ?? 0), 0) : 0;
  const anyToAdd = !!parsed && (parsed.items.length > 0 || onlineFoods.some(Boolean));
  const input = { borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;

  const saveCustom = () => {
    if (!form.n.trim() || !form.kcal) return;
    const f: Food = { id: 'c' + Date.now(), cat: MY_FOODS_CAT, n: form.n.trim(), u: form.u.trim() || 'حصة', kcal: +form.kcal || 0, p: +form.p || 0, c: +form.c || 0, f: +form.f || 0 };
    addCustomFood(f);
    play('add');
    updateDay((d) => addFood(d, f, target));
    flash(f.n);
    setForm({ n: '', u: '', kcal: '', p: '', c: '', f: '' });
  };

  // One food in the menu: name, portion and macros, a badge when eaten often, + to log it, tap for advice.
  const row = (f: Food, line: boolean) => {
    const isOpen = open === f.id;
    const used = usage[f.id] ?? 0;
    return (
      <View key={f.id} style={{ gap: 8, paddingVertical: 8, borderBottomWidth: line ? 1 : 0, borderColor: c.line }}>
        <View style={[styles.row, { gap: 10 }]}>
          <Pressable style={[styles.row, { flex: 1, gap: 10 }]} onPress={() => setOpen(isOpen ? null : f.id)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
            <FoodPhoto item={{ id: f.id, n: f.n }} size={44} radius={11} kind={kindOf(f.cat)} />
            <Dot level={foodLevel(profile, f)} />
            <View style={{ flex: 1 }}>
              <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
                <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{tx(f.n)}</T>
                {used >= OFTEN ? (
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11, color: c.onLime, backgroundColor: c.lime, borderRadius: 99, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 1 }}>
                    {L(`متكررة · ${num(used)} ${used <= 10 ? 'أيام' : 'يوم'}`, `Often · ${num(used)} ${used === 1 ? 'day' : 'days'}`)}
                  </Text>
                ) : null}
              </View>
              <T kind="small">{L(`${f.u} · ${fmt(f.kcal)} سعرة · ب ${f.p} ك ${f.c} د ${f.f}`, `${showU(f.u)} · ${fmt(f.kcal)} kcal · P ${f.p} C ${f.c} F ${f.f}`)}</T>
            </View>
          </Pressable>
          <IconBtn label="+" a11y={L(`إضافة ${f.n}`, `Add ${tx(f.n)}`)} onPress={() => add(f)} silent />
        </View>
        {isOpen ? <AdviceView advice={foodAdvice(profile, f, remaining, all)} onSwap={add} female={female} /> : null}
      </View>
    );
  };

  const inMeal = mealTotals(day, target);
  // A dish for this meal, sized to what's left: today's plan pick while the meal is open, else the best fits now.
  const refs = day.foods.map((x) => x.ref);
  const plan = dayPlan(profile, today, day.shuffle, refs, t.kcal, day.meals ?? [], MEALS.filter((m) => day.foods.some((x) => x.meal === m)));
  const budget = mealBudget(profile, plan, target, inMeal.kcal, remaining);
  const entry = plan.find((e) => e.meal === target);
  let idea = entry && !entry.eaten && entry.recipe ? entry.recipe : null;
  if (!idea && budget >= 80) {
    const opts = mealOptions(profile, target, budget).filter((r) => !refs.includes('r_' + r.id));
    idea = opts.length ? opts[(day.shuffle?.[target] ?? 0) % opts.length] : null;
  }
  const another = () => updateDay((d) => ({ ...d, shuffle: { ...d.shuffle, [target]: (d.shuffle?.[target] ?? 0) + 1 } }));
  const searchDishes = (text = q.trim()) => {
    if (!text) return;
    setNetDishes({ q: text, loading: true, hits: [] });
    searchMealDB(text).then((hits) => setNetDishes((w) => (w && w.q === text ? { ...w, loading: false, hits } : w)))
      .catch(() => setNetDishes((w) => (w && w.q === text ? { ...w, loading: false } : w)));
  };

  // Dishes for the search: our recipes fitted to this meal's calories, else online recipes on request.
  const dishView = (
    <View style={{ gap: 8 }}>
      {dishes.length ? (
        <>
          <T kind="h3">{L('وصفات', 'Recipes')}</T>
          {dishes.map(({ r }, i) => {
            const pt = portionFor(r.kcal, budget);
            return (
              <Pressable key={r.id} onPress={() => { play('tap'); openRecipe(r.id, target, budget, 1.5); }} accessibilityRole="button"
                style={[styles.row, { gap: 12, paddingVertical: 6, borderBottomWidth: i < dishes.length - 1 ? 1 : 0, borderColor: c.line }]}>
                <FoodPhoto item={{ id: r.id, n: r.n }} size={56} radius={12} />
                <View style={{ flex: 1, gap: 2 }}>
                  <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{tx(r.n)}</T>
                  <T kind="small">{L(`الطبق ${fmt(r.kcal)} سعرة · ${fmt(r.mins)} دقيقة`, `${fmt(r.kcal)} kcal a serving · ${r.mins} min`)}</T>
                  {budget >= 80 ? (
                    <T kind="small" color={pt.tight ? c.warn : c.ok}>{L(`${toMeal(target)}: ${portionText(pt.factor)} ≈ ${fmt(pt.kcal)} سعرة`, `For ${tx(MEAL_NAME[target]).toLowerCase()}: ${portionText(pt.factor)} ≈ ${fmt(pt.kcal)} kcal`)}</T>
                  ) : null}
                </View>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.petrol }}>{L('‹', '›')}</Text>
              </Pressable>
            );
          })}
          <T kind="small">{L(`${g('دوس', 'دوسي')} على الوصفة ${g('تشوف', 'تشوفي')} المكونات والطريقة متظبطين على سعراتك (تقريبًا).`, 'Tap a recipe for its ingredients and steps fitted to your calories (roughly).')}</T>
        </>
      ) : null}
      {!dishes.length && q.trim().length > 1 && !netDishes ? (
        <Btn kind="outline" title={L(`طريقة عمل "${q.trim()}" من النت`, `Find a recipe for "${q.trim()}" online`)} onPress={() => searchDishes()} />
      ) : null}
      {netDishes ? (
        <View style={{ gap: 6 }}>
          <T kind="h3">{L('وصفات من النت', 'Recipes online')}</T>
          {netDishes.loading ? <ActivityIndicator color={c.petrol} /> : netDishes.hits.length ? netDishes.hits.map((r, i) => (
            <Pressable key={r.id} onPress={() => { play('tap'); rememberMeal(r); openRecipe(r.id, target, budget, 1.5); }} accessibilityRole="button"
              style={[styles.row, { gap: 12, paddingVertical: 6, borderBottomWidth: i < netDishes.hits.length - 1 ? 1 : 0, borderColor: c.line }]}>
              <FoodPhoto item={{ id: r.id, n: r.name, img: r.thumb ? r.thumb + '/preview' : undefined }} size={56} radius={12} />
              <View style={{ flex: 1, gap: 2 }}>
                <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{r.name}</T>
                <T kind="small">{[r.area, r.category].filter(Boolean).join(' · ')}{L(' · بالإنجليزي', ' · in English')}</T>
              </View>
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.petrol }}>{L('‹', '›')}</Text>
            </Pressable>
          )) : <T kind="small" color={c.warn}>{L(`ملقيناش وصفة "${netDishes.q}" على النت، أو مفيش نت دلوقتي. ${g('جرب', 'جربي')} اسم تاني أو بالإنجليزي.`, `No online recipe found for "${netDishes.q}", or you're offline. Try another name or English.`)}</T>}
          {netDishes.hits.length ? <T kind="small">{L('الوصفات دي من TheMealDB وبالإنجليزي.', 'These recipes are from TheMealDB, in English.')}</T> : null}
        </View>
      ) : null}
    </View>
  );

  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }} keyboardShouldPersistTaps="handled">
      <View style={styles.rowBetween}>
        <T kind="h1" style={{ flexShrink: 1 }}>{L(`${g('ضيف', 'ضيفي')} ${toMeal(target)}`, `Add to ${tx(MEAL_NAME[target])}`)}</T>
        <Btn kind="outline" title={L('خلصت', 'Done')} onPress={() => router.back()} />
      </View>
      <View style={[styles.row, { gap: 6 }]}>
        {MEALS.map((m) => (
          <Pressable key={m} onPress={() => { play('tap'); setTarget(m); }} accessibilityRole="radio" accessibilityState={{ selected: m === target }}
            style={{ flex: 1, alignItems: 'center', borderWidth: 1.5, borderColor: m === target ? c.petrol : c.line, backgroundColor: m === target ? c.petrol : c.surface, borderRadius: 99, paddingVertical: 6 }}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: m === target ? c.onPetrol : c.ink }}>{tx(MEAL_NAME[m])}</Text>
          </Pressable>
        ))}
      </View>
      <T kind="small">{L(`في ${MEAL_NAME[target]} لحد دلوقتي: ${fmt(inMeal.kcal)} سعرة · فاضل في اليوم ${fmt(Math.max(0, remaining))}`, `In ${tx(MEAL_NAME[target])} so far: ${fmt(inMeal.kcal)} kcal · ${fmt(Math.max(0, remaining))} left today`)}</T>
      {added ? (
        <View accessibilityLiveRegion="polite" style={{ backgroundColor: c.okBg, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }}>
          <T kind="small" color={c.ok}>{L(`✓ اتضاف ${toMeal(target)}: ${added}`, `✓ Added to ${tx(MEAL_NAME[target])}: ${added}`)}</T>
        </View>
      ) : null}

      {idea ? (
        <Card>
          <T kind="h2">{L(`اقتراح ${toMeal(target)}`, `An idea for ${tx(MEAL_NAME[target])}`)}</T>
          <T kind="small">{L(`على قد اللي فاضلك: حوالي ${fmt(budget)} سعرة ${toMeal(target)}`, `Sized to what's left: about ${fmt(budget)} kcal for ${tx(MEAL_NAME[target]).toLowerCase()}`)}</T>
          <MealIdea recipe={idea} meal={target} budget={budget} g={g} onAnother={another}
            why={entry?.recipe?.id === idea.id ? entry.why : []}
            factor={Math.min(entry?.recipe?.id === idea.id ? entry.portion : 1, portionFor(idea.kcal, budget, 1).factor)} />
        </Card>
      ) : null}

      <Card>
        <T kind="h2">{L(`${g('اكتب', 'اكتبي')} ${g('أكلت', 'أكلتي')} إيه`, 'Type what you ate')}</T>
        <TextInput value={text} onChangeText={(v) => { setText(v); setParsed(null); setFound({}); }} multiline placeholder={L('مثلًا: ٢ بيض وعيش بلدي وجبنة قريش وكوباية شاي بلبن', 'e.g. 2 eggs, baladi bread, cottage cheese and a cup of tea with milk')} placeholderTextColor={c.muted}
          style={[input, { minHeight: 64, textAlignVertical: 'top' }]} />
        <View style={[styles.row, { gap: 8 }]}>
          <Btn kind="secondary" title={L('احسب', 'Calculate')} onPress={calc} disabled={!text.trim()} style={{ flex: 1 }} />
          <Btn kind="outline" title={L(g('صوّر باركود', 'صوّري باركود'), 'Scan barcode')} onPress={() => router.push({ pathname: '/scan', params: { meal: target } })} style={{ flex: 1 }} />
        </View>
        {parsed ? (
          <View style={{ gap: 8 }}>
            {parsed.items.map((it, i) => {
              const adv = foodAdvice(profile, it.food, remaining);
              return (
                <View key={i} style={{ gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderColor: c.line }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    <Dot level={adv.level} />
                    <View style={{ flex: 1 }}>
                      <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{it.q !== 1 ? `${it.q} × ` : ''}{tx(it.food.n)}</T>
                      <T kind="small">{L(`${it.food.u} · ${fmt(it.food.kcal * it.q)} سعرة`, `${showU(it.food.u)} · ${fmt(it.food.kcal * it.q)} kcal`)}</T>
                    </View>
                  </View>
                  <MacroChips p={it.food.p * it.q} c={it.food.c * it.q} f={it.food.f * it.q} />
                  {adv.level === 'warn' || adv.level === 'bad' ? <AdviceView advice={adv} female={female} /> : null}
                </View>
              );
            })}
            {parsed.unknown.map((u, i) => {
              const x = found[i];
              const f = onlineFoods[i];
              if (!x || x.loading) return (
                <View key={'u' + i} style={[styles.row, { gap: 8, paddingVertical: 6 }]}>
                  <ActivityIndicator color={c.petrol} />
                  <T kind="small">{L(`بندوّر على "${u.text}" أونلاين…`, `Searching online for "${u.text}"…`)}</T>
                </View>
              );
              if (!x.hits.length) return (
                <T key={'u' + i} kind="small" color={c.warn}>{L(`ملقيناش "${u.text}" حتى أونلاين. ${g('جرب', 'جربي')} اسم تاني أو ${g('ضيفها', 'ضيفيها')} كأكلة خاصة تحت.`, `Couldn't find "${u.text}" online either. Try another name or add it as your own food below.`)}</T>
              );
              const hit = x.hits[x.pick];
              const adv = f ? foodAdvice(profile, f, remaining) : null;
              const set = (patch: Partial<Found>) => setFound((prev) => ({ ...prev, [i]: { ...prev[i], ...patch } }));
              return (
                <View key={'u' + i} style={{ gap: 6, paddingVertical: 6, borderBottomWidth: 1, borderColor: c.line }}>
                  <View style={[styles.row, { gap: 8 }]}>
                    {adv ? <Dot level={adv.level} /> : null}
                    <View style={{ flex: 1 }}>
                      <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{u.text}</T>
                      <T kind="small">{f ? L(`${f.u} · ${fmt(f.kcal)} سعرة`, `${showU(f.u)} · ${fmt(f.kcal)} kcal`) : L('اكتبي الوزن', 'Enter the weight')}</T>
                    </View>
                    <TextInput value={x.grams} onChangeText={(v) => set({ grams: v.replace(/[^0-9.]/g, '') })} keyboardType="numeric" accessibilityLabel={L('الوزن بالجرام', 'Weight in grams')}
                      style={[input, { width: 64, textAlign: 'center', paddingHorizontal: 4 }]} />
                    <T kind="small">{L('جم', 'g')}</T>
                  </View>
                  {f ? <MacroChips p={f.p} c={f.c} f={f.f} /> : null}
                  <T kind="small">{L(`من ${hit.src}: ${hit.name} · ${fmt(hit.per100.kcal)} سعرة لكل ١٠٠ جم`, `From ${hit.src}: ${hit.name} · ${fmt(hit.per100.kcal)} kcal per 100 g`)}</T>
                  {x.hits.length > 1 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {x.hits.slice(0, 8).map((h, k) => (
                        <Pressable key={h.id} onPress={() => set({ pick: k })} accessibilityRole="button" accessibilityState={{ selected: k === x.pick }}
                          style={{ maxWidth: 220, borderWidth: 1, borderColor: k === x.pick ? c.petrol : c.line, backgroundColor: k === x.pick ? c.petrol : c.surface, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text numberOfLines={1} style={{ fontFamily: fonts.body, fontSize: 12, color: k === x.pick ? c.onPetrol : c.ink }}>{h.name} · {fmt(h.per100.kcal)}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  ) : null}
                  {adv && (adv.level === 'warn' || adv.level === 'bad') ? <AdviceView advice={adv} female={female} /> : null}
                </View>
              );
            })}
            {parsed.unknown.length ? <T kind="small">{L(`اللي جاي من أونلاين بيتحسب بالوزن. لو مش مظبوط ${g('اختار', 'اختاري')} نتيجة تانية من تحته.`, "Online results are counted by weight. If it's not right, pick another result below it.")}</T> : null}
            {anyToAdd ? (
              <>
                <T kind="h3">{L(`المجموع: ${fmt(mealKcal)} سعرة`, `Total: ${fmt(mealKcal)} kcal`)}</T>
                <Btn title={L(`${g('ضيفهم', 'ضيفيهم')} ${toMeal(target)}`, `Add to ${tx(MEAL_NAME[target])}`)} onPress={addParsed} />
              </>
            ) : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <T kind="h2">{L(g('ضيف أكلة', 'ضيفي أكلة'), 'Add a food')}</T>
        <TextInput value={q} onChangeText={(v) => { setQ(v); setWeb(null); setNetDishes(null); }} onSubmitEditing={() => { searchWeb(); if (!dishes.length) searchDishes(); }} returnKeyType="search" placeholder={L(g('دور: فول، فراخ، بيبسي...', 'دوري: فول، فراخ، بيبسي...'), 'Search: fava beans, chicken, Pepsi...')} placeholderTextColor={c.muted} style={input} />
        {q.trim() ? dishView : null}
        {q.trim() ? (
          pool.length ? <View>{pool.map((f, i) => row(f, i < pool.length - 1))}</View> : <T kind="small">{L('مفيش نتيجة في اللستة.', 'No results in the list.')}</T>
        ) : (
          <>
            {often.length ? (
              <View style={{ gap: 2 }}>
                <T kind="h3">{L('الأكتر استخدامًا', 'Most used')}</T>
                {often.map((f, i) => row(f, i < often.length - 1))}
              </View>
            ) : <T kind="small">{L(`الأكل اللي ${g('بتاكله', 'بتاكليه')} كتير هيظهر هنا فوق عشان ${g('تضيفه', 'تضيفيه')} بسرعة.`, 'Foods you eat often will show up here so you can add them quickly.')}</T>}
            <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: 14, overflow: 'hidden' }}>
              {FOOD_CATS.filter((k) => k !== ALL_CAT).map((k, ci, cats) => {
                const n = all.filter((f) => f.cat === k).length;
                if (!n) return null;
                const isCat = cat === k;
                return (
                  <View key={k} style={{ borderBottomWidth: ci < cats.length - 1 ? 1 : 0, borderColor: c.line }}>
                    <Pressable onPress={() => { play('tap'); setCat(isCat ? null : k); setOpen(null); }} accessibilityRole="button" accessibilityState={{ expanded: isCat }}
                      style={[styles.row, { gap: 8, paddingHorizontal: 12, paddingVertical: 11, backgroundColor: isCat ? c.soft : c.surface }]}>
                      <Text style={{ flex: 1, fontFamily: fonts.displaySemi, fontSize: 15, color: isCat ? c.petrol : c.ink }}>{tx(k)}</Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 12, color: c.muted }}>{L(`${num(n)} أكلة`, `${num(n)} ${n === 1 ? 'food' : 'foods'}`)}</Text>
                      <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.petrol, transform: [{ rotate: isCat ? (isEn() ? '90deg' : '-90deg') : '0deg' }] }}>{L('‹', '›')}</Text>
                    </Pressable>
                    {isCat ? <View style={{ paddingHorizontal: 12 }}>{pool.map((f, i) => row(f, i < pool.length - 1))}</View> : null}
                  </View>
                );
              })}
            </View>
          </>
        )}
        {q.trim().length > 1 && !web ? <Btn kind="outline" title={L(`${g('دوّر', 'دوّري')} على "${q.trim()}" أونلاين`, `Search online for "${q.trim()}"`)} onPress={searchWeb} /> : null}
        {web ? (
          <View style={{ gap: 8 }}>
            <View style={[styles.row, { gap: 8 }]}>
              <T kind="h3" style={{ flex: 1 }}>{L('نتايج أونلاين', 'Online results')}</T>
              <T kind="small">{L('الوزن', 'Weight')}</T>
              <TextInput value={web.grams} onChangeText={(v) => setWeb({ ...web, grams: v.replace(/[^0-9.]/g, '') })} keyboardType="numeric" accessibilityLabel={L('الوزن بالجرام', 'Weight in grams')}
                style={[input, { width: 64, textAlign: 'center', paddingHorizontal: 4 }]} />
              <T kind="small">{L('جم', 'g')}</T>
            </View>
            {web.loading ? <ActivityIndicator color={c.petrol} /> : web.hits.length ? web.hits.map((h, i) => {
              const f = toFood(h, +web.grams || 100, web.q);
              return (
                <View key={h.id} style={[styles.row, { gap: 10, paddingVertical: 6, borderBottomWidth: i < web.hits.length - 1 ? 1 : 0, borderColor: c.line }]}>
                  <FoodPhoto item={{ id: h.id, n: h.name }} size={44} radius={11} />
                  <Dot level={foodLevel(profile, f)} />
                  <View style={{ flex: 1 }}>
                    <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{h.name}</T>
                    <T kind="small">{L(`${f.u} · ${fmt(f.kcal)} سعرة · ب ${fmt(f.p)} ك ${fmt(f.c)} د ${fmt(f.f)} · ${h.src}`, `${showU(f.u)} · ${fmt(f.kcal)} kcal · P ${fmt(f.p)} C ${fmt(f.c)} F ${fmt(f.f)} · ${h.src}`)}</T>
                  </View>
                  <IconBtn label="+" a11y={L(`إضافة ${h.name}`, `Add ${h.name}`)} onPress={() => { add(f); remember(f); }} silent />
                </View>
              );
            }) : <T kind="small" color={c.warn}>{L(`ملقيناش حاجة أونلاين. ${g('جرب', 'جربي')} كلمة تانية أو ${g('ضيفها', 'ضيفيها')} كأكلة خاصة تحت.`, "Couldn't find anything online. Try another word or add it as your own food below.")}</T>}
          </View>
        ) : null}
        <T kind="small">{L(`النقطة الخضرا يعني مناسب ${g('ليك', 'ليكي')}، والصفرا خلي بالك، والحمرا مش مناسب لحالتك. ${g('دوس', 'دوسي')} على الأكلة ${g('تشوف', 'تشوفي')} السبب والبدايل.`, 'Green dot means good for you, yellow means be careful, and red means not suitable for your condition. Tap a food to see why and the alternatives.')}</T>
      </Card>

      <Card>
        <T kind="h2">{L(`أكلة خاصة ${g('بيك', 'بيكي')}`, 'Your own food')}</T>
        <TextInput value={form.n} onChangeText={(n) => setForm({ ...form, n })} placeholder={L('الاسم، مثلًا: سلطة تونة', 'Name, e.g. tuna salad')} placeholderTextColor={c.muted} style={input} />
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput value={form.u} onChangeText={(u) => setForm({ ...form, u })} placeholder={L('الكمية: طبق', 'Portion: plate')} placeholderTextColor={c.muted} style={[input, { flex: 1 }]} />
          <TextInput value={form.kcal} onChangeText={(kcal) => setForm({ ...form, kcal })} placeholder={L('السعرات', 'Calories')} keyboardType="numeric" placeholderTextColor={c.muted} style={[input, { flex: 1 }]} />
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          {(['p', 'c', 'f'] as const).map((k) => (
            <TextInput key={k} value={form[k]} onChangeText={(v) => setForm({ ...form, [k]: v })} keyboardType="numeric"
              placeholder={{ p: L('بروتين g', 'Protein g'), c: L('كارب g', 'Carbs g'), f: L('دهون g', 'Fat g') }[k]} placeholderTextColor={c.muted} style={[input, { flex: 1 }]} />
          ))}
        </View>
        <Btn kind="secondary" title={L(`${g('احفظها وضيفها', 'احفظيها وضيفيها')} ${toMeal(target)}`, `Save and add to ${tx(MEAL_NAME[target])}`)} onPress={saveCustom} disabled={!form.n.trim() || !form.kcal} />
      </Card>
    </ScrollView></Bg>
  );
}
