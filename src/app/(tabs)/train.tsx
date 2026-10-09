import { EasyBanner } from '../../components/health.tsx';
import { easyDay } from '../../lib/health.ts';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AddExercise } from '../../components/AddExercise.tsx';
import { CaptainCard } from '../../components/match.tsx';
import { TourTarget, tourActions } from '../../components/TourTarget.tsx';
import { Btn, Card, Kicker, NoteView, Num, RADIUS, RoundCheck, Rise, Screen, Segmented, T, WeekStrip, styles } from '../../components/ui.tsx';
import { trainLine } from '../../lib/captain.ts';
import { GEAR, WEEK } from '../../lib/data.ts';
import { dayKey, weekIndex, type DayLog } from '../../lib/day.ts';
import { allGymChoices, genderFor, medical, sessionFor, splitLabel, weekPlaces, weekSessions, type DayPlace, type PlannedExercise } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { L, num, tx } from '../../lib/i18n.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const two = (n: number) => String(n).padStart(2, '0');
const clock = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return `${two(Math.floor(s / 60))}:${two(s % 60)}`; };

/** The match clock: how long today's workout has been going (frozen once it's finished). */
function MatchClock({ start, end }: { start?: number; end?: number }) {
  const c = useColors();
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!start || end) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [start, end]);
  if (!start) return null;
  return (
    <View style={{ alignItems: 'flex-end', marginTop: 10 }} accessibilityLabel={L('وقت التمرين', 'Workout time')}>
      <View style={[styles.row, { gap: 6 }]}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: end ? c.dim : c.petrol }} />
        <T kind="label" style={{ fontSize: 11 }}>{end ? L('خلص في', 'Finished in') : L('وقت الماتش', 'Match clock')}</T>
      </View>
      <Num size={30}>{clock((end ?? now) - start)}</Num>
    </View>
  );
}

export default function Train() {
  const c = useColors();
  const { profile, day, readDay, updateDay, saveProfile } = useStore();
  const todayIdx = weekIndex(new Date());
  const [sel, setSel] = useState(todayIdx);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState('');
  // Only today can be ticked: earlier days are closed and kept as they were for the report; later days are ahead.
  const selDate = new Date(); selDate.setDate(selDate.getDate() + sel - todayIdx);
  const selKey = dayKey(selDate);
  const [other, setOther] = useState<DayLog | null>(null);
  useEffect(() => {
    let live = true;
    setOther(null);
    if (sel < todayIdx) readDay(selKey).then((d) => { if (live) setOther(d); });
    return () => { live = false; };
  }, [selKey]);
  useEffect(() => { setAdding(false); setEditing(false); setSaved(''); }, [sel]);
  // For the tour: on a rest day, open the next workout day so the exercise list can be shown.
  useEffect(() => {
    if (!profile) return;
    const ws = weekSessions(profile);
    tourActions.set('train.workout', () => {
      if (ws[todayIdx]) return;
      const order = [...Array.from({ length: 7 - todayIdx }, (_, k) => todayIdx + k), ...Array.from({ length: todayIdx }, (_, k) => k)];
      const pick = order.find((i) => ws[i]);
      if (pick != null) setSel(pick);
    });
    tourActions.set('train.today', () => setSel(todayIdx));
    return () => { tourActions.delete('train.workout'); tourActions.delete('train.today'); };
  }, [profile]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const isToday = sel === todayIdx;
  const canTick = isToday;
  const past = sel < todayIdx;
  const log = isToday ? day : other;
  const week = programWeek(profile.start, selDate);
  // Easy (recovery) day: a flare, the day after a weekly injection, or a rough check-in.
  const ez = easyDay(profile, log, selDate);
  const ses = sessionFor(profile, sel, ez.easy, week);
  const places = weekPlaces(profile);
  const setPlace = (pl: DayPlace) => saveProfile({ ...profile, places: { ...profile.places, [sel]: pl } });
  const split = weekSessions(profile)[sel];
  const setSplit = (k: string) => { play('tap'); saveProfile({ ...profile, splits: { ...profile.splits, [sel]: k } }); };
  const done = log?.done ?? [];
  const n = ses ? ses.items.filter((x) => done.includes(x.id)).length : 0;
  const total = ses?.items.length ?? 0;
  const M = medical(profile);
  const sid = ses && !ses.flare ? ses.id : null;
  const dropped = sid ? profile.drop?.[sid] ?? [] : [];

  const toggle = (id: string) => {
    const was = done.includes(id);
    const finishing = !was && n + 1 === total;
    play(was ? 'remove' : finishing ? 'win' : 'check');
    updateDay((d) => ({
      ...d, done: d.done.includes(id) ? d.done.filter((x) => x !== id) : [...d.done, id],
      trainStart: d.trainStart ?? Date.now(),
      trainEnd: finishing ? Date.now() : was ? undefined : d.trainEnd,
    }));
  };
  // Taking an exercise out: the person's own additions are deleted, plan exercises are hidden (and can come back).
  const remove = (x: PlannedExercise) => {
    if (!sid) return;
    play('remove');
    if (x.own) saveProfile({ ...profile, own: { ...profile.own, [sid]: (profile.own?.[sid] ?? []).filter((o) => (o.ref ?? o.id) !== x.base) } });
    else saveProfile({ ...profile, drop: { ...profile.drop, [sid]: [...dropped, x.base] } });
  };
  const restore = () => { if (!sid) return; play('add'); saveProfile({ ...profile, drop: { ...profile.drop, [sid]: [] } }); };

  const dayName = isToday ? L('النهارده', 'Today') : tx(WEEK[sel]);
  const kicker = ses ? `${dayName} · ${ses.place === 'gym' ? L('جيم', 'gym') : L('بيت', 'home')}` : dayName;
  // Head dots on the week: days this week whose workout was finished (only today's log is in memory here).
  const doneWeek = Array.from({ length: 7 }, (_, i) => (i === todayIdx ? total > 0 && n >= total && isToday : false));
  const nextUp = ses?.items.findIndex((x) => !done.includes(x.id)) ?? -1;

  return (
    <Screen name="train" kicker={kicker} title={ses ? splitLabel(ses.id) : L('راحة', 'Rest')} sub={ses ? tx(ses.n) : L('مفيش تمرين في اليوم ده', 'No workout this day')}
      aside={isToday ? <MatchClock start={day.trainStart} end={day.trainEnd} /> : null}>
      <TourTarget id="train.days" style={{ gap: 10 }}>
        <WeekStrip profile={profile} today={todayIdx} sel={sel} onSelect={setSel} done={doneWeek} />
        {past ? null : (
          <View style={{ gap: 8 }}>
            <Segmented<DayPlace> items={[['gym', L('جيم', 'Gym')], ['home', L('بيت', 'Home')], ['rest', L('راحة', 'Rest')]]} value={places[sel]} onChange={setPlace} />
            {places[sel] === 'gym' ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
                {allGymChoices(profile.schedule).map((k) => {
                  const on = split === k;
                  return (
                    <Pressable key={k} onPress={() => setSplit(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={({ pressed }) => [{ minWidth: 56, alignItems: 'center', borderWidth: 1, borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : 'transparent', borderRadius: RADIUS, paddingVertical: 8, paddingHorizontal: 12 }, pressed && styles.pressed]}>
                      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 13, lineHeight: 18, color: on ? c.onPetrol : c.ink }}>{splitLabel(k)}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            ) : null}
          </View>
        )}
      </TourTarget>

      {isToday ? <EasyBanner why={ez.why} med={ez.med} update={updateDay} g={g} /> : null}

      {ses ? <>
        <Rise>
          <View accessibilityLabel={L(`${g('خلصت', 'خلصتي')} ${n} من ${total}`, `Done ${n} of ${total}`)} style={[styles.row, { gap: 3 }]}>
            {ses.items.map((x, i) => (
              <View key={x.id} style={{ flex: 1, height: 6, backgroundColor: done.includes(x.id) ? c.ink : canTick && i === nextUp ? c.petrol : c.soft }} />
            ))}
          </View>
        </Rise>
        <Rise i={1}>
          <CaptainCard pose={ses.place === 'gym' ? 'row' : 'lift'} height={136} big={two(Math.min(total, n + 1))} excited={total > 0 && n >= total}>
            <T kind="h2" style={{ fontSize: 20, lineHeight: 30 }}>{canTick ? trainLine({ g, done: n, total, rest: false }) : past ? L('اليوم ده خلص واتسجل', 'This day is closed') : L('ده يوم جاي', 'Coming up')}</T>
            <View style={[styles.row, { gap: 6, alignItems: 'flex-end' }]}>
              <Num size={64} weight="black" color={c.petrol} style={{ lineHeight: 62 }}>{String(n)}</Num>
              <Num size={26} color={c.dim} style={{ paddingBottom: 6 }}>/ {total}</Num>
              <T kind="label" style={{ paddingBottom: 8 }}>{L('تمارين', 'exercises')}</T>
            </View>
          </CaptainCard>
        </Rise>
        {!ses.flare ? (
          <T kind="small">{L('الأسبوع', 'Week')} {num(week + 1)} · {ses.variant === 'A' ? L('الأجهزة الأساسية', 'Main machines') : L('أجهزة بديلة', 'Alternate machines')} · {tx(ses.phase.n)}. {L(`المجهود: ${ses.rpe}.`, `Effort: ${ses.rpe}.`)}</T>
        ) : (
          <NoteView note={{ tone: 'warn', title: L('يوم تعافي', 'Recovery day'), text: L(`عشان ${g('قلت', 'قلتي')} إنك ${g('تعبان', 'تعبانة')} النهارده: حركة خفيفة بس.`, "Because you said you're feeling tired today: light movement only.") }} />
        )}
        {!canTick ? <T kind="small" color={c.warn}>{past ? L(`اليوم ده اتقفل واتسجل في التقرير: ${g('خلصت', 'خلصتي')} ${n} من ${total}.`, `This day is closed and saved to your report: you did ${n} of ${total}.`) : L(`ده يوم جاي، ${g('هتقدر تعلّم', 'هتقدري تعلّمي')} على التمارين يومها.`, 'This day is still ahead; you can tick off the exercises on the day.')}</T> : null}

        <TourTarget id="train.list">
          <View style={{ borderTopWidth: 1, borderColor: c.line }}>
            {ses.items.map((x, i) => {
              const on = done.includes(x.id);
              const logged = log?.sets?.[x.id]?.length ?? 0;
              const gear = GEAR[x.id] ? L(GEAR[x.id].ar, GEAR[x.id].en) : x.gear;
              return (
                <Rise key={x.id} i={i + 2}>
                  <View style={[styles.row, { gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderColor: c.line }]}>
                    {editing
                      ? <Pressable onPress={() => remove(x)} accessibilityRole="button" accessibilityLabel={L(`شيل ${tx(x.ex.n)}`, `Remove ${tx(x.ex.n)}`)} hitSlop={8}
                          style={({ pressed }) => [{ width: 28, height: 28, borderRadius: 14, backgroundColor: c.bad, alignItems: 'center', justifyContent: 'center', marginHorizontal: 1 }, pressed && styles.pressed]}>
                          <View style={{ width: 12, height: 2.5, backgroundColor: '#FFFFFF', borderRadius: 1 }} />
                        </Pressable>
                      : <RoundCheck on={on} disabled={!canTick} onPress={() => toggle(x.id)} label={tx(x.ex.n)} />}
                    <Pressable style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }, pressed && { opacity: 0.7 }]} accessibilityRole="button" disabled={editing}
                      onPress={() => { play('swoosh'); router.push({ pathname: '/exercise/[id]', params: { id: x.id, day: String(sel) } }); }}>
                      <View style={{ flex: 1 }}>
                        <T kind="h3" style={on ? { textDecorationLine: 'line-through', opacity: 0.55 } : undefined}>{tx(x.ex.n)}</T>
                        <T kind="small" style={{ fontVariant: ['tabular-nums'] }}>{x.rx}{logged ? L(` · ${g('سجلت', 'سجلتي')} ${num(logged)} مجموعات`, ` · ${num(logged)} ${logged === 1 ? 'set' : 'sets'} logged`) : ''}</T>
                        {gear ? <T kind="label" color={c.lime}>{L('الأداة: ', 'Equipment: ')}{gear}</T> : null}
                        {x.own ? <T kind="label" color={c.petrol}>{L(g('إنت ضيفته', 'إنتي ضيفتيه'), 'Added by you')}</T> : null}
                        {x.why ? <T kind="label" color={c.warn}>{L('اتبدل:', 'Swapped:')} {x.why}</T> : null}
                      </View>
                      <Num size={22} color={c.dim} style={{ opacity: 0.7 }}>{two(i + 1)}</Num>
                    </Pressable>
                  </View>
                </Rise>
              );
            })}
          </View>
        </TourTarget>

        {canTick && total > 0 && n === total ? (
          <Card tone="accent" style={{ alignItems: 'center' }}>
            <T kind="h2" color={c.onPetrol} style={{ textAlign: 'center' }}>{L('صفّارة النهاية!', 'Final whistle!')}</T>
            <T kind="small" color={c.onPetrol} style={{ textAlign: 'center' }}>{L(`${g('خلصت', 'خلصتي')} تمرين النهارده. اشرب${g('', 'ي')} مياه وريّح${g('', 'ي')}.`, "You finished today's workout. Drink some water and rest.")}</T>
          </Card>
        ) : null}

        {sid ? (
          <TourTarget id="train.add" style={{ gap: 8 }}>
            {adding ? (
              <AddExercise profile={profile} sid={sid} place={ses.place} have={ses.items.map((x) => x.id)} g={g}
                onSave={(p) => { saveProfile(p); setSaved(L(`اتضاف، وهيظهر كل يوم ${splitLabel(sid)}.`, `Added. It will show every ${splitLabel(sid)} day.`)); }} onClose={() => setAdding(false)} />
            ) : (
              <View style={[styles.row, { gap: 8 }]}>
                <Btn kind="outline" title={L(`+ ${g('ضيف', 'ضيفي')} تمرين أو جهاز`, '+ Add exercise or machine')} onPress={() => { setAdding(true); setEditing(false); setSaved(''); }} style={{ flex: 1 }} />
                <Btn kind="secondary" title={editing ? L('تمام', 'Done') : L(g('عدّل القايمة', 'عدّلي القايمة'), 'Edit list')} onPress={() => { setEditing(!editing); setSaved(''); }} />
              </View>
            )}
            {saved ? <T kind="small" color={c.petrol}>{saved}</T> : null}
            {editing ? <T kind="small">{L(`${g('دوس', 'دوسي')} على الدايرة الحمرا عشان ${g('تشيل', 'تشيلي')} التمرين من يوم ${splitLabel(sid)}.`, `Tap the red circle to take an exercise out of ${splitLabel(sid)} days.`)}</T> : null}
            {dropped.length ? (
              <Pressable onPress={restore} accessibilityRole="button" hitSlop={6}>
                <T kind="small" color={c.petrol} style={{ fontFamily: fonts.bodyMedium }}>{L(`${g('رجّع', 'رجّعي')} التمارين اللي ${g('شلتها', 'شلتيها')} (${num(dropped.length)})`, `Bring back removed exercises (${dropped.length})`)}</T>
              </Pressable>
            ) : null}
          </TourTarget>
        ) : null}
      </> : (
        <CaptainCard pose="rest" height={124}>
          <T kind="h2" style={{ fontSize: 20, lineHeight: 30 }}>{trainLine({ g, done: 0, total: 0, rest: true })}</T>
          <T kind="small">{L(`مشي خفيف ٢٠ دقيقة أو إطالات لو ${g('حابب', 'حابة')}.`, 'A light 20-minute walk or some stretching if you like.')}</T>
        </CaptainCard>
      )}

      {M.train.length ? (
        <Card>
          <Kicker color={c.warn}>{L('على حسب حالتك', 'For your condition')}</Kicker>
          {M.train.map((note, i) => <NoteView key={i} note={note} />)}
        </Card>
      ) : null}
    </Screen>
  );
}
