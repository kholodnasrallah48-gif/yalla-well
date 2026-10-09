// Picking a time (hour, minutes, morning or evening) and a date by tapping instead of typing.
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { dayKey } from '../lib/day.ts';
import { L, isEn } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Kicker, RADIUS, Segmented, styles } from './ui.tsx';

const pad = (n: number) => String(n).padStart(2, '0');

/** "07:30" → "7:30 ص" / "7:30 AM". */
export function timeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? L('ص', 'AM') : L('م', 'PM')}`;
}

/** A grid of small square-cornered cells; the picked one is filled. */
function Grid({ items, value, onPick, cols }: { items: [number, string][]; value: number; onPick: (v: number) => void; cols: number }) {
  const c = useColors();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {items.map(([v, label]) => {
        const on = v === value;
        return (
          <Pressable key={v} onPress={() => { play('tap'); onPick(v); }} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label}
            style={({ pressed }) => [{ flexBasis: `${100 / cols - 3}%`, flexGrow: 1, minHeight: 38, alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS, borderWidth: 1, borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.petrol : c.surface }, pressed && styles.pressed]}>
            <Text style={{ fontFamily: on ? fonts.displaySemi : fonts.body, fontSize: 14, color: on ? c.onPetrol : c.ink }}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** The closed field: the value in big numbers, tap to open the picker. */
function Field({ text, open, onPress, label, onRemove }: { text: string; open: boolean; onPress: () => void; label: string; onRemove?: () => void }) {
  const c = useColors();
  return (
    <View style={[styles.row, { gap: 8 }]}>
      <Pressable onPress={() => { play('tap'); onPress(); }} accessibilityRole="button" accessibilityLabel={`${label}: ${text}`} accessibilityState={{ expanded: open }}
        style={({ pressed }) => [{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: open ? c.petrol : c.line, backgroundColor: c.surface, borderRadius: RADIUS, paddingHorizontal: 12, minHeight: 44 }, pressed && styles.pressed]}>
        <Text style={{ fontFamily: fonts.displaySemi, fontSize: 16, color: c.ink }}>{text}</Text>
        <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: c.petrol }}>{open ? L('تمام', 'Done') : L('غير', 'Change')}</Text>
      </Pressable>
      {onRemove ? (
        <Pressable onPress={() => { play('remove'); onRemove(); }} hitSlop={8} accessibilityRole="button" accessibilityLabel={L('شيل الميعاد', 'Remove time')}
          style={({ pressed }) => [{ width: 44, minHeight: 44, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
          <Text style={{ color: c.bad, fontSize: 18, fontFamily: fonts.bodySemi }}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const HOURS: [number, string][] = Array.from({ length: 12 }, (_, i) => [i + 1, String(i + 1)]);
const MINUTES: [number, string][] = Array.from({ length: 12 }, (_, i) => [i * 5, pad(i * 5)]);

/** A time ("HH:MM", 24 h) picked as hour, minutes and morning/evening. */
export function TimeField({ value, onChange, onRemove, label }: { value: string; onChange: (t: string) => void; onRemove?: () => void; label?: string }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [h, m] = value.split(':').map(Number);
  const h12 = h % 12 || 12, am = h < 12;
  const set = (hh: number, mm: number, isAm: boolean) => onChange(`${pad((hh % 12) + (isAm ? 0 : 12))}:${pad(mm)}`);
  const minutes = MINUTES.some(([v]) => v === m) ? MINUTES : [...MINUTES, [m, pad(m)] as [number, string]].sort((a, b) => a[0] - b[0]);
  return (
    <View style={{ gap: 8 }}>
      <Field text={timeLabel(value)} open={open} onPress={() => setOpen(!open)} label={label ?? L('الميعاد', 'Time')} onRemove={onRemove} />
      {open ? (
        <View style={{ gap: 10, padding: 12, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, backgroundColor: c.panel }}>
          <Kicker>{L('الساعة', 'Hour')}</Kicker>
          <Grid items={HOURS} value={h12} onPick={(v) => set(v, m, am)} cols={6} />
          <Kicker>{L('الدقيقة', 'Minutes')}</Kicker>
          <Grid items={minutes} value={m} onPick={(v) => set(h12, v, am)} cols={6} />
          <Segmented<'am' | 'pm'> items={[['am', L('صباحا', 'AM')], ['pm', L('مساء', 'PM')]]} value={am ? 'am' : 'pm'} onChange={(k) => set(h12, m, k === 'am')} />
          <Btn kind="dark" title={L('تمام', 'Done')} onPress={() => setOpen(false)} />
        </View>
      ) : null}
    </View>
  );
}

export const MONTHS: [string, string][] = [['يناير', 'Jan'], ['فبراير', 'Feb'], ['مارس', 'Mar'], ['أبريل', 'Apr'], ['مايو', 'May'], ['يونيو', 'Jun'], ['يوليو', 'Jul'], ['أغسطس', 'Aug'], ['سبتمبر', 'Sep'], ['أكتوبر', 'Oct'], ['نوفمبر', 'Nov'], ['ديسمبر', 'Dec']];

/** "2026-10-05" → "5 أكتوبر 2026" / "5 Oct 2026". */
export function dateLabel(k: string): string {
  const [y, mo, d] = k.split('-').map(Number);
  return isEn() ? `${d} ${MONTHS[mo - 1][1]} ${y}` : `${d} ${MONTHS[mo - 1][0]} ${y}`;
}

/** A date (YYYY-MM-DD) picked as year, month and day, with today and yesterday one tap away. */
export function DateField({ value, onChange, label, future = false }: { value: string; onChange: (k: string) => void; label?: string; future?: boolean }) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [y, mo, d] = value.split('-').map(Number);
  const now = new Date();
  const thisYear = now.getFullYear();
  const years = (future ? [thisYear - 1, thisYear, thisYear + 1] : [thisYear - 2, thisYear - 1, thisYear]);
  const days = new Date(y, mo, 0).getDate();
  const set = (yy: number, mm: number, dd: number) => onChange(`${yy}-${pad(mm)}-${pad(Math.min(dd, new Date(yy, mm, 0).getDate()))}`);
  const ago = (n: number) => { const x = new Date(); x.setDate(x.getDate() - n); return dayKey(x); };
  return (
    <View style={{ gap: 8 }}>
      <Field text={dateLabel(value)} open={open} onPress={() => setOpen(!open)} label={label ?? L('التاريخ', 'Date')} />
      {open ? (
        <View style={{ gap: 10, padding: 12, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, backgroundColor: c.panel }}>
          <View style={[styles.row, { gap: 6 }]}>
            <Btn kind="outline" title={L('النهارده', 'Today')} onPress={() => { onChange(ago(0)); setOpen(false); }} style={{ flex: 1 }} />
            {!future ? <Btn kind="outline" title={L('امبارح', 'Yesterday')} onPress={() => { onChange(ago(1)); setOpen(false); }} style={{ flex: 1 }} /> : null}
          </View>
          <Segmented<string> items={years.map((x) => [String(x), String(x)])} value={String(y)} onChange={(k) => set(Number(k), mo, d)} />
          <Kicker>{L('الشهر', 'Month')}</Kicker>
          <Grid items={MONTHS.map(([ar, en], i) => [i + 1, L(ar, en)])} value={mo} onPick={(v) => set(y, v, d)} cols={4} />
          <Kicker>{L('اليوم', 'Day')}</Kicker>
          <Grid items={Array.from({ length: days }, (_, i) => [i + 1, String(i + 1)])} value={d} onPick={(v) => set(y, mo, v)} cols={7} />
          <Btn kind="dark" title={L('تمام', 'Done')} onPress={() => setOpen(false)} />
        </View>
      ) : null}
    </View>
  );
}
