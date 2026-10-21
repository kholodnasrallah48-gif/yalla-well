// Settings that shape the plan: the equipment the gym has, the macro split, and the weekly calorie check.
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { calorieCheck } from '../lib/adapt.ts';
import { L, num, toNum } from '../lib/i18n.ts';
import { EQUIP_KINDS, genderFor, ketoBlocked, macroName, medical, targets, weekPlaces, type MacroPref, type OwnDiet, type Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Card, Chip, NoteView, Num, RADIUS, START, T, styles } from './ui.tsx';

const key = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Which equipment the gym has; exercises switch to a version that uses what's there. */
export function EquipPicker({ p, onChange }: { p: Pick<Profile, 'equip' | 'sex'>; onChange: (equip: Profile['equip']) => void }) {
  const g = genderFor(p.sex);
  const have = p.equip ?? EQUIP_KINDS.map((k) => k.id);
  const toggle = (id: (typeof have)[number]) => {
    play('tap');
    const next = have.includes(id) ? have.filter((x) => x !== id) : [...have, id];
    onChange(next.length === EQUIP_KINDS.length ? undefined : next);
  };
  return (
    <View style={{ gap: 8 }}>
      <T kind="h3">{L('إيه الموجود في الجيم بتاعك؟', 'What does your gym have?')}</T>
      <T kind="small">{L(`${g('شيل', 'شيلي')} اللي مش موجود، والتمارين هتتبدل بنسخة بالأدوات اللي عندك. ${g('تقدر', 'تقدري')} برضه ${g('تختار', 'تختاري')} النسخة بنفسك من صفحة كل تمرين.`, 'Untick anything your gym doesn’t have and exercises switch to a version that uses what’s there. You can also pick the version yourself on each exercise.')}</T>
      <View style={styles.wrap}>{EQUIP_KINDS.map((k) => <Chip key={k.id} label={k.n()} on={have.includes(k.id)} onPress={() => toggle(k.id)} />)}</View>
    </View>
  );
}

function Pct({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const c = useColors();
  const b = { width: 34, height: 34, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 4 }}>
      <T kind="label">{label}</T>
      <View style={[styles.row, { gap: 6 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={L(`أقل ${label}`, `Less ${label}`)} onPress={() => onChange(value - 5)} style={b}><Text style={{ color: c.ink, fontFamily: fonts.displaySemi, fontSize: 18 }}>−</Text></Pressable>
        <Num size={22}>{`${value}%`}</Num>
        <Pressable accessibilityRole="button" accessibilityLabel={L(`أكتر ${label}`, `More ${label}`)} onPress={() => onChange(value + 5)} style={b}><Text style={{ color: c.ink, fontFamily: fonts.displaySemi, fontSize: 18 }}>+</Text></Pressable>
      </View>
    </View>
  );
}

type G = (m: string, f: string) => string;

/** Said wherever the person picks between their own diet plan and the app's numbers. */
export function DietNote({ g, strong }: { g: G; strong?: boolean }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: strong ? c.warnBg : c.soft, borderRadius: RADIUS, padding: 10 }}>
      <T kind="small" color={strong ? c.warn : c.ink}>{L(`لو عندك مرض معين، الأفضل ${g('ترجع', 'ترجعي')} لدكتور أو أخصائي تغذية ${g('يكتبلك', 'يكتبلك')} نظام أكل على حالتك. ${g('سجله', 'سجليه')} هنا ${g('وامشي', 'وامشي')} عليه عادي، والوجبات والاقتراحات هتمشي على أرقامه.`, 'If you have a health condition, it is best to see a doctor or dietitian for a plan written for you. Enter it here and follow it as usual; meals and suggestions will use its numbers.')}</T>
    </View>
  );
}

/** The dietitian's numbers: calories, and the grams of protein, carbs and fat when the plan has them. */
export function OwnDietFields({ value, onChange, g }: { value?: OwnDiet; onChange: (o: OwnDiet) => void; g: G }) {
  const c = useColors();
  const [txt, setTxt] = useState(() => ({ kcal: value?.kcal ? String(value.kcal) : '', p: value?.p ? String(value.p) : '', c: value?.c ? String(value.c) : '', f: value?.f ? String(value.f) : '' }));
  const set = (k: keyof typeof txt, v: string) => {
    const next = { ...txt, [k]: v };
    setTxt(next);
    onChange({ kcal: Math.round(toNum(next.kcal)) || 0, p: Math.round(toNum(next.p)) || 0, c: Math.round(toNum(next.c)) || 0, f: Math.round(toNum(next.f)) || 0 });
  };
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlign: START() } as const;
  const field = (k: keyof typeof txt, label: string, ph: string) => (
    <View key={k} style={{ flex: 1, minWidth: 70, gap: 4 }}>
      <T kind="label">{label}</T>
      <TextInput value={txt[k]} onChangeText={(v) => set(k, v)} keyboardType="number-pad" placeholder={ph} placeholderTextColor={c.dim} style={input} accessibilityLabel={label} />
    </View>
  );
  const kcal = toNum(txt.kcal);
  return (
    <View style={{ gap: 8 }}>
      {field('kcal', L('السعرات في اليوم', 'Calories a day'), '1600')}
      <View style={[styles.row, { gap: 8 }]}>
        {field('p', L('بروتين (جم)', 'Protein (g)'), '110')}
        {field('c', L('كارب (جم)', 'Carbs (g)'), '160')}
        {field('f', L('دهون (جم)', 'Fat (g)'), '55')}
      </View>
      <T kind="small" color={txt.kcal && kcal < 800 ? c.warn : c.muted}>{txt.kcal && kcal < 800
        ? L(`${g('اكتب', 'اكتبي')} السعرات المكتوبة في النظام (٨٠٠ أو أكتر).`, 'Enter the calories from the plan (800 or more).')
        : L(`لو النظام مفيهوش جرامات ${g('سيبها', 'سيبيها')} فاضية، وهنقسم السعرات إحنا.`, "If the plan doesn't give grams, leave them empty and we'll split the calories.")}</T>
    </View>
  );
}

/** Picks how the calories split between protein, carbs and fat. */
export function MacroPicker({ p, onChange }: { p: Profile; onChange: (m: MacroPref) => void }) {
  const c = useColors();
  const g = genderFor(p.sex);
  const mode = p.macro?.mode ?? 'auto';
  const keto = ketoBlocked(p);
  const T0 = targets(p);
  const share = (grams: number, k: number) => Math.round((grams * k * 100) / Math.max(T0.kcal, 1));
  const cur = { p: p.macro?.p ?? share(T0.protein, 4), f: p.macro?.f ?? share(T0.fat, 9) };
  const setCustom = (pp: number, f: number) => {
    const P = Math.max(10, Math.min(50, pp)), F = Math.max(15, Math.min(70, f));
    if (P + F > 95) return;
    onChange({ mode: 'custom', p: P, f: F, c: 100 - P - F });
  };
  const modes: MacroPref['mode'][] = ['auto', 'own', 'highp', 'lowcarb', 'keto', 'custom'];
  const hint: Record<MacroPref['mode'], string> = {
    auto: L('البروتين على حسب وزنك وهدفك وحالتك، والباقي متوزع بين الكارب والدهون.', 'Protein from your weight, goal and health; the rest split between carbs and fat.'),
    highp: L('للي بيبني عضل أو بيحضر لبطولة: ٢.٢ جم بروتين لكل كيلو.', 'For building muscle or competition prep: 2.2 g protein per kg.'),
    lowcarb: L('ربع السعرات بس من الكارب، والباقي بروتين ودهون.', 'Only a quarter of calories from carbs; the rest protein and fat.'),
    keto: keto ?? L(`حوالي ٣٠ جم كارب في اليوم. ${g('ابدأه', 'ابدأيه')} بس بعد ما الدكتور يوافق، خصوصا لو ${g('بتاخد', 'بتاخدي')} أدوية.`, 'About 30 g carbs a day. Start it only after your doctor agrees, especially if you take medicines.'),
    custom: L(`${g('حط', 'حطي')} النسب بنفسك. البروتين مش هيعدي الحد الآمن لحالتك.`, 'Set the percentages yourself. Protein won’t go over the safe limit for your health.'),
    own: L(`${g('اكتب', 'اكتبي')} الأرقام زي ما هي في النظام. مش هنغيرها لوحدنا مع متابعة الوزن، ده دور أخصائي التغذية.`, "Enter the numbers as they are in the plan. We won't change them with your weigh-ins; that's your dietitian's call."),
  };
  const anyCond = medical(p).mod.anyCondition;
  return (
    <View style={{ gap: 8 }}>
      <T kind="h3">{L('نظام الأكل', 'Your diet')}</T>
      <View style={styles.wrap}>
        {modes.map((m) => <Chip key={m} label={macroName(m)} on={mode === m} onPress={() => {
          if (m === 'keto' && keto) return;
          play('tap');
          onChange(m === 'custom' ? { mode: 'custom', p: cur.p, f: cur.f, c: 100 - cur.p - cur.f } : m === 'own' ? { mode: 'own', own: p.macro?.own } : { mode: m });
        }} />)}
      </View>
      <DietNote g={g} strong={anyCond && mode !== 'own'} />
      <T kind="small" color={mode === 'keto' || (keto && mode !== 'custom') ? c.warn : c.muted}>{hint[mode]}</T>
      {keto && mode !== 'keto' ? <T kind="small" color={c.muted}>{keto}</T> : null}
      {mode === 'own' ? <OwnDietFields value={p.macro?.own} onChange={(own) => onChange({ mode: 'own', own })} g={g} /> : null}
      {mode === 'custom' ? (
        <View style={[styles.row, { gap: 6 }]}>
          <Pct label={L('بروتين', 'Protein')} value={p.macro?.p ?? cur.p} onChange={(v) => setCustom(v, p.macro?.f ?? cur.f)} />
          <View style={{ flex: 1, alignItems: 'center', gap: 4 }}><T kind="label">{L('كارب', 'Carbs')}</T><Num size={22}>{`${p.macro?.c ?? 100 - cur.p - cur.f}%`}</Num></View>
          <Pct label={L('دهون', 'Fat')} value={p.macro?.f ?? cur.f} onChange={(v) => setCustom(p.macro?.p ?? cur.p, v)} />
        </View>
      ) : null}
    </View>
  );
}

/** The weekly calorie check: a suggested change with apply / keep, and the change already applied. */
export function CalorieCheckCard({ p, onChange }: { p: Profile; onChange: (p: Profile) => void }) {
  const c = useColors();
  const g = genderFor(p.sex);
  const ck = calorieCheck(p, new Date());
  if (!ck) return null;
  const T0 = targets(p);
  const answer = (apply: boolean) => {
    play(apply ? 'add' : 'tap');
    onChange({ ...p, adjAt: key(), ...(apply && ck.kind === 'change' ? { kcalAdj: (p.kcalAdj ?? 0) + ck.delta } : {}) });
  };
  return (
    <Card>
      <NoteView note={{ tone: ck.kind === 'change' ? 'info' : 'warn', title: ck.title, text: ck.why }} />
      {ck.kind === 'change' ? (
        <>
          <T kind="small">{L(`هدفك هيبقى ${num(T0.kcal + ck.delta)} سعرة بدل ${num(T0.kcal)}.`, `Your target would be ${num(T0.kcal + ck.delta)} kcal instead of ${num(T0.kcal)}.`)}</T>
          <View style={[styles.row, { gap: 8 }]}>
            <Btn title={L(g('عدل', 'عدلي'), 'Change it')} onPress={() => answer(true)} style={{ flex: 1 }} />
            <Btn kind="outline" title={L(g('سيبه زي ما هو', 'سيبيه زي ما هو'), 'Keep it')} onPress={() => answer(false)} style={{ flex: 1 }} />
          </View>
        </>
      ) : <Btn kind="outline" title={L('تمام', 'OK')} onPress={() => answer(false)} />}
    </Card>
  );
}

/** Whether the person trains at a gym on any day (the equipment picker only matters then). */
export const usesGym = (p: Profile) => weekPlaces(p).includes('gym');
