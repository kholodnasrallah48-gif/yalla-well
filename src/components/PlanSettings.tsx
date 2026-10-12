// Settings that shape the plan: the equipment the gym has, the macro split, and the weekly calorie check.
import { Pressable, Text, View } from 'react-native';

import { calorieCheck } from '../lib/adapt.ts';
import { L, num } from '../lib/i18n.ts';
import { EQUIP_KINDS, genderFor, ketoBlocked, macroName, targets, weekPlaces, type MacroPref, type Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Card, Chip, NoteView, Num, RADIUS, T, styles } from './ui.tsx';

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
  const modes: MacroPref['mode'][] = ['auto', 'highp', 'lowcarb', 'keto', 'custom'];
  const hint: Record<MacroPref['mode'], string> = {
    auto: L('البروتين على حسب وزنك وهدفك وحالتك، والباقي متوزع بين الكارب والدهون.', 'Protein from your weight, goal and health; the rest split between carbs and fat.'),
    highp: L('للي بيبني عضل أو بيحضر لبطولة: ٢.٢ جم بروتين لكل كيلو.', 'For building muscle or competition prep: 2.2 g protein per kg.'),
    lowcarb: L('ربع السعرات بس من الكارب، والباقي بروتين ودهون.', 'Only a quarter of calories from carbs; the rest protein and fat.'),
    keto: keto ?? L(`حوالي ٣٠ جم كارب في اليوم. ${g('ابدأه', 'ابدأيه')} بس بعد ما الدكتور يوافق، خصوصا لو ${g('بتاخد', 'بتاخدي')} أدوية.`, 'About 30 g carbs a day. Start it only after your doctor agrees, especially if you take medicines.'),
    custom: L(`${g('حط', 'حطي')} النسب بنفسك. البروتين مش هيعدي الحد الآمن لحالتك.`, 'Set the percentages yourself. Protein won’t go over the safe limit for your health.'),
  };
  return (
    <View style={{ gap: 8 }}>
      <T kind="h3">{L('توزيع الماكروز', 'Macro split')}</T>
      <View style={styles.wrap}>
        {modes.map((m) => <Chip key={m} label={macroName(m)} on={mode === m} onPress={() => {
          if (m === 'keto' && keto) return;
          play('tap');
          onChange(m === 'custom' ? { mode: 'custom', p: cur.p, f: cur.f, c: 100 - cur.p - cur.f } : { mode: m });
        }} />)}
      </View>
      <T kind="small" color={mode === 'keto' || (keto && mode !== 'custom') ? c.warn : c.muted}>{hint[mode]}</T>
      {keto && mode !== 'keto' ? <T kind="small" color={c.muted}>{keto}</T> : null}
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
