// Photos of lab papers, kept only on the phone. Each photo is stored on its own so the profile stays small; the lab
// entry keeps its id.
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const KEY = 'yallawell:labphoto:';

/** Asks for a photo (camera or gallery), shrinks it to a readable size and saves it. Returns its id, or null when
 * nothing was picked. */
export async function pickLabPhoto(camera: boolean): Promise<string | null> {
  if (camera) { const perm = await ImagePicker.requestCameraPermissionsAsync(); if (!perm.granted) return null; }
  const r = camera
    ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 })
    : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  const a = r.canceled ? null : r.assets?.[0];
  if (!a) return null;
  // Wide enough for the small print on a lab paper to stay readable.
  const img = await ImageManipulator.manipulate(a.uri).resize({ width: Math.min(1400, a.width || 1400) }).renderAsync();
  const out = await img.saveAsync({ compress: 0.65, format: SaveFormat.JPEG, base64: true });
  const id = String(Date.now());
  await AsyncStorage.setItem(KEY + id, `data:image/jpeg;base64,${out.base64}`);
  return id;
}

export const readLabPhoto = (id: string): Promise<string | null> => AsyncStorage.getItem(KEY + id).catch(() => null);
export const deleteLabPhoto = (id: string): Promise<void> => AsyncStorage.removeItem(KEY + id).catch(() => {});
