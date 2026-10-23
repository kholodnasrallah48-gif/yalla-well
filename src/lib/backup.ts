// What goes into an account's saved copy: every app setting and log on the device, except the lookup cache
// (photos and online recipes, which come back from the internet on their own) and lab paper photos kept by older
// versions (no longer used).
const PREFIX = 'yallawell:';
/** Lab paper photos saved by older versions of the app, one key each. Ignored, and cleared once on launch. */
export const OLD_LAB_PHOTO = 'yallawell:labphoto:';
const SKIP = ['yallawell:c:', OLD_LAB_PHOTO];

export type Backup = { v: 1; at: string; items: Record<string, string> };

export const backupKey = (k: string) => k.startsWith(PREFIX) && !SKIP.some((s) => k.startsWith(s));

export function makeBackup(rows: readonly (readonly [string, string | null])[], at = new Date().toISOString()): Backup {
  const items: Record<string, string> = {};
  for (const [k, v] of rows) if (v != null && backupKey(k)) items[k] = v;
  return { v: 1, at, items };
}

/** The same data, ignoring when it was made: tells whether anything changed since the last save. */
export const backupSig = (b: Backup) => JSON.stringify(Object.keys(b.items).sort().map((k) => [k, b.items[k]]));

/** The rows of a saved copy to write back on the phone (copies saved by older versions may hold lab photos). */
export const restoreRows = (b: Backup): [string, string][] => Object.entries(b.items).filter(([k]) => backupKey(k));

/** True when the saved copy has a set-up profile in it (an account that was used before). */
export const hasProfile = (b: Backup | null | undefined) => !!b?.items?.['yallawell:profile'];
