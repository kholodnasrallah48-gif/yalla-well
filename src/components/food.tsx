// Food advice card: personal notes (inflammation, blood sugar, budget) and healthier swaps.
import { Pressable, Text, View } from 'react-native';

import type { Advice, Food, Level } from '../lib/foods.ts';
import { fmt } from '../lib/day.ts';
import { isEn, L, tx } from '../lib/i18n.ts';
import { fonts, useColors, type Colors } from '../theme.ts';
import { T, styles } from './ui.tsx';

export const levelColor = (c: Colors, l: Level) => ({ good: c.ok, ok: c.muted, warn: c.warn, bad: c.bad })[l];
export const levelBg = (c: Colors, l: Level) => ({ good: c.okBg, ok: c.soft, warn: c.warnBg, bad: c.badBg })[l];
const TITLE = (l: Level) => ({ good: L('اختيار كويس', 'Good choice'), ok: L('تمام', 'OK'), warn: L('خلي بالك', 'Careful'), bad: L('مش مناسب ليكي/ليك', 'Not a good fit for you') })[l];

export function Dot({ level }: { level: Level }) {
  const c = useColors();
  return <View accessibilityLabel={TITLE(level)} style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: levelColor(c, level) }} />;
}

export function AdviceView({ advice, onSwap, female }: { advice: Advice; onSwap?: (f: Food) => void; female: boolean }) {
  const c = useColors();
  const title = advice.level === 'bad' ? L(female ? 'مش مناسب ليكي' : 'مش مناسب ليك', 'Not a good fit for you') : TITLE(advice.level);
  return (
    <View style={{ gap: 8, borderRadius: 4, padding: 12, backgroundColor: levelBg(c, advice.level) }}>
      <T kind="h3" color={levelColor(c, advice.level)}>{title}</T>
      {advice.notes.map((n, i) => (
        <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
          <View style={{ marginTop: 8 }}><Dot level={n.level} /></View>
          <T kind="small" color={c.ink} style={{ flex: 1 }}>{n.text}</T>
        </View>
      ))}
      {advice.swaps.length ? (
        <>
          <T kind="label" color={c.ink}>{L('بدايل أحسن', 'Better swaps')}</T>
          {advice.swaps.map((s) => (
            <View key={s.id} style={[styles.row, { gap: 8 }]}>
              <View style={{ flex: 1 }}>
                <T kind="body">{tx(s.n)}</T>
                <T kind="small">{tx(s.u)} · {fmt(s.kcal)} {L('سعرة', 'kcal')}</T>
              </View>
              {onSwap ? (
                <Pressable accessibilityRole="button" accessibilityLabel={L(`إضافة ${s.n} بدلها`, `Add ${tx(s.n)} instead`)} onPress={() => onSwap(s)}
                  style={{ borderRadius: 4, paddingHorizontal: 12, paddingVertical: 5, backgroundColor: c.petrol }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.onPetrol }}>{L(female ? 'خديها بدلها' : 'خدها بدلها', 'Swap it in')}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** 12.5 → "١٢٫٥" (one decimal at most, Arabic digits; Western digits in English). */
export const arNum = (n: number) => (isEn() ? String(Math.round(n * 10) / 10) : String(Math.round(n * 10) / 10).replace(/\d/g, (d) => AR_DIGITS[+d]).replace('.', '٫'));

/** Protein / carbs / fat for one food, as three soft pills in the app's rounded font. */
export function MacroChips({ p, c: carbs, f }: { p: number; c: number; f: number }) {
  const c = useColors();
  const items: [string, number, string][] = [[L('بروتين', 'Protein'), p, c.petrol], [L('كارب', 'Carbs'), carbs, c.lime], [L('دهون', 'Fat'), f, c.aqua]];
  return (
    <View style={[styles.wrap, { gap: 6 }]}>
      {items.map(([k, v, dot]) => (
        <View key={k} style={[styles.row, { gap: 6, backgroundColor: c.soft, borderRadius: 4, paddingHorizontal: 10, paddingVertical: 3 }]}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: dot }} />
          <Text style={{ fontFamily: fonts.displayMedium, fontSize: 13, lineHeight: 20, color: c.ink }}>{k} {arNum(v)} {L('جم', 'g')}</Text>
        </View>
      ))}
    </View>
  );
}
