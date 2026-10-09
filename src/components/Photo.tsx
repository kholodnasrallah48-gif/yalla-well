// Profile picture: pick from the library or take one, then drag and zoom it inside the circle to choose what shows.
// The chosen square is cut out and shrunk to a small JPEG kept with the profile.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Image, Modal, PanResponder, Pressable, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { L } from '../lib/i18n.ts';
import { genderFor, type Sex } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Kicker, RADIUS, T, lift, styles } from './ui.tsx';

type Pick = { uri: string; w: number; h: number };
type Rect = { originX: number; originY: number; width: number; height: number };

async function cut(uri: string, rect: Rect | null): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  if (rect) ctx.crop(rect);
  const img = await ctx.resize({ width: 400 }).renderAsync();
  const out = await img.saveAsync({ compress: 0.75, format: SaveFormat.JPEG, base64: true });
  return `data:image/jpeg;base64,${out.base64}`;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Drag the photo and zoom (pinch or the buttons) until the face sits in the circle. */
function Cropper({ pick, onDone, onCancel, sex }: { pick: Pick; onDone: (rect: Rect) => void; onCancel: () => void; sex?: Sex }) {
  const c = useColors();
  const g = genderFor(sex);
  const { width } = useWindowDimensions();
  const V = Math.min(width - 48, 320);
  const base = V / Math.min(pick.w, pick.h);
  const [zoom, setZoom] = useState(1);
  const fit = (z: number, x: number, y: number) => {
    const s = base * z;
    return { x: clamp(x, V - pick.w * s, 0), y: clamp(y, V - pick.h * s, 0) };
  };
  const [pos, setPos] = useState(() => fit(1, (V - pick.w * base) / 2, (V - pick.h * base) / 2));
  const live = useRef({ zoom, pos });
  live.current = { zoom, pos };
  // Zooming keeps the middle of the circle on the same spot of the photo.
  const zoomTo = (z: number) => {
    const { zoom: z0, pos: p0 } = live.current;
    const nz = clamp(z, 1, 5);
    const k = nz / z0;
    setZoom(nz);
    setPos(fit(nz, V / 2 - (V / 2 - p0.x) * k, V / 2 - (V / 2 - p0.y) * k));
  };
  const start = useRef({ x: 0, y: 0, dist: 0, zoom: 1 });
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => {
      const t = e.nativeEvent.touches;
      start.current = { x: live.current.pos.x, y: live.current.pos.y, zoom: live.current.zoom, dist: t && t.length > 1 ? Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY) : 0 };
    },
    onPanResponderMove: (e, g) => {
      const t = e.nativeEvent.touches;
      if (t && t.length > 1) {
        const d = Math.hypot(t[0].pageX - t[1].pageX, t[0].pageY - t[1].pageY);
        if (!start.current.dist) start.current.dist = d;
        else zoomTo(start.current.zoom * (d / start.current.dist));
        return;
      }
      setPos(fit(live.current.zoom, start.current.x + g.dx, start.current.y + g.dy));
    },
    onPanResponderRelease: () => { start.current.dist = 0; },
  }), [V, pick]);
  const s = base * zoom;
  const done = () => {
    const size = Math.min(V / s, pick.w, pick.h);
    onDone({ originX: Math.round(clamp(-pos.x / s, 0, pick.w - size)), originY: Math.round(clamp(-pos.y / s, 0, pick.h - size)), width: Math.floor(size), height: Math.floor(size) });
  };
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
      <Kicker>{L(`${g('حرك', 'حركي')} الصورة و${g('كبرها', 'كبريها')}`, 'Move and zoom your photo')}</Kicker>
      <T kind="small" color="#C9CDD1" style={{ textAlign: 'center' }}>{L(`${g('اسحب', 'اسحبي')} الصورة بصباع${g('ك', 'ك')} لحد ما وش${g('ك', 'ك')} يبقى في نص الدايرة، و${g('كبر أو صغر', 'كبري أو صغري')} من الزراير أو بصباعين.`, 'Drag the photo until your face sits in the circle; zoom with the buttons or two fingers.')}</T>
      <View {...pan.panHandlers} style={{ width: V, height: V, overflow: 'hidden', direction: 'ltr', backgroundColor: '#000', borderRadius: RADIUS }}>
        <Image source={{ uri: pick.uri }} style={{ position: 'absolute', left: pos.x, top: pos.y, width: pick.w * s, height: pick.h * s }} accessibilityIgnoresInvertColors />
        <Svg width={V} height={V} style={{ position: 'absolute', left: 0, top: 0 }} pointerEvents="none">
          <Path d={`M0 0H${V}V${V}H0Z M${V / 2} ${V / 2}m-${V / 2 - 2} 0a${V / 2 - 2} ${V / 2 - 2} 0 1 0 ${V - 4} 0a${V / 2 - 2} ${V / 2 - 2} 0 1 0 -${V - 4} 0Z`} fill="rgba(0,0,0,0.55)" fillRule="evenodd" />
          <Circle cx={V / 2} cy={V / 2} r={V / 2 - 2} stroke={c.petrol} strokeWidth={2.5} fill="none" />
        </Svg>
      </View>
      <View style={[styles.row, { gap: 10 }]}>
        <ZoomBtn label="−" onPress={() => zoomTo(zoom - 0.25)} />
        <View style={{ width: 120, height: 4, borderRadius: 2, backgroundColor: '#2A2E33' }}>
          <View style={{ width: `${((zoom - 1) / 4) * 100}%`, height: 4, borderRadius: 2, backgroundColor: c.petrol }} />
        </View>
        <ZoomBtn label="+" onPress={() => zoomTo(zoom + 0.25)} />
      </View>
      <View style={[styles.row, { gap: 10, alignSelf: 'stretch' }]}>
        <Btn kind="outline" title={L('إلغاء', 'Cancel')} onPress={onCancel} />
        <Btn title={L('تمام كده', 'Use this')} onPress={done} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

function ZoomBtn({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { play('pop'); onPress(); }} accessibilityRole="button" accessibilityLabel={label === '+' ? L('كبري', 'Zoom in') : L('صغري', 'Zoom out')}
      style={({ pressed }) => [{ width: 48, height: 44, borderRadius: RADIUS, borderWidth: 1, borderColor: '#2A2E33', alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 22, color: c.petrol }}>{label}</Text>
    </Pressable>
  );
}

/** Round picture (or a placeholder); with onChange it also shows the pick / camera / remove buttons. */
export function PhotoView({ photo, size = 72, name }: { photo?: string; size?: number; name?: string }) {
  const c = useColors();
  if (photo) return (
    <View style={[{ width: size, height: size, borderRadius: size / 2 }, lift(c, 'glow')]}>
      <Image source={{ uri: photo }} style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: c.petrol }} accessibilityIgnoresInvertColors />
    </View>
  );
  return (
    <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: c.soft, borderWidth: 2, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, lift(c, 'sm')]}>
      {name ? <Text style={{ fontFamily: fonts.display, fontSize: size * 0.4, color: c.petrol }}>{name.trim().charAt(0)}</Text> : (
        <Svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none" stroke={c.muted} strokeWidth={1.8} strokeLinecap="round">
          <Circle cx={12} cy={8} r={4} /><Path d="M4 21c1-4 4.5-6 8-6s7 2 8 6" />
        </Svg>
      )}
    </View>
  );
}

export function PhotoPicker({ photo, name, onChange, size = 96, sex }: { photo?: string; name?: string; onChange: (p: string | undefined) => void; size?: number; sex?: Sex }) {
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [crop, setCrop] = useState<Pick | null>(null);
  const pick = async (camera: boolean) => {
    play('tap');
    setErr('');
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { setErr(L('محتاجين إذن الكاميرا من الإعدادات.', 'Camera access is needed; allow it in Settings.')); return; }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: false, quality: 1 };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      const a = r.canceled ? null : r.assets?.[0];
      if (!a) return;
      if (a.width && a.height) { setCrop({ uri: a.uri, w: a.width, h: a.height }); return; }
      // Size unknown: keep the middle square.
      setBusy(true);
      onChange(await cut(a.uri, null));
      play('check');
    } catch {
      setErr(L('مقدرناش نفتح الصورة، جربي تاني.', "Couldn't open the photo, try again."));
    } finally {
      setBusy(false);
    }
  };
  const link = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6}
      style={({ pressed }) => [{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }, lift(c, 'sm'), pressed && styles.pressed]}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: c.petrol }}>{label}</Text>
    </Pressable>
  );
  const finish = async (rect: Rect) => {
    const p = crop;
    setCrop(null);
    if (!p) return;
    setBusy(true);
    try { onChange(await cut(p.uri, rect)); play('check'); } catch { setErr(L('مقدرناش نفتح الصورة، جربي تاني.', "Couldn't open the photo, try again.")); }
    setBusy(false);
  };
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Modal visible={!!crop} transparent animationType="fade" onRequestClose={() => setCrop(null)}>
        {crop ? <Cropper pick={crop} onDone={finish} onCancel={() => setCrop(null)} sex={sex} /> : null}
      </Modal>
      <Pressable onPress={() => pick(false)} accessibilityRole="button" accessibilityLabel={L('تغيير الصورة', 'Change photo')}>
        <PhotoView photo={photo} name={name} size={size} />
        {busy ? <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.petrol} /></View> : null}
      </Pressable>
      <View style={[styles.row, { gap: 8 }]}>
        {link(photo ? L('غير الصورة', 'Change photo') : L('ضيف صورة', 'Add photo'), () => pick(false))}
        {link(L('الكاميرا', 'Camera'), () => pick(true))}
        {photo ? link(L('شيل', 'Remove'), () => { play('remove'); onChange(undefined); }) : null}
      </View>
      {err ? <T kind="small" color={c.bad} style={{ textAlign: 'center' }}>{err}</T> : null}
    </View>
  );
}
