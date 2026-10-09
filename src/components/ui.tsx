// Shared building blocks for the "match" look: hairline panels, poster headings (Lalezar), scoreboard numbers
// (Big Shoulders), round checks shaped like the champ's head, and buttons that press down like real keys.
import { isEn, L, setLang, tx } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

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
export const RADIUS = 4;

export function T({ children, style, kind = 'body', color, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; kind?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'big' | 'label';
  color?: string; numberOfLines?: number;
}) {
  const c = useColors();
  const base = ({
    h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 42 },
    h2: { fontFamily: fonts.display, fontSize: 21, lineHeight: 32 },
    h3: { fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 24 },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24 },
    small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
    big: { fontFamily: fonts.num, fontSize: 44, lineHeight: 50, fontVariant: ['tabular-nums'] },
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
      <View style={{ width: 10, height: 3, backgroundColor: color ?? c.petrol }} />
      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 11.5, lineHeight: 16, color: color ?? c.petrol }}>{children}</Text>
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
      style={({ pressed }) => [{ minWidth: 40, height: 36, paddingHorizontal: 10, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6 }, pressed && styles.pressed]}>
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

export function Screen({ title, kicker, bigTitle, children, themeToggle, name, sub, aside }: {
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
    <ScrollView ref={ref} style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 18, paddingTop: insets.top + 12, paddingBottom: 40, gap: 14 }} keyboardShouldPersistTaps="handled"
      scrollEventThrottle={32} onScroll={name ? (e) => { const s = scrollers.get(name); if (s) s.y = e.nativeEvent.contentOffset.y; } : undefined}>
      <View style={[styles.rowBetween, { alignItems: 'flex-start' }]}>
        <View style={{ flexShrink: 1 }}>
          {kicker ? <T kind="small" color={c.muted}>{kicker}</T> : null}
          <T kind="h1" color={c.ink} style={bigTitle ? { fontSize: 34, lineHeight: 50 } : { fontSize: 32, lineHeight: 48 }} numberOfLines={1}>{title}</T>
          <T kind="label" color={c.dim} style={{ marginTop: -4 }}>{sub ?? dateLine()}</T>
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

/** One soft glow that drifts slowly in a loop; the colour fades out gradually so there are no edges. */
function Orb({ color, size, top, left, dx, dy, ms, still, squash = 1 }: { color: string; size: number; top: `${number}%`; left: `${number}%`; dx: number; dy: number; ms: number; still: boolean; squash?: number }) {
  const t = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (still) return;
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(t, { toValue: 1, duration: ms, easing: ease, useNativeDriver: native }),
      Animated.timing(t, { toValue: 0, duration: ms, easing: ease, useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still]);
  const move = (d: number) => t.interpolate({ inputRange: [0, 1], outputRange: [0, d] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [1, 1.1] });
  const opacity = t.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.85, 1, 0.85] });
  const id = `orb${size}${ms}`;
  return (
    <Animated.View pointerEvents="none" style={{ position: 'absolute', top, left, width: size, height: size * squash, marginLeft: -size / 2, marginTop: (-size * squash) / 2, opacity,
      transform: [{ translateX: move(dx) }, { translateY: move(dy) }, { scale }] }}>
      <Svg width={size} height={size * squash}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0" stopColor={color} stopOpacity={1} />
            <Stop offset="0.35" stopColor={color} stopOpacity={0.55} />
            <Stop offset="0.7" stopColor={color} stopOpacity={0.14} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size * squash} fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Full-screen background: pure black with a very soft charcoal light at the top that breathes slowly (white to light
 * grey in light mode). Still when Reduce Motion is on.
 */
export function Bg({ children }: { children: ReactNode }) {
  const c = useColors();
  const still = useStill();
  return (
    <LinearGradient colors={c.gBg} locations={c.gBg.length === 4 ? [0, 0.3, 0.6, 1] : undefined} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={{ flex: 1, overflow: 'hidden' }}>
      <Orb color={c.orbs[0]} size={820} squash={0.5} top="0%" left="50%" dx={0} dy={10} ms={9000} still={still} />
      <Orb color={c.orbs[1]} size={600} top="100%" left="100%" dx={-30} dy={-20} ms={16000} still={still} />
      {children}
    </LinearGradient>
  );
}

/** A hairline panel. `tone="petrol"` is the darker panel used for the plan; `tone="accent"` is the neon block. */
export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'petrol' | 'accent' }) {
  const c = useColors();
  const look = tone === 'accent' ? { backgroundColor: c.petrol, borderColor: c.petrol } : tone === 'petrol' ? { backgroundColor: c.panel, borderColor: c.line } : { backgroundColor: c.surface, borderColor: c.line };
  return <View style={[styles.card, look, style]}>{children}</View>;
}

/** Buttons look like keys: a solid face with a darker edge underneath that disappears when pressed. */
export function Btn({ title, onPress, kind = 'primary', disabled, style, sound }: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'outline' | 'text' | 'dark'; disabled?: boolean; style?: StyleProp<ViewStyle>;
  sound?: 'add' | 'tap' | 'whistle' | 'swoosh' | 'win';
}) {
  const c = useColors();
  const look = {
    primary: { bg: c.petrol, fg: c.onPetrol, border: c.petrol, edge: c.edge },
    dark: { bg: '#000000', fg: c.petrol, border: '#000000', edge: '#000000' },
    secondary: { bg: c.soft, fg: c.ink, border: c.line, edge: c.line },
    outline: { bg: 'transparent', fg: c.petrol, border: c.petrol, edge: c.petrol },
    text: { bg: 'transparent', fg: c.muted, border: 'transparent', edge: 'transparent' },
  }[kind];
  const key = kind === 'primary' || kind === 'secondary';
  return (
    <Pressable accessibilityRole="button" onPress={() => { play(sound ?? (kind === 'primary' ? 'add' : 'tap')); onPress(); }} disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: look.bg, borderColor: look.border, borderBottomColor: look.edge, borderBottomWidth: key ? 4 : 1.5, opacity: disabled ? 0.45 : 1 },
        pressed && !disabled && (key ? { transform: [{ translateY: 2 }], borderBottomWidth: 2, marginBottom: 2 } : styles.pressed), style]}>
      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 22, color: look.fg, textAlign: 'center' }}>{title}</Text>
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
        strokeDasharray={`${circ * pct} ${circ}`} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
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
      style={({ pressed }) => [styles.chip, { borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : 'transparent' }, pressed && styles.pressed]}>
      <Text style={{ fontFamily: on ? fonts.bodyMedium : fonts.body, fontSize: 14, lineHeight: 20, color: on ? c.onPetrol : c.ink }}>{label}</Text>
    </Pressable>
  );
}

/** A segmented pick (one of a few), like the dumbbell / machine switch. */
export function Segmented<K extends string>({ items, value, onChange }: { items: [K, string][]; value: K | undefined; onChange: (k: K) => void }) {
  const c = useColors();
  return (
    <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', borderWidth: 1, borderColor: c.line, borderRadius: RADIUS, overflow: 'hidden' }}>
      {items.map(([k, l], i) => {
        const on = value === k;
        return (
          <Pressable key={k} accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={() => { play('tap'); onChange(k); }}
            style={({ pressed }) => [{ flex: 1, minHeight: 38, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ink : 'transparent', borderStartWidth: i ? 1 : 0, borderColor: c.line }, pressed && { opacity: 0.8 }]}>
            <Text style={{ fontFamily: on ? fonts.displaySemi : fonts.body, fontSize: 13.5, lineHeight: 20, color: on ? c.bg : c.ink, textAlign: 'center' }}>{l}</Text>
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
      style={({ pressed }) => [styles.choice, { borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.soft : 'transparent', borderWidth: on ? 2 : 1 }, pressed && styles.pressed, style]}>
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
        const fg = now ? c.onPetrol : rest ? c.dim : c.ink;
        const label = rest ? L('راحة', 'Rest') : pl === 'home' ? L('بيت', 'Home') : splitLabel(ses[i]);
        const cell = (
          <View style={[styles.dayTile, { backgroundColor: now ? c.petrol : 'transparent', borderWidth: now ? 0 : 1, borderStyle: rest && !now ? 'dashed' : 'solid', borderColor: c.line },
            sel === i && { borderWidth: 2, borderColor: now ? c.ink : c.petrol, borderStyle: 'solid' }]}>
            <Text style={{ fontFamily: now ? fonts.displaySemi : fonts.body, fontSize: 10.5, lineHeight: 14, color: now ? c.onPetrol : c.muted }}>{tx(w)}</Text>
            <Text numberOfLines={1} style={{ fontFamily: rest ? fonts.body : fonts.displaySemi, fontSize: 11.5, lineHeight: 16, color: fg }}>{label}</Text>
            {rest ? <View style={{ height: 10 }} /> : <Head on={!!done?.[i]} size={10} color={now ? c.onPetrol : c.petrol} ring={now ? c.onPetrol : c.dim} />}
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
  card: { borderRadius: RADIUS, borderWidth: 1, padding: 14, gap: 8 },
  btn: { borderRadius: RADIUS, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1.5, minHeight: 48, justifyContent: 'center' },
  pressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  note: { flexDirection: 'row', gap: 10, borderRadius: RADIUS, padding: 12, paddingStart: 0, overflow: 'hidden' },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 8 },
  track: { flex: 1, height: 8, borderRadius: 2, overflow: 'hidden' },
  chip: { borderWidth: 1, borderRadius: RADIUS, paddingVertical: 7, paddingHorizontal: 14 },
  choice: { borderRadius: RADIUS, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  dayTile: { height: 62, borderRadius: RADIUS, alignItems: 'center', justifyContent: 'center', gap: 3 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
