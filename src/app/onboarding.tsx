import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { logWeight } from '../lib/weight.ts';
import { PhotoPicker } from '../components/Photo.tsx';
import { KnownCard, TypedList, UnknownCard } from '../components/Extra.tsx';
import { MedList, migrateMeds } from '../components/MedList.tsx';
import { itemKey, matchItems, splitItems } from '../lib/kb.ts';
import { Lockup } from '../components/Logo.tsx';
import { Mascot } from '../components/Mascot.tsx';
import { Bg, Btn, Card, Chip, Choice, Kicker, NoteView, RADIUS, Ring, START, Segmented, T, WeekStrip, styles } from '../components/ui.tsx';
import { CONDITIONS, PAINS, SCHEDULES, SCHEDULE_ORDER, WEEK, type Hurt, type ScheduleId } from '../lib/data.ts';
import { DateField } from '../components/pickers.tsx';
import { setLastStart, startFromMonth } from '../lib/women.ts';
import { dayKey as fmtKey, fmt } from '../lib/day.ts';
import { L, getLang, num, setLang, toNum, tx } from '../lib/i18n.ts';
import { allGymChoices, genderFor, medical, ownDiet, recommendPlan, splitLabel, targets, weekPlaces, weekSessions, type CondInfo, type DayPlace, type Profile, type Quiz } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { DietNote, EquipPicker, OwnDietFields } from '../components/PlanSettings.tsx';
import { ALLERGENS } from '../lib/allergy.ts';
import { useStore } from '../store/AppStore.tsx';
import { SignIn, SignedInStep } from '../components/Account.tsx';
import { useAccount } from '../lib/account.ts';
import { fonts, useColors } from '../theme.ts';

const STEPS = ['account', 'lang', 'basics', 'women', 'life', 'has', 'plan', 'week', 'cond', 'condx', 'meds', 'food', 'pain', 'done'] as const;
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
  const first = profile && flow === STEPS ? STEPS.indexOf('basics') : 0;
  const acct = useAccount();
  // Whether this screen saw the phone signed out: then the sign-in form stays up through the code step even after the
  // sign-in lands; a phone that opens already signed in gets the short "signed in as" step instead.
  const [wasOut, setWasOut] = useState(false);
  useEffect(() => { if (acct.ready && acct.on && !acct.email) setWasOut(true); }, [acct.ready, acct.on, acct.email]);
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
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlign: START() } as const;

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
    if (st === 'food' && d.macro?.mode === 'own' && !ownDiet(d as Profile)) return L(`${g('اكتب', 'اكتبي')} السعرات اللي في نظامك، أو ${g('اختار', 'اختاري')} «${g('احسبهالي', 'احسبيهالي')}».`, 'Enter the calories in your plan, or pick “Work it out for me”.');
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
  // The women's questions only show for women.
  // Sign-in comes first on first launch (when accounts are set up), with the language pick on the same screen, so
  // the separate language step only shows when accounts are off.
  const hidden = (s: Step) => (s === 'account' && (!acct.on || !!profile)) || (s === 'lang' && acct.on)
    || (s === 'condx' && !d.conditions.length && !splitItems(d.otherCond).length) || (s === 'women' && d.sex !== 'f');
  const skipTo = (i: number, dir: 1 | -1): number => {
    let j = i;
    while (j >= 0 && j < flow.length && hidden(flow[j])) j += dir;
    return j < 0 ? skipTo(0, 1) : Math.min(j, flow.length - 1);
  };
  const start = Math.max(first, skipTo(0, 1));
  // Signing in (or the saved sign-in being read) moves past the sign-in screen.
  useEffect(() => { if (acct.ready && hidden(flow[step])) setStep(skipTo(step, 1)); });
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
        {flow.map((s, i) => <View key={s} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? c.petrol : c.line }} />)}
      </View>

      {st === 'lang' && <>
        <View style={{ alignItems: 'center', gap: 6, paddingTop: 32, paddingBottom: 16 }}>
          <Lockup size={84} slogan />
          <T kind="body" color={c.muted} style={{ textAlign: 'center', marginTop: 20 }}>اختيار اللغة · Choose your language</T>
        </View>
        <Choice title="العربية" sub="التطبيق كله بالعربي" on={getLang() === 'ar'} onPress={() => setLang('ar')} />
        <Choice title="English" sub="The whole app in English" on={getLang() === 'en'} onPress={() => setLang('en')} />
        <T kind="small" color={c.muted} style={{ textAlign: 'center' }}>{L('ممكن تغييرها في أي وقت من الصفحة الرئيسية أو ملفي.', 'You can change it any time from Home or Me.')}</T>
      </>}

      {st === 'account' && <>
        <Segmented items={[['ar', 'العربية'], ['en', 'English']]} value={getLang()} onChange={(l) => setLang(l)} />
        <View style={{ alignItems: 'center', gap: 6, paddingTop: 16, paddingBottom: 8 }}>
          <Lockup size={64} />
          <T kind="h1" style={{ textAlign: 'center', marginTop: 8 }}>{L('أهلا في يلا ويل', 'Welcome to Yalla Well')}</T>
          <T kind="body" color={c.muted} style={{ textAlign: 'center' }}>{L('الدخول بالإيميل وكود بيوصل عليه. بياناتك بتتحفظ في حسابك، ولو الموبايل اتغير ترجع زي ما هي.', 'Sign in with your email and a code we send to it. Your data is saved to your account and comes back if you change phones.')}</T>
        </View>
        {!acct.ready ? null : acct.email && !wasOut
          ? <SignedInStep email={acct.email} onDone={() => setStep(skipTo(step + 1, 1))} onSwitch={() => setWasOut(true)} />
          : <SignIn hasLocal={false} onDone={() => { setStep(skipTo(step + 1, 1)); }} />}
      </>}

      {st === 'basics' && <>
        <T kind="h1">{profile ? L('تعديل بياناتك', 'Edit your details') : L(`أهلا ${g('بيك', 'بيكي')} في يلا ويل`, 'Welcome to Yalla Well')}</T>
        <T kind="body" color={c.muted}>{L(`محتاجين شوية بيانات عشان نحسب السعرات ونعمل خطة تمرين مناسبة ${g('ليك', 'ليكي')}.`, 'We need a few details to work out your calories and build a workout plan that fits you.')}</T>
        <PhotoPicker photo={d.photo} name={d.name} sex={d.sex} onChange={(photo) => set({ photo })} />
        <T kind="small" color={c.muted} style={{ textAlign: 'center' }}>{L(`الصورة اختيارية، ${g('تقدر تضيفها', 'تقدري تضيفيها')} بعدين من ملفي.`, 'Photo is optional; you can add it later from Me.')}</T>
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

      {st === 'women' && <>
        <T kind="h1">{L('أسئلة خاصة بيكي', 'A few questions for women')}</T>
        <T kind="body" color={c.muted}>{L('الإجابات دي بتغير الأكل والتمرين، وكلها بتفضل على موبايلك. تقدري تغيريها في أي وقت من ملفي.', 'These answers change your food and training, and stay on your phone. You can change them any time from Me.')}</T>
        <T kind="label">{L('الحالة الاجتماعية', 'Marital status')}</T>
        <View style={[styles.row, { gap: 8 }]}>
          <Choice title={L('آنسة', 'Single')} on={d.women?.married === false} onPress={() => set({ women: { married: false, preg: 'no' } })} style={{ flex: 1 }} />
          <Choice title={L('متجوزة', 'Married')} on={d.women?.married === true} onPress={() => set({ women: { ...d.women, married: true } })} style={{ flex: 1 }} />
        </View>
        {d.women?.married ? <>
          <T kind="label">{L('حامل؟', 'Are you pregnant?')}</T>
          <View style={styles.wrap}>
            {([['no', L('لا', 'No')], ['yes', L('أيوه، حامل', 'Yes, pregnant')], ['trying', L('بنحاول نحمل', 'Trying to conceive')], ['nursing', L('برضع', 'Breastfeeding')]] as const).map(([k, l]) => (
              <Chip key={k} label={l} on={d.women?.preg === k} onPress={() => set({ women: { ...d.women, preg: k, pregStart: k === 'yes' ? d.women?.pregStart : undefined } })} />
            ))}
          </View>
        </> : null}
        {d.women?.preg === 'yes' ? <>
          <T kind="label">{L('في الشهر الكام؟', 'Which month of pregnancy?')}</T>
          <View style={styles.wrap}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => {
              const on = !!d.women?.pregStart && Math.min(9, Math.max(1, Math.round((Date.now() - Date.parse(d.women.pregStart) - 14 * 86400000) / (30.4 * 86400000) + 0.5))) === m;
              return <Chip key={m} label={num(m)} on={on} onPress={() => set({ women: { ...d.women, pregStart: startFromMonth(m) } })} />;
            })}
          </View>
          <T kind="small" color={c.muted}>{L('في الحمل مفيش رجيم لنزول الوزن. هنحسب السعرات المناسبة لكل شهر، والتمرين هيبقى آمن للحمل. لازم دكتورة النسا توافق على التمرين.', "There's no weight-loss diet in pregnancy. We'll set the right calories for each stage and keep training pregnancy-safe. Your doctor should approve exercise first.")}</T>
        </> : d.women?.married !== undefined ? <>
          <T kind="label">{L('أول يوم في آخر دورة (اختياري)', 'First day of your last period (optional)')}</T>
          <DateField value={d.cycle?.periods.at(-1)?.start ?? fmtKey(new Date())} onChange={(k) => set({ cycle: setLastStart(d.cycle, k) })} label={L('أول يوم', 'First day')} />
          <T kind="small" color={c.muted}>{L('بيه نقدر نتوقع الدورة الجاية وأيام التبويض ونخفف التمرين أول يومين.', 'It lets us estimate your next period and fertile days, and keep the first two days lighter.')}</T>
        </> : null}
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
        <Segmented<'beg' | 'mid'> items={[['beg', L(g('مبتدئ', 'مبتدئة'), 'Beginner')], ['mid', L(g('بتمرن بانتظام', 'بتتمرني بانتظام'), 'I train regularly')]]} value={d.level}
          onChange={(level) => { set({ level }); if (d.quiz?.days && d.quiz.where && d.quiz.focus) { const r = recommendPlan(d.quiz, level); set({ level, schedule: r.schedule, places: r.places, splits: undefined }); } }} />
        {rec && d.schedule ? (
          <Card tone="accent" style={{ marginTop: 6 }}>
            <T kind="label" color={c.onPetrol} style={{ fontFamily: fonts.displaySemi }}>{d.schedule === rec.schedule ? L(`النظام المناسب ${g('ليك', 'ليكي')}`, 'The plan that fits you') : L(`النظام اللي ${g('اخترته', 'اخترتيه')}`, 'Your pick')}</T>
            <T kind="h2" color={c.onPetrol}>{tx(SCHEDULES[d.schedule].n)}</T>
            <T kind="small" color={c.onPetrol}>{tx(SCHEDULES[d.schedule].d)}</T>
            {d.schedule === rec.schedule ? <T kind="small" color={c.onPetrol} style={{ fontFamily: fonts.bodyMedium }}>{rec.why}</T> : null}
          </Card>
        ) : null}
        {rec ? <Btn kind="text" title={more ? L(g('اقفل', 'اقفلي'), 'Close') : L(`${g('عايز', 'عايزة')} نظام تاني؟`, 'Want a different plan?')} onPress={() => setMore(!more)} /> : null}
        {rec && more ? SCHEDULE_ORDER.map((k) => <Choice key={k} title={tx(SCHEDULES[k].n)} sub={tx(SCHEDULES[k].d)} on={d.schedule === k} onPress={() => pickSchedule(k)} />) : null}
      </>}

      {st === 'plan' && d.trains !== 'no' && <>
        <T kind="h1">{L('نظامك إيه؟', 'What is your plan?')}</T>
        <T kind="body" color={c.muted}>{L(`${g('اختار', 'اختاري')} الأقرب لنظامك، وفي الخطوة الجاية ${g('ترتب', 'ترتبي')} أيامك بالظبط. لو نظامك مختلف ${g('اختار', 'اختاري')} «هختار بنفسي».`, 'Pick the closest to yours; next you set your exact days. If yours is different, pick “I’ll choose myself”.')}</T>
        {SCHEDULE_ORDER.map((k) => (
          <Choice key={k} title={tx(SCHEDULES[k].n)} sub={tx(SCHEDULES[k].d)} on={d.schedule === k} onPress={() => pickSchedule(k)} />
        ))}
        <T kind="label">{L(g('مستواك', 'مستواكي'), 'Your level')}</T>
        <Segmented<'beg' | 'mid'> items={[['beg', L(g('مبتدئ', 'مبتدئة'), 'Beginner')], ['mid', L(g('بتمرن بانتظام', 'بتتمرني بانتظام'), 'I train regularly')]]} value={d.level} onChange={(level) => set({ level })} />
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
                          style={{ borderWidth: 1, borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : 'transparent', borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11 }}>
                          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12.5, lineHeight: 18, color: on ? c.onInk : c.ink }}>{splitLabel(k)}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                ) : null}
              </View>
            );
          })}
        </View>
        {weekPlaces(draft).includes('gym') ? <EquipPicker p={d} onChange={(equip) => set({ equip })} /> : null}
      </>}

      {st === 'cond' && <>
        <T kind="h1">{L('عندك أي مرض مزمن؟', 'Any long-term health condition?')}</T>
        <T kind="body" color={c.muted}>{L(`${g('اختار', 'اختاري')} كل اللي ينطبق. لو مفيش، ${g('دوس', 'دوسي')} التالي على طول.`, 'Pick all that apply. If none, just tap Next.')}</T>
        <View style={{ borderWidth: 1, borderColor: c.line, borderRadius: RADIUS, overflow: 'hidden' }}>
          {CONDITIONS.map((x, i) => {
            const on = d.conditions.includes(x.id);
            return (
              <Pressable key={x.id} onPress={() => { play('tap'); toggle('conditions', x.id); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                style={[styles.row, { gap: 12, paddingHorizontal: 12, paddingVertical: 11, borderTopWidth: i ? 1 : 0, borderColor: c.line, backgroundColor: on ? c.okBg : c.surface }]}>
                <View style={{ width: 22, height: 22, borderRadius: 12, borderWidth: 2, borderColor: on ? c.petrol : c.dim, backgroundColor: on ? c.petrol : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                  {on ? <Text style={{ color: c.onPetrol, fontFamily: fonts.displaySemi, fontSize: 14, lineHeight: 18 }}>✓</Text> : null}
                </View>
                <T kind="body" style={{ flex: 1 }}>{tx(x.n)}</T>
              </Pressable>
            );
          })}
        </View>
        <View style={{ gap: 4 }}>
          <T kind="label">{L('حاجة تانية مش في القائمة', 'Something else not on the list')}</T>
          <TextInput value={d.otherCond ?? ''} onChangeText={(otherCond) => set({ otherCond })} placeholder={L('مثلا: صداع نصفي، نقرس، ديسك', 'e.g. migraine, gout, slipped disc')} placeholderTextColor={c.muted} style={input} />
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

      {st === 'food' && <>
        <T kind="h1">{L(`عندك حساسية من أكل؟`, 'Any food allergies?')}</T>
        <T kind="body" color={c.muted}>{L('هنشيل الوصفات اللي فيها الأكل ده من الاقتراحات، ولو اتسجل هيظهر عليه تنبيه أحمر.', "We'll keep recipes with it out of your suggestions, and show a red alert if you log it.")}</T>
        <View style={styles.wrap}>
          <Chip label={L('مفيش', 'None')} on={!d.allergies?.length && !d.otherAllergy?.trim()} onPress={() => set({ allergies: [], otherAllergy: '' })} />
          {ALLERGENS.map((a) => {
            const on = !!d.allergies?.includes(a.id);
            return <Chip key={a.id} label={L(a.n[0], a.n[1])} on={on} onPress={() => { play('tap'); set({ allergies: on ? d.allergies!.filter((x) => x !== a.id) : [...(d.allergies ?? []), a.id] }); }} />;
          })}
        </View>
        <View style={{ gap: 4 }}>
          <T kind="label">{L('أكل تاني', 'Something else')}</T>
          <TextInput value={d.otherAllergy ?? ''} onChangeText={(v) => set({ otherAllergy: v })} placeholder={L('مثلا: الفراولة، الكيوي', 'e.g. strawberries, kiwi')} placeholderTextColor={c.muted} style={input} />
        </View>

        <T kind="h1" style={{ marginTop: 8 }}>{L(`${g('ماشي', 'ماشية')} على نظام أكل معين؟`, 'Do you follow a set diet plan?')}</T>
        <Choice title={L(`لأ، ${g('احسبهالي', 'احسبيهالي')} تلقائي`, 'No, work it out for me')} sub={L('هنحسب السعرات والبروتين والكارب والدهون على حسب جسمك وهدفك وحالتك.', 'We work out calories, protein, carbs and fat from your body, goal and health.')}
          on={d.macro?.mode !== 'own'} onPress={() => set({ macro: undefined })} />
        <Choice title={L('أيوه، نظام من دكتور أو أخصائي تغذية', 'Yes, a plan from a doctor or dietitian')} sub={L(`${g('هتكتب', 'هتكتبي')} أرقامه، والتطبيق هيمشي عليها.`, 'Enter its numbers and the app follows them.')}
          on={d.macro?.mode === 'own'} onPress={() => set({ macro: { mode: 'own', own: d.macro?.own } })} />
        {d.macro?.mode === 'own' ? <OwnDietFields value={d.macro.own} onChange={(own) => set({ macro: { mode: 'own', own } })} g={g} /> : null}
        <DietNote g={g} strong={(d.conditions.length > 0 || !!d.otherCond?.trim()) && d.macro?.mode !== 'own'} />
      </>}

      {st === 'pain' && <>
        <T kind="h1">{L('في مكان بيوجعك في التمرين؟', 'Does anything hurt when you work out?')}</T>
        <T kind="body" color={c.muted}>{L('لو ألم بسيط هنبدل التمارين اللي بتضغط عليه بتمارين ألطف، ولو إصابة تحت العلاج هنشيلها خالص.', "For mild pain we swap exercises that strain it for gentler ones; for an injury being treated we take them out.")}</T>
        <View style={styles.wrap}>
          <Chip label={L('مفيش، الحمد لله', 'Nothing, thankfully')} on={!d.pains.length && !otherPain} onPress={() => { setOtherPain(false); set({ pains: [], otherPain: '' }); }} />
          {PAINS.map((x) => <Chip key={x.id} label={tx(x.n)} on={d.pains.includes(x.id)} onPress={() => toggle('pains', x.id)} />)}
          <Chip label={L('أخرى', 'Other')} on={otherPain} onPress={() => { if (otherPain) set({ otherPain: '' }); setOtherPain(!otherPain); }} />
        </View>
        {d.pains.map((j) => (
          <View key={j} style={{ gap: 6 }}>
            <T kind="label">{tx(PAINS.find((x) => x.id === j)?.n ?? j)}</T>
            <Segmented<Hurt> items={[['pain', L('ألم بسيط', 'Mild pain')], ['injury', L('إصابة', 'Injury')]]} value={d.hurt?.[j] ?? 'pain'} onChange={(k) => set({ hurt: { ...d.hurt, [j]: k } })} />
            {d.hurt?.[j] === 'injury' ? (
              <TextInput value={d.injuryNote?.[j] ?? ''} onChangeText={(v) => set({ injuryNote: { ...d.injuryNote, [j]: v } })} placeholder={L('الإصابة إيه؟ مثلا: تمزق، كسر، شرخ، ديسك', 'What is it? e.g. a tear, fracture, crack, disc')} placeholderTextColor={c.muted} style={input} accessibilityLabel={L('نوع الإصابة', 'Type of injury')} />
            ) : null}
          </View>
        ))}
        {d.pains.some((j) => (d.hurt?.[j] ?? 'pain') === 'pain') ? <T kind="small" color={c.muted}>{L(`الألم البسيط: ${g('بتتمرن', 'بتتمرني')} عادي، بس من غير تمارين بتضغط على المكان ده.`, "Mild pain: you train as usual, just without exercises that load that spot.")}</T> : null}
        {d.pains.some((j) => d.hurt?.[j] === 'injury') ? <T kind="small" color={c.warn}>{L(`أي تمرين بيحرك المكان المصاب هيتشال لحد ما ${g('تتعالج', 'تتعالجي')}. لما ${g('تخف', 'تخفي')} ${g('غير', 'غيري')} ده من ملفي والخطة ترجع.`, "Anything that moves the injured area is left out until it's treated. Once you've recovered, change it in Me and the plan comes back.")}</T> : null}
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
      {st === 'account' ? null : <View style={[styles.row, { gap: 10 }]}>
        {step > start
          ? <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => { setErr(''); setStep(skipTo(step - 1, -1)); }} />
          : profile ? <Btn kind="outline" title={L('إلغاء', 'Cancel')} onPress={() => router.back()} /> : null}
        <Btn title={st === 'done' ? L('يلا نبدأ', "Let's go") : flow !== STEPS && step === flow.length - 1 ? L('حفظ', 'Save') : L('التالي', 'Next')} onPress={next} sound={st === 'done' ? 'whistle' : 'swoosh'} style={{ flex: 1 }} />
      </View>}
    </ScrollView></Bg>
  );
}
