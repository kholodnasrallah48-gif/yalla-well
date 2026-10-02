// One exercise: how-to images and cues, a form video, and a set-by-set logger with rest timer.
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, NoteView, T, styles } from '../../components/ui.tsx';
import { weekIndex } from '../../lib/day.ts';
import { MEDIA } from '../../lib/exercise-media.ts';
import { genderFor, sessionFor } from '../../lib/plan.ts';
import { programWeek, stepFor, suggestWeight } from '../../lib/progress.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const IMG = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';
const ar = (n: number) => n.toLocaleString('ar-EG');

function Stepper({ label, value, step, onChange }: { label: string; value: number; step: number; onChange: (v: number) => void }) {
  const c = useColors();
  const btn = { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' } as const;
  return (
    <View style={{ flex: 1, gap: 4, alignItems: 'center' }}>
      <T kind="label">{label}</T>
      <View style={[styles.row, { gap: 8 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`أقل ${label}`} onPress={() => onChange(Math.max(0, +(value - step).toFixed(1)))} style={btn}>
          <Text style={{ fontSize: 22, color: c.petrol, fontFamily: fonts.display }}>−</Text>
        </Pressable>
        <Text style={{ minWidth: 48, textAlign: 'center', fontFamily: fonts.display, fontSize: 24, color: c.ink, fontVariant: ['tabular-nums'] }}>{value}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`أكتر ${label}`} onPress={() => onChange(+(value + step).toFixed(1))} style={btn}>
          <Text style={{ fontSize: 22, color: c.petrol, fontFamily: fonts.display }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function ExerciseScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id, day: dayParam } = useLocalSearchParams<{ id: string; day?: string }>();
  const { profile, day, lifts, today, updateDay, saveLift } = useStore();
  const todayIdx = weekIndex(new Date());
  const dayIdx = dayParam != null ? Number(dayParam) : todayIdx;
  const isToday = dayIdx === todayIdx;
  const week = programWeek(profile?.start, new Date());
  const ses = profile ? sessionFor(profile, dayIdx, isToday && day.flare, week) : null;
  const item = ses?.items.find((x) => x.id === id);
  const media = MEDIA[id];
  const last = lifts[id];
  const suggested = item && ses ? suggestWeight(id, last, ses.phase) : null;
  const sets = (isToday && day.sets[id]) || [];
  const [frame, setFrame] = useState(0);
  const [w, setW] = useState(suggested ?? last?.w ?? 0);
  const [r, setR] = useState(item?.reps[1] ?? 12);
  const [rest, setRest] = useState(0);

  useEffect(() => {
    if (!media?.img.length || media.img.length < 2) return;
    const t = setInterval(() => setFrame((f) => (f + 1) % media.img.length), 1100);
    return () => clearInterval(t);
  }, [media]);
  useEffect(() => {
    if (rest <= 0) return;
    const t = setTimeout(() => setRest((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [rest]);

  if (!profile || !item || !ses) {
    return <View style={{ flex: 1, backgroundColor: c.bg, padding: 24, paddingTop: insets.top + 24 }}><T kind="h2">التمرين ده مش في خطة اليوم ده.</T><Btn kind="outline" title="رجوع" onPress={() => router.back()} /></View>;
  }
  const g = genderFor(profile.sex);
  const strength = item.sets > 0 && item.ex.k === 'str';
  const done = sets.length >= item.sets;

  const logSet = () => {
    updateDay((d) => ({ ...d, sets: { ...d.sets, [id]: [...(d.sets[id] ?? []), { w, r }] } }));
    if (sets.length + 1 < item.sets) setRest(item.rest);
  };
  const finish = () => {
    if (strength && sets.length) saveLift(id, { date: today, w: Math.max(...sets.map((s) => s.w)), reps: sets.map((s) => s.r), top: item.reps[1] });
    updateDay((d) => ({ ...d, done: d.done.includes(id) ? d.done : [...d.done, id] }));
    router.back();
  };
  const video = () => WebBrowser.openBrowserAsync(`https://www.youtube.com/results?search_query=${encodeURIComponent((media?.en ?? item.ex.n) + ' proper form')}`, {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, controlsColor: c.petrol,
  });

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ padding: 16, paddingTop: 20, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1" style={{ flexShrink: 1 }}>{item.ex.n}</T>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="قفل" hitSlop={10}>
          <Text style={{ fontSize: 26, color: c.muted }}>×</Text>
        </Pressable>
      </View>
      <T kind="small">{item.rx}</T>
      {item.why ? <T kind="label" color={c.warn}>اتبدل: {item.why}</T> : null}

      {media?.img.length ? (
        <View style={{ borderRadius: 18, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: c.line }}>
          <Image source={{ uri: IMG + media.img[frame % media.img.length] }} style={{ width: '100%', aspectRatio: 4 / 3 }} resizeMode="contain" accessibilityLabel={`صورة توضيحية لـ ${item.ex.n}`} />
        </View>
      ) : null}
      <Btn kind="secondary" title="▶  فيديو يشرح الحركة" onPress={video} />

      {media?.cues.length ? (
        <Card>
          <T kind="h2">خلي بالك من</T>
          {media.cues.map((cue, i) => (
            <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
              <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.lime, marginTop: 9 }} />
              <T kind="body" style={{ flex: 1 }}>{cue}</T>
            </View>
          ))}
        </Card>
      ) : null}

      {strength && isToday ? (
        <Card>
          <View style={styles.rowBetween}>
            <T kind="h2">العداد</T>
            <T kind="small">{ar(sets.length)} من {ar(item.sets)} مجموعات</T>
          </View>
          {suggested != null ? (
            <NoteView note={{ tone: 'info', title: `الوزن المقترح: ${suggested} كجم`, text: last ? `آخر مرة ${last.w} كجم × ${last.reps.join('، ')}. ${ses.phase.n}.` : ses.phase.n }} />
          ) : (
            <T kind="small">أول مرة؟ {g('ابدأ', 'ابدأي')} بوزن {g('تقدر', 'تقدري')} تعمل{g('', 'ي')} بيه {ar(item.reps[1])} عدة بحركة نضيفة.</T>
          )}
          <View style={[styles.row, { gap: 8 }]}>
            <Stepper label="الوزن (كجم)" value={w} step={stepFor(id)} onChange={setW} />
            <Stepper label="العدات" value={r} step={1} onChange={setR} />
          </View>
          {rest > 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 8, borderRadius: 14, backgroundColor: c.soft }}>
              <T kind="label">راحة</T>
              <Text style={{ fontFamily: fonts.display, fontSize: 36, color: c.petrol, fontVariant: ['tabular-nums'] }}>{Math.floor(rest / 60)}:{String(rest % 60).padStart(2, '0')}</Text>
              <Btn kind="text" title="تخطي الراحة" onPress={() => setRest(0)} />
            </View>
          ) : null}
          {sets.map((s, i) => (
            <View key={i} style={[styles.rowBetween, { paddingVertical: 4 }]}>
              <T kind="body">مجموعة {ar(i + 1)}</T>
              <T kind="body" style={{ fontVariant: ['tabular-nums'] }}>{s.w} كجم × {s.r}</T>
            </View>
          ))}
          {!done ? <Btn title={`سجّل${g('', 'ي')} مجموعة ${ar(sets.length + 1)}`} onPress={logSet} /> : null}
          {sets.length ? <Btn kind="text" title="امسح آخر مجموعة" onPress={() => updateDay((d) => ({ ...d, sets: { ...d.sets, [id]: (d.sets[id] ?? []).slice(0, -1) } }))} /> : null}
        </Card>
      ) : null}

      {isToday ? <Btn kind={done || !strength ? 'primary' : 'outline'} title="خلصت التمرين ده" onPress={finish} /> : null}
    </ScrollView>
  );
}
