// Weekly report: what went well and what didn't over one Saturday-to-Friday week, plus a printable HTML version.
import { dayKey, totals, weekIndex, type DayLog } from './day.ts';
import { FOODS, healthNotes, type Food } from './foods.ts';
import { L, isEn, num, tx } from './i18n.ts';
import { genderFor, sessionFor, targets, type Profile } from './plan.ts';
import { MEALS, MEAL_NAME } from './mealplan.ts';
import { programWeek } from './progress.ts';
import { PC, ad, esc, n, page, ring, scoreBand, scoreCSS, scoreFoot } from './printkit.ts';
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

/** Calories in range for the week report (the same band as the wins line). */
export const kcalState = (kcal: number, target: number, logged: boolean): 'ok' | 'over' | 'under' | 'none' =>
  !logged ? 'none' : kcal > target * 1.05 ? 'over' : kcal < target * 0.85 ? 'under' : 'ok';

/**
 * The week's score (0 to 100): the average of three parts, each the share of the week's days so far (or planned
 * workouts) that hit it: days with calories in range, workouts done (left out when none was planned) and days with
 * all the water. Days not logged count as not hit; days still to come don't count.
 */
export function weekScore(p: Profile, r: WeekReport): { score: number; kcal: number; workouts: number | null; water: number } {
  const T = targets(p);
  const past = r.days.filter((d) => !d.future);
  if (!past.length) return { score: 0, kcal: 0, workouts: null, water: 0 };
  const kcal = past.filter((d) => kcalState(d.kcal, T.kcal, d.logged) === 'ok').length / past.length;
  const water = past.filter((d) => d.water >= T.waterCups).length / past.length;
  const planned = past.filter((d) => d.workout);
  const workouts = planned.length ? planned.filter((d) => d.workout!.done >= Math.ceil(d.workout!.of / 2)).length / planned.length : null;
  const parts = [kcal, water, ...(workouts === null ? [] : [workouts])];
  return { score: Math.round((parts.reduce((a, b) => a + b, 0) / parts.length) * 100), kcal, workouts, water };
}

/** A printable page for the report (shared or saved as PDF from the phone's print sheet), in the scoreboard look. */
export function reportHTML(p: Profile, r: WeekReport): string {
  const T = targets(p);
  const g = genderFor(p.sex);
  const sc = weekScore(p, r);
  const past = r.days.filter((d) => !d.future);
  const logged = past.filter((d) => d.logged);
  const avg = (f: (d: ReportDay) => number, xs: ReportDay[]) => (xs.length ? xs.reduce((a, d) => a + f(d), 0) / xs.length : 0);
  const kcalAvg = avg((d) => d.kcal, logged), protAvg = avg((d) => d.p, logged), waterAvg = avg((d) => d.water, past);
  const planned = past.filter((d) => d.workout);
  const done = planned.filter((d) => d.workout!.done >= Math.ceil(d.workout!.of / 2)).length;
  const fmtN = (x: number) => Math.round(x).toLocaleString('en-US');
  const range = `${shortDate(r.from)} ${L('لـ', 'to')} ${shortDate(r.to)}`;

  const title = sc.score >= 80 ? L('أسبوع قوي', 'A strong week') : sc.score >= 50 ? L('أسبوع كويس', 'A good week') : L('أسبوع نبني عليه', 'A week to build on');
  const band = scoreBand(ring(sc.score / 100, PC.neon, `${sc.score}%`, true, 24), p.name.trim() ? L(`${title} يا ${p.name.trim().split(/\s+/)[0]}`, `${title}, ${p.name.trim().split(/\s+/)[0]}`) : title,
    `${esc(range)} · ${L('درجة الأسبوع من السعرات والتمرين والمية', 'Week score from calories, workouts and water')}`);

  const rings = [
    [logged.length ? kcalAvg / T.kcal : 0, PC.green, logged.length ? `${Math.round((kcalAvg / T.kcal) * 100)}%` : '—', L('السعرات', 'Calories'), logged.length ? n(`${fmtN(kcalAvg)} / ${fmtN(T.kcal)}`) : ''],
    [logged.length ? protAvg / T.protein : 0, PC.blue, logged.length ? `${Math.round((protAvg / T.protein) * 100)}%` : '—', L('البروتين', 'Protein'), logged.length ? n(`${fmtN(protAvg)} / ${fmtN(T.protein)} g`) : ''],
    [past.length ? waterAvg / T.waterCups : 0, PC.orange, past.length ? `${Math.round((waterAvg / T.waterCups) * 100)}%` : '—', L('المية', 'Water'), past.length ? `${n(`${Math.round(waterAvg * 10) / 10} / ${T.waterCups}`)} ${L('كوباية', 'cups')}` : ''],
    [planned.length ? done / planned.length : 0, PC.ink, planned.length ? `${done}/${planned.length}` : '—', L('التمرين', 'Workouts'), planned.length ? L('تمارين خلصت', 'done') : L('مفيش تمرين في الخطة', 'none planned')],
    // Sub lines are HTML: numbers already wrapped to stay left-to-right.
  ] as const;
  const ringRow = `<div class="rings">${rings.map(([pc, c, t, l, sub]) => `<div>${ring(pc, c, t, false, 20)}<b>${esc(l)}</b><span class="sub mut">${sub}</span></div>`).join('')}</div>`;

  const bg = { ok: PC.greenBg, over: PC.amberBg, under: PC.grey, none: PC.grey } as const;
  const cal = `<div class="sec"><p class="h" style="font-size:13.5px;margin-bottom:6px">${L('كل يوم', 'Each day')}</p><div class="cal">${r.days.map((d) => {
    const st = d.future ? 'none' : kcalState(d.kcal, T.kcal, d.logged);
    return `<div style="background:${bg[st]}${d.future ? ';opacity:.55' : ''}"><span>${esc(dayName(d.date))}</span><span class="n">${d.logged ? fmtN(d.kcal) : '—'}</span></div>`;
  }).join('')}</div>
  <div class="legend mut"><span><span class="dot" style="background:${PC.green}"></span>${L('في حدود سعراتك', 'Within your calories')}</span><span><span class="dot" style="background:${PC.calAmber}"></span>${L('زيادة', 'Over')}</span><span><span class="dot" style="background:${PC.line}"></span>${L('أقل بكتير أو مفيش تسجيل', 'Well under, or not logged')}</span></div></div>`;

  const list = (xs: string[]) => xs.length ? `<ul>${xs.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : `<p class="mut">${L('مفيش.', 'None.')}</p>`;
  const cols = `<div class="cols sec"><div style="background:${PC.greenBg}"><p class="h" style="color:${PC.green}">${L(g('حققت', 'حققتي'), 'Wins')}</p>${list(r.wins)}</div><div style="background:${PC.redBg}"><p class="h" style="color:${PC.red}">${L('محتاج يتحسن', 'Needs work')}</p>${list(r.misses)}</div></div>`;

  const rows = r.days.map((d) => {
    const st = d.future ? 'none' : kcalState(d.kcal, T.kcal, d.logged);
    const dot = st === 'ok' ? PC.green : st === 'over' ? PC.calAmber : PC.line;
    const wk = d.future ? '' : d.workout ? `${d.workout.done >= Math.ceil(d.workout.of / 2) ? '✓' : '✗'} ${esc(tx(d.workout.name))}` : L('راحة', 'Rest');
    return `<tr${d.future ? ' style="color:#A1A1A6"' : ''}><td><span class="dot" style="background:${dot}"></span>${esc(dayName(d.date))} <span class="mut">${esc(shortDate(d.date))}</span></td>
    <td class="n"${st === 'over' ? ` style="color:${PC.red}"` : ''}>${d.logged ? fmtN(d.kcal) : '—'}</td><td class="n">${d.logged ? `${fmtN(d.p)}g` : '—'}</td>
    <td class="n"${d.logged && d.f > T.fat ? ` style="color:${PC.red}"` : ''}>${d.logged ? `${fmtN(d.f)}g` : '—'}</td><td class="n">${d.future ? '' : Math.round(d.water * 10) / 10}</td><td>${wk}</td></tr>`;
  }).join('');
  const table = `<div class="sec"><table><thead><tr>${[L('اليوم', 'Day'), L('سعرات', 'Calories'), L('بروتين', 'Protein'), L('دهون', 'Fat'), L('مية (كوباية)', 'Water (cups)'), L('تمرين', 'Workout')].map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table>
  <p class="mut" style="font-size:10px;margin-top:5px">${L(`الهدف ${ad(fmtN(T.kcal))} سعرة، ${ad(T.protein)} جم بروتين، و${ad(T.fat)} جم دهون بالكتير في اليوم.`, `Target ${fmtN(T.kcal)} kcal, ${T.protein} g protein, and at most ${T.fat} g fat a day.`)}</p></div>`;

  const body = `<div class="wrap">${band}${ringRow}${cal}${cols}${table}${scoreFoot(L('تقرير الأسبوع من يلا ويل', 'Weekly report from Yalla Well'))}</div>`;
  return page(L('تقرير الأسبوع', 'Weekly report'), body, scoreCSS());
}
