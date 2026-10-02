// Short sound effects for actions (tap, add food, tick an exercise, finish a workout...). They follow the phone's
// silent switch, mix with music, and can be turned off from the profile tab.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

const FILES = {
  tap: require('../../assets/sounds/tap.wav'),
  add: require('../../assets/sounds/add.wav'),
  check: require('../../assets/sounds/check.wav'),
  win: require('../../assets/sounds/win.wav'),
  remove: require('../../assets/sounds/remove.wav'),
  warn: require('../../assets/sounds/warn.wav'),
};
export type Sound = keyof typeof FILES;
const KEY = 'yallawell:sound';
let on = true;
const players: Partial<Record<Sound, AudioPlayer>> = {};
const listeners = new Set<(v: boolean) => void>();

AsyncStorage.getItem(KEY).then((v) => { if (v === 'off') { on = false; listeners.forEach((f) => f(on)); } }).catch(() => {});
setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});

export function play(s: Sound) {
  if (!on) return;
  try {
    const p = (players[s] ??= createAudioPlayer(FILES[s]));
    p.seekTo(0);
    p.play();
  } catch { /* sound is a nicety; never break an action over it */ }
}

export const soundOn = () => on;
export function setSoundOn(v: boolean) {
  on = v;
  AsyncStorage.setItem(KEY, v ? 'on' : 'off').catch(() => {});
  listeners.forEach((f) => f(v));
}
export function onSoundChange(f: (v: boolean) => void) { listeners.add(f); return () => { listeners.delete(f); }; }
