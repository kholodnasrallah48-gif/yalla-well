// Brand tokens: petrol & lime, light and dark. Fonts: Readex Pro (display) + IBM Plex Sans Arabic (body).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

const light = {
  petrol: '#0E4C5A', lime: '#A9BD2C', aqua: '#A7DCE3', bg: '#F1F6F7', surface: '#FFFFFF',
  ink: '#10242A', muted: '#5A6E74', line: '#D6E2E5', soft: '#E1EEF0',
  onPetrol: '#FFFFFF', onLime: '#10242A',
  ok: '#1B6B45', okBg: '#DDF3E6', warn: '#8A5A00', warnBg: '#FCEFD3', bad: '#A12C2C', badBg: '#FBE0E0',
};
const dark: typeof light = {
  petrol: '#4FB3C4', lime: '#C3D84A', aqua: '#2E6E7A', bg: '#0B1A1E', surface: '#12262B',
  ink: '#E6F0F2', muted: '#93A9AE', line: '#20393F', soft: '#183238',
  onPetrol: '#0B1A1E', onLime: '#10242A',
  ok: '#7FD6A6', okBg: '#16332A', warn: '#F2C46B', warnBg: '#33290F', bad: '#F29A9A', badBg: '#3A1C1C',
};
export type Colors = typeof light;

export const fonts = {
  display: 'ReadexPro_700Bold',
  displaySemi: 'ReadexPro_600SemiBold',
  body: 'IBMPlexSansArabic_400Regular',
  bodyMedium: 'IBMPlexSansArabic_500Medium',
  bodySemi: 'IBMPlexSansArabic_600SemiBold',
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
