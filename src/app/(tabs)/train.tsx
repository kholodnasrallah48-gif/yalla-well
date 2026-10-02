import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Card, NoteView, Screen, T, styles } from '../../components/ui.tsx';
import { SCHEDULES, SESSIONS, WEEK_SHORT } from '../../lib/data.ts';
import { weekIndex } from '../../lib/day.ts';
import { genderFor, medical, sessionFor } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

export default function Train() {
  const c = useColors();
  const { profile, day, updateDay } = useStore();
  const todayIdx = weekIndex(new Date());
  const [sel, setSel] = useState(todayIdx);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const isToday = sel === todayIdx;
  const week = programWeek(profile.start, new Date());
  const ses = sessionFor(profile, sel, isToday && day.flare, week);
  const map = SCHEDULES[profile.schedule].map;
  const done = isToday ? day.done : [];
  const n = ses ? ses.items.filter((x) => done.includes(x.id)).length : 0;
  const M = medical(profile);
  const toggle = (id: string) => updateDay((d) => ({ ...d, done: d.done.includes(id) ? d.done.filter((x) => x !== id) : [...d.done, id] }));

  return (
    <Screen title="التمرين">
      <View style={[styles.row, { gap: 5 }]}>
        {WEEK_SHORT.map((w, i) => {
          const s = map[i];
          const pl = s ? SESSIONS[s].pl : null;
          return (
            <Pressable key={w} onPress={() => setSel(i)} accessibilityRole="button" accessibilityState={{ selected: i === sel }}
              style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 6, borderRadius: 12, backgroundColor: c.surface, borderWidth: i === sel ? 2 : 1, borderColor: i === sel ? c.petrol : c.line }}>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12, color: c.ink }}>{w}</Text>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: pl === 'gym' ? c.petrol : pl === 'home' ? c.lime : c.line }} />
              {i === todayIdx ? <Text style={{ fontFamily: fonts.body, fontSize: 9.5, color: c.muted }}>النهارده</Text> : null}
            </Pressable>
          );
        })}
      </View>

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
          {isToday ? (
            <>
              <View style={{ height: 6, borderRadius: 99, backgroundColor: c.soft, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: `${ses.items.length ? (n / ses.items.length) * 100 : 0}%`, backgroundColor: c.lime }} />
              </View>
              <T kind="small">{g('خلصت', 'خلصتي')} {n} من {ses.items.length}</T>
            </>
          ) : null}
          {ses.items.map((x, i) => {
            const on = done.includes(x.id);
            const logged = isToday ? (day.sets[x.id]?.length ?? 0) : 0;
            return (
              <View key={x.id} style={[styles.row, { gap: 12, alignItems: 'flex-start', paddingVertical: 10, borderBottomWidth: i < ses.items.length - 1 ? 1 : 0, borderColor: c.line }]}>
                <Pressable disabled={!isToday} onPress={() => toggle(x.id)} accessibilityRole="checkbox" accessibilityLabel={x.ex.n} accessibilityState={{ checked: on, disabled: !isToday }} hitSlop={8}
                  style={{ width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: c.petrol, backgroundColor: on ? c.petrol : 'transparent', opacity: isToday ? 1 : 0.35, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
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
          {isToday && ses.items.length > 0 && n === ses.items.length ? (
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
