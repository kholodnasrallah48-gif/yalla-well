// Brand tokens: black-and-grey surfaces (WHOOP-like) with palette 33 "black & neon green" (WHOOP spirit), light and dark.
// Names kept from the first palette: petrol = main accent (neon green), lime = second accent (blue, home days),
// aqua = third data colour (amber). onHero = text on the dark hero cards.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  petrol: '#087A48', lime: '#1A65C7', aqua: '#B26B00', bg: '#F2F3F4', surface: '#FFFFFF',
  ink: '#0B0D0E', muted: '#5C6368', line: '#DDE0E3', soft: '#EBEDEF',
  onPetrol: '#FFFFFF', onLime: '#FFFFFF', onHero: '#FFFFFF',
  ok: '#087A48', okBg: '#D9F5E7', warn: '#8A5A00', warnBg: '#FFF3C4', bad: '#C62839', badBg: '#FDE2E5',
  /** Gradients: screen background, card, dark hero card, main button. */
  gBg: ['#FFFFFF', '#F3F4F5', '#E6E8EA'] as [string, string, ...string[]],
  gCard: ['#FFFFFF', '#F7F8F9'] as [string, string],
  gHero: ['#2A2E32', '#0D0F10'] as [string, string],
  gBtn: ['#0E9A5C', '#087A48'] as [string, string],
  /** Soft moving glows behind every screen. */
  orbs: ['rgba(255,255,255,0.9)', 'rgba(170,178,186,0.18)'] as [string, string],
  shadow: 'rgba(15,20,25,0.10)', glow: 'rgba(25,200,120,0.35)',
};
const dark: typeof light = {
  petrol: '#19E68C', lime: '#3DA5FF', aqua: '#FFC23D', bg: '#000000', surface: '#111315',
  ink: '#F3F4F5', muted: '#9CA2A8', line: '#23272B', soft: '#181B1E',
  onPetrol: '#03140B', onLime: '#FFFFFF', onHero: '#FFFFFF',
  ok: '#19E68C', okBg: '#0D2A1E', warn: '#FFD60A', warnBg: '#2E2708', bad: '#FF5C6C', badBg: '#3A1219',
  gBg: ['#1C1F22', '#0C0D0F', '#000000', '#000000'] as [string, string, ...string[]],
  gCard: ['#17191C', '#0E0F11'] as [string, string],
  gHero: ['#24282C', '#0A0B0C'] as [string, string],
  gBtn: ['#4CF5A8', '#12C977'] as [string, string],
  orbs: ['rgba(214,222,230,0.07)', 'rgba(25,230,140,0.035)'] as [string, string],
  shadow: 'rgba(0,0,0,0.7)', glow: 'rgba(25,230,140,0.40)',
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

/** Keeps the person's light/dark choice; the app starts in dark (the brand is black) until they switch. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [pref, setPrefState] = useState<ThemePref>('dark');
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => { if (v === 'light' || v === 'dark' || v === 'system') setPrefState(v); }).catch(() => {});
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
