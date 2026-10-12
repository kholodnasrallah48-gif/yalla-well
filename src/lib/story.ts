// The week as a story picture: what to show on it (days on target, workouts, water, points, the streak) and the
// headline the captain gives it.
import { dayKey, type DayLog } from './day.ts';
import { L } from './i18n.ts';
import { genderFor, type Profile } from './plan.ts';
import { weekKeys } from './report.ts';
import { scoreDay } from './streaks.ts';

export type StoryDay = { key: string; future: boolean; kcalOk: boolean; workoutOk: boolean | null };
export type WeekStory = {
  days: StoryDay[];
  /** Days so far this week (today included). */
  past: number;
  kcalDays: number; waterDays: number; points: number;
  workouts: { done: number; of: number };
  headline: string; line: string;
};

export function weekStory(p: Profile, start: Date, logs: Record<string, DayLog | null | undefined>, today: Date): WeekStory {
  const g = genderFor(p.sex);
  const todayKey = dayKey(today);
  const begin = p.start ?? '0000';
  const days: StoryDay[] = [];
  let kcalDays = 0, waterDays = 0, points = 0, done = 0, of = 0;
  for (const d of weekKeys(start)) {
    const key = dayKey(d);
    const future = key > todayKey || key < begin;
    if (future) { days.push({ key, future, kcalOk: false, workoutOk: null }); continue; }
    const s = scoreDay(p, logs[key], d);
    days.push({ key, future, kcalOk: s.kcalOk, workoutOk: s.workoutOk });
    if (s.kcalOk) kcalDays++;
    if (s.waterOk) waterDays++;
    points += s.points;
    if (s.workoutOk !== null) { of++; if (s.workoutOk) done++; }
  }
  const past = days.filter((d) => !d.future).length;
  const share = past ? kcalDays / past : 0;
  const allWorkouts = of > 0 && done === of;
  const [headline, line] =
    past === 0 ? [L('أسبوع جديد', 'A new week'), L('الصفحة لسه بيضا، والبداية النهارده.', 'A clean page, starting today.')]
    : share >= 0.8 && (allWorkouts || of === 0) ? [L('أسبوع جامد', 'A strong week'), L(`${g('ماشي', 'ماشية')} على الخطة يوم ورا يوم.`, 'On plan, day after day.')]
    : share >= 0.5 || done >= 2 ? [L('ماشيين صح', 'On the right track'), L('خطوة خطوة، والأرقام بتتحسن.', 'Step by step, the numbers are getting better.')]
    : [L('لسه في الأول', 'Just getting going'), L('كل يوم بيتسجل بيقرب للهدف.', 'Every logged day gets closer to the goal.')];
  return { days, past, kcalDays, waterDays, points, workouts: { done, of }, headline, line };
}
