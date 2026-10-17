// What goes into an account's saved copy: every app setting and log on the device, except the lookup cache
// (photos and online recipes, which come back from the internet on their own).
const PREFIX = 'yallawell:';
const SKIP = ['yallawell:c:'];
/** Above this the saved copy leaves out lab report photos so it stays small enough to send. */
export const MAX_BYTES = 4_000_000;

export type Backup = { v: 1; at: string; items: Record<string, string> };

export const backupKey = (k: string) => k.startsWith(PREFIX) && !SKIP.some((s) => k.startsWith(s));

export function makeBackup(rows: readonly (readonly [string, string | null])[], at = new Date().toISOString()): Backup {
  const items: Record<string, string> = {};
  for (const [k, v] of rows) if (v != null && backupKey(k)) items[k] = v;
  let size = Object.entries(items).reduce((n, [k, v]) => n + k.length + v.length, 0);
  if (size > MAX_BYTES) {
    for (const k of Object.keys(items)) {
      if (!k.startsWith('yallawell:labphoto:')) continue;
      size -= k.length + items[k].length;
      delete items[k];
    }
  }
  return { v: 1, at, items };
}

/** The same data, ignoring when it was made: tells whether anything changed since the last save. */
export const backupSig = (b: Backup) => JSON.stringify(Object.keys(b.items).sort().map((k) => [k, b.items[k]]));

/** True when the saved copy has a set-up profile in it (an account that was used before). */
export const hasProfile = (b: Backup | null | undefined) => !!b?.items?.['yallawell:profile'];
