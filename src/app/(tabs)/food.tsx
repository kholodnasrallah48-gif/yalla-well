import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Btn, Card, Screen, START, T, styles } from '../../components/ui.tsx';
import { ALL_CAT, FOOD_CATS, FOODS, MY_FOODS_CAT, type Food } from '../../lib/data.ts';
import { addFood, changePortion, fmt, totals } from '../../lib/day.ts';
import { genderFor, medical, targets } from '../../lib/plan.ts';
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
  const pool = useMemo(() => {
    let list: Food[] = [...FOODS, ...custom.map((f) => ({ ...f, cat: MY_FOODS_CAT }))];
    if (cat !== ALL_CAT) list = list.filter((f) => f.cat === cat);
    const s = q.trim();
    if (s) list = list.filter((f) => f.n.includes(s) || f.u.includes(s));
    return list;
  }, [q, cat, custom]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  const gf = medical(profile).mod.glutenFree;
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
        <TextInput value={q} onChangeText={setQ} placeholder={g('دور: فول، فراخ، رز...', 'دوري: فول، فراخ، رز...')} placeholderTextColor={c.muted} style={input} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {FOOD_CATS.map((k) => (
            <Pressable key={k} onPress={() => setCat(k)} accessibilityRole="button"
              style={{ borderWidth: 1, borderColor: k === cat ? c.petrol : c.line, backgroundColor: k === cat ? c.petrol : c.surface, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 4 }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 13, color: k === cat ? c.onPetrol : c.ink }}>{k}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {pool.length ? pool.map((f, i) => (
          <View key={f.id} style={[styles.row, { gap: 10, paddingVertical: 8, borderBottomWidth: i < pool.length - 1 ? 1 : 0, borderColor: c.line }]}>
            <View style={{ flex: 1 }}>
              <View style={[styles.row, { gap: 6, flexWrap: 'wrap' }]}>
                <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{f.n}</T>
                {gf && f.gluten ? <Text style={{ fontFamily: fonts.body, fontSize: 11, color: c.warn, backgroundColor: c.warnBg, borderRadius: 99, paddingHorizontal: 8, overflow: 'hidden' }}>فيه جلوتين</Text> : null}
              </View>
              <T kind="small">{f.u} · {fmt(f.kcal)} سعرة · ب {f.p} ك {f.c} د {f.f}</T>
            </View>
            <IconBtn label="+" a11y={`إضافة ${f.n}`} onPress={() => updateDay((d) => addFood(d, f))} />
          </View>
        )) : <T kind="small">مفيش نتيجة. {g('ضيفها', 'ضيفيها')} من تحت كأكلة خاصة {g('بيك', 'بيكي')}.</T>}
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
