// What the guided tour needs from the screens: the places it points at (TourTarget) and each screen's scroll, so it
// can bring a place into view. Kept apart from the tour itself so the shared building blocks can use it.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, type ReactNode } from 'react';
import { View, type ScrollView, type StyleProp, type ViewStyle } from 'react-native';

export const targets = new Map<string, View>();
export const scrollers = new Map<string, { view: ScrollView | null; y: number }>();
/** Things a screen can do for the tour (e.g. the train page opening a workout day when today is a rest day). */
export const tourActions = new Map<string, () => void>();

/** Wraps a part of a screen the tour can point at. */
export function TourTarget({ id, children, style }: { id: string; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const ref = useCallback((v: View | null) => { if (v) targets.set(id, v); else targets.delete(id); }, [id]);
  return <View ref={ref} collapsable={false} style={style}>{children}</View>;
}

const KEY = 'yallawell:tour';
const listeners = new Set<() => void>();
/** Shows the tour now (from Me, "show me around again"). */
export function startTour() { listeners.forEach((f) => f()); }
export function onTourStart(f: () => void) { listeners.add(f); return () => { listeners.delete(f); }; }
/** Whether the person has seen the tour (it shows once, on the first visit to home after signing up). */
export const tourSeen = () => AsyncStorage.getItem(KEY).then((v) => v === 'done').catch(() => true);
export const markTourSeen = () => AsyncStorage.setItem(KEY, 'done').catch(() => {});
