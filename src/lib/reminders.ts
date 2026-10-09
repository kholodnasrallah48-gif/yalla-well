// Which phone reminders to schedule and what they say. Pure logic, no native modules, so it can be unit-tested;
// the scheduling itself lives in ./notify.ts.
import { dayKey, weekIndex, type DayLog } from './day.ts';
import type { Lang } from './i18n.ts';
import { dosesOn, easyDay, labName, labsFor, nextLab } from './health.ts';
import { genderFor, sessionFor, targets, type Gender, type Profile } from './plan.ts';
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
  water: ['المياه', 'Water'],
  workout: ['التمرين', 'Workout'],
  dinner: ['العشا', 'Dinner'],
  nothing: ['تسجيل اليوم', "Today's log"],
  med: ['ميعاد الدوا', 'Medicine time'],
  lab: ['ميعاد تحليل', 'Lab test due'],
};

const AR: Record<TimedKind, (g: Gender) => string[]> = {
  breakfast: (g) => [
    `${g('فطرت', 'فطرتي')} ولا لسه؟ ${g('متنساش تسجل', 'متنسيش تسجلي')} فطارك`,
    `صباح الفل! ${g('أكلت', 'أكلتي')} حاجة الصبح؟`,
    `الفطار أهم وجبة. ${g('علم', 'علمي')} عليه لما ${g('تخلص', 'تخلصي')}`,
    `يومك يبدأ بفطار حلو. ${g('فطرت', 'فطرتي')}؟`,
    `لو ${g('فطرت', 'فطرتي')} ${g('سجله', 'سجليه')} عشان الحسبة تظبط`,
    'بطنك بتسأل: فين الفطار؟',
    `${g('متنساش', 'متنسيش')} الفطار، حتى لو حاجة خفيفة`,
  ],
  lunch: (g) => [
    `${g('اتغديت', 'اتغديتي')} ولا لسه؟`,
    `ميعاد الغدا! ${g('سجل', 'سجلي')} اللي ${g('أكلته', 'أكلتيه')}`,
    `الغدا خلص؟ ${g('علم', 'علمي')} عليه في خطة اليوم`,
    `${g('متفوتش', 'متفوتيش')} الغدا، جسمك محتاج الطاقة`,
    `إيه الغدا النهارده؟ ${g('سجله', 'سجليه')} عشان نحسب صح`,
    `نص اليوم عدى… ${g('أكلت', 'أكلتي')} الغدا؟`,
    `لو ${g('اتغديت', 'اتغديتي')} ${g('متنساش تعلم', 'متنسيش تعلمي')} عليه`,
  ],
  water: (g) => [
    `${g('شربت', 'شربتي')} مياه كفاية النهارده؟`,
    'كوباية مياه دلوقتي؟ جسمك هيشكرك',
    `${g('متنساش', 'متنسيش')} المياه! ${g('سجل', 'سجلي')} الكوبايات`,
    `${g('اشرب', 'اشربي')} كوباية مياه و${g('علم', 'علمي')} عليها`,
    `المياه بتفرق في الطاقة والتركيز. ${g('اشرب', 'اشربي')} كوباية`,
    'فاضلك كام كوباية؟ يلا واحدة كمان',
    `العطش ساعات بيتلخبط مع الجوع… ${g('اشرب', 'اشربي')} مياه الأول`,
  ],
  workout: (g) => [
    `${g('خلصت', 'خلصتي')} تمرين النهارده؟`,
    'التمرين مستنيك! حتى ٢٠ دقيقة بتفرق',
    `يلا ${g('قوم اتمرن', 'قومي اتمرني')}، ${g('هتحس', 'هتحسي')} إنك أحسن بعدها`,
    `${g('علم', 'علمي')} على التمارين اللي ${g('خلصتها', 'خلصتيها')}`,
    `النهارده يوم تمرين. ${g('جاهز', 'جاهزة')}؟`,
    `خطوة صغيرة كل يوم… ${g('اتمرنت', 'اتمرنتي')} النهارده؟`,
    `${g('متكسلش', 'متكسليش')}! التمرين مش هياخد وقت`,
  ],
  dinner: (g) => [
    `${g('اتعشيت', 'اتعشيتي')}؟ ${g('سجل', 'سجلي')} العشا قبل ما ${g('تنسى', 'تنسي')}`,
    `العشا خلص ولا لسه؟ ${g('علم', 'علمي')} عليه`,
    `آخر وجبة في اليوم… ${g('سجلها', 'سجليها')}`,
    'خلي العشا خفيف وفيه بروتين',
    `لو ${g('اتعشيت', 'اتعشيتي')} ${g('سجل', 'سجلي')} عشان يومك يكمل`,
    `فاضل العشا بس! ${g('أكلته', 'أكلتيه')}؟`,
  ],
  nothing: (g) => [
    `${g('مسجلتش', 'مسجلتيش')} أي أكل النهارده. ${g('سجل', 'سجلي')} ولو حاجة بسيطة`,
    `يومك لسه فاضي في التطبيق… ${g('أكلت', 'أكلتي')} إيه النهارده؟`,
    `قبل ما اليوم يخلص، ${g('سجل', 'سجلي')} أكلك`,
    `${g('نسيت تسجل', 'نسيتي تسجلي')} النهارده؟ لسه في وقت`,
    `دقيقة واحدة ${g('سجل', 'سجلي')} فيها أكل النهارده`,
    `التسجيل كل يوم هو اللي بيفرق. ${g('سجل', 'سجلي')} يومك`,
    'مفيش أكل متسجل النهارده. كله تمام؟',
  ],
};

const EN: Record<TimedKind, string[]> = {
  breakfast: [
    "Had breakfast yet? Don't forget to log it",
    'Good morning! Eaten anything yet?',
    'Breakfast time. Tick it off when you are done',
    'A good day starts with breakfast. Had yours?',
    'If you had breakfast, log it so your numbers add up',
    'Your stomach is asking: where is breakfast?',
    "Don't skip breakfast, even something light counts",
  ],
  lunch: [
    'Had lunch yet?',
    'Lunch time! Log what you ate',
    "Lunch done? Tick it off in today's plan",
    "Don't skip lunch, your body needs the energy",
    "What's for lunch today? Log it so we count it right",
    'Half the day is gone. Had lunch?',
    "If you've had lunch, don't forget to tick it",
  ],
  water: [
    'Have you had enough water today?',
    'A glass of water right now? Your body will thank you',
    "Don't forget your water! Log your cups",
    'Drink a glass of water and tick it off',
    'Water helps your energy and focus. Have a glass',
    'How many cups left? One more, come on',
    'Thirst can feel like hunger. Try water first',
  ],
  workout: [
    "Finished today's workout?",
    'Your workout is waiting! Even 20 minutes helps',
    "Let's move. You'll feel better afterwards",
    "Tick off the exercises you've done",
    'Today is a training day. Ready?',
    'Small steps every day. Trained today?',
    "No excuses! It won't take long",
  ],
  dinner: [
    'Had dinner? Log it before you forget',
    'Dinner done yet? Tick it off',
    'Last meal of the day. Log it',
    'Keep dinner light, with some protein',
    'If you had dinner, log it to complete your day',
    'Only dinner left! Had it?',
  ],
  nothing: [
    "You haven't logged any food today. Even something small counts",
    'Your day is still empty in the app. What did you eat today?',
    'Before the day ends, log your food',
    "Forgot to log today? There's still time",
    "Take one minute to log today's food",
    'Logging every day is what makes the difference',
    'No food logged today. All good?',
  ],
};

const DAY = 86400000;
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
const dayNumber = (key: string) => { const [y, m, d] = key.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / DAY); };

/** The reminder text for a day: fixed for a given date and kind, and never the same as the day before. */
export function reminderText(kind: TimedKind, date: string, lang: Lang, sex: Profile['sex'] | undefined, slot = 0): { title: string; body: string } {
  const list = lang === 'en' ? EN[kind] : AR[kind](genderFor(sex));
  // Stepping 3 places a day (lists have 6–8 entries, none a multiple of 3) keeps consecutive days different.
  const i = (dayNumber(date) * 3 + hash(kind + slot) + slot * 2) % list.length;
  return { title: TITLES[kind][lang === 'en' ? 1 : 0], body: list[i] };
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
  const cups = targets(profile).waterCups;
  for (let i = 0; i < days; i++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const key = dayKey(d);
    const isToday = i === 0;
    const ses = sessionFor(profile, weekIndex(d), easyDay(profile, isToday ? day : null, d).easy, programWeek(profile.start, d));
    for (const t of REMINDER_TIMES) {
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), t.h, t.m);
      if (at.getTime() <= now.getTime() + 5000) continue;
      if (t.kind === 'workout' && !ses) continue;
      if (isToday && doneToday(t.kind, day, cups, ses?.items.map((x) => x.id) ?? [])) continue;
      out.push({ id: `${REMINDER_PREFIX}${key}-${t.kind}-${t.slot}`, kind: t.kind, date: at, ...reminderText(t.kind, key, lang, profile.sex, t.slot) });
    }
    // Each medicine dose at its own time, unless already ticked today.
    for (const x of dosesOn(profile, d)) {
      const [h, m] = x.time.split(':').map(Number);
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m);
      if (at.getTime() <= now.getTime() + 5000) continue;
      if (isToday && day.medsTaken?.includes(x.key)) continue;
      out.push({ id: `${REMINDER_PREFIX}${key}-med-${x.key}`, kind: 'med', date: at, title: TITLES.med[lang === 'en' ? 1 : 0], body: [x.dose ? `${x.name} (${x.dose})` : x.name, x.how].filter(Boolean).join(': ') });
    }
    // A lab test whose repeat date is this day (or already passed, on today), at 10 in the morning.
    for (const k of labsFor(profile)) {
      const due = nextLab(profile, k);
      if (!due || !(due === key || (isToday && due < key))) continue;
      const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 10, 0);
      if (at.getTime() <= now.getTime() + 5000) continue;
      const g = genderFor(profile.sex);
      out.push({ id: `${REMINDER_PREFIX}${key}-lab-${k}`, kind: 'lab', date: at, title: TITLES.lab[lang === 'en' ? 1 : 0],
        body: lang === 'en' ? `Time to repeat your ${labName(k)} test. Log the result in My health.` : `جه ميعاد تحليل ${labName(k)}. ${g('سجل', 'سجلي')} النتيجة في صحتي.` });
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
