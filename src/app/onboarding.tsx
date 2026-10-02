import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Btn, Card, Chip, Choice, NoteView, Ring, START, T, WeekStrip, styles } from '../components/ui.tsx';
import { CONDITIONS, MEDS, PAINS, SCHEDULES, type ScheduleId } from '../lib/data.ts';
import { fmt } from '../lib/day.ts';
import { genderFor, medical, targets, type Profile } from '../lib/plan.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const STEPS = ['basics', 'life', 'plan', 'cond', 'meds', 'pain', 'done'] as const;
type Draft = Partial<Profile> & Pick<Profile, 'sex' | 'conditions' | 'meds' | 'pains' | 'level'>;

export default function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(() => profile ? { ...profile } : { sex: 'f', conditions: [], meds: [], pains: [], level: 'beg' });
  const [nums, setNums] = useState({ age: profile ? String(profile.age) : '', height: profile ? String(profile.height) : '', weight: profile ? String(profile.weight) : '' });
  const [err, setErr] = useState('');
  const scroll = useRef<ScrollView>(null);
  const g = genderFor(d.sex);
  const st = STEPS[step];
  const set = (patch: Partial<Draft>) => { setErr(''); setD((x) => ({ ...x, ...patch })); };
  const toggle = (key: 'conditions' | 'meds' | 'pains', id: string) =>
    setD((x) => { const a = x[key] as string[]; return { ...x, [key]: a.includes(id) ? a.filter((v) => v !== id) : [...a, id] }; });
  const input = { borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlign: START } as const;

  const validate = (): string | null => {
    if (st === 'basics') {
      const age = +nums.age, height = +nums.height, weight = +nums.weight.replace(',', '.');
      if (!(age >= 14 && age <= 90)) return `${g('اكتب', 'اكتبي')} السن (من ١٤ لـ ٩٠).`;
      if (!(height >= 120 && height <= 220)) return `${g('اكتب', 'اكتبي')} الطول بالسنتي (مثلًا 165).`;
      if (!(weight >= 30 && weight <= 250)) return `${g('اكتب', 'اكتبي')} الوزن بالكيلو (مثلًا 68).`;
      setD((x) => ({ ...x, age, height, weight }));
    }
    if (st === 'life' && (!d.activity || !d.goal)) return `${g('اختار', 'اختاري')} حركتك في اليوم وهدفك.`;
    if (st === 'plan' && !d.schedule) return `${g('اختار', 'اختاري')} نظام التمرين.`;
    return null;
  };
  const next = () => {
    const e = validate();
    if (e) { setErr(e); return; }
    if (st === 'done') {
      saveProfile({ name: '', ...d } as Profile);
      router.replace('/');
      return;
    }
    setStep(step + 1);
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  const full = st === 'done' ? ({ name: '', ...d } as Profile) : null;

  return (
    <ScrollView ref={scroll} style={{ flex: 1, backgroundColor: c.bg }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <View style={[styles.row, { gap: 4 }]}>
        {STEPS.map((s, i) => <View key={s} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= step ? c.petrol : c.line }} />)}
      </View>

      {st === 'basics' && <>
        <T kind="h1">{profile ? 'تعديل بياناتك' : `أهلًا ${g('بيك', 'بيكي')} في نَبض`}</T>
        <T kind="body" color={c.muted}>محتاجين شوية بيانات عشان نحسب السعرات ونعمل خطة تمرين مناسبة {g('ليك', 'ليكي')}.</T>
        <View style={{ gap: 4 }}><T kind="label">الاسم</T><TextInput value={d.name ?? ''} onChangeText={(name) => set({ name })} style={input} autoComplete="given-name" /></View>
        <View style={[styles.row, { gap: 8 }]}>
          <Choice title="أنثى" on={d.sex === 'f'} onPress={() => set({ sex: 'f' })} style={{ flex: 1 }} />
          <Choice title="ذكر" on={d.sex === 'm'} onPress={() => set({ sex: 'm' })} style={{ flex: 1 }} />
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          {([['age', 'السن'], ['height', 'الطول (سم)'], ['weight', 'الوزن (كجم)']] as const).map(([k, l]) => (
            <View key={k} style={{ flex: 1, gap: 4 }}>
              <T kind="label">{l}</T>
              <TextInput value={nums[k]} onChangeText={(v) => { setErr(''); setNums({ ...nums, [k]: v }); }} keyboardType="decimal-pad" style={input} />
            </View>
          ))}
        </View>
      </>}

      {st === 'life' && <>
        <T kind="h1">يومك وهدفك</T>
        <T kind="label">حركتك في اليوم العادي (من غير التمرين)</T>
        <Choice title={g('قاعد معظم اليوم', 'قاعدة معظم اليوم')} sub="شغل مكتب أو مذاكرة" on={d.activity === 'low'} onPress={() => set({ activity: 'low' })} />
        <Choice title="حركة متوسطة" sub="مشي وحركة في البيت والشغل" on={d.activity === 'mid'} onPress={() => set({ activity: 'mid' })} />
        <Choice title="حركة كتير" sub="شغل فيه وقوف ومشي معظم اليوم" on={d.activity === 'high'} onPress={() => set({ activity: 'high' })} />
        <T kind="label">هدفك</T>
        <Choice title="نزول وزن" sub="نحرق دهون ونحافظ على العضل" on={d.goal === 'lose'} onPress={() => set({ goal: 'lose' })} />
        <Choice title="ثبات وشد" sub="نفس الوزن بجسم أشد" on={d.goal === 'maintain'} onPress={() => set({ goal: 'maintain' })} />
        <Choice title="زيادة عضل" sub="نبني عضل بزيادة بسيطة في السعرات" on={d.goal === 'gain'} onPress={() => set({ goal: 'gain' })} />
      </>}

      {st === 'plan' && <>
        <T kind="h1">نظام التمرين</T>
        {(Object.keys(SCHEDULES) as ScheduleId[]).map((k) => (
          <Choice key={k} title={SCHEDULES[k].n} sub={SCHEDULES[k].d} on={d.schedule === k} onPress={() => set({ schedule: k })} />
        ))}
        <T kind="label">{g('مستواك', 'مستواكي')}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <Choice title={g('مبتدئ', 'مبتدئة')} sub="أقل من ٦ شهور" on={d.level === 'beg'} onPress={() => set({ level: 'beg' })} style={{ flex: 1 }} />
          <Choice title={g('متوسط', 'متوسطة')} sub={g('بتتمرن بانتظام', 'بتتمرني بانتظام')} on={d.level === 'mid'} onPress={() => set({ level: 'mid' })} style={{ flex: 1 }} />
        </View>
      </>}

      {st === 'cond' && <>
        <T kind="h1">عندك أي مرض مناعي أو مزمن؟</T>
        <T kind="body" color={c.muted}>{g('اختار', 'اختاري')} كل اللي ينطبق. لو مفيش، {g('دوس', 'دوسي')} التالي على طول.</T>
        <View style={styles.wrap}>{CONDITIONS.map((x) => <Chip key={x.id} label={x.n} on={d.conditions.includes(x.id)} onPress={() => toggle('conditions', x.id)} />)}</View>
        <View style={{ gap: 4 }}><T kind="label">حاجة تانية مش في القائمة</T><TextInput value={d.otherCond ?? ''} onChangeText={(otherCond) => set({ otherCond })} style={input} /></View>
      </>}

      {st === 'meds' && <>
        <T kind="h1">{g('بتاخد', 'بتاخدي')} أدوية بشكل مستمر؟</T>
        <T kind="body" color={c.muted}>ده بيأثر على الأكل والتمرين، زي الكورتيزون ودوا الغدة.</T>
        <View style={styles.wrap}>{MEDS.map((x) => <Chip key={x.id} label={x.n} on={d.meds.includes(x.id)} onPress={() => toggle('meds', x.id)} />)}</View>
        <View style={{ gap: 4 }}><T kind="label">دوا تاني</T><TextInput value={d.otherMeds ?? ''} onChangeText={(otherMeds) => set({ otherMeds })} style={input} /></View>
      </>}

      {st === 'pain' && <>
        <T kind="h1">في مكان بيوجعك في التمرين؟</T>
        <T kind="body" color={c.muted}>هنبدل التمارين اللي بتضغط عليه بتمارين ألطف.</T>
        <View style={styles.wrap}>{PAINS.map((x) => <Chip key={x.id} label={x.n} on={d.pains.includes(x.id)} onPress={() => toggle('pains', x.id)} />)}</View>
      </>}

      {st === 'done' && full && (() => {
        const T0 = targets(full);
        const M = medical(full);
        const notes = [...M.train, ...M.food].slice(0, 4);
        return <>
          <T kind="h1">{g('خطتك', 'خطتك')} جاهزة</T>
          <Card>
            <View style={[styles.row, { gap: 14 }]}>
              <Ring value={0} max={1} size={72} stroke={10} />
              <View style={{ flex: 1 }}>
                <T kind="big">{fmt(T0.kcal)}</T>
                <T kind="small">سعرة في اليوم · بروتين {T0.protein}g · {T0.waterCups} كوباية مياه</T>
              </View>
            </View>
          </Card>
          <Card tone="petrol">
            <T kind="label" color={c.onPetrol}>نظامك</T>
            <T kind="h2" color={c.onPetrol}>{SCHEDULES[full.schedule].n}</T>
            <WeekStrip profile={full} today={-1} />
          </Card>
          {notes.length ? <Card><T kind="h2">عدّلنا الخطة على حسب حالتك</T>{notes.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}
          <T kind="small" style={{ textAlign: 'center' }}>التطبيق ده للمساعدة ومش بديل عن دكتورك. لو عندك مرض مناعي أو {g('بتاخد', 'بتاخدي')} أدوية، {g('اعرض', 'اعرضي')} الخطة على دكتورك.</T>
        </>;
      })()}

      {err ? <T kind="small" color={c.bad}>{err}</T> : null}
      <View style={[styles.row, { gap: 10 }]}>
        {step > 0
          ? <Btn kind="outline" title="رجوع" onPress={() => { setErr(''); setStep(step - 1); }} />
          : profile ? <Btn kind="outline" title="إلغاء" onPress={() => router.back()} /> : null}
        <Btn title={st === 'done' ? 'يلا نبدأ' : 'التالي'} onPress={next} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}
