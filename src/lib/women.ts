// Women's health: pregnancy (week, trimester, extra calories) and the period cycle (logged periods, the expected
// next one, the fertile window and ovulation), from what the person logs. Estimates only, like any calendar method.
import { dayKey } from './day.ts';

/** Marital status and pregnancy, asked at the start for women and changeable from Me. */
export type Women = {
  married?: boolean;
  /** Pregnant, trying, breastfeeding, or none of these. */
  preg?: 'no' | 'yes' | 'trying' | 'nursing';
  /** First day of the last period before the pregnancy (how pregnancy weeks are counted), YYYY-MM-DD. */
  pregStart?: string;
};

/** Periods the person logged: start day, and end day once they tap it. */
export type Period = { start: string; end?: string };
export type Cycle = { periods: Period[]; /** The cycle length the person says is usual for them, in days. */ len?: number };

const DAY = 86400000;
const parse = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const diff = (a: string, b: string) => Math.round((parse(a).getTime() - parse(b).getTime()) / DAY);
const add = (k: string, n: number) => { const d = parse(k); d.setDate(d.getDate() + n); return dayKey(d); };

export const pregnant = (w: Women | undefined) => w?.preg === 'yes' && !!w.pregStart;

/** Pregnancy week on a day (1-42), counted from the last period, or null. */
export function pregWeek(w: Women | undefined, d: Date): number | null {
  if (!pregnant(w)) return null;
  const n = Math.floor(diff(dayKey(d), w!.pregStart!) / 7) + 1;
  return Math.max(1, Math.min(42, n));
}
export const trimester = (week: number) => (week <= 13 ? 1 : week <= 27 ? 2 : 3);
/** Extra calories a day for each trimester (Institute of Medicine): none in the first, 340 in the second, 450 in the third. */
export const PREG_KCAL = { 1: 0, 2: 340, 3: 450 } as const;
/** Breastfeeding adds about 330 kcal a day in the first 6 months. */
export const NURSING_KCAL = 330;
/** Expected due date: 280 days after the last period. */
export const dueDate = (w: Women) => add(w.pregStart!, 280);
/** First day of the last period from the month of pregnancy the person picks (1-9), assuming the middle of that month. */
export function startFromMonth(month: number, today = new Date()): string {
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  d.setDate(d.getDate() - Math.round((month - 0.5) * 30.4) - 14);
  return dayKey(d);
}

export type CycleInfo = {
  /** Usual cycle and period lengths, from the logged periods (or 28 and 5). */
  len: number; days: number;
  /** Day of the cycle today (1 = first day of the last period). */
  day: number | null;
  last: string | null;
  next: string | null;
  ovulation: string | null;
  fertile: [string, string] | null;
  /** Where today falls. */
  phase: 'period' | 'fertile' | 'pms' | 'other' | null;
  /** Today is one of the first two days of a period (logged or expected): training is lighter. */
  heavy: boolean;
  /** The next period is late by this many days (0 when not late). */
  late: number;
};

const median = (a: number[]) => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : Math.round((s[s.length / 2 - 1] + s[s.length / 2]) / 2); };

/** The cycle on a day, from the logged periods. Uses the last 6 cycles; odd gaps (missed logs) are ignored. */
export function cycleInfo(c: Cycle | undefined, d: Date): CycleInfo {
  const today = dayKey(d);
  const ps = [...(c?.periods ?? [])].filter((x) => x.start <= today).sort((a, b) => a.start.localeCompare(b.start));
  const gaps = ps.slice(1).map((x, i) => diff(x.start, ps[i].start)).filter((n) => n >= 21 && n <= 45).slice(-6);
  const len = gaps.length ? median(gaps) : Math.min(40, Math.max(21, c?.len ?? 28));
  const lens = ps.filter((x) => x.end).map((x) => diff(x.end!, x.start) + 1).filter((n) => n >= 2 && n <= 10).slice(-6);
  const days = lens.length ? median(lens) : 5;
  const lastP = ps[ps.length - 1];
  if (!lastP) return { len, days, day: null, last: null, next: null, ovulation: null, fertile: null, phase: null, heavy: false, late: 0 };
  const day = diff(today, lastP.start) + 1;
  const next = add(lastP.start, len);
  const late = Math.max(0, diff(today, next));
  const inPeriod = lastP.end ? today <= lastP.end : day <= days;
  // Ovulation is about 14 days before the next period; the fertile window is the 5 days before it and the day after.
  // Once the period is late, the old estimate no longer says anything.
  const ovulation = late ? null : add(next, -14);
  const fertile: [string, string] | null = ovulation ? [add(ovulation, -5), add(ovulation, 1)] : null;
  const toNext = diff(next, today);
  const phase = inPeriod ? 'period' : fertile && today >= fertile[0] && today <= fertile[1] ? 'fertile' : !late && toNext <= 3 ? 'pms' : 'other';
  // Lighter training on the first two days of a period: logged, or expected today or yesterday.
  const heavy = (inPeriod && day <= 2) || (!late && (toNext === 0 || toNext === -1)) || (late > 0 && late <= 1);
  return { len, days, day, last: lastP.start, next, ovulation, fertile, phase, heavy, late };
}

/** What a day of the calendar is: a logged period day, an expected one, fertile, ovulation, or nothing. */
export function dayKind(c: Cycle | undefined, info: CycleInfo, key: string): 'period' | 'expected' | 'fertile' | 'ovulation' | null {
  for (const p of c?.periods ?? []) {
    const end = p.end ?? add(p.start, info.days - 1);
    if (key >= p.start && key <= end) return 'period';
  }
  if (!info.next) return null;
  // Expected periods and fertile windows for the next three cycles.
  for (let i = 0; i < 3; i++) {
    const s = add(info.next, i * info.len);
    if (key >= s && key <= add(s, info.days - 1) && key > (info.last ?? '')) return 'expected';
    const ov = add(s, -14);
    if (key === ov) return 'ovulation';
    if (key >= add(ov, -5) && key <= add(ov, 1)) return 'fertile';
  }
  return null;
}

/** Logs a period starting on a day (a start within 10 days of the last one moves it instead). */
export function startPeriod(c: Cycle | undefined, key: string): Cycle {
  const ps = [...(c?.periods ?? [])].sort((a, b) => a.start.localeCompare(b.start));
  const near = ps.find((x) => Math.abs(diff(key, x.start)) < 10);
  const rest = ps.filter((x) => x !== near);
  return { ...c, periods: [...rest, { start: key }].sort((a, b) => a.start.localeCompare(b.start)) };
}
/** Sets the first day of the latest period (onboarding asks for just that one date). Later logged periods are dropped. */
export function setLastStart(c: Cycle | undefined, key: string): Cycle {
  const ps = [...(c?.periods ?? [])].sort((a, b) => a.start.localeCompare(b.start)).slice(0, -1).filter((x) => x.start < key && diff(key, x.start) >= 10);
  return { ...c, periods: [...ps, { start: key }] };
}
/** Marks the last period as ended on a day. */
export function endPeriod(c: Cycle | undefined, key: string): Cycle {
  const ps = [...(c?.periods ?? [])].sort((a, b) => a.start.localeCompare(b.start));
  const last = ps[ps.length - 1];
  if (!last || key < last.start) return c ?? { periods: [] };
  ps[ps.length - 1] = { ...last, end: key };
  return { ...c, periods: ps };
}
export const removePeriod = (c: Cycle | undefined, start: string): Cycle => ({ ...c, periods: (c?.periods ?? []).filter((x) => x.start !== start) });
