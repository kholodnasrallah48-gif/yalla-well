import { router } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';

import { Badge, BoltIcon, DumbbellIcon, FlameIcon } from '../../components/Icons.tsx';
import { DailyFire } from '../../components/DailyFire.tsx';
import { CheckInCard, TodayDoses } from '../../components/health.tsx';
import { Btn, Card, MacroBar, NoteView, Ring, Screen, T, WeekStrip, lift, styles } from '../../components/ui.tsx';
import { SCHEDULES } from '../../lib/data.ts';
import { fmt, totals, weekIndex } from '../../lib/day.ts';
import { CUP_ML, genderFor, medical, sessionFor, targets, type Note } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { easyDay, medIds } from '../../lib/health.ts';
import { L, num, tx } from '../../lib/i18n.ts';
import { streaks } from '../../lib/streaks.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const FLAME = '#FF8A3D';
const RANK: Record<Note['tone'], number> = { bad: 0, warn: 1, info: 2 };

export default function Home() {
  const c = useColors();
  const { profile, day, updateDay, history, today } = useStore();
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  const M = medical(profile);
  const todayIdx = weekIndex(new Date());
  const ses = sessionFor(profile, todayIdx, easyDay(profile, day, new Date()).easy, programWeek(profile.start, new Date()));
  const careful = M.mod.anyCondition || profile.meds.length > 0 || medIds(profile).length > 0;
  const left = T0.kcal - t.kcal;
  const notes = [...M.train, ...M.food].sort((a, b) => RANK[a.tone] - RANK[b.tone]).slice(0, 2);
  const st = streaks(profile, { ...history, [today]: day }, new Date());
  const greet = new Date().getHours() < 12 ? L('صباح الخير', 'Good morning') : L('مساء الخير', 'Good evening');

  return (
    <Screen title={profile.name ? profile.name : greet} kicker={profile.name ? greet : undefined} bigTitle={!!profile.name} themeToggle>
      <DailyFire streak={st.kcal} />
      <Card>
        <View style={[styles.row, { gap: 16 }]}>
          <Ring value={t.kcal} max={T0.kcal} />
          <View style={{ flex: 1 }}>
            <T kind="big">{fmt(t.kcal)}</T>
            <T kind="small">{L(`من ${fmt(T0.kcal)} سعرة النهارده`, `of ${fmt(T0.kcal)} kcal today`)}</T>
            <T kind="small" color={left < 0 ? c.bad : c.ok}>{left >= 0 ? L(`فاضل ${fmt(left)} سعرة`, `${fmt(left)} kcal left`) : L(`زيادة ${fmt(-left)} سعرة`, `${fmt(-left)} kcal over`)}</T>
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 6 }}>
          <MacroBar label={L('بروتين', 'Protein')} value={t.p} target={T0.protein} />
          <MacroBar label={L('كارب', 'Carbs')} value={t.c} target={T0.carbs} />
          <MacroBar label={L('دهون', 'Fat')} value={t.f} target={T0.fat} />
        </View>
        <Btn kind="primary" title={L(g('سجّل أكل', 'سجّلي أكل'), 'Log food')} onPress={() => router.navigate('/food')} style={{ marginTop: 6 }} />
      </Card>

      <TodayDoses profile={profile} day={day} update={updateDay} g={g} />
      {careful ? <CheckInCard day={day} update={updateDay} g={g} /> : null}

      <Card>
        <View style={[styles.row, { gap: 8 }]}>
          {([
            ['kcal', FLAME, <FlameIcon key="i" />, num(st.kcal), L(st.kcal === 1 ? 'يوم في السعرات' : 'أيام في السعرات', st.kcal === 1 ? 'day on target' : 'days on target')],
            ['workout', c.petrol, <DumbbellIcon key="i" color={c.petrol} />, num(st.workout), L(st.workout === 1 ? 'تمرين ورا بعض' : 'تمارين ورا بعض', st.workout === 1 ? 'workout in a row' : 'workouts in a row')],
            ['points', c.lime, <BoltIcon key="i" color={c.lime} />, num(st.points), L('نقطة', 'points')],
          ] as const).map(([k, color, icon, v, label]) => (
            <View key={k} style={{ flex: 1, alignItems: 'center', gap: 4, backgroundColor: c.soft, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 4 }}>
              <Badge color={color}>{icon}</Badge>
              <T kind="h2" style={{ textAlign: 'center' }}>{v}</T>
              <T kind="small" style={{ textAlign: 'center' }}>{label}</T>
            </View>
          ))}
        </View>
        <T kind="small">{st.todayPoints
          ? L(`${g('جمعت', 'جمعتي')} ${num(st.todayPoints)} نقطة النهارده.`, `${num(st.todayPoints)} points today.`)
          : L(`${g('خليك', 'خليكي')} في حدود سعراتك ${g('وخلص', 'وخلصي')} تمرينك عشان الستريك يكمل.`, 'Stay within your calories and finish your workout to keep the streak going.')}
          {' '}{L(`السعرات بتتحسب لو ${g('أكلت', 'أكلتي')} من ٧٥٪ لـ١١٠٪ من هدفك.`, 'Calories count when you eat 75–110% of your target.')}</T>
      </Card>

      <Card tone="petrol">
        <T kind="label" color={c.onHero}>{tx(SCHEDULES[profile.schedule].n)}</T>
        <T kind="h2" color={c.onHero}>{ses ? L(`النهارده: ${ses.n} (${ses.place === 'gym' ? 'جيم' : 'بيت'})`, `Today: ${tx(ses.n)} (${ses.place === 'gym' ? 'gym' : 'home'})`) : L('النهارده راحة', 'Rest day today')}</T>
        <WeekStrip profile={profile} today={todayIdx} />
        {ses ? <Btn title={L(g('ابدأ التمرين', 'ابدأي التمرين'), 'Start workout')} onPress={() => router.navigate('/train')} style={{ marginTop: 6 }} /> : null}
      </Card>

      <Pressable onPress={() => router.push('/report')} accessibilityRole="button">
        <Card>
          <View style={[styles.row, { gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <T kind="h3">{L('تقرير الأسبوع', 'Weekly report')}</T>
              <T kind="small">{L(`${g('حققت', 'حققتي')} إيه وإيه محتاج يتحسن، ${g('وتقدر', 'وتقدري')} ${g('تطبعه', 'تطبعيه')}.`, 'What you achieved and what needs work, ready to print.')}</T>
            </View>
            <T kind="h2" color={c.petrol}>{L('‹', '›')}</T>
          </View>
        </Card>
      </Pressable>

      {careful ? (
        <Pressable onPress={() => router.push('/health')} accessibilityRole="button">
          <Card>
            <View style={[styles.row, { gap: 12 }]}>
              <View style={{ flex: 1 }}>
                <T kind="h3">{L('صحتي', 'My health')}</T>
                <T kind="small">{L('مواعيد الأدوية، التحاليل، وتقرير للدكتور.', 'Medicine times, lab results and a report for your doctor.')}</T>
              </View>
              <T kind="h2" color={c.petrol}>{L('‹', '›')}</T>
            </View>
          </Card>
        </Pressable>
      ) : null}

      {M.mod.anyCondition ? (
        <Card>
          <View style={[styles.row, { gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <T kind="h3">{L(`${g('حاسس', 'حاسة')} بإرهاق أو نشاط للمرض النهارده؟`, 'Feeling fatigued or having a flare-up today?')}</T>
              <T kind="small">{L('هنحوّل تمرين النهارده ليوم تعافي خفيف.', "We'll switch today's workout to a light recovery day.")}</T>
            </View>
            <Switch value={day.flare} onValueChange={(v) => updateDay((d) => ({ ...d, flare: v }))}
              trackColor={{ true: c.petrol, false: c.line }} thumbColor={c.surface} accessibilityLabel={L('يوم تعافي', 'Recovery day')} />
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.rowBetween}>
          <T kind="h2">{L('المياه', 'Water')}</T>
          <T kind="h3" color={c.petrol}>{L(`${fmt(Math.round(day.water * CUP_ML))} / ${fmt(T0.waterCups * CUP_ML)} مل`, `${fmt(Math.round(day.water * CUP_ML))} / ${fmt(T0.waterCups * CUP_ML)} ml`)}</T>
        </View>
        <View style={{ height: 8, borderRadius: 99, backgroundColor: c.soft, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: `${Math.min(100, (day.water / T0.waterCups) * 100)}%`, backgroundColor: c.lime, borderRadius: 99 }} />
        </View>
        <T kind="small">{L(`${fmt(Math.floor(day.water))} من ${T0.waterCups} كوبايات (الكوباية ${CUP_ML} مل)`, `${fmt(Math.floor(day.water))} of ${T0.waterCups} cups (a cup is ${CUP_ML} ml)`)}</T>
        <View style={styles.wrap}>
          {Array.from({ length: T0.waterCups }, (_, i) => (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={L(`كوباية ${i + 1}`, `Cup ${i + 1}`)}
              onPress={() => { const n = Math.floor(day.water) === i + 1 ? i : i + 1; play(n < day.water ? 'remove' : n >= T0.waterCups ? 'win' : 'tap'); updateDay((d) => ({ ...d, water: n })); }}
              style={{ width: 30, height: 36, borderWidth: 1.5, borderColor: c.lime, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: i < Math.floor(day.water) ? c.lime : 'transparent' }} />
          ))}
        </View>
        <T kind="label">{L(g('شربت إزازة؟ ضيفها مرة واحدة:', 'شربتي إزازة؟ ضيفيها مرة واحدة:'), 'Had a bottle? Add it in one go:')}</T>
        <View style={styles.wrap}>
          {[250, 330, 500, 1000, 1500].map((ml) => (
            <Pressable key={ml} accessibilityRole="button" onPress={() => { const n = day.water + ml / CUP_ML; play(n >= T0.waterCups && day.water < T0.waterCups ? 'win' : 'add'); updateDay((d) => ({ ...d, water: Math.round((d.water + ml / CUP_ML) * 100) / 100 })); }}
              style={({ pressed }) => [styles.chip, { borderColor: c.lime, backgroundColor: c.surface }, lift(c, 'sm'), pressed && styles.pressed]}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink }}>+ {ml >= 1000 ? L(`${ml / 1000} لتر`, `${ml / 1000} L`) : L(`${ml} مل`, `${ml} ml`)}</Text>
            </Pressable>
          ))}
          {day.water > 0 ? (
            <Pressable accessibilityRole="button" onPress={() => { play('remove'); updateDay((d) => ({ ...d, water: 0 })); }}
              style={({ pressed }) => [styles.chip, { borderColor: c.line, backgroundColor: c.surface }, pressed && styles.pressed]}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.muted }}>{L('صفّر', 'Reset')}</Text>
            </Pressable>
          ) : null}
        </View>
      </Card>

      {notes.length ? (
        <Card>
          <T kind="h2">{L('مراعاة لحالتك', 'For your condition')}</T>
          {notes.map((n, i) => <NoteView key={i} note={n} />)}
          <Btn kind="text" title={L('كل الملاحظات', 'All notes')} onPress={() => router.navigate('/me')} />
        </Card>
      ) : null}

      <T kind="small" style={{ textAlign: 'center' }}>{L('التطبيق ده للمساعدة ومش بديل عن دكتورك. أي تغيير في الأدوية أو الأكل لازم يبقى بإشرافه.', "This app is here to help and doesn't replace your doctor. Any change to your medication or diet should be supervised by them.")}</T>
    </Screen>
  );
}
