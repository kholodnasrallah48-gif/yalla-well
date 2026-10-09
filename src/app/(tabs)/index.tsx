import { router } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';

import { DailyFire } from '../../components/DailyFire.tsx';
import { CheckInCard, TodayDoses } from '../../components/health.tsx';
import { CaptainCard, MealBar, ScoreRow, type Seg } from '../../components/match.tsx';
import { Mascot } from '../../components/Mascot.tsx';
import { TourTarget } from '../../components/TourTarget.tsx';
import { Btn, Card, CountUp, MacroBar, NoteView, RADIUS, Rise, Screen, T, WeekStrip, styles } from '../../components/ui.tsx';
import { homeLine } from '../../lib/captain.ts';
import { dayKey, fmt, mealTotals, planned, totals, weekIndex } from '../../lib/day.ts';
import { CUP_ML, genderFor, medical, sessionFor, splitLabel, targets, type Note } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { easyDay, medIds } from '../../lib/health.ts';
import { L, num } from '../../lib/i18n.ts';
import { MEALS, MEAL_NAME } from '../../lib/mealplan.ts';
import { streaks } from '../../lib/streaks.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const RANK: Record<Note['tone'], number> = { bad: 0, warn: 1, info: 2 };

export default function Home() {
  const c = useColors();
  const { profile, day, updateDay, history, today } = useStore();
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  const M = medical(profile);
  const now = new Date();
  const todayIdx = weekIndex(now);
  const week = programWeek(profile.start, now);
  const ses = sessionFor(profile, todayIdx, easyDay(profile, day, now).easy, week);
  const careful = M.mod.anyCondition || profile.meds.length > 0 || medIds(profile).length > 0;
  const left = T0.kcal - t.kcal;
  const notes = [...M.train, ...M.food].sort((a, b) => RANK[a.tone] - RANK[b.tone]).slice(0, 2);
  const st = streaks(profile, { ...history, [today]: day }, now);
  const greet = now.getHours() < 12 ? L('صباح الخير', 'Good morning') : L('مساء الخير', 'Good evening');
  const doneN = ses ? ses.items.filter((x) => day.done.includes(x.id)).length : 0;
  const finished = !!ses && ses.items.length > 0 && doneN >= ses.items.length;
  const workout = ses ? (ses.place === 'home' ? L('تمرين بيت', 'a home workout') : splitLabel(ses.id)) : null;
  const line = homeLine({ g, name: profile.name, hour: now.getHours(), kcalStreak: st.kcal, left, target: T0.kcal, eaten: t.kcal, workout, done: doneN, total: ses?.items.length ?? 0 });
  const dayNo = profile.start ? Math.max(1, Math.floor((Date.parse(today) - Date.parse(profile.start)) / 86400000) + 1) : 1;

  // The meal bar: meals ticked as eaten, food logged in meals not ticked yet, and what's left.
  const ticked = day.meals ?? [];
  const segs: Seg[] = MEALS.filter((m) => ticked.includes(m)).map((m) => ({ kcal: mealTotals(day, m).kcal, label: MEAL_NAME[m], kind: 'done' }));
  const loose = day.foods.filter((x) => !x.meal).reduce((a, f) => a + f.kcal * f.q, 0);
  if (loose) segs.push({ kcal: loose, label: L('تاني', 'Other'), kind: 'done' });
  const waiting = planned(day).kcal - t.kcal;
  if (waiting > 0) segs.push({ kcal: waiting, label: L('لسه متعلمتش', 'Not ticked'), kind: 'wait' });
  const next = MEALS.find((m) => !ticked.includes(m));
  if (left - waiting > 0) segs.push({ kcal: left - waiting, label: next ? `${MEAL_NAME[next]}${L('؟', '?')}` : L('فاضل', 'Left'), kind: 'left' });
  else if (left < 0) segs.push({ kcal: -left, label: L('زيادة', 'Over'), kind: 'over' });

  // This week's days with the workout done, for the head dots.
  const done = Array.from({ length: 7 }, (_, i) => {
    if (i > todayIdx) return false;
    if (i === todayIdx) return finished;
    const d = new Date(now); d.setDate(d.getDate() - (todayIdx - i));
    const log = history[dayKey(d)];
    const s = sessionFor(profile, i, false, programWeek(profile.start, d));
    return !!log && !!s && s.items.length > 0 && log.done.length >= s.items.length - 1;
  });

  return (
    <Screen title={profile.name ? profile.name : greet} kicker={profile.name ? greet : undefined} bigTitle={!!profile.name} themeToggle name="index">
      <DailyFire streak={st.kcal} />
      <Rise>
        <CaptainCard pose="cheer" excited={finished} head={line.head} body={line.body} big={String(dayNo)} caption={L(`يوم ${dayNo}`, `Day ${dayNo}`)} />
      </Rise>

      <Rise i={1}>
        <TourTarget id="home.left" style={{ gap: 2 }}>
          <View style={styles.rowBetween}>
            <T kind="small">{left >= 0 ? L('فاضلك النهارده', 'Left today') : L(`${g('عديت', 'عديتي')} النهارده بـ`, 'Over today by')}</T>
          </View>
          <View style={[styles.row, { gap: 12, alignItems: 'flex-end' }]}>
            <CountUp value={Math.abs(left)} format={fmt} size={96} weight="black" color={left >= 0 ? c.petrol : c.bad} style={{ lineHeight: 92 }} />
            <View style={{ paddingBottom: 8 }}>
              <T kind="h2" style={{ fontSize: 22, lineHeight: 30 }}>{L('سعرة', 'kcal')}</T>
              <T kind="small">{L(`من ${fmt(T0.kcal)} · ${g('أكلت', 'أكلتي')} ${fmt(t.kcal)}`, `of ${fmt(T0.kcal)} · eaten ${fmt(t.kcal)}`)}</T>
            </View>
          </View>
        </TourTarget>
      </Rise>

      <Rise i={2}>
        <TourTarget id="home.bar" style={{ gap: 10 }}>
          <MealBar segs={segs} />
          <View>
            <MacroBar label={L('بروتين', 'Protein')} value={t.p} target={T0.protein} />
            <MacroBar label={L('كارب', 'Carbs')} value={t.c} target={T0.carbs} />
            <MacroBar label={L('دهون', 'Fat')} value={t.f} target={T0.fat} />
          </View>
          <Btn kind="outline" title={L(g('سجل أكل', 'سجلي أكل'), 'Log food')} onPress={() => router.navigate('/food')} />
        </TourTarget>
      </Rise>

      <TodayDoses profile={profile} day={day} update={updateDay} g={g} />
      {careful ? <CheckInCard day={day} update={updateDay} g={g} /> : null}

      <Rise i={3}>
        <TourTarget id="home.week">
          <WeekStrip profile={profile} today={todayIdx} done={done} onSelect={() => router.navigate('/train')} />
        </TourTarget>
      </Rise>

      <Rise i={4}>
        <TourTarget id="home.today">
          {ses ? (
            <Card tone="accent" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 }}>
              <View style={{ flex: 1 }}>
                <T kind="label" color={c.onPetrol} style={{ fontFamily: fonts.displaySemi }}>{L(`تمرين النهارده · ${ses.place === 'gym' ? 'جيم' : 'بيت'}`, `Today's workout · ${ses.place === 'gym' ? 'gym' : 'home'}`)}</T>
                <T kind="h1" color={c.onPetrol} style={{ fontSize: 38, lineHeight: 54 }} numberOfLines={1}>{splitLabel(ses.id)}</T>
                <T kind="label" color={c.onPetrol}>{finished ? L(`${g('خلصته', 'خلصتيه')}! برافو`, 'Done! Well played') : L(`${num(ses.items.length)} تمارين · ${g('خلصت', 'خلصتي')} ${num(doneN)}`, `${ses.items.length} exercises · ${doneN} done`)}</T>
              </View>
              <View style={{ alignItems: 'center', gap: 6 }}>
                <Mascot pose={finished ? 'cheer' : 'lift'} size={58} color={c.onPetrol} head={c.onPetrol} excited={finished} />
                <Btn kind="dark" sound="whistle" title={finished ? L('شوف', 'View') : doneN ? L('كمل', 'Continue') : L('يلا نبدأ', "Let's go")} onPress={() => router.navigate('/train')} style={{ paddingHorizontal: 16, minHeight: 44, paddingVertical: 8 }} />
              </View>
            </Card>
          ) : (
            <Card tone="petrol" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <T kind="label">{L('النهارده', 'Today')}</T>
                <T kind="h1" style={{ fontSize: 34, lineHeight: 50 }}>{L('راحة', 'Rest day')}</T>
                <T kind="small">{L(`مشي خفيف ٢٠ دقيقة أو إطالات لو ${g('حابب', 'حابة')}.`, 'A light 20-minute walk or some stretching if you like.')}</T>
              </View>
              <Mascot pose="rest" size={58} />
            </Card>
          )}
        </TourTarget>
      </Rise>

      <Rise i={5}>
        <ScoreRow items={[
          { value: String(st.kcal), label: L(st.kcal === 1 ? 'يوم في السعرات' : 'أيام في السعرات', st.kcal === 1 ? 'day on target' : 'days on target'), color: st.kcal ? c.petrol : undefined },
          { value: String(st.workout), label: L('تمارين ورا بعض', 'workouts in a row') },
          { value: String(st.points), label: st.todayPoints ? L(`نقطة (+${st.todayPoints} النهارده)`, `points (+${st.todayPoints} today)`) : L('نقطة', 'points') },
        ]} />
      </Rise>

      <TourTarget id="home.water">
        <Card>
          <View style={styles.rowBetween}>
            <T kind="h2">{L('المياه', 'Water')}</T>
            <Text style={{ fontFamily: fonts.numSemi, fontSize: 22, color: c.lime }}>{fmt(Math.round(day.water * CUP_ML))}<Text style={{ fontSize: 15, color: c.muted }}> / {fmt(T0.waterCups * CUP_ML)} {L('مل', 'ml')}</Text></Text>
          </View>
          <View style={[styles.wrap, { gap: 6 }]}>
            {Array.from({ length: T0.waterCups }, (_, i) => {
              const full = i < Math.floor(day.water);
              return (
                <Pressable key={i} accessibilityRole="button" accessibilityLabel={L(`كوباية ${i + 1}`, `Cup ${i + 1}`)} accessibilityState={{ selected: full }} hitSlop={3}
                  onPress={() => { const n = Math.floor(day.water) === i + 1 ? i : i + 1; play(n < day.water ? 'remove' : n >= T0.waterCups ? 'win' : 'pop'); updateDay((d) => ({ ...d, water: n })); }}
                  style={({ pressed }) => [{ width: 26, height: 34, borderWidth: 1.5, borderColor: c.lime, borderRadius: 2, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: full ? c.lime : 'transparent' }, pressed && { transform: [{ scale: 0.9 }] }]} />
              );
            })}
          </View>
          <View style={styles.wrap}>
            {[250, 330, 500, 1000, 1500].map((ml) => (
              <Pressable key={ml} accessibilityRole="button" onPress={() => { const n = day.water + ml / CUP_ML; play(n >= T0.waterCups && day.water < T0.waterCups ? 'win' : 'add'); updateDay((d) => ({ ...d, water: Math.round((d.water + ml / CUP_ML) * 100) / 100 })); }}
                style={({ pressed }) => [styles.chip, { borderColor: c.line, paddingHorizontal: 10 }, pressed && styles.pressed]}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink }}>+ {ml >= 1000 ? L(`${ml / 1000} لتر`, `${ml / 1000} L`) : L(`${ml} مل`, `${ml} ml`)}</Text>
              </Pressable>
            ))}
            {day.water > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => { play('remove'); updateDay((d) => ({ ...d, water: 0 })); }}
                style={({ pressed }) => [styles.chip, { borderColor: 'transparent' }, pressed && styles.pressed]}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.muted }}>{L('صفر', 'Reset')}</Text>
              </Pressable>
            ) : null}
          </View>
        </Card>
      </TourTarget>

      {M.mod.anyCondition ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <T kind="h3">{L(`${g('حاسس', 'حاسة')} بإرهاق أو نشاط للمرض النهارده؟`, 'Feeling fatigued or having a flare-up today?')}</T>
            <T kind="small">{L('هنحول تمرين النهارده ليوم تعافي خفيف.', "We'll switch today's workout to a light recovery day.")}</T>
          </View>
          <Switch value={day.flare} onValueChange={(v) => { play('tap'); updateDay((d) => ({ ...d, flare: v })); }}
            trackColor={{ true: c.petrol, false: c.line }} thumbColor={c.ink} accessibilityLabel={L('يوم تعافي', 'Recovery day')} />
        </Card>
      ) : null}

      <View style={{ borderTopWidth: 1, borderColor: c.line }}>
        {([
          ['/report', L('تقرير الأسبوع', 'Weekly report'), L(`${g('كسبت', 'كسبتي')} إيه وإيه محتاج يتظبط، للطباعة.`, 'What went well and what needs work, ready to print.')],
          ...(careful ? [['/health', L('صحتي', 'My health'), L('مواعيد الأدوية والتحاليل وتقرير للدكتور.', 'Medicine times, lab results and a doctor report.')]] : []),
        ] as ['/report' | '/health', string, string][]).map(([href, title, sub]) => (
          <Pressable key={href} onPress={() => { play('tap'); router.push(href); }} accessibilityRole="button"
            style={({ pressed }) => [styles.row, { gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderColor: c.line }, pressed && { opacity: 0.7 }]}>
            <View style={{ flex: 1 }}>
              <T kind="h3">{title}</T>
              <T kind="small">{sub}</T>
            </View>
            <View style={{ width: 32, height: 32, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 16, color: c.petrol }}>{L('‹', '›')}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {notes.length ? (
        <Card>
          <T kind="h2">{L('مراعاة لحالتك', 'For your condition')}</T>
          {notes.map((n, i) => <NoteView key={i} note={n} />)}
          <Btn kind="text" title={L('كل الملاحظات', 'All notes')} onPress={() => router.navigate('/me')} />
        </Card>
      ) : null}

      <T kind="small" color={c.dim} style={{ textAlign: 'center' }}>{L('التطبيق ده للمساعدة ومش بديل عن دكتورك. أي تغيير في الأدوية أو الأكل لازم يبقى بإشرافه.', "This app is here to help and doesn't replace your doctor. Any change to your medication or diet should be supervised by them.")}</T>
    </Screen>
  );
}
