// Water for the day: a cup per tap, quick bottle sizes, and the total against the day's target.
import { Pressable, Text, View } from 'react-native';

import { fmt, type DayLog } from '../lib/day.ts';
import { L } from '../lib/i18n.ts';
import { CUP_ML } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Card, T, styles } from './ui.tsx';

export function WaterCard({ day, cups, update }: { day: DayLog; cups: number; update: (f: (d: DayLog) => DayLog) => void }) {
  const c = useColors();
  return (
    <Card>
      <View style={styles.rowBetween}>
        <T kind="h2">{L('المياه', 'Water')}</T>
        <Text style={{ fontFamily: fonts.numSemi, fontSize: 22, color: c.lime }}>{fmt(Math.round(day.water * CUP_ML))}<Text style={{ fontSize: 15, color: c.muted }}> / {fmt(cups * CUP_ML)} {L('مل', 'ml')}</Text></Text>
      </View>
      <View style={[styles.wrap, { gap: 6 }]}>
        {Array.from({ length: cups }, (_, i) => {
          const full = i < Math.floor(day.water);
          return (
            <Pressable key={i} accessibilityRole="button" accessibilityLabel={L(`كوباية ${i + 1}`, `Cup ${i + 1}`)} accessibilityState={{ selected: full }} hitSlop={3}
              onPress={() => { const n = Math.floor(day.water) === i + 1 ? i : i + 1; play(n < day.water ? 'remove' : n >= cups ? 'win' : 'pop'); update((d) => ({ ...d, water: n })); }}
              style={({ pressed }) => [{ width: 26, height: 34, borderWidth: 1.5, borderColor: c.lime, borderRadius: 2, borderBottomLeftRadius: 6, borderBottomRightRadius: 6, backgroundColor: full ? c.lime : 'transparent' }, pressed && { transform: [{ scale: 0.9 }] }]} />
          );
        })}
      </View>
      <View style={styles.wrap}>
        {[250, 330, 500, 1000, 1500].map((ml) => (
          <Pressable key={ml} accessibilityRole="button" onPress={() => { const n = day.water + ml / CUP_ML; play(n >= cups && day.water < cups ? 'win' : 'add'); update((d) => ({ ...d, water: Math.round((d.water + ml / CUP_ML) * 100) / 100 })); }}
            style={({ pressed }) => [styles.chip, { borderColor: c.line, paddingHorizontal: 10 }, pressed && styles.pressed]}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.ink }}>+ {ml >= 1000 ? L(`${ml / 1000} لتر`, `${ml / 1000} L`) : L(`${ml} مل`, `${ml} ml`)}</Text>
          </Pressable>
        ))}
        {day.water > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => { play('remove'); update((d) => ({ ...d, water: 0 })); }}
            style={({ pressed }) => [styles.chip, { borderColor: 'transparent' }, pressed && styles.pressed]}>
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.muted }}>{L('تصفير', 'Reset')}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}
