// The person's medicines and vitamins, each with its dose, how many, how often and at what times. Used in
// onboarding and on My health. Medicines from the list are ticked; anything else is typed (with suggestions
// from what the app knows), and one the app doesn't know asks what side effects to watch for.
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { MEDS } from '../lib/data.ts';
import { dayKey, weekIndex } from '../lib/day.ts';
import { DAYS, FORMS, MED_INFO, RULE_TEXT, UNITS, countText, doseText, medHow, medIds, medKB, medName, medPlan, newMedPlan, repeatOf, repeatText, spacing, type MedPlan, type MedRule } from '../lib/health.ts';
import { L, toNum, tx } from '../lib/i18n.ts';
import { WATCH_LABEL, itemKey, matchItems, suggestMeds, type DoseForm, type DoseUnit, type KBItem, type Watch } from '../lib/kb.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { DateField, TimeField, timeLabel } from './pickers.tsx';
import { Btn, Chip, Kicker, RADIUS, START, Segmented, T, styles } from './ui.tsx';

export type MedsValue = Pick<Profile, 'meds' | 'sex'> & Partial<Pick<Profile, 'medPlan' | 'extra' | 'tr' | 'otherMeds'>>;
type Patch = Partial<Pick<Profile, 'meds' | 'medPlan' | 'extra' | 'otherMeds'>>;

const MED_WATCH: Watch[] = ['dizzy', 'sugarLow', 'nausea', 'palp', 'bleed', 'cramps'];

/** Turns the older free-text "other medicines" into medicines with a schedule, each on its own. */
export function migrateMeds<P extends MedsValue>(p: P): P {
  const text = p.otherMeds?.trim();
  if (!text) return p;
  let meds = [...p.meds];
  const medPlan = { ...p.medPlan };
  for (const name of text.split(/[،,؛;\n]+/).map((x) => x.trim()).filter(Boolean)) {
    const kb = matchItems(name, ['med', 'vit'])[0];
    if (kb?.same && MEDS.some((m) => m.id === kb.same)) { if (!meds.includes(kb.same)) meds = [...meds, kb.same]; continue; }
    medPlan['x:' + name] ??= newMedPlan(name, kb);
  }
  return { ...p, meds, medPlan, otherMeds: '' };
}

export function MedList({ value, onChange }: { value: MedsValue; onChange: (patch: Patch) => void }) {
  const c = useColors();
  const g = genderFor(value.sex);
  const p = value as Profile;
  const [name, setName] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const ids = medIds(p);
  const sugg = suggestMeds(name).filter((k) => !ids.includes('x:' + name.trim()));

  const setPlan = (id: string, patch: Partial<MedPlan>) => onChange({ medPlan: { ...value.medPlan, [id]: { ...medPlan(p, id), ...patch } } });
  const remove = (id: string) => {
    play('remove');
    const rest = { ...value.medPlan };
    delete rest[id];
    onChange({ medPlan: rest, meds: value.meds.filter((x) => x !== id) });
    if (open === id) setOpen(null);
  };
  const toggleListed = (id: string) => {
    if (value.meds.includes(id)) { remove(id); return; }
    onChange({ meds: [...value.meds, id] });
    setOpen(id);
  };
  const add = (typed: string, kb?: KBItem) => {
    const n = typed.trim();
    if (!n) return;
    kb ??= matchItems(n, ['med', 'vit'])[0];
    play('add');
    setName('');
    if (kb?.same && MED_INFO[kb.same]) {
      if (!value.meds.includes(kb.same)) onChange({ meds: [...value.meds, kb.same] });
      setOpen(kb.same);
      return;
    }
    const id = 'x:' + n;
    onChange({ medPlan: { ...value.medPlan, [id]: value.medPlan?.[id] ?? newMedPlan(n, kb) } });
    setOpen(id);
  };
  const input = { flex: 1, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: RADIUS, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;
  const warn = spacing(p);
  const keyOf = (id: string) => itemKey(medPlan(p, id).name ?? id.slice(2));

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.wrap}>{MEDS.map((x) => <Chip key={x.id} label={tx(x.n)} on={value.meds.includes(x.id)} onPress={() => toggleListed(x.id)} />)}</View>

      <View style={{ gap: 6 }}>
        <T kind="label">{L(`${g('ضيف', 'ضيفي')} دوا أو فيتامين أو مكمل`, 'Add a medicine, vitamin or supplement')}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput value={name} onChangeText={setName} onSubmitEditing={() => add(name)} returnKeyType="done" placeholder={L('مثلا: فيتامين د، حديد، جلوكوفاج', 'e.g. vitamin D, iron, metformin')} placeholderTextColor={c.muted} style={input} />
          <Btn title={L(g('ضيف', 'ضيفي'), 'Add')} disabled={!name.trim()} onPress={() => add(name)} />
        </View>
        {sugg.length ? (
          <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: RADIUS }}>
            {sugg.map((k, i) => (
              <Pressable key={k.id} onPress={() => add(L(k.n[0], k.n[1]), k)} accessibilityRole="button"
                style={({ pressed }) => [styles.rowBetween, { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderColor: c.line }, pressed && styles.pressed]}>
                <T kind="body">{L(k.n[0], k.n[1])}</T>
                <T kind="small" color={c.dim}>{k.kind === 'vit' ? L('فيتامين أو مكمل', 'Supplement') : L('دوا', 'Medicine')}</T>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      {ids.map((id) => (
        <MedRow key={id} id={id} p={p} open={open === id} onToggle={() => { play('tap'); setOpen(open === id ? null : id); }}
          setPlan={(patch) => setPlan(id, patch)} onRemove={() => remove(id)}
          watch={value.extra?.[keyOf(id)]?.watch ?? []}
          setWatch={(w) => { const key = keyOf(id); onChange({ extra: { ...value.extra, [key]: { ...value.extra?.[key], watch: w } } }); }} />
      ))}
      {warn.map((w, i) => <T key={i} kind="small" color={c.warn}>{w}</T>)}
    </View>
  );
}

function MedRow({ id, p, open, onToggle, setPlan, onRemove, watch, setWatch }: {
  id: string; p: Profile; open: boolean; onToggle: () => void; setPlan: (patch: Partial<MedPlan>) => void; onRemove: () => void;
  watch: Watch[]; setWatch: (w: Watch[]) => void;
}) {
  const c = useColors();
  const g = genderFor(p.sex);
  const pl = medPlan(p, id);
  const kb = medKB(id, pl);
  const typed = id.startsWith('x:');
  const vit = (pl.kind ?? (kb?.kind === 'vit' ? 'vit' : 'med')) === 'vit';
  const [doseStr, setDoseStr] = useState(pl.dose ? String(pl.dose) : '');
  const r = repeatOf(pl);
  const how = medHow(p, id);
  const summary = [doseText(pl), repeatText(pl), pl.times.map(timeLabel).join(L('، ', ', '))].filter(Boolean).join(' · ');
  const today = dayKey(new Date());
  // Changing how often clears the older weekly fields, so only the new ones count.
  const setRepeat = (patch: Partial<MedPlan>) => setPlan({ day: undefined, every: undefined, from: pl.from ?? today, ...patch });
  const which = r.repeat === 'days' ? (r.n === 2 ? 'other' : 'days') : r.repeat;
  const weekly = r.repeat === 'week';
  // Tablets can be split in half; drops, injections and the rest are whole.
  const half = (pl.form ?? 'pill') === 'pill';

  return (
    <View style={{ borderWidth: 1, borderColor: open ? c.petrol : c.line, borderRadius: RADIUS, backgroundColor: c.surface }}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={({ pressed }) => [{ padding: 12, gap: 4 }, pressed && styles.pressed]}>
        <View style={[styles.rowBetween, { gap: 8 }]}>
          <T kind="h3" style={{ flex: 1 }}>{medName(id, pl)}</T>
          <T kind="small" color={c.dim}>{vit ? L('فيتامين', 'Supplement') : L('دوا', 'Medicine')}</T>
        </View>
        <T kind="small" color={c.muted}>{summary}</T>
        {!open ? <T kind="small" color={c.petrol} style={{ fontFamily: fonts.bodyMedium }}>{L(`${g('عدل', 'عدلي')} الجرعة والمواعيد`, 'Edit dose and times')}</T> : null}
      </Pressable>
      {open ? (
        <View style={{ gap: 12, paddingHorizontal: 12, paddingBottom: 12 }}>
          {how ? <T kind="small" color={c.ok}>{how}</T> : null}
          {typed ? <Segmented<'med' | 'vit'> items={[['med', L('دوا', 'Medicine')], ['vit', L('فيتامين أو مكمل', 'Vitamin or supplement')]]} value={vit ? 'vit' : 'med'} onChange={(k) => setPlan({ kind: k })} /> : null}

          <Kicker>{L('الجرعة', 'Dose')}</Kicker>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {(Object.keys(FORMS) as DoseForm[]).map((f) => <Chip key={f} label={L(FORMS[f].ar[0], FORMS[f].en[0])} on={(pl.form ?? 'pill') === f} onPress={() => setPlan({ form: f, count: f === 'pill' ? pl.count : Math.max(1, Math.round(pl.count ?? 1)) })} />)}
          </ScrollView>
          <View style={[styles.row, { gap: 8 }]}>
            <T kind="small" style={{ minWidth: 56 }}>{L('العدد', 'How many')}</T>
            <Step label="−" onPress={() => setPlan({ count: Math.max(half ? 0.5 : 1, (pl.count ?? 1) - (half ? 0.5 : 1)) })} />
            <View style={{ flex: 1, alignItems: 'center' }}><T kind="h3">{countText(pl.count ?? 1, pl.form)}</T></View>
            <Step label="+" onPress={() => setPlan({ count: Math.min(30, (pl.count ?? 1) + (half ? 0.5 : 1)) })} />
          </View>
          <View style={[styles.row, { gap: 8 }]}>
            <T kind="small" style={{ minWidth: 56 }}>{L('التركيز', 'Strength')}</T>
            <TextInput value={doseStr} onChangeText={(v) => { setDoseStr(v); const n = toNum(v); setPlan({ dose: n > 0 ? n : undefined }); }} keyboardType="decimal-pad"
              placeholder={L('مثلا 50', 'e.g. 50')} placeholderTextColor={c.muted}
              style={{ flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: RADIUS, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() }} />
          </View>
          <View style={styles.wrap}>
            {(Object.keys(UNITS) as DoseUnit[]).map((u) => <Chip key={u} label={L(UNITS[u][0], UNITS[u][1])} on={(pl.unit ?? 'mg') === u && !!pl.dose} onPress={() => setPlan({ unit: u })} />)}
          </View>

          <Kicker>{L('كل قد إيه', 'How often')}</Kicker>
          <View style={styles.wrap}>
            <Chip label={L('كل يوم', 'Every day')} on={which === 'daily'} onPress={() => setRepeat({ repeat: 'daily', n: 1 })} />
            <Chip label={L('يوم ويوم', 'Every other day')} on={which === 'other'} onPress={() => setRepeat({ repeat: 'days', n: 2 })} />
            <Chip label={L('كل كام يوم', 'Every few days')} on={which === 'days'} onPress={() => setRepeat({ repeat: 'days', n: 3 })} />
            <Chip label={L('أيام في الأسبوع', 'Some weekdays')} on={weekly} onPress={() => setRepeat({ repeat: 'week', n: r.n, weekdays: r.weekdays.length ? r.weekdays : [weekIndex(new Date())] })} />
            <Chip label={L('كل شهر', 'Monthly')} on={which === 'month'} onPress={() => setRepeat({ repeat: 'month', n: 1 })} />
          </View>
          {which === 'days' ? (
            <View style={[styles.row, { gap: 8 }]}>
              <Step label="−" onPress={() => setRepeat({ repeat: 'days', n: Math.max(3, r.n - 1) })} />
              <View style={{ flex: 1, alignItems: 'center' }}><T kind="h3">{L(`كل ${r.n} أيام`, `Every ${r.n} days`)}</T></View>
              <Step label="+" onPress={() => setRepeat({ repeat: 'days', n: Math.min(30, r.n + 1) })} />
            </View>
          ) : null}
          {weekly ? <>
            <View style={styles.wrap}>
              {DAYS.map(([ar, en], d) => {
                const on = r.weekdays.includes(d);
                return <Chip key={d} label={L(ar, en)} on={on} onPress={() => {
                  const next = on ? r.weekdays.filter((x) => x !== d) : [...r.weekdays, d].sort();
                  if (next.length) setRepeat({ repeat: 'week', n: r.n, weekdays: next });
                }} />;
              })}
            </View>
            <View style={styles.wrap}>
              {[1, 2, 4].map((n) => <Chip key={n} label={n === 1 ? L('كل أسبوع', 'Every week') : n === 2 ? L('كل أسبوعين', 'Every 2 weeks') : L('كل ٤ أسابيع', 'Every 4 weeks')} on={r.n === n} onPress={() => setRepeat({ repeat: 'week', n, weekdays: r.weekdays })} />)}
            </View>
          </> : null}
          {which === 'month' ? (
            <View style={styles.wrap}>
              {[1, 2, 3, 6].map((n) => <Chip key={n} label={n === 1 ? L('كل شهر', 'Every month') : n === 2 ? L('كل شهرين', 'Every 2 months') : L(`كل ${n} شهور`, `Every ${n} months`)} on={r.n === n} onPress={() => setRepeat({ repeat: 'month', n })} />)}
            </View>
          ) : null}
          {which !== 'daily' && !(weekly && r.n === 1) ? (
            <View style={{ gap: 4 }}>
              <T kind="small">{which === 'month' ? L('أول جرعة (بيتكرر في نفس اليوم من الشهر)', 'First dose (repeats on the same day of the month)') : L('أول جرعة (بنحسب منها)', 'First dose (counted from here)')}</T>
              <DateField value={pl.from ?? today} onChange={(from) => setPlan({ from })} future />
            </View>
          ) : null}

          <Kicker>{L('المواعيد', 'Times')}</Kicker>
          {pl.times.map((t, i) => (
            <TimeField key={i} value={t} onChange={(v) => setPlan({ times: pl.times.map((x, j) => (j === i ? v : x)).sort() })}
              onRemove={pl.times.length > 1 ? () => setPlan({ times: pl.times.filter((_, j) => j !== i) }) : undefined} />
          ))}
          <Btn kind="outline" title={L(`+ ${g('ضيف', 'ضيفي')} ميعاد تاني في نفس اليوم`, '+ Add another time that day')} onPress={() => setPlan({ times: [...pl.times, nextTime(pl.times)] })} />

          <Kicker>{L('بيتاخد إزاي', 'How it is taken')}</Kicker>
          <View style={styles.wrap}>
            {(['empty', 'beforeMeal', 'withFood', 'bed', 'sameTime', 'any'] as MedRule[]).map((k) => (
              <Chip key={k} label={k === 'any' ? L('أي وقت', 'Any time') : L(RULE_TEXT[k][0], RULE_TEXT[k][1])} on={(pl.rule ?? kb?.rule ?? MED_INFO[id]?.rule) === k} onPress={() => setPlan({ rule: k })} />
            ))}
          </View>

          {typed && !kb ? <>
            <Kicker>{L('بيعمل أي حاجة من دول؟', 'Does it cause any of these?')}</Kicker>
            <T kind="small">{L(`الدوا ده مش في قائمتنا. لو ${g('بيعملك', 'بيعملك')} حاجة من دول هننبه${g('ك', 'كي')} ${g('توقف', 'توقفي')} التمرين لو حصلت.`, "This one isn't on our list. If it causes any of these, we'll tell you to stop training when they happen.")}</T>
            <View style={styles.wrap}>
              {MED_WATCH.map((w) => <Chip key={w} label={L(WATCH_LABEL[w][0], WATCH_LABEL[w][1])} on={watch.includes(w)} onPress={() => setWatch(watch.includes(w) ? watch.filter((x) => x !== w) : [...watch, w])} />)}
            </View>
          </> : null}

          <View style={[styles.row, { gap: 8 }]}>
            <Btn kind="dark" title={L('تمام', 'Done')} onPress={onToggle} style={{ flex: 1 }} />
            <Btn kind="text" title={L('شيل', 'Remove')} onPress={onRemove} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

function Step({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { play('pop'); onPress(); }} accessibilityRole="button" accessibilityLabel={label === '+' ? L('زود', 'More') : L('قلل', 'Less')}
      style={({ pressed }) => [{ width: 44, height: 40, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', backgroundColor: c.soft }, pressed && styles.pressed]}>
      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 20, color: c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** A sensible second time: 12 hours after the first (8 am → 8 pm), or the next free hour. */
function nextTime(times: string[]): string {
  const [h, m] = (times[0] ?? '09:00').split(':').map(Number);
  let t = (h + 12) % 24;
  const taken = (x: number) => times.some((s) => Number(s.split(':')[0]) === x);
  for (let i = 0; i < 24 && taken(t); i++) t = (t + 1) % 24;
  return `${String(t).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
