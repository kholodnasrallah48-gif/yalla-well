// Calorie targets, medical adjustments and weekly training sessions, derived from the profile.
import type { LabEntry, MedPlan } from './health.ts';
import { CONDITIONS, EXERCISES, GEAR, PAINS, SCHEDULES, SESSIONS, gymChoices, variantsOf, type Equip, type Exercise, type Joint, type Place, type ScheduleId } from './data.ts';
import { L, num, toNum, tx } from './i18n.ts';
import { FLAG_TAGS, LIST_WATCH, TRAIN_LABEL, WATCH_LABEL, effective, type Answers, type Watch } from './kb.ts';
import { quoteUx } from './translate.ts';
import { phaseFor, variantFor, type Phase } from './progress.ts';

export type Sex = 'f' | 'm';
export type Goal = 'lose' | 'maintain' | 'gain';
export type Activity = 'low' | 'mid' | 'high';
export type Level = 'beg' | 'mid';

export type Profile = {
  name: string;
  sex: Sex;
  age: number;
  height: number;
  weight: number;
  activity: Activity;
  goal: Goal;
  schedule: ScheduleId;
  level: Level;
  conditions: string[];
  meds: string[];
  pains: Joint[];
  otherCond?: string;
  otherMeds?: string;
  otherPain?: string;
  /** Day the plan started (YYYY-MM-DD); drives the weekly progression. */
  start?: string;
  /** The person's own pick per weekday (Saturday = 0): gym, home or rest. Missing days follow the schedule. */
  places?: Partial<Record<number, DayPlace>>;
  /** The person's own gym workout per weekday (a gym session id: push, pull, fullA...). Missing days follow the schedule. */
  splits?: Partial<Record<number, string>>;
  /** Equipment the person picked for an exercise: plan exercise id -> the version they use (e.g. dumbbell bench -> chest press machine). */
  gear?: Record<string, string>;
  /** Details for each condition picked at the start. */
  condInfo?: Record<string, CondInfo>;
  /** Anything the doctor said not to do, in the person's words. */
  doctorSaid?: string;
  /** Translations of the free text above into the other language (typed text -> translation), for showing it in the app's language. */
  tr?: Record<string, string>;
  /** Profile picture as a small JPEG data URI. */
  photo?: string;
  /** Weigh-ins, oldest first; the first one is the starting weight. */
  weights?: { d: string; kg: number }[];
  /** Medicine times, by medicine id ('x:<name>' for ones the person added). See lib/health. */
  medPlan?: Record<string, MedPlan>;
  /** Lab results, oldest first. */
  labs?: LabEntry[];
  /** Whether the person already followed a training system when they joined, and their quiz answers if not. */
  trains?: 'yes' | 'no';
  quiz?: Quiz;
  /** Exercises the person added to a workout (by workout id: push, pull, homeA...); they show every time that workout comes up. */
  own?: Record<string, OwnExercise[]>;
  /** Plan exercises the person took out of a workout: workout id -> exercise ids. */
  drop?: Record<string, string[]>;
  /** Answers about typed conditions and medicines the app doesn't know (by lib/kb itemKey), so they're still applied. */
  extra?: Record<string, Answers>;
};
/**
 * An exercise the person added: one of the app's exercises (ref), or their own in their words with the machine or
 * equipment they use (n, gear).
 */
export type OwnExercise = { id: string; ref?: string; n?: string; gear?: string };
/** Answers to "help me pick a plan". */
export type Quiz = { days: 3 | 4 | 5 | 6; where: 'gym' | 'home' | 'both'; focus: 'full' | 'glutes' | 'upper' | 'any' };
export type DayPlace = Place | 'rest';
/** How a condition is right now, and condition-specific answers (all optional). */
export type CondInfo = {
  status?: 'stable' | 'active' | 'new';
  /** Diabetes: how often blood sugar drops. */
  hypos?: 'never' | 'sometimes' | 'often';
  /** Last lab number the person knows (HbA1c %, TSH...). */
  lab?: string;
  /** Joint conditions: morning stiffness. */
  stiff?: boolean;
  /** Gut conditions / celiac: foods that upset them. */
  trigger?: string;
};

/** Picks the masculine or feminine form of a phrase for the person. */
export type Gender = (m: string, f: string) => string;
export const genderFor = (sex: Sex | undefined): Gender => (m, f) => (sex === 'm' ? m : f);

export type NoteTone = 'info' | 'warn' | 'bad';
export type Note = { tone: NoteTone; title: string; text: string };

export type Modifiers = {
  lowImpact: boolean;
  machines: boolean;
  /** Target effort on a 1-10 scale, as display text. */
  rpe: string;
  /** Largest calorie deficit allowed when losing weight (fraction of TDEE). */
  deficit: number;
  /** Protein floor in g per kg, when a condition raises it. */
  proteinPerKg: number | null;
  glutenFree: boolean;
  shortSessions: boolean;
  anyCondition: boolean;
  /** Protein ceiling in g per kg (kidney disease). */
  proteinCap: number | null;
  /** Extra cups of water a day. */
  extraCups: number;
};

/** Target effort, from easiest to the usual 7 of 10. */
const RPE: Record<number, [string, string]> = { 5: ['٥ من ١٠', '5 of 10'], 5.5: ['٥-٦ من ١٠', '5-6 of 10'], 6: ['٦ من ١٠', '6 of 10'], 6.5: ['٦-٧ من ١٠', '6-7 of 10'], 7: ['٧ من ١٠', '7 of 10'] };

export function medical(p: Profile): { food: Note[]; train: Note[]; mod: Modifiers; watch: string[] } {
  const g = genderFor(p.sex);
  const eff = effective(p);
  const has = (id: string) => eff.ids.has(id);
  let rpe = 7;
  const cap = (n: number) => { rpe = Math.min(rpe, n); };
  // The newest lab result logged in My health wins over the value given at the start.
  const logged = (k: LabEntry['kind']) => [...(p.labs ?? [])].filter((x) => x.kind === k && x.value !== undefined).sort((a, b) => b.date.localeCompare(a.date))[0]?.value;
  const food: Note[] = [];
  const train: Note[] = [];
  const mod: Modifiers = {
    lowImpact: false, machines: false, rpe: '', deficit: 0.2, proteinPerKg: null,
    glutenFree: false, shortSessions: false, anyCondition: p.conditions.length > 0 || !!p.otherCond?.trim() || eff.known.some((k) => k.item.kind === 'cond'),
    proteinCap: null, extraCups: 0,
  };

  if (has('steroids')) {
    mod.proteinPerKg = 2.0;
    food.push({ tone: 'warn', title: L('الكورتيزون', 'Steroids'), text: L(`بروتين أعلى عشان العضل، و${g('قلل', 'قللي')} الملح والسكريات البسيطة. ${g('اسأل', 'اسألي')} دكتورك عن الكالسيوم وفيتامين د.`, 'More protein to protect your muscles, and less salt and simple sugars. Ask your doctor about calcium and vitamin D.') });
    train.push({ tone: 'info', title: L('الكورتيزون', 'Steroids'), text: L(`تمارين المقاومة مهمة لحماية العضم والعضل، ${g('فمتسيبهاش', 'فمتسبيهاش')}.`, "Strength training protects your bones and muscles, so don't skip it.") });
  }
  if (has('thyroxine')) {
    food.push({ tone: 'info', title: L('دوا الغدة', 'Thyroid medicine'), text: L(`${g('خده', 'خديه')} على معدة فاضية قبل الفطار بنص ساعة لساعة. الكالسيوم والحديد بعده بـ٤ ساعات، والقهوة بعده بساعة على الأقل.`, 'Take it on an empty stomach 30–60 minutes before breakfast. Calcium and iron 4 hours after it, and coffee at least an hour after.') });
  }
  if (has('hashimoto')) {
    mod.deficit = Math.min(mod.deficit, 0.15);
    food.push({ tone: 'info', title: L('هاشيموتو', "Hashimoto's"), text: L(`العجز في السعرات محدود (١٥٪ بس) عشان ${g('متتعبش', 'متتعبيش')} وطاقتك تفضل كويسة.`, 'The calorie deficit is capped at 15% so you stay well and keep your energy up.') });
    train.push({ tone: 'info', title: L('هاشيموتو', "Hashimoto's"), text: L(`الشدة متوسطة والراحة كافية بين الجولات. لو ${g('تعبان', 'تعبانة')} ${g('استخدم', 'استخدمي')} يوم التعافي.`, "Moderate intensity with enough rest between rounds. If you're tired, use the recovery day.") });
  }
  if (has('graves')) {
    mod.deficit = 0; mod.lowImpact = true; cap(6);
    food.push({ tone: 'bad', title: L('جريفز', "Graves'"), text: L('مش هنعمل عجز سعرات لحد ما الغدة تتظبط مع دكتورك، لأن فرط النشاط بيحرق عضل.', 'No calorie deficit until your doctor gets your thyroid under control, because an overactive thyroid burns muscle.') });
    train.push({ tone: 'bad', title: L('جريفز', "Graves'"), text: L('بلاش تمارين عالية الشدة لحد ما النبض والغدة يتظبطوا. خلي الشدة خفيفة لمتوسطة.', 'No high-intensity training until your heart rate and thyroid are under control. Keep it light to moderate.') });
  }
  if (has('ra') || has('psoriasis')) {
    mod.lowImpact = true; mod.machines = true;
    train.push({ tone: 'warn', title: L('المفاصل', 'Joints'), text: L(`التمارين منخفضة التأثير ومعظمها على الماكينات. ${g('سخن', 'سخني')} ١٠ دقايق قبل التمرين، وفي أيام الالتهاب ${g('خفف', 'خففي')} الأوزان.`, 'Low-impact exercises, mostly on machines. Warm up for 10 minutes first, and go lighter on flare days.') });
    food.push({ tone: 'info', title: L('المفاصل', 'Joints'), text: L('السمك (مرتين في الأسبوع) وزيت الزيتون والخضار مفيدين للالتهاب.', 'Fish (twice a week), olive oil and vegetables help with inflammation.') });
  }
  if (has('lupus')) {
    mod.lowImpact = true; cap(6.5);
    train.push({ tone: 'warn', title: L('لوبس', 'Lupus'), text: L(`الشدة متوسطة ومن غير قفز. لو هتمشي برا، امشي بدري أو بالليل بعيد عن الشمس.`, 'Moderate intensity, no jumping. If you walk outside, go early or in the evening, away from the sun.') });
  }
  if (has('t1d') || has('insulin')) {
    train.push({ tone: 'bad', title: L('السكر', 'Diabetes'), text: L(`${g('قيس', 'قيسي')} السكر قبل التمرين. لو أقل من ١٠٠ ${g('كل', 'كلي')} ١٥-٢٠ جرام كارب الأول، وخلي ${g('معاك', 'معاكي')} حاجة مسكرة. تمارين المقاومة قبل الكارديو بتقلل الهبوط.`, 'Check your blood sugar before training. If it is under 100, eat 15-20 g of carbs first, and keep something sweet with you. Strength work before cardio lowers the risk of a drop.') });
    food.push({ tone: 'warn', title: L('السكر', 'Diabetes'), text: L(`خلي كمية الكارب في كل وجبة ثابتة على قد ما ${g('تقدر', 'تقدري')} عشان جرعات الإنسولين.`, 'Keep the carbs in each meal as steady as you can, to match your insulin doses.') });
  }
  if (has('celiac')) {
    mod.glutenFree = true;
    food.push({ tone: 'bad', title: L('سيلياك', 'Celiac'), text: L('هنعلم على الأكلات اللي فيها قمح أو جلوتين في قائمة الأكل.', 'Foods with wheat or gluten are marked in the food list.') });
  }
  if (has('ms')) {
    mod.shortSessions = true; cap(6);
    train.push({ tone: 'warn', title: 'MS', text: L(`التمرين أقصر ومكان التمرين يكون بارد. ${g('اشرب', 'اشربي')} مياه ساقعة و${g('خد', 'خدي')} راحة أطول، و${g('وقف', 'وقفي')} لو ${g('حسيت', 'حسيتي')} بحرارة زيادة.`, 'Shorter workouts in a cool place. Drink cold water, rest longer, and stop if you feel overheated.') });
  }
  if (has('ibd')) {
    food.push({ tone: 'info', title: L('القولون', 'IBD'), text: L(`وجبات صغيرة ومياه كتير. في أيام النشاط ${g('قلل', 'قللي')} الألياف الخشنة والمقليات.`, 'Small meals and plenty of water. On flare days, cut back on coarse fiber and fried food.') });
  }
  if (has('mtx')) {
    food.push({ tone: 'warn', title: L('ميثوتركسات', 'Methotrexate'), text: L('ممنوع الكحول، وحمض الفوليك حسب كلام دكتورك.', 'No alcohol, and take folic acid as your doctor says.') });
    train.push({ tone: 'info', title: L('ميثوتركسات', 'Methotrexate'), text: L(`لو ${g('بتتعب', 'بتتعبي')} يوم الجرعة أو اليوم اللي بعده، خليه يوم راحة أو يوم تعافي.`, 'If you feel tired on dose day or the day after, make it a rest or recovery day.') });
  }
  if (has('bio')) {
    train.push({ tone: 'warn', title: L('المناعة', 'Immunity'), text: L(`${g('امسح', 'امسحي')} الأجهزة قبل ما ${g('تستخدمها', 'تستخدميها')} في الجيم، و${g('متتمرنش', 'متتمرنيش')} لو عندك سخونية أو دور برد.`, "Wipe gym equipment before you use it, and don't train if you have a fever or a cold.") });
  }
  if (has('hcq')) {
    train.push({ tone: 'info', title: L('بلاكونيل', 'Plaquenil'), text: L(`لو ${g('بتتمرن', 'بتتمرني')} برا ${g('استخدم', 'استخدمي')} صن بلوك لأن الدوا بيزود الحساسية للشمس.`, 'If you train outdoors, wear sunscreen: the medicine makes you more sensitive to the sun.') });
  }
  if (has('beta')) {
    train.push({ tone: 'warn', title: L('حاصرات بيتا', 'Beta blockers'), text: L(`النبض هيبقى أقل من الطبيعي، ${g('فاستخدم', 'فاستخدمي')} إحساسك بالمجهود مش ساعة النبض: لازم ${g('تقدر تتكلم', 'تقدري تتكلمي')} وانت ${g('بتتمرن', 'بتتمرني')}.`, 'Your heart rate will run lower than usual, so go by how hard it feels, not by a heart-rate watch: you should be able to talk while training.') });
  }
  if (has('anticoag')) {
    mod.machines = true; mod.lowImpact = true;
    train.push({ tone: 'bad', title: L('مسيل الدم', 'Blood thinners'), text: L('بلاش أي تمرين فيه احتمال وقوع أو خبط. الماكينات أأمن من الأوزان الحرة.', 'Avoid any exercise with a risk of falling or bumps. Machines are safer than free weights.') });
  }
  const allPains = [...new Set([...p.pains, ...eff.pains])];
  if (allPains.length) {
    const names = allPains.map((id) => PAINS.find((x) => x.id === id)?.n);
    train.push({ tone: 'warn', title: L('الألم', 'Pain'), text: L(`بدلنا التمارين اللي بتضغط على ${names.join(' و')} بتمارين ألطف. لو ${g('حسيت', 'حسيتي')} بألم حاد ${g('وقف', 'وقفي')} فورا.`, `We swapped exercises that load your ${names.map((n) => tx(n ?? '').toLowerCase()).join(' and ')} for gentler ones. Stop right away if you feel sharp pain.`) });
  }
  // Text the person typed shows in the app's language (translated when saved), quoted in English when not yet.
  const q = (s: string | undefined) => quoteUx(p, s);
  if (p.otherPain?.trim()) {
    train.push({ tone: 'warn', title: L('الألم', 'Pain'), text: L(`${g('كتبت', 'كتبتي')} إن عندك ألم في (${q(p.otherPain)}). أي تمرين يضغط عليه ${g('خففه أو بدله', 'خففيه أو بدليه')}، و${g('اسأل', 'اسألي')} دكتور علاج طبيعي.`, `You noted pain: ${q(p.otherPain)}. Go lighter on or swap any exercise that loads it, and ask a physiotherapist.`) });
  }
  // Details from the start: how each condition is right now and what the doctor said.
  const info = p.condInfo ?? {};
  const nameOf = (id: string) => tx(CONDITIONS.find((x) => x.id === id)?.n ?? id);
  const active = p.conditions.filter((id) => info[id]?.status === 'active');
  const fresh = p.conditions.filter((id) => info[id]?.status === 'new');
  if (active.length) {
    mod.lowImpact = true; mod.shortSessions = true; cap(5.5); mod.deficit = Math.min(mod.deficit, 0.1);
    train.unshift({ tone: 'bad', title: L('الحالة نشطة دلوقتي', 'Active right now'), text: L(`${g('قلت', 'قلتي')} إن (${active.map(nameOf).join('، ')}) فيها نشاط دلوقتي، فخلينا التمرين أقصر وأخف ومن غير قفز، والعجز في السعرات بسيط. لما الدكتور يطمن${g('ك', 'كي')} ${g('غير', 'غيري')} الحالة من ملفي.`, `You said ${active.map(nameOf).join(', ')} ${active.length > 1 ? 'are' : 'is'} active right now, so workouts are shorter, lighter and jump-free, with only a small calorie deficit. Update it from Me once your doctor gives the all-clear.`) });
  }
  if (fresh.length) {
    cap(6);
    train.push({ tone: 'warn', title: L('تشخيص جديد', 'New diagnosis'), text: L(`عشان (${fresh.map(nameOf).join('، ')}) جديد، أول أسبوعين هنمشي بالراحة لحد ما ${g('تعرف', 'تعرفي')} جسمك بيستجيب إزاي. ${g('اسأل', 'اسألي')} دكتورك عن التمرين لو لسه بيظبط العلاج.`, `Because ${fresh.map(nameOf).join(', ')} ${fresh.length > 1 ? 'are' : 'is'} new, take the first two weeks easy while you learn how your body responds. Ask your doctor about exercise if your treatment is still being adjusted.`) });
  }
  const sugar = p.conditions.find((id) => ['t1d', 't2d', 'ir'].includes(id) && info[id]);
  if (sugar) {
    const hy = info[sugar]?.hypos;
    if (hy === 'often') {
      mod.lowImpact = true;
      train.unshift({ tone: 'bad', title: L('هبوط السكر', 'Low blood sugar'), text: L(`عشان السكر بيهبط معا${g('ك', 'كي')} كتير: ${g('كل', 'كلي')} سناك فيه كارب قبل التمرين بساعة، بلاش كارديو على معدة فاضية، و${g('خلي', 'خلي')} معا${g('ك', 'كي')} عصير أو تمر. ${g('كلم', 'كلمي')} دكتورك عشان جرعة الدوا.`, 'Because your blood sugar often drops: eat a carb snack an hour before training, no fasted cardio, and keep juice or dates with you. Talk to your doctor about your dose.') });
    } else if (hy === 'sometimes') {
      train.push({ tone: 'warn', title: L('هبوط السكر', 'Low blood sugar'), text: L(`${g('قيس', 'قيسي')} قبل التمرين، ولو حسيت${g('', 'ي')} برعشة أو عرق ${g('وقف', 'وقفي')} و${g('خد', 'خدي')} حاجة مسكرة.`, 'Check before training, and if you feel shaky or sweaty, stop and have something sweet.') });
    }
    const a1c = logged('hba1c') ?? toNum(info[sugar]?.lab);
    if (a1c >= 9) train.unshift({ tone: 'bad', title: L('التراكمي عالي', 'High HbA1c'), text: L(`التراكمي ${a1c}٪ عالي. ${g('اعرض', 'اعرضي')} الخطة على دكتورك قبل التمرين العنيف، وابدأ${g('', 'ي')} بالمشي والتمارين الخفيفة.`, `An HbA1c of ${a1c}% is high. Show this plan to your doctor before hard training, and start with walking and light workouts.`) });
    else if (a1c >= 7) food.push({ tone: 'warn', title: L('التراكمي', 'HbA1c'), text: L(`التراكمي ${a1c}٪. هنركز على أكل بطيء في رفع السكر، وده هيبان في الاقتراحات.`, `Your HbA1c is ${a1c}%. We'll favour foods that raise blood sugar slowly in the suggestions.`) });
  }
  const tsh = (id: string) => logged('tsh') ?? toNum(info[id]?.lab);
  if (p.conditions.includes('hashimoto') && tsh('hashimoto') > 4.5) {
    mod.deficit = Math.min(mod.deficit, 0.1);
    food.push({ tone: 'warn', title: L('الـ TSH عالي', 'High TSH'), text: L(`آخر TSH (${tsh('hashimoto')}) أعلى من الطبيعي، فالطاقة ممكن تكون أقل والنزول أبطأ. خلينا العجز في السعرات ١٠٪ بس لحد ما الدكتور يظبط الجرعة.`, `Your last TSH (${tsh('hashimoto')}) is above normal, so energy may be lower and weight loss slower. The calorie deficit is 10% until your doctor adjusts your dose.`) });
  }
  if (p.conditions.includes('graves') && (info.graves?.lab || logged('tsh') !== undefined) && tsh('graves') < 0.1) {
    mod.lowImpact = true; cap(5);
    train.unshift({ tone: 'bad', title: L('الـ TSH مكبوت', 'Suppressed TSH'), text: L('الغدة لسه نشيطة زيادة، فخلي المجهود خفيف ونبضك تحت السيطرة لحد التحليل الجاي.', 'Your thyroid is still overactive, so keep the effort light and your heart rate in check until your next test.') });
  }
  if (p.conditions.some((id) => ['ra', 'psoriasis', 'lupus'].includes(id) && info[id]?.stiff)) {
    train.push({ tone: 'info', title: L('تيبس الصبح', 'Morning stiffness'), text: L(`${g('سخن', 'سخني')} ١٠-١٥ دقيقة بحركة خفيفة، والتمرين بعد الضهر بيبقى أريح من الصبح بدري.`, 'Warm up for 10-15 minutes with gentle movement; training after midday is easier than early morning.') });
  }
  const triggers = p.conditions.map((id) => info[id]?.trigger?.trim()).filter((s): s is string => !!s).map(q);
  if (triggers.length) food.push({ tone: 'warn', title: L(`أكلات بتتعب${g('ك', 'كي')}`, 'Foods that upset you'), text: L(`${g('كتبت', 'كتبتي')} إن (${triggers.join('، ')}) بتتعب${g('ك', 'كي')}. ${g('ابعد', 'ابعدي')} عنها حتى لو ظهرت في الاقتراحات.`, `You noted these foods upset you: ${triggers.join(', ')}. Skip them even if they show up in suggestions.`) });
  if (p.doctorSaid?.trim()) {
    const n: Note = { tone: 'bad', title: L('كلام الدكتور', 'Your doctor said'), text: L(`"${q(p.doctorSaid)}". كلام دكتورك أهم من أي حاجة في الخطة دي.`, `${q(p.doctorSaid)}. Your doctor's advice comes before anything in this plan.`) };
    train.unshift(n); food.unshift(n);
  }
  // Conditions and medicines the person typed: the ones the app knows bring their own notes and limits.
  for (const { item } of eff.known) {
    if (item.same) continue;
    const title = L(item.n[0], item.n[1]);
    if (item.foodNote) { const [a, e] = item.foodNote(g); food.push({ tone: 'warn', title, text: L(a, e) }); }
    if (item.trainNote) { const [a, e] = item.trainNote(g); train.push({ tone: item.train?.length || item.watch?.includes('chest') ? 'warn' : 'info', title, text: L(a, e) }); }
    if (item.deficit !== undefined) mod.deficit = Math.min(mod.deficit, item.deficit);
    if (item.proteinMin) mod.proteinPerKg = Math.max(mod.proteinPerKg ?? 0, item.proteinMin);
    if (item.proteinMax) mod.proteinCap = Math.min(mod.proteinCap ?? 9, item.proteinMax);
    if (item.water) mod.extraCups = Math.max(mod.extraCups, item.water);
  }
  // What to cut down on and avoid, from typed items the app knows and the answers about the ones it doesn't.
  if (eff.train.has('noJump')) mod.lowImpact = true;
  if (eff.train.has('machines') || eff.train.has('noHeavy')) mod.machines = true;
  if (eff.train.has('noHeavy')) cap(6);
  if (eff.train.has('easy')) cap(5.5);
  if (eff.train.has('short')) mod.shortSessions = true;
  if (eff.food.has('gluten')) mod.glutenFree = true;
  const answered = eff.unknown.filter((u) => u.ans && (u.ans.food?.length || u.ans.train?.length || u.ans.watch?.length));
  for (const u of answered) {
    const name = q(u.text);
    const cut = (u.ans!.food ?? []).map((f) => L(FLAG_TAGS[f].ar, FLAG_TAGS[f].en));
    const skip = (u.ans!.train ?? []).map((f) => L(TRAIN_LABEL[f][0], TRAIN_LABEL[f][1]).toLowerCase());
    if (cut.length) food.push({ tone: 'warn', title: name, text: L(`عشان (${name}) هننبه${g('ك', 'كي')} على الأكل اللي فيه ${cut.join(' و')}.`, `Because of ${name}, foods high in ${cut.join(' and ').toLowerCase()} are flagged.`) });
    if (skip.length) train.push({ tone: 'warn', title: name, text: L(`عشان (${name}) شيلنا من التمرين: ${skip.join('، ')}.`, `Because of ${name}, your workouts leave out: ${skip.join(', ')}.`) });
  }
  if (eff.train.has('noHeat')) train.push({ tone: 'info', title: L('الحر', 'Heat'), text: L(`${g('اتمرن', 'اتمرني')} في مكان بارد ومتهوي، و${g('اشرب', 'اشربي')} مياه ساقعة.`, 'Train somewhere cool and airy, and drink cold water.') });
  const open = eff.unknown.filter((u) => !answered.includes(u)).map((u) => q(u.text)).join(L('، ', ', '));
  const legacy = [p.otherMeds].filter((s) => s?.trim() && !eff.unknown.length && !eff.known.length).map(q).join('');
  if (open || legacy) {
    train.push({ tone: 'info', title: L('حالات تانية', 'Other conditions'), text: L(`سجلنا اللي ${g('كتبته', 'كتبتيه')} (${open || legacy}). ${g('اعرض', 'اعرضي')} الخطة على دكتورك قبل ما ${g('تبدأ', 'تبدأي')}.`, `We saved what you wrote: ${open || legacy}. Show this plan to your doctor before you start.`) });
  }
  mod.rpe = L(RPE[rpe][0], RPE[rpe][1]);
  // Signs to stop a workout for.
  const w = new Set<Watch>(eff.watch);
  for (const id of eff.ids) LIST_WATCH[id]?.forEach((x) => w.add(x));
  const watch = [...w].map((x) => L(WATCH_LABEL[x][0], WATCH_LABEL[x][1]));
  return { food, train, mod, watch };
}

/** One cup of water. DayLog.water counts cups and may be fractional (a 500 ml bottle adds 2). */
export const CUP_ML = 250;

export type Targets = { kcal: number; protein: number; fat: number; carbs: number; waterCups: number; tdee: number };

const ACTIVITY_FACTOR: Record<Activity, number> = { low: 1.2, mid: 1.3, high: 1.45 };
/** Extra burn from training, by the days the person actually trains (their own week, not just the plan's). */
function trainingFactor(p: Profile): number {
  const pl = weekPlaces(p);
  const gym = pl.filter((x) => x === 'gym').length, home = pl.filter((x) => x === 'home').length;
  const days = gym + home;
  if (days <= 3) return 0.1;
  if (days === 4) return 0.14;
  if (days === 5) return home ? 0.17 : 0.2;
  return 0.24;
}

/** Mifflin-St Jeor BMR × activity, adjusted for the goal and medical caps. */
export function targets(p: Profile): Targets {
  const { mod } = medical(p);
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * (ACTIVITY_FACTOR[p.activity] + trainingFactor(p));
  let kcal = tdee;
  if (p.goal === 'lose') kcal = tdee * (1 - mod.deficit);
  if (p.goal === 'gain') kcal = tdee * 1.1;
  kcal = Math.round(Math.max(kcal, p.sex === 'm' ? 1500 : 1200) / 10) * 10;
  let ppk = p.goal === 'maintain' ? 1.6 : 1.8;
  if (mod.proteinPerKg) ppk = Math.max(ppk, mod.proteinPerKg);
  if (mod.proteinCap) ppk = Math.min(ppk, mod.proteinCap);
  const protein = Math.round(p.weight * ppk);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs, waterCups: Math.ceil((p.weight * 35) / CUP_ML) + mod.extraCups, tdee: Math.round(tdee) };
}

export type PlannedExercise = {
  id: string; ex: Exercise; why: string | null; rx: string;
  /** The machine or equipment the person named for an exercise they added themselves. */
  gear?: string;
  /** Added by the person (shown with a remove button in the edit list). */
  own?: boolean;
  /** The plan's exercise this one stands for (differs from id when the person picked other equipment or it was swapped). */
  base: string;
  /** Strength work only: sets, rep range and rest; 0 sets for timed work. */
  sets: number; reps: [number, number]; rest: number;
};
export type DaySession = {
  id: string; n: string; place: Place; flare: boolean; rpe: string; items: PlannedExercise[];
  week: number; variant: 'A' | 'B'; phase: Phase;
};

const ar = (n: number) => num(n);

function prescription(p: Profile, e: Exercise, m: Modifiers, phase: Phase): Omit<PlannedExercise, 'id' | 'ex' | 'why' | 'base'> {
  const beginner = p.level === 'beg';
  const timed = (rx: string) => ({ rx, sets: 0, reps: [0, 0] as [number, number], rest: 0 });
  if (e.k === 'cardio') return timed(m.shortSessions ? L('١٠ دقايق، مجهود متوسط', '10 min, moderate effort') : p.goal === 'lose' ? L('٢٠ دقيقة، مجهود متوسط', '20 min, moderate effort') : L('١٥ دقيقة، مجهود متوسط', '15 min, moderate effort'));
  if (e.k === 'mob') return timed(L('١٠ دقايق براحة', '10 min, easy'));
  if (e.k === 'core') {
    const sets = Math.max(2, (beginner ? 2 : 3) + phase.setsDelta);
    return { rx: L(`${ar(sets)} × ٣٠ ثانية`, `${ar(sets)} × 30 sec`), sets, reps: [30, 30], rest: 45 };
  }
  const sets = Math.max(2, (beginner ? 3 : p.goal === 'gain' ? 4 : 3) + phase.setsDelta);
  const reps: [number, number] = p.goal === 'gain' ? [8, 10] : p.goal === 'lose' ? [12, 15] : [10, 12];
  const rest = p.goal === 'gain' ? 90 : 60;
  return { rx: L(`${ar(sets)} مجموعات × ${ar(reps[0])} لـ ${ar(reps[1])} عدة · راحة ${ar(rest)} ثانية`, `${ar(sets)} sets × ${ar(reps[0])}–${ar(reps[1])} reps · ${ar(rest)} sec rest`), sets, reps, rest };
}

/** Follows the exercise's gentler alternatives until one fits the person, or drops it. */
export function resolveExercise(id: string, p: Profile, m: Modifiers): { id: string; ex: Exercise; why: string | null } | null {
  let cur = id;
  let firstWhy: string | null = null;
  for (let i = 0; i < 6; i++) {
    const ex = EXERCISES[cur];
    if (!ex) return null;
    let why: string | null = null;
    const pains = [...p.pains, ...effective(p).pains];
    const pain = PAINS.find((x) => pains.includes(x.id) && ex.stress.includes(x.id));
    if (m.lowImpact && ex.impact === 'high') why = L('بدل تمرين فيه قفز', 'Instead of a jumping exercise');
    else if (pain) why = L('عشان ' + pain.n, 'Easier on your ' + tx(pain.n).toLowerCase());
    else if (m.machines && ex.free) why = L('الماكينة أأمن', 'The machine is safer');
    if (!why) return { id: cur, ex, why: firstWhy };
    firstWhy ??= why;
    if (!ex.alt) return null;
    cur = ex.alt;
  }
  return null;
}

/**
 * Ways to do a planned exercise that suit this person (free weights, machine, cable...), each with the
 * equipment to use. Versions that don't fit their pain or medical needs are left out.
 */
export function gearOptions(p: Profile, base: string): { id: string; ex: Exercise; eq: Equip; gear: string }[] {
  const m = medical(p).mod;
  return variantsOf(base)
    .map((id) => ({ id, r: resolveExercise(id, p, m) }))
    .filter((x) => x.r && x.r.id === x.id)
    .map(({ id }) => ({ id, ex: EXERCISES[id], eq: GEAR[id]?.eq ?? 'none', gear: GEAR[id] ? L(GEAR[id].ar, GEAR[id].en) : '' }));
}

/** The session for a Saturday-first day index in a program week, or null on rest days. */
/** Gym, home or rest for each weekday: the person's own pick, else the schedule's. */
export function weekPlaces(p: Profile): DayPlace[] {
  const map = SCHEDULES[p.schedule]?.map ?? {};
  return Array.from({ length: 7 }, (_, i) => p.places?.[i] ?? (map[i] ? SESSIONS[map[i]].pl : 'rest'));
}

/**
 * The session id for each weekday. Gym days take the schedule's gym sessions in order (cycling), home days
 * alternate the two home sessions, so changing a day's place keeps the week balanced. A gym day the person gave
 * its own workout (push, pull, legs...) uses that one.
 */
export function weekSessions(p: Profile): (string | null)[] {
  const map = SCHEDULES[p.schedule]?.map ?? {};
  const gym = Object.keys(map).map(Number).sort((a, b) => a - b).map((i) => map[i]).filter((id) => SESSIONS[id].pl === 'gym');
  const home = ['homeA', 'homeB'];
  let g = 0, h = 0;
  return weekPlaces(p).map((pl, i) => {
    if (pl === 'gym') {
      const auto = gym.length ? gym[g++ % gym.length] : 'upper';
      return p.splits?.[i] ?? auto;
    }
    return pl === 'home' ? home[h++ % 2] : null;
  });
}

export function sessionFor(p: Profile, dayIndex: number, flare: boolean, week = 0): DaySession | null {
  const sid = weekSessions(p)[dayIndex];
  if (!sid) return null;
  const m = medical(p).mod;
  const s = flare ? SESSIONS.gentle : SESSIONS[sid];
  const variant = variantFor(week);
  const phase = phaseFor(week);
  const seen = new Set<string>();
  // Exercises the person took out stay out in both weeks: the alternate week drops the one in the same place.
  const dropped = new Set(flare ? [] : p.drop?.[sid] ?? []);
  const bases = (variant === 'B' && s.exB ? s.exB : s.ex).filter((b, i) => !dropped.has(b) && !dropped.has(s.ex[i]) && !(s.exB && dropped.has(s.exB[i])));
  const own = flare ? [] : p.own?.[sid] ?? [];
  let list: { id: string; ex: Exercise; why: string | null; base: string; gear?: string; own?: boolean }[] = [];
  const add = (base: string, mine?: boolean) => {
    // The version the person picked for this exercise (free weights, machine...), when it still fits them.
    const id = p.gear?.[base] ?? base;
    const r = resolveExercise(id, p, m) ?? (id !== base ? resolveExercise(base, p, m) : null);
    if (r && !seen.has(r.id)) { seen.add(r.id); list.push({ ...r, base, own: mine }); }
  };
  bases.forEach((b) => add(b));
  if (m.shortSessions && !flare && list.length > 5) list = list.slice(0, 5);
  // The person's own additions always stay, after the plan's exercises.
  for (const o of own) {
    if (o.ref && EXERCISES[o.ref]) add(o.ref, true);
    else if (o.n?.trim() && !seen.has(o.id)) {
      seen.add(o.id);
      list.push({ id: o.id, ex: { n: o.n.trim(), k: 'str', stress: [] }, why: null, base: o.id, gear: o.gear?.trim() || undefined, own: true });
    }
  }
  if (!flare && s.pl === 'gym' && !list.some((x) => x.ex.k === 'cardio') && (p.goal === 'lose' || p.schedule === '3')) {
    const c = m.lowImpact ? 'g_bike' : 'g_incline';
    list.push({ id: c, ex: EXERCISES[c], why: null, base: c });
  }
  return {
    id: flare ? 'gentle' : sid, n: s.n, place: s.pl, flare,
    rpe: flare ? L('٤-٥ من ١٠', '4-5 of 10') : m.rpe,
    items: list.map((x) => ({ ...x, ...prescription(p, x.ex, m, phase) })),
    week, variant, phase,
  };
}

/** Short name of a workout for day tiles and headings: Push, Pull, Legs, Home... */
export function splitLabel(id: string | null | undefined): string {
  if (!id) return L('راحة', 'Rest');
  const m: Record<string, [string, string]> = {
    fullA: ['جسم كله أ', 'Full A'], fullB: ['جسم كله ب', 'Full B'], push: ['دفع', 'Push'], pull: ['سحب', 'Pull'], legs: ['رجل', 'Legs'],
    upper: ['علوي', 'Upper'], lower: ['سفلي', 'Lower'], chest: ['صدر', 'Chest'], back: ['ضهر', 'Back'], shoulders: ['كتف', 'Shoulders'],
    arms: ['دراع', 'Arms'], glutes: ['أرداف', 'Glutes'], homeA: ['بيت: قوة', 'Home: strength'], homeB: ['بيت: كارديو', 'Home: cardio'], gentle: ['تعافي', 'Recovery'],
  };
  const v = m[id];
  return v ? L(v[0], v[1]) : id;
}

/** Every gym workout a day can be: the plan's own first, then the rest. */
export function allGymChoices(id: ScheduleId): string[] {
  const own = gymChoices(id);
  return [...own, ...gymChoices('custom').filter((x) => !own.includes(x))];
}

/**
 * The plan that fits someone who doesn't follow one yet, from three questions: how many days, where, and what
 * they want to focus on. Home-only plans use the same days with home workouts.
 */
export function recommendPlan(q: Quiz, level: Level): { schedule: ScheduleId; places?: Partial<Record<number, DayPlace>>; why: string } {
  let schedule: ScheduleId;
  if (q.where === 'home') schedule = q.days === 3 ? 'fb3' : q.days === 4 ? 'ul4' : q.days === 5 ? '5mix' : 'ppl6';
  else if (q.days === 3) schedule = level === 'beg' || q.focus === 'full' ? 'fb3' : '3';
  else if (q.days === 4) schedule = q.focus === 'glutes' ? 'glute4' : 'ul4';
  else if (q.days === 5) schedule = q.where === 'both' ? '5mix' : q.focus === 'upper' ? 'bro5' : '5gym';
  else schedule = 'ppl6';
  const places = q.where === 'home'
    ? Object.fromEntries(Object.keys(SCHEDULES[schedule].map).map((d) => [Number(d), 'home' as DayPlace]))
    : undefined;
  const days = { 3: L('٣ أيام', '3 days'), 4: L('٤ أيام', '4 days'), 5: L('٥ أيام', '5 days'), 6: L('٦ أيام', '6 days') }[q.days];
  const where = { gym: L('في الجيم', 'at the gym'), home: L('في البيت', 'at home'), both: L('بين الجيم والبيت', 'between the gym and home') }[q.where];
  const focus = { full: L('وبيشغل الجسم كله بالتساوي', 'and works the whole body evenly'), glutes: L('وفيه تركيز على الأرداف والرجل', 'with extra glutes and legs'),
    upper: L('وفيه تركيز على عضل الجزء العلوي', 'with extra upper-body work'), any: '' }[q.focus];
  return { schedule, places, why: L(`مناسب لـ${days} ${where}${focus ? ' ' + focus : ''}.`, `Fits ${days} ${where}${focus ? ' ' + focus : ''}.`) };
}
