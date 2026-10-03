// Brand tokens: palette 33 "black & neon green" (WHOOP spirit), light and dark.
// Names kept from the first palette: petrol = main accent (neon green), lime = second accent (blue, home days),
// aqua = third data colour (amber). onHero = text on the dark hero cards.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  petrol: '#0A8F55', lime: '#2E86E8', aqua: '#F0A500', bg: '#EDF3F0', surface: '#FFFFFF',
  ink: '#07110D', muted: '#55665E', line: '#D6E2DC', soft: '#E1ECE6',
  onPetrol: '#FFFFFF', onLime: '#FFFFFF', onHero: '#FFFFFF',
  ok: '#0A8F55', okBg: '#D9F5E7', warn: '#8A5A00', warnBg: '#FFF3C4', bad: '#C62839', badBg: '#FDE2E5',
  /** Gradients: screen background, card, dark hero card, main button. */
  gBg: ['#F8FBF9', '#DCE8E2'] as [string, string],
  gCard: ['#FFFFFF', '#F3F8F5'] as [string, string],
  gHero: ['#173326', '#070D0A'] as [string, string],
  gBtn: ['#12B06A', '#0A8F55'] as [string, string],
  /** Soft moving glows behind every screen. */
  orbs: ['rgba(25,230,140,0.22)', 'rgba(46,155,255,0.16)'] as [string, string],
  shadow: 'rgba(10,40,25,0.12)', glow: 'rgba(25,200,120,0.35)',
};
const dark: typeof light = {
  petrol: '#19E68C', lime: '#2E9BFF', aqua: '#FFC23D', bg: '#040706', surface: '#0E1714',
  ink: '#EEF6F2', muted: '#8DA399', line: '#1A2A23', soft: '#13211B',
  onPetrol: '#03140B', onLime: '#FFFFFF', onHero: '#FFFFFF',
  ok: '#19E68C', okBg: '#0D2A1E', warn: '#FFD60A', warnBg: '#2E2708', bad: '#FF5C6C', badBg: '#3A1219',
  gBg: ['#0B1612', '#020403'] as [string, string],
  gCard: ['#12201A', '#0A120F'] as [string, string],
  gHero: ['#103A27', '#06110C'] as [string, string],
  gBtn: ['#4CF5A8', '#12C977'] as [string, string],
  orbs: ['rgba(25,230,140,0.14)', 'rgba(46,155,255,0.12)'] as [string, string],
  shadow: 'rgba(0,0,0,0.6)', glow: 'rgba(25,230,140,0.40)',
};
export type Colors = typeof light;

export const fonts = {
  // Headings and big numbers: Baloo Bhaijaan 2 (rounded, close to the logo's spirit). Text: Almarai (easy to read).
  display: 'BalooBhaijaan2_800ExtraBold',
  displaySemi: 'BalooBhaijaan2_700Bold',
  displayMedium: 'BalooBhaijaan2_600SemiBold',
  body: 'Almarai_400Regular',
  bodyMedium: 'Almarai_700Bold',
  bodySemi: 'Almarai_700Bold',
  /** Logo wordmark only. */
  brand: 'Rakkas_400Regular',
};

export type ThemePref = 'system' | 'light' | 'dark';
const THEME_KEY = 'yallawell:theme';
const ThemeCtx = createContext<{ pref: ThemePref; setPref: (p: ThemePref) => void }>({ pref: 'system', setPref: () => {} });

/** Keeps the person's light/dark choice; 'system' follows the phone. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('system');
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => { if (v === 'light' || v === 'dark') setPrefState(v); }).catch(() => {});
  }, []);
  const setPref = (p: ThemePref) => { setPrefState(p); AsyncStorage.setItem(THEME_KEY, p).catch(() => {}); };
  return createElement(ThemeCtx.Provider, { value: { pref, setPref } }, children);
}

export function useTheme() {
  const { pref, setPref } = useContext(ThemeCtx);
  const system = useColorScheme();
  const isDark = pref === 'system' ? system === 'dark' : pref === 'dark';
  return { isDark, pref, toggle: () => setPref(isDark ? 'light' : 'dark') };
}

export function useColors(): Colors {
  return useTheme().isDark ? dark : light;
}
