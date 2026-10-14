// Which phone reminders to schedule and what they say. Pure logic, no native modules, so it can be unit-tested;
// the scheduling itself lives in ./notify.ts.
import { dayKey, totals, weekIndex, type DayLog } from './day.ts';
import type { Lang } from './i18n.ts';
import { dosesOn, easyDay, labName, labsFor, nextLab } from './health.ts';
import { genderFor, sessionFor, splitLabel, targets, type Profile } from './plan.ts';
import { programWeek } from './progress.ts';

export type ReminderKind = 'breakfast' | 'lunch' | 'water' | 'workout' | 'dinner' | 'nothing' | 'med' | 'lab' | 'week';
/** Reminders at fixed times of day (medicine and lab reminders follow the person's own times; the week one comes on
 * the last day of the week). */
export type TimedKind = Exclude<ReminderKind, 'med' | 'lab' | 'week'>;
export type Reminder = { id: string; kind: ReminderKind; date: Date; title: string; body: string };

/** Local time of each reminder; water comes twice a day. */
export const REMINDER_TIMES: { kind: TimedKind; slot: number; h: number; m: number }[] = [
  { kind: 'breakfast', slot: 0, h: 11, m: 0 },
  { kind: 'water', slot: 0, h: 13, m: 30 },
  { kind: 'lunch', slot: 0, h: 16, m: 0 },
  { kind: 'water', slot: 1, h: 18, m: 30 },
  { kind: 'workout', slot: 0, h: 19, m: 30 },
  { kind: 'dinner', slot: 0, h: 21, m: 0 },
  { kind: 'nothing', slot: 0, h: 21, m: 45 },
];

/** Prefix of every reminder id, so only this app's reminders are cancelled. */
export const REMINDER_PREFIX = 'yw-rem-';

/** Each kind has a few titles so the banner doesn't read the same every day; they rotate with the body. */
const TITLES: Record<ReminderKind, [string, string][]> = {
  breakfast: [['الفطار', 'Breakfast'], ['صباح الخير', 'Good morning'], ['وقت الفطار', 'Breakfast time']],
  lunch: [['الغدا', 'Lunch'], ['وقت الغدا', 'Lunch time']],
  water: [['المية', 'Water'], ['كوباية مية', 'A glass of water']],
  workout: [['التمرين', 'Workout'], ['تمرين النهارده', "Today's workout"]],
  dinner: [['العشا', 'Dinner'], ['آخر وجبة', 'Last meal']],
  nothing: [['يوم النهارده', 'Today'], ['قبل نص الليل', 'Before midnight']],
  med: [['ميعاد الدوا', 'Medicine time']],
  lab: [['ميعاد تحليل', 'Lab test due'], ['صحتي', 'My health']],
  week: [['آخر الأسبوع', 'End of the week'], ['ستوري الأسبوع', 'Week story']],
};

/** What a reminder can say about this person's day: water left, calories left, today's workout. */
export type ReminderInfo = { cups?: number; cupsLeft?: number; kcal?: number; kcalLeft?: number; workout?: string; moves?: number; easy?: boolean };

const n = (x: number, lang: Lang) => x.toLocaleString(lang === 'en' ? 'en-US' : 'ar-EG');
/** Egyptian counting: كوباية, كوبايتين, 3-10 كوبايات, 11 and up كوباية. */
function count(x: number, [one, two, few, many]: [string, string, string, string]): string {
  if (x === 1) return one;
  if (x === 2) return two;
  return `${n(x, 'ar')} ${x <= 10 ? few : many}`;
}
const CUPS: [string, string, string, string] = ['كوباية', 'كوبايتين', 'كوبايات', 'كوباية'];
const MOVES: [string, string, string, string] = ['تمرين واحد', 'تمرينين', 'تمارين', 'تمرين'];
const home = (w?: string) => w === 'homeA' || w === 'homeB';
/** A line that needs a piece of the day's info is only used when that info is known. */
type Line = string | false | undefined;

const AR: Record<TimedKind, (g: (m: string, f: string) => string, i: ReminderInfo) => Line[]> = {
  breakfast: (g, i) => [
    `${g('فطرت', 'فطرتي')}؟ ${g('علم', 'علمي')} على الفطار عشان يتحسب`,
    i.kcal != null && `قدامك ${n(i.kcal, 'ar')} سعرة النهارده، والفطار أول جزء منهم`,
    `لو مفيش وقت، زبادي وفاكهة يكفوا لحد الغدا`,
    `${g('صحيت', 'صحيتي')}؟ الفطار ${g('مستنيك', 'مستنيكي')}`,
    `الفطار لسه مش متعلم عليه. ${g('فطرت', 'فطرتي')} ولا لسه؟`,
    `صباح الخير. ${g('فطرت', 'فطرتي')} على إيه النهارده؟`,
    `${g('لسه مفطرتش', 'لسه مفطرتيش')}؟ حتى حاجة خفيفة أحسن من ولا حاجة`,
  ],
  lunch: (g, i) => [
    `${g('اتغديت', 'اتغديتي')}؟ ${g('علم', 'علمي')} على الغدا`,
    i.kcalLeft != null && i.kcalLeft > 300 && `فاضلك ${n(i.kcalLeft, 'ar')} سعرة، يعني غدا مريح من غير قلق`,
    i.kcalLeft != null && i.kcalLeft > 0 && i.kcalLeft <= 300 && `فاضلك ${n(i.kcalLeft, 'ar')} سعرة بس، فخلي الغدا خفيف وفيه بروتين`,
    'نص اليوم عدى. الغدا اتسجل ولا لسه؟',
    `مش ${g('عارف', 'عارفة')} ${g('تتغدى', 'تتغدي')} إيه؟ صفحة الأكل فيها وصفات على قد سعراتك`,
    `${g('أكلت', 'أكلتي')} إيه على الغدا؟ ${g('سجله', 'سجليه')} قبل ما يتنسى`,
    `البروتين في الغدا ${g('بيخليك شبعان', 'بيخليكي شبعانة')} لحد بالليل`,
    `${g('اتغديت', 'اتغديتي')} برا البيت؟ ${g('دور', 'دوري')} على الأكلة في صفحة الأكل وهتلاقي سعراتها`,
  ],
  water: (g, i) => [
    i.cupsLeft != null && i.cupsLeft > 1 && `فاضلك ${count(i.cupsLeft, CUPS)} مية النهارده`,
    i.cupsLeft === 1 && `كوباية واحدة ${g('وتقفل', 'وتقفلي')} هدف المية النهارده`,
    `كوباية مية دلوقتي، و${g('علم', 'علمي')} عليها`,
    `ساعات الجوع بيبقى عطش. ${g('اشرب', 'اشربي')} كوباية الأول و${g('شوف', 'شوفي')}`,
    i.cupsLeft == null && i.cups != null && `هدفك النهارده ${count(i.cups, CUPS)} مية`,
    `${g('شربت', 'شربتي')} مية من آخر مرة؟`,
    `${g('حط', 'حطي')} كوباية مية جنبك، هتخلص من غير ما ${g('تاخد', 'تاخدي')} بالك`,
    'المية لسه ناقصة النهارده',
  ],
  workout: (g, i) => [
    i.easy ? 'النهارده يوم خفيف: تمرين تعافي قصير'
      : i.moves ? (home(i.workout) ? `تمرين النهارده في البيت، ${count(i.moves, MOVES)}` : `تمرين النهارده ${i.workout}، ${count(i.moves, MOVES)}`) : false,
    `${g('هتتمرن', 'هتتمرني')} إمتى النهارده؟`,
    `${g('لسه متمرنتش', 'لسه متمرنتيش')}؟ لسه فيه وقت`,
    `حتى ٢٠ دقيقة أحسن من ولا حاجة. ${g('ابدأ', 'ابدأي')} بأول تمرين وبس`,
    !i.easy && `أوزان المرة اللي فاتت متسجلة. النهارده ${g('جرب تزود', 'جربي تزودي')} عدة واحدة`,
    `${g('تعبان', 'تعبانة')} النهارده؟ يوم التعافي موجود في صفحة التمرين`,
    `لو ${g('خلصت', 'خلصتي')} ${g('علم', 'علمي')} على التمارين اللي ${g('عملتها', 'عملتيها')}`,
  ],
  dinner: (g, i) => [
    i.kcalLeft != null && (i.kcalLeft >= 250 ? `فاضلك ${n(i.kcalLeft, 'ar')} سعرة للعشا` : 'السعرات قربت تخلص، فخلي العشا خفيف'),
    `${g('اتعشيت', 'اتعشيتي')}؟ ${g('علم', 'علمي')} على العشا`,
    'العشا لسه مش متسجل',
    'العشا قبل النوم بساعتين بيخلي النوم أريح',
    `${g('جعان', 'جعانة')} بالليل؟ زبادي أو فاكهة أخف من أي سناك`,
    `آخر وجبة في اليوم. ${g('علم', 'علمي')} عليها لما ${g('تخلص', 'تخلصي')}`,
    `${g('اتعشيت', 'اتعشيتي')} إيه؟ ${g('سجله', 'سجليه')} عشان يومك يتقفل صح`,
  ],
  nothing: (g) => [
    'مفيش أكل متسجل النهارده',
    `اليوم بيتقفل الساعة ١٢. ${g('سجل', 'سجلي')} قبلها عشان النقط متضيعش`,
    `${g('نسيت تسجل', 'نسيتي تسجلي')} النهارده؟ لسه فيه وقت`,
    `حتى لو اليوم مكانش مظبوط ${g('سجله', 'سجليه')}، الأرقام الحقيقية بتفيد أكتر`,
    `يومك لسه فاضي في التطبيق. دقيقة واحدة ${g('وتخلص', 'وتخلصي')}`,
    `${g('أكلت', 'أكلتي')} إيه النهارده؟ ولو حاجة واحدة ${g('سجلها', 'سجليها')}`,
  ],
};

const EN: Record<TimedKind, (i: ReminderInfo) => Line[]> = {
  breakfast: (i) => [
    'Had breakfast? Tick it so it counts',
    i.kcal != null && `${n(i.kcal, 'en')} kcal for today, and breakfast is the first part`,
    'No time? Yoghurt and fruit will carry you to lunch',
    'Up already? Breakfast is waiting',
    "Breakfast isn't ticked yet. Eaten, or not yet?",
    'Morning. What was breakfast today?',
    'No breakfast yet? Something small beats nothing',
  ],
  lunch: (i) => [
    'Had lunch? Tick it off',
    i.kcalLeft != null && i.kcalLeft > 300 && `${n(i.kcalLeft, 'en')} kcal left, so lunch can be a proper meal`,
    i.kcalLeft != null && i.kcalLeft > 0 && i.kcalLeft <= 300 && `Only ${n(i.kcalLeft, 'en')} kcal left, so keep lunch light with some protein`,
    'Half the day is gone. Is lunch logged?',
    'Not sure what to have? The Food tab has recipes that fit your calories',
    'What did you have for lunch? Log it before it slips your mind',
    'Protein at lunch keeps you full until the evening',
    'Eating out? Search the dish in Food to see its calories',
  ],
  water: (i) => [
    i.cupsLeft != null && i.cupsLeft > 1 && `${i.cupsLeft} cups of water left today`,
    i.cupsLeft === 1 && "One more cup and today's water is done",
    'A glass of water now, then tick it',
    'Sometimes hunger is really thirst. Have a glass first and see',
    i.cupsLeft == null && i.cups != null && `Your water target today is ${i.cups} cups`,
    'Had any water since last time?',
    "Keep a glass next to you. It'll be gone before you notice",
    'Still short on water today',
  ],
  workout: (i) => [
    i.easy ? 'Easy day today: a short recovery session'
      : i.moves ? (home(i.workout) ? `Today's workout is at home: ${i.moves} exercises` : `Today's workout: ${i.workout}, ${i.moves} exercises`) : false,
    'When are you training today?',
    "Haven't trained yet? There's still time",
    'Twenty minutes beats nothing. Start with the first exercise',
    !i.easy && 'Last time is in your logbook. Try one more rep today',
    'Tired today? Switch to the recovery day in Train',
    'Done? Tick the exercises you did',
  ],
  dinner: (i) => [
    i.kcalLeft != null && (i.kcalLeft >= 250 ? `${n(i.kcalLeft, 'en')} kcal left for dinner` : 'Calories are nearly used up, so keep dinner light'),
    'Had dinner? Tick it off',
    "Dinner isn't logged yet",
    'Dinner two hours before bed makes for easier sleep',
    'Hungry late? Yoghurt or fruit is lighter than most snacks',
    "Last meal of the day. Tick it when you're done",
    'What was dinner? Log it so today closes right',
  ],
  nothing: () => [
    'No food logged today',
    "Today locks at midnight. Log before then so you keep the points",
    "Forgot to log today? There's still time",
    "Even if today wasn't on plan, log it. Real numbers help more",
    'Your day is still empty in the app. It takes a minute',
    'What did you eat today? Even one thing, log it',
  ],
};

const DAY = 86400000;
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const dayNumber = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };

/** Picks the day's line and title: fixed for a date and kind, and stepping one place a day so consecutive days differ
 * and a list goes round fully before repeating. */
function pick<T>(list: T[], date: string, key: string, slot = 0): T {
  return list[(dayNumber(date) * (slot ? 2 : 1) + hash(key) + slot) % list.length];
}
const title = (kind: ReminderKind, date: string, lang: Lang) => pick(TITLES[kind], date, kind)[lang === 'en' ? 1 : 0];

/** The reminder text for a day: fixed for a given date and kind, and never the same as the day before. Lines that
 * mention the day's numbers (water or calories left, today's workout) are used when `info` has them. */
export function reminderText(kind: TimedKind, date: string, lang: Lang, sex: Profile['sex'] | undefined, slot = 0, info: ReminderInfo = {}): { title: string; body: string } {
  const lines = (lang === 'en' ? EN[kind](info) : AR[kind](genderFor(sex), info)).filter((x): x is string => !!x);
  return { title: title(kind, date, lang), body: pick(lines, date, kind + slot, slot) };
}

/** A lab test coming up in 3 days, due today, or already late. */
export function labText(name: string, when: 'soon' | 'due' | 'late', date: string, lang: Lang, sex: Profile['sex'] | undefined): { title: string; body: string } {
  const g = genderFor(sex);
  const body = lang === 'en'
    ? { soon: `${name} is due in 3 days. A good time to book the lab`, due: `${name} is due today. When the result is out, add it in My health with a photo of the paper`, late: `${name} is past its date. Do it when you can and add the result in My health` }[when]
    : { soon: `فاضل 3 أيام على تحليل ${name}. ${g('رتب', 'رتبي')} ميعاد المعمل من دلوقتي`, due: `النهارده ميعاد تحليل ${name}. لما النتيجة تطلع ${g('اكتبها', 'اكتبيها')} و${g('صور', 'صوري')} الورقة في صحتي`, late: `تحليل ${name} عدى ميعاده. ${g('اعمله', 'اعمليه')} لما ${g('تقدر', 'تقدري')} و${g('سجل', 'سجلي')} النتيجة في صحتي` }[when];
  return { title: title('lab', date, lang), body };
}

/** The last evening of the week: the week report and story picture are ready. */
export function weekText(date: string, lang: Lang, sex: Profile['sex'] | undefined): { title: string; body: string } {
  const g = genderFor(sex);
  const lines = lang === 'en'
    ? ['The week is nearly over. Your week story picture is ready on Home', 'Last day of the week. Have a look at the weekly report and see what moved', 'Your week in one picture is ready, if you feel like sharing it']
    : [`الأسبوع قرب يخلص. ستوري الأسبوع جاهزة في الرئيسية`, `آخر يوم في الأسبوع. ${g('بص', 'بصي')} على تقرير الأسبوع ${g('وشوف', 'وشوفي')} إيه اتحسن`, `أسبوعك في صورة واحدة جاهز، لو ${g('حابب تشاركه', 'حابة تشاركيه')}`];
  return { title: title('week', date, lang), body: pick(lines, date, 'week') };
}

export type PlanInput = {
  profile: Profile;
  /** Today's log; used to skip reminders whose job is already done today. */
  day: DayLog;
  now: Date;
  lang: Lang;
  /** How many days to plan, today included (default 7). */
  days?: number;
};

/** Reminders for today (only those still ahead and not yet done) and the following days. */
export function planReminders({ profile, day, now, lang, days = 7 }: PlanInput): Reminder[] {
  const out: Reminder[] = [];
  const T = targets(profile);
  const cups = T.waterCups;
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = dayKey(d);
    const isToday = i === 0;
    const ses = sessionFor(profile, weekIndex(d), easyDay(profile, isToday ? day : null, d).easy, programWeek(profile.start, d));
    const info: ReminderInfo = {
      cups,
      kcal: Math.round(T.kcal),
      cupsLeft: isToday ? Math.max(0, cups - day.water) : undefined,
      kcalLeft: isToday ? Math.round(T.kcal - totals(day).kcal) : undefined,
      workout: ses ? (home(ses.id) ? ses.id : splitLabel(ses.id)) : undefined,
      moves: ses?.items.length,
      easy: ses?.flare,
    };
    for (const t of REMINDER_TIMES) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.h, t.m);
      if (at.getTime() <= now.getTime() + 5000) continue;
      if (t.kind === 'workout' && !ses) continue;
      if (isToday && doneToday(t.kind, day, cups, ses?.items.map((x) => x.id) ?? [])) continue;
      out.push({ id: `${REMINDER_PREFIX}${key}-${t.kind}-${t.slot}`, kind: t.kind, date: at, ...reminderText(t.kind, key, lang, profile.sex, t.slot, info) });
    }
    // Each medicine dose at its own time, unless already ticked today.
    for (const x of dosesOn(profile, d)) {
      const [h, m] = x.time.split(':').map(Number);
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
      if (at.getTime() <= now.getTime() + 5000) continue;
      if (isToday && day.medsTaken?.includes(x.key)) continue;
      // Arabic digits read badly after " · " (٠ looks like a dot), so the dose parts are joined with a comma here.
      const body = [x.dose.replace(/ · /g, lang === 'en' ? ', ' : '، '), x.how].filter(Boolean).join('. ') || (lang === 'en' ? "It's time" : 'جه ميعاده');
      out.push({ id: `${REMINDER_PREFIX}${key}-med-${x.key}`, kind: 'med', date: at, title: x.name, body });
    }
    // A lab test 3 days ahead and on its date (or already late, on today), at 10 in the morning.
    for (const k of labsFor(profile)) {
      const due = nextLab(profile, k);
      if (!due) continue;
      const soon = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 3);
      const when = due === key ? 'due' : isToday && due < key ? 'late' : due === dayKey(soon) ? 'soon' : null;
      if (!when) continue;
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0);
      if (at.getTime() <= now.getTime() + 5000) continue;
      out.push({ id: `${REMINDER_PREFIX}${key}-lab-${k}`, kind: 'lab', date: at, ...labText(labName(k), when, key, lang, profile.sex) });
    }
    // The week report and story picture, on the last evening of the week.
    if (weekIndex(d) === 6) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 20, 30);
      if (at.getTime() > now.getTime() + 5000) out.push({ id: `${REMINDER_PREFIX}${key}-week`, kind: 'week', date: at, ...weekText(key, lang, profile.sex) });
    }
  }
  return out;
}

function doneToday(kind: TimedKind, day: DayLog, cups: number, sessionIds: string[]): boolean {
  const meals = day.meals ?? [];
  switch (kind) {
    case 'breakfast': case 'lunch': case 'dinner': return meals.includes(kind);
    case 'water': return day.water >= cups;
    case 'workout': {
      const done = sessionIds.filter((id) => day.done.includes(id)).length;
      return sessionIds.length > 0 && done * 2 >= sessionIds.length;
    }
    case 'nothing': return day.foods.length > 0 || meals.length > 0;
  }
}
