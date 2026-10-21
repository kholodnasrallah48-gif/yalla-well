// Pieces shared by the screens: the captain's card, the day's meal bar and the row of numbers.
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Text, View } from 'react-native';

import { fonts, useColors } from '../theme.ts';
import { type Pose } from './Mascot.tsx';
import { CARD_R, Kicker, Num, T, styles } from './ui.tsx';
import { L } from '../lib/i18n.ts';

/**
 * The captain's card: what he says, on a rounded panel. In the calm look the champ stays in the logo, so the card is
 * words only; `pose`, `big`, `caption` and `excited` are kept so the screens don't change. `big` shows as a small
 * thin number at the end of the kicker line (day number, exercise number).
 */
export function CaptainCard({ head, body, big, caption, height = 0, children }: {
  head?: string; body?: string; pose: Pose;
  big?: string; caption?: string; height?: number; excited?: boolean; children?: ReactNode;
}) {
  const c = useColors();
  return (
    <View style={{ minHeight: Math.min(height, 96), backgroundColor: c.surface, borderRadius: CARD_R, paddingVertical: 14, paddingHorizontal: 16, gap: 4, justifyContent: 'center' }}>
      <View style={styles.rowBetween}>
        <Kicker>{L('الكابتن بيقول', 'The Captain says')}</Kicker>
        {big || caption ? <Text style={{ fontFamily: fonts.numSemi, fontSize: 13, lineHeight: 17, color: c.muted }}>{caption ?? big}</Text> : null}
      </View>
      {head ? <T kind="h2" style={{ fontSize: 19, lineHeight: 29 }}>{head}</T> : null}
      {body ? <T kind="body" color={c.muted} style={{ fontSize: 14, lineHeight: 22 }}>{body}</T> : null}
      {children}
    </View>
  );
}

export type Seg = { kcal: number; label: string; kind: 'done' | 'wait' | 'left' | 'over' };

/**
 * The day as one bar: a block per meal eaten, a grey block for food logged in meals not ticked yet, and a dashed
 * block for what's left. The champ's head sits where the day has reached. The blocks grow in when it first shows.
 */
export function MealBar({ segs }: { segs: Seg[] }) {
  const c = useColors();
  const grow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(grow, { toValue: 1, duration: 900, delay: 150, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);
  const shown = segs.filter((s) => s.kcal > 0);
  const total = shown.reduce((a, s) => a + s.kcal, 0);
  const knobAt = shown.findIndex((s) => s.kind === 'left');
  const color = (s: Seg) => (s.kind === 'done' ? c.ink : s.kind === 'wait' ? c.dim : s.kind === 'over' ? c.bad : 'transparent');
  // Eaten blocks grow in from the start while the "left" block gives way, so the champ's head slides to where the day is.
  const flex = (s: Seg) => (s.kind === 'left' ? grow.interpolate({ inputRange: [0, 1], outputRange: [total, s.kcal] }) : grow.interpolate({ inputRange: [0, 1], outputRange: [0.0001, s.kcal] }));
  return (
    <View style={{ gap: 6 }}>
      <View style={[styles.row, { height: 20 }]}>
        {shown.map((s, i) => (
          <Animated.View key={i} style={{ flexDirection: 'row', alignItems: 'center', flexGrow: knobAt === -1 ? s.kcal : flex(s), flexShrink: 1, flexBasis: 0, minWidth: 0 }}>
            {i === knobAt ? <Knob /> : null}
            <View style={{ height: 8, flex: 1, marginStart: i ? 3 : 0, backgroundColor: color(s), borderRadius: 12,
              borderWidth: s.kind === 'left' ? 1.5 : 0, borderStyle: 'dashed', borderColor: c.petrol }} />
          </Animated.View>
        ))}
        {knobAt === -1 && shown.length ? <Knob /> : null}
      </View>
      <View style={styles.row}>
        {shown.map((s, i) => (
          <Text key={i} numberOfLines={1} style={{ flexGrow: s.kcal, flexShrink: 1, flexBasis: 0, minWidth: 0, marginStart: i ? 3 : 0, fontFamily: s.kind === 'left' ? fonts.displaySemi : fonts.body, fontSize: 11, lineHeight: 15,
            color: s.kind === 'left' ? c.petrol : s.kind === 'over' ? c.bad : c.muted }}>{s.label}</Text>
        ))}
      </View>
    </View>
  );
}

/** The champ's head on the bar: a zero-width marker so it sits exactly on the edge in both directions. */
function Knob() {
  const c = useColors();
  return (
    <View style={{ width: 0, height: 20, zIndex: 2, overflow: 'visible' }}>
      <View style={{ position: 'absolute', left: -9, top: 1, width: 18, height: 18, borderRadius: 9, backgroundColor: c.petrol, borderWidth: 4, borderColor: c.bg }} />
    </View>
  );
}

/** Numbers side by side on one panel, split by hairlines. */
export function ScoreRow({ items }: { items: { value: string; label: string; color?: string }[] }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', backgroundColor: c.surface, borderRadius: CARD_R, paddingVertical: 6 }}>
      {items.map((x, i) => (
        <View key={i} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 6, borderStartWidth: i ? 1 : 0, borderColor: c.line, alignItems: 'center', gap: 2 }}>
          <Num size={30} weight="black" color={x.color}>{x.value}</Num>
          <T kind="label" style={{ textAlign: 'center', fontSize: 11.5 }}>{x.label}</T>
        </View>
      ))}
    </View>
  );
}
