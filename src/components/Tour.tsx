// The guided tour: the first time someone reaches home after signing up, the captain walks them through home,
// food, train and Me, lighting up each part and saying what it does. It can be replayed from Me.
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { L } from '../lib/i18n.ts';
import { genderFor } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';
import { Mascot, type Pose } from './Mascot.tsx';
import { markTourSeen, onTourStart, scrollers, targets, tourActions, tourSeen } from './TourTarget.tsx';
import { Btn, Kicker, RADIUS, Rise, T, styles } from './ui.tsx';

type Tab = 'index' | 'food' | 'train' | 'me';
type Step = { tab: Tab; target?: string; pose: Pose; head: string; body: string; before?: string };
const PATH: Record<Tab, '/' | '/food' | '/train' | '/me'> = { index: '/', food: '/food', train: '/train', me: '/me' };

function steps(name: string, g: (m: string, f: string) => string): Step[] {
  return [
    { tab: 'index', pose: 'cheer', head: L(`أهلًا${name ? ' يا ' + name : ''}!`, `Hi${name ? ' ' + name : ''}!`),
      body: L(`أنا الكابتن، صاحبك في الماتش. ${g('تعالى', 'تعالي')} ألفّ ${g('بيك', 'بيكي')} على التطبيق في دقيقة.`, "I'm the Captain, your teammate. Let me show you around in a minute.") },
    { tab: 'index', target: 'home.left', pose: 'point', head: L('فاضلك كام سعرة', 'Calories left'),
      body: L(`ده أهم رقم في يومك. بيقل لما ${g('تعلّم', 'تعلّمي')} في صفحة الأكل إنك ${g('خلصت', 'خلصتي')} وجبة.`, 'Your most important number today. It drops when you tick a meal as eaten on the Food page.') },
    { tab: 'index', target: 'home.bar', pose: 'point', head: L('يومك في شريط', 'Your day in one bar'),
      body: L(`كل حتة وجبة، وراسي الخضرا بتقولك ${g('وصلت', 'وصلتي')} فين. وتحتها البروتين والكارب والدهون.`, 'Each block is a meal and my green head shows how far you are. Below it: protein, carbs and fat.') },
    { tab: 'index', target: 'home.week', pose: 'point', head: L('أسبوعك', 'Your week'),
      body: L(`النهارده منوّر بالأخضر. الدايرة بتتملي لما ${g('تخلص', 'تخلصي')} تمرين اليوم ده، والمتقطع يعني راحة.`, "Today is lit in green. The dot fills in when you finish that day's workout; dashed days are rest.") },
    { tab: 'index', target: 'home.today', pose: 'lift', head: L('تمرين النهارده', "Today's workout"),
      body: L(`${g('دوس', 'دوسي')} «يلا نبدأ»، ${g('هتسمع', 'هتسمعي')} صفارة البداية ${g('وتروح', 'وتروحي')} على التمرين على طول.`, 'Tap “Let\'s go”, hear the whistle, and jump straight into your workout.') },
    { tab: 'index', target: 'home.water', pose: 'point', head: L('المياه', 'Water'),
      body: L(`كل كوباية بدوسة. ولو ${g('شربت', 'شربتي')} إزازة ${g('ضيفها', 'ضيفيها')} مرة واحدة من الزراير.`, 'One tap per cup. Had a bottle? Add it in one go with the buttons.') },
    { tab: 'food', target: 'food.score', pose: 'eat', head: L('صفحة الأكل', 'The Food page'),
      body: L(`فوق: ${g('أكلت', 'أكلتي')} كام من هدفك. وأنا بقولك فاضل كام للوجبة الجاية وأقترح أكلة.`, "At the top: how much you've eaten of your target. I tell you what's left for the next meal and suggest a dish.") },
    { tab: 'food', target: 'food.meal', pose: 'eat', head: L('وجباتك', 'Your meals'),
      body: L(`«+ ${g('ضيف', 'ضيفي')}» عشان ${g('تسجل', 'تسجلي')} أكل: بالاسم أو الباركود أو ${g('تكتب', 'تكتبي')} اللي ${g('أكلته', 'أكلتيه')}. ولما ${g('تخلص', 'تخلصي')} الوجبة ${g('دوس', 'دوسي')} الدايرة عشان تتحسب.`, '“+ Add” to log food: by name, by barcode, or type what you ate. When you finish the meal, tap the circle so it counts.') },
    { tab: 'food', target: 'food.finder', pose: 'eat', head: L(`مش ${g('عارف', 'عارفة')} ${g('تاكل', 'تاكلي')} إيه؟`, 'Not sure what to eat?'),
      body: L(`${g('اكتب', 'اكتبي')} اسم أي أكلة وهنجيبلك الوصفة بكمية على قد سعراتك الباقية.`, "Type any dish and we'll bring the recipe, sized to the calories you have left.") },
    { tab: 'train', target: 'train.days', pose: 'row', head: L(`${g('هتتمرن', 'هتتمرني')} فين؟`, 'Where are you training?'),
      body: L(`${g('اختار', 'اختاري')} اليوم، وبعدين جيم ولا بيت ولا راحة. في الجيم ${g('اختار', 'اختاري')} دفع ولا سحب ولا رجل، والتمارين بتتغير على طول.`, 'Pick the day, then gym, home or rest. At the gym pick push, pull, legs and more, and the exercises change right away.') },
    { tab: 'train', target: 'train.list', before: 'train.workout', pose: 'row', head: L('تمارينك', 'Your exercises'),
      body: L(`${g('دوس', 'دوسي')} على أي تمرين: صور وشرح وفيديو. ${g('سجّل', 'سجّلي')} الوزن والعدات والراحة بتتعد لوحدها، ${g('وبدّل', 'وبدّلي')} بين الدمبل والجهاز براحتك.`, 'Tap any exercise for pictures, tips and a video. Log weight and reps and the rest timer runs on its own. Switch between dumbbells and machines anytime.') },
    { tab: 'train', target: 'train.add', before: 'train.workout', pose: 'lift', head: L(`تمرينك على ذوقك`, 'Your workout, your way'),
      body: L(`تمرين أو جهاز مش موجود؟ ${g('ضيفه', 'ضيفيه')} وهيفضل في قايمتك كل مرة اليوم ده ييجي. ومن «${g('عدّل', 'عدّلي')} القايمة» ${g('شيل', 'شيلي')} أي تمرين مش ${g('عايزه', 'عايزاه')}.`, "Missing an exercise or machine? Add it and it stays on your list every time this workout comes up. “Edit list” removes anything you don't want.") },
    { tab: 'me', target: 'me.plan', pose: 'point', head: L('ملفك', 'Your profile'),
      body: L(`من هنا ${g('تغيّر', 'تغيّري')} نظام التمرين وأيام الأسبوع والأصوات والتنبيهات، ${g('وتشوف', 'وتشوفي')} الجولة دي تاني.`, 'Change your plan, training days, sounds and reminders here, and replay this tour.') },
    { tab: 'index', pose: 'cheer', head: L(`كده ${g('إنت جاهز', 'إنتي جاهزة')}!`, "You're all set!"), body: L('يلا نكسب ماتش النهارده.', "Let's win today's match.") },
  ];
}

type Box = { x: number; y: number; w: number; h: number };

export function Tour() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const win = useWindowDimensions();
  const { profile } = useStore();
  const [step, setStep] = useState<number | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const [ready, setReady] = useState(false);
  const run = useRef(0);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    tourSeen().then((seen) => { if (!seen) t = setTimeout(() => setStep(0), 900); });
    const off = onTourStart(() => setStep(0));
    return () => { off(); if (t) clearTimeout(t); };
  }, []);

  const list = profile ? steps(profile.name, genderFor(profile.sex)) : [];
  const s = step != null ? list[step] : null;

  // Go to the step's tab, bring its part into view, then measure where it is on screen.
  useEffect(() => {
    if (!s) return;
    const id = ++run.current;
    setReady(false);
    setBox(null);
    router.navigate(PATH[s.tab]);
    if (s.before) setTimeout(() => tourActions.get(s.before!)?.(), 120);
    if (!s.target) { setTimeout(() => { if (run.current === id) setReady(true); }, 250); return; }
    let tries = 0, scrolled = false;
    const top = insets.top + 24, bottom = win.height * 0.56;
    const look = () => {
      if (run.current !== id) return;
      const v = targets.get(s.target!);
      const retry = () => { if (tries++ < 10) setTimeout(look, 150); else setReady(true); };
      if (!v) { retry(); return; }
      v.measureInWindow((x, y, w, h) => {
        if (run.current !== id) return;
        if (!w && !h) { retry(); return; }
        const sc = scrollers.get(s.tab);
        if (!scrolled && sc?.view && (y < top || y + Math.min(h, 220) > bottom)) {
          scrolled = true;
          sc.view.scrollTo({ y: Math.max(0, sc.y + y - top - 70), animated: true });
          setTimeout(look, 500);
          return;
        }
        setBox({ x, y, w, h });
        setReady(true);
      });
    };
    setTimeout(look, 300);
  }, [step]);

  if (!s || step == null) return null;
  const last = step === list.length - 1;
  const close = () => {
    run.current++;
    markTourSeen();
    tourActions.get('train.today')?.();
    setStep(null);
    router.navigate('/');
  };
  // The buttons play their own sound (a swoosh forward, a cheer at the end).
  const go = (d: 1 | -1) => {
    if (last && d === 1) { close(); return; }
    setStep(Math.max(0, step + d));
  };

  const pad = 6;
  const hole = box ? { x: box.x - pad, y: box.y - pad, w: box.w + pad * 2, h: box.h + pad * 2 } : null;
  const dim = 'rgba(0,0,0,0.78)';
  // The card sits below the lit part when it's in the top half of the screen, else above it.
  const below = hole ? hole.y + hole.h / 2 < win.height / 2 : true;
  const cardPos = hole
    ? below ? { top: Math.min(hole.y + hole.h + 12, win.height - 300) } : { bottom: Math.max(win.height - hole.y + 12, insets.bottom + 12) }
    : { top: win.height * 0.28 };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 }} accessibilityViewIsModal>
      {hole ? <>
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(0, hole.y), backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: 0, right: 0, top: hole.y + hole.h, bottom: 0, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: 0, width: Math.max(0, hole.x), top: hole.y, height: hole.h, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h, backgroundColor: dim }} />
        <View pointerEvents="none" style={{ position: 'absolute', left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: RADIUS + 2, borderWidth: 2, borderColor: c.petrol }} />
      </> : <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: dim }} />}

      {ready ? (
        <Rise key={step} style={{ position: 'absolute', left: 16, right: 16, ...cardPos }}>
          <View style={{ backgroundColor: c.panel, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, padding: 14, gap: 10 }}>
            <View style={[styles.row, { gap: 12, alignItems: 'center' }]}>
              <View style={{ width: 64, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, borderRadius: RADIUS }}>
                <Mascot pose={s.pose} size={56} excited={last} />
              </View>
              <View style={{ flex: 1 }}>
                <Kicker>{L('الكابتن بيقول', 'The Captain says')}</Kicker>
                <T kind="h2" style={{ fontSize: 20, lineHeight: 30 }}>{s.head}</T>
              </View>
            </View>
            <T kind="body" color={c.ink}>{s.body}</T>
            <View style={[styles.rowBetween, { gap: 8 }]}>
              <View style={[styles.row, { gap: 4 }]} accessibilityLabel={L(`خطوة ${step + 1} من ${list.length}`, `Step ${step + 1} of ${list.length}`)}>
                {list.map((_, i) => <View key={i} style={{ width: i === step ? 14 : 5, height: 5, borderRadius: 3, backgroundColor: i === step ? c.petrol : i < step ? c.muted : c.line }} />)}
              </View>
              {!last ? (
                <Pressable onPress={() => { play('tap'); close(); }} accessibilityRole="button" hitSlop={10}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.muted }}>{L('تخطي الجولة', 'Skip tour')}</Text>
                </Pressable>
              ) : null}
            </View>
            <View style={[styles.row, { gap: 8 }]}>
              {step > 0 ? <Btn kind="secondary" title={L('رجوع', 'Back')} onPress={() => go(-1)} sound="tap" /> : null}
              <Btn title={last ? L('يلا بينا', "Let's go") : step === 0 ? L('يلا نلف', 'Show me') : L('التالي', 'Next')} onPress={() => go(1)} sound={last ? 'win' : 'swoosh'} style={{ flex: 1 }} />
            </View>
          </View>
        </Rise>
      ) : null}
    </View>
  );
}
