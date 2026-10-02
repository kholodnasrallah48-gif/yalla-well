import { router } from 'expo-router';
import { Pressable, Switch, View } from 'react-native';

import { Btn, Card, MacroBar, NoteView, Ring, Screen, T, WeekStrip, styles } from '../../components/ui.tsx';
import { SCHEDULES } from '../../lib/data.ts';
import { fmt, totals, weekIndex } from '../../lib/day.ts';
import { genderFor, medical, sessionFor, targets, type Note } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { useStore } from '../../store/AppStore.tsx';
import { useColors } from '../../theme.ts';

const RANK: Record<Note['tone'], number> = { bad: 0, warn: 1, info: 2 };

export default function Home() {
  const c = useColors();
  const { profile, day, updateDay } = useStore();
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  const M = medical(profile);
  const todayIdx = weekIndex(new Date());
  const ses = sessionFor(profile, todayIdx, day.flare, programWeek(profile.start, new Date()));
  const left = T0.kcal - t.kcal;
  const notes = [...M.train, ...M.food].sort((a, b) => RANK[a.tone] - RANK[b.tone]).slice(0, 2);
  const greet = new Date().getHours() < 12 ? 'صباح الخير' : 'مساء الخير';

  return (
    <Screen title={`${greet}${profile.name ? ' يا ' + profile.name : ''}`} themeToggle>
      <Card>
        <View style={[styles.row, { gap: 16 }]}>
          <Ring value={t.kcal} max={T0.kcal} />
          <View style={{ flex: 1 }}>
            <T kind="big">{fmt(t.kcal)}</T>
            <T kind="small">من {fmt(T0.kcal)} سعرة النهارده</T>
            <T kind="small" color={left < 0 ? c.bad : c.ok}>{left >= 0 ? `فاضل ${fmt(left)} سعرة` : `زيادة ${fmt(-left)} سعرة`}</T>
          </View>
        </View>
        <View style={{ gap: 8, marginTop: 6 }}>
          <MacroBar label="بروتين" value={t.p} target={T0.protein} />
          <MacroBar label="كارب" value={t.c} target={T0.carbs} />
          <MacroBar label="دهون" value={t.f} target={T0.fat} />
        </View>
        <Btn kind="outline" title={g('سجّل أكل', 'سجّلي أكل')} onPress={() => router.navigate('/food')} style={{ marginTop: 6 }} />
      </Card>

      <Card tone="petrol">
        <T kind="label" color={c.onPetrol}>{SCHEDULES[profile.schedule].n}</T>
        <T kind="h2" color={c.onPetrol}>{ses ? `النهارده: ${ses.n} (${ses.place === 'gym' ? 'جيم' : 'بيت'})` : 'النهارده راحة'}</T>
        <WeekStrip profile={profile} today={todayIdx} />
        {ses ? <Btn title={g('ابدأ التمرين', 'ابدأي التمرين')} onPress={() => router.navigate('/train')} style={{ marginTop: 6 }} /> : null}
      </Card>

      {M.mod.anyCondition ? (
        <Card>
          <View style={[styles.row, { gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <T kind="h3">{g('حاسس', 'حاسة')} بإرهاق أو نشاط للمرض النهارده؟</T>
              <T kind="small">هنحوّل تمرين النهارده ليوم تعافي خفيف.</T>
            </View>
            <Switch value={day.flare} onValueChange={(v) => updateDay((d) => ({ ...d, flare: v }))}
              trackColor={{ true: c.petrol, false: c.line }} thumbColor={c.surface} accessibilityLabel="يوم تعافي" />
          </View>
        </Card>
      ) : null}

      <Card>
        <View style={styles.rowBetween}>
          <T kind="h2">المياه</T>
          <T kind="small">{day.water} / {T0.waterCups} كوباية</T>
        </View>
        <View style={styles.wrap}>
          {Array.from({ length: T0.waterCups }, (_, i) => (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={`كوباية ${i + 1}`}
              onPress={() => updateDay((d) => ({ ...d, water: d.water === i + 1 ? i : i + 1 }))}
              style={{ width: 30, height: 36, borderWidth: 1.5, borderColor: c.petrol, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, backgroundColor: i < day.water ? c.aqua : 'transparent' }} />
          ))}
        </View>
      </Card>

      {notes.length ? (
        <Card>
          <T kind="h2">مراعاة لحالتك</T>
          {notes.map((n, i) => <NoteView key={i} note={n} />)}
          <Btn kind="text" title="كل الملاحظات" onPress={() => router.navigate('/me')} />
        </Card>
      ) : null}

      <T kind="small" style={{ textAlign: 'center' }}>التطبيق ده للمساعدة ومش بديل عن دكتورك. أي تغيير في الأدوية أو الأكل لازم يبقى بإشرافه.</T>
    </Screen>
  );
}
