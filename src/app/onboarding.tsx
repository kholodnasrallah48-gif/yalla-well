import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logWeight } from '../lib/weight.ts';
import { PhotoPicker } from '../components/Photo.tsx';
import { Bg, Btn, Card, Chip, Choice, NoteView, Ring, START, T, WeekStrip, styles } from '../components/ui.tsx';
import { CONDITIONS, MEDS, PAINS, SCHEDULES, SCHEDULE_ORDER } from '../lib/data.ts';
import { fmt } from '../lib/day.ts';
import { L, getLang, setLang, tx } from '../lib/i18n.ts';
import { genderFor, medical, targets, type CondInfo, type Profile } from '../lib/plan.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const STEPS = ['lang', 'basics', 'life', 'plan', 'cond', 'condx', 'meds', 'pain', 'done'] as const;
type Draft = Partial<Profile> & Pick<Profile, 'sex' | 'conditions' | 'meds' | 'pains' | 'level'>;

export default function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  // The language pick only shows the first time; editing starts at the details.
  const first = profile ? 1 : 0;
  const [step, setStep] = useState(first);
  const [d, setD] = useState<Draft>(() => profile ? { ...profile } : { sex: 'f', conditions: [], meds: [], pains: [], level: 'beg' });
  const [nums, setNums] = useState({ age: profile ? String(profile.age) : '', height: profile ? String(profile.height) : '', weight: profile ? String(profile.weight) : '' });
  const [err, setErr] = useState('');
  const [otherPain, setOtherPain] = useState(!!profile?.otherPain);
  const scroll = useRef<ScrollView>(null);
  const g = genderFor(d.sex);
  const st = STEPS[step];
  const set = (patch: Partial<Draft>) => { setErr(''); setD((x) => ({ ...x, ...patch })); };
  const toggle = (key: 'conditions' | 'meds' | 'pains', id: string) =>
    setD((x) => { const a = x[key] as string[]; return { ...x, [key]: a.includes(id) ? a.filter((v) => v !== id) : [...a, id] }; });
  const input = { borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlign: START() } as const;

  const validate = (): string | null => {
    if (st === 'basics') {
      const age = +nums.age, height = +nums.height, weight = +nums.weight.replace(',', '.');
      if (!(age >= 14 && age <= 90)) return L(`${g('اكتب', 'اكتبي')} السن (من ١٤ لـ ٩٠).`, 'Enter your age (14 to 90).');
      if (!(height >= 120 && height <= 220)) return L(`${g('اكتب', 'اكتبي')} الطول بالسنتي (مثلًا 165).`, 'Enter your height in cm (e.g. 165).');
      if (!(weight >= 30 && weight <= 250)) return L(`${g('اكتب', 'اكتبي')} الوزن بالكيلو (مثلًا 68).`, 'Enter your weight in kg (e.g. 68).');
      setD((x) => ({ ...x, age, height, weight }));
    }
    if (st === 'life' && (!d.activity || !d.goal)) return L(`${g('اختار', 'اختاري')} حركتك في اليوم وهدفك.`, 'Pick your daily activity and your goal.');
    if (st === 'plan' && !d.schedule) return L(`${g('اختار', 'اختاري')} نظام التمرين.`, 'Pick a workout plan.');
    return null;
  };
  const next = () => {
    const e = validate();
    if (e) { setErr(e); return; }
    if (st === 'done') {
      const next = { name: '', start: profile?.start ?? new Date().toISOString().slice(0, 10), ...d } as Profile;
      // A changed weight counts as a weigh-in, so progress follows it.
      saveProfile(profile && profile.weight !== next.weight ? logWeight({ ...next, weight: profile.weight }, next.weight) : next);
      router.replace('/');
      return;
    }
    setStep(skipTo(step + 1, 1));
    scroll.current?.scrollTo({ y: 0, animated: false });
  };
  // The condition-details step only shows when a condition was picked.
  const skipTo = (i: number, dir: 1 | -1) => (STEPS[i] === 'condx' && !d.conditions.length ? i + dir : i);
  const setInfo = (id: string, patch: Partial<CondInfo>) => setD((x) => ({ ...x, condInfo: { ...x.condInfo, [id]: { ...x.condInfo?.[id], ...patch } } }));
  const full = st === 'done' ? ({ name: '', ...d } as Profile) : null;

  return (
    <Bg><ScrollView ref={scroll} style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <View style={[styles.row, { gap: 4 }]}>
        {STEPS.map((s, i) => <View key={s} style={{ flex: 1, height: 4, borderRadius: 99, backgroundColor: i <= step ? c.petrol : c.line }} />)}
      </View>

      {st === 'lang' && <>
        <View style={{ alignItems: 'center', gap: 6, paddingTop: 32, paddingBottom: 16 }}>
          <T kind="h1" style={{ textAlign: 'center' }}>يلا ويل · Yalla Well</T>
          <T kind="body" color={c.muted} style={{ textAlign: 'center' }}>اختار لغتك · Choose your language</T>
        </View>
        <Choice title="العربية" sub="التطبيق كله بالعربي" on={getLang() === 'ar'} onPress={() => setLang('ar')} />
        <Choice title="English" sub="The whole app in English" on={getLang() === 'en'} onPress={() => setLang('en')} />
        <T kind="small" color={c.muted} style={{ textAlign: 'center' }}>{L('تقدر تغيرها في أي وقت من الصفحة الرئيسية أو ملفي.', 'You can change it any time from Home or Me.')}</T>
      </>}

      {st === 'basics' && <>
        <T kind="h1">{profile ? L('تعديل بياناتك', 'Edit your details') : L(`أهلًا ${g('بيك', 'بيكي')} في يلا ويل`, 'Welcome to Yalla Well')}</T>
        <T kind="body" color={c.muted}>{L(`محتاجين شوية بيانات عشان نحسب السعرات ونعمل خطة تمرين مناسبة ${g('ليك', 'ليكي')}.`, 'We need a few details to work out your calories and build a workout plan that fits you.')}</T>
        <PhotoPicker photo={d.photo} name={d.name} onChange={(photo) => set({ photo })} />
        <T kind="small" color={c.muted} style={{ textAlign: 'center' }}>{L('الصورة اختيارية، تقدر تضيفها بعدين من ملفي.', 'Photo is optional; you can add it later from Me.')}</T>
        <View style={{ gap: 4 }}><T kind="label">{L('الاسم', 'Name')}</T><TextInput value={d.name ?? ''} onChangeText={(name) => set({ name })} style={input} autoComplete="given-name" /></View>
        <View style={[styles.row, { gap: 8 }]}>
          <Choice title={L('أنثى', 'Female')} on={d.sex === 'f'} onPress={() => set({ sex: 'f' })} style={{ flex: 1 }} />
          <Choice title={L('ذكر', 'Male')} on={d.sex === 'm'} onPress={() => set({ sex: 'm' })} style={{ flex: 1 }} />
        </View>
        <View style={[styles.row, { gap: 8 }]}>
          {([['age', L('السن', 'Age')], ['height', L('الطول (سم)', 'Height (cm)')], ['weight', L('الوزن (كجم)', 'Weight (kg)')]] as const).map(([k, l]) => (
            <View key={k} style={{ flex: 1, gap: 4 }}>
              <T kind="label">{l}</T>
              <TextInput value={nums[k]} onChangeText={(v) => { setErr(''); setNums({ ...nums, [k]: v }); }} keyboardType="decimal-pad" style={input} />
            </View>
          ))}
        </View>
      </>}

      {st === 'life' && <>
        <T kind="h1">{L('يومك وهدفك', 'Your day and your goal')}</T>
        <T kind="label">{L('حركتك في اليوم العادي (من غير التمرين)', 'How active is a normal day (not counting workouts)?')}</T>
        <Choice title={L(g('قاعد معظم اليوم', 'قاعدة معظم اليوم'), 'Sitting most of the day')} sub={L('شغل مكتب أو مذاكرة', 'Desk job or studying')} on={d.activity === 'low'} onPress={() => set({ activity: 'low' })} />
        <Choice title={L('حركة متوسطة', 'Moderately active')} sub={L('مشي وحركة في البيت والشغل', 'Walking and moving around at home and work')} on={d.activity === 'mid'} onPress={() => set({ activity: 'mid' })} />
        <Choice title={L('حركة كتير', 'Very active')} sub={L('شغل فيه وقوف ومشي معظم اليوم', 'On your feet and walking most of the day')} on={d.activity === 'high'} onPress={() => set({ activity: 'high' })} />
        <T kind="label">{L('هدفك', 'Your goal')}</T>
        <Choice title={L('نزول وزن', 'Lose weight')} sub={L('نحرق دهون ونحافظ على العضل', 'Burn fat and keep your muscle')} on={d.goal === 'lose'} onPress={() => set({ goal: 'lose' })} />
        <Choice title={L('ثبات وشد', 'Maintain and tone')} sub={L('نفس الوزن بجسم أشد', 'Same weight, firmer body')} on={d.goal === 'maintain'} onPress={() => set({ goal: 'maintain' })} />
        <Choice title={L('زيادة عضل', 'Build muscle')} sub={L('نبني عضل بزيادة بسيطة في السعرات', 'Build muscle with a small calorie surplus')} on={d.goal === 'gain'} onPress={() => set({ goal: 'gain' })} />
      </>}

      {st === 'plan' && <>
        <T kind="h1">{L('نظام التمرين', 'Workout plan')}</T>
        {SCHEDULE_ORDER.map((k) => (
          <Choice key={k} title={tx(SCHEDULES[k].n)} sub={tx(SCHEDULES[k].d)} on={d.schedule === k} onPress={() => set({ schedule: k })} />
        ))}
        <T kind="label">{L(g('مستواك', 'مستواكي'), 'Your level')}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <Choice title={L(g('مبتدئ', 'مبتدئة'), 'Beginner')} sub={L('أقل من ٦ شهور', 'Less than 6 months')} on={d.level === 'beg'} onPress={() => set({ level: 'beg' })} style={{ flex: 1 }} />
          <Choice title={L(g('متوسط', 'متوسطة'), 'Intermediate')} sub={L(g('بتتمرن بانتظام', 'بتتمرني بانتظام'), 'You train regularly')} on={d.level === 'mid'} onPress={() => set({ level: 'mid' })} style={{ flex: 1 }} />
        </View>
      </>}

      {st === 'cond' && <>
        <T kind="h1">{L('عندك أي مرض مناعي أو مزمن؟', 'Any autoimmune or chronic condition?')}</T>
        <T kind="body" color={c.muted}>{L(`${g('اختار', 'اختاري')} كل اللي ينطبق. لو مفيش، ${g('دوس', 'دوسي')} التالي على طول.`, 'Pick all that apply. If none, just tap Next.')}</T>
        <View style={styles.wrap}>{CONDITIONS.map((x) => <Chip key={x.id} label={tx(x.n)} on={d.conditions.includes(x.id)} onPress={() => toggle('conditions', x.id)} />)}</View>
        <View style={{ gap: 4 }}><T kind="label">{L('حاجة تانية مش في القائمة', 'Something else not on the list')}</T><TextInput value={d.otherCond ?? ''} onChangeText={(otherCond) => set({ otherCond })} style={input} /></View>
      </>}

      {st === 'condx' && <>
        <T kind="h1">{L(`${g('احكيلنا', 'احكيلنا')} أكتر عن حالتك`, 'Tell us more about your condition')}</T>
        <T kind="body" color={c.muted}>{L('الإجابات دي بتخلي الخطة أدق ليك. كلها اختيارية.', 'These answers make the plan fit you better. All optional.').replace('ليك', g('ليك', 'ليكي'))}</T>
        {d.conditions.map((id) => {
          const ci = d.condInfo?.[id] ?? {};
          const sugar = ['t1d', 't2d', 'ir'].includes(id);
          const thyroid = id === 'hashimoto' || id === 'graves';
          const joints = ['ra', 'psoriasis', 'lupus'].includes(id);
          const gut = id === 'ibd' || id === 'celiac';
          return (
            <Card key={id}>
              <T kind="h2">{tx(CONDITIONS.find((x) => x.id === id)?.n ?? id)}</T>
              <T kind="label">{L('الحالة دلوقتي', 'How is it right now?')}</T>
              <View style={styles.wrap}>
                {([['stable', L('مستقرة ومتابعة', 'Stable and followed up')], ['active', L('فيها نشاط أو هجمة دلوقتي', 'Active or flaring now')], ['new', L('متشخصة جديد (أقل من ٦ شهور)', 'Newly diagnosed (under 6 months)')]] as const).map(([k, l]) => (
                  <Chip key={k} label={l} on={ci.status === k} onPress={() => setInfo(id, { status: ci.status === k ? undefined : k })} />
                ))}
              </View>
              {sugar ? <>
                <T kind="label">{L('السكر بيهبط معاك؟', 'Does your blood sugar drop?').replace('معاك', g('معاك', 'معاكي'))}</T>
                <View style={styles.wrap}>
                  {([['never', L('لأ', 'No')], ['sometimes', L('أحيانًا', 'Sometimes')], ['often', L('كتير', 'Often')]] as const).map(([k, l]) => (
                    <Chip key={k} label={l} on={ci.hypos === k} onPress={() => setInfo(id, { hypos: ci.hypos === k ? undefined : k })} />
                  ))}
                </View>
                <View style={{ gap: 4 }}><T kind="label">{L('آخر تحليل تراكمي HbA1c (٪) لو فاكر', 'Last HbA1c (%) if you know it').replace('فاكر', g('فاكر', 'فاكرة'))}</T><TextInput value={ci.lab ?? ''} onChangeText={(v) => setInfo(id, { lab: v })} keyboardType="decimal-pad" placeholder="7.2" placeholderTextColor={c.muted} style={input} /></View>
              </> : null}
              {thyroid ? <View style={{ gap: 4 }}><T kind="label">{L('آخر تحليل TSH لو فاكر', 'Last TSH result if you know it').replace('فاكر', g('فاكر', 'فاكرة'))}</T><TextInput value={ci.lab ?? ''} onChangeText={(v) => setInfo(id, { lab: v })} keyboardType="decimal-pad" placeholder="2.5" placeholderTextColor={c.muted} style={input} /></View> : null}
              {joints ? <>
                <T kind="label">{L('عندك تيبس الصبح أكتر من نص ساعة؟', 'Morning stiffness over half an hour?')}</T>
                <View style={styles.wrap}>
                  <Chip label={L('أيوة', 'Yes')} on={ci.stiff === true} onPress={() => setInfo(id, { stiff: ci.stiff === true ? undefined : true })} />
                  <Chip label={L('لأ', 'No')} on={ci.stiff === false} onPress={() => setInfo(id, { stiff: ci.stiff === false ? undefined : false })} />
                </View>
              </> : null}
              {gut ? <View style={{ gap: 4 }}><T kind="label">{L('أكلات بتتعبك', 'Foods that upset you').replace('بتتعبك', g('بتتعبك', 'بتتعبكي'))}</T><TextInput value={ci.trigger ?? ''} onChangeText={(v) => setInfo(id, { trigger: v })} placeholder={L('مثلًا: اللبن، المقلي', 'e.g. milk, fried food')} placeholderTextColor={c.muted} style={input} /></View> : null}
            </Card>
          );
        })}
        <View style={{ gap: 4 }}>
          <T kind="label">{L(`الدكتور قال${g('لك', 'لك')} تبعد${g('', 'ي')} عن حاجة؟`, 'Did your doctor tell you to avoid anything?')}</T>
          <TextInput value={d.doctorSaid ?? ''} onChangeText={(v) => set({ doctorSaid: v })} multiline placeholder={L('مثلًا: بلاش رفع أوزان تقيلة، بلاش صيام', 'e.g. no heavy lifting, no fasting')} placeholderTextColor={c.muted} style={[input, { minHeight: 70, textAlignVertical: 'top' }]} />
        </View>
      </>}

      {st === 'meds' && <>
        <T kind="h1">{L(`${g('بتاخد', 'بتاخدي')} أدوية بشكل مستمر؟`, 'Do you take any regular medication?')}</T>
        <T kind="body" color={c.muted}>{L('ده بيأثر على الأكل والتمرين، زي الكورتيزون ودوا الغدة.', 'Some medications, like cortisone and thyroid meds, affect food and training.')}</T>
        <View style={styles.wrap}>{MEDS.map((x) => <Chip key={x.id} label={tx(x.n)} on={d.meds.includes(x.id)} onPress={() => toggle('meds', x.id)} />)}</View>
        <View style={{ gap: 4 }}><T kind="label">{L('دوا تاني', 'Other medication')}</T><TextInput value={d.otherMeds ?? ''} onChangeText={(otherMeds) => set({ otherMeds })} style={input} /></View>
      </>}

      {st === 'pain' && <>
        <T kind="h1">{L('في مكان بيوجعك في التمرين؟', 'Does anything hurt when you work out?')}</T>
        <T kind="body" color={c.muted}>{L('هنبدل التمارين اللي بتضغط عليه بتمارين ألطف.', "We'll swap exercises that strain it for gentler ones.")}</T>
        <View style={styles.wrap}>
          <Chip label={L('مفيش، الحمد لله', 'Nothing, thankfully')} on={!d.pains.length && !otherPain} onPress={() => { setOtherPain(false); set({ pains: [], otherPain: '' }); }} />
          {PAINS.map((x) => <Chip key={x.id} label={tx(x.n)} on={d.pains.includes(x.id)} onPress={() => toggle('pains', x.id)} />)}
          <Chip label={L('أخرى', 'Other')} on={otherPain} onPress={() => { if (otherPain) set({ otherPain: '' }); setOtherPain(!otherPain); }} />
        </View>
        {otherPain ? <View style={{ gap: 4 }}><T kind="label">{L('فين بالظبط؟', 'Where exactly?')}</T><TextInput value={d.otherPain ?? ''} onChangeText={(v) => set({ otherPain: v })} style={input} /></View> : null}
      </>}

      {st === 'done' && full && (() => {
        const T0 = targets(full);
        const M = medical(full);
        const notes = [...M.train, ...M.food].slice(0, 4);
        return <>
          <T kind="h1">{L(`${g('خطتك', 'خطتك')} جاهزة`, 'Your plan is ready')}</T>
          <Card>
            <View style={[styles.row, { gap: 14 }]}>
              <Ring value={0} max={1} size={72} stroke={10} />
              <View style={{ flex: 1 }}>
                <T kind="big">{fmt(T0.kcal)}</T>
                <T kind="small">{L(`سعرة في اليوم · بروتين ${T0.protein}g · ${T0.waterCups} كوباية مياه`, `kcal a day · ${T0.protein}g protein · ${T0.waterCups} cups of water`)}</T>
              </View>
            </View>
          </Card>
          <Card tone="petrol">
            <T kind="label" color={c.onHero}>{L('نظامك', 'Your plan')}</T>
            <T kind="h2" color={c.onHero}>{tx(SCHEDULES[full.schedule].n)}</T>
            <WeekStrip profile={full} today={-1} />
          </Card>
          {notes.length ? <Card><T kind="h2">{L('عدّلنا الخطة على حسب حالتك', 'We adjusted the plan to your health')}</T>{notes.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}
          <T kind="small" style={{ textAlign: 'center' }}>{L(`التطبيق ده للمساعدة ومش بديل عن دكتورك. لو عندك مرض مناعي أو ${g('بتاخد', 'بتاخدي')} أدوية، ${g('اعرض', 'اعرضي')} الخطة على دكتورك.`, "This app is here to help, not to replace your doctor. If you have an autoimmune condition or take medication, show this plan to your doctor.")}</T>
        </>;
      })()}

      {err ? <T kind="small" color={c.bad}>{err}</T> : null}
      <View style={[styles.row, { gap: 10 }]}>
        {step > first
          ? <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => { setErr(''); setStep(skipTo(step - 1, -1)); }} />
          : profile ? <Btn kind="outline" title={L('إلغاء', 'Cancel')} onPress={() => router.back()} /> : null}
        <Btn title={st === 'done' ? L('يلا نبدأ', "Let's go") : L('التالي', 'Next')} onPress={next} style={{ flex: 1 }} />
      </View>
    </ScrollView></Bg>
  );
}
