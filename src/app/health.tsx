// "My health": medicine times (and medicines the person adds), lab results with when to repeat each, and the
// report for the doctor (last 4 weeks) to print or share as a PDF.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MedList, migrateMeds } from '../components/MedList.tsx';
import { DateField, dateLabel } from '../components/pickers.tsx';
import { Bg, Btn, Card, START, T, styles } from '../components/ui.tsx';
import { dayKey, weekIndex } from '../lib/day.ts';
import { LABS, addLab, doctorHTML, labName, labsFor, latestLab, nextLab, type LabKind } from '../lib/health.ts';
import { L, toNum } from '../lib/i18n.ts';
import { genderFor, sessionFor } from '../lib/plan.ts';
import { programWeek } from '../lib/progress.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

export default function Health() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, readDay } = useStore();
  const [labKind, setLabKind] = useState<LabKind | null>(null);
  const [labVal, setLabVal] = useState('');
  const [labDate, setLabDate] = useState(dayKey(new Date()));
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  // Older profiles kept other medicines as one line of text; show them as medicines with a schedule.
  const p = migrateMeds(profile);
  const g = genderFor(p.sex);
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;

  const kinds = labsFor(p);
  const saveLab = () => {
    if (!labKind) return;
    const v = toNum(labVal);
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

  return (
    <Bg><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('صحتي', 'My health')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>

      <Card>
        <T kind="h2">{L('الأدوية والفيتامينات', 'Medicines and supplements')}</T>
        <T kind="small">{L(`لكل واحد: الجرعة والعدد وكل قد إيه والميعاد. هيجي${g('لك', 'لك')} تنبيه في كل ميعاد، و${g('تقدر تعلم', 'تقدري تعلمي')} عليه من الصفحة الرئيسية.`, "For each one: dose, how many, how often and when. You'll get a reminder at each time, and can tick it off on Home.")}</T>
        <MedList value={p} onChange={(patch) => saveProfile({ ...p, ...patch })} />
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
                  {last ? L(`آخر مرة ${dateLabel(last.date)}`, `Last ${dateLabel(last.date)}`) : L('لسه متسجلش', 'Not logged yet')}
                  {next ? L(` · الجاي ${dateLabel(next)}`, ` · next ${dateLabel(next)}`) : ''}
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
            <T kind="small">{L('اتعمل إمتى', 'When it was done')}</T>
            <DateField value={labDate} onChange={setLabDate} />
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

