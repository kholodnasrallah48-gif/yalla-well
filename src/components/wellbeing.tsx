// Health cards for sleep, the period cycle and pregnancy.
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { TimeField, dateLabel } from './pickers.tsx';
import { Btn, Card, Num, RADIUS, T, styles } from './ui.tsx';
import { dayKey, type DayLog } from '../lib/day.ts';
import { L, num } from '../lib/i18n.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { sleepAvg, sleepHours, sleepRange, sleepVerdict, sleepWeek } from '../lib/sleep.ts';
import { play } from '../lib/sound.ts';
import { cycleInfo, dueDate, pregWeek, startPeriod, trimester } from '../lib/women.ts';
import { useColors } from '../theme.ts';

const hrs = (h: number) => String(Math.round(h * 10) / 10);

/** Last night's sleep: asks for bed and wake times until they're in, then shows the hours and the week. */
export function SleepCard({ profile, day, history, update }: { profile: Profile; day: DayLog; history: Record<string, DayLog>; update: (f: (d: DayLog) => DayLog) => void }) {
  const c = useColors();
  const g = genderFor(profile.sex);
  const [edit, setEdit] = useState(false);
  const [bed, setBed] = useState(day.sleep?.bed ?? '23:00');
  const [wake, setWake] = useState(day.sleep?.wake ?? '07:00');
  const h = sleepHours(day.sleep);
  const [lo, hi] = sleepRange(profile.age);
  const now = new Date();
  const week = sleepWeek({ ...history, [dayKey(now)]: day }, now);
  const avg = sleepAvg(week);

  if (h === null || edit) {
    const preview = sleepHours({ bed, wake })!;
    return (
      <Card>
        <T kind="h2">{L('النوم', 'Sleep')}</T>
        <T kind="small">{L(`${g('نمت', 'نمتي')} الساعة كام امبارح، و${g('صحيت', 'صحيتي')} الساعة كام؟`, 'When did you go to bed last night, and when did you wake up?')}</T>
        <View style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
          <View style={{ flex: 1, gap: 4 }}><T kind="label">{L('وقت النوم', 'Bed')}</T><TimeField value={bed} onChange={setBed} label={L('النوم', 'Bedtime')} /></View>
          <View style={{ flex: 1, gap: 4 }}><T kind="label">{L('وقت الصحيان', 'Woke')}</T><TimeField value={wake} onChange={setWake} label={L('الصحيان', 'Wake time')} /></View>
        </View>
        <T kind="small" color={c.muted}>{L(`يعني ${hrs(preview)} ساعة`, `That's ${hrs(preview)} hours`)}</T>
        <Btn title={L('حفظ', 'Save')} onPress={() => { play('check'); update((d) => ({ ...d, sleep: { bed, wake } })); setEdit(false); }} />
      </Card>
    );
  }
  const v = sleepVerdict(h, profile.age);
  const max = Math.max(hi + 1, ...week.map((x) => x.h ?? 0));
  return (
    <Card>
      <View style={styles.rowBetween}>
        <T kind="h2">{L('النوم', 'Sleep')}</T>
        <Btn kind="outline" title={L('تعديل', 'Edit')} onPress={() => setEdit(true)} style={{ minHeight: 36, paddingVertical: 4, paddingHorizontal: 12 }} />
      </View>
      <View style={[styles.row, { gap: 10, alignItems: 'flex-end' }]}>
        <Num size={48} weight="black" color={v === 'ok' ? c.petrol : c.warn}>{hrs(h)}</Num>
        <T kind="small" style={{ paddingBottom: 6 }}>{L(`ساعة امبارح · المناسب لسنك ${num(lo)} لـ ${num(hi)}`, `hours last night · ${lo}–${hi} suits your age`)}</T>
      </View>
      <T kind="small" color={v === 'ok' ? c.muted : c.warn}>
        {v === 'short' ? L(`أقل من المناسب. النوم القليل بيزود الجوع ويقلل الطاقة في التمرين، فحاول${g('', 'ي')} ${g('تنام', 'تنامي')} بدري شوية النهارده.`, "Less than ideal. Short sleep raises hunger and lowers your energy for training, so try for an earlier night.")
          : v === 'long' ? L(`أكتر من المعتاد. لو ده بيتكرر مع تعب، ${g('قوله', 'قوليه')} للدكتور.`, 'More than usual. If that keeps happening with tiredness, mention it to your doctor.')
          : L(`نوم كويس، ${g('كمل', 'كملي')} كده.`, 'Good sleep. Keep it up.')}
      </T>
      <View style={[styles.row, { gap: 6, height: 64, alignItems: 'flex-end' }]}>
        {week.map((x) => (
          <View key={x.key} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
            <View style={{ width: '100%', height: x.h ? Math.max(4, (54 * x.h) / max) : 4, borderRadius: 2, backgroundColor: x.h === null ? c.line : sleepVerdict(x.h, profile.age) === 'ok' ? c.petrol : c.warn }} />
          </View>
        ))}
      </View>
      {avg !== null ? <T kind="small" color={c.muted}>{L(`متوسط آخر ٧ أيام: ${hrs(avg)} ساعة`, `Last 7 days: ${hrs(avg)} hours on average`)}</T> : null}
    </Card>
  );
}

/** The cycle today: day of the cycle, the expected next period and the fertile window, with a button to log. */
export function CycleCard({ profile, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const c = useColors();
  const now = new Date();
  const today = dayKey(now);
  const ci = cycleInfo(profile.cycle, now);
  const log = () => { play('check'); onChange({ ...profile, cycle: startPeriod(profile.cycle, today) }); };
  if (!ci.last) {
    return (
      <Card>
        <T kind="h2">{L('الدورة', 'Period')}</T>
        <T kind="small">{L('سجلي أول يوم في آخر دورة، وهنحسب الدورة الجاية وأيام التبويض، ونخفف التمرين في أول يومين.', "Log the first day of your last period and we'll estimate the next one and your fertile days, and keep the first two days lighter.")}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <Btn title={L('بدأت النهارده', 'Started today')} onPress={log} style={{ flex: 1 }} />
          <Btn kind="outline" title={L('تاريخ تاني', 'Another date')} onPress={() => router.navigate('/cycle')} style={{ flex: 1 }} />
        </View>
      </Card>
    );
  }
  const label = ci.phase === 'period' ? L('أيام الدورة', 'Period days') : ci.phase === 'fertile' ? L('أيام التبويض', 'Fertile days') : ci.phase === 'pms' ? L('الدورة قربت', 'Period coming soon') : L('اليوم', 'Today');
  return (
    <Card>
      <View style={styles.rowBetween}>
        <T kind="h2">{L('الدورة', 'Period')}</T>
        <Btn kind="outline" title={L('التقويم', 'Calendar')} onPress={() => router.navigate('/cycle')} style={{ minHeight: 36, paddingVertical: 4, paddingHorizontal: 12 }} />
      </View>
      <View style={[styles.row, { gap: 10, alignItems: 'flex-end' }]}>
        <Num size={48} weight="black" color={ci.phase === 'period' ? c.bad : ci.phase === 'fertile' ? c.lime : c.petrol}>{String(ci.day)}</Num>
        <T kind="small" style={{ paddingBottom: 6 }}>{L(`يوم من الدورة · ${label}`, `day of your cycle · ${label}`)}</T>
      </View>
      <View style={{ gap: 2 }}>
        {ci.late ? <T kind="small" color={c.warn}>{L(`الدورة متأخرة ${num(ci.late)} يوم عن المتوقع.`, `Your period is ${ci.late} day${ci.late > 1 ? 's' : ''} later than expected.`)}</T>
          : <T kind="small">{L(`الجاية متوقعة ${dateLabel(ci.next!)}`, `Next expected ${dateLabel(ci.next!)}`)}</T>}
        {ci.fertile ? <T kind="small">{L(`أيام التبويض من ${dateLabel(ci.fertile[0])} لـ ${dateLabel(ci.fertile[1])}`, `Fertile days ${dateLabel(ci.fertile[0])} to ${dateLabel(ci.fertile[1])}`)}</T> : null}
      </View>
      {ci.phase !== 'period' ? <Btn title={L('الدورة بدأت النهارده', 'My period started today')} onPress={log} /> : null}
    </Card>
  );
}

/** Pregnancy week, trimester and due date. */
export function PregnancyCard({ profile }: { profile: Profile }) {
  const c = useColors();
  const w = pregWeek(profile.women, new Date());
  if (!w) return null;
  const tri = trimester(w);
  return (
    <Card>
      <T kind="h2">{L('الحمل', 'Pregnancy')}</T>
      <View style={[styles.row, { gap: 10, alignItems: 'flex-end' }]}>
        <Num size={48} weight="black" color={c.petrol}>{String(w)}</Num>
        <T kind="small" style={{ paddingBottom: 6 }}>{L(`الأسبوع · الثلث ${['الأول', 'التاني', 'التالت'][tri - 1]} من الحمل`, `week · trimester ${tri}`)}</T>
      </View>
      <View style={{ height: 8, borderRadius: RADIUS, backgroundColor: c.soft, overflow: 'hidden' }}>
        <View style={{ width: `${Math.min(100, (w / 40) * 100)}%`, height: '100%', backgroundColor: c.petrol }} />
      </View>
      <T kind="small">{L(`الولادة متوقعة حوالي ${dateLabel(dueDate(profile.women!))}`, `Due around ${dateLabel(dueDate(profile.women!))}`)}</T>
    </Card>
  );
}
