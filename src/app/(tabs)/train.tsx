import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, NoteView, Screen, T, styles } from '../../components/ui.tsx';
import { WEEK, WEEK_SHORT } from '../../lib/data.ts';
import { dayKey, weekIndex, type DayLog } from '../../lib/day.ts';
import { genderFor, medical, sessionFor, weekPlaces, type DayPlace } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

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
    <Screen title="التمرين">
      <View style={[styles.row, { gap: 5 }]}>
        {WEEK_SHORT.map((w, i) => {
          const pl = places[i];
          return (
            <Pressable key={w} onPress={() => { play('tap'); setSel(i); }} accessibilityRole="button" accessibilityState={{ selected: i === sel }}
              style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 12, backgroundColor: c.surface, borderWidth: i === sel ? 2 : 1, borderColor: i === sel ? c.petrol : c.line }}>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12, color: c.ink }}>{w}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pl === 'gym' ? c.petrol : pl === 'home' ? c.lime : c.line }} />
              {i === todayIdx ? <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: c.muted }}>النهارده</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {past ? null : (
        <View style={[styles.row, { gap: 8 }]}>
          <T kind="small" style={{ flexShrink: 1 }}>{isToday ? 'النهارده' : `يوم ${WEEK[sel]}`} {g('هتتمرن', 'هتتمرني')} فين؟</T>
          <View style={[styles.row, { gap: 6, flex: 1, justifyContent: 'flex-end' }]}>
            {([['gym', 'جيم'], ['home', 'بيت'], ['rest', 'راحة']] as [DayPlace, string][]).map(([k, l]) => {
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

      {ses && !ses.flare ? (
        <Card tone="petrol">
          <T kind="label" color={c.onPetrol}>الأسبوع {(week + 1).toLocaleString('ar-EG')} · {ses.variant === 'A' ? 'الأجهزة الأساسية' : 'أجهزة بديلة'}</T>
          <T kind="h3" color={c.onPetrol}>{ses.phase.n}</T>
          <T kind="small" color={c.onPetrol}>{ses.phase.text} {g('دوس', 'دوسي')} على أي تمرين تشوف{g('', 'ي')} شرحه و{g('تسجل', 'تسجلي')} الأوزان.</T>
        </Card>
      ) : null}

      {ses ? (
        <Card>
          <View style={styles.rowBetween}>
            <T kind="h2" style={{ flexShrink: 1 }}>{ses.n}</T>
            <Text style={{ fontFamily: fonts.body, fontSize: 12, borderRadius: 99, overflow: 'hidden', paddingHorizontal: 10, paddingVertical: 2,
              backgroundColor: ses.place === 'gym' ? c.petrol : c.lime, color: ses.place === 'gym' ? c.onPetrol : c.onLime }}>{ses.place === 'gym' ? 'جيم' : 'بيت'}</Text>
          </View>
          <T kind="small">{ses.flare ? `يوم تعافي عشان ${g('قلت', 'قلتي')} إنك ${g('تعبان', 'تعبانة')} النهارده. ` : ''}المجهود المطلوب: {ses.rpe} (لازم {g('تكون قادر تكمل', 'تكوني قادرة تكملي')} جملة وانت {g('بتتمرن', 'بتتمرني')}).</T>
          {canTick ? (
            <>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: c.soft, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${ses.items.length ? (n / ses.items.length) * 100 : 0}%`, backgroundColor: c.lime }} />
              </View>
              <T kind="small">{g('خلصت', 'خلصتي')} {n} من {ses.items.length}</T>
            </>
          ) : <T kind="small" color={c.warn}>{past ? `اليوم ده اتقفل واتسجل في التقرير: ${g('خلصت', 'خلصتي')} ${n} من ${ses.items.length}.` : `ده يوم جاي، ${g('هتقدر تعلّم', 'هتقدري تعلّمي')} على التمارين يومها.`}</T>}
          {ses.items.map((x, i) => {
            const on = done.includes(x.id);
            const logged = log?.sets?.[x.id]?.length ?? 0;
            return (
              <View key={x.id} style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: i < ses.items.length - 1 ? 1 : 0, borderColor: c.line }]}>
                <Pressable disabled={!canTick} onPress={() => toggle(x.id)} accessibilityRole="checkbox" accessibilityLabel={x.ex.n} accessibilityState={{ checked: on, disabled: !canTick }} hitSlop={8}
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: c.petrol, backgroundColor: on ? c.petrol : 'transparent', opacity: canTick ? 1 : 0.35, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
                  {on ? <Text style={{ color: c.onPetrol, fontSize: 14, fontWeight: '700' }}>✓</Text> : null}
                </Pressable>
                <Pressable style={{ flex: 1 }} accessibilityRole="button" onPress={() => router.push({ pathname: '/exercise/[id]', params: { id: x.id, day: String(sel) } })}>
                  <T kind="h3" style={on ? { textDecorationLine: 'line-through', opacity: 0.6 } : undefined}>{x.ex.n}</T>
                  <T kind="small" style={{ fontVariant: ['tabular-nums'] }}>{x.rx}{logged ? ` · ${g('سجلت', 'سجلتي')} ${logged.toLocaleString('ar-EG')} مجموعات` : ''}</T>
                  {x.why ? <T kind="label" color={c.warn}>اتبدل: {x.why}</T> : null}
                </Pressable>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: c.muted, marginTop: 2 }}>‹</Text>
              </View>
            );
          })}
          {canTick && ses.items.length > 0 && n === ses.items.length ? (
            <NoteView note={{ tone: 'info', title: 'برافو!', text: `${g('خلصت', 'خلصتي')} تمرين النهارده.` }} />
          ) : null}
        </Card>
      ) : (
        <Card>
          <T kind="h2">يوم راحة</T>
          <T kind="body" color={c.muted}>الراحة جزء من الخطة. مشي خفيف ٢٠ دقيقة أو إطالات لو {g('حابب', 'حابة')}.</T>
        </Card>
      )}

      {M.train.length ? (
        <Card>
          <T kind="h2">تعديلات على حسب حالتك</T>
          {M.train.map((note, i) => <NoteView key={i} note={note} />)}
        </Card>
      ) : null}
    </Screen>
  );
}
