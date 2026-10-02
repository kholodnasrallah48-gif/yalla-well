// Streaks and points: days the calories stayed on target (not far over, not starved), and planned workouts done.
import { dayKey, totals, weekIndex, type DayLog } from './day.ts';
import { sessionFor, targets, type Profile } from './plan.ts';
import { programWeek } from './progress.ts';

export const POINTS = { kcal: 10, workout: 15, water: 5, meals: 5, perfect: 5 };

export type DayScore = {
  /** Food was logged and calories ended between 75% and 110% of the target. */
  kcalOk: boolean;
  /** null on a rest day; otherwise at least half of the planned exercises were ticked. */
  workoutOk: boolean | null;
  waterOk: boolean;
  /** Breakfast, lunch and dinner all ticked. */
  mealsOk: boolean;
  points: number;
};

export function scoreDay(p: Profile, log: DayLog | null | undefined, date: Date): DayScore {
  const T = targets(p);
  const kcal = log ? totals(log).kcal : 0;
  const kcalOk = !!log && log.foods.length > 0 && kcal >= T.kcal * 0.75 && kcal <= T.kcal * 1.1;
  const ses = sessionFor(p, weekIndex(date), log?.flare ?? false, programWeek(p.start, date));
  const workoutOk = ses ? ses.items.filter((x) => (log?.done ?? []).includes(x.id)).length >= Math.ceil(ses.items.length / 2) : null;
  const waterOk = (log?.water ?? 0) >= T.waterCups;
  const mealsOk = ['breakfast', 'lunch', 'dinner'].every((m) => (log?.meals ?? []).includes(m as never));
  let points = 0;
  if (kcalOk) points += POINTS.kcal;
  if (workoutOk) points += POINTS.workout;
  if (waterOk) points += POINTS.water;
  if (mealsOk) points += POINTS.meals;
  if (kcalOk && waterOk && workoutOk !== false) points += POINTS.perfect;
  return { kcalOk, workoutOk, waterOk, mealsOk, points };
}

export type Streaks = { kcal: number; workout: number; points: number; todayPoints: number; bestKcal: number };

/**
 * Current streaks counted back from today. Today only adds when it's already reached, and doesn't break a streak
 * while it's still going. Rest days neither add to nor break the workout streak. Days before the plan started
 * are not counted.
 */
export function streaks(p: Profile, logs: Record<string, DayLog | null | undefined>, today: Date, days = 90): Streaks {
  const start = p.start ?? '0000';
  let kcal = 0, workout = 0, points = 0, todayPoints = 0, bestKcal = 0, run = 0;
  let kcalOpen = true, workoutOpen = true;
  const list: { key: string; s: DayScore }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dayKey(d);
    if (key < start) break;
    list.push({ key, s: scoreDay(p, logs[key], d) });
  }
  list.forEach(({ s }, i) => {
    points += s.points;
    if (i === 0) todayPoints = s.points;
    if (kcalOpen) { if (s.kcalOk) kcal++; else if (i > 0) kcalOpen = false; }
    if (workoutOpen && s.workoutOk !== null) { if (s.workoutOk) workout++; else if (i > 0) workoutOpen = false; }
  });
  // Best calorie streak, oldest to newest.
  for (const { s } of [...list].reverse()) { run = s.kcalOk ? run + 1 : 0; bestKcal = Math.max(bestKcal, run); }
  return { kcal, workout, points, todayPoints, bestKcal };
}
