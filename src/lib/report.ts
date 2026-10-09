// Weekly report: what went well and what didn't over one Saturday-to-Friday week, plus a printable HTML version.
import { dayKey, totals, weekIndex, type DayLog } from './day.ts';
import { FOODS, healthNotes, type Food } from './foods.ts';
import { L, isEn, num, tx } from './i18n.ts';
import { genderFor, sessionFor, targets, type Profile } from './plan.ts';
import { MEALS, MEAL_NAME } from './mealplan.ts';
import { programWeek } from './progress.ts';
import type { Meal } from './recipes-data.ts';

export type ReportDay = {
  key: string; date: Date; logged: boolean; future: boolean;
  kcal: number; p: number; c: number; f: number; water: number;
  /** null = rest day, otherwise how many of the planned exercises were ticked. */
  workout: { done: number; of: number; name: string } | null;
  redFoods: string[];
};
export type WeekReport = { days: ReportDay[]; wins: string[]; misses: string[]; from: Date; to: Date };

const ar = (n: number) => num(Math.round(n));
/** "يوم واحد", "يومين", "٣ أيام", "١١ يوم" (English: "0 days", "1 day", "3 days"). */
export const nDays = (n: number) => isEn()
  ? (n === 1 ? '1 day' : `${ar(n)} days`)
  : (n === 0 ? 'ولا يوم' : n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : n <= 10 ? `${ar(n)} أيام` : `${ar(n)} يوم`);
const DAY_NAMES = ['السبت', 'الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة'];
const DAY_NAMES_EN = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
export const dayName = (d: Date) => L(DAY_NAMES[weekIndex(d)], DAY_NAMES_EN[weekIndex(d)]);
export const shortDate = (d: Date) => L(`${ar(d.getDate())}/${ar(d.getMonth() + 1)}`, d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));

/** Saturday of the week `offset` weeks before the one containing `today`. */
export function weekStart(today: Date, offset = 0): Date {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() - weekIndex(d) - 7 * offset);
  return d;
}
export const weekKeys = (start: Date) => Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });

export function weekReport(p: Profile, start: Date, logs: Record<string, DayLog | null>, today: Date, pool: Food[] = FOODS): WeekReport {
  const g = genderFor(p.sex);
  const T = targets(p);
  const byId = new Map(pool.map((f) => [f.id, f]));
  const todayKey = dayKey(today);
  const days: ReportDay[] = weekKeys(start).map((date) => {
    const key = dayKey(date);
    const log = logs[key];
    const future = key > todayKey;
    const t = log ? totals(log) : { kcal: 0, p: 0, c: 0, f: 0 };
    const ses = future ? null : sessionFor(p, weekIndex(date), log?.flare ?? false, programWeek(p.start, date));
    const redFoods = (log?.foods ?? []).filter((x) => {
      const src = byId.get(x.ref);
      const food: Food = { id: x.ref, cat: '', n: x.n, u: x.u, kcal: x.kcal, p: x.p, c: x.c, f: x.f, gi: x.gi ?? src?.gi, tags: x.tags ?? src?.tags };
      return healthNotes(p, food).some((n) => n.level === 'bad');
    }).map((x) => x.n);
    return {
      key, date, future, logged: !!log && log.foods.length > 0, ...t, water: log?.water ?? 0,
      workout: ses ? { done: ses.items.filter((x) => (log?.done ?? []).includes(x.id)).length, of: ses.items.length, name: ses.n } : null,
      redFoods,
    };
  });
  const past = days.filter((d) => !d.future);
  const logged = past.filter((d) => d.logged);
  const wins: string[] = [];
  const misses: string[] = [];
  const n = logged.length;
  if (n) {
    const inRange = logged.filter((d) => d.kcal >= T.kcal * 0.85 && d.kcal <= T.kcal * 1.05).length;
    const over = logged.filter((d) => d.kcal > T.kcal * 1.05);
    const low = logged.filter((d) => d.kcal < T.kcal * 0.7).length;
    if (inRange) wins.push(L(`${g('كنت', 'كنتي')} في حدود السعرات ${nDays(inRange)} من ${nDays(n)} ${g('سجلتهم', 'سجلتيهم')}.`, `You stayed within your calories on ${nDays(inRange)} of the ${nDays(n)} you logged.`));
    if (over.length) {
      const top = over.reduce((a, b) => (b.kcal > a.kcal ? b : a));
      misses.push(L(`${g('عديت', 'عديتي')} السعرات ${nDays(over.length)}، أكترهم يوم ${dayName(top.date)} (${ar(top.kcal)} من ${ar(T.kcal)}).`, `You went over your calories on ${nDays(over.length)}, most on ${dayName(top.date)} (${ar(top.kcal)} of ${ar(T.kcal)}).`));
    }
    if (low) misses.push(L(`${g('أكلت', 'أكلتي')} أقل من اللازم بكتير ${nDays(low)}، وده بيبطأ الحرق ويتعب الجسم.`, `You ate far too little on ${nDays(low)}, which slows your metabolism and wears your body out.`));
    const prot = logged.filter((d) => d.p >= T.protein * 0.9).length;
    if (prot >= Math.ceil(n / 2)) wins.push(L(`${g('جبت', 'جبتي')} البروتين المطلوب ${nDays(prot)} من ${nDays(n)}.`, `You hit your protein target on ${ar(prot)} of ${nDays(n)}.`));
    else misses.push(L(`البروتين كان قليل: ${g('جبته', 'جبتيه')} ${nDays(prot)} بس من ${nDays(n)}. الهدف ${ar(T.protein)} جم في اليوم.`, `Protein was low: you hit it on ${prot ? 'only ' : ''}${ar(prot)} of ${nDays(n)}. The target is ${ar(T.protein)} g a day.`));
    const fat = logged.filter((d) => d.f > T.fat).length;
    if (fat) misses.push(L(`الدهون عدت المسموح (${ar(T.fat)} جم) ${nDays(fat)}.`, `Fat went over your limit (${ar(T.fat)} g) on ${nDays(fat)}.`));
    else wins.push(L('الدهون فضلت في المسموح طول الأسبوع.', 'Fat stayed within your limit all week.'));
  }
  const water = past.filter((d) => d.water >= T.waterCups).length;
  if (past.length) {
    if (water >= Math.ceil(past.length / 2)) wins.push(L(`${g('شربت', 'شربتي')} المياه كاملة ${nDays(water)} من ${nDays(past.length)}.`, `You drank all your water on ${ar(water)} of ${nDays(past.length)}.`));
    else misses.push(L(`المياه كانت قليلة: ${g('وصلت', 'وصلتي')} لـ ${ar(T.waterCups)} كوبايات ${nDays(water)} بس من ${nDays(past.length)}.`, `Water was low: you reached ${ar(T.waterCups)} cups on ${water ? 'only ' : ''}${ar(water)} of ${nDays(past.length)}.`));
  }
  const planned = past.filter((d) => d.workout);
  if (planned.length) {
    const done = planned.filter((d) => d.workout!.done >= Math.ceil(d.workout!.of / 2)).length;
    if (done === planned.length) wins.push(L(`${g('عملت', 'عملتي')} كل التمارين: ${ar(done)} من ${ar(planned.length)}.`, `You did every workout: ${ar(done)} of ${ar(planned.length)}.`));
    else if (done) { wins.push(L(`${g('عملت', 'عملتي')} ${ar(done)} تمارين من ${ar(planned.length)}.`, `You did ${ar(done)} of ${ar(planned.length)} workouts.`)); misses.push(L(`فاتك ${ar(planned.length - done)} ${planned.length - done === 1 ? 'تمرين' : 'تمارين'}.`, `You missed ${ar(planned.length - done)} ${planned.length - done === 1 ? 'workout' : 'workouts'}.`)); }
    else misses.push(L(`مفيش تمرين اتسجل من ${ar(planned.length)} كانوا في الخطة.`, `No workouts logged out of the ${ar(planned.length)} planned.`));
  }
  const red = past.flatMap((d) => d.redFoods);
  if (red.length) misses.push(L(`${g('أكلت', 'أكلتي')} حاجات مش مناسبة لحالتك ${ar(red.length)} مرة: ${Array.from(new Set(red)).slice(0, 4).join('، ')}.`, `You ate things that don't suit your condition ${red.length === 1 ? 'once' : `${ar(red.length)} times`}: ${Array.from(new Set(red)).slice(0, 4).map(tx).join(', ')}.`));
  else if (n) wins.push(L('مفيش أكلة مش مناسبة لحالتك طول الأسبوع.', 'Nothing unsuitable for your condition all week.'));
  // Meals not ticked, on the days the person used the meal ticks.
  const ticked = past.map((d) => logs[d.key]?.meals).filter((m): m is Meal[] => !!m && m.length > 0);
  if (ticked.length) {
    const skipped = MEALS.filter((m) => m !== 'snack').map((m) => [m, ticked.filter((x) => !x.includes(m)).length] as const).filter(([, k]) => k > 0);
    if (skipped.length) misses.push(L(`${g('مخدتش', 'مخدتيش')} ${skipped.map(([m, k]) => `${MEAL_NAME[m]} ${nDays(k)}`).join('، و')}.`, `You skipped ${skipped.map(([m, k]) => `${MEAL_NAME[m].toLowerCase()} on ${nDays(k)}`).join(', and ')}.`));
    else wins.push(L(`${g('خدت', 'خدتي')} وجباتك الأساسية كلها.`, 'You had all your main meals.'));
  }
  const missing = past.length - n;
  if (missing) misses.push(L(`${g('مسجلتش', 'مسجلتيش')} أكل ${nDays(missing)}، فالتقرير مش كامل.`, `You didn't log food on ${nDays(missing)}, so this report is incomplete.`));
  return { days, wins, misses, from: days[0].date, to: days[6].date };
}

/** A printable page for the report (shared or saved as PDF from the phone's print sheet). */
export function reportHTML(p: Profile, r: WeekReport): string {
  const T = targets(p);
  const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!);
  const rows = r.days.map((d) => `<tr${d.future ? ' class="f"' : ''}><td>${dayName(d.date)} ${shortDate(d.date)}</td>
    <td class="${d.logged && d.kcal > T.kcal * 1.05 ? 'bad' : ''}">${d.logged ? ar(d.kcal) : '—'}</td>
    <td>${d.logged ? ar(d.p) : '—'}</td><td class="${d.logged && d.f > T.fat ? 'bad' : ''}">${d.logged ? ar(d.f) : '—'}</td>
    <td>${d.future ? '' : ar(Math.round(d.water * 10) / 10)}</td>
    <td>${d.future ? '' : d.workout ? (d.workout.done >= Math.ceil(d.workout.of / 2) ? '✓ ' : '✗ ') + esc(tx(d.workout.name)) : L('راحة', 'Rest')}</td></tr>`).join('');
  const list = (xs: string[], cls: string) => xs.length ? `<ul class="${cls}">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="m">${L('مفيش.', 'None.')}</p>`;
  return `<!doctype html><html dir="${L('rtl', 'ltr')}" lang="${L('ar', 'en')}"><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,"Geeza Pro",Tahoma,sans-serif;color:#0A0F16;margin:28px}
  h1{color:#07110D;margin:0}h1 span{color:#0A8F55}.sub{color:#5B6676;margin:4px 0 18px}
  h2{font-size:16px;margin:18px 0 6px}table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border-bottom:1px solid #D6E2E5;padding:7px 6px;text-align:${L('right', 'left')}}th{color:#5A6E74;font-weight:600}
  .bad{color:#A12C2C;font-weight:700}.f{color:#9AAEB3}.win li{color:#1B6B45}.miss li{color:#A12C2C}.m{color:#5A6E74}
  li{margin:4px 0}</style></head><body>
  <h1>${L('يلا <span>ويل</span>', 'Yalla <span>Well</span>')}</h1>
  <p class="sub">${L(`تقرير الأسبوع من ${dayName(r.from)} ${shortDate(r.from)} لـ ${dayName(r.to)} ${shortDate(r.to)}`, `Weekly report, ${dayName(r.from)} ${shortDate(r.from)} to ${dayName(r.to)} ${shortDate(r.to)}`)}${p.name ? ' · ' + esc(p.name) : ''} · ${L(`الهدف ${ar(T.kcal)} سعرة، ${ar(T.protein)} جم بروتين`, `Target ${ar(T.kcal)} kcal, ${ar(T.protein)} g protein`)}</p>
  <h2>${L(genderFor(p.sex)('حققت', 'حققتي'), 'Wins')}</h2>${list(r.wins, 'win')}
  <h2>${L('محتاج يتحسن', 'Needs work')}</h2>${list(r.misses, 'miss')}
  <h2>${L('كل يوم', 'Day by day')}</h2><table><thead><tr>${(isEn() ? ['Day', 'Calories', 'Protein g', 'Fat g', 'Water', 'Workout'] : ['اليوم', 'سعرات', 'بروتين جم', 'دهون جم', 'مياه', 'تمرين']).map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
}
