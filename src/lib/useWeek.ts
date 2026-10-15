// The numbers of one week (this week or last) for the story picture and the camera story frame.
import { useEffect, useMemo, useState } from 'react';

import { weightOn } from './body.ts';
import { dayKey, type DayLog } from './day.ts';
import { weekKeys, weekStart } from './report.ts';
import { weekStory, type WeekStory } from './story.ts';
import { streaks } from './streaks.ts';
import { useStore } from '../store/AppStore.tsx';

export type WeekNumbers = { s: WeekStory | null; streak: number; start: Date; end: Date; kg: number };

export function useWeek(offset: number): WeekNumbers | null {
  const { profile, readDay, day, today, history } = useStore();
  const [logs, setLogs] = useState<Record<string, DayLog | null> | null>(null);
  const start = useMemo(() => weekStart(new Date(), offset), [offset]);
  useEffect(() => {
    let live = true;
    setLogs(null);
    const keys = weekKeys(start).map(dayKey);
    Promise.all(keys.map(readDay)).then((xs) => { if (live) setLogs(Object.fromEntries(keys.map((k, i) => [k, xs[i]]))); });
    return () => { live = false; };
  }, [start, day]);
  if (!profile) return null;
  const end = weekKeys(start)[6];
  const now = new Date();
  // The streak shown is the one at the end of that week (today for this week).
  const until = end < now ? end : now;
  const st = streaks(profile, { ...history, ...(logs ?? {}), [today]: day } as Record<string, DayLog>, until);
  const s = logs ? weekStory(profile, start, { ...logs, [today]: day }, now) : null;
  const before = new Date(start); before.setDate(before.getDate() - 1);
  const kg = Math.round((weightOn(profile, dayKey(until)) - weightOn(profile, dayKey(before))) * 10) / 10;
  return { s, streak: st.kcal, start, end, kg };
}
