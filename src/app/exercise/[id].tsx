// One exercise: how-to images and cues, a form video, and a set-by-set logger with rest timer.
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { AppState, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Head } from '../../components/Mascot.tsx';
import { Bg, Btn, Card, Kicker, NoteView, Num, RADIUS, START, T, styles } from '../../components/ui.tsx';
import { weekIndex } from '../../lib/day.ts';
import { MEDIA } from '../../lib/exercise-media.ts';
import { L, num, tx } from '../../lib/i18n.ts';
import { gearOptions, genderFor, sessionFor } from '../../lib/plan.ts';
import { GEAR, isFreeWeight, variantsOf } from '../../lib/data.ts';
import { programWeek, suggestWeight } from '../../lib/progress.ts';
import { cancelRestEnd, scheduleRestEnd } from '../../lib/notify.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const ar = (n: number) => num(n);

function Stepper({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  const c = useColors();
  const btn = { width: 44, height: 48, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flex: 1, gap: 4, alignItems: 'center' }}>
      <T kind="label">{label}</T>
      <View style={[styles.row, { gap: 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={L(`أقل ${label}`, `Less ${label}`)} onPress={() => { play('pop'); onChange(Math.max(0, +(value - step).toFixed(1))); }} style={({ pressed }) => [btn, pressed && styles.pressed]}>
          <Text style={{ fontSize: 22, lineHeight: 26, color: c.ink, fontFamily: fonts.displaySemi }}>−</Text>
        </Pressable>
        <Num size={32} weight="black" color={c.petrol} style={{ minWidth: 48, textAlign: 'center' }}>{String(value)}</Num>
        <Pressable accessibilityRole="button" accessibilityLabel={L(`أكتر ${label}`, `More ${label}`)} onPress={() => { play('pop'); onChange(+(value + step).toFixed(1)); }} style={({ pressed }) => [btn, pressed && styles.pressed]}>
          <Text style={{ fontSize: 22, lineHeight: 26, color: c.ink, fontFamily: fonts.displaySemi }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/** Weight typed as a number (keyboard), with the last value kept if the field is left empty. */
function WeightInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const c = useColors();
  const [text, setText] = useState(value ? String(value) : '');
  useEffect(() => { setText((t) => (parseFloat(t || '0') === value ? t : value ? String(value) : '')); }, [value]);
  return (
    <View style={{ flex: 1, gap: 4, alignItems: 'center' }}>
      <T kind="label">{label}</T>
      <TextInput value={text} keyboardType="decimal-pad" inputMode="decimal" returnKeyType="done" selectTextOnFocus placeholder="0" placeholderTextColor={c.muted}
        accessibilityLabel={label}
        onChangeText={(t) => { const clean = t.replace(',', '.').replace(/[^0-9.]/g, ''); setText(clean); const n = parseFloat(clean); if (!Number.isNaN(n)) onChange(Math.min(500, n)); else if (!clean) onChange(0); }}
        style={{ width: '100%', height: 48, borderRadius: RADIUS, borderWidth: 1, borderColor: c.dim, backgroundColor: c.panel, textAlign: 'center', fontFamily: fonts.numSemi, fontSize: 26, color: c.ink }} />
    </View>
  );
}

export default function ExerciseScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id, day: dayParam } = useLocalSearchParams<{ id: string; day?: string }>();
  const { profile, day, lifts, today, updateDay, saveLift, saveProfile } = useStore();
  const todayIdx = weekIndex(new Date());
  const dayIdx = dayParam != null ? Number(dayParam) : todayIdx;
  const isToday = dayIdx === todayIdx;
  const week = programWeek(profile?.start, new Date());
  const ses = profile ? sessionFor(profile, dayIdx, isToday && day.flare, week) : null;
  const item = ses?.items.find((x) => x.id === id) ?? ses?.items.find((x) => x.base === id);
  const media = item ? MEDIA[item.id] : MEDIA[id];
  const last = lifts[id];
  const suggested = item && ses ? suggestWeight(id, last, ses.phase) : null;
  const sets = (isToday && day.sets[id]) || [];
  const [frame, setFrame] = useState(0);
  const [w, setW] = useState(suggested ?? last?.w ?? 0);
  const [r, setR] = useState(item?.reps[1] ?? 12);
  // Switching equipment changes the exercise: start from its own suggested or last weight.
  useEffect(() => { if (item) setW(suggestWeight(item.id, lifts[item.id], ses!.phase) ?? lifts[item.id]?.w ?? 0); }, [item?.id]);
  // Rest is kept as an end time, so it stays right when the app goes to the background and comes back.
  const [restEnd, setRestEnd] = useState(0);
  const [, tick] = useState(0);
  const rest = restEnd ? Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)) : 0;

  useEffect(() => {
    if (!media?.img.length || media.img.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % media.img.length), 1100);
    return () => clearInterval(t);
  }, [media]);
  useEffect(() => {
    if (!restEnd) return;
    const t = setInterval(() => {
      if (Date.now() >= restEnd) { setRestEnd(0); play('check'); } else tick((n) => n + 1);
    }, 250);
    const sub = AppState.addEventListener('change', () => tick((n) => n + 1));
    return () => { clearInterval(t); sub.remove(); };
  }, [restEnd]);
  useEffect(() => () => { cancelRestEnd(); }, []);
  const startRest = (sec: number) => {
    setRestEnd(Date.now() + sec * 1000);
    scheduleRestEnd(sec, L('الراحة خلصت', 'Rest is over'), L('يلا على المجموعة الجاية', 'Time for your next set'));
  };
  const skipRest = () => { setRestEnd(0); cancelRestEnd(); };

  if (!profile || !item || !ses) {
    return <View style={{ flex: 1, backgroundColor: c.bg, padding: 24, paddingTop: insets.top + 24 }}><T kind="h2">{L('التمرين ده مش في خطة اليوم ده.', "This exercise isn't in this day's plan.")}</T><Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} /></View>;
  }
  const g = genderFor(profile.sex);
  const options = gearOptions(profile, item.base);
  const pickGear = (gid: string) => {
    if (gid === item.id) return;
    play('tap');
    saveProfile({ ...profile, gear: { ...profile.gear, [item.base]: gid } });
    router.setParams({ id: gid });
  };
  const strength = item.sets > 0 && item.ex.k === 'str';
  const done = sets.length >= item.sets;

  const logSet = () => {
    updateDay((d) => ({ ...d, sets: { ...d.sets, [id]: [...(d.sets[id] ?? []), { w, r }] }, trainStart: d.trainStart ?? Date.now() }));
    if (sets.length + 1 < item.sets) startRest(item.rest);
  };
  const finish = () => {
    if (strength && sets.length) saveLift(id, { date: today, w: Math.max(...sets.map((s) => s.w)), reps: sets.map((s) => s.r), top: item.reps[1] });
    const all = ses.items.every((x) => x.id === id || day.done.includes(x.id));
    if (all) play('win');
    updateDay((d) => ({ ...d, done: d.done.includes(id) ? d.done : [...d.done, id], trainStart: d.trainStart ?? Date.now(), trainEnd: all ? Date.now() : d.trainEnd }));
    router.back();
  };
  const video = () => WebBrowser.openBrowserAsync(`https://www.youtube.com/results?search_query=${encodeURIComponent((media?.en ?? tx(item.ex.n)) + ' proper form')}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, controlsColor: c.petrol,
  });

  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
        <View style={{ flexShrink: 1 }}>
          <Kicker>{L(`التمرين ${num(ses.items.indexOf(item) + 1)} من ${num(ses.items.length)}`, `Exercise ${ses.items.indexOf(item) + 1} of ${ses.items.length}`)}</Kicker>
          <T kind="h1" style={{ fontSize: 30, lineHeight: 46 }}>{tx(item.ex.n)}</T>
        </View>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')} hitSlop={10}
          style={({ pressed }) => [{ width: 36, height: 36, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
          <Text style={{ fontSize: 22, lineHeight: 24, color: c.muted }}>×</Text>
        </Pressable>
      </View>
      <T kind="small">{item.rx}</T>
      {GEAR[item.id] || item.gear ? <T kind="label" color={c.lime}>{L('الأداة: ', 'Equipment: ')}{GEAR[item.id] ? L(GEAR[item.id].ar, GEAR[item.id].en) : item.gear}</T> : null}
      {item.why ? <T kind="label" color={c.warn}>{L('اتبدل: ', 'Swapped: ')}{item.why}</T> : null}

      {media?.img.length ? (
        <View style={{ borderRadius: RADIUS, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.line }}>
          <Image source={{ uri: IMG + media.img[frame % media.img.length] }} style={{ width: '100%', aspectRatio: 4 / 3 }} resizeMode="contain" accessibilityLabel={L(`صورة توضيحية لـ ${item.ex.n}`, `How-to picture of ${tx(item.ex.n)}`)} />
        </View>
      ) : null}
      <Btn kind="secondary" title={L('▶  فيديو يشرح الحركة', '▶  Video showing the move')} onPress={video} />

      {options.length > 1 ? (
        <Card>
          <T kind="h2">{L(`${g('هتلعبه', 'هتلعبيه')} بإيه؟`, 'What will you use?')}</T>
          <T kind="small">{L(`لو الجهاز مشغول أو ${g('بتفضل', 'بتفضلي')} أوزان حرة، ${g('اختار', 'اختاري')} نسخة تانية من نفس التمرين. اختيارك بيفضل محفوظ.`, 'If the machine is busy or you prefer free weights, pick another version of the same exercise. Your pick is saved.')}</T>
          {([[L('أوزان حرة', 'Free weights'), options.filter((o) => isFreeWeight(o.eq))], [L('أجهزة وكيبل', 'Machines and cables'), options.filter((o) => !isFreeWeight(o.eq))]] as const).map(([title, list]) => list.length ? (
            <View key={title} style={{ gap: 6 }}>
              <T kind="label">{title}</T>
              {list.map((o) => {
                const on = o.id === item.id;
                return (
                  <Pressable key={o.id} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => pickGear(o.id)}
                    style={({ pressed }) => [{ borderRadius: RADIUS, borderWidth: on ? 2 : 1, borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.soft : 'transparent', paddingVertical: 10, paddingHorizontal: 12, gap: 2 }, pressed && styles.pressed]}>
                    <T kind="h3">{tx(o.ex.n)}</T>
                    {o.gear ? <T kind="small">{o.gear}</T> : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null)}
          {variantsOf(item.base).length > options.length ? <T kind="small" color={c.warn}>{L('في نسخ تانية من التمرين ده مش ظاهرة عشان مش مناسبة لحالتك أو للألم اللي عندك.', "Some versions of this exercise are hidden because they don't suit your condition or pain.")}</T> : null}
        </Card>
      ) : null}

      {media?.cues.length ? (
        <Card>
          <T kind="h2">{L('خلي بالك من', 'Watch your form')}</T>
          {media.cues.map((cue, i) => (
            <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.petrol, marginTop: 9 }} />
              <T kind="body" style={{ flex: 1 }}>{tx(cue)}</T>
            </View>
          ))}
        </Card>
      ) : null}

      {strength && isToday ? (
        <Card>
          <View style={styles.rowBetween}>
            <T kind="h2">{L('العداد', 'Set tracker')}</T>
            <T kind="small">{L(`${ar(sets.length)} من ${ar(item.sets)} مجموعات`, `${ar(sets.length)} of ${ar(item.sets)} sets`)}</T>
          </View>
          {suggested != null ? (
            <NoteView note={{ tone: 'info', title: L(`الوزن المقترح: ${suggested} كجم`, `Suggested weight: ${suggested} kg`), text: last ? L(`آخر مرة ${last.w} كجم × ${last.reps.join('، ')}. ${ses.phase.n}.`, `Last time ${last.w} kg × ${last.reps.join(', ')}. ${tx(ses.phase.n)}.`) : tx(ses.phase.n) }} />
          ) : (
            <T kind="small">{L(`أول مرة؟ ${g('ابدأ', 'ابدأي')} بوزن ${g('تقدر', 'تقدري')} تعمل${g('', 'ي')} بيه ${ar(item.reps[1])} عدة بحركة نضيفة.`, `First time? Start with a weight you can lift ${ar(item.reps[1])} times with clean form.`)}</T>
          )}
          <View style={[styles.row, { gap: 8 }]}>
            <WeightInput label={L('الوزن (كجم)', 'Weight (kg)')} value={w} onChange={setW} />
            <Stepper label={L('العدات', 'Reps')} value={r} step={1} onChange={setR} />
          </View>
          {rest > 0 ? (
            <View style={[styles.row, { gap: 12, minHeight: 58, paddingHorizontal: 14, borderRadius: RADIUS, backgroundColor: c.panel, borderWidth: 1, borderColor: c.line }]}>
              <T kind="h2" style={{ fontSize: 18 }}>{L('راحة', 'Rest')}</T>
              <Num size={36} weight="black" color={c.petrol}>{`${String(Math.floor(rest / 60)).padStart(2, '0')}:${String(rest % 60).padStart(2, '0')}`}</Num>
              <View style={{ flex: 1, height: 4, backgroundColor: c.soft }}>
                <View style={{ height: 4, width: `${Math.min(100, (rest / Math.max(1, item.rest)) * 100)}%`, backgroundColor: c.petrol }} />
              </View>
              <Pressable onPress={() => { play('tap'); skipRest(); }} accessibilityRole="button"
                style={({ pressed }) => [{ minHeight: 36, paddingHorizontal: 12, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, justifyContent: 'center' }, pressed && styles.pressed]}>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 13, color: c.ink }}>{L('تخطي', 'Skip')}</Text>
              </Pressable>
            </View>
          ) : null}
          {sets.length ? (
            <View>
              <View style={[styles.row, { paddingBottom: 2 }]}>
                {[L('مجموعة', 'Set'), L('كجم', 'kg'), L('عدات', 'Reps')].map((h) => <T key={h} kind="label" color={c.dim} style={{ flex: 1, fontSize: 11 }}>{h}</T>)}
                <View style={{ width: 28 }} />
              </View>
              {sets.map((s, i) => (
                <View key={i} style={[styles.row, { minHeight: 40, borderTopWidth: 1, borderColor: c.line }]}>
                  <Num size={22} color={c.dim} style={{ flex: 1, textAlign: START() }}>{String(i + 1)}</Num>
                  <Num size={22} color={c.muted} style={{ flex: 1, textAlign: START() }}>{String(s.w)}</Num>
                  <Num size={22} color={c.muted} style={{ flex: 1, textAlign: START() }}>{String(s.r)}</Num>
                  <View style={{ width: 28, alignItems: 'center' }} accessibilityLabel={L(`مجموعة ${ar(i + 1)} اتسجلت`, `Set ${i + 1} logged`)}><Head on size={16} /></View>
                </View>
              ))}
            </View>
          ) : null}
          {!done ? <Btn title={L(`سجّل${g('', 'ي')} مجموعة ${ar(sets.length + 1)}`, `Log set ${ar(sets.length + 1)}`)} onPress={logSet} sound="add" /> : null}
          {sets.length ? <Btn kind="text" title={L('امسح آخر مجموعة', 'Delete last set')} onPress={() => updateDay((d) => ({ ...d, sets: { ...d.sets, [id]: (d.sets[id] ?? []).slice(0, -1) } }))} /> : null}
        </Card>
      ) : null}

      {isToday ? <Btn kind={done || !strength ? 'primary' : 'outline'} title={L('خلصت التمرين ده', 'Done with this exercise')} onPress={finish} /> : null}
    </ScrollView></Bg>
  );
}
