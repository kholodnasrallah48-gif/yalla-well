// Calorie targets, medical adjustments and weekly training sessions, derived from the profile.
import { EXERCISES, PAINS, SCHEDULES, SESSIONS, type Exercise, type Joint, type Place, type ScheduleId } from './data.ts';

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
};

export function medical(p: Profile): { food: Note[]; train: Note[]; mod: Modifiers } {
  const g = genderFor(p.sex);
  const has = (id: string) => p.conditions.includes(id) || p.meds.includes(id);
  const food: Note[] = [];
  const train: Note[] = [];
  const mod: Modifiers = {
    lowImpact: false, machines: false, rpe: '٧ من ١٠', deficit: 0.2, proteinPerKg: null,
    glutenFree: false, shortSessions: false, anyCondition: p.conditions.length > 0 || !!p.otherCond,
  };

  if (has('steroids')) {
    mod.proteinPerKg = 2.0;
    food.push({ tone: 'warn', title: 'الكورتيزون', text: `بروتين أعلى عشان العضل، و${g('قلل', 'قللي')} الملح والسكريات البسيطة. ${g('اسأل', 'اسألي')} دكتورك عن الكالسيوم وفيتامين د.` });
    train.push({ tone: 'info', title: 'الكورتيزون', text: `تمارين المقاومة مهمة لحماية العضم والعضل، ${g('فمتسيبهاش', 'فمتسبيهاش')}.` });
  }
  if (has('thyroxine')) {
    food.push({ tone: 'info', title: 'دوا الغدة', text: `${g('خده', 'خديه')} على معدة فاضية قبل الفطار بنص ساعة لساعة. الكالسيوم والحديد بعده بـ٤ ساعات، والقهوة بعده بساعة على الأقل.` });
  }
  if (has('hashimoto')) {
    mod.deficit = Math.min(mod.deficit, 0.15);
    food.push({ tone: 'info', title: 'هاشيموتو', text: `العجز في السعرات محدود (١٥٪ بس) عشان ${g('متتعبش', 'متتعبيش')} وطاقتك تفضل كويسة.` });
    train.push({ tone: 'info', title: 'هاشيموتو', text: `الشدة متوسطة والراحة كافية بين الجولات. لو ${g('تعبان', 'تعبانة')} ${g('استخدم', 'استخدمي')} يوم التعافي.` });
  }
  if (has('graves')) {
    mod.deficit = 0; mod.lowImpact = true; mod.rpe = '٦ من ١٠';
    food.push({ tone: 'bad', title: 'جريفز', text: 'مش هنعمل عجز سعرات لحد ما الغدة تتظبط مع دكتورك، لأن فرط النشاط بيحرق عضل.' });
    train.push({ tone: 'bad', title: 'جريفز', text: 'بلاش تمارين عالية الشدة لحد ما النبض والغدة يتظبطوا. خلي الشدة خفيفة لمتوسطة.' });
  }
  if (has('ra') || has('psoriasis')) {
    mod.lowImpact = true; mod.machines = true;
    train.push({ tone: 'warn', title: 'المفاصل', text: `التمارين منخفضة التأثير ومعظمها على الماكينات. ${g('سخّن', 'سخّني')} ١٠ دقايق قبل التمرين، وفي أيام الالتهاب ${g('خفف', 'خففي')} الأوزان.` });
    food.push({ tone: 'info', title: 'المفاصل', text: 'السمك (مرتين في الأسبوع) وزيت الزيتون والخضار مفيدين للالتهاب.' });
  }
  if (has('lupus')) {
    mod.lowImpact = true; mod.rpe = '٦-٧ من ١٠';
    train.push({ tone: 'warn', title: 'لوبس', text: `الشدة متوسطة ومن غير قفز. لو هتمشي برا، امشي بدري أو بالليل بعيد عن الشمس.` });
  }
  if (has('t1d') || has('insulin')) {
    train.push({ tone: 'bad', title: 'السكر', text: `${g('قيس', 'قيسي')} السكر قبل التمرين. لو أقل من ١٠٠ ${g('كل', 'كلي')} ١٥-٢٠ جرام كارب الأول، وخلي ${g('معاك', 'معاكي')} حاجة مسكرة. تمارين المقاومة قبل الكارديو بتقلل الهبوط.` });
    food.push({ tone: 'warn', title: 'السكر', text: `خلي كمية الكارب في كل وجبة ثابتة على قد ما ${g('تقدر', 'تقدري')} عشان جرعات الإنسولين.` });
  }
  if (has('celiac')) {
    mod.glutenFree = true;
    food.push({ tone: 'bad', title: 'سيلياك', text: 'هنعلّم على الأكلات اللي فيها قمح أو جلوتين في قائمة الأكل.' });
  }
  if (has('ms')) {
    mod.shortSessions = true; mod.rpe = '٦ من ١٠';
    train.push({ tone: 'warn', title: 'MS', text: `التمرين أقصر ومكان التمرين يكون بارد. ${g('اشرب', 'اشربي')} مياه ساقعة و${g('خد', 'خدي')} راحة أطول، و${g('وقف', 'وقفي')} لو ${g('حسيت', 'حسيتي')} بحرارة زيادة.` });
  }
  if (has('ibd')) {
    food.push({ tone: 'info', title: 'القولون', text: `وجبات صغيرة ومياه كتير. في أيام النشاط ${g('قلل', 'قللي')} الألياف الخشنة والمقليات.` });
  }
  if (has('mtx')) {
    food.push({ tone: 'warn', title: 'ميثوتركسات', text: 'ممنوع الكحول، وحمض الفوليك حسب كلام دكتورك.' });
    train.push({ tone: 'info', title: 'ميثوتركسات', text: `لو ${g('بتتعب', 'بتتعبي')} يوم الجرعة أو اليوم اللي بعده، خليه يوم راحة أو يوم تعافي.` });
  }
  if (has('bio')) {
    train.push({ tone: 'warn', title: 'المناعة', text: `${g('امسح', 'امسحي')} الأجهزة قبل ما ${g('تستخدمها', 'تستخدميها')} في الجيم، و${g('متتمرنش', 'متتمرنيش')} لو عندك سخونية أو دور برد.` });
  }
  if (has('hcq')) {
    train.push({ tone: 'info', title: 'بلاكونيل', text: `لو ${g('بتتمرن', 'بتتمرني')} برا ${g('استخدم', 'استخدمي')} صن بلوك لأن الدوا بيزود الحساسية للشمس.` });
  }
  if (has('beta')) {
    train.push({ tone: 'warn', title: 'حاصرات بيتا', text: `النبض هيبقى أقل من الطبيعي، ${g('فاستخدم', 'فاستخدمي')} إحساسك بالمجهود مش ساعة النبض: لازم ${g('تقدر تتكلم', 'تقدري تتكلمي')} وانت ${g('بتتمرن', 'بتتمرني')}.` });
  }
  if (has('anticoag')) {
    mod.machines = true; mod.lowImpact = true;
    train.push({ tone: 'bad', title: 'مسيّل الدم', text: 'بلاش أي تمرين فيه احتمال وقوع أو خبط. الماكينات أأمن من الأوزان الحرة.' });
  }
  if (p.pains.length) {
    const names = p.pains.map((id) => PAINS.find((x) => x.id === id)?.n).join(' و');
    train.push({ tone: 'warn', title: 'الألم', text: `بدلنا التمارين اللي بتضغط على ${names} بتمارين ألطف. لو ${g('حسيت', 'حسيتي')} بألم حاد ${g('وقف', 'وقفي')} فورًا.` });
  }
  const other = [p.otherCond, p.otherMeds].filter(Boolean).join('، ');
  if (other) {
    train.push({ tone: 'info', title: 'حالات تانية', text: `سجلنا اللي ${g('كتبته', 'كتبتيه')} (${other}). ${g('اعرض', 'اعرضي')} الخطة على دكتورك قبل ما ${g('تبدأ', 'تبدأي')}.` });
  }
  return { food, train, mod };
}

export type Targets = { kcal: number; protein: number; fat: number; carbs: number; waterCups: number; tdee: number };

const ACTIVITY_FACTOR: Record<Activity, number> = { low: 1.2, mid: 1.3, high: 1.45 };
const TRAINING_FACTOR: Record<ScheduleId, number> = { '3': 0.1, '5mix': 0.17, '5gym': 0.2 };

/** Mifflin-St Jeor BMR × activity, adjusted for the goal and medical caps. */
export function targets(p: Profile): Targets {
  const { mod } = medical(p);
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161);
  const tdee = bmr * (ACTIVITY_FACTOR[p.activity] + TRAINING_FACTOR[p.schedule]);
  let kcal = tdee;
  if (p.goal === 'lose') kcal = tdee * (1 - mod.deficit);
  if (p.goal === 'gain') kcal = tdee * 1.1;
  kcal = Math.round(Math.max(kcal, p.sex === 'm' ? 1500 : 1200) / 10) * 10;
  let ppk = p.goal === 'maintain' ? 1.6 : 1.8;
  if (mod.proteinPerKg) ppk = Math.max(ppk, mod.proteinPerKg);
  const protein = Math.round(p.weight * ppk);
  const fat = Math.round((kcal * 0.27) / 9);
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { kcal, protein, fat, carbs, waterCups: Math.ceil((p.weight * 35) / 250), tdee: Math.round(tdee) };
}

export type PlannedExercise = { id: string; ex: Exercise; why: string | null; rx: string };
export type DaySession = { id: string; n: string; place: Place; flare: boolean; rpe: string; items: PlannedExercise[] };

function prescription(p: Profile, e: Exercise, m: Modifiers): string {
  const beginner = p.level === 'beg';
  if (e.k === 'cardio') return m.shortSessions ? '١٠ دقايق، مجهود متوسط' : p.goal === 'lose' ? '٢٠ دقيقة، مجهود متوسط' : '١٥ دقيقة، مجهود متوسط';
  if (e.k === 'mob') return '١٠ دقايق براحة';
  if (e.k === 'core') return `${beginner ? '٢' : '٣'} × ٣٠ ثانية`;
  const sets = beginner ? '٣' : p.goal === 'gain' ? '٤' : '٣';
  const reps = p.goal === 'gain' ? '٨-١٠' : p.goal === 'lose' ? '١٢-١٥' : '١٠-١٢';
  const rest = p.goal === 'gain' ? '٩٠ ثانية' : '٦٠ ثانية';
  return `${sets} × ${reps} عدة · راحة ${rest}`;
}

/** Follows the exercise's gentler alternatives until one fits the person, or drops it. */
export function resolveExercise(id: string, p: Profile, m: Modifiers): { id: string; ex: Exercise; why: string | null } | null {
  let cur = id;
  let firstWhy: string | null = null;
  for (let i = 0; i < 6; i++) {
    const ex = EXERCISES[cur];
    if (!ex) return null;
    let why: string | null = null;
    const pain = PAINS.find((x) => p.pains.includes(x.id) && ex.stress.includes(x.id));
    if (m.lowImpact && ex.impact === 'high') why = 'بدل تمرين فيه قفز';
    else if (pain) why = 'عشان ' + pain.n;
    else if (m.machines && ex.free) why = 'الماكينة أأمن';
    if (!why) return { id: cur, ex, why: firstWhy };
    firstWhy ??= why;
    if (!ex.alt) return null;
    cur = ex.alt;
  }
  return null;
}

/** The session for a Saturday-first day index, or null on rest days. */
export function sessionFor(p: Profile, dayIndex: number, flare: boolean): DaySession | null {
  const sid = SCHEDULES[p.schedule]?.map[dayIndex];
  if (!sid) return null;
  const m = medical(p).mod;
  const s = flare ? SESSIONS.gentle : SESSIONS[sid];
  const seen = new Set<string>();
  let list: { id: string; ex: Exercise; why: string | null }[] = [];
  for (const id of s.ex) {
    const r = resolveExercise(id, p, m);
    if (r && !seen.has(r.id)) { seen.add(r.id); list.push(r); }
  }
  if (m.shortSessions && !flare && list.length > 5) list = list.slice(0, 5);
  if (!flare && s.pl === 'gym' && !list.some((x) => x.ex.k === 'cardio') && (p.goal === 'lose' || p.schedule === '3')) {
    const c = m.lowImpact ? 'g_bike' : 'g_incline';
    list.push({ id: c, ex: EXERCISES[c], why: null });
  }
  return {
    id: flare ? 'gentle' : sid, n: s.n, place: s.pl, flare,
    rpe: flare ? '٤-٥ من ١٠' : m.rpe,
    items: list.map((x) => ({ ...x, rx: prescription(p, x.ex, m) })),
  };
}
