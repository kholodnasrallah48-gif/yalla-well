// Shared building blocks for the calm look: rounded grouped panels, Alexandria headings, thin Inter numbers, round
// checks shaped like the champ's head, and pill buttons (white on black, black on light).
import { isEn, L, setLang, tx } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { WEEK, WEEK_SHORT } from '../lib/data.ts';
import { splitLabel, weekPlaces, weekSessions, type Note, type Profile } from '../lib/plan.ts';
import { fonts, useColors, useTheme, type Colors } from '../theme.ts';
import { Head, useStill } from './Mascot.tsx';
import { scrollers } from './TourTarget.tsx';

// Native forces RTL, which swaps left/right text alignment; web keeps physical sides under dir=rtl.
// Text alignment at the reading start / end. On phones the layout direction already mirrors 'left'/'right' in
// Arabic; on the web it doesn't. Functions, because the language can change while the app runs.
export const START = (): 'left' | 'right' => (isEn() || Platform.OS !== 'web' ? 'left' : 'right');
export const END = (): 'left' | 'right' => (START() === 'left' ? 'right' : 'left');
const native = Platform.OS !== 'web';
export const RADIUS = 12;
/** Corner of the grouped panels. */
export const CARD_R = 20;

export function T({ children, style, kind = 'body', color, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; kind?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'big' | 'label';
  color?: string; numberOfLines?: number;
}) {
  const c = useColors();
  const base = ({
    h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 40 },
    h2: { fontFamily: fonts.display, fontSize: 19, lineHeight: 29 },
    h3: { fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 24 },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24 },
    small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
    big: { fontFamily: fonts.num, fontSize: 48, lineHeight: 54, fontVariant: ['tabular-nums'] },
    label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 18 },
  } satisfies Record<string, TextStyle>)[kind];
  const defaultColor = kind === 'small' || kind === 'label' ? c.muted : c.ink;
  return <Text numberOfLines={numberOfLines} style={[base, { color: color ?? defaultColor, textAlign: START(), writingDirection: isEn() ? 'ltr' : 'rtl' }, style]}>{children}</Text>;
}

/** A scoreboard number (Latin digits: pass fmt() or String()). */
export function Num({ children, size = 26, color, weight = 'semi', style }: { children: ReactNode; size?: number; color?: string; weight?: 'semi' | 'black'; style?: StyleProp<TextStyle> }) {
  const c = useColors();
  return <Text style={[{ fontFamily: weight === 'black' ? fonts.num : fonts.numSemi, fontSize: size, lineHeight: Math.round(size * 1.05), color: color ?? c.ink, fontVariant: ['tabular-nums'], includeFontPadding: false }, style]}>{children}</Text>;
}

/** A number that counts up to its value when it first shows or changes. */
export function CountUp({ value, format, ...rest }: { value: number; format: (n: number) => string } & Omit<Parameters<typeof Num>[0], 'children'>) {
  const still = useStill();
  const [shown, setShown] = useState(still ? value : 0);
  const from = useRef(0);
  useEffect(() => {
    if (still) { setShown(value); return; }
    const a = from.current, t0 = Date.now(), ms = 700;
    const id = setInterval(() => {
      const k = Math.min(1, (Date.now() - t0) / ms);
      setShown(a + (value - a) * (1 - (1 - k) ** 3));
      if (k >= 1) { clearInterval(id); from.current = value; }
    }, 30);
    return () => { clearInterval(id); from.current = value; };
  }, [value, still]);
  return <Num {...rest}>{format(shown)}</Num>;
}

/** "— The captain says": the small accent kicker over a line. */
export function Kicker({ children, color }: { children: ReactNode; color?: string }) {
  const c = useColors();
  return (
    <View style={[styles.row, { gap: 6 }]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color ?? c.petrol }} />
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 17, color: c.muted }}>{children}</Text>
    </View>
  );
}

/** Comes in with a small rise and fade the first time it shows; `i` staggers a list. */
export function Rise({ children, i = 0, style }: { children: ReactNode; i?: number; style?: StyleProp<ViewStyle> }) {
  const still = useStill();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 420, delay: Math.min(i, 8) * 60, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
  }, []);
  if (still) return <View style={style}>{children}</View>;
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>{children}</Animated.View>;
}

function SquareBtn({ children, onPress, label, role, checked }: { children: ReactNode; onPress: () => void; label: string; role?: 'switch' | 'button'; checked?: boolean }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { play('tap'); onPress(); }} accessibilityRole={role ?? 'button'} accessibilityState={role === 'switch' ? { checked } : undefined} accessibilityLabel={label}
      style={({ pressed }) => [{ minWidth: 44, height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

function ThemeToggle() {
  const c = useColors();
  const { isDark, toggle } = useTheme();
  return (
    <SquareBtn onPress={toggle} role="switch" checked={isDark} label={L('الوضع الليلي', 'Dark mode')}>
      <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={c.ink} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        {isDark
          ? <><Circle cx={12} cy={12} r={4} /><Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>
          : <Path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />}
      </Svg>
    </SquareBtn>
  );
}

/** Arabic / English switch, shown on the home page: one button naming the other language. */
export function LangToggle() {
  const c = useColors();
  const en = isEn();
  return (
    <SquareBtn onPress={() => setLang(en ? 'ar' : 'en')} label={en ? 'التطبيق بالعربي' : 'Switch to English'}>
      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12.5, lineHeight: 18, color: c.ink }}>{en ? 'عربي' : 'EN'}</Text>
    </SquareBtn>
  );
}

const dateLine = () => {
  const d = new Date();
  return `${tx(WEEK[(d.getDay() + 1) % 7])} ${d.getDate()}/${d.getMonth() + 1}`;
};

export function Screen({ title, kicker, bigTitle, children, themeToggle, name, sub, aside, lead }: {
  title: string; children: ReactNode; themeToggle?: boolean;
  /** Small line above the title (e.g. the greeting when the title is the person's name). */
  kicker?: string;
  /** Larger title (used for the person's name). */
  bigTitle?: boolean;
  /** Line under the title (defaults to today's date). */
  sub?: string;
  /** The tab's name, so the tour can scroll it. */
  name?: string;
  /** Shown at the end of the header row (e.g. the workout clock). */
  aside?: ReactNode;
  /** Shown before the title, beside it (e.g. the story ring next to the name). */
  lead?: ReactNode;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const ref = useRef<ScrollView>(null);
  useEffect(() => {
    if (!name) return;
    scrollers.set(name, { view: ref.current, y: 0 });
    return () => { scrollers.delete(name); };
  }, [name]);
  return (
    <Bg>
    <ScrollView ref={ref} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 14, paddingBottom: 130, gap: 16 }} keyboardShouldPersistTaps="handled"
      scrollEventThrottle={32} onScroll={name ? (e) => { const s = scrollers.get(name); if (s) s.y = e.nativeEvent.contentOffset.y; } : undefined}>
      <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
        <View style={[styles.row, { flexShrink: 1, gap: 12 }]}>
          {lead}
          <View style={{ flexShrink: 1 }}>
            {kicker ? <T kind="small" color={c.muted}>{kicker}</T> : null}
            <T kind="h1" color={c.ink} style={bigTitle ? { fontSize: 30, lineHeight: 44 } : { fontSize: 32, lineHeight: 46 }} numberOfLines={1}>{title}</T>
            <T kind="label" color={c.muted} style={{ marginTop: 0 }}>{sub ?? dateLine()}</T>
          </View>
        </View>
        {aside}
        {themeToggle ? (
          <View style={[styles.row, { gap: 6, marginTop: 6 }]}>
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

/** Soft shadow, now only for things that float (the tour card, the button press). */
export function lift(c: Colors, size: 'sm' | 'md' | 'glow' = 'md'): ViewStyle {
  if (size === 'glow') return {};
  const v = { sm: `0px 2px 6px ${c.shadow}`, md: `0px 8px 22px ${c.shadow}` }[size];
  return { boxShadow: v } as ViewStyle;
}

/** Full-screen background: pure black (iOS light grey in light mode), nothing moving behind the content. */
export function Bg({ children }: { children: ReactNode }) {
  const c = useColors();
  return <View style={{ flex: 1, overflow: 'hidden', backgroundColor: c.bg }}>{children}</View>;
}

/** A rounded grouped panel. `tone="petrol"` is the same panel (kept for older calls); `tone="accent"` is the green block. */
export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'petrol' | 'accent' }) {
  const c = useColors();
  const look = tone === 'accent' ? { backgroundColor: c.petrol } : tone === 'petrol' ? { backgroundColor: c.panel } : { backgroundColor: c.surface };
  return <View style={[styles.card, look, style]}>{children}</View>;
}

/** Pill buttons with no shadow: the main one is white on black (black on light), the rest are quieter. */
export function Btn({ title, onPress, kind = 'primary', disabled, style, sound }: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'outline' | 'text' | 'dark'; disabled?: boolean; style?: StyleProp<ViewStyle>;
  sound?: 'add' | 'tap' | 'whistle' | 'swoosh' | 'win';
}) {
  const c = useColors();
  const look = {
    primary: { bg: c.ink, fg: c.onInk, border: c.ink },
    dark: { bg: '#000000', fg: '#F5F5F7', border: '#000000' },
    secondary: { bg: c.soft, fg: c.ink, border: c.soft },
    outline: { bg: 'transparent', fg: c.ink, border: c.dim },
    text: { bg: 'transparent', fg: c.muted, border: 'transparent' },
  }[kind];
  return (
    <Pressable accessibilityRole="button" onPress={() => { play(sound ?? (kind === 'primary' ? 'add' : 'tap')); onPress(); }} disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.4 : 1 }, pressed && !disabled && styles.pressed, style]}>
      <Text style={{ fontFamily: kind === 'text' ? fonts.bodyMedium : fonts.displaySemi, fontSize: 16, lineHeight: 22, color: look.fg, textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}

export function NoteView({ note }: { note: Note }) {
  const c = useColors();
  const tone = { info: [c.soft, c.petrol], warn: [c.warnBg, c.warn], bad: [c.badBg, c.bad] }[note.tone];
  return (
    <View style={[styles.note, { backgroundColor: tone[0] }]}>
      <View style={{ width: 3, alignSelf: 'stretch', backgroundColor: tone[1] }} />
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
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.soft} strokeWidth={stroke} />
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={value > max * 1.05 ? c.bad : c.petrol} strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={`${circ * pct} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
    </Svg>
  );
}

/** A ledger line: label, dotted leader, scoreboard number and "of target". */
export function Ledger({ label, value, of, unit, color }: { label: string; value: number | string; of?: string; unit?: string; color?: string }) {
  const c = useColors();
  return (
    <View style={[styles.row, { gap: 8, minHeight: 30 }]}>
      <T kind="body" style={{ fontSize: 14 }}>{label}</T>
      <View style={{ flex: 1, height: 1, borderBottomWidth: 1, borderStyle: 'dotted', borderColor: c.dim, opacity: 0.6, marginTop: 8 }} />
      <Num size={22} color={color}>{value}</Num>
      {of || unit ? <T kind="label" color={c.muted}>{of ? L(`من ${of}`, `of ${of}`) : ''}{unit ? ` ${unit}` : ''}</T> : null}
    </View>
  );
}

export function MacroBar({ label, value, target }: { label: string; value: number; target: number }) {
  const c = useColors();
  return <Ledger label={label} value={String(Math.round(value))} of={String(target)} unit={L('جم', 'g')} color={value > target * 1.1 ? c.bad : undefined} />;
}

/** A round check like the champ's head: a ring to tick, a filled dot with a tick mark once done. It pops when ticked. */
export function RoundCheck({ on, onPress, label, disabled, dashed, size = 26 }: { on: boolean; onPress: () => void; label: string; disabled?: boolean; dashed?: boolean; size?: number }) {
  const c = useColors();
  const s = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (on) Animated.sequence([
      Animated.timing(s, { toValue: 1.3, duration: 110, useNativeDriver: native }),
      Animated.spring(s, { toValue: 1, friction: 4, tension: 160, useNativeDriver: native }),
    ]).start();
  }, [on]);
  return (
    <Pressable disabled={disabled} onPress={onPress} hitSlop={9} accessibilityRole="checkbox" accessibilityLabel={label} accessibilityState={{ checked: on, disabled }}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.35 : 1, marginHorizontal: -8 }}>
      <Animated.View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', transform: [{ scale: s }],
        backgroundColor: on ? c.petrol : 'transparent', borderWidth: on ? 0 : 2.5, borderStyle: dashed && !on ? 'dashed' : 'solid', borderColor: c.petrol }}>
        {on ? <Svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke={c.onPetrol} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"><Path d="M5 12.5l4.5 4.5L19 7.5" /></Svg> : null}
      </Animated.View>
    </Pressable>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={() => { play('tap'); onPress(); }}
      style={({ pressed }) => [styles.chip, { borderColor: on ? c.ink : c.line, backgroundColor: on ? c.ink : c.surface }, pressed && styles.pressed]}>
      <Text style={{ fontFamily: on ? fonts.bodyMedium : fonts.body, fontSize: 14, lineHeight: 20, color: on ? c.onInk : c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** A segmented pick (one of a few), like the dumbbell / machine switch. */
export function Segmented<K extends string>({ items, value, onChange }: { items: [K, string][]; value: K | undefined; onChange: (k: K) => void }) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', backgroundColor: c.soft, borderRadius: 999, padding: 3, gap: 2 }}>
      {items.map(([k, l]) => {
        const on = value === k;
        return (
          <Pressable key={k} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { play('tap'); onChange(k); }}
            style={({ pressed }) => [{ flex: 1, minHeight: 36, paddingHorizontal: 8, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ink : 'transparent' }, pressed && { opacity: 0.8 }]}>
            <Text style={{ fontFamily: on ? fonts.displaySemi : fonts.body, fontSize: 13.5, lineHeight: 20, color: on ? c.onInk : c.ink, textAlign: 'center' }}>{l}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Choice({ title, sub, on, onPress, style }: { title: string; sub?: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { play('tap'); onPress(); }}
      style={({ pressed }) => [styles.choice, { borderColor: on ? c.ink : 'transparent', backgroundColor: c.surface, borderWidth: 1.5 }, pressed && styles.pressed, style]}>
      <View style={[styles.row, { gap: 10, alignItems: 'flex-start' }]}>
        <View style={{ marginTop: 6 }}><Head on={on} size={12} ring={c.dim} /></View>
        <View style={{ flex: 1 }}>
          <T kind="h3">{title}</T>
          {sub ? <T kind="small">{sub}</T> : null}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * The week as seven cells: day, workout and a head dot (filled once that day's workout is done). Today is the neon
 * block, rest days are dashed. Tap a day when `onSelect` is given; the selected one gets a thick outline.
 */
export function WeekStrip({ profile, today, done, sel, onSelect }: { profile: Profile; today: number; done?: boolean[]; sel?: number; onSelect?: (i: number) => void }) {
  const c = useColors();
  const places = weekPlaces(profile);
  const ses = weekSessions(profile);
  return (
    <View style={[styles.row, { gap: 4 }]}>
      {WEEK_SHORT.map((w, i) => {
        const pl = places[i];
        const now = i === today;
        const rest = pl === 'rest';
        const fg = now ? c.onInk : rest ? c.dim : c.ink;
        const label = rest ? L('راحة', 'Rest') : pl === 'home' ? L('بيت', 'Home') : splitLabel(ses[i]);
        const cell = (
          <View style={[styles.dayTile, { backgroundColor: now ? c.ink : rest ? 'transparent' : c.surface, borderWidth: rest && !now ? 1 : 0, borderStyle: 'dashed', borderColor: c.line },
            sel === i && { borderWidth: 2, borderColor: now ? c.petrol : c.ink, borderStyle: 'solid' }]}>
            <Text style={{ fontFamily: now ? fonts.displaySemi : fonts.body, fontSize: 10.5, lineHeight: 14, color: now ? c.onInk : c.muted }}>{tx(w)}</Text>
            <Text numberOfLines={1} style={{ fontFamily: rest ? fonts.body : fonts.displaySemi, fontSize: 11.5, lineHeight: 16, color: fg }}>{label}</Text>
            {rest ? <View style={{ height: 10 }} /> : <Head on={!!done?.[i]} size={10} color={c.petrol} ring={now ? c.onInk : c.dim} />}
          </View>
        );
        return onSelect ? (
          <Pressable key={w} style={{ flex: 1 }} onPress={() => { play('tap'); onSelect(i); }} accessibilityRole="button" accessibilityState={{ selected: sel === i }}
            accessibilityLabel={`${tx(WEEK[i])} ${label}${now ? L(' (النهارده)', ' (today)') : ''}`}>{cell}</Pressable>
        ) : <View key={w} style={{ flex: 1 }}>{cell}</View>;
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
  card: { borderRadius: CARD_R, padding: 16, gap: 10 },
  btn: { borderRadius: 999, paddingVertical: 12, paddingHorizontal: 22, borderWidth: 1, minHeight: 50, justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  note: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 12, paddingStart: 0, overflow: 'hidden' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 8 },
  track: { flex: 1, height: 8, borderRadius: 2, overflow: 'hidden' },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16 },
  choice: { borderRadius: 16, paddingVertical: 14, paddingHorizontal: 16, gap: 2 },
  dayTile: { height: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 3 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
