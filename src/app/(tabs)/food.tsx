import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AdviceView, Dot } from '../../components/food.tsx';
import { Btn, Card, Screen, START, T, styles } from '../../components/ui.tsx';
import { addFood, changePortion, fmt, totals } from '../../lib/day.ts';
import { ALL_CAT, FOOD_CATS, FOODS, MY_FOODS_CAT, foodAdvice, foodLevel, norm, parseMeal, type Food, type ParsedItem, type Unknown } from '../../lib/foods.ts';
import { searchOnline, toFood, type OnlineFood } from '../../lib/online.ts';
import { genderFor, targets } from '../../lib/plan.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

function IconBtn({ label, a11y, onPress }: { label: string; a11y: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={a11y} onPress={onPress}
      style={{ width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 20, lineHeight: 22, color: c.petrol, fontFamily: fonts.display }}>{label}</Text>
    </Pressable>
  );
}

type Found = { loading: boolean; hits: OnlineFood[]; pick: number; grams: string };

export default function FoodScreen() {
  const c = useColors();
  const { profile, day, custom, updateDay, addCustomFood } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL_CAT);
  const [form, setForm] = useState({ n: '', u: '', kcal: '', p: '', c: '', f: '' });
  const [meal, setMeal] = useState('');
  const [parsed, setParsed] = useState<{ items: ParsedItem[]; unknown: Unknown[] } | null>(null);
  // Online matches for each unknown part of the typed meal, by its index.
  const [found, setFound] = useState<Record<number, Found>>({});
  const [web, setWeb] = useState<{ q: string; loading: boolean; hits: OnlineFood[]; grams: string } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const all = useMemo(() => [...FOODS, ...custom.map((f) => ({ ...f, cat: MY_FOODS_CAT }))], [custom]);
  const pool = useMemo(() => {
    let list = all;
    if (cat !== ALL_CAT) list = list.filter((f) => f.cat === cat);
    const s = norm(q);
    if (s) list = list.filter((f) => norm(f.n).includes(s) || norm(f.u).includes(s));
    return list.slice(0, 80);
  }, [q, cat, all]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  const remaining = T0.kcal - t.kcal;
  const female = profile.sex !== 'm';
  const add = (f: Food) => { updateDay((d) => addFood(d, f)); setOpen(null); };
  // Online foods are kept in "أكلاتي" so next time they come from the list without internet.
  const remember = (f: Food) => { if (!custom.some((x) => x.id === f.id)) addCustomFood(f); };
  const calc = () => {
    const r = parseMeal(meal, all);
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
    updateDay((d) => extra.reduce((acc, f) => addFood(acc, f), parsed.items.reduce((acc, it) => {
      let next = addFood(acc, it.food);
      const i = next.foods.findIndex((x) => x.ref === it.food.id);
      if (it.q !== 1) next = { ...next, foods: next.foods.map((x, j) => (j === i ? { ...x, q: x.q - 1 + it.q } : x)) };
      return next;
    }, d)));
    extra.forEach(remember);
    setMeal(''); setParsed(null); setFound({});
  };
  const mealKcal = parsed ? parsed.items.reduce((a, it) => a + it.food.kcal * it.q, 0) + onlineFoods.reduce((a, f) => a + (f?.kcal ?? 0), 0) : 0;
  const anyToAdd = !!parsed && (parsed.items.length > 0 || onlineFoods.some(Boolean));
  const input = { borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START } as const;

  const saveCustom = () => {
    if (!form.n.trim() || !form.kcal) return;
    const f: Food = { id: 'c' + Date.now(), cat: MY_FOODS_CAT, n: form.n.trim(), u: form.u.trim() || 'حصة', kcal: +form.kcal || 0, p: +form.p || 0, c: +form.c || 0, f: +form.f || 0 };
    addCustomFood(f);
    updateDay((d) => addFood(d, f));
    setForm({ n: '', u: '', kcal: '', p: '', c: '', f: '' });
  };

  return (
    <Screen title="الأكل">
      <Card>
        <View style={styles.rowBetween}>
          <View>
            <T kind="big">{fmt(t.kcal)}</T>
            <T kind="small">من {fmt(T0.kcal)} سعرة</T>
          </View>
          <T kind="small" style={{ fontVariant: ['tabular-nums'] }}>بروتين {fmt(t.p)}g · كارب {fmt(t.c)}g · دهون {fmt(t.f)}g</T>
        </View>
      </Card>

      <Card>
        <T kind="h2">{g('اكتب', 'اكتبي')} {g('أكلت', 'أكلتي')} إيه</T>
        <TextInput value={meal} onChangeText={(v) => { setMeal(v); setParsed(null); setFound({}); }} multiline placeholder="مثلًا: ٢ بيض وعيش بلدي وجبنة قريش وكوباية شاي بلبن" placeholderTextColor={c.muted}
          style={[input, { minHeight: 64, textAlignVertical: 'top' }]} />
        <View style={[styles.row, { gap: 8 }]}>
          <Btn kind="secondary" title="احسب" onPress={calc} disabled={!meal.trim()} style={{ flex: 1 }} />
          <Btn kind="outline" title={g('صوّر باركود', 'صوّري باركود')} onPress={() => router.push('/scan')} style={{ flex: 1 }} />
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
                      <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{it.q !== 1 ? `${it.q} × ` : ''}{it.food.n}</T>
                      <T kind="small">{it.food.u} · {fmt(it.food.kcal * it.q)} سعرة · ب {fmt(it.food.p * it.q)} ك {fmt(it.food.c * it.q)} د {fmt(it.food.f * it.q)}</T>
                    </View>
                  </View>
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
                  <T kind="small">بندوّر على "{u.text}" أونلاين…</T>
                </View>
              );
              if (!x.hits.length) return (
                <T key={'u' + i} kind="small" color={c.warn}>ملقيناش "{u.text}" حتى أونلاين. {g('جرب', 'جربي')} اسم تاني أو {g('ضيفها', 'ضيفيها')} كأكلة خاصة تحت.</T>
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
                      <T kind="small">{f ? `${f.u} · ${fmt(f.kcal)} سعرة · ب ${fmt(f.p)} ك ${fmt(f.c)} د ${fmt(f.f)}` : 'اكتبي الوزن'}</T>
                    </View>
                    <TextInput value={x.grams} onChangeText={(v) => set({ grams: v.replace(/[^0-9.]/g, '') })} keyboardType="numeric" accessibilityLabel="الوزن بالجرام"
                      style={[input, { width: 64, textAlign: 'center', paddingHorizontal: 4 }]} />
                    <T kind="small">جم</T>
                  </View>
                  <T kind="small">من {hit.src}: {hit.name} · {fmt(hit.per100.kcal)} سعرة لكل ١٠٠ جم</T>
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
            {parsed.unknown.length ? <T kind="small">اللي جاي من أونلاين بيتحسب بالوزن. لو مش مظبوط {g('اختار', 'اختاري')} نتيجة تانية من تحته.</T> : null}
            {anyToAdd ? (
              <>
                <T kind="h3">المجموع: {fmt(mealKcal)} سعرة</T>
                <Btn title={g('ضيفهم لأكل النهارده', 'ضيفيهم لأكل النهارده')} onPress={addParsed} />
              </>
            ) : null}
          </View>
        ) : null}
      </Card>

      <Card>
        <T kind="h2">أكل النهارده</T>
        {day.foods.length ? day.foods.map((f, i) => (
          <View key={f.ref} style={[styles.row, { gap: 10, paddingVertical: 8, borderBottomWidth: i < day.foods.length - 1 ? 1 : 0, borderColor: c.line }]}>
            <View style={{ flex: 1 }}>
              <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{f.n}</T>
              <T kind="small">{f.u} · {fmt(f.kcal * f.q)} سعرة</T>
            </View>
            <IconBtn label="−" a11y="أقل" onPress={() => updateDay((d) => changePortion(d, i, -0.5))} />
            <T kind="h3" style={{ minWidth: 28, textAlign: 'center' }}>{f.q}</T>
            <IconBtn label="+" a11y="أكتر" onPress={() => updateDay((d) => changePortion(d, i, 0.5))} />
          </View>
        )) : <T kind="small">{g('لسه مسجلتش', 'لسه مسجلتيش')} حاجة النهارده. {g('دور', 'دوري')} على الأكلة تحت و{g('دوس', 'دوسي')} +.</T>}
      </Card>

      <Card>
        <T kind="h2">{g('ضيف أكلة', 'ضيفي أكلة')}</T>
        <TextInput value={q} onChangeText={(v) => { setQ(v); setWeb(null); }} onSubmitEditing={searchWeb} returnKeyType="search" placeholder={g('دور: فول، فراخ، بيبسي...', 'دوري: فول، فراخ، بيبسي...')} placeholderTextColor={c.muted} style={input} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {FOOD_CATS.map((k) => (
            <Pressable key={k} onPress={() => setCat(k)} accessibilityRole="button"
              style={{ borderWidth: 1, borderColor: k === cat ? c.petrol : c.line, backgroundColor: k === cat ? c.petrol : c.surface, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: k === cat ? c.onPetrol : c.ink }}>{k}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {pool.length ? pool.map((f, i) => {
          const isOpen = open === f.id;
          return (
            <View key={f.id} style={{ gap: 8, paddingVertical: 8, borderBottomWidth: i < pool.length - 1 ? 1 : 0, borderColor: c.line }}>
              <View style={[styles.row, { gap: 10 }]}>
                <Pressable style={[styles.row, { flex: 1, gap: 8 }]} onPress={() => setOpen(isOpen ? null : f.id)} accessibilityRole="button" accessibilityState={{ expanded: isOpen }}>
                  <Dot level={foodLevel(profile, f)} />
                  <View style={{ flex: 1 }}>
                    <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{f.n}</T>
                    <T kind="small">{f.u} · {fmt(f.kcal)} سعرة · ب {f.p} ك {f.c} د {f.f}</T>
                  </View>
                </Pressable>
                <IconBtn label="+" a11y={`إضافة ${f.n}`} onPress={() => add(f)} />
              </View>
              {isOpen ? <AdviceView advice={foodAdvice(profile, f, remaining, all)} onSwap={add} female={female} /> : null}
            </View>
          );
        }) : <T kind="small">مفيش نتيجة في اللستة.</T>}
        {q.trim().length > 1 && !web ? <Btn kind="outline" title={`${g('دوّر', 'دوّري')} على "${q.trim()}" أونلاين`} onPress={searchWeb} /> : null}
        {web ? (
          <View style={{ gap: 8 }}>
            <View style={[styles.row, { gap: 8 }]}>
              <T kind="h3" style={{ flex: 1 }}>نتايج أونلاين</T>
              <T kind="small">الوزن</T>
              <TextInput value={web.grams} onChangeText={(v) => setWeb({ ...web, grams: v.replace(/[^0-9.]/g, '') })} keyboardType="numeric" accessibilityLabel="الوزن بالجرام"
                style={[input, { width: 64, textAlign: 'center', paddingHorizontal: 4 }]} />
              <T kind="small">جم</T>
            </View>
            {web.loading ? <ActivityIndicator color={c.petrol} /> : web.hits.length ? web.hits.map((h, i) => {
              const f = toFood(h, +web.grams || 100, web.q);
              return (
                <View key={h.id} style={[styles.row, { gap: 10, paddingVertical: 6, borderBottomWidth: i < web.hits.length - 1 ? 1 : 0, borderColor: c.line }]}>
                  <Dot level={foodLevel(profile, f)} />
                  <View style={{ flex: 1 }}>
                    <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{h.name}</T>
                    <T kind="small">{f.u} · {fmt(f.kcal)} سعرة · ب {fmt(f.p)} ك {fmt(f.c)} د {fmt(f.f)} · {h.src}</T>
                  </View>
                  <IconBtn label="+" a11y={`إضافة ${h.name}`} onPress={() => { add(f); remember(f); }} />
                </View>
              );
            }) : <T kind="small" color={c.warn}>ملقيناش حاجة أونلاين. {g('جرب', 'جربي')} كلمة تانية أو {g('ضيفها', 'ضيفيها')} كأكلة خاصة تحت.</T>}
          </View>
        ) : null}
        <T kind="small">النقطة الخضرا يعني مناسب {g('ليك', 'ليكي')}، والصفرا خلي بالك، والحمرا مش مناسب لحالتك. {g('دوس', 'دوسي')} على الأكلة {g('تشوف', 'تشوفي')} السبب والبدايل.</T>
      </Card>

      <Card>
        <T kind="h2">أكلة خاصة {g('بيك', 'بيكي')}</T>
        <TextInput value={form.n} onChangeText={(n) => setForm({ ...form, n })} placeholder="الاسم، مثلًا: سلطة تونة" placeholderTextColor={c.muted} style={input} />
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput value={form.u} onChangeText={(u) => setForm({ ...form, u })} placeholder="الكمية: طبق" placeholderTextColor={c.muted} style={[input, { flex: 1 }]} />
          <TextInput value={form.kcal} onChangeText={(kcal) => setForm({ ...form, kcal })} placeholder="السعرات" keyboardType="numeric" placeholderTextColor={c.muted} style={[input, { flex: 1 }]} />
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          {(['p', 'c', 'f'] as const).map((k) => (
            <TextInput key={k} value={form[k]} onChangeText={(v) => setForm({ ...form, [k]: v })} keyboardType="numeric"
              placeholder={{ p: 'بروتين g', c: 'كارب g', f: 'دهون g' }[k]} placeholderTextColor={c.muted} style={[input, { flex: 1 }]} />
          ))}
        </View>
        <Btn kind="secondary" title={g('احفظها وضيفها للنهارده', 'احفظيها وضيفيها للنهارده')} onPress={saveCustom} disabled={!form.n.trim() || !form.kcal} />
      </Card>
    </Screen>
  );
}
