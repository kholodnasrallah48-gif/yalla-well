// "My progress": body weight, tape measurements with a body-fat estimate, progress photos (kept on the phone only),
// and the logbook of every exercise's weights over time.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LineChart } from '../components/LineChart.tsx';
import { Bg, Btn, Card, Chip, Num, RADIUS, T, styles } from '../components/ui.tsx';
import { MEASURES, bodyChanges, bodyFat, fatTrend, logBody, type Measure } from '../lib/body.ts';
import { EXERCISES } from '../lib/data.ts';
import { L, latin, toNum, tx } from '../lib/i18n.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { liftTrend } from '../lib/progress.ts';
import { shortDate } from '../lib/report.ts';
import { play } from '../lib/sound.ts';
import { logWeight } from '../lib/weight.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

type Pose = 'front' | 'side' | 'back';
type ProgressPhoto = { id: string; d: string; pose: Pose; uri: string };
const PHOTOS_KEY = 'yallawell:photos';
const MAX_PHOTOS = 40;
const POSES: [Pose, () => string][] = [['front', () => L('من قدام', 'Front')], ['side', () => L('من جنب', 'Side')], ['back', () => L('من ضهر', 'Back')]];

const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const dateLabel = (k: string) => { const [y, m, d] = k.split('-').map(Number); return shortDate(new Date(y, m - 1, d)); };

/** An exercise's name from the app's list, or from the person's own additions. */
function exName(p: Profile, id: string): string {
  if (EXERCISES[id]) return tx(EXERCISES[id].n);
  for (const list of Object.values(p.own ?? {})) { const o = list.find((x) => x.id === id); if (o?.n) return o.n; }
  return id;
}

async function shrink(uri: string): Promise<string> {
  const img = await ImageManipulator.manipulate(uri).resize({ width: 600 }).renderAsync();
  const out = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return `data:image/jpeg;base64,${out.base64}`;
}

export default function Progress() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, liftHist } = useStore();
  const [kg, setKg] = useState('');
  const [vals, setVals] = useState<Partial<Record<Measure, string>>>({});
  const [saved, setSaved] = useState('');
  const [photos, setPhotos] = useState<ProgressPhoto[] | null>(null);
  const [pose, setPose] = useState<Pose>('front');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [del, setDel] = useState<string | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(PHOTOS_KEY).then((v) => setPhotos(v ? (JSON.parse(v) as ProgressPhoto[]) : [])).catch(() => setPhotos([]));
  }, []);
  if (!profile) return null;
  const p = profile;
  const g = genderFor(p.sex);
  const input = { flex: 1, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, borderRadius: RADIUS, paddingHorizontal: 10, paddingVertical: 8, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: 'center' } as const;

  const weights = p.weights?.length ? p.weights : [{ d: p.start ?? todayKey(), kg: p.weight }];
  const changes = bodyChanges(p);
  const latest = Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v!.now])) as Partial<Record<Measure, number>>;
  const fat = bodyFat(p.sex, p.height, latest);
  const fats = fatTrend(p);
  const okKg = toNum(kg) >= 30 && toNum(kg) <= 300;
  const typed = Object.fromEntries(Object.entries(vals).map(([k, v]) => [k, toNum(v ?? '')]).filter(([, v]) => (v as number) >= 10 && (v as number) <= 250)) as Partial<Record<Measure, number>>;

  const savePhotos = (next: ProgressPhoto[]) => { setPhotos(next); AsyncStorage.setItem(PHOTOS_KEY, JSON.stringify(next)).catch(() => {}); };
  const addPhoto = async (camera: boolean) => {
    try {
      if (camera) { const perm = await ImagePicker.requestCameraPermissionsAsync(); if (!perm.granted) return; }
      const r = camera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
      const a = r.canceled ? null : r.assets?.[0];
      if (!a) return;
      setBusy(true);
      const uri = await shrink(a.uri);
      const ph: ProgressPhoto = { id: String(Date.now()), d: todayKey(), pose, uri };
      savePhotos([...(photos ?? []), ph].slice(-MAX_PHOTOS));
      play('add');
    } catch { /* picker closed or failed */ } finally { setBusy(false); }
  };
  const ofPose = (photos ?? []).filter((x) => x.pose === pose);
  const first = ofPose[0], last = ofPose[ofPose.length - 1];
  const lifts = Object.entries(liftHist).filter(([, h]) => h.length).sort((a, b) => (a[1][a[1].length - 1].date < b[1][b[1].length - 1].date ? 1 : -1));

  return (
    <Bg><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('تقدمي', 'My progress')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>

      <Card>
        <T kind="h2">{L('الوزن', 'Weight')}</T>
        <LineChart points={weights.map((w) => ({ label: dateLabel(w.d), v: w.kg }))} unit={L(' كجم', ' kg')} empty={L(`${g('سجل', 'سجلي')} وزنك مرة في الأسبوع عشان الرسم يظهر.`, 'Log your weight once a week to see the chart.')} />
        <View style={[styles.row, { gap: 8 }]}>
          <TextInput value={kg} onChangeText={setKg} keyboardType="decimal-pad" placeholder={String(p.weight)} placeholderTextColor={c.muted} style={input} accessibilityLabel={L('الوزن بالكيلو', 'Weight in kg')} />
          <Btn title={L('حفظ', 'Save')} disabled={!okKg} onPress={() => { saveProfile(logWeight(p, toNum(kg))); setKg(''); play('add'); }} />
        </View>
      </Card>

      <Card>
        <T kind="h2">{L('القياسات', 'Measurements')}</T>
        <T kind="small">{L(`بالسنتي، بشريط القياس. ${g('قيس', 'قيسي')} مرة كل أسبوعين الصبح قبل الأكل. الوزن لوحده مش بيقول لو الدهون نزلت والعضل زاد، القياسات بتقول.`, 'In cm, with a tape measure. Measure every two weeks in the morning before eating. Weight alone can’t show fat going down while muscle goes up; measurements can.')}</T>
        {MEASURES.map((m) => {
          const ch = changes[m.id];
          return (
            <View key={m.id} style={[styles.row, { gap: 10 }]}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T kind="h3">{m.n()}</T>
                <T kind="small">{m.how()}</T>
              </View>
              <TextInput value={vals[m.id] ?? ''} onChangeText={(v) => { setSaved(''); setVals({ ...vals, [m.id]: latin(v).replace(/[^0-9.]/g, '') }); }} keyboardType="decimal-pad"
                placeholder={ch ? String(ch.now) : '—'} placeholderTextColor={c.muted} style={[input, { flex: 0, width: 84 }]} accessibilityLabel={m.n()} />
              <View style={{ width: 40, alignItems: 'center' }}>
                {ch && ch.diff !== 0 ? <T kind="small" color={ch.diff < 0 ? c.ok : c.muted}>{`${ch.diff > 0 ? '+' : ''}${ch.diff}`}</T> : null}
              </View>
            </View>
          );
        })}
        <Btn title={L('حفظ القياسات', 'Save measurements')} disabled={!Object.keys(typed).length} onPress={() => { saveProfile(logBody(p, typed)); setVals({}); setSaved(L('اتحفظت.', 'Saved.')); play('add'); }} />
        {saved ? <T kind="small" color={c.petrol}>{saved}</T> : null}
      </Card>

      <Card>
        <T kind="h2">{L('نسبة الدهون (تقريبية)', 'Body fat (estimate)')}</T>
        {fat != null ? <>
          <View style={[styles.row, { gap: 16 }]}>
            <View style={{ flex: 1 }}><Num size={30}>{`${fat}%`}</Num><T kind="small">{L('دهون', 'Fat')}</T></View>
            <View style={{ flex: 1 }}><Num size={30}>{String(Math.round(p.weight * (1 - fat / 100) * 10) / 10)}</Num><T kind="small">{L('كجم من غير دهون (عضل وعضم ومياه)', 'kg lean mass (muscle, bone, water)')}</T></View>
          </View>
          <LineChart points={fats.map((x) => ({ label: dateLabel(x.d), v: x.fat }))} unit="%" />
          {fats.length >= 2 ? <T kind="small">{L(`الكتلة من غير دهون: من ${fats[0].lean} لـ ${fats[fats.length - 1].lean} كجم.`, `Lean mass: from ${fats[0].lean} to ${fats[fats.length - 1].lean} kg.`)}</T> : null}
        </> : <T kind="small">{p.sex === 'm'
          ? L('بنحسبها من قياس الوسط والرقبة.', 'Worked out from your waist and neck.')
          : L('بنحسبها من قياس الوسط والأرداف والرقبة.', 'Worked out from your waist, hips and neck.')}</T>}
        <T kind="small" color={c.muted}>{L('دي طريقة تقريبية بالشريط. الرقم ممكن يفرق شوية، المهم اتجاهه مع الوقت.', 'This is a tape-measure estimate. The number can be a bit off; what matters is where it goes over time.')}</T>
      </Card>

      <Card>
        <T kind="h2">{L('صور التقدم', 'Progress photos')}</T>
        <T kind="small">{L('الصور بتفضل على الموبايل ده بس، ومش بتتبعت لأي حد. الأحسن نفس المكان ونفس الإضاءة كل مرة.', 'Photos stay on this phone only and are never sent anywhere. Same place and lighting each time works best.')}</T>
        <View style={[styles.row, { gap: 8 }]}>{POSES.map(([k, n]) => <Chip key={k} label={n()} on={pose === k} onPress={() => setPose(k)} />)}</View>
        <View style={[styles.row, { gap: 8 }]}>
          <Btn kind="outline" title={L('صورة بالكاميرا', 'Take a photo')} onPress={() => addPhoto(true)} style={{ flex: 1 }} />
          <Btn kind="outline" title={L('من الصور', 'From gallery')} onPress={() => addPhoto(false)} style={{ flex: 1 }} />
        </View>
        {busy || photos == null ? <ActivityIndicator color={c.petrol} /> : null}
        {first && last && first.id !== last.id ? (
          <View style={{ gap: 6 }}>
            <T kind="label">{L('أول صورة وآخر صورة', 'First and latest')}</T>
            <View style={[styles.row, { gap: 8 }]}>
              {[first, last].map((x) => (
                <View key={x.id} style={{ flex: 1, gap: 4 }}>
                  <Image source={{ uri: x.uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: RADIUS, backgroundColor: c.panel }} resizeMode="cover" />
                  <T kind="small" style={{ textAlign: 'center' }}>{dateLabel(x.d)}</T>
                </View>
              ))}
            </View>
          </View>
        ) : null}
        {ofPose.length ? (
          <View style={[styles.wrap, { gap: 6 }]}>
            {[...ofPose].reverse().map((x) => (
              <Pressable key={x.id} onLongPress={() => setDel(x.id)} onPress={() => setDel(del === x.id ? null : del)} style={{ width: '31%' }}>
                <Image source={{ uri: x.uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: RADIUS, backgroundColor: c.panel, opacity: del === x.id ? 0.5 : 1 }} />
                <T kind="small" style={{ textAlign: 'center' }}>{dateLabel(x.d)}</T>
              </Pressable>
            ))}
          </View>
        ) : <T kind="small">{L('لسه مفيش صور من الزاوية دي.', 'No photos from this angle yet.')}</T>}
        {ofPose.length ? <T kind="small" color={c.muted}>{L(`${g('دوس', 'دوسي')} على صورة كتير عشان ${g('تمسحها', 'تمسحيها')}.`, 'Press and hold a photo to delete it.')}</T> : null}
        {del ? (
          <View style={[styles.row, { gap: 8 }]}>
            <Btn kind="secondary" title={L('امسح الصورة دي', 'Delete this photo')} onPress={() => { savePhotos((photos ?? []).filter((x) => x.id !== del)); setDel(null); play('remove'); }} style={{ flex: 1 }} />
            <Btn kind="outline" title={L('لأ', 'No')} onPress={() => setDel(null)} />
          </View>
        ) : null}
      </Card>

      <Card>
        <T kind="h2">{L('سجل التمارين', 'Exercise logbook')}</T>
        {!lifts.length ? <T kind="small">{L(`أول ما ${g('تسجل', 'تسجلي')} مجموعات في أي تمرين وتخلصه، هيظهر هنا تطور الوزن فيه.`, 'Once you log sets on an exercise and finish it, its weight progress shows here.')}</T> : lifts.map(([id, h]) => {
          const tr = liftTrend(h)!;
          const on = open === id;
          return (
            <View key={id} style={{ borderTopWidth: 1, borderColor: c.line, paddingTop: 8, gap: 6 }}>
              <Pressable onPress={() => setOpen(on ? null : id)} accessibilityRole="button" style={[styles.rowBetween, { gap: 8 }]}>
                <View style={{ flex: 1 }}>
                  <T kind="h3">{exName(p, id)}</T>
                  <T kind="small">{L(`${h.length} مرة · من ${tr.first.w} لـ ${tr.last.w} كجم`, `${h.length} sessions · ${tr.first.w} to ${tr.last.w} kg`)}</T>
                </View>
                <Num size={20} color={tr.diff > 0 ? c.ok : c.muted}>{`${tr.diff > 0 ? '+' : ''}${tr.diff}`}</Num>
              </Pressable>
              {on ? <LineChart points={h.map((x) => ({ label: dateLabel(x.date), v: x.w }))} unit={L(' كجم', ' kg')} height={130} empty={L('محتاجين مرتين على الأقل.', 'Needs at least two sessions.')} /> : null}
            </View>
          );
        })}
      </Card>
    </ScrollView></Bg>
  );
}
