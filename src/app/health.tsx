// "My health": medicine times (and medicines the person adds), lab results with when to repeat each, and the
// report for the doctor (last 4 weeks) to print or share as a PDF.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bg, Btn, Card, Chip, START, T, styles } from '../components/ui.tsx';
import { dayKey, weekIndex } from '../lib/day.ts';
import {
  DAYS, LABS, MED_INFO, addLab, doctorHTML, isTime, labName, labsFor, latestLab, medHow, medIds, medName, medPlan, nextLab, timeText,
  type LabKind, type MedPlan,
} from '../lib/health.ts';
import { L } from '../lib/i18n.ts';
import { genderFor, sessionFor } from '../lib/plan.ts';
import { programWeek } from '../lib/progress.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const pad = (n: number) => String(n).padStart(2, '0');
/** "7.30", "730", "7" → "07:30" / "07:00"; null when it isn't a time. */
function normTime(s: string): string | null {
  const t = s.trim().replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).replace(/[.,٫]/, ':');
  const m = t.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!m) return null;
  const v = `${pad(+m[1])}:${m[2] ?? '00'}`;
  return isTime(v) ? v : null;
}

export default function Health() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, readDay } = useStore();
  const [newTime, setNewTime] = useState<Record<string, string>>({});
  const [addName, setAddName] = useState('');
  const [addAt, setAddAt] = useState('');
  const [labKind, setLabKind] = useState<LabKind | null>(null);
  const [labVal, setLabVal] = useState('');
  const [labDate, setLabDate] = useState(dayKey(new Date()));
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  const p = profile;
  const g = genderFor(p.sex);
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;

  const setPlan = (id: string, patch: Partial<MedPlan>) => {
    const cur = medPlan(p, id);
    saveProfile({ ...p, medPlan: { ...p.medPlan, [id]: { ...cur, ...patch } } });
  };
  const removeCustom = (id: string) => {
    const rest = { ...p.medPlan };
    delete rest[id];
    saveProfile({ ...p, medPlan: rest });
  };
  const addMed = () => {
    const at = normTime(addAt || '09:00');
    if (!addName.trim() || !at) return;
    play('check');
    saveProfile({ ...p, medPlan: { ...p.medPlan, ['x:' + addName.trim()]: { name: addName.trim(), times: [at] } } });
    setAddName(''); setAddAt('');
  };

  const kinds = labsFor(p);
  const saveLab = () => {
    if (!labKind) return;
    const v = Number(labVal.replace(',', '.').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))));
    if (!LABS[labKind].noValue && !(v > 0)) return;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(labDate)) return;
    play('check');
    saveProfile(addLab(p, { kind: labKind, value: LABS[labKind].noValue ? undefined : v, date: labDate }));
    setLabKind(null); setLabVal(''); setLabDate(dayKey(new Date()));
  };

  const report = async () => {
    setBusy(true);
    try {
      const keys = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 27 + i); return d; });
      const logs = await Promise.all(keys.map((d) => readDay(dayKey(d))));
      const planned: Record<string, string[]> = {};
      keys.forEach((d) => { planned[dayKey(d)] = sessionFor(p, weekIndex(d), false, programWeek(p.start, d))?.items.map((x) => x.id) ?? []; });
      const html = doctorHTML({ profile: p, days: keys.map((d, i) => ({ key: dayKey(d), log: logs[i] })), planned });
      await Print.printAsync({ html });
    } catch { /* print screen closed or unavailable */ }
    setBusy(false);
  };

  const ids = medIds(p);
  return (
    <Bg><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('صحتي', 'My health')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>

      <Card>
        <T kind="h2">{L('مواعيد الأدوية', 'Medicine times')}</T>
        <T kind="small">{L(`هيجيلك تنبيه في كل ميعاد، و${g('تقدر تعلّم', 'تقدري تعلّمي')} عليه من الصفحة الرئيسية. ${g('اكتب', 'اكتبي')} الميعاد زي 7:30 أو 21:00.`, "You'll get a reminder at each time, and you can tick it off on Home. Type times like 7:30 or 21:00.")}</T>
        {!ids.length ? <T kind="small" color={c.muted}>{L(`مفيش أدوية متسجلة. ${g('ضيف', 'ضيفي')} من تحت أو من "${g('عدّل بياناتي', 'عدّلي بياناتي')}".`, 'No medicines yet. Add one below or from "Edit my details".')}</T> : null}
        {ids.map((id, i) => {
          const pl = medPlan(p, id);
          const weekly = pl.day !== undefined;
          return (
            <View key={id} style={{ gap: 8, paddingTop: 10, borderTopWidth: i ? 1 : 0, borderColor: c.line }}>
              <View style={styles.rowBetween}>
                <T kind="h3" style={{ flex: 1 }}>{medName(id, pl)}</T>
                {id.startsWith('x:') ? (
                  <Pressable onPress={() => removeCustom(id)} hitSlop={8} accessibilityRole="button"><T kind="small" color={c.bad}>{L('شيل', 'Remove')}</T></Pressable>
                ) : null}
              </View>
              {MED_INFO[id] ? <T kind="small">{medHow(p, id)}</T> : null}
              {weekly ? (
                <>
                  <T kind="small">{L('يوم الجرعة', 'Dose day')}</T>
                  <View style={styles.wrap}>{DAYS.map(([ar, en], d) => <Chip key={d} label={L(ar, en)} on={pl.day === d} onPress={() => setPlan(id, { day: d, from: undefined })} />)}</View>
                  <View style={[styles.row, { gap: 6 }]}>
                    {[1, 2, 4].map((n) => (
                      <Chip key={n} label={n === 1 ? L('كل أسبوع', 'Weekly') : L(n === 2 ? 'كل أسبوعين' : 'كل ٤ أسابيع', `Every ${n} weeks`)} on={(pl.every ?? 1) === n}
                        onPress={() => {
                          // Count the weeks from the next dose day, so "every 2 weeks" starts this coming dose.
                          const d = new Date(); while (weekIndex(d) !== pl.day) d.setDate(d.getDate() + 1);
                          setPlan(id, { every: n, from: dayKey(d) });
                        }} />
                    ))}
                  </View>
                </>
              ) : null}
              <View style={styles.wrap}>
                {pl.times.map((t) => (
                  <Pressable key={t} onPress={() => pl.times.length > 1 && setPlan(id, { times: pl.times.filter((x) => x !== t) })} accessibilityRole="button"
                    accessibilityLabel={L(`الميعاد ${timeText(t)}${pl.times.length > 1 ? `، ${g('دوس', 'دوسي')} عشان ${g('تشيله', 'تشيليه')}` : ''}`, `Time ${timeText(t)}${pl.times.length > 1 ? ', tap to remove' : ''}`)}
                    style={{ flexDirection: 'row', gap: 6, alignItems: 'center', borderRadius: 4, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: c.soft, borderWidth: 1, borderColor: c.line }}>
                    <Text style={{ fontFamily: fonts.displaySemi, fontSize: 14, color: c.ink }}>{timeText(t)}</Text>
                    {pl.times.length > 1 ? <Text style={{ color: c.muted, fontSize: 14 }}>×</Text> : null}
                  </Pressable>
                ))}
              </View>
              <View style={[styles.row, { gap: 8 }]}>
                <TextInput value={newTime[id] ?? ''} onChangeText={(v) => setNewTime({ ...newTime, [id]: v })} placeholder={weekly ? L('ميعاد جديد (مثلًا 20:00)', 'New time (e.g. 20:00)') : L('ميعاد تاني (مثلًا 21:00)', 'Another time (e.g. 21:00)')}
                  placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" style={[input, { flex: 1 }]} />
                <Btn kind="outline" title={weekly ? L(g('غيّر', 'غيّري'), 'Change') : L(g('ضيف', 'ضيفي'), 'Add')} onPress={() => {
                  const t = normTime(newTime[id] ?? '');
                  if (!t || pl.times.includes(t)) return;
                  play('tap');
                  // A weekly medicine has one time; adding replaces it.
                  setPlan(id, { times: weekly ? [t] : [...pl.times, t].sort() });
                  setNewTime({ ...newTime, [id]: '' });
                }} />
              </View>
            </View>
          );
        })}
        <View style={{ gap: 8, paddingTop: 10, borderTopWidth: 1, borderColor: c.line }}>
          <T kind="h3">{L(`${g('ضيف', 'ضيفي')} دوا أو فيتامين`, 'Add a medicine or supplement')}</T>
          <TextInput value={addName} onChangeText={setAddName} placeholder={L('الاسم (مثلًا فيتامين د)', 'Name (e.g. vitamin D)')} placeholderTextColor={c.muted} style={input} />
          <View style={[styles.row, { gap: 8 }]}>
            <TextInput value={addAt} onChangeText={setAddAt} placeholder={L('الميعاد (مثلًا 9:00)', 'Time (e.g. 9:00)')} placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" style={[input, { flex: 1 }]} />
            <Btn title={L(g('ضيف', 'ضيفي'), 'Add')} disabled={!addName.trim()} onPress={addMed} />
          </View>
        </View>
      </Card>

      <Card>
        <T kind="h2">{L('التحاليل', 'Lab results')}</T>
        <T kind="small">{L(`دي التحاليل المهمة لحالتك. ${g('سجل', 'سجلي')} النتيجة وهنفكرك بميعاد التحليل الجاي.`, "These are the tests that matter for you. Log a result and we'll remind you when the next one is due.")}</T>
        {kinds.map((k, i) => {
          const last = latestLab(p, k);
          const next = nextLab(p, k);
          const h = last?.value !== undefined ? LABS[k].hint?.(last.value) : undefined;
          const due = !next || next <= dayKey(new Date());
          return (
            <Pressable key={k} onPress={() => { play('tap'); setLabKind(labKind === k ? null : k); }} accessibilityRole="button"
              style={[styles.row, { gap: 10, paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderColor: c.line }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{labName(k)}</T>
                <T kind="small" color={due ? c.warn : c.muted}>
                  {last ? L(`آخر مرة ${last.date}`, `Last ${last.date}`) : L('لسه متسجلش', 'Not logged yet')}
                  {next ? L(` · الجاي ${next}`, ` · next ${next}`) : ''}
                  {due && last ? L(' (جه ميعاده)', ' (due)') : ''}
                </T>
              </View>
              {last ? (
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 16, color: h === 'bad' ? c.bad : h === 'warn' ? c.warn : c.ok }}>
                  {last.value !== undefined ? `${last.value} ${LABS[k].unit}` : L('اتعمل', 'Done')}
                </Text>
              ) : <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.petrol }}>{L(`+ ${g('سجل', 'سجلي')}`, '+ Log')}</Text>}
            </Pressable>
          );
        })}
        {labKind ? (
          <View style={{ gap: 8, backgroundColor: c.soft, borderRadius: 4, padding: 12 }}>
            <T kind="h3">{labName(labKind)}</T>
            {!LABS[labKind].noValue ? (
              <TextInput value={labVal} onChangeText={setLabVal} keyboardType="decimal-pad" placeholder={L(`النتيجة (${LABS[labKind].unit})`, `Result (${LABS[labKind].unit})`)} placeholderTextColor={c.muted} style={input} />
            ) : null}
            <TextInput value={labDate} onChangeText={setLabDate} placeholder="2026-10-05" placeholderTextColor={c.muted} keyboardType="numbers-and-punctuation" style={input} />
            <T kind="small">{L('التاريخ بالشكل ده: سنة-شهر-يوم', 'Date as year-month-day')}</T>
            <Btn title={L('حفظ', 'Save')} onPress={saveLab} />
          </View>
        ) : null}
        <T kind="small" color={c.muted}>{L('الألوان تقريبية للتوضيح بس، ودكتورك هو اللي يقرر.', 'Colours are only a rough guide; your doctor decides.')}</T>
      </Card>

      <Card>
        <T kind="h2">{L('تقرير للدكتور', 'Report for your doctor')}</T>
        <T kind="small">{L(`آخر ٤ أسابيع: الأدوية ومواعيدها والتزامك بيها، الطاقة والألم والنوم، أيام التعب، التمرين، والتحاليل. ${g('اطبعه', 'اطبعيه')} أو ${g('احفظه', 'احفظيه')} PDF و${g('ابعته', 'ابعتيه')} لدكتورك.`, 'The last 4 weeks: medicines, times and how often you took them, energy, pain and sleep, rough days, workouts and lab results. Print it or save it as a PDF for your doctor.')}</T>
        <Btn title={busy ? L('بيتجهز…', 'Preparing…') : L(g('اعمل التقرير', 'اعملي التقرير'), 'Make the report')} disabled={busy} onPress={report} />
      </Card>
    </ScrollView></Bg>
  );
}

