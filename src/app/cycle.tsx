// The period calendar: logged and expected period days, the fertile window and ovulation by month, logging a start or
// an end on any date, the usual cycle length, and the periods logged so far.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DateField, MONTHS, dateLabel } from '../components/pickers.tsx';
import { Bg, Btn, Card, RADIUS, START, T, styles } from '../components/ui.tsx';
import { WEEK_SHORT } from '../lib/data.ts';
import { dayKey } from '../lib/day.ts';
import { L, isEn, num, toNum } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { cycleInfo, dayKind, endPeriod, removePeriod, startPeriod } from '../lib/women.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const WEEK_EN = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export default function CycleScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  const now = new Date();
  const [month, setMonth] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [pick, setPick] = useState(dayKey(now));
  const [len, setLen] = useState(profile?.cycle?.len ? String(profile.cycle.len) : '');
  if (!profile) return null;
  const cyc = profile.cycle;
  const ci = cycleInfo(cyc, now);
  const save = (cycle: typeof cyc) => saveProfile({ ...profile, cycle });

  // Saturday-first month grid.
  const first = (month.getDay() + 1) % 7;
  const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(first).fill(null), ...Array.from({ length: daysIn }, (_, i) => dayKey(new Date(month.getFullYear(), month.getMonth(), i + 1)))];
  while (cells.length % 7) cells.push(null);
  const color = (k: ReturnType<typeof dayKind>) => k === 'period' ? c.bad : k === 'expected' ? c.bad + '30' : k === 'ovulation' ? c.lime : k === 'fertile' ? c.lime + '38' : 'transparent';
  const todayKey = dayKey(now);
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START(), flex: 1 } as const;

  return (
    <Bg><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('الدورة', 'Period')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <Btn kind="outline" title="‹" onPress={() => shift(isEn() ? -1 : 1)} style={{ minHeight: 36, paddingVertical: 2, paddingHorizontal: 14 }} />
          <T kind="h2">{`${isEn() ? MONTHS[month.getMonth()][1] : MONTHS[month.getMonth()][0]} ${month.getFullYear()}`}</T>
          <Btn kind="outline" title="›" onPress={() => shift(isEn() ? 1 : -1)} style={{ minHeight: 36, paddingVertical: 2, paddingHorizontal: 14 }} />
        </View>
        <View style={[styles.row, { gap: 4 }]}>
          {(isEn() ? WEEK_EN : WEEK_SHORT).map((w) => <T key={w} kind="small" style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>{w}</T>)}
        </View>
        {Array.from({ length: cells.length / 7 }, (_, r) => (
          <View key={r} style={[styles.row, { gap: 4 }]}>
            {cells.slice(r * 7, r * 7 + 7).map((k, i) => {
              const kind = k ? dayKind(cyc, ci, k) : null;
              const on = k === pick;
              return (
                <Pressable key={k ?? `e${r}-${i}`} disabled={!k} onPress={() => { if (k) { play('tap'); setPick(k); } }} accessibilityRole="button" accessibilityLabel={k ? dateLabel(k) : undefined}
                  style={{ flex: 1, aspectRatio: 1, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', backgroundColor: color(kind), borderWidth: on || k === todayKey || kind === 'expected' ? 2 : 0, borderStyle: kind === 'expected' && !on && k !== todayKey ? 'dashed' : 'solid', borderColor: on ? c.petrol : k === todayKey ? c.ink : c.bad }}>
                  {k ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: kind === 'period' || kind === 'ovulation' ? '#FFFFFF' : c.ink }}>{num(Number(k.slice(8)))}</Text> : null}
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={[styles.row, { gap: 12, flexWrap: 'wrap' }]}>
          {([[c.bad, L('الدورة', 'Period')], [c.bad + '30', L('متوقعة', 'Expected')], [c.lime + '38', L('أيام التبويض', 'Fertile')], [c.lime, L('التبويض', 'Ovulation')]] as const).map(([col, t]) => (
            <View key={t} style={[styles.row, { gap: 4 }]}><View style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: col, borderWidth: 1, borderColor: c.line }} /><T kind="small">{t}</T></View>
          ))}
        </View>
      </Card>

      <Card>
        <T kind="h3">{dateLabel(pick)}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <Btn title={L('بداية دورة', 'Period started')} onPress={() => { play('check'); save(startPeriod(cyc, pick)); }} style={{ flex: 1 }} />
          <Btn kind="outline" title={L('نهاية الدورة', 'Period ended')} disabled={!ci.last || pick < ci.last} onPress={() => { play('check'); save(endPeriod(cyc, pick)); }} style={{ flex: 1 }} />
        </View>
        <T kind="small" color={c.muted}>{L('اختاري اليوم من التقويم فوق، أو من هنا:', 'Pick the day on the calendar above, or here:')}</T>
        <DateField value={pick} onChange={(k) => { setPick(k); setMonth(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1)); }} label={L('اليوم', 'Day')} />
      </Card>

      <Card>
        <T kind="h3">{L('طول الدورة عادة', 'Usual cycle length')}</T>
        <T kind="small">{L(`من التواريخ اللي اتسجلت: ${num(ci.len)} يوم، والدورة نفسها ${num(ci.days)} أيام. لو لسه مسجلتيش كتير، اكتبي الطول اللي تعرفيه.`, `From what's logged: ${ci.len} days, with ${ci.days}-day periods. If you haven't logged many yet, enter the length you know.`)}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput value={len} onChangeText={setLen} keyboardType="number-pad" placeholder="28" placeholderTextColor={c.muted} style={input} accessibilityLabel={L('طول الدورة بالأيام', 'Cycle length in days')} />
          <Btn title={L('حفظ', 'Save')} disabled={!(toNum(len) >= 21 && toNum(len) <= 40)} onPress={() => { play('check'); save({ periods: cyc?.periods ?? [], len: Math.round(toNum(len)) }); }} />
        </View>
      </Card>

      {cyc?.periods.length ? (
        <Card>
          <T kind="h3">{L('المسجل', 'Logged')}</T>
          {[...cyc.periods].reverse().map((x) => (
            <View key={x.start} style={[styles.rowBetween, { gap: 8 }]}>
              <T kind="body">{dateLabel(x.start)}{x.end ? L(` لـ ${dateLabel(x.end)}`, ` to ${dateLabel(x.end)}`) : ''}</T>
              <Pressable onPress={() => { play('remove'); save(removePeriod(cyc, x.start)); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={L('امسحي', 'Delete')}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.bad }}>{L('امسحي', 'Delete')}</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      ) : null}
      <T kind="small" color={c.muted}>{L('لو الدورة مش منتظمة كلمي دكتورة النسا.', 'If your cycle is irregular, talk to your gynaecologist.')}</T>
    </ScrollView></Bg>
  );
}
