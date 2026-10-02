// Shared building blocks styled from the brand tokens.
import { isEn, L, setLang, tx } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Path, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

import { WEEK, WEEK_SHORT, SESSIONS, SCHEDULES } from '../lib/data.ts';
import { weekPlaces, type Note, type Profile } from '../lib/plan.ts';
import { fonts, useColors, useTheme, type Colors } from '../theme.ts';

// Native forces RTL, which swaps left/right text alignment; web keeps physical sides under dir=rtl.
// Text alignment at the reading start / end. On phones the layout direction already mirrors 'left'/'right' in
// Arabic; on the web it doesn't. Functions, because the language can change while the app runs.
export const START = (): 'left' | 'right' => (isEn() || Platform.OS !== 'web' ? 'left' : 'right');
export const END = (): 'left' | 'right' => (START() === 'left' ? 'right' : 'left');

export function T({ children, style, kind = 'body', color, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; kind?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'big' | 'label';
  color?: string; numberOfLines?: number;
}) {
  const c = useColors();
  const base = ({
    h1: { fontFamily: fonts.display, fontSize: 22, lineHeight: 36 },
    h2: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 30 },
    h3: { fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 26 },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24 },
    small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
    big: { fontFamily: fonts.display, fontSize: 28, lineHeight: 44, fontVariant: ['tabular-nums'] },
    label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 18 },
  } satisfies Record<string, TextStyle>)[kind];
  const defaultColor = kind === 'small' || kind === 'label' ? c.muted : c.ink;
  return <Text numberOfLines={numberOfLines} style={[base, { color: color ?? defaultColor, textAlign: START(), writingDirection: isEn() ? 'ltr' : 'rtl' }, style]}>{children}</Text>;
}

function ThemeToggle() {
  const c = useColors();
  const { isDark, toggle } = useTheme();
  return (
    <Pressable onPress={() => { play('tap'); toggle(); }} accessibilityRole="switch" accessibilityState={{ checked: isDark }} accessibilityLabel={L('الوضع الليلي', 'Dark mode')}
      style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 20, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center' }, lift(c, 'sm'), pressed && styles.pressed]}>
      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={c.petrol} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {isDark
          ? <><Circle cx={12} cy={12} r={4} /><Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </Svg>
    </Pressable>
  );
}

export function Screen({ title, children, themeToggle }: { title: string; children: ReactNode; themeToggle?: boolean }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const d = new Date();
  return (
    <Bg>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: 32, gap: 14 }} keyboardShouldPersistTaps="handled">
      <View style={styles.rowBetween}>
        <View style={{ flexShrink: 1 }}>
          <T kind="h1">{title}</T>
          <T kind="small">{tx(WEEK[(d.getDay() + 1) % 7])} {d.getDate()}/{d.getMonth() + 1}</T>
        </View>
        <View style={[styles.row, { gap: 10 }]}>
          <T kind="h3" color={c.petrol}>{L('يلا ويل', 'Yalla Well')}</T>
          {themeToggle ? <LangToggle /> : null}
          {themeToggle ? <ThemeToggle /> : null}
        </View>
      </View>
      {children}
    </ScrollView>
    </Bg>
  );
}

/** Soft shadow under cards and buttons. */
export function lift(c: Colors, size: 'sm' | 'md' | 'glow' = 'md'): ViewStyle {
  const v = { sm: `0px 2px 6px ${c.shadow}`, md: `0px 8px 22px ${c.shadow}`, glow: `0px 6px 16px ${c.glow}` }[size];
  return { boxShadow: v } as ViewStyle;
}

/** Full-screen background gradient; every screen sits on it. */
export function Bg({ children }: { children: ReactNode }) {
  const c = useColors();
  return <LinearGradient colors={c.gBg} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={{ flex: 1 }}>{children}</LinearGradient>;
}

/** Arabic / English switch, shown on the home page. */
export function LangToggle() {
  const c = useColors();
  const en = isEn();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', borderWidth: 1.5, borderColor: c.petrol, borderRadius: 99, overflow: 'hidden' }}>
      {([['ar', 'ع'], ['en', 'EN']] as const).map(([k, l]) => {
        const on = (k === 'en') === en;
        return (
          <Pressable key={k} onPress={() => { if (!on) { play('tap'); setLang(k); } }} accessibilityRole="radio" accessibilityState={{ selected: on }}
            accessibilityLabel={k === 'en' ? 'English' : 'العربي'}
            style={{ paddingHorizontal: 10, height: 30, justifyContent: 'center', backgroundColor: on ? c.petrol : 'transparent' }}>
            <Text style={{ fontFamily: k === 'en' ? fonts.displaySemi : fonts.bodyMedium, fontSize: 13, color: on ? c.onPetrol : c.petrol }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'petrol' }) {
  const c = useColors();
  const hero = tone === 'petrol';
  return (
    <View style={[styles.card, { backgroundColor: hero ? c.gHero[1] : c.surface, borderColor: hero ? 'rgba(255,255,255,0.08)' : c.line }, lift(c), style]}>
      <LinearGradient pointerEvents="none" colors={hero ? c.gHero : c.gCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
      {children}
    </View>
  );
}

export function Btn({ title, onPress, kind = 'primary', disabled, style }: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'outline' | 'text'; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const look = {
    primary: { grad: c.gBtn, fg: '#FFFFFF', border: 'transparent', shadow: lift(c, 'glow') },
    secondary: { grad: c.gHero, fg: '#FFFFFF', border: 'rgba(255,255,255,0.08)', shadow: lift(c) },
    outline: { grad: c.gCard, fg: c.petrol, border: c.petrol, shadow: lift(c, 'sm') },
    text: { grad: null, fg: c.muted, border: 'transparent', shadow: null },
  }[kind];
  return (
    <Pressable accessibilityRole="button" onPress={() => { play(kind === 'primary' ? 'add' : 'tap'); onPress(); }} disabled={disabled}
      style={({ pressed }) => [styles.btn, { borderColor: look.border, opacity: disabled ? 0.45 : 1 }, look.shadow, pressed && !disabled && styles.pressed, style]}>
      {look.grad ? <LinearGradient pointerEvents="none" colors={look.grad} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} /> : null}
      <Text style={{ fontFamily: fonts.display, fontSize: 15, color: look.fg, textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function NoteView({ note }: { note: Note }) {
  const c = useColors();
  const tone = { info: [c.soft, c.petrol], warn: [c.warnBg, c.warn], bad: [c.badBg, c.bad] }[note.tone];
  return (
    <View style={[styles.note, { backgroundColor: tone[0] }]}>
      <View style={[styles.dot, { backgroundColor: tone[1] }]} />
      <View style={{ flex: 1 }}>
        <T kind="h3">{note.title}</T>
        <T kind="small" color={c.ink}>{note.text}</T>
      </View>
    </View>
  );
}

export function Ring({ value, max, size = 104, stroke = 12 }: { value: number; max: number; size?: number; stroke?: number }) {
  const c = useColors();
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, max ? value / max : 0);
  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgGrad id="ring" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={c.gBtn[0]} /><Stop offset="1" stopColor={c.gBtn[1]} />
        </SvgGrad>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.soft} strokeWidth={stroke} />
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={value > max * 1.05 ? c.bad : 'url(#ring)'} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
  );
}

export function MacroBar({ label, value, target }: { label: string; value: number; target: number }) {
  const c = useColors();
  return (
    <View style={[styles.row, { gap: 8 }]}>
      <T kind="small" color={c.ink} style={{ width: 52 }}>{label}</T>
      <View style={[styles.track, { backgroundColor: c.soft }]}>
        <LinearGradient colors={c.gBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: `${Math.min(100, target ? (value / target) * 100 : 0)}%`, height: '100%', borderRadius: 99 }} />
      </View>
      <T kind="small" style={{ width: 78, textAlign: END(), fontVariant: ['tabular-nums'] }}>{Math.round(value)} / {target} {L('جم', 'g')}</T>
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => { play('tap'); onPress(); }}
      style={({ pressed }) => [styles.chip, { borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : c.surface }, on ? lift(c, 'glow') : lift(c, 'sm'), pressed && styles.pressed]}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: on ? c.onPetrol : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Choice({ title, sub, on, onPress, style }: { title: string; sub?: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { play('tap'); onPress(); }}
      style={({ pressed }) => [styles.choice, { borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.soft : c.surface, borderWidth: on ? 2 : 1.5 }, lift(c, on ? 'glow' : 'sm'), pressed && styles.pressed, style]}>
      <T kind="h3">{title}</T>
      {sub ? <T kind="small">{sub}</T> : null}
    </Pressable>
  );
}

/** Seven small day tiles: dark = gym, lime = home, empty = rest. */
export function WeekStrip({ profile, today }: { profile: Profile; today: number }) {
  const c = useColors();
  const places = weekPlaces(profile);
  return (
    <View style={[styles.row, { gap: 5 }]}>
      {WEEK_SHORT.map((w, i) => {
        const pl = places[i];
        const bg = pl === 'gym' ? c.bg : pl === 'home' ? c.lime : 'rgba(255,255,255,0.16)';
        const fg = pl === 'gym' ? c.petrol : pl === 'home' ? c.onLime : c.onPetrol;
        return (
          <View key={w} style={[styles.dayTile, { backgroundColor: bg, borderWidth: i === today ? 2 : 0, borderColor: c.lime }]}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 10.5, color: fg }}>{tx(w)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 8 },
  btn: { borderRadius: 14, paddingVertical: 13, paddingHorizontal: 18, borderWidth: 1.5 },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  note: { flexDirection: 'row', gap: 10, borderRadius: 14, padding: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 8 },
  track: { flex: 1, height: 8, borderRadius: 99, overflow: 'hidden' },
  chip: { borderWidth: 1.5, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 14 },
  choice: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  dayTile: { flex: 1, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
