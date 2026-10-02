import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Btn, Card, Chip, NoteView, Screen, T, styles } from '../../components/ui.tsx';
import { onSoundChange, setSoundOn, soundOn } from '../../lib/sound.ts';
import { CONDITIONS, MEDS, PAINS, SCHEDULES } from '../../lib/data.ts';
import { fmt } from '../../lib/day.ts';
import { genderFor, medical, targets } from '../../lib/plan.ts';
import { useStore } from '../../store/AppStore.tsx';

const GOALS = { lose: 'نزول وزن', maintain: 'ثبات الوزن وشد', gain: 'زيادة عضل' };

export default function Me() {
  const { profile, resetAll } = useStore();
  const [confirm, setConfirm] = useState(false);
  const [sound, setSound] = useState(soundOn());
  useEffect(() => onSoundChange(setSound), []);
  if (!profile) return null;
  const p = profile;
  const g = genderFor(p.sex);
  const T0 = targets(p);
  const M = medical(p);
  const conds = [...p.conditions.map((id) => CONDITIONS.find((x) => x.id === id)?.n), p.otherCond].filter(Boolean);
  const meds = [...p.meds.map((id) => MEDS.find((x) => x.id === id)?.n), p.otherMeds].filter(Boolean);
  const pains = [...p.pains.map((id) => PAINS.find((x) => x.id === id)?.n), p.otherPain].filter(Boolean);

  return (
    <Screen title="ملفي">
      <Card>
        <T kind="h2">{p.name || 'بياناتي'}</T>
        <T kind="small">{p.sex === 'm' ? 'ذكر' : 'أنثى'} · {p.age} سنة · {p.height} سم · {p.weight} كجم</T>
        <T kind="small">الهدف: {GOALS[p.goal]} · {SCHEDULES[p.schedule].n}</T>
        <Btn kind="outline" title={g('عدّل بياناتي', 'عدّلي بياناتي')} onPress={() => router.push('/onboarding')} />
      </Card>

      <Card>
        <T kind="h2">هدفك اليومي</T>
        <View style={[styles.wrap, { rowGap: 12 }]}>
          {[
            [fmt(T0.kcal), `سعرة (حرقك ${fmt(T0.tdee)})`],
            [`${T0.protein}g`, 'بروتين'],
            [`${T0.carbs}g`, 'كارب'],
            [`${T0.fat}g`, 'دهون'],
          ].map(([v, l]) => (
            <View key={l} style={{ width: '47%' }}>
              <T kind="big" style={{ fontSize: 22 }}>{v}</T>
              <T kind="small">{l}</T>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <T kind="h2">الهيستوري الطبي</T>
        <T kind="small">الأمراض: {conds.length ? conds.join('، ') : 'مفيش'}</T>
        <T kind="small">الأدوية المستمرة: {meds.length ? meds.join('، ') : 'مفيش'}</T>
        <T kind="small">أماكن الألم: {pains.length ? pains.join('، ') : 'مفيش'}</T>
      </Card>

      {M.food.length ? <Card><T kind="h2">ملاحظات الأكل</T>{M.food.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}
      {M.train.length ? <Card><T kind="h2">ملاحظات التمرين</T>{M.train.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <T kind="h3">الأصوات</T>
            <T kind="small">صوت خفيف مع الأزرار وإضافة الأكل وتعليم التمارين. بيسكت لو الموبايل على الصامت.</T>
          </View>
          <Chip label={sound ? 'شغالة' : 'مقفولة'} on={sound} onPress={() => { setSoundOn(!sound); setSound(!sound); }} />
        </View>
      </Card>

      <T kind="small" style={{ textAlign: 'center' }}>بياناتك محفوظة على الموبايل ده بس.{'\n'}التطبيق ده للمساعدة ومش بديل عن دكتورك.</T>
      {confirm ? (
        <Card>
          <T kind="body">{g('متأكد', 'متأكدة')}؟ هتتمسح كل بياناتك وأكلك.</T>
          <View style={[styles.row, { gap: 10 }]}>
            <Btn kind="secondary" title="أيوه امسح" onPress={async () => { await resetAll(); router.replace('/onboarding'); }} style={{ flex: 1 }} />
            <Btn kind="outline" title="لأ" onPress={() => setConfirm(false)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Btn kind="text" title={g('امسح كل بياناتي وابدأ من الأول', 'امسحي كل بياناتي وابدأي من الأول')} onPress={() => setConfirm(true)} />
      )}
    </Screen>
  );
}
