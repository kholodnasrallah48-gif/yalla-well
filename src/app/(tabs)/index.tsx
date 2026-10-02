import { router } from 'expo-router';
import { Pressable, Switch, View } from 'react-native';

import { Btn, Card, MacroBar, NoteView, Ring, Screen, T, WeekStrip, styles } from '../../components/ui.tsx';
import { SCHEDULES } from '../../lib/data.ts';
import { fmt, totals, weekIndex } from '../../lib/day.ts';
import { genderFor, medical, sessionFor, targets, type Note } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { L, num, tx } from '../../lib/i18n.ts';
import { streaks } from '../../lib/streaks.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { useColors } from '../../theme.ts';

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
  const ses = sessionFor(profile, todayIdx, day.flare, programWeek(profile.start, new Date()));
  const left = T0.kcal - t.kcal;
  const notes = [...M.train, ...M.food].sort((a, b) => RANK[a.tone] - RANK[b.tone]).slice(0, 2);
  const st = streaks(profile, { ...history, [today]: day }, new Date());
  const greet = new Date().getHours() < 12 ? L('صباح الخير', 'Good morning') : L('مساء الخير', 'Good evening');

  return (
    <Screen title={`${greet}${profile.name ? L(' يا ', ', ') + profile.name : ''}`} themeToggle>
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

      <Card>
        <View style={[styles.row, { gap: 8 }]}>
          {([
            ['🔥', num(st.kcal), L(st.kcal === 1 ? 'يوم في السعرات' : 'أيام في السعرات', st.kcal === 1 ? 'day on target' : 'days on target')],
            ['💪', num(st.workout), L(st.workout === 1 ? 'تمرين ورا بعض' : 'تمارين ورا بعض', st.workout === 1 ? 'workout in a row' : 'workouts in a row')],
            ['⭐', num(st.points), L('نقطة', 'points')],
          ] as const).map(([icon, v, label]) => (
            <View key={icon} style={{ flex: 1, alignItems: 'center', gap: 2, backgroundColor: c.soft, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 4 }}>
              <T kind="h2" style={{ textAlign: 'center' }}>{icon} {v}</T>
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
        <T kind="label" color={c.onPetrol}>{tx(SCHEDULES[profile.schedule].n)}</T>
        <T kind="h2" color={c.onPetrol}>{ses ? L(`النهارده: ${ses.n} (${ses.place === 'gym' ? 'جيم' : 'بيت'})`, `Today: ${tx(ses.n)} (${ses.place === 'gym' ? 'gym' : 'home'})`) : L('النهارده راحة', 'Rest day today')}</T>
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
          <T kind="small">{L(`${day.water} / ${T0.waterCups} كوباية`, `${day.water} / ${T0.waterCups} cups`)}</T>
        </View>
        <View style={styles.wrap}>
          {Array.from({ length: T0.waterCups }, (_, i) => (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={L(`كوباية ${i + 1}`, `Cup ${i + 1}`)}
              onPress={() => { play(day.water === i + 1 ? 'remove' : i + 1 === T0.waterCups ? 'win' : 'tap'); updateDay((d) => ({ ...d, water: d.water === i + 1 ? i : i + 1 })); }}
              style={{ width: 30, height: 36, borderWidth: 1.5, borderColor: c.petrol, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: i < day.water ? c.aqua : 'transparent' }} />
          ))}
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
