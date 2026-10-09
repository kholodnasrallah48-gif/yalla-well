// App language: Arabic (default, right-to-left) or English (left-to-right).
// UI text is written inline as L('عربي', 'English'); data text (food, recipe and exercise names, steps...) stays
// Arabic in the data files and is looked up in the English dictionaries under ./en/ with tx().
import AsyncStorage from '@react-native-async-storage/async-storage';

import { EN_DATA } from './en/index.ts';

export type Lang = 'ar' | 'en';
const KEY = 'yallawell:lang';
let lang: Lang = 'ar';
const listeners = new Set<(l: Lang) => void>();

export const getLang = () => lang;
export const isEn = () => lang === 'en';
/** The text for the current language. */
export const L = (ar: string, en: string) => (lang === 'en' ? en : ar);
/** English for a piece of Arabic data text when the app is in English (falls back to the Arabic). */
export const tx = (ar: string) => (lang === 'en' ? EN_DATA[ar.trim()] ?? ar : ar);
/** Number in the app's digits: Arabic-Indic in Arabic, Western in English. */
export const num = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString(lang === 'en' ? 'en-US' : 'ar-EG', opts);

/** A typed number with Western digits: Arabic-Indic (٠-٩) and Persian (۰-۹) digits become 0-9 and the Arabic
 * decimal mark or a comma becomes a dot, so numbers can be typed on an Arabic or an English keyboard. */
export const latin = (s: string) => s
  .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660))
  .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x6f0))
  .replace(/[٫,،]/g, '.').replace(/٬/g, '');
/** The number a person typed (Arabic or Western digits), or NaN when it isn't one. */
export const toNum = (s: string | undefined | null) => {
  const t = latin(s ?? '').trim();
  return /^(\d+\.?\d*|\.\d+)$/.test(t) ? parseFloat(t) : NaN;
};

export function setLang(l: Lang) {
  lang = l;
  try { AsyncStorage.setItem(KEY, l).catch(() => {}); } catch { /* no storage (node tests) */ }
  listeners.forEach((f) => f(l));
}
export async function loadLang(): Promise<Lang> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === 'en' || v === 'ar') lang = v;
    else {
      // First open: start in the phone's language (Arabic phones in Arabic, everything else in English);
      // the first onboarding step lets the person pick.
      const { getLocales } = require('expo-localization') as typeof import('expo-localization');
      lang = getLocales()[0]?.languageCode === 'ar' ? 'ar' : 'en';
    }
  } catch { /* default Arabic */ }
  return lang;
}
export function onLangChange(f: (l: Lang) => void) { listeners.add(f); return () => { listeners.delete(f); }; }
