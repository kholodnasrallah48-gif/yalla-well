// Food advice card: personal notes (inflammation, blood sugar, budget) and healthier swaps.
import { Pressable, Text, View } from 'react-native';

import type { Advice, Food, Level } from '../lib/foods.ts';
import { fmt } from '../lib/day.ts';
import { fonts, useColors, type Colors } from '../theme.ts';
import { T, styles } from './ui.tsx';

export const levelColor = (c: Colors, l: Level) => ({ good: c.ok, ok: c.muted, warn: c.warn, bad: c.bad })[l];
export const levelBg = (c: Colors, l: Level) => ({ good: c.okBg, ok: c.soft, warn: c.warnBg, bad: c.badBg })[l];
const TITLE: Record<Level, string> = { good: 'اختيار كويس', ok: 'تمام', warn: 'خلي بالك', bad: 'مش مناسب ليكي/ليك' };

export function Dot({ level }: { level: Level }) {
  const c = useColors();
  return <View accessibilityLabel={TITLE[level]} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: levelColor(c, level) }} />;
}

export function AdviceView({ advice, onSwap, female }: { advice: Advice; onSwap?: (f: Food) => void; female: boolean }) {
  const c = useColors();
  const title = advice.level === 'bad' ? (female ? 'مش مناسب ليكي' : 'مش مناسب ليك') : TITLE[advice.level];
  return (
    <View style={{ gap: 8, borderRadius: 14, padding: 12, backgroundColor: levelBg(c, advice.level) }}>
      <T kind="h3" color={levelColor(c, advice.level)}>{title}</T>
      {advice.notes.map((n, i) => (
        <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
          <View style={{ marginTop: 8 }}><Dot level={n.level} /></View>
          <T kind="small" color={c.ink} style={{ flex: 1 }}>{n.text}</T>
        </View>
      ))}
      {advice.swaps.length ? (
        <>
          <T kind="label" color={c.ink}>بدايل أحسن</T>
          {advice.swaps.map((s) => (
            <View key={s.id} style={[styles.row, { gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <T kind="body">{s.n}</T>
                <T kind="small">{s.u} · {fmt(s.kcal)} سعرة</T>
              </View>
              {onSwap ? (
                <Pressable accessibilityRole="button" accessibilityLabel={`إضافة ${s.n} بدلها`} onPress={() => onSwap(s)}
                  style={{ borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: c.petrol }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.onPetrol }}>{female ? 'خديها بدلها' : 'خدها بدلها'}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}
