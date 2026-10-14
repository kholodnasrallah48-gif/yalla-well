// An exercise's logbook: the best lift so far on a record card with the distance to the next goal, then a bar per
// session with its weight on top, newest last.
import { View } from 'react-native';

import { Mascot } from './Mascot.tsx';
import { Num, RADIUS, T, styles } from './ui.tsx';
import { L } from '../lib/i18n.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { liftRecord, type LiftLog } from '../lib/progress.ts';
import { shortDate } from '../lib/report.ts';
import { useColors } from '../theme.ts';

export const dateLabel = (k: string) => { const [y, m, d] = k.split('-').map(Number); return shortDate(new Date(y, m - 1, d)); };
const kg = (n: number) => String(Math.round(n * 10) / 10);

/** How many recent sessions get a bar. */
const BARS = 8;

export function LiftLogbook({ id, hist, profile, compact }: { id: string; hist?: LiftLog[]; profile: Profile; compact?: boolean }) {
  const c = useColors();
  const g = genderFor(profile.sex);
  const r = liftRecord(id, hist);
  if (!r) return <T kind="small">{L(`أول ما التمرين ده يخلص، الوزن والعدات هيتسجلوا هنا، وكل مرة هيبقى ليها عمود ${g('تشوف', 'تشوفي')} فيه وصلت لفين.`, 'Once you finish this exercise, the weight and reps are saved here, with a bar for every session.')}</T>;
  const left = Math.max(0, Math.round((r.goal - r.best.w) * 10) / 10);
  const fill = Math.max(0.05, Math.min(1, r.last.w / r.goal));
  const shown = (hist ?? []).slice(-BARS);
  const ws = shown.map((x) => x.w);
  const lo = Math.min(...ws), hi = Math.max(...ws);
  const barH = compact ? 110 : 150;
  const bestIdx = shown.lastIndexOf(r.best);

  return (
    <View style={{ gap: 14 }}>
      <View style={[styles.row, { gap: 12, borderWidth: 1, borderColor: c.petrol, borderRadius: RADIUS, padding: 12, backgroundColor: c.okBg }]}>
        <Mascot pose="cheer" size={compact ? 44 : 56} color={c.ink} head={c.petrol} animate={false} />
        <View style={{ flex: 1, gap: 2 }}>
          <T kind="small">{L(g('أحسن رقم ليك', 'أحسن رقم ليكي'), 'Your best')} · {dateLabel(r.best.date)}</T>
          <View style={[styles.row, { gap: 8, alignItems: 'flex-end' }]}>
            <Num size={compact ? 40 : 52} weight="black" color={c.petrol}>{kg(r.best.w)}</Num>
            <T kind="small" style={{ paddingBottom: 4 }}>{L(`كجم × ${Math.max(...r.best.reps)}`, `kg × ${Math.max(...r.best.reps)}`)}</T>
          </View>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={styles.rowBetween}>
          <T kind="small">{L(`الهدف الجاي: ${kg(r.goal)} كجم`, `Next goal: ${kg(r.goal)} kg`)}</T>
          <T kind="small" color={c.petrol}>{L(`فاضل ${kg(left)}`, `${kg(left)} to go`)}</T>
        </View>
        <View style={{ height: 10, borderRadius: 2, backgroundColor: c.soft, overflow: 'hidden' }}>
          <View style={{ width: `${fill * 100}%`, height: '100%', backgroundColor: c.petrol }} />
        </View>
      </View>

      {shown.length > 1 ? (
        <View style={{ gap: 6 }}>
          <View style={[styles.row, { gap: 6, height: barH + 24, alignItems: 'flex-end', borderBottomWidth: 1, borderColor: c.line }]}>
            {shown.map((x, i) => {
              const best = i === bestIdx;
              const h = hi === lo ? 1 : 0.35 + (0.65 * (x.w - lo)) / (hi - lo);
              return (
                <View key={x.date} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <Num size={compact ? 13 : 15} color={best ? c.petrol : c.ink}>{kg(x.w)}</Num>
                  <View style={{ width: '100%', height: barH * h, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: best ? c.petrol : c.soft, borderWidth: best ? 0 : 1, borderBottomWidth: 0, borderColor: c.line }} />
                </View>
              );
            })}
          </View>
          <View style={[styles.row, { gap: 6 }]}>
            {shown.map((x) => <T key={x.date} kind="small" style={{ flex: 1, textAlign: 'center', fontSize: 11 }}>{dateLabel(x.date)}</T>)}
          </View>
        </View>
      ) : null}

      <View style={[styles.rowBetween, { gap: 8, flexWrap: 'wrap' }]}>
        <T kind="small">{L(`آخر مرة: ${kg(r.last.w)} كجم × ${r.last.reps.join('، ')}`, `Last time: ${kg(r.last.w)} kg × ${r.last.reps.join(', ')}`)}</T>
        {r.change !== null ? (
          <View style={[styles.row, { gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 3, backgroundColor: r.change > 0 ? c.okBg : r.change < 0 ? c.warnBg : c.soft }]}>
            {r.change !== 0 ? <Num size={14} color={r.change > 0 ? c.ok : c.warn} style={{ writingDirection: 'ltr' }}>{`\u200E${r.change > 0 ? '+' : '−'}${kg(Math.abs(r.change))}`}</Num> : null}
            <T kind="label" color={r.change > 0 ? c.ok : r.change < 0 ? c.warn : c.muted}>{r.change === 0 ? L('نفس وزن اللي قبلها', 'Same as the time before') : L('عن اللي قبلها', 'vs the time before')}</T>
          </View>
        ) : null}
      </View>
    </View>
  );
}
