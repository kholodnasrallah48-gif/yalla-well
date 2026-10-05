import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { Card, NoteView, Screen, T, lift, placeColor, styles } from '../../components/ui.tsx';
import { GEAR, WEEK, WEEK_SHORT, gymChoices } from '../../lib/data.ts';
import { dayKey, weekIndex, type DayLog } from '../../lib/day.ts';
import { genderFor, medical, sessionFor, weekPlaces, weekSessions, type DayPlace } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { L, num, tx } from '../../lib/i18n.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const SPLIT_LABEL: Record<string, () => string> = {
  fullA: () => L('Full Body أ', 'Full body A'), fullB: () => L('Full Body ب', 'Full body B'),
  push: () => 'Push', pull: () => 'Pull', legs: () => 'Legs', upper: () => L('علوي', 'Upper'), lower: () => L('سفلي', 'Lower'),
  chest: () => L('صدر', 'Chest'), back: () => L('ضهر', 'Back'), shoulders: () => L('كتف', 'Shoulders'), arms: () => L('دراع', 'Arms'), glutes: () => L('أرداف', 'Glutes'),
};

export default function Train() {
  const c = useColors();
  const { profile, day, readDay, updateDay, saveProfile } = useStore();
  const todayIdx = weekIndex(new Date());
  const [sel, setSel] = useState(todayIdx);
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
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const isToday = sel === todayIdx;
  const canTick = isToday;
  const past = sel < todayIdx;
  const log = isToday ? day : other;
  const week = programWeek(profile.start, selDate);
  const ses = sessionFor(profile, sel, !!log?.flare, week);
  const places = weekPlaces(profile);
  const setPlace = (pl: DayPlace) => { play('tap'); saveProfile({ ...profile, places: { ...profile.places, [sel]: pl } }); };
  const split = weekSessions(profile)[sel];
  const setSplit = (k: string) => { play('tap'); saveProfile({ ...profile, splits: { ...profile.splits, [sel]: k } }); };
  const done = log?.done ?? [];
  const n = ses ? ses.items.filter((x) => done.includes(x.id)).length : 0;
  const M = medical(profile);
  const toggle = (id: string) => {
    const was = done.includes(id);
    play(was ? 'remove' : ses && n + 1 === ses.items.length ? 'win' : 'check');
    const flip = (d: DayLog) => ({ ...d, done: d.done.includes(id) ? d.done.filter((x) => x !== id) : [...d.done, id] });
    updateDay(flip);
  };

  return (
    <Screen title={L('التمرين', 'Train')}>
      <View style={[styles.row, { gap: 5 }]}>
        {WEEK_SHORT.map((w, i) => {
          const pl = places[i];
          const now = i === todayIdx;
          const picked = i === sel;
          return (
            <Pressable key={w} onPress={() => { play('tap'); setSel(i); }} accessibilityRole="button" accessibilityState={{ selected: picked }}
              accessibilityLabel={`${tx(WEEK[i])}${now ? L(' (النهارده)', ' (today)') : ''}`}
              style={[{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 7, borderRadius: 12, backgroundColor: now ? 'transparent' : c.surface,
                borderWidth: picked ? 2 : 1, borderColor: picked ? (now ? c.ink : c.petrol) : now ? 'transparent' : c.line }, lift(c, now ? 'glow' : 'sm')]}>
              {now ? <LinearGradient pointerEvents="none" colors={c.gBtn} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ position: 'absolute', inset: 0, borderRadius: 10 }} /> : null}
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12, color: now ? c.onPetrol : c.ink }}>{tx(w)}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pl === 'rest' ? (now ? 'rgba(0,0,0,0.25)' : c.line) : placeColor(c, pl, now) }} />
              {now ? <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 9.5, color: c.onPetrol }}>{L('النهارده', 'Today')}</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {past ? null : (
        <View style={[styles.row, { gap: 8 }]}>
          <T kind="small" style={{ flexShrink: 1 }}>{L(`${isToday ? 'النهارده' : `يوم ${WEEK[sel]}`} ${g('هتتمرن', 'هتتمرني')} فين؟`, `Where are you training ${isToday ? 'today' : `on ${tx(WEEK[sel])}`}?`)}</T>
          <View style={[styles.row, { gap: 6, flex: 1, justifyContent: 'flex-end' }]}>
            {([['gym', L('جيم', 'Gym')], ['home', L('بيت', 'Home')], ['rest', L('راحة', 'Rest')]] as [DayPlace, string][]).map(([k, l]) => {
              const on = places[sel] === k;
              return (
                <Pressable key={k} onPress={() => setPlace(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={{ borderWidth: 1.5, borderColor: on ? c.petrol : c.line, backgroundColor: on ? (k === 'home' ? c.lime : k === 'gym' ? c.petrol : c.soft) : c.surface, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 5 }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: on ? (k === 'gym' ? c.onPetrol : k === 'home' ? c.onLime : c.petrol) : c.ink }}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {!past && places[sel] === 'gym' ? (
        <View style={{ gap: 6 }}>
          <T kind="small">{L(`${g('هتلعب', 'هتلعبي')} إيه في الجيم؟`, 'What are you training at the gym?')}</T>
          <View style={styles.wrap}>
            {gymChoices(profile.schedule).map((k) => {
              const on = split === k;
              const label = SPLIT_LABEL[k]?.() ?? k;
              return (
                <Pressable key={k} onPress={() => setSplit(k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={({ pressed }) => [{ minWidth: 64, alignItems: 'center', borderWidth: 1.5, borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : c.surface, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 12 }, lift(c, on ? 'glow' : 'sm'), pressed && styles.pressed]}>
                  <Text style={{ fontFamily: fonts.displaySemi, fontSize: 13, color: on ? c.onPetrol : c.ink }}>{label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {ses && !ses.flare ? (
        <Card tone="petrol">
          <T kind="label" color={c.onHero}>{L('الأسبوع', 'Week')} {num(week + 1)} · {ses.variant === 'A' ? L('الأجهزة الأساسية', 'Main machines') : L('أجهزة بديلة', 'Alternate machines')}</T>
          <T kind="h3" color={c.onHero}>{tx(ses.phase.n)}</T>
          <T kind="small" color={c.onHero}>{L(`${ses.phase.text} ${g('دوس', 'دوسي')} على أي تمرين تشوف${g('', 'ي')} شرحه و${g('تسجل', 'تسجلي')} الأوزان.`, `${tx(ses.phase.text)} Tap any exercise to see how it's done and log your weights.`)}</T>
        </Card>
      ) : null}

      {ses ? (
        <Card>
          <View style={styles.rowBetween}>
            <T kind="h2" style={{ flexShrink: 1 }}>{tx(ses.n)}</T>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, borderRadius: 99, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 2,
              backgroundColor: ses.place === 'gym' ? c.petrol : c.lime, color: ses.place === 'gym' ? c.onPetrol : c.onLime }}>{ses.place === 'gym' ? L('جيم', 'Gym') : L('بيت', 'Home')}</Text>
          </View>
          <T kind="small">{L(`${ses.flare ? `يوم تعافي عشان ${g('قلت', 'قلتي')} إنك ${g('تعبان', 'تعبانة')} النهارده. ` : ''}المجهود المطلوب: ${ses.rpe} (لازم ${g('تكون قادر تكمل', 'تكوني قادرة تكملي')} جملة وانت ${g('بتتمرن', 'بتتمرني')}).`, `${ses.flare ? "Recovery day because you said you're feeling tired today. " : ''}Target effort: ${ses.rpe} (you should be able to finish a sentence while training).`)}</T>
          {canTick ? (
            <>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: c.soft, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${ses.items.length ? (n / ses.items.length) * 100 : 0}%`, backgroundColor: c.lime }} />
              </View>
              <T kind="small">{L(`${g('خلصت', 'خلصتي')} ${n} من ${ses.items.length}`, `Done ${n} of ${ses.items.length}`)}</T>
            </>
          ) : <T kind="small" color={c.warn}>{past ? L(`اليوم ده اتقفل واتسجل في التقرير: ${g('خلصت', 'خلصتي')} ${n} من ${ses.items.length}.`, `This day is closed and saved to your report: you did ${n} of ${ses.items.length}.`) : L(`ده يوم جاي، ${g('هتقدر تعلّم', 'هتقدري تعلّمي')} على التمارين يومها.`, "This day is still ahead; you can tick off the exercises on the day.")}</T>}
          {ses.items.map((x, i) => {
            const on = done.includes(x.id);
            const logged = log?.sets?.[x.id]?.length ?? 0;
            return (
              <View key={x.id} style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: i < ses.items.length - 1 ? 1 : 0, borderColor: c.line }]}>
                <Pressable disabled={!canTick} onPress={() => toggle(x.id)} accessibilityRole="checkbox" accessibilityLabel={tx(x.ex.n)} accessibilityState={{ checked: on, disabled: !canTick }} hitSlop={8}
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: c.petrol, backgroundColor: on ? c.petrol : 'transparent', opacity: canTick ? 1 : 0.35, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  {on ? <Text style={{ color: c.onPetrol, fontSize: 14, fontWeight: '700' }}>✓</Text> : null}
                </Pressable>
                <Pressable style={{ flex: 1 }} accessibilityRole="button" onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: x.id, day: String(sel) } })}>
                  <T kind="h3" style={on ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}>{tx(x.ex.n)}</T>
                  <T kind="small" style={{ fontVariant: ['tabular-nums'] }}>{x.rx}{logged ? L(` · ${g('سجلت', 'سجلتي')} ${num(logged)} مجموعات`, ` · ${num(logged)} ${logged === 1 ? 'set' : 'sets'} logged`) : ''}</T>
                  {GEAR[x.id] ? <T kind="label" color={c.lime}>{L('الأداة: ', 'Equipment: ')}{L(GEAR[x.id].ar, GEAR[x.id].en)}</T> : null}
                  {x.why ? <T kind="label" color={c.warn}>{L('اتبدل:', 'Swapped:')} {x.why}</T> : null}
                </Pressable>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.muted, marginTop: 2 }}>{L('‹', '›')}</Text>
              </View>
            );
          })}
          {canTick && ses.items.length > 0 && n === ses.items.length ? (
            <NoteView note={{ tone: 'info', title: L('برافو!', 'Well done!'), text: L(`${g('خلصت', 'خلصتي')} تمرين النهارده.`, "You finished today's workout.") }} />
          ) : null}
        </Card>
      ) : (
        <Card>
          <T kind="h2">{L('يوم راحة', 'Rest day')}</T>
          <T kind="body" color={c.muted}>{L(`الراحة جزء من الخطة. مشي خفيف ٢٠ دقيقة أو إطالات لو ${g('حابب', 'حابة')}.`, 'Rest is part of the plan. A light 20-minute walk or some stretching if you feel like it.')}</T>
        </Card>
      )}

      {M.train.length ? (
        <Card>
          <T kind="h2">{L('تعديلات على حسب حالتك', 'Adjustments for your condition')}</T>
          {M.train.map((note, i) => <NoteView key={i} note={note} />)}
        </Card>
      ) : null}
    </Screen>
  );
}
