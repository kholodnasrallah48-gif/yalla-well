// The lab tests that matter for this person. Each one opens to a form (the result, the day it was done, the day of
// the next test) and the earlier results.
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { DateField, dateLabel } from './pickers.tsx';
import { Btn, Card, START, T, styles } from './ui.tsx';
import { dayKey } from '../lib/day.ts';
import { LABS, addLab, defaultNext, labHistory, labName, labsFor, latestLab, nextLab, removeLab, type LabEntry, type LabKind } from '../lib/health.ts';
import { L, toNum } from '../lib/i18n.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';

/** `onReport` adds the button that makes the lab comparison PDF. */
export function LabCard({ profile: p, onChange, onReport, busy }: { profile: Profile; onChange: (p: Profile) => void; onReport?: () => void; busy?: boolean }) {
  const c = useColors();
  const g = genderFor(p.sex);
  const today = dayKey(new Date());
  const [kind, setKind] = useState<LabKind | null>(null);
  const [val, setVal] = useState('');
  const [date, setDate] = useState(today);
  const [next, setNext] = useState<string | null>(null);
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;

  const reset = (k: LabKind | null) => {
    setKind(k); setVal(''); setDate(today); setNext(null);
  };
  const shownNext = kind ? next ?? defaultNext(kind, date) : today;
  const valOk = !kind || LABS[kind].noValue || toNum(val) > 0;

  const save = () => {
    if (!kind || !valOk) return;
    // A new entry on the same day replaces the old one.
    const e: LabEntry = { kind, date, value: LABS[kind].noValue ? undefined : toNum(val), next: shownNext > date ? shownNext : undefined };
    play('check');
    onChange(addLab(p, e));
    setVal(''); setDate(today); setNext(null);
  };
  const remove = (e: LabEntry) => {
    play('remove');
    onChange(removeLab(p, e.kind, e.date));
  };

  return (
    <Card>
      <T kind="h2">{L('التحاليل', 'Lab results')}</T>
      <T kind="small">{L(`دي التحاليل المهمة لحالتك. ${g('اكتب', 'اكتبي')} النتيجة وتاريخها، وهنفكرك قبل ميعاد التحليل الجاي.`, "These are the tests that matter for you. Add the result and its date, and we'll remind you before the next one is due.")}</T>
      {labsFor(p).map((k, i) => {
        const last = latestLab(p, k);
        const nx = nextLab(p, k);
        const h = last?.value !== undefined ? LABS[k].hint?.(last.value) : undefined;
        const due = !nx || nx <= today;
        const on = kind === k;
        return (
          <View key={k} style={{ borderTopWidth: i ? 1 : 0, borderColor: c.line }}>
            <Pressable onPress={() => { play('tap'); reset(on ? null : k); }} accessibilityRole="button" accessibilityState={{ expanded: on }}
              style={[styles.row, { gap: 10, paddingVertical: 10 }]}>
              <View style={{ flex: 1, gap: 2 }}>
                <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{labName(k)}</T>
                <T kind="small" color={due ? c.warn : c.muted}>
                  {last ? L(`آخر مرة ${dateLabel(last.date)}`, `Last ${dateLabel(last.date)}`) : L('لسه متسجلش', 'Not logged yet')}
                  {nx ? L(` · الجاي ${dateLabel(nx)}`, ` · next ${dateLabel(nx)}`) : ''}
                  {due && last ? L(' (جه ميعاده)', ' (due)') : ''}
                </T>
              </View>
              {last ? (
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 16, color: h === 'bad' ? c.bad : h === 'warn' ? c.warn : c.ok }}>
                  {last.value !== undefined ? `${last.value} ${LABS[k].unit}` : L('اتعمل', 'Done')}
                </Text>
              ) : <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.petrol }}>{L(`+ ${g('ضيف', 'ضيفي')}`, '+ Add')}</Text>}
            </Pressable>

            {on ? (
              <View style={{ gap: 10, backgroundColor: c.soft, borderRadius: 12, padding: 12, marginBottom: 10 }}>
                <T kind="h3">{L('نتيجة جديدة', 'New result')}</T>
                {!LABS[k].noValue ? (
                  <View style={{ gap: 4 }}>
                    <T kind="small">{L(`النتيجة${LABS[k].unit ? ` (${LABS[k].unit})` : ''}`, `Result${LABS[k].unit ? ` (${LABS[k].unit})` : ''}`)}</T>
                    <TextInput value={val} onChangeText={setVal} keyboardType="decimal-pad" placeholder={L('مثلا 6.2', 'e.g. 6.2')} placeholderTextColor={c.muted} style={input} accessibilityLabel={L('النتيجة', 'Result')} />
                  </View>
                ) : null}
                <View style={{ gap: 4 }}>
                  <T kind="small">{L('اتعمل إمتى', 'Done on')}</T>
                  <DateField value={date} onChange={(d) => { setDate(d); setNext(null); }} label={L('اتعمل إمتى', 'Done on')} />
                </View>
                <View style={{ gap: 4 }}>
                  <T kind="small">{L('التحليل الجاي', 'Next test')}</T>
                  <DateField value={shownNext} onChange={setNext} future label={L('التحليل الجاي', 'Next test')} />
                </View>
                <T kind="small" color={c.muted}>{L(`عادة ${LABS[k].months >= 12 ? 'كل سنة' : `كل ${LABS[k].months} شهور`}، ولو الدكتور قال ميعاد تاني ${g('غيره', 'غيريه')}. هيجيلك تنبيه قبله بـ3 أيام ويوم الميعاد.`, `Usually ${LABS[k].months >= 12 ? 'once a year' : `every ${LABS[k].months} months`}; change it if your doctor said otherwise. You'll get a reminder 3 days before and on the day.`)}</T>
                <Btn title={L('حفظ', 'Save')} disabled={!valOk} onPress={save} />

                {labHistory(p, k).length ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <T kind="h3">{L('اللي فات', 'Earlier results')}</T>
                    {labHistory(p, k).map((e) => (
                      <View key={e.date} style={[styles.row, { gap: 10, alignItems: 'center' }]}>
                        <View style={{ flex: 1 }}>
                          <T kind="body">{e.value !== undefined ? `${e.value} ${LABS[k].unit}` : L('اتعمل', 'Done')}</T>
                          <T kind="small">{dateLabel(e.date)}{e.next ? L(` · الجاي ${dateLabel(e.next)}`, ` · next ${dateLabel(e.next)}`) : ''}</T>
                        </View>
                        <Pressable onPress={() => remove(e)} hitSlop={8} accessibilityRole="button" accessibilityLabel={L(g('امسح النتيجة دي', 'امسحي النتيجة دي'), 'Delete this result')}>
                          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.bad }}>{L(g('امسح', 'امسحي'), 'Delete')}</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>
        );
      })}
      <T kind="small" color={c.muted}>{L('الألوان تقريبية للتوضيح بس، ودكتورك هو اللي يقرر.', 'Colours are only a rough guide; your doctor decides.')}</T>
      {onReport ? (
        <Btn kind="outline" title={busy ? L('بيتجهز', 'Preparing') : L(g('حمل تقرير التحاليل', 'حملي تقرير التحاليل'), 'Download lab report')} disabled={busy} onPress={onReport} />
      ) : null}
    </Card>
  );
}
