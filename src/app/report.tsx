// Weekly report: wins and misses for one Saturday-to-Friday week, a row per day, and print/share as PDF.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bg, Btn, Card, T, styles } from '../components/ui.tsx';
import { dayKey, fmt, type DayLog } from '../lib/day.ts';
import { FOODS } from '../lib/foods.ts';
import { L, tx } from '../lib/i18n.ts';
import { genderFor, targets } from '../lib/plan.ts';
import { dayName, reportHTML, shortDate, weekKeys, weekReport, weekStart } from '../lib/report.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

export default function Report() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, custom, readDay, day } = useStore();
  const [offset, setOffset] = useState(0);
  const [logs, setLogs] = useState<Record<string, DayLog | null> | null>(null);
  const start = useMemo(() => weekStart(new Date(), offset), [offset]);
  useEffect(() => {
    let live = true;
    setLogs(null);
    const keys = weekKeys(start).map(dayKey);
    Promise.all(keys.map(readDay)).then((xs) => { if (live) setLogs(Object.fromEntries(keys.map((k, i) => [k, xs[i]]))); });
    return () => { live = false; };
  }, [start, day]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const r = logs ? weekReport(profile, start, logs, new Date(), [...FOODS, ...custom]) : null;
  const print = () => { if (r) Print.printAsync({ html: reportHTML(profile, r) }).catch(() => {}); };

  const Arrow = ({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) => (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button"
      style={{ minHeight: 40, paddingHorizontal: 10, borderRadius: 12, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1 }}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.petrol }}>{label}</Text>
    </Pressable>
  );

  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('تقرير الأسبوع', 'Weekly report')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>
      <View style={[styles.row, { gap: 10 }]}>
        <Arrow label={L('اللي قبله', 'Previous')} onPress={() => setOffset(offset + 1)} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T kind="h3">{offset === 0 ? L('الأسبوع ده', 'This week') : offset === 1 ? L('الأسبوع اللي فات', 'Last week') : L(`من ${offset} أسابيع`, `${offset} weeks ago`)}</T>
          <T kind="small">{dayName(start)} {shortDate(start)} {L('لـ الجمعة', 'to Friday')} {shortDate(weekKeys(start)[6])}</T>
        </View>
        <Arrow label={L('اللي بعده', 'Next')} onPress={() => setOffset(offset - 1)} disabled={offset === 0} />
      </View>

      {!r ? <ActivityIndicator color={c.petrol} /> : (
        <>
          <Card>
            <T kind="h2" color={c.ok}>{L(g('حققت', 'حققتي'), 'Wins')}</T>
            {r.wins.length ? r.wins.map((w, i) => (
              <View key={i} style={{ backgroundColor: c.okBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}><T kind="small" color={c.ok}>✓ {w}</T></View>
            )) : <T kind="small">{L(`لسه مفيش حاجة ${g('سجلتها', 'سجلتيها')} الأسبوع ده.`, "You haven't logged anything this week yet.")}</T>}
          </Card>
          <Card>
            <T kind="h2" color={c.bad}>{L('محتاج يتحسن', 'Needs work')}</T>
            {r.misses.length ? r.misses.map((m, i) => (
              <View key={i} style={{ backgroundColor: c.badBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}><T kind="small" color={c.bad}>✗ {m}</T></View>
            )) : <T kind="small">{L('ولا حاجة، أسبوع ممتاز.', 'Nothing, great week.')}</T>}
          </Card>
          <Card>
            <T kind="h2">{L('كل يوم', 'Day by day')}</T>
            {r.days.map((d, i) => (
              <View key={d.key} style={[styles.row, { gap: 8, paddingVertical: 7, borderBottomWidth: i < 6 ? 1 : 0, borderColor: c.line, opacity: d.future ? 0.45 : 1 }]}>
                <View style={{ width: 82 }}>
                  <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{dayName(d.date)}</T>
                  <T kind="small">{shortDate(d.date)}</T>
                </View>
                <View style={{ flex: 1 }}>
                  {d.future ? <T kind="small">{L('لسه', 'Not yet')}</T> : d.logged ? (
                    <T kind="small" color={d.kcal > T0.kcal * 1.05 || d.f > T0.fat ? c.bad : undefined}>
                      {L(`${fmt(d.kcal)} سعرة · ب ${fmt(d.p)} · د ${fmt(d.f)} جم`, `${fmt(d.kcal)} kcal · P ${fmt(d.p)} · F ${fmt(d.f)} g`)}
                    </T>
                  ) : <T kind="small" color={c.warn}>{L('مفيش أكل متسجل', 'No food logged')}</T>}
                  {d.future ? null : (
                    <T kind="small">
                      {L('مياه', 'Water')} {Math.round(d.water * 10) / 10}/{T0.waterCups} · {d.workout ? `${d.workout.done >= Math.ceil(d.workout.of / 2) ? '✓' : '✗'} ${tx(d.workout.name)}` : L('راحة', 'Rest')}
                    </T>
                  )}
                </View>
              </View>
            ))}
          </Card>
          <Btn title={L(g('اطبع أو شارك التقرير', 'اطبعي أو شاركي التقرير'), 'Print or share the report')} onPress={print} />
          <T kind="small">{L(`بيفتح صفحة الطباعة في الموبايل، ومنها ${g('تقدر', 'تقدري')} ${g('تحفظه', 'تحفظيه')} PDF أو ${g('تبعته', 'تبعتيه')} لحد.`, 'This opens the print screen on your phone, where you can save it as a PDF or send it to someone.')}</T>
        </>
      )}
    </ScrollView></Bg>
  );
}
