// The first time the app opens on a new day, a flame flares up over the home screen with the current streak.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Circle, Stop, LinearGradient } from 'react-native-svg';

import { dayKey } from '../lib/day.ts';
import { L, num } from '../lib/i18n.ts';
import { play } from '../lib/sound.ts';
import { tourSeen } from './TourTarget.tsx';
import { fonts, useColors } from '../theme.ts';

const KEY = 'yallawell:lastOpen';
const native = Platform.OS !== 'web';

function BigFlame() {
  return (
    <Svg width={150} height={170} viewBox="0 0 150 170">
      <Defs>
        <LinearGradient id="outer" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFD60A" />
          <Stop offset="0.55" stopColor="#FF8A3D" />
          <Stop offset="1" stopColor="#FF3D3D" />
        </LinearGradient>
        <LinearGradient id="inner" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFD60A" />
        </LinearGradient>
      </Defs>
      <Path d="M75 6c5 22-12 34-23 48C41 68 30 84 30 106a45 45 0 0 0 90 0c0-18-8-33-18-43-2 11-8 19-17 22 5-30-2-58-10-79z" fill="url(#outer)" />
      <Path d="M75 151a24 24 0 0 1-24-24c0-13 10-21 16-29 2 8 7 12 13 14 2-7 5-11 8-14 7 8 11 16 11 29a24 24 0 0 1-24 24z" fill="url(#inner)" />
    </Svg>
  );
}

export function DailyFire({ streak }: { streak: number }) {
  const c = useColors();
  const [show, setShow] = useState(false);
  const pop = useRef(new Animated.Value(0)).current;
  const flick = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const today = dayKey(new Date());
    Promise.all([AsyncStorage.getItem(KEY), tourSeen()]).then(([last, seen]) => {
      if (last === today) return;
      AsyncStorage.setItem(KEY, today).catch(() => {});
      // On the very first visit the guided tour plays instead.
      if (seen) setShow(true);
    }).catch(() => {});
  }, []);
  useEffect(() => {
    if (!show) return;
    play('win');
    Animated.spring(pop, { toValue: 1, friction: 4, tension: 70, useNativeDriver: native }).start();
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(flick, { toValue: 1, duration: 280, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(flick, { toValue: 0, duration: 320, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    loop.start();
    const t = setTimeout(close, 3200);
    return () => { loop.stop(); clearTimeout(t); };
  }, [show]);
  const close = () => {
    Animated.timing(pop, { toValue: 0, duration: 220, useNativeDriver: native }).start(() => setShow(false));
  };
  if (!show) return null;
  const scaleY = flick.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const scaleX = flick.interpolate({ inputRange: [0, 1], outputRange: [1, 0.95] });
  const glow = flick.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.85] });
  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Pressable onPress={close} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')} style={{ flex: 1 }}>
        <Animated.View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', opacity: pop }}>
          <Animated.View style={{ alignItems: 'center', transform: [{ scale: pop }] }}>
            <Animated.View style={{ position: 'absolute', top: -40, opacity: glow }}>
              <Svg width={260} height={260}>
                <Defs>
                  <RadialGradient id="g" cx="50%" cy="50%" r="50%">
                    <Stop offset="0" stopColor="#FF8A3D" stopOpacity={0.8} />
                    <Stop offset="1" stopColor="#FF8A3D" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Circle cx={130} cy={130} r={130} fill="url(#g)" />
              </Svg>
            </Animated.View>
            <Animated.View style={{ transform: [{ translateY: 20 }, { scaleY }, { scaleX }, { translateY: -20 }] }}>
              <BigFlame />
            </Animated.View>
            <View style={{ marginTop: 18, alignItems: 'center', gap: 6 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 42, color: '#FFFFFF' }}>{L('يوم جديد!', 'A new day!')}</Text>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 24, color: '#FFFFFF', opacity: 0.85, textAlign: 'center' }}>
                {streak > 0
                  ? L(`الستريك ${num(streak)} ${streak === 1 ? 'يوم' : 'أيام'} في السعرات، كمّل النهارده`, `${num(streak)}-day streak, keep it going today`)
                  : L('يلا نبدأ الستريك من النهارده', "Let's start a streak today")}
              </Text>
              <View style={{ marginTop: 10, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 99, backgroundColor: c.petrol }}>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15, color: c.onPetrol }}>{L('يلا بينا', "Let's go")}</Text>
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
