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

export function setLang(l: Lang) {
  lang = l;
  AsyncStorage.setItem(KEY, l).catch(() => {});
  listeners.forEach((f) => f(l));
}
export async function loadLang(): Promise<Lang> {
  try { const v = await AsyncStorage.getItem(KEY); if (v === 'en' || v === 'ar') lang = v; } catch { /* default Arabic */ }
  return lang;
}
export function onLangChange(f: (l: Lang) => void) { listeners.add(f); return () => { listeners.delete(f); }; }
