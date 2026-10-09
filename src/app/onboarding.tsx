import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logWeight } from '../lib/weight.ts';
import { PhotoPicker } from '../components/Photo.tsx';
import { KnownCard, TypedList, UnknownCard } from '../components/Extra.tsx';
import { MedList, migrateMeds } from '../components/MedList.tsx';
import { itemKey, matchItems, splitItems } from '../lib/kb.ts';
import { Mascot } from '../components/Mascot.tsx';
import { Bg, Btn, Card, Chip, Choice, Kicker, NoteView, RADIUS, Ring, START, Segmented, T, WeekStrip, styles } from '../components/ui.tsx';
import { CONDITIONS, PAINS, SCHEDULES, SCHEDULE_ORDER, WEEK, type ScheduleId } from '../lib/data.ts';
import { fmt } from '../lib/day.ts';
import { L, getLang, setLang, toNum, tx } from '../lib/i18n.ts';
import { allGymChoices, genderFor, medical, recommendPlan, splitLabel, targets, weekPlaces, weekSessions, type CondInfo, type DayPlace, type Profile, type Quiz } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const STEPS = ['lang', 'basics', 'life', 'has', 'plan', 'week', 'cond', 'condx', 'meds', 'pain', 'done'] as const;
type Step = (typeof STEPS)[number];
/** Changing only the training plan (from Me): the three plan questions, then save. */
const PLAN_STEPS: Step[] = ['has', 'plan', 'week'];
type Draft = Partial<Profile> & Pick<Profile, 'sex' | 'conditions' | 'meds' | 'pains' | 'level'>;

export default function Onboarding() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  const { part } = useLocalSearchParams<{ part?: string }>();
  const flow: readonly Step[] = profile && part === 'plan' ? PLAN_STEPS : STEPS;
  // The language pick only shows the first time; editing starts at the details.
  const first = profile && flow === STEPS ? 1 : 0;
  const [more, setMore] = useState(false);
  const [step, setStep] = useState(first);
  const [d, setD] = useState<Draft>(() => profile ? migrateMeds({ ...profile }) : { sex: 'f', conditions: [], meds: [], pains: [], level: 'beg' });
  const [nums, setNums] = useState({ age: profile ? String(profile.age) : '', height: profile ? String(profile.height) : '', weight: profile ? String(profile.weight) : '' });
  const [err, setErr] = useState('');
  const [otherPain, setOtherPain] = useState(!!profile?.otherPain);
  const scroll = useRef<ScrollView>(null);
  const g = genderFor(d.sex);
  const st = flow[step];
  const set = (patch: Partial<Draft>) => { setErr(''); setD((x) => ({ ...x, ...patch })); };
  const toggle = (key: 'conditions' | 'meds' | 'pains', id: string) =>
    setD((x) => { const a = x[key] as string[]; return { ...x, [key]: a.includes(id) ? a.filter((v) => v !== id) : [...a, id] }; });
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlign: START() } as const;

  const validate = (): string | null => {
    if (st === 'basics') {
      const age = Math.round(toNum(nums.age)), height = toNum(nums.height), weight = toNum(nums.weight);
      if (!(age >= 14 && age <= 90)) return L(`${g('اكتب', 'اكتبي')} السن (من ١٤ لـ ٩٠).`, 'Enter your age (14 to 90).');
      if (!(height >= 120 && height <= 220)) return L(`${g('اكتب', 'اكتبي')} الطول بالسنتي (مثلا 165).`, 'Enter your height in cm (e.g. 165).');
      if (!(weight >= 30 && weight <= 250)) return L(`${g('اكتب', 'اكتبي')} الوزن بالكيلو (مثلا 68).`, 'Enter your weight in kg (e.g. 68).');
      setD((x) => ({ ...x, age, height, weight }));
    }
    if (st === 'life' && (!d.activity || !d.goal)) return L(`${g('اختار', 'اختاري')} حركتك في اليوم وهدفك.`, 'Pick your daily activity and your goal.');
    if (st === 'has' && !d.trains) return L(`${g('اختار', 'اختاري')} إجابة.`, 'Pick an answer.');
    if (st === 'plan' && d.trains === 'no' && !(d.quiz?.days && d.quiz.where && d.quiz.focus)) return L(`${g('جاوب', 'جاوبي')} على الـ٣ أسئلة.`, 'Answer the three questions.');
    if (st === 'plan' && !d.schedule) return L(`${g('اختار', 'اختاري')} نظام التمرين.`, 'Pick a workout plan.');
    if (st === 'cond') {
      // Typed conditions that are on the list (روماتيزم → rheumatoid arthritis) become picked ones.
      const keep: string[] = [];
      const picked = [...d.conditions];
      for (const t of splitItems(d.otherCond)) {
        const same = matchItems(t).map((k) => k.same).filter((x): x is string => !!x && CONDITIONS.some((c) => c.id === x));
        if (same.length && matchItems(t).every((k) => k.same)) same.forEach((id) => { if (!picked.includes(id)) picked.push(id); });
        else keep.push(t);
      }
      setD((x) => ({ ...x, conditions: picked, otherCond: keep.join('، ') }));
    }
    return null;
  };
  const next = () => {
    const e = validate();
    if (e) { setErr(e); return; }
    if (flow !== STEPS && step === flow.length - 1) {
      saveProfile({ ...profile!, ...d } as Profile);
      play('win');
      router.back();
      return;
    }
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
  const skipTo = (i: number, dir: 1 | -1) => (flow[i] === 'condx' && !d.conditions.length && !splitItems(d.otherCond).length ? i + dir : i);
  // The draft as a profile, for the week preview.
  const draft = { name: '', ...d, schedule: d.schedule ?? 'fb3' } as Profile;
  const pickSchedule = (k: ScheduleId) => set({ schedule: k, places: undefined, splits: undefined });
  const answer = (patch: Partial<Quiz>) => {
    const quiz = { ...d.quiz, ...patch } as Quiz;
    const level = d.level;
    // Once the three answers are in, the plan that fits is picked (and can still be changed below).
    if (quiz.days && quiz.where && quiz.focus) {
      const r = recommendPlan(quiz, level);
      set({ quiz, schedule: r.schedule, places: r.places, splits: undefined });
    } else set({ quiz });
  };
  const rec = d.trains === 'no' && d.quiz?.days && d.quiz.where && d.quiz.focus ? recommendPlan(d.quiz, d.level) : null;
  const setDay = (i: number, pl: DayPlace) => { const places = weekPlaces(draft); places[i] = pl; set({ places: { ...places } }); };
  const setSplit = (i: number, k: string) => { play('tap'); set({ splits: { ...d.splits, [i]: k } }); };
  const setInfo = (id: string, patch: Partial<CondInfo>) => setD((x) => ({ ...x, condInfo: { ...x.condInfo, [id]: { ...x.condInfo?.[id], ...patch } } }));
  const full = st === 'done' ? ({ name: '', ...d } as Profile) : null;

  return (
    <Bg><ScrollView ref={scroll} style={{ flex: 1 }} keyboardShouldPersistTaps="handled"
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24, gap: 16 }}>
      <View style={[styles.row, { gap: 4 }]}>
        {flow.map((s, i) => <View key={s} style={{ flex: 1, height: 4, backgroundColor: i <= step ? c.petrol : c.line }} />)}
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
        <T kind="h1">{profile ? L('تعديل بياناتك', 'Edit your details') : L(`أهلا ${g('بيك', 'بيكي')} في يلا ويل`, 'Welcome to Yalla Well')}</T>
        <T kind="body" color={c.muted}>{L(`محتاجين شوية بيانات عشان نحسب السعرات ونعمل خطة تمرين مناسبة ${g('ليك', 'ليكي')}.`, 'We need a few details to work out your calories and build a workout plan that fits you.')}</T>
        <PhotoPicker photo={d.photo} name={d.name} sex={d.sex} onChange={(photo) => set({ photo })} />
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

      {st === 'has' && <>
        <View style={[styles.row, { gap: 12 }]}>
          <Mascot pose="lift" size={64} />
          <View style={{ flex: 1 }}>
            <Kicker>{L('الكابتن بيسأل', 'The Captain asks')}</Kicker>
            <T kind="h1" style={{ fontSize: 24, lineHeight: 38 }}>{L(`${g('بتتمرن', 'بتتمرني')} دلوقتي على نظام معين؟`, 'Do you already follow a training plan?')}</T>
          </View>
        </View>
        <T kind="body" color={c.muted}>{L('في الجيم أو في البيت. مفيش إجابة غلط، الخطة هتتعمل على مقاسك.', 'At the gym or at home. There is no wrong answer; the plan is built around you.')}</T>
        <Choice title={L(`أيوه، عندي نظام ${g('ماشي', 'ماشية')} عليه`, 'Yes, I have a plan I follow')} sub={L(`${g('هتختار', 'هتختاري')} نظامك وأيامك، والتمارين هتمشي عليه، ${g('وتقدر', 'وتقدري')} ${g('تضيف', 'تضيفي')} أجهزتك وتمارينك.`, 'Pick your split and days; the workouts follow it, and you can add your own machines and exercises.')}
          on={d.trains === 'yes'} onPress={() => set({ trains: 'yes', level: d.trains === 'yes' ? d.level : 'mid' })} />
        <Choice title={L(`لأ، ${g('ساعدني', 'ساعديني')} أختار`, 'No, help me choose')} sub={L('هسألك ٣ أسئلة صغيرة ونختارلك أنسب نظام.', "I'll ask three quick questions and pick the plan that fits.")}
          on={d.trains === 'no'} onPress={() => set({ trains: 'no' })} />
      </>}

      {st === 'plan' && d.trains === 'no' && <>
        <T kind="h1">{L('٣ أسئلة وخلصنا', 'Three questions')}</T>
        <T kind="label">{L(`١. ${g('تقدر', 'تقدري')} ${g('تتمرن', 'تتمرني')} كام يوم في الأسبوع؟`, '1. How many days a week can you train?')}</T>
        <Segmented<'3' | '4' | '5' | '6'> items={[['3', L('٣ أيام', '3 days')], ['4', L('٤', '4')], ['5', L('٥', '5')], ['6', L('٦', '6')]]} value={d.quiz?.days ? String(d.quiz.days) as '3' : undefined} onChange={(v) => answer({ days: Number(v) as Quiz['days'] })} />
        <T kind="label">{L(`٢. ${g('هتتمرن', 'هتتمرني')} فين؟`, '2. Where will you train?')}</T>
        <Segmented<Quiz['where']> items={[['gym', L('جيم', 'Gym')], ['home', L('بيت', 'Home')], ['both', L('الاتنين', 'Both')]]} value={d.quiz?.where} onChange={(where) => answer({ where })} />
        <T kind="label">{L(`٣. ${g('عايز', 'عايزة')} ${g('تركز', 'تركزي')} على إيه؟`, '3. What do you want to focus on?')}</T>
        <View style={styles.wrap}>
          {([['full', L('الجسم كله', 'Whole body')], ['glutes', L('أرداف ورجل', 'Glutes and legs')], ['upper', L('عضل الجزء العلوي', 'Upper-body muscle')], ['any', L('مش فارقة', "Doesn't matter")]] as [Quiz['focus'], string][]).map(([k, l]) => (
            <Chip key={k} label={l} on={d.quiz?.focus === k} onPress={() => answer({ focus: k })} />
          ))}
        </View>
        <T kind="label">{L(g('مستواك', 'مستواكي'), 'Your level')}</T>
        <Segmented<'beg' | 'mid'> items={[['beg', L(g('مبتدئ', 'مبتدئة'), 'Beginner')], ['mid', L('بتمرن بانتظام', 'I train regularly')]]} value={d.level}
          onChange={(level) => { set({ level }); if (d.quiz?.days && d.quiz.where && d.quiz.focus) { const r = recommendPlan(d.quiz, level); set({ level, schedule: r.schedule, places: r.places, splits: undefined }); } }} />
        {rec && d.schedule ? (
          <Card tone="accent" style={{ marginTop: 6 }}>
            <T kind="label" color={c.onPetrol} style={{ fontFamily: fonts.displaySemi }}>{d.schedule === rec.schedule ? L(`النظام المناسب ${g('ليك', 'ليكي')}`, 'The plan that fits you') : L(`النظام اللي ${g('اخترته', 'اخترتيه')}`, 'Your pick')}</T>
            <T kind="h2" color={c.onPetrol}>{tx(SCHEDULES[d.schedule].n)}</T>
            <T kind="small" color={c.onPetrol}>{tx(SCHEDULES[d.schedule].d)}</T>
            {d.schedule === rec.schedule ? <T kind="small" color={c.onPetrol} style={{ fontFamily: fonts.bodyMedium }}>{rec.why}</T> : null}
          </Card>
        ) : null}
        {rec ? <Btn kind="text" title={more ? L('اقفل', 'Close') : L(`${g('عايز', 'عايزة')} نظام تاني؟`, 'Want a different plan?')} onPress={() => setMore(!more)} /> : null}
        {rec && more ? SCHEDULE_ORDER.map((k) => <Choice key={k} title={tx(SCHEDULES[k].n)} sub={tx(SCHEDULES[k].d)} on={d.schedule === k} onPress={() => pickSchedule(k)} />) : null}
      </>}

      {st === 'plan' && d.trains !== 'no' && <>
        <T kind="h1">{L('نظامك إيه؟', 'What is your plan?')}</T>
        <T kind="body" color={c.muted}>{L(`${g('اختار', 'اختاري')} الأقرب لنظامك، وفي الخطوة الجاية ${g('ترتب', 'ترتبي')} أيامك بالظبط. لو نظامك مختلف ${g('اختار', 'اختاري')} «هختار بنفسي».`, 'Pick the closest to yours; next you set your exact days. If yours is different, pick “I’ll choose myself”.')}</T>
        {SCHEDULE_ORDER.map((k) => (
          <Choice key={k} title={tx(SCHEDULES[k].n)} sub={tx(SCHEDULES[k].d)} on={d.schedule === k} onPress={() => pickSchedule(k)} />
        ))}
        <T kind="label">{L(g('مستواك', 'مستواكي'), 'Your level')}</T>
        <Segmented<'beg' | 'mid'> items={[['beg', L(g('مبتدئ', 'مبتدئة'), 'Beginner')], ['mid', L('بتمرن بانتظام', 'I train regularly')]]} value={d.level} onChange={(level) => set({ level })} />
      </>}

      {st === 'week' && <>
        <T kind="h1">{L('ده أسبوعك', 'Your week')}</T>
        <T kind="body" color={c.muted}>{L(`${g('غير', 'غيري')} أي يوم زي ما ${g('انت بتتمرن', 'انتي بتتمرني')}: جيم ولا بيت ولا راحة، ونوع التمرين. ${g('تقدر', 'تقدري')} ${g('تغيره', 'تغيريه')} بعدين من صفحة التمرين.`, 'Set each day the way you train: gym, home or rest, and the workout. You can change it later on the Train page.')}</T>
        <WeekStrip profile={draft} today={-1} />
        <View style={{ borderTopWidth: 1, borderColor: c.line }}>
          {WEEK.map((w, i) => {
            const pl = weekPlaces(draft)[i];
            const sid = weekSessions(draft)[i];
            return (
              <View key={w} style={{ paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderColor: c.line }}>
                <View style={[styles.row, { gap: 10 }]}>
                  <T kind="h2" style={{ width: 74, fontSize: 18 }}>{tx(w)}</T>
                  <View style={{ flex: 1 }}>
                    <Segmented<DayPlace> items={[['gym', L('جيم', 'Gym')], ['home', L('بيت', 'Home')], ['rest', L('راحة', 'Rest')]]} value={pl} onChange={(v) => setDay(i, v)} />
                  </View>
                </View>
                {pl === 'gym' ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                    {allGymChoices(draft.schedule).map((k) => {
                      const on = sid === k;
                      return (
                        <Pressable key={k} onPress={() => setSplit(i, k)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                          style={{ borderWidth: 1, borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : 'transparent', borderRadius: RADIUS, paddingVertical: 6, paddingHorizontal: 11 }}>
                          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12.5, lineHeight: 18, color: on ? c.onPetrol : c.ink }}>{splitLabel(k)}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
            );
          })}
        </View>
      </>}

      {st === 'cond' && <>
        <T kind="h1">{L('عندك أي مرض مناعي أو مزمن؟', 'Any autoimmune or chronic condition?')}</T>
        <T kind="body" color={c.muted}>{L(`${g('اختار', 'اختاري')} كل اللي ينطبق. لو مفيش، ${g('دوس', 'دوسي')} التالي على طول.`, 'Pick all that apply. If none, just tap Next.')}</T>
        <View style={styles.wrap}>{CONDITIONS.map((x) => <Chip key={x.id} label={tx(x.n)} on={d.conditions.includes(x.id)} onPress={() => toggle('conditions', x.id)} />)}</View>
        <View style={{ gap: 4 }}>
          <T kind="label">{L('حاجة تانية مش في القائمة', 'Something else not on the list')}</T>
          <TextInput value={d.otherCond ?? ''} onChangeText={(otherCond) => set({ otherCond })} placeholder={L('مثلا: ضغط عالي، قولون عصبي، أنيميا', 'e.g. high blood pressure, IBS, anaemia')} placeholderTextColor={c.muted} style={input} />
          <T kind="small" color={c.muted}>{L(`لو أكتر من حاجة ${g('افصل', 'افصلي')} بينهم بفاصلة.`, 'Separate several with commas.')}</T>
        </View>
        <TypedList text={d.otherCond} g={g} />
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
                  {([['never', L('لأ', 'No')], ['sometimes', L('أحيانا', 'Sometimes')], ['often', L('كتير', 'Often')]] as const).map(([k, l]) => (
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
              {gut ? <View style={{ gap: 4 }}><T kind="label">{L('أكلات بتتعبك', 'Foods that upset you').replace('بتتعبك', g('بتتعبك', 'بتتعبكي'))}</T><TextInput value={ci.trigger ?? ''} onChangeText={(v) => setInfo(id, { trigger: v })} placeholder={L('مثلا: اللبن، المقلي', 'e.g. milk, fried food')} placeholderTextColor={c.muted} style={input} /></View> : null}
            </Card>
          );
        })}
        {splitItems(d.otherCond).map((t, i) => {
          const hit = matchItems(t);
          if (hit.length) return hit.map((k) => <KnownCard key={`${i}-${k.id}`} item={k} text={t} g={g} />);
          const key = itemKey(t);
          return <UnknownCard key={`${i}-u`} text={t} ans={d.extra?.[key]} g={g} onChange={(a) => setD((x) => ({ ...x, extra: { ...x.extra, [key]: a } }))} />;
        })}
        <View style={{ gap: 4 }}>
          <T kind="label">{L(`الدكتور قال${g('لك', 'لك')} تبعد${g('', 'ي')} عن حاجة؟`, 'Did your doctor tell you to avoid anything?')}</T>
          <TextInput value={d.doctorSaid ?? ''} onChangeText={(v) => set({ doctorSaid: v })} multiline placeholder={L('مثلا: بلاش رفع أوزان تقيلة، بلاش صيام', 'e.g. no heavy lifting, no fasting')} placeholderTextColor={c.muted} style={[input, { minHeight: 70, textAlignVertical: 'top' }]} />
        </View>
      </>}

      {st === 'meds' && <>
        <T kind="h1">{L(`${g('بتاخد', 'بتاخدي')} أدوية بشكل مستمر؟`, 'Do you take any regular medication?')}</T>
        <T kind="body" color={c.muted}>{L(`والفيتامينات والمكملات كمان. ${g('حدد', 'حددي')} لكل واحد الجرعة والعدد وكل قد إيه والميعاد، وهنفكر${g('ك', 'كي')} بيه وهنراعيه في الأكل والتمرين.`, "Vitamins and supplements too. Set each one's dose, how many, how often and when; we'll remind you and take it into account in food and training.")}</T>
        <MedList value={d} onChange={(patch) => setD((x) => ({ ...x, ...patch }))} />
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
          {notes.length ? <Card><T kind="h2">{L('عدلنا الخطة على حسب حالتك', 'We adjusted the plan to your health')}</T>{notes.map((n, i) => <NoteView key={i} note={n} />)}</Card> : null}
          <T kind="small" style={{ textAlign: 'center' }}>{L(`التطبيق ده للمساعدة ومش بديل عن دكتورك. لو عندك مرض مناعي أو ${g('بتاخد', 'بتاخدي')} أدوية، ${g('اعرض', 'اعرضي')} الخطة على دكتورك.`, "This app is here to help, not to replace your doctor. If you have an autoimmune condition or take medication, show this plan to your doctor.")}</T>
        </>;
      })()}

      {err ? <T kind="small" color={c.bad}>{err}</T> : null}
      <View style={[styles.row, { gap: 10 }]}>
        {step > first
          ? <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => { setErr(''); setStep(skipTo(step - 1, -1)); }} />
          : profile ? <Btn kind="outline" title={L('إلغاء', 'Cancel')} onPress={() => router.back()} /> : null}
        <Btn title={st === 'done' ? L('يلا نبدأ', "Let's go") : flow !== STEPS && step === flow.length - 1 ? L('حفظ', 'Save') : L('التالي', 'Next')} onPress={next} sound={st === 'done' ? 'whistle' : 'swoosh'} style={{ flex: 1 }} />
      </View>
    </ScrollView></Bg>
  );
}
