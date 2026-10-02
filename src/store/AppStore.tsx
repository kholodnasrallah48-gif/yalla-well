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

  // Roll over to a fresh day when the app comes back after midnight.
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (s) => {
      if (s !== 'active') return;
      const k = dayKey(new Date());
      if (k === todayRef.current) return;
      const d = await readJSON<DayLog>(K.day(k));
      setToday(k);
      setDay({ ...blankDay(), ...(d ?? {}) });
    });
    return () => sub.remove();
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

  const value = useMemo(
    () => ({ ready, profile, custom, lifts, today, day, saveProfile, addCustomFood, saveLift, updateDay, resetAll }),
    [ready, profile, custom, lifts, today, day, saveProfile, addCustomFood, saveLift, updateDay, resetAll],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore must be used inside AppStoreProvider');
  return s;
}
