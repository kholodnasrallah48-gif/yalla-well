// Shared building blocks styled from the brand tokens.
import { isEn, L, setLang, tx } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGrad, Path, RadialGradient, Stop } from 'react-native-svg';
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
        {themeToggle ? (
          <View style={[styles.row, { gap: 10 }]}>
            <LangToggle />
            <ThemeToggle />
          </View>
        ) : null}
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

/** One soft glow that drifts slowly in a loop. */
function Orb({ color, size, top, left, dx, dy, ms, still }: { color: string; size: number; top: `${number}%`; left: `${number}%`; dx: number; dy: number; ms: number; still: boolean }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(t, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.sin), useNativeDriver: Platform.OS !== 'web' }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still]);
  const move = (d: number) => t.interpolate({ inputRange: [0, 1], outputRange: [0, d] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const id = `orb${size}${ms}`;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, left, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
      transform: [{ translateX: move(dx) }, { translateY: move(dy) }, { scale }] }}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/** Full-screen background: a gradient with two soft glows drifting behind the content (still when Reduce Motion is on). */
export function Bg({ children }: { children: ReactNode }) {
  const c = useColors();
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => sub.remove();
  }, []);
  return (
    <LinearGradient colors={c.gBg} start={{ x: 0, y: 0 }} end={{ x: 0.3, y: 1 }} style={{ flex: 1, overflow: 'hidden' }}>
      <Orb color={c.orbs[0]} size={460} top="8%" left="85%" dx={-70} dy={60} ms={9000} still={still} />
      <Orb color={c.orbs[1]} size={420} top="70%" left="10%" dx={80} dy={-70} ms={11000} still={still} />
      <Orb color={c.orbs[0]} size={300} top="105%" left="90%" dx={-50} dy={-60} ms={13000} still={still} />
      {children}
    </LinearGradient>
  );
}

/** Arabic / English switch, shown on the home page: one button naming the other language. */
export function LangToggle() {
  const c = useColors();
  const en = isEn();
  return (
    <Pressable onPress={() => { play('tap'); setLang(en ? 'ar' : 'en'); }} accessibilityRole="button"
      accessibilityLabel={en ? 'التطبيق بالعربي' : 'Switch to English'}
      style={({ pressed }) => [{ height: 40, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, flexDirection: 'row', alignItems: 'center', gap: 6 }, lift(c, 'sm'), pressed && styles.pressed]}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c.petrol} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Circle cx={12} cy={12} r={9} /><Path d="M3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z" />
      </Svg>
      <Text style={{ fontFamily: en ? fonts.bodyMedium : fonts.displaySemi, fontSize: 13.5, lineHeight: 18, color: c.ink }}>{en ? 'عربي' : 'English'}</Text>
    </Pressable>
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
    primary: { grad: c.gBtn, fg: c.onPetrol, border: 'transparent', shadow: lift(c, 'glow') },
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

/** Seven day tiles on a dark card: a dot shows gym (green), home (blue) or rest; today glows in the accent colour. */
export function WeekStrip({ profile, today }: { profile: Profile; today: number }) {
  const c = useColors();
  const places = weekPlaces(profile);
  return (
    <View style={[styles.row, { gap: 5 }]}>
      {WEEK_SHORT.map((w, i) => {
        const pl = places[i];
        const now = i === today;
        return (
          <View key={w} style={[styles.dayTile, { backgroundColor: now ? 'transparent' : 'rgba(255,255,255,0.07)', borderWidth: now ? 0 : 1, borderColor: 'rgba(255,255,255,0.08)' }, now && lift(c, 'glow')]}>
            {now ? <LinearGradient pointerEvents="none" colors={c.gBtn} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={[StyleSheet.absoluteFill, { borderRadius: 10 }]} /> : null}
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 10.5, color: now ? c.onPetrol : c.onHero }}>{tx(w)}</Text>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: placeColor(c, pl, now) }} />
          </View>
        );
      })}
    </View>
  );
}

/** Dot colour for a day's place; on the highlighted (accent) tile it switches to the text colour so it stays visible. */
export function placeColor(c: Colors, pl: string | undefined, onAccent = false) {
  if (pl === 'gym') return onAccent ? c.onPetrol : c.petrol;
  if (pl === 'home') return c.lime;
  return onAccent ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.22)';
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
  dayTile: { flex: 1, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 3 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
