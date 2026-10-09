// Short sound effects for actions (tap, add food, tick an exercise, finish a workout...). They follow the phone's
// silent switch, mix with music, and can be turned off from the profile tab.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

const FILES = {
  tap: require('../../assets/sounds/tap.wav'),
  add: require('../../assets/sounds/add.wav'),
  check: require('../../assets/sounds/check.wav'),
  win: require('../../assets/sounds/win.wav'),
  remove: require('../../assets/sounds/remove.wav'),
  warn: require('../../assets/sounds/warn.wav'),
  /** Played once when the app opens, in time with the logo animation. */
  intro: require('../../assets/sounds/intro.wav'),
  /** Referee whistle: a workout starts. */
  whistle: require('../../assets/sounds/whistle.wav'),
  /** Moving on (tour steps, opening a panel). */
  swoosh: require('../../assets/sounds/swoosh.wav'),
  /** A counter going up. */
  pop: require('../../assets/sounds/pop.wav'),
};
export type Sound = keyof typeof FILES;
const KEY = 'yallawell:sound';
let on = true;
const players: Partial<Record<Sound, AudioPlayer>> = {};
const listeners = new Set<(v: boolean) => void>();

const loaded = AsyncStorage.getItem(KEY).then((v) => { if (v === 'off') { on = false; listeners.forEach((f) => f(on)); } }).catch(() => {});
setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});

// A light tap of the phone's vibration goes with each sound, so actions are felt as well as heard.
const FEEL: Partial<Record<Sound, () => Promise<void>>> = {
  tap: () => Haptics.selectionAsync(),
  pop: () => Haptics.selectionAsync(),
  add: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  check: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),
  remove: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  whistle: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
  win: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warn: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
};

export function play(s: Sound) {
  if (!on) return;
  if (Platform.OS !== 'web') FEEL[s]?.().catch(() => {});
  try {
    const p = (players[s] ??= createAudioPlayer(FILES[s]));
    p.seekTo(0);
    p.play();
  } catch { /* sound is a nicety; never break an action over it */ }
}

/** Like play(), but waits for the saved on/off setting first (for the opening sound, before it has loaded). */
// Browsers block sound before the first tap, so the web preview skips it.
export function playWhenReady(s: Sound) { if (Platform.OS !== 'web') loaded.then(() => play(s)); }

export const soundOn = () => on;
export function setSoundOn(v: boolean) {
  on = v;
  AsyncStorage.setItem(KEY, v ? 'on' : 'off').catch(() => {});
  listeners.forEach((f) => f(v));
}
export function onSoundChange(f: (v: boolean) => void) { listeners.add(f); return () => { listeners.delete(f); }; }
