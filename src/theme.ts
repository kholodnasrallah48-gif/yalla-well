// Brand tokens for the calm, Apple-style look: pure black (or iOS light grey), charcoal grouped panels, white pill
// buttons, and the neon green kept for progress and done marks. Names kept from the first palette: petrol = main
// accent (green), lime = second accent (blue, home days), aqua = third data colour (amber). onHero = text on dark hero
// cards. dim = quieter text, faint = very soft fills. ink/onInk = the main button (white on black, black on light).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  petrol: '#0A8F55', lime: '#1A65C7', aqua: '#B26B00', bg: '#F2F2F7', surface: '#FFFFFF',
  ink: '#1D1D1F', muted: '#6E6E73', line: 'rgba(60,60,67,0.14)', soft: '#E9E9EE', dim: '#8A8A8F', faint: '#E5E5EA', panel: '#FFFFFF',
  onPetrol: '#FFFFFF', onLime: '#FFFFFF', onHero: '#FFFFFF', edge: '#076B40', onInk: '#FFFFFF', titanium: '#7A746B',
  ok: '#0A8F55', okBg: '#DDF3E7', warn: '#8A5A00', warnBg: '#FFF3C4', bad: '#D70015', badBg: '#FDE2E5',
  /** Flat fills kept as two-stop "gradients" for the few places that still take one. */
  gBg: ['#F2F2F7', '#F2F2F7'] as [string, string, ...string[]],
  gCard: ['#FFFFFF', '#FFFFFF'] as [string, string],
  gHero: ['#1D1D1F', '#1D1D1F'] as [string, string],
  gBtn: ['#1D1D1F', '#1D1D1F'] as [string, string],
  orbs: ['rgba(255,255,255,0)', 'rgba(255,255,255,0)'] as [string, string],
  shadow: 'rgba(0,0,0,0.08)', glow: 'rgba(10,143,85,0.25)',
  /** The floating tab bar. */
  bar: 'rgba(255,255,255,0.88)', barLine: 'rgba(0,0,0,0.08)',
};
const dark: typeof light = {
  petrol: '#19E68C', lime: '#3DA5FF', aqua: '#FFC23D', bg: '#000000', surface: '#1C1C1E',
  ink: '#F5F5F7', muted: '#A1A1A6', line: 'rgba(255,255,255,0.10)', soft: '#2C2C2E', dim: '#8E8E93', faint: '#1C1C1E', panel: '#1C1C1E',
  onPetrol: '#000000', onLime: '#FFFFFF', onHero: '#FFFFFF', edge: '#0A9C5B', onInk: '#000000', titanium: '#B5AFA6',
  ok: '#19E68C', okBg: '#0D2A1E', warn: '#FFD60A', warnBg: '#2E2708', bad: '#FF453A', badBg: '#3A1219',
  gBg: ['#000000', '#000000'] as [string, string, ...string[]],
  gCard: ['#1C1C1E', '#1C1C1E'] as [string, string],
  gHero: ['#1C1C1E', '#1C1C1E'] as [string, string],
  gBtn: ['#F5F5F7', '#F5F5F7'] as [string, string],
  orbs: ['rgba(0,0,0,0)', 'rgba(0,0,0,0)'] as [string, string],
  shadow: 'rgba(0,0,0,0.6)', glow: 'rgba(25,230,140,0.30)',
  bar: 'rgba(28,28,30,0.86)', barLine: 'rgba(255,255,255,0.10)',
};
export type Colors = typeof light;

export const fonts = {
  // Headings: Alexandria (modern geometric, Arabic and Latin). Small bold labels and buttons: Almarai ExtraBold.
  // Text: Almarai. Numbers: thin Inter, like a watch face (Latin digits only, so numbers go through fmt()).
  display: 'Alexandria_600SemiBold',
  displaySemi: 'Almarai_800ExtraBold',
  displayMedium: 'Almarai_700Bold',
  body: 'Almarai_400Regular',
  bodyMedium: 'Almarai_700Bold',
  bodySemi: 'Almarai_700Bold',
  num: 'Inter_200ExtraLight',
  numSemi: 'Inter_300Light',
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
