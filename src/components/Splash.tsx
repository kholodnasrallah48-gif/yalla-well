// Opening screen ("cheer", lockup م٦): the icon pops beside the name, the champ rises and pumps its arms twice with confetti, then the name comes in word by word.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { L as lang } from '../lib/i18n.ts';
import { fonts } from '../theme.ts';

const P = '#0E1621';
const L = '#2E9BFF';
const A = '#FFD60A';
const AG = Animated.createAnimatedComponent(G);
const ACircle = Animated.createAnimatedComponent(Circle);
const CONFETTI: [number, number, string][] = [[-34, -30, L], [34, -34, A], [-44, 4, '#FFFFFF'], [44, 0, L], [-20, -46, A], [22, -48, '#FFFFFF'], [-40, -14, L], [40, -18, A]];

/** Arm end point (from the shoulder at 50,58) turned by `deg` degrees clockwise. */
function armEnd(x: number, y: number, deg: number) {
  const r = (deg * Math.PI) / 180, dx = x - 50, dy = y - 58;
  return `${(50 + dx * Math.cos(r) - dy * Math.sin(r)).toFixed(2)} ${(58 + dx * Math.sin(r) + dy * Math.cos(r)).toFixed(2)}`;
}

/**
 * The champ: a Y with raised arms, a lime head and cheer marks. `arm` swings both arms outward by that many degrees
 * (left arm counter-clockwise, right arm clockwise) around the shoulder, like the approved cheer model.
 * The arm ends are computed here instead of rotating SVG groups, because animated group rotation ignores its origin on phones.
 */
export function Champ({ arm = 0, sparks, confetti }: { arm?: number; sparks?: Animated.Value; confetti?: Animated.Value }) {
  return (
    <>
      <Path d="M50 58V82" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
      <Path d={`M${armEnd(28, 36, -arm)}L50 58L${armEnd(72, 36, arm)}`} fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={50} cy={26} r={8} fill={L} />
      <AG opacity={sparks ?? 1}><Path d="M20 28L16 22M24 22L22 15M80 28L84 22M76 22L78 15" fill="none" stroke={L} strokeWidth={3.5} strokeLinecap="round" /></AG>
      {confetti ? CONFETTI.map(([x, y, c], i) => (
        <ACircle key={i} r={3} fill={c}
          cx={confetti.interpolate({ inputRange: [0, 1], outputRange: [50, 50 + x] })}
          cy={confetti.interpolate({ inputRange: [0, 1], outputRange: [30, 30 + y] })}
          opacity={confetti.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] })} />
      )) : null}
    </>
  );
}

export function Splash({ onDone }: { onDone: () => void }) {
  const v = useRef({
    pop: new Animated.Value(0), rise: new Animated.Value(0), arm: new Animated.Value(0), sparks: new Animated.Value(0),
    confetti: new Animated.Value(0), w1: new Animated.Value(0), w2: new Animated.Value(0), lat: new Animated.Value(0), out: new Animated.Value(1),
  }).current;
  const [armDeg, setArmDeg] = useState(0);
  useEffect(() => {
    const id = v.arm.addListener(({ value }) => setArmDeg(value));
    return () => v.arm.removeListener(id);
  }, []);
  useEffect(() => {
    const spring = (x: Animated.Value) => Animated.spring(x, { toValue: 1, friction: 5, tension: 90, useNativeDriver: false });
    const pump = (to: number) => Animated.timing(v.arm, { toValue: to, duration: 225, easing: Easing.inOut(Easing.quad), useNativeDriver: false });
    Animated.sequence([
      spring(v.pop),
      spring(v.rise),
      Animated.parallel([
        Animated.sequence([pump(28), pump(0), pump(28), pump(0)]),
        Animated.timing(v.sparks, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(v.confetti, { toValue: 1, duration: 1000, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.sequence([Animated.delay(450), Animated.stagger(150, [spring(v.w1), spring(v.w2)])]),
        Animated.sequence([Animated.delay(800), Animated.timing(v.lat, { toValue: 1, duration: 400, useNativeDriver: false })]),
      ]),
      Animated.delay(350),
      Animated.timing(v.out, { toValue: 0, duration: 280, useNativeDriver: false }),
    ]).start(onDone);
  }, []);
  const up = (x: Animated.Value) => ({ opacity: x.interpolate({ inputRange: [0, 1], outputRange: [0, 1], extrapolate: 'clamp' }), transform: [{ translateY: x.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }] });

  return (
    // Fixed right-to-left layout so the icon sits on the right and the name reads "يلا ويل" even before RTL is applied.
    <Animated.View style={{ flex: 1, backgroundColor: P, alignItems: 'center', justifyContent: 'center', opacity: v.out, direction: 'rtl' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <Animated.View style={{ width: 96, height: 96, transform: [{ scale: v.pop }] }}>
          <Svg width={96} height={96} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
            <Rect width={100} height={100} rx={24} fill={P} stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
            <AG opacity={v.rise} translateY={v.rise.interpolate({ inputRange: [0, 1], outputRange: [60, 0] })}>
              <Champ arm={armDeg} sparks={v.sparks} confetti={v.confetti} />
            </AG>
          </Svg>
        </Animated.View>
        <View style={{ alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Animated.Text style={[{ fontFamily: fonts.brand, fontSize: 50, lineHeight: 64, color: '#FFFFFF' }, up(v.w1)]}>يلا</Animated.Text>
            <Animated.Text style={[{ fontFamily: fonts.brand, fontSize: 50, lineHeight: 64, color: L }, up(v.w2)]}>ويل</Animated.Text>
          </View>
          <Animated.Text style={{ fontFamily: fonts.displaySemi, fontSize: 12, letterSpacing: 4, color: A, opacity: v.lat, writingDirection: 'ltr' }}>YALLA WELL</Animated.Text>
        </View>
      </View>
      <Text accessibilityRole="header" style={{ position: 'absolute', opacity: 0 }}>{lang('يلا ويل', 'Yalla Well')}</Text>
    </Animated.View>
  );
}
