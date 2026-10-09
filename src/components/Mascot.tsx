// The captain: the champ from the logo as the app's character. Each screen shows him doing what the screen is
// about (cheering on home, eating on food, lifting or rowing on train, pointing during the tour). He moves in small
// loops while the screen is open, and stays still when the phone asks for reduced motion.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { useColors } from '../theme.ts';

export type Pose = 'cheer' | 'lift' | 'eat' | 'row' | 'point' | 'rest';

/** True when the phone asks for reduced motion. */
export function useStill() {
  const [still, setStill] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setStill).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setStill);
    return () => sub.remove();
  }, []);
  return still;
}

/** Seconds since mount, ticking about 30 times a second while `on`. */
export function useClock(on: boolean) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t0 = Date.now();
    const id = setInterval(() => setT((Date.now() - t0) / 1000), 33);
    return () => clearInterval(id);
  }, [on]);
  return t;
}

/** Point (x, y) turned `deg` degrees clockwise around (cx, cy). Points are computed here instead of rotating SVG
 * groups, because group rotation ignores its origin on phones. */
function rot(x: number, y: number, deg: number, cx = 50, cy = 58): string {
  const r = (deg * Math.PI) / 180, dx = x - cx, dy = y - cy;
  return `${(cx + dx * Math.cos(r) - dy * Math.sin(r)).toFixed(2)} ${(cy + dx * Math.sin(r) + dy * Math.cos(r)).toFixed(2)}`;
}
const line = (pts: [number, number][], deg: number, cx?: number, cy?: number) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${rot(x, y, deg, cx, cy)}`).join('');

/** A loop that is 1 at the top of each beat and rests in between: `beats` quick pumps every `every` seconds. */
function pump(t: number, every: number, beats = 2, beat = 0.42) {
  const p = t % every;
  if (p > beats * beat) return 0;
  return Math.sin((Math.PI * (p % beat)) / beat) ** 2;
}

export function Mascot({ pose, size = 96, color, head, animate = true, excited = false }: {
  pose: Pose; size?: number;
  /** Body colour (defaults to the text colour); head colour (defaults to the accent). */
  color?: string; head?: string;
  animate?: boolean;
  /** Celebrating: the moves get bigger and faster. */
  excited?: boolean;
}) {
  const c = useColors();
  const still = useStill();
  const t = useClock(animate && !still);
  const ink = color ?? c.ink;
  const acc = head ?? c.petrol;
  const s = { stroke: ink, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  let body: React.ReactNode = null;

  if (pose === 'cheer' || pose === 'rest') {
    const a = pose === 'rest' ? 0 : (excited ? 22 : 14) * pump(t, excited ? 0.9 : 3.6, excited ? 1 : 2);
    const spark = pose === 'rest' ? 0 : 0.55 + 0.45 * Math.abs(Math.sin(t * 2.4));
    body = <>
      <Path d="M50 58V84" {...s} strokeWidth={8} />
      <Path d={`M${rot(28, 36, -a)}L50 58L${rot(72, 36, a)}`} {...s} strokeWidth={8} />
      <Circle cx={50} cy={26} r={8} fill={acc} />
      {pose === 'cheer' ? <Path d="M20 28L16 22M24 22L22 15M80 28L84 22M76 22L78 15" stroke={acc} strokeWidth={3.5} strokeLinecap="round" fill="none" opacity={spark} /> : null}
    </>;
  } else if (pose === 'lift') {
    // The bar goes up and down: the whole champ bobs, faster when excited.
    const dy = -4 * Math.max(0, Math.sin(t * (excited ? 6 : 3.4)));
    body = <G transform={`translate(0 ${dy.toFixed(2)})`}>
      <Path d="M50 60V88" {...s} strokeWidth={8} />
      <Path d="M26 24L50 60L74 24" {...s} strokeWidth={8} />
      <Circle cx={50} cy={44} r={6.5} fill={acc} />
      <Path d="M10 22H90" stroke={ink} strokeWidth={5} strokeLinecap="round" fill="none" />
      <Rect x={7} y={11} width={9} height={22} rx={3} fill={acc} />
      <Rect x={84} y={11} width={9} height={22} rx={3} fill={acc} />
    </G>;
  } else if (pose === 'eat') {
    // The fork comes up to the mouth and back.
    const a = -16 * pump(t, excited ? 1 : 2.2, 1, 0.7);
    body = <>
      <Path d="M50 58V84" {...s} strokeWidth={8} />
      <Path d="M50 58L32 54" {...s} strokeWidth={8} />
      <Path d="M12 50H46Q44 68 29 68Q14 68 12 50Z" fill={ink} />
      <Path d="M16 50Q20 42 25 48Q29 41 34 48Q38 43 42 50Z" fill={acc} />
      <Path d={line([[50, 58], [70, 40]], a)} {...s} strokeWidth={8} />
      <Path d={line([[70, 40], [75, 20]], a)} {...s} strokeWidth={4} />
      <Path d={`${line([[71, 20], [80, 20]], a)}${line([[71.5, 20], [72, 11]], a)}${line([[75.5, 20], [75.5, 11]], a)}${line([[79.5, 20], [79, 11]], a)}`} {...s} strokeWidth={3} />
      <Circle cx={50} cy={28} r={8} fill={acc} />
    </>;
  } else if (pose === 'row') {
    // Pulls the dumbbell up to the hip and lowers it.
    const a = -38 * Math.max(0, Math.sin(t * (excited ? 5 : 2.6)));
    const bell = (x: number, y: number) => {
      const [cx, cy] = rot(x, y, a).split(' ').map(Number);
      return <Rect x={cx - 3.5} y={cy - 6} width={7} height={12} rx={2} fill={acc} transform={`rotate(${-40 + a} ${cx} ${cy})`} />;
    };
    body = <>
      <Path d="M50 58V86" {...s} strokeWidth={7} />
      <Path d="M50 58L31 42" {...s} strokeWidth={7} />
      <Path d={line([[50, 58], [70, 74]], a)} {...s} strokeWidth={7} />
      <Path d={line([[64, 80], [78, 68]], a)} {...s} strokeWidth={3.5} />
      {bell(62.5, 80)}
      {bell(79.5, 68)}
      <Circle cx={50} cy={28} r={8} fill={acc} />
    </>;
  } else {
    // Tour guide: one arm waves, the other points ahead.
    const a = 12 * Math.sin(t * 5) * (pump(t, 3, 1, 1.2) > 0 ? 1 : 0);
    body = <>
      <Path d="M50 58V84" {...s} strokeWidth={8} />
      <Path d={line([[50, 58], [30, 34]], -a)} {...s} strokeWidth={8} />
      <Path d="M50 58L82 47" {...s} strokeWidth={8} />
      <Circle cx={50} cy={26} r={8} fill={acc} />
    </>;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: 'visible' }}>
      {body}
    </Svg>
  );
}

/** The champ's head: the app's mark for "done" (a filled dot) and "to do" (a ring). */
export function Head({ on, size = 10, color, ring }: { on: boolean; size?: number; color?: string; ring?: string }) {
  const c = useColors();
  const acc = color ?? c.petrol;
  return (
    <Svg width={size} height={size} viewBox="0 0 10 10">
      {on ? <Circle cx={5} cy={5} r={5} fill={acc} /> : <Circle cx={5} cy={5} r={4} fill="none" stroke={ring ?? c.line} strokeWidth={2} />}
    </Svg>
  );
}
