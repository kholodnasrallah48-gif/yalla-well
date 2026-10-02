// Weekly report: what went well and what didn't over one Saturday-to-Friday week, plus a printable HTML version.
import { dayKey, totals, weekIndex, type DayLog } from './day.ts';
import { FOODS, healthNotes, type Food } from './foods.ts';
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

const ar = (n: number) => Math.round(n).toLocaleString('ar-EG');
/** "يوم واحد", "يومين", "٣ أيام", "١١ يوم". */
export const nDays = (n: number) => (n === 0 ? 'ولا يوم' : n === 1 ? 'يوم واحد' : n === 2 ? 'يومين' : n <= 10 ? `${ar(n)} أيام` : `${ar(n)} يوم`);
const DAY_NAMES = ['السبت', 'الحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة'];
export const dayName = (d: Date) => DAY_NAMES[weekIndex(d)];
export const shortDate = (d: Date) => `${ar(d.getDate())}/${ar(d.getMonth() + 1)}`;

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
    if (inRange) wins.push(`${g('كنت', 'كنتي')} في حدود السعرات ${nDays(inRange)} من ${nDays(n)} ${g('سجلتهم', 'سجلتيهم')}.`);
    if (over.length) {
      const top = over.reduce((a, b) => (b.kcal > a.kcal ? b : a));
      misses.push(`${g('عديت', 'عديتي')} السعرات ${nDays(over.length)}، أكترهم يوم ${dayName(top.date)} (${ar(top.kcal)} من ${ar(T.kcal)}).`);
    }
    if (low) misses.push(`${g('أكلت', 'أكلتي')} أقل من اللازم بكتير ${nDays(low)}، وده بيبطّأ الحرق ويتعب الجسم.`);
    const prot = logged.filter((d) => d.p >= T.protein * 0.9).length;
    if (prot >= Math.ceil(n / 2)) wins.push(`${g('جبت', 'جبتي')} البروتين المطلوب ${nDays(prot)} من ${nDays(n)}.`);
    else misses.push(`البروتين كان قليل: ${g('جبته', 'جبتيه')} ${nDays(prot)} بس من ${nDays(n)}. الهدف ${ar(T.protein)} جم في اليوم.`);
    const fat = logged.filter((d) => d.f > T.fat).length;
    if (fat) misses.push(`الدهون عدّت المسموح (${ar(T.fat)} جم) ${nDays(fat)}.`);
    else wins.push('الدهون فضلت في المسموح طول الأسبوع.');
  }
  const water = past.filter((d) => d.water >= T.waterCups).length;
  if (past.length) {
    if (water >= Math.ceil(past.length / 2)) wins.push(`${g('شربت', 'شربتي')} المياه كاملة ${nDays(water)} من ${nDays(past.length)}.`);
    else misses.push(`المياه كانت قليلة: ${g('وصلت', 'وصلتي')} لـ ${ar(T.waterCups)} كوبايات ${nDays(water)} بس من ${nDays(past.length)}.`);
  }
  const planned = past.filter((d) => d.workout);
  if (planned.length) {
    const done = planned.filter((d) => d.workout!.done >= Math.ceil(d.workout!.of / 2)).length;
    if (done === planned.length) wins.push(`${g('عملت', 'عملتي')} كل التمارين: ${ar(done)} من ${ar(planned.length)}.`);
    else if (done) { wins.push(`${g('عملت', 'عملتي')} ${ar(done)} تمارين من ${ar(planned.length)}.`); misses.push(`فاتك ${ar(planned.length - done)} ${planned.length - done === 1 ? 'تمرين' : 'تمارين'}.`); }
    else misses.push(`مفيش تمرين اتسجل من ${ar(planned.length)} كانوا في الخطة.`);
  }
  const red = past.flatMap((d) => d.redFoods);
  if (red.length) misses.push(`${g('أكلت', 'أكلتي')} حاجات مش مناسبة لحالتك ${ar(red.length)} مرة: ${Array.from(new Set(red)).slice(0, 4).join('، ')}.`);
  else if (n) wins.push('مفيش أكلة مش مناسبة لحالتك طول الأسبوع.');
  // Meals not ticked, on the days the person used the meal ticks.
  const ticked = past.map((d) => logs[d.key]?.meals).filter((m): m is Meal[] => !!m && m.length > 0);
  if (ticked.length) {
    const skipped = MEALS.filter((m) => m !== 'snack').map((m) => [m, ticked.filter((x) => !x.includes(m)).length] as const).filter(([, k]) => k > 0);
    if (skipped.length) misses.push(`${g('مخدتش', 'مخدتيش')} ${skipped.map(([m, k]) => `${MEAL_NAME[m]} ${nDays(k)}`).join('، و')}.`);
    else wins.push(`${g('خدت', 'خدتي')} وجباتك الأساسية كلها.`);
  }
  const missing = past.length - n;
  if (missing) misses.push(`${g('مسجلتش', 'مسجلتيش')} أكل ${nDays(missing)}، فالتقرير مش كامل.`);
  return { days, wins, misses, from: days[0].date, to: days[6].date };
}

/** A printable page for the report (shared or saved as PDF from the phone's print sheet). */
export function reportHTML(p: Profile, r: WeekReport): string {
  const T = targets(p);
  const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!);
  const rows = r.days.map((d) => `<tr${d.future ? ' class="f"' : ''}><td>${dayName(d.date)} ${shortDate(d.date)}</td>
    <td class="${d.logged && d.kcal > T.kcal * 1.05 ? 'bad' : ''}">${d.logged ? ar(d.kcal) : '—'}</td>
    <td>${d.logged ? ar(d.p) : '—'}</td><td class="${d.logged && d.f > T.fat ? 'bad' : ''}">${d.logged ? ar(d.f) : '—'}</td>
    <td>${d.future ? '' : ar(d.water)}</td>
    <td>${d.future ? '' : d.workout ? (d.workout.done >= Math.ceil(d.workout.of / 2) ? '✓ ' : '✗ ') + esc(d.workout.name) : 'راحة'}</td></tr>`).join('');
  const list = (xs: string[], cls: string) => xs.length ? `<ul class="${cls}">${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '<p class="m">مفيش.</p>';
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,"Geeza Pro",Tahoma,sans-serif;color:#10242A;margin:28px}
  h1{color:#0E4C5A;margin:0}h1 span{color:#A9BD2C}.sub{color:#5A6E74;margin:4px 0 18px}
  h2{font-size:16px;margin:18px 0 6px}table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{border-bottom:1px solid #D6E2E5;padding:7px 6px;text-align:right}th{color:#5A6E74;font-weight:600}
  .bad{color:#A12C2C;font-weight:700}.f{color:#9AAEB3}.win li{color:#1B6B45}.miss li{color:#A12C2C}.m{color:#5A6E74}
  li{margin:4px 0}</style></head><body>
  <h1>يلا <span>ويل</span></h1>
  <p class="sub">تقرير الأسبوع من ${dayName(r.from)} ${shortDate(r.from)} لـ ${dayName(r.to)} ${shortDate(r.to)}${p.name ? ' · ' + esc(p.name) : ''} · الهدف ${ar(T.kcal)} سعرة، ${ar(T.protein)} جم بروتين</p>
  <h2>${genderFor(p.sex)('حققت', 'حققتي')}</h2>${list(r.wins, 'win')}
  <h2>محتاج يتحسن</h2>${list(r.misses, 'miss')}
  <h2>كل يوم</h2><table><thead><tr><th>اليوم</th><th>سعرات</th><th>بروتين جم</th><th>دهون جم</th><th>مياه</th><th>تمرين</th></tr></thead><tbody>${rows}</tbody></table>
  </body></html>`;
}
