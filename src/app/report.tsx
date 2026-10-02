// Weekly report: wins and misses for one Saturday-to-Friday week, a row per day, and print/share as PDF.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, T, styles } from '../components/ui.tsx';
import { dayKey, fmt, type DayLog } from '../lib/day.ts';
import { FOODS } from '../lib/foods.ts';
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
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">تقرير الأسبوع</T>
        <Btn kind="outline" title="رجوع" onPress={() => router.back()} />
      </View>
      <View style={[styles.row, { gap: 10 }]}>
        <Arrow label="اللي قبله" onPress={() => setOffset(offset + 1)} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <T kind="h3">{offset === 0 ? 'الأسبوع ده' : offset === 1 ? 'الأسبوع اللي فات' : `من ${offset} أسابيع`}</T>
          <T kind="small">{dayName(start)} {shortDate(start)} لـ الجمعة {shortDate(weekKeys(start)[6])}</T>
        </View>
        <Arrow label="اللي بعده" onPress={() => setOffset(offset - 1)} disabled={offset === 0} />
      </View>

      {!r ? <ActivityIndicator color={c.petrol} /> : (
        <>
          <Card>
            <T kind="h2" color={c.ok}>{g('حققت', 'حققتي')}</T>
            {r.wins.length ? r.wins.map((w, i) => (
              <View key={i} style={{ backgroundColor: c.okBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}><T kind="small" color={c.ok}>✓ {w}</T></View>
            )) : <T kind="small">لسه مفيش حاجة {g('سجلتها', 'سجلتيها')} الأسبوع ده.</T>}
          </Card>
          <Card>
            <T kind="h2" color={c.bad}>محتاج يتحسن</T>
            {r.misses.length ? r.misses.map((m, i) => (
              <View key={i} style={{ backgroundColor: c.badBg, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 }}><T kind="small" color={c.bad}>✗ {m}</T></View>
            )) : <T kind="small">ولا حاجة، أسبوع ممتاز.</T>}
          </Card>
          <Card>
            <T kind="h2">كل يوم</T>
            {r.days.map((d, i) => (
              <View key={d.key} style={[styles.row, { gap: 8, paddingVertical: 7, borderBottomWidth: i < 6 ? 1 : 0, borderColor: c.line, opacity: d.future ? 0.45 : 1 }]}>
                <View style={{ width: 82 }}>
                  <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{dayName(d.date)}</T>
                  <T kind="small">{shortDate(d.date)}</T>
                </View>
                <View style={{ flex: 1 }}>
                  {d.future ? <T kind="small">لسه</T> : d.logged ? (
                    <T kind="small" color={d.kcal > T0.kcal * 1.05 || d.f > T0.fat ? c.bad : undefined}>
                      {fmt(d.kcal)} سعرة · ب {fmt(d.p)} · د {fmt(d.f)} جم
                    </T>
                  ) : <T kind="small" color={c.warn}>مفيش أكل متسجل</T>}
                  {d.future ? null : (
                    <T kind="small">
                      مياه {d.water}/{T0.waterCups} · {d.workout ? `${d.workout.done >= Math.ceil(d.workout.of / 2) ? '✓' : '✗'} ${d.workout.name}` : 'راحة'}
                    </T>
                  )}
                </View>
              </View>
            ))}
          </Card>
          <Btn title={g('اطبع أو شارك التقرير', 'اطبعي أو شاركي التقرير')} onPress={print} />
          <T kind="small">بيفتح صفحة الطباعة في الموبايل، ومنها {g('تقدر', 'تقدري')} {g('تحفظه', 'تحفظيه')} PDF أو {g('تبعته', 'تبعتيه')} لحد.</T>
        </>
      )}
    </ScrollView>
  );
}
