// Where the person is right now, asked only when they tap to find places near them. Nothing is stored.
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type Here = { lat: number; lon: number } | 'denied' | 'off';

export async function whereAmI(): Promise<Here> {
  if (Platform.OS === 'web') {
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : undefined;
    if (!geo) return 'off';
    return new Promise((done) => geo.getCurrentPosition(
      (p) => done({ lat: p.coords.latitude, lon: p.coords.longitude }),
      (e) => done(e.code === 1 ? 'denied' : 'off'),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 },
    ));
  }
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return 'denied';
    const last = await Location.getLastKnownPositionAsync({ maxAge: 300000 });
    const p = last ?? await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: p.coords.latitude, lon: p.coords.longitude };
  } catch {
    return 'off';
  }
}
