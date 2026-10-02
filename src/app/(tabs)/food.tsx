import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { AdviceView, Dot } from '../../components/food.tsx';
import { Btn, Card, Screen, START, T, styles } from '../../components/ui.tsx';
import { addFood, changePortion, fmt, totals } from '../../lib/day.ts';
import { ALL_CAT, FOOD_CATS, FOODS, MY_FOODS_CAT, foodAdvice, foodLevel, norm, parseMeal, type Food, type ParsedItem } from '../../lib/foods.ts';
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

export default function FoodScreen() {
  const c = useColors();
  const { profile, day, custom, updateDay, addCustomFood } = useStore();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL_CAT);
  const [form, setForm] = useState({ n: '', u: '', kcal: '', p: '', c: '', f: '' });
  const [meal, setMeal] = useState('');
  const [parsed, setParsed] = useState<{ items: ParsedItem[]; unknown: string[] } | null>(null);
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
  const addParsed = () => {
    if (!parsed) return;
    updateDay((d) => parsed.items.reduce((acc, it) => {
      let next = addFood(acc, it.food);
      const i = next.foods.findIndex((x) => x.ref === it.food.id);
      if (it.q !== 1) next = changePortion(next, i, it.q - 1);
      return next;
    }, d));
    setMeal(''); setParsed(null);
  };
  const mealKcal = parsed ? parsed.items.reduce((a, it) => a + it.food.kcal * it.q, 0) : 0;
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
        <TextInput value={meal} onChangeText={(v) => { setMeal(v); setParsed(null); }} multiline placeholder="مثلًا: ٢ بيض وعيش بلدي وجبنة قريش وكوباية شاي بلبن" placeholderTextColor={c.muted}
          style={[input, { minHeight: 64, textAlignVertical: 'top' }]} />
        <View style={[styles.row, { gap: 8 }]}>
          <Btn kind="secondary" title="احسب" onPress={() => setParsed(parseMeal(meal, all))} disabled={!meal.trim()} style={{ flex: 1 }} />
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
            {parsed.unknown.length ? <T kind="small" color={c.warn}>ملقيناش: {parsed.unknown.join('، ')}. {g('دور', 'دوري')} عليها تحت أو {g('ضيفها', 'ضيفيها')} كأكلة خاصة.</T> : null}
            {parsed.items.length ? (
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
        <TextInput value={q} onChangeText={setQ} placeholder={g('دور: فول، فراخ، بيبسي...', 'دوري: فول، فراخ، بيبسي...')} placeholderTextColor={c.muted} style={input} />
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
        }) : <T kind="small">مفيش نتيجة. {g('اكتبها', 'اكتبيها')} فوق أو {g('ضيفها', 'ضيفيها')} من تحت كأكلة خاصة {g('بيك', 'بيكي')}.</T>}
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
