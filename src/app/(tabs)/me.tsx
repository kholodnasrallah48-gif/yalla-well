import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';

import { PhotoPicker } from '../../components/Photo.tsx';
import { Btn, Card, Chip, NoteView, Screen, T, styles } from '../../components/ui.tsx';
import { onSoundChange, setSoundOn, soundOn } from '../../lib/sound.ts';
import { notifyOn, onNotifyChange, setNotifyOn } from '../../lib/notify.ts';
import { CONDITIONS, MEDS, PAINS, SCHEDULES } from '../../lib/data.ts';
import { fmt } from '../../lib/day.ts';
import { L, tx } from '../../lib/i18n.ts';
import { genderFor, medical, targets } from '../../lib/plan.ts';
import { logWeight, weightChange } from '../../lib/weight.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const GOALS = { lose: 'نزول وزن', maintain: 'ثبات الوزن وشد', gain: 'زيادة عضل' };
const GOALS_EN = { lose: 'Lose weight', maintain: 'Maintain & tone', gain: 'Build muscle' };

export default function Me() {
  const { profile, resetAll, saveProfile } = useStore();
  const c = useColors();
  const [kg, setKg] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [sound, setSound] = useState(soundOn());
  useEffect(() => onSoundChange(setSound), []);
  const [notify, setNotify] = useState(notifyOn());
  useEffect(() => onNotifyChange(setNotify), []);
  if (!profile) return null;
  const p = profile;
  const g = genderFor(p.sex);
  const T0 = targets(p);
  const M = medical(p);
  const W = weightChange(p);
  const okKg = Number(kg) >= 30 && Number(kg) <= 300;
  const conds = [...p.conditions.map((id) => tx(CONDITIONS.find((x) => x.id === id)?.n ?? '')), p.otherCond].filter(Boolean);
  const meds = [...p.meds.map((id) => tx(MEDS.find((x) => x.id === id)?.n ?? '')), p.otherMeds].filter(Boolean);
  const pains = [...p.pains.map((id) => tx(PAINS.find((x) => x.id === id)?.n ?? '')), p.otherPain].filter(Boolean);

  return (
    <Screen title={L('ملفي', 'Me')}>
      <Card>
        <PhotoPicker photo={p.photo} name={p.name} onChange={(photo) => saveProfile({ ...p, photo })} />
        <T kind="h2" style={{ textAlign: 'center' }}>{p.name || L('بياناتي', 'My details')}</T>
        <T kind="small">{L(`${p.sex === 'm' ? 'ذكر' : 'أنثى'} · ${p.age} سنة · ${p.height} سم · ${p.weight} كجم`, `${p.sex === 'm' ? 'Male' : 'Female'} · ${p.age} yrs · ${p.height} cm · ${p.weight} kg`)}</T>
        <T kind="small">{L('الهدف:', 'Goal:')} {L(GOALS[p.goal], GOALS_EN[p.goal])} · {tx(SCHEDULES[p.schedule].n)}</T>
        <Btn kind="outline" title={L(g('عدّل بياناتي', 'عدّلي بياناتي'), 'Edit my details')} onPress={() => router.push('/onboarding')} />
      </Card>

      <Card>
        <T kind="h2">{L(g('سجّل وزنك', 'سجّلي وزنك'), 'Log your weight')}</T>
        {W.diff !== 0 ? <T kind="small" color={W.diff < 0 ? c.ok : c.muted}>{L(`بدأت ${W.start} كجم، دلوقتي ${W.now} كجم (${W.diff > 0 ? '+' : ''}${W.diff} كجم)`, `Started ${W.start} kg, now ${W.now} kg (${W.diff > 0 ? '+' : ''}${W.diff} kg)`)}</T> : null}
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder={String(p.weight)} placeholderTextColor={c.muted}
            style={{ flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, backgroundColor: c.surface, textAlign: 'center' }} />
          <Btn title={L('حفظ', 'Save')} disabled={!okKg} onPress={() => { saveProfile(logWeight(p, Number(kg))); setKg(''); }} />
        </View>
      </Card>

      <Card>
        <T kind="h2">{L('هدفك اليومي', 'Your daily target')}</T>
        <View style={[styles.wrap, { rowGap: 12 }]}>
          {[
            [fmt(T0.kcal), L(`سعرة (حرقك ${fmt(T0.tdee)})`, `kcal (you burn ${fmt(T0.tdee)})`)],
            [`${T0.protein}g`, L('بروتين', 'Protein')],
            [`${T0.carbs}g`, L('كارب', 'Carbs')],
            [`${T0.fat}g`, L('دهون', 'Fat')],
          ].map(([v, l]) => (
            <View key={l} style={{ width: '47%' }}>
              <T kind="big" style={{ fontSize: 22 }}>{v}</T>
              <T kind="small">{l}</T>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <T kind="h2">{L('الهيستوري الطبي', 'Medical history')}</T>
        <T kind="small">{L('الأمراض:', 'Conditions:')} {conds.length ? conds.join(L('، ', ', ')) : L('مفيش', 'None')}</T>
        <T kind="small">{L('الأدوية المستمرة:', 'Regular medications:')} {meds.length ? meds.join(L('، ', ', ')) : L('مفيش', 'None')}</T>
        <T kind="small">{L('أماكن الألم:', 'Pain areas:')} {pains.length ? pains.join(L('، ', ', ')) : L('مفيش', 'None')}</T>
      </Card>

      {M.food.length ? <Card><T kind="h2">{L('ملاحظات الأكل', 'Food notes')}</T>{M.food.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}
      {M.train.length ? <Card><T kind="h2">{L('ملاحظات التمرين', 'Training notes')}</T>{M.train.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <T kind="h3">{L('الأصوات', 'Sounds')}</T>
            <T kind="small">{L('صوت خفيف مع الأزرار وإضافة الأكل وتعليم التمارين. بيسكت لو الموبايل على الصامت.', 'A soft sound for buttons, adding food and ticking off exercises. Muted when your phone is on silent.')}</T>
          </View>
          <Chip label={sound ? L('شغالة', 'On') : L('مقفولة', 'Off')} on={sound} onPress={() => { setSoundOn(!sound); setSound(!sound); }} />
        </View>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <T kind="h3">{L('التنبيهات', 'Reminders')}</T>
            <T kind="small">{L(`تنبيه على الموبايل يفكرك بالفطار والغدا والعشا والمياه والتمرين، ولو ${g('مسجلتش', 'مسجلتيش')} أكل في اليوم.`, "Phone reminders for breakfast, lunch, dinner, water and your workout, and when you haven't logged any food.")}</T>
          </View>
          <Chip label={notify ? L('شغالة', 'On') : L('مقفولة', 'Off')} on={notify} onPress={() => { setNotifyOn(!notify); setNotify(!notify); }} />
        </View>
      </Card>

      <T kind="small" style={{ textAlign: 'center' }}>{L('بياناتك محفوظة على الموبايل ده بس.\nالتطبيق ده للمساعدة ومش بديل عن دكتورك.', "Your data is saved on this phone only.\nThis app is here to help and doesn't replace your doctor.")}</T>
      {confirm ? (
        <Card>
          <T kind="body">{L(`${g('متأكد', 'متأكدة')}؟ هتتمسح كل بياناتك وأكلك.`, 'Are you sure? All your data and food logs will be deleted.')}</T>
          <View style={[styles.row, { gap: 10 }]}>
            <Btn kind="secondary" title={L('أيوه امسح', 'Yes, delete')} onPress={async () => { await resetAll(); router.replace('/onboarding'); }} style={{ flex: 1 }} />
            <Btn kind="outline" title={L('لأ', 'No')} onPress={() => setConfirm(false)} style={{ flex: 1 }} />
          </View>
        </Card>
      ) : (
        <Btn kind="text" title={L(g('امسح كل بياناتي وابدأ من الأول', 'امسحي كل بياناتي وابدأي من الأول'), 'Delete all my data and start over')} onPress={() => setConfirm(true)} />
      )}
    </Screen>
  );
}
