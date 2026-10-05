// Text the person types (doctor's advice, other conditions, foods that upset them...) is shown in the app's
// language. It is translated once with the free MyMemory API when the profile is saved, and the translation is kept
// on the profile (Profile.tr) so it shows offline. Until then the original text is shown, marked as their own words.
import { getLang, type Lang } from './i18n.ts';
import type { Profile } from './plan.ts';

const ARABIC = /[؀-ۿ]/;

/** The language a piece of text is written in, by its script: any Arabic letter makes it Arabic. */
export const scriptOf = (s: string): Lang => (ARABIC.test(s) ? 'ar' : 'en');

/** Whether the text needs translating to show in this language (it has letters and is in the other script). */
export const needsTr = (s: string, lang: Lang = getLang()) => /\p{L}/u.test(s) && scriptOf(s) !== lang;

/** Every free-text answer on the profile, trimmed, without blanks or repeats. */
export function freeTexts(p: Profile): string[] {
  const all = [p.doctorSaid, p.otherCond, p.otherMeds, p.otherPain, ...Object.values(p.condInfo ?? {}).map((c) => c?.trigger), ...Object.values(p.medPlan ?? {}).map((m) => m?.name)];
  return [...new Set(all.map((s) => s?.trim() ?? '').filter(Boolean))];
}

/** The person's text in the app's language: the saved translation when it's in the other script, else as typed. */
export function ux(p: Pick<Profile, 'tr'>, text: string | undefined, lang: Lang = getLang()): string {
  const t = text?.trim() ?? '';
  return needsTr(t, lang) ? p.tr?.[t] ?? t : t;
}

/** Whether ux() would show the text as typed in a different script (no translation saved yet). */
export const untranslated = (p: Pick<Profile, 'tr'>, text: string | undefined, lang: Lang = getLang()) => {
  const t = text?.trim() ?? '';
  return needsTr(t, lang) && !p.tr?.[t];
};

/**
 * The person's text ready to quote inside a sentence. Arabic shows it as is (in the app language when translated).
 * English puts it in quotes, and when there's no translation yet adds "(in your words)" so the Arabic reads as
 * a quote rather than a broken sentence.
 */
export function quoteUx(p: Pick<Profile, 'tr'>, text: string | undefined, lang: Lang = getLang()): string {
  const t = ux(p, text, lang);
  if (lang !== 'en') return t;
  return untranslated(p, text, lang) ? `"${t}" (in your words)` : `"${t}"`;
}

/** Translates one short text between Arabic and English with MyMemory; null when offline or it fails. */
export async function translate(text: string, to?: Lang, timeoutMs = 8000): Promise<string | null> {
  const t = text.trim();
  if (!t) return null;
  const from = scriptOf(t);
  const target = to ?? (from === 'ar' ? 'en' : 'ar');
  if (target === from) return t;
  const ok = (out: string | null | undefined) => {
    const o = out?.trim();
    // Reject quota/error messages, markup leaking from subtitle memories, and replies in the wrong script.
    if (!o || /MYMEMORY|INVALID|QUERY LENGTH|[{}\\]/i.test(o) || scriptOf(o) !== target) return null;
    return o;
  };
  // Google Translate's free web endpoint first (handles Egyptian Arabic well), MyMemory as a fallback.
  const g = await getJSON<unknown[]>(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${target}&dt=t&q=${encodeURIComponent(t)}`, timeoutMs);
  const parts = Array.isArray(g?.[0]) ? (g![0] as unknown[]).map((x) => (Array.isArray(x) && typeof x[0] === 'string' ? x[0] : '')).join('') : null;
  const first = ok(parts);
  if (first) return first;
  const m = await getJSON<{ responseStatus?: number | string; responseData?: { translatedText?: string } }>(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(t)}&langpair=${from}|${target}`, timeoutMs);
  return m && Number(m.responseStatus) === 200 ? ok(m.responseData?.translatedText) : null;
}

async function getJSON<T>(url: string, ms: number): Promise<T | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Translations for the profile's free text that aren't saved yet. Returns the new entries (original -> other
 * language), or null when there's nothing new (all done, offline...).
 */
export async function translateMissing(p: Profile, tr = translate): Promise<Record<string, string> | null> {
  const todo = freeTexts(p).filter((s) => /\p{L}/u.test(s) && !p.tr?.[s]);
  if (!todo.length) return null;
  const got: Record<string, string> = {};
  for (const s of todo) {
    const out = await tr(s);
    if (out) got[s] = out;
  }
  return Object.keys(got).length ? got : null;
}

/** Keeps only the translations of text the profile still has, plus the new ones. */
export function withTr(p: Profile, add: Record<string, string>): Profile {
  const keep = new Set(freeTexts(p));
  const tr: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...p.tr, ...add })) if (keep.has(k)) tr[k] = v;
  return { ...p, tr };
}
