// Small JSON cache for online lookups (photos, online recipes): memory first, then AsyncStorage, each entry with an
// expiry. Never throws: storage can be missing (node scripts, private browser windows) and the lookups still work.
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = 'yallawell:c:';
const mem = new Map<string, { v: unknown; until: number }>();

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  const now = Date.now();
  const m = mem.get(key);
  if (m) { if (m.until > now) return m.v as T; mem.delete(key); }
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return undefined;
    const e = JSON.parse(raw) as { v: T; until: number };
    if (!e || typeof e.until !== 'number' || e.until <= now) return undefined;
    mem.set(key, e);
    return e.v;
  } catch {
    return undefined;
  }
}

/** Keeps `v` for `days` days. */
export async function cacheSet(key: string, v: unknown, days: number): Promise<void> {
  const e = { v, until: Date.now() + days * 86400000 };
  mem.set(key, e);
  try { await AsyncStorage.setItem(PREFIX + key, JSON.stringify(e)); } catch { /* memory only */ }
}

/** The value already in memory, for a first render without waiting. */
export function cachePeek<T>(key: string): T | undefined {
  const m = mem.get(key);
  return m && m.until > Date.now() ? (m.v as T) : undefined;
}
