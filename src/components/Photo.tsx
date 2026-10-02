// Profile picture: pick from the library or take one, cropped square and shrunk to a small JPEG kept with the profile.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { L } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { T, lift, styles } from './ui.tsx';

async function shrink(uri: string): Promise<string> {
  const img = await ImageManipulator.manipulate(uri).resize({ width: 400 }).renderAsync();
  const out = await img.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  return `data:image/jpeg;base64,${out.base64}`;
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

export function PhotoPicker({ photo, name, onChange, size = 96 }: { photo?: string; name?: string; onChange: (p: string | undefined) => void; size?: number }) {
  const c = useColors();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const pick = async (camera: boolean) => {
    play('tap');
    setErr('');
    try {
      if (camera) {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { setErr(L('محتاجين إذن الكاميرا من الإعدادات.', 'Camera access is needed; allow it in Settings.')); return; }
      }
      const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 1 };
      const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
      if (r.canceled || !r.assets?.[0]) return;
      setBusy(true);
      onChange(await shrink(r.assets[0].uri));
      play('check');
    } catch {
      setErr(L('مقدرناش نفتح الصورة، جربي تاني.', "Couldn't open the photo, try again."));
    } finally {
      setBusy(false);
    }
  };
  const link = (label: string, onPress: () => void) => (
    <Pressable onPress={onPress} accessibilityRole="button" hitSlop={6}
      style={({ pressed }) => [{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 99, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface }, lift(c, 'sm'), pressed && styles.pressed]}>
      <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: c.petrol }}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{ alignItems: 'center', gap: 8 }}>
      <Pressable onPress={() => pick(false)} accessibilityRole="button" accessibilityLabel={L('تغيير الصورة', 'Change photo')}>
        <PhotoView photo={photo} name={name} size={size} />
        {busy ? <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.petrol} /></View> : null}
      </Pressable>
      <View style={[styles.row, { gap: 8 }]}>
        {link(photo ? L('غيّر الصورة', 'Change photo') : L('ضيف صورة', 'Add photo'), () => pick(false))}
        {link(L('الكاميرا', 'Camera'), () => pick(true))}
        {photo ? link(L('شيل', 'Remove'), () => { play('remove'); onChange(undefined); }) : null}
      </View>
      {err ? <T kind="small" color={c.bad} style={{ textAlign: 'center' }}>{err}</T> : null}
    </View>
  );
}
