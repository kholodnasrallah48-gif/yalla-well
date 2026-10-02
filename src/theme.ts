// Brand tokens: palette 34 "black & effort blue" (WHOOP spirit), light and dark.
// Names kept from the first palette: petrol = main accent (blue), lime = highlight (yellow), aqua = third data colour.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  petrol: '#1769D6', lime: '#FFD60A', aqua: '#19C37D', bg: '#EEF2F7', surface: '#FFFFFF',
  ink: '#0A0F16', muted: '#5B6676', line: '#DCE3EC', soft: '#E4EBF4',
  onPetrol: '#FFFFFF', onLime: '#0A0F16',
  ok: '#13804F', okBg: '#DBF4E8', warn: '#8A5A00', warnBg: '#FFF3C4', bad: '#C62839', badBg: '#FDE2E5',
  /** Gradients: screen background, card, dark hero card, main button. */
  gBg: ['#F7F9FC', '#E2E9F3'] as [string, string],
  gCard: ['#FFFFFF', '#F5F8FC'] as [string, string],
  gHero: ['#1A2940', '#0A111C'] as [string, string],
  gBtn: ['#3AA2FF', '#1769D6'] as [string, string],
  shadow: 'rgba(16,32,60,0.12)', glow: 'rgba(46,155,255,0.35)',
};
const dark: typeof light = {
  petrol: '#3D9BFF', lime: '#FFD60A', aqua: '#19E68C', bg: '#05080D', surface: '#111A26',
  ink: '#EEF3F8', muted: '#8C9AAD', line: '#1E2A3A', soft: '#1A2636',
  onPetrol: '#FFFFFF', onLime: '#0A0F16',
  ok: '#3FE0A0', okBg: '#0F2A22', warn: '#FFD60A', warnBg: '#2E2708', bad: '#FF5C6C', badBg: '#3A1219',
  gBg: ['#0F1826', '#04070B'] as [string, string],
  gCard: ['#152132', '#0D1520'] as [string, string],
  gHero: ['#1C3352', '#0B1422'] as [string, string],
  gBtn: ['#4DAAFF', '#1769D6'] as [string, string],
  shadow: 'rgba(0,0,0,0.55)', glow: 'rgba(61,155,255,0.45)',
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
