// "Snap your progress": the camera opens inside a quiet frame with the week's real numbers (streak, workouts, days on the
// calorie target). The person takes a photo of anything, or picks one, and shares the picture with the frame on it.
import { CameraView, useCameraPermissions, type CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Btn, T } from '../components/ui.tsx';
import { dayKey } from '../lib/day.ts';
import { L, isEn } from '../lib/i18n.ts';
import { genderFor } from '../lib/plan.ts';
import { shortDate } from '../lib/report.ts';
import { shareView } from '../lib/shareImage.ts';
import { play } from '../lib/sound.ts';
import type { WeekStory } from '../lib/story.ts';
import { useWeek } from '../lib/useWeek.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts } from '../theme.ts';

const GREEN = '#19E68C', BLUE = '#2E9BFF', WHITE = '#FFFFFF', SOFT = 'rgba(255,255,255,0.72)', HAIR = 'rgba(255,255,255,0.22)';
const shadow = { textShadowColor: 'rgba(0,0,0,0.45)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 } as const;

/** The see-through frame: the name and dates on top, the week's numbers at the bottom over a soft shade. */
export function NumbersFrame({ w, s, streak, from, to }: { w: number; s: WeekStory; streak: number; from: Date; to: Date }) {
  const u = w / 360;
  const dir = isEn() ? 'ltr' : 'rtl';
  const align = isEn() ? 'left' : 'right';
  const t = (size: number, family: string, color = WHITE) => ({ fontFamily: family, fontSize: size * u, lineHeight: size * u * 1.35, color, writingDirection: dir, textAlign: align, ...shadow }) as const;
  const stats: [string, string][] = [
    [s.workouts.of ? `${s.workouts.done}/${s.workouts.of}` : `${s.workouts.done}`, L('تمارين', 'workouts')],
    [`${s.kcalDays}/${s.past || 7}`, L('أيام في هدف السعرات', 'days on calories')],
    [`${s.waterDays}`, L('أيام المية كاملة', 'days of full water')],
  ];
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'space-between' }}>
      <LinearGradient colors={['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']} style={{ paddingHorizontal: 20 * u, paddingTop: 20 * u, paddingBottom: 30 * u, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* The English lockup from the brand kit: the champ mark and YALLA WELL in Almarai ExtraBold caps. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 * u }}>
          <Svg width={22 * u} height={22 * u} viewBox="0 0 100 100">
            <Path d="M50 58V82" stroke={WHITE} strokeWidth={9} strokeLinecap="round" fill="none" />
            <Path d="M28 36L50 58L72 36" stroke={WHITE} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Circle cx={50} cy={24} r={9} fill={GREEN} />
          </Svg>
          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12 * u, lineHeight: 16 * u, letterSpacing: 3.2 * u, color: BLUE, writingDirection: 'ltr', ...shadow }}>YALLA WELL</Text>
        </View>
        <Text style={t(11, fonts.bodyMedium, SOFT)}>{shortDate(from)} – {shortDate(to)}</Text>
      </LinearGradient>
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.75)']} locations={[0, 0.45, 1]} style={{ paddingHorizontal: 20 * u, paddingTop: 60 * u, paddingBottom: 22 * u, gap: 12 * u }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 * u }}>
          <Text style={{ fontFamily: fonts.num, fontSize: 64 * u, lineHeight: 64 * u, color: GREEN, includeFontPadding: false, ...shadow }}>{streak}</Text>
          <View style={{ paddingBottom: 6 * u }}>
            <Text style={t(15, fonts.bodyMedium)}>{L(streak === 1 || streak > 10 ? 'يوم ورا بعض' : 'أيام ورا بعض', streak === 1 ? 'day in a row' : 'days in a row')}</Text>
            <Text style={t(11, fonts.body, SOFT)}>{L('في هدف السعرات', 'on my calorie target')}</Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: HAIR }} />
        <View style={{ flexDirection: 'row' }}>
          {stats.map(([v, label], i) => (
            <View key={i} style={{ flex: 1, gap: 2 * u }}>
              <Text style={{ fontFamily: fonts.numSemi, fontSize: 24 * u, lineHeight: 26 * u, color: WHITE, includeFontPadding: false, textAlign: align, ...shadow }}>{v}</Text>
              <Text style={t(10, fonts.bodyMedium, SOFT)}>{label}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: 4 * u }}>
          {s.days.map((d) => (
            <View key={d.key} style={{ flex: 1, height: 3 * u, borderRadius: 2 * u, backgroundColor: d.future ? 'rgba(255,255,255,0.12)' : d.kcalOk ? GREEN : HAIR }} />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

export default function StoryCam() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const { profile } = useStore();
  const { offset } = useLocalSearchParams<{ offset?: string }>();
  const wk = useWeek(Number(offset ?? 0));
  const [perm, requestPerm] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('front');
  const [photo, setPhoto] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const cam = useRef<CameraView>(null);
  const shot = useRef<View>(null);
  if (!profile || !wk) return null;
  const g = genderFor(profile.sex);
  // The picture is 9:16, as big as the screen allows under the buttons.
  const w = Math.min(width - 24, (height - insets.top - insets.bottom - 150) * (9 / 16), 440);
  const h = (w * 16) / 9;

  const take = async () => {
    if (!cam.current || busy) return;
    setBusy(true); play('tap');
    try {
      const r = await cam.current.takePictureAsync({ quality: 0.9, skipProcessing: false });
      if (r?.uri) setPhoto(r.uri);
    } catch {
      setMsg({ text: L(`الصورة متاخدتش. ${g('جرب', 'جربي')} تاني.`, "The photo didn't take. Try again."), bad: true });
    }
    setBusy(false);
  };
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    const a = r.canceled ? null : r.assets?.[0];
    if (a) { setMsg(null); setPhoto(a.uri); }
  };
  const share = async () => {
    setBusy(true); setMsg(null); play('tap');
    try {
      const r = await shareView(shot, { width: 1080, height: 1920 }, `yalla-well-${dayKey(wk.start)}`, L('أسبوعي في يلا ويل', 'My week on Yalla Well'));
      if (r === 'downloaded') setMsg({ text: L(`الصورة نزلت. ${g('افتحها', 'افتحيها')} من التنزيلات و${g('نزلها', 'نزليها')} ستوري.`, 'The picture was downloaded. Open it from your downloads and post it as a story.') });
    } catch {
      setMsg({ text: L(`معرفناش نعمل الصورة. ${g('جرب', 'جربي')} تاني.`, "Couldn't make the picture. Try again."), bad: true });
    }
    setBusy(false);
  };

  const round = (label: string, onPress: () => void, text: string) => (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} hitSlop={8}
      style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' }}>
      <Text style={{ color: WHITE, fontFamily: fonts.bodyMedium, fontSize: 12 }}>{text}</Text>
    </Pressable>
  );

  const granted = !!perm?.granted;
  return (
    <View style={{ flex: 1, backgroundColor: '#000', paddingTop: insets.top + 8, paddingBottom: insets.bottom + 12, alignItems: 'center', gap: 14 }}>
      <View style={{ width: w, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')} hitSlop={12}><Text style={{ fontSize: 28, color: SOFT }}>×</Text></Pressable>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15, color: WHITE }}>{L(`${g('صور', 'صوري')} إنجازك`, 'Snap your progress')}</Text>
          <Text style={{ fontFamily: fonts.body, fontSize: 12, color: SOFT }}>{L(`${g('وشاركه', 'وشاركيه')} مع ${g('أصحابك', 'أصحابك')}`, 'and share it with friends')}</Text>
        </View>
        <View style={{ width: 28 }} />
      </View>

      <View ref={shot} collapsable={false} style={{ width: w, height: h, borderRadius: photo ? 0 : 18, overflow: 'hidden', backgroundColor: '#0B0C0E' }}>
        {photo ? <Image source={{ uri: photo }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: w, height: h }} resizeMode="cover" />
          : granted ? <CameraView ref={cam} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} facing={facing} mirror={facing === 'front'} onCameraReady={() => setReady(true)} />
            : (
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
                <T kind="body" style={{ color: WHITE, textAlign: 'center' }}>{L('محتاجين إذن الكاميرا عشان الصورة تتاخد جوه الإطار.', 'We need camera access to take the photo inside the frame.')}</T>
                {perm?.canAskAgain !== false ? <Btn title={L(g('اسمح بالكاميرا', 'اسمحي بالكاميرا'), 'Allow camera')} onPress={requestPerm} /> : null}
                <Btn kind="outline" title={L(g('اختار صورة من الموبايل', 'اختاري صورة من الموبايل'), 'Pick a photo instead')} onPress={pick} />
              </View>
            )}
        {wk.s && (photo || granted) ? <NumbersFrame w={w} s={wk.s} streak={wk.streak} from={wk.start} to={wk.end} /> : null}
        {!wk.s ? <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={GREEN} /></View> : null}
      </View>

      {photo ? (
        <View style={{ width: w, gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn kind="outline" title={L('صورة تانية', 'Retake')} onPress={() => { setPhoto(null); setMsg(null); }} style={{ flex: 1 }} />
            <Btn title={busy ? L('بنجهزها...', 'Preparing...') : L(g('شارك', 'شاركي'), 'Share')} onPress={share} disabled={busy} style={{ flex: 1 }} />
          </View>
        </View>
      ) : granted ? (
        <View style={{ width: w, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          {round(L(g('اختار صورة من الموبايل', 'اختاري صورة من الموبايل'), 'Pick from photos'), pick, L('صور', 'Photos'))}
          <Pressable onPress={take} disabled={!ready || busy} accessibilityRole="button" accessibilityLabel={L(g('صور', 'صوري'), 'Take photo')}
            style={{ width: 74, height: 74, borderRadius: 37, borderWidth: 4, borderColor: WHITE, alignItems: 'center', justifyContent: 'center', opacity: ready ? 1 : 0.5 }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: busy ? GREEN : WHITE }} />
          </Pressable>
          {round(L(g('لف الكاميرا', 'لفي الكاميرا'), 'Flip camera'), () => { play('tap'); setReady(false); setFacing(facing === 'front' ? 'back' : 'front'); }, L(g('لف', 'لفي'), 'Flip'))}
        </View>
      ) : null}
      {msg ? <T kind="small" style={{ color: msg.bad ? '#FF5C6C' : GREEN, width: w }}>{msg.text}</T> : null}
    </View>
  );
}
