// Which phone reminders to schedule and what they say. Pure logic, no native modules, so it can be unit-tested;
// the scheduling itself lives in ./notify.ts.
import { dayKey, totals, weekIndex, type DayLog } from './day.ts';
import type { Lang } from './i18n.ts';
import { dosesOn, easyDay, labName, labsFor, nextLab } from './health.ts';
import { genderFor, sessionFor, splitLabel, targets, type Profile } from './plan.ts';
import { programWeek } from './progress.ts';

export type ReminderKind = 'breakfast' | 'lunch' | 'water' | 'workout' | 'dinner' | 'nothing' | 'med' | 'lab';
/** Reminders at fixed times of day (medicine and lab reminders follow the person's own times). */
export type TimedKind = Exclude<ReminderKind, 'med' | 'lab'>;
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

const TITLES: Record<ReminderKind, [string, string]> = {
  breakfast: ['الفطار', 'Breakfast'],
  lunch: ['الغدا', 'Lunch'],
  water: ['المية', 'Water'],
  workout: ['التمرين', 'Workout'],
  dinner: ['العشا', 'Dinner'],
  nothing: ['يوم النهارده', 'Today'],
  med: ['ميعاد الدوا', 'Medicine time'],
  lab: ['ميعاد تحليل', 'Lab test due'],
};

/** What a reminder can say about this person's day: water left, calories left, today's workout. */
export type ReminderInfo = { cups?: number; cupsLeft?: number; kcalLeft?: number; workout?: string; moves?: number; easy?: boolean };

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
  breakfast: (g) => [
    `${g('فطرت', 'فطرتي')}؟ ${g('علم', 'علمي')} على الفطار عشان يتحسب`,
    `${g('لسه مفطرتش', 'لسه مفطرتيش')}؟ حتى حاجة خفيفة`,
    `صباح الخير. ${g('فطرت', 'فطرتي')} على إيه النهارده؟`,
    `لو ${g('فطرت', 'فطرتي')} ${g('علم', 'علمي')} عليه، ولو لسه ${g('كل', 'كلي')} حاجة خفيفة`,
    'الفطار لسه مش متعلم عليه',
  ],
  lunch: (g, i) => [
    `${g('اتغديت', 'اتغديتي')}؟ ${g('علم', 'علمي')} على الغدا`,
    'الغدا لسه مش متسجل',
    i.kcalLeft != null && i.kcalLeft > 300 && `فاضلك ${n(i.kcalLeft, 'ar')} سعرة النهارده، والغدا لسه`,
    `${g('أكلت', 'أكلتي')} إيه على الغدا؟ ${g('سجله', 'سجليه')} قبل ما ${g('تنسى', 'تنسي')}`,
    `مش ${g('عارف', 'عارفة')} ${g('تتغدى', 'تتغدي')} إيه؟ في صفحة الأكل اقتراحات على قد سعراتك`,
  ],
  water: (g, i) => [
    i.cupsLeft != null && i.cupsLeft > 0 && `فاضلك ${count(i.cupsLeft, CUPS)} مية النهارده`,
    `كوباية مية دلوقتي، و${g('علم', 'علمي')} عليها`,
    i.cupsLeft == null && i.cups != null && `هدفك النهارده ${count(i.cups, CUPS)} مية`,
    `${g('شربت', 'شربتي')} مية من الصبح؟`,
    `${g('اشرب', 'اشربي')} كوباية مية قبل الأكل الجاي`,
    'المية لسه ناقصة النهارده',
  ],
  workout: (g, i) => [
    i.easy ? 'النهارده يوم خفيف: تمرين تعافي قصير'
      : i.moves ? (home(i.workout) ? `تمرين النهارده في البيت، ${count(i.moves, MOVES)}` : `تمرين النهارده ${i.workout}، ${count(i.moves, MOVES)}`) : false,
    `${g('هتتمرن', 'هتتمرني')} إمتى النهارده؟`,
    `${g('لسه متمرنتش', 'لسه متمرنتيش')}؟ لسه فيه وقت`,
    `لو ${g('خلصت', 'خلصتي')} ${g('علم', 'علمي')} على التمارين اللي ${g('عملتها', 'عملتيها')}`,
    `${g('تعبان', 'تعبانة')} النهارده؟ يوم التعافي موجود في صفحة التمرين`,
  ],
  dinner: (g, i) => [
    i.kcalLeft != null && (i.kcalLeft >= 250 ? `فاضلك ${n(i.kcalLeft, 'ar')} سعرة للعشا` : 'السعرات قربت تخلص، فخلي العشا خفيف'),
    `${g('اتعشيت', 'اتعشيتي')}؟ ${g('علم', 'علمي')} على العشا`,
    'العشا لسه مش متسجل',
    `${g('اتعشيت', 'اتعشيتي')} إيه؟ ${g('سجله', 'سجليه')} عشان يومك يتقفل صح`,
    `آخر وجبة في اليوم. ${g('علم', 'علمي')} عليها لما ${g('تخلص', 'تخلصي')}`,
  ],
  nothing: (g) => [
    'مفيش أكل متسجل النهارده',
    `${g('نسيت تسجل', 'نسيتي تسجلي')} النهارده؟ لسه فيه وقت قبل نص الليل`,
    `اليوم بيتقفل الساعة ١٢. ${g('سجل', 'سجلي')} أكل النهارده قبلها`,
    `${g('أكلت', 'أكلتي')} إيه النهارده؟ ولو حاجة واحدة ${g('سجلها', 'سجليها')}`,
    'يومك لسه فاضي في التطبيق',
  ],
};

const EN: Record<TimedKind, (i: ReminderInfo) => Line[]> = {
  breakfast: () => [
    'Had breakfast? Tick it so it counts',
    'No breakfast yet? Something light is fine',
    'Morning. What was breakfast today?',
    "If you've eaten, tick breakfast. If not, have something light",
    "Breakfast isn't ticked yet",
  ],
  lunch: (i) => [
    'Had lunch? Tick it off',
    "Lunch isn't logged yet",
    i.kcalLeft != null && i.kcalLeft > 300 && `${n(i.kcalLeft, 'en')} kcal left today, and lunch is still to come`,
    'What did you have for lunch? Log it before you forget',
    'Not sure what to have? The Food tab has ideas that fit your calories',
  ],
  water: (i) => [
    i.cupsLeft != null && i.cupsLeft > 0 && `${i.cupsLeft === 1 ? 'One cup' : `${i.cupsLeft} cups`} of water left today`,
    'A glass of water now, then tick it',
    i.cupsLeft == null && i.cups != null && `Your water target today is ${i.cups} cups`,
    'Had any water since this morning?',
    'Have a glass of water before your next meal',
    'Still short on water today',
  ],
  workout: (i) => [
    i.easy ? 'Easy day today: a short recovery session'
      : i.moves ? (home(i.workout) ? `Today's workout is at home: ${i.moves} exercises` : `Today's workout: ${i.workout}, ${i.moves} exercises`) : false,
    'When are you training today?',
    "Haven't trained yet? There's still time",
    "Done? Tick the exercises you did",
    'Tired today? Switch to the recovery day in Train',
  ],
  dinner: (i) => [
    i.kcalLeft != null && (i.kcalLeft >= 250 ? `${n(i.kcalLeft, 'en')} kcal left for dinner` : 'Calories are nearly used up, so keep dinner light'),
    'Had dinner? Tick it off',
    "Dinner isn't logged yet",
    'What was dinner? Log it so today closes right',
    "Last meal of the day. Tick it when you're done",
  ],
  nothing: () => [
    'No food logged today',
    "Forgot to log today? There's time before midnight",
    'Today locks at midnight. Log your food before then',
    'What did you eat today? Even one thing, log it',
    'Your day is still empty in the app',
  ],
};

const DAY = 86400000;
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const dayNumber = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };

/** The reminder text for a day: fixed for a given date and kind, and never the same as the day before. Lines that
 * mention the day's numbers (water or calories left, today's workout) are used when `info` has them. */
export function reminderText(kind: TimedKind, date: string, lang: Lang, sex: Profile['sex'] | undefined, slot = 0, info: ReminderInfo = {}): { title: string; body: string } {
  const lines = (lang === 'en' ? EN[kind](info) : AR[kind](genderFor(sex), info)).filter((x): x is string => !!x);
  // Stepping 3 places a day keeps consecutive days different as long as a list never has exactly 1 or 3 lines.
  const i = (dayNumber(date) * 3 + hash(kind + slot) + slot * 2) % lines.length;
  return { title: TITLES[kind][lang === 'en' ? 1 : 0], body: lines[i] };
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
    // A lab test whose repeat date is this day (or already passed, on today), at 10 in the morning.
    for (const k of labsFor(profile)) {
      const due = nextLab(profile, k);
      if (!due || !(due === key || (isToday && due < key))) continue;
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0);
      if (at.getTime() <= now.getTime() + 5000) continue;
      const g = genderFor(profile.sex);
      out.push({ id: `${REMINDER_PREFIX}${key}-lab-${k}`, kind: 'lab', date: at, title: TITLES.lab[lang === 'en' ? 1 : 0],
        body: lang === 'en' ? `Your ${labName(k)} test is due. Add the result in My health when you get it` : `جه ميعاد تحليل ${labName(k)}. لما النتيجة تطلع ${g('سجلها', 'سجليها')} في صحتي` });
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
