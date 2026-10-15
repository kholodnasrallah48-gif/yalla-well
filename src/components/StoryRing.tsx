// The story button next to the name on Today: the person's photo (or initial) inside a ring of 7 pieces, one per
// day of this week, lit green on days that hit the calorie target. It breathes gently and opens the camera with
// the numbers frame.
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { L } from '../lib/i18n.ts';
import type { Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { useWeek } from '../lib/useWeek.ts';
import { fonts, useColors } from '../theme.ts';
import { useStill } from './Mascot.tsx';

const native = Platform.OS !== 'web';
const BLUE = '#2E9BFF';

/** One piece of the ring, from angle a to b (degrees, 0 = top, clockwise). */
function arc(cx: number, r: number, a: number, b: number) {
  const pt = (deg: number) => { const t = ((deg - 90) * Math.PI) / 180; return `${cx + r * Math.cos(t)} ${cx + r * Math.sin(t)}`; };
  return `M ${pt(a)} A ${r} ${r} 0 0 1 ${pt(b)}`;
}

export function StoryRing({ profile, g, size = 62 }: { profile: Profile; g: (m: string, f: string) => string; size?: number }) {
  const c = useColors();
  const still = useStill();
  const wk = useWeek(0);
  const breathe = useRef(new Animated.Value(0)).current;
  const lit = useRef(new Animated.Value(0)).current;
  const press = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(lit, { toValue: 1, duration: still ? 0 : 900, delay: 250, easing: Easing.out(Easing.cubic), useNativeDriver: native }).start();
    if (still) return;
    const ease = Easing.inOut(Easing.sin);
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 1600, easing: ease, useNativeDriver: native }),
      Animated.timing(breathe, { toValue: 0, duration: 1600, easing: ease, useNativeDriver: native }),
      Animated.delay(1800),
    ]));
    loop.start();
    return () => loop.stop();
  }, [still]);

  const days = wk?.s?.days ?? [];
  const okDays = days.filter((d) => d.kcalOk).length;
  const stroke = 3.2, cx = size / 2, r = cx - stroke;
  const step = 360 / 7, gap = 9;
  const inner = size - stroke * 2 - 8;
  const scale = Animated.multiply(press, breathe.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] }));

  return (
    <Pressable onPress={() => { play('swoosh'); router.push('/storycam'); }}
      onPressIn={() => Animated.spring(press, { toValue: 0.92, useNativeDriver: native, speed: 40 }).start()}
      onPressOut={() => Animated.spring(press, { toValue: 1, useNativeDriver: native, friction: 4 }).start()}
      accessibilityRole="button" hitSlop={6}
      accessibilityLabel={L(`${g('صور', 'صوري')} إنجازك و${g('شاركه', 'شاركيه')} مع ${g('أصحابك', 'أصحابك')}`, 'Snap your progress and share it with friends')}
      accessibilityHint={L(`${okDays} من ٧ أيام في هدف السعرات الأسبوع ده`, `${okDays} of 7 days on your calorie target this week`)}>
      <Animated.View style={{ width: size, height: size, transform: [{ scale }] }}>
        <Svg width={size} height={size} style={{ position: 'absolute' }}>
          {Array.from({ length: 7 }, (_, i) => {
            const d = days[i];
            const color = !d ? c.line : d.future ? c.line : d.kcalOk ? c.petrol : c.dim;
            return <Path key={i} d={arc(cx, r, i * step + gap / 2, (i + 1) * step - gap / 2)} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" opacity={d?.future ? 0.6 : 1} />;
          })}
        </Svg>
        {/* The lit pieces fade in once, so the week "fills" when Today opens. */}
        <Animated.View style={{ position: 'absolute', top: stroke + 4, left: stroke + 4, width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center', opacity: lit.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }}>
          {profile.photo
            ? <Image source={{ uri: profile.photo }} style={{ width: inner, height: inner }} accessibilityIgnoresInvertColors />
            : <Text style={{ fontFamily: fonts.display, fontSize: inner * 0.42, lineHeight: inner * 0.62, color: c.petrol }}>{(profile.name.trim()[0] ?? 'Y').toUpperCase()}</Text>}
        </Animated.View>
        {/* Camera badge: says what the ring does. */}
        <View style={{ position: 'absolute', bottom: -2, end: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: BLUE, borderWidth: 2, borderColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.6-2.2h7.4L17.3 7h2.2A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z" />
            <Circle cx={12} cy={12.8} r={3.4} />
          </Svg>
        </View>
      </Animated.View>
    </Pressable>
  );
}
