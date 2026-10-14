// The lab tests that matter for this person. Each one opens to a form (the result, the day it was done, the day of
// the next test, a photo of the lab paper) and the earlier results with their photos.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, Text, TextInput, View } from 'react-native';

import { DateField, dateLabel } from './pickers.tsx';
import { Btn, Card, RADIUS, START, T, styles } from './ui.tsx';
import { dayKey } from '../lib/day.ts';
import { LABS, addLab, defaultNext, labHistory, labName, labsFor, latestLab, nextLab, removeLab, type LabEntry, type LabKind } from '../lib/health.ts';
import { L, toNum } from '../lib/i18n.ts';
import { deleteLabPhoto, pickLabPhoto, readLabPhoto } from '../lib/labPhotos.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';

/** A saved lab photo, loaded from the phone. */
function LabPhoto({ id, size, onPress }: { id: string; size: number; onPress: (uri: string) => void }) {
  const c = useColors();
  const [uri, setUri] = useState<string | null | undefined>(undefined);
  useEffect(() => { let live = true; readLabPhoto(id).then((u) => { if (live) setUri(u); }); return () => { live = false; }; }, [id]);
  if (uri === undefined) return <View style={{ width: size, height: size * 1.3, borderRadius: RADIUS, backgroundColor: c.soft }} />;
  if (!uri) return null;
  return (
    <Pressable onPress={() => onPress(uri)} accessibilityRole="imagebutton" accessibilityLabel={L('صورة ورقة التحليل', 'Photo of the lab paper')}>
      <Image source={{ uri }} style={{ width: size, height: size * 1.3, borderRadius: RADIUS, borderWidth: 1, borderColor: c.line, backgroundColor: c.soft }} />
    </Pressable>
  );
}

export function LabCard({ profile: p, onChange }: { profile: Profile; onChange: (p: Profile) => void }) {
  const c = useColors();
  const g = genderFor(p.sex);
  const today = dayKey(new Date());
  const [kind, setKind] = useState<LabKind | null>(null);
  const [val, setVal] = useState('');
  const [date, setDate] = useState(today);
  const [next, setNext] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const input = { borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 9, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;

  const reset = (k: LabKind | null) => {
    // A photo taken but not saved with a result is dropped.
    if (photo) deleteLabPhoto(photo);
    setKind(k); setVal(''); setDate(today); setNext(null); setPhoto(null);
  };
  const shownNext = kind ? next ?? defaultNext(kind, date) : today;
  const valOk = !kind || LABS[kind].noValue || toNum(val) > 0;

  const save = () => {
    if (!kind || !valOk) return;
    const e: LabEntry = { kind, date, value: LABS[kind].noValue ? undefined : toNum(val), next: shownNext > date ? shownNext : undefined, photo: photo ?? undefined };
    // A new entry on the same day replaces the old one, and its photo goes with it.
    const old = (p.labs ?? []).find((x) => x.kind === kind && x.date === date);
    if (old?.photo && old.photo !== photo) deleteLabPhoto(old.photo);
    play('check');
    onChange(addLab(p, e));
    setPhoto(null); setVal(''); setDate(today); setNext(null);
  };
  const remove = (e: LabEntry) => {
    if (e.photo) deleteLabPhoto(e.photo);
    play('remove');
    onChange(removeLab(p, e.kind, e.date));
  };
  const addPhoto = async (camera: boolean) => {
    setBusy(true);
    try {
      const id = await pickLabPhoto(camera);
      if (id) { if (photo) deleteLabPhoto(photo); setPhoto(id); play('add'); }
    } catch { /* picker closed or failed */ } finally { setBusy(false); }
  };

  return (
    <Card>
      <T kind="h2">{L('التحاليل', 'Lab results')}</T>
      <T kind="small">{L(`دي التحاليل المهمة لحالتك. ${g('اكتب', 'اكتبي')} النتيجة وتاريخها و${g('صور', 'صوري')} الورقة لو ${g('حابب', 'حابة')}، وهنفكرك قبل ميعاد التحليل الجاي.`, "These are the tests that matter for you. Add the result and its date, and a photo of the paper if you like. We'll remind you before the next one is due.")}</T>
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
              <View style={{ gap: 10, backgroundColor: c.soft, borderRadius: 4, padding: 12, marginBottom: 10 }}>
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

                <View style={[styles.row, { gap: 8, alignItems: 'center', flexWrap: 'wrap' }]}>
                  {photo ? <LabPhoto id={photo} size={56} onPress={setView} /> : null}
                  <Btn kind="outline" title={photo ? L('صورة تانية', 'Retake') : L(g('صور الورقة', 'صوري الورقة'), 'Photo of the paper')} disabled={busy} onPress={() => addPhoto(true)} />
                  <Btn kind="outline" title={L('من الصور', 'From gallery')} disabled={busy} onPress={() => addPhoto(false)} />
                  {busy ? <ActivityIndicator color={c.petrol} /> : null}
                </View>
                <Btn title={L('حفظ', 'Save')} disabled={!valOk || busy} onPress={save} />

                {labHistory(p, k).length ? (
                  <View style={{ gap: 8, marginTop: 4 }}>
                    <T kind="h3">{L('اللي فات', 'Earlier results')}</T>
                    {labHistory(p, k).map((e) => (
                      <View key={e.date} style={[styles.row, { gap: 10, alignItems: 'center' }]}>
                        {e.photo ? <LabPhoto id={e.photo} size={40} onPress={setView} /> : null}
                        <View style={{ flex: 1 }}>
                          <T kind="body">{e.value !== undefined ? `${e.value} ${LABS[k].unit}` : L('اتعمل', 'Done')}</T>
                          <T kind="small">{dateLabel(e.date)}{e.next ? L(` · الجاي ${dateLabel(e.next)}`, ` · next ${dateLabel(e.next)}`) : ''}</T>
                        </View>
                        <Pressable onPress={() => remove(e)} hitSlop={8} accessibilityRole="button" accessibilityLabel={L('امسح النتيجة دي', 'Delete this result')}>
                          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.bad }}>{L('امسح', 'Delete')}</Text>
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
      <T kind="small" color={c.muted}>{L('الألوان تقريبية للتوضيح بس، ودكتورك هو اللي يقرر. الصور بتفضل على الموبايل بس.', 'Colours are only a rough guide; your doctor decides. Photos stay on your phone only.')}</T>

      <Modal visible={!!view} transparent animationType="fade" onRequestClose={() => setView(null)}>
        <Pressable onPress={() => setView(null)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', padding: 16, justifyContent: 'center' }} accessibilityRole="button" accessibilityLabel={L('اقفل', 'Close')}>
          {view ? <Image source={{ uri: view }} resizeMode="contain" style={{ width: '100%', height: '85%' }} /> : null}
          <Text style={{ color: '#fff', textAlign: 'center', fontFamily: fonts.bodyMedium, marginTop: 12 }}>{L(g('دوس في أي حتة عشان تقفل', 'دوسي في أي حتة عشان تقفلي'), 'Tap anywhere to close')}</Text>
        </Pressable>
      </Modal>
    </Card>
  );
}
