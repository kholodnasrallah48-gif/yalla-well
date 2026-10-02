// App state kept on the device: the profile, the person's own foods and today's log.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import type { Food } from '../lib/foods.ts';
import { blankDay, dayKey, type DayLog } from '../lib/day.ts';
import type { Profile } from '../lib/plan.ts';
import type { LiftLog } from '../lib/progress.ts';

const K = { profile: 'yallawell:profile', custom: 'yallawell:custom', lifts: 'yallawell:lifts', day: (k: string) => 'yallawell:day:' + k };

type Store = {
  ready: boolean;
  profile: Profile | null;
  custom: Food[];
  /** Last logged session per exercise id, for weight suggestions. */
  lifts: Record<string, LiftLog>;
  today: string;
  day: DayLog;
  saveProfile: (p: Profile) => void;
  addCustomFood: (f: Food) => void;
  saveLift: (id: string, log: LiftLog) => void;
  updateDay: (fn: (d: DayLog) => DayLog) => void;
  resetAll: () => Promise<void>;
  /** A saved day's log (today's comes from memory), or null when nothing was logged. */
  readDay: (key: string) => Promise<DayLog | null>;
  /** On how many of the last 30 days (today included) each food id was logged. */
  usage: Record<string, number>;
};

const Ctx = createContext<Store | null>(null);

async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
const writeJSON = (key: string, v: unknown) => AsyncStorage.setItem(key, JSON.stringify(v)).catch(() => {});

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [custom, setCustom] = useState<Food[]>([]);
  const [lifts, setLifts] = useState<Record<string, LiftLog>>({});
  const [today, setToday] = useState(() => dayKey(new Date()));
  const [day, setDay] = useState<DayLog>(blankDay);
  const todayRef = useRef(today);
  todayRef.current = today;
  // Foods logged on the 29 days before today, counted once per day; today's are added live below.
  const [pastUse, setPastUse] = useState<Record<string, number>>({});
  useEffect(() => {
    const keys = Array.from({ length: 29 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 1 - i); return K.day(dayKey(d)); });
    AsyncStorage.multiGet(keys).then((rows) => {
      const n: Record<string, number> = {};
      for (const [, v] of rows) {
        if (!v) continue;
        try { for (const ref of new Set(((JSON.parse(v) as DayLog).foods ?? []).map((x) => x.ref))) n[ref] = (n[ref] ?? 0) + 1; } catch { /* skip a broken day */ }
      }
      setPastUse(n);
    }).catch(() => {});
  }, [today]);

  useEffect(() => {
    (async () => {
      const [p, c, d, l] = await Promise.all([
        readJSON<Profile>(K.profile), readJSON<Food[]>(K.custom), readJSON<DayLog>(K.day(today)), readJSON<Record<string, LiftLog>>(K.lifts),
      ]);
      // Plans made before progression existed start counting from today.
      if (p && !p.start) { p.start = today; writeJSON(K.profile, p); }
      setProfile(p);
      setLifts(l ?? {});
      setCustom(c ?? []);
      setDay({ ...blankDay(), ...(d ?? {}) });
      setReady(true);
    })();
  }, []);

  // After midnight the finished day stays saved as it was (for the report) and a fresh day starts:
  // checked when the app comes back to the screen and every minute while it stays open.
  useEffect(() => {
    const roll = async () => {
      const k = dayKey(new Date());
      if (k === todayRef.current) return;
      todayRef.current = k;
      const d = await readJSON<DayLog>(K.day(k));
      setToday(k);
      setDay({ ...blankDay(), ...(d ?? {}) });
    };
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') roll(); });
    const timer = setInterval(roll, 60_000);
    return () => { sub.remove(); clearInterval(timer); };
  }, []);

  const saveProfile = useCallback((p: Profile) => { setProfile(p); writeJSON(K.profile, p); }, []);
  const addCustomFood = useCallback((f: Food) => {
    setCustom((prev) => { const next = [...prev, f]; writeJSON(K.custom, next); return next; });
  }, []);
  const saveLift = useCallback((id: string, log: LiftLog) => {
    setLifts((prev) => { const next = { ...prev, [id]: log }; writeJSON(K.lifts, next); return next; });
  }, []);
  const updateDay = useCallback((fn: (d: DayLog) => DayLog) => {
    setDay((prev) => { const next = fn(prev); writeJSON(K.day(todayRef.current), next); return next; });
  }, []);
  const resetAll = useCallback(async () => {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('yallawell:'));
    await AsyncStorage.multiRemove(keys);
    setProfile(null); setCustom([]); setLifts({}); setDay(blankDay());
  }, []);

  const readDay = useCallback(async (key: string) => {
    if (key === todayRef.current) return day;
    const d = await readJSON<DayLog>(K.day(key));
    return d ? { ...blankDay(), ...d } : null;
  }, [day]);

  const usage = useMemo(() => {
    const n = { ...pastUse };
    for (const ref of new Set(day.foods.map((x) => x.ref))) n[ref] = (n[ref] ?? 0) + 1;
    return n;
  }, [pastUse, day]);

  const value = useMemo(
    () => ({ ready, profile, custom, lifts, today, day, saveProfile, addCustomFood, saveLift, updateDay, resetAll, readDay, usage }),
    [ready, profile, custom, lifts, today, day, saveProfile, addCustomFood, saveLift, updateDay, resetAll, readDay, usage],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}
