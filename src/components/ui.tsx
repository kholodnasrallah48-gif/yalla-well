// Shared building blocks styled from the brand tokens.
import type { ReactNode } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { WEEK, WEEK_SHORT, SESSIONS, SCHEDULES } from '../lib/data.ts';
import type { Note, Profile } from '../lib/plan.ts';
import { fonts, useColors } from '../theme.ts';

// Native forces RTL, which swaps left/right text alignment; web keeps physical sides under dir=rtl.
export const START = Platform.OS === 'web' ? 'right' : 'left';
export const END = Platform.OS === 'web' ? 'left' : 'right';

export function T({ children, style, kind = 'body', color, numberOfLines }: {
  children: ReactNode; style?: StyleProp<TextStyle>; kind?: 'h1' | 'h2' | 'h3' | 'body' | 'small' | 'big' | 'label';
  color?: string; numberOfLines?: number;
}) {
  const c = useColors();
  const base = ({
    h1: { fontFamily: fonts.display, fontSize: 22, lineHeight: 32 },
    h2: { fontFamily: fonts.displaySemi, fontSize: 17, lineHeight: 26 },
    h3: { fontFamily: fonts.displaySemi, fontSize: 15, lineHeight: 22 },
    body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 24 },
    small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20 },
    big: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, fontVariant: ['tabular-nums'] },
    label: { fontFamily: fonts.bodyMedium, fontSize: 12.5, lineHeight: 18 },
  } satisfies Record<string, TextStyle>)[kind];
  const defaultColor = kind === 'small' || kind === 'label' ? c.muted : c.ink;
  return <Text numberOfLines={numberOfLines} style={[base, { color: color ?? defaultColor, textAlign: START, writingDirection: 'rtl' }, style]}>{children}</Text>;
}

export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const d = new Date();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 12, paddingBottom: 32, gap: 12 }} keyboardShouldPersistTaps="handled">
      <View style={styles.rowBetween}>
        <View style={{ flexShrink: 1 }}>
          <T kind="h1">{title}</T>
          <T kind="small">{WEEK[(d.getDay() + 1) % 7]} {d.getDate()}/{d.getMonth() + 1}</T>
        </View>
        <T kind="h3" color={c.petrol}>يلا ويل</T>
      </View>
      {children}
    </ScrollView>
  );
}

export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'petrol' }) {
  const c = useColors();
  const bg = tone === 'petrol' ? { backgroundColor: c.petrol, borderColor: c.petrol } : { backgroundColor: c.surface, borderColor: c.line };
  return <View style={[styles.card, bg, style]}>{children}</View>;
}

export function Btn({ title, onPress, kind = 'primary', disabled, style }: {
  title: string; onPress: () => void; kind?: 'primary' | 'secondary' | 'outline' | 'text'; disabled?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const look = {
    primary: { bg: c.lime, fg: c.onLime, border: c.lime },
    secondary: { bg: c.petrol, fg: c.onPetrol, border: c.petrol },
    outline: { bg: 'transparent', fg: c.petrol, border: c.petrol },
    text: { bg: 'transparent', fg: c.muted, border: 'transparent' },
  }[kind];
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [styles.btn, { backgroundColor: look.bg, borderColor: look.border, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 }, style]}>
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
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c.soft} strokeWidth={stroke} />
      <Circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={value > max * 1.05 ? c.bad : c.petrol} strokeWidth={stroke}
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
        <View style={{ width: `${Math.min(100, target ? (value / target) * 100 : 0)}%`, height: '100%', borderRadius: 99, backgroundColor: c.petrol }} />
      </View>
      <T kind="small" style={{ width: 78, textAlign: END, fontVariant: ['tabular-nums'] }}>{Math.round(value)} / {target} جم</T>
    </View>
  );
}

export function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: on }} onPress={onPress}
      style={[styles.chip, { borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : c.surface }]}>
      <Text style={{ fontFamily: fonts.body, fontSize: 14, color: on ? c.onPetrol : c.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Choice({ title, sub, on, onPress, style }: { title: string; sub?: string; on: boolean; onPress: () => void; style?: StyleProp<ViewStyle> }) {
  const c = useColors();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} onPress={onPress}
      style={[styles.choice, { borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.soft : c.surface, borderWidth: on ? 2 : 1.5 }, style]}>
      <T kind="h3">{title}</T>
      {sub ? <T kind="small">{sub}</T> : null}
    </Pressable>
  );
}

/** Seven small day tiles: dark = gym, lime = home, empty = rest. */
export function WeekStrip({ profile, today }: { profile: Profile; today: number }) {
  const c = useColors();
  const map = SCHEDULES[profile.schedule].map;
  return (
    <View style={[styles.row, { gap: 5 }]}>
      {WEEK_SHORT.map((w, i) => {
        const s = map[i];
        const pl = s ? SESSIONS[s].pl : null;
        const bg = pl === 'gym' ? c.bg : pl === 'home' ? c.lime : 'rgba(255,255,255,0.16)';
        const fg = pl === 'gym' ? c.petrol : pl === 'home' ? c.onLime : c.onPetrol;
        return (
          <View key={w} style={[styles.dayTile, { backgroundColor: bg, borderWidth: i === today ? 2 : 0, borderColor: c.lime }]}>
            <Text style={{ fontFamily: fonts.bodySemi, fontSize: 10.5, color: fg }}>{w}</Text>
          </View>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, gap: 8 },
  btn: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 18, borderWidth: 1.5 },
  note: { flexDirection: 'row', gap: 10, borderRadius: 14, padding: 12 },
  dot: { width: 9, height: 9, borderRadius: 5, marginTop: 8 },
  track: { flex: 1, height: 8, borderRadius: 99, overflow: 'hidden' },
  chip: { borderWidth: 1.5, borderRadius: 99, paddingVertical: 6, paddingHorizontal: 14 },
  choice: { borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, gap: 2 },
  dayTile: { flex: 1, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
