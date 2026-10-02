// The person's avatar, drawn as SVG. The body follows the BMI (it eases to a new shape when the weight changes);
// skin, hair, makeup and clothes come from their own picks.
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Line, Path, Rect } from 'react-native-svg';

import { shapeFor, type Avatar as A, type Shape } from '../lib/avatar.ts';

type P = [number, number];
const CX = 100;

/** Smooth closed (or open) curve through the points (Catmull-Rom turned into cubic Béziers). */
function smooth(pts: P[], closed = true): string {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1: P = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2: P = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return closed ? d + 'Z' : d;
}

/** Right half → whole outline: right side top to bottom, then the left side mirrored bottom to top. */
const mirror = (right: P[]): P[] => [...right.map(([x, y]) => [CX + x, y] as P), ...[...right].reverse().map(([x, y]) => [CX - x, y] as P)];

function torso(s: Shape): P[] {
  return mirror([
    [s.neck, 94], [s.shoulder - 4, 102], [s.shoulder, 112], [s.chest, 130], [s.chest - 1, 148],
    [s.waist + s.belly * 0.4, 172], [s.waist + s.belly, 188], [s.hip, 212], [s.hip - 3, 230], [4, 238],
  ]);
}

const legX = (s: Shape) => Math.max(s.hip * 0.48, s.thigh + 2);

function leg(s: Shape, side: 1 | -1, widen = 0): P[] {
  const c = legX(s);
  const pts: P[] = [
    [s.hip - 2 + widen, 222], [c + s.thigh + widen, 252], [c + s.knee + 1.5 + widen, 300], [c + s.knee + 2.5 + widen, 322], [c + 5.5 + widen, 356],
    [c - 5 - widen, 356], [c - s.knee - widen, 322], [c - s.knee - widen * 0.5, 300], [Math.max(1.5, c - s.thigh) - widen * 0.5, 252], [1, 236],
  ];
  return pts.map(([x, y]) => [CX + side * x, y]);
}

/** Shoulder, elbow and wrist of one arm. */
function arm(s: Shape, side: 1 | -1): [P, P, P] {
  const x0 = s.shoulder - s.arm * 0.55;
  return [[CX + side * x0, 112], [CX + side * (s.shoulder + s.arm * 0.35 + 2), 168], [CX + side * (s.shoulder + s.arm * 0.35 + 5), 220]];
}
const lerp = (a: P, b: P, k: number): P => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];

/** Eases the BMI to a new value so the body visibly changes when the weight is updated. */
function useEased(target: number, ms = 1200) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = Date.now(), a = from.current;
    if (a === target) return;
    let raf = 0;
    const step = () => {
      const k = Math.min(1, (Date.now() - start) / ms);
      const e = 1 - (1 - k) ** 3;
      const x = a + (target - a) * e;
      from.current = x; setV(x);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

const shade = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c * k)));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

export function AvatarView({ a, bmi, sex, size = 220, id = 'av' }: { a: A; bmi: number; sex: 'f' | 'm'; size?: number; id?: string }) {
  const b = useEased(bmi);
  const s = shapeFor(b, a.body, sex);
  const t = Math.max(0, Math.min(1, (b - 18) / 20));
  const skin = a.skin, skinD = shade(a.skin, 0.88);
  const hair = a.hairColor, hairD = shade(a.hairColor, 0.8);
  const rx = s.cheek, ry = 27 + t;
  const hy = 58;
  const fem = sex === 'f';
  const legs = [leg(s, 1), leg(s, -1)];
  const arms = [arm(s, 1), arm(s, -1)];
  const body = smooth(torso(s));

  // Clothes are the body's own outline clipped to a band, so they always fit the current shape.
  const topEnd = { bra: 150, tank: 208, tee: 212, long: 212, hoodie: 218 }[a.top];
  const topStart = a.top === 'bra' ? 116 : 92;
  const botEnd = { leggings: 352, shorts: 254, joggers: 356, skirt: 266 }[a.bottom];
  const sleeve = a.top === 'tee' ? 0.5 : a.top === 'long' || a.top === 'hoodie' ? 2 : 0;
  const longHair = a.hair === 'long' || a.hair === 'wavy';
  const bottomCol = a.bottomColor, topCol = a.topColor;

  const legPaths = (widen = 0) => [smooth(leg(s, 1, widen)), smooth(leg(s, -1, widen))];

  return (
    // Wrapped in a View so it paints above a card's gradient layer on the web.
    <View style={{ width: size * 0.5, height: size }}>
    <Svg width={size * 0.5} height={size} viewBox="0 0 200 400">
      <Defs>
        <ClipPath id={`${id}-top`}><Rect x={0} y={topStart} width={200} height={topEnd - topStart} /></ClipPath>
        <ClipPath id={`${id}-bot`}><Rect x={0} y={200} width={200} height={botEnd - 200} /></ClipPath>
      </Defs>

      {/* hair behind the body */}
      {a.hair === 'hijab' ? (
        <Path d={smooth([[CX - rx - 9, hy - 10], [CX - rx - 6, hy + 30], [CX - s.shoulder - 2, 112], [CX - s.shoulder + 6, 128], [CX + s.shoulder - 6, 128], [CX + s.shoulder + 2, 112], [CX + rx + 6, hy + 30], [CX + rx + 9, hy - 10], [CX, hy - ry - 12]])} fill={hair} />
      ) : null}
      {longHair ? (
        <Path d={smooth(a.hair === 'wavy'
          ? [[CX - rx - 5, hy - 6], [CX - rx - 12, hy + 40], [CX - rx - 8, hy + 70], [CX - rx - 14, hy + 96], [CX - 8, hy + 88], [CX + 8, hy + 88], [CX + rx + 14, hy + 96], [CX + rx + 8, hy + 70], [CX + rx + 12, hy + 40], [CX + rx + 5, hy - 6], [CX, hy - ry - 6]]
          : [[CX - rx - 4, hy - 6], [CX - rx - 8, hy + 50], [CX - rx - 8, hy + 92], [CX, hy + 86], [CX + rx + 8, hy + 92], [CX + rx + 8, hy + 50], [CX + rx + 4, hy - 6], [CX, hy - ry - 6]])} fill={hairD} />
      ) : null}
      {a.hair === 'bob' ? <Path d={smooth([[CX - rx - 6, hy - 4], [CX - rx - 7, hy + 30], [CX - rx + 2, hy + 36], [CX + rx - 2, hy + 36], [CX + rx + 7, hy + 30], [CX + rx + 6, hy - 4], [CX, hy - ry - 6]])} fill={hairD} /> : null}
      {a.hair === 'curly' ? (
        <G fill={hairD}>
          {Array.from({ length: 14 }, (_, i) => {
            const ang = Math.PI * (0.95 + (i / 13) * 1.1);
            return <Circle key={i} cx={CX + Math.cos(ang) * (rx + 9)} cy={hy - 2 + Math.sin(ang) * (ry + 6)} r={10} />;
          })}
          <Circle cx={CX - rx - 6} cy={hy + 22} r={10} /><Circle cx={CX + rx + 6} cy={hy + 22} r={10} />
        </G>
      ) : null}
      {a.hair === 'pony' ? <Path d={smooth([[CX + rx - 2, hy - 18], [CX + rx + 12, hy - 8], [CX + rx + 16, hy + 30], [CX + rx + 10, hy + 66], [CX + rx + 4, hy + 40], [CX + rx + 2, hy + 4]])} fill={hairD} /> : null}
      {a.hair === 'bun' ? <Circle cx={CX} cy={hy - ry - 6} r={12} fill={hairD} /> : null}

      {/* legs, body, neck */}
      {legs.map((l, i) => <Path key={i} d={smooth(l)} fill={skin} />)}
      <Path d={body} fill={skin} />
      <Rect x={CX - s.neck} y={hy + 16} width={s.neck * 2} height={24} fill={skinD} />

      {/* bottoms */}
      {a.bottom === 'skirt' ? (
        <Path d={smooth([[CX - s.hip + 1, 200], [CX - s.hip - 8, 264], [CX + s.hip + 8, 264], [CX + s.hip - 1, 200]])} fill={bottomCol} />
      ) : (
        <G clipPath={`url(#${id}-bot)`}>
          <Path d={body} fill={bottomCol} />
          {legPaths(a.bottom === 'joggers' ? 2.5 : 0.6).map((d, i) => <Path key={i} d={d} fill={bottomCol} />)}
        </G>
      )}
      <Rect x={CX - s.hip + 2} y={199} width={(s.hip - 2) * 2} height={5} rx={2.5} fill={shade(bottomCol, 0.82)} />
      {a.bottom === 'joggers' ? legs.map((l, i) => <Rect key={i} x={(l[4][0] + l[5][0]) / 2 - 8} y={348} width={16} height={6} rx={3} fill={shade(bottomCol, 0.82)} />) : null}

      {/* top */}
      <G clipPath={`url(#${id}-top)`}>
        <Path d={body} fill={topCol} stroke={topCol} strokeWidth={2} />
      </G>
      {a.top === 'tank' || a.top === 'tee' || a.top === 'bra' ? <Ellipse cx={CX} cy={a.top === 'bra' ? 100 : 98} rx={s.neck + (a.top === 'tee' ? 4 : 8)} ry={a.top === 'tee' ? 7 : 12} fill={skin} /> : null}
      {a.top === 'tank' ? <Path d={`M${CX - s.shoulder + 2} 104 Q${CX - s.chest + 4} 118 ${CX - s.chest} 130 M${CX + s.shoulder - 2} 104 Q${CX + s.chest - 4} 118 ${CX + s.chest} 130`} stroke={skin} strokeWidth={5} fill="none" /> : null}
      {a.top === 'bra' ? <Path d={`M${CX - s.chest + 3} 118 L${CX - s.neck - 2} 100 M${CX + s.chest - 3} 118 L${CX + s.neck + 2} 100`} stroke={topCol} strokeWidth={4} strokeLinecap="round" /> : null}
      {a.top === 'hoodie' ? (
        <>
          <Path d={smooth([[CX - s.neck - 10, 96], [CX, 112], [CX + s.neck + 10, 96], [CX, 90]])} fill={shade(topCol, 0.85)} />
          <Path d={`M${CX - s.waist * 0.6} 196 L${CX + s.waist * 0.6} 196 L${CX + s.waist * 0.5} 178 L${CX - s.waist * 0.5} 178 Z`} fill={shade(topCol, 0.9)} />
          <Line x1={CX - 3} y1={110} x2={CX - 4} y2={130} stroke="#FFFFFF" strokeWidth={1.4} /><Line x1={CX + 3} y1={110} x2={CX + 4} y2={130} stroke="#FFFFFF" strokeWidth={1.4} />
        </>
      ) : null}

      {/* arms (with sleeves) */}
      {arms.map(([sh, el, wr], i) => (
        <G key={i}>
          <Line x1={sh[0]} y1={sh[1]} x2={el[0]} y2={el[1]} stroke={skin} strokeWidth={s.arm * 2} strokeLinecap="round" />
          <Line x1={el[0]} y1={el[1]} x2={wr[0]} y2={wr[1]} stroke={skin} strokeWidth={s.forearm * 2} strokeLinecap="round" />
          {sleeve > 0 ? <Line x1={sh[0]} y1={sh[1] - 2} x2={lerp(sh, el, sleeve >= 1 ? 1 : 0.5)[0]} y2={lerp(sh, el, sleeve >= 1 ? 1 : 0.5)[1]} stroke={topCol} strokeWidth={s.arm * 2 + 3} strokeLinecap="round" /> : null}
          {sleeve > 1 ? <Line x1={el[0]} y1={el[1]} x2={lerp(el, wr, 0.9)[0]} y2={lerp(el, wr, 0.9)[1]} stroke={topCol} strokeWidth={s.forearm * 2 + 3} strokeLinecap="round" /> : null}
          <Circle cx={wr[0] + (i ? -1 : 1)} cy={wr[1] + 8} r={s.forearm + 1.5} fill={skin} />
        </G>
      ))}

      {/* shoes */}
      {legs.map((l, i) => {
        const x = (l[4][0] + l[5][0]) / 2;
        return (
          <G key={i}>
            <Ellipse cx={x + (i ? -3 : 3)} cy={362} rx={12} ry={6.5} fill={a.shoes} stroke={shade(a.shoes, 0.75)} strokeWidth={1.5} />
            <Rect x={x + (i ? -15 : -9)} y={364} width={24} height={3} rx={1.5} fill={shade(a.shoes, 0.7)} />
          </G>
        );
      })}

      {/* head */}
      <Ellipse cx={CX - rx - 1} cy={hy + 4} rx={4} ry={6} fill={skinD} />
      <Ellipse cx={CX + rx + 1} cy={hy + 4} rx={4} ry={6} fill={skinD} />
      <Ellipse cx={CX} cy={hy} rx={rx} ry={ry} fill={skin} />
      {a.beard ? <Path d={smooth([[CX - rx + 1, hy + 2], [CX - rx + 6, hy + 20], [CX, hy + ry + 3], [CX + rx - 6, hy + 20], [CX + rx - 1, hy + 2], [CX + rx - 8, hy + 14], [CX, hy + 17], [CX - rx + 8, hy + 14]])} fill={hair} opacity={0.88} /> : null}

      {/* eyes, brows, makeup */}
      {[-1, 1].map((sd) => {
        const ex = CX + sd * 9.5, ey = hy + 2;
        return (
          <G key={sd}>
            {a.shadow ? <Ellipse cx={ex} cy={ey - 3.5} rx={6.5} ry={3.6} fill={a.shadow} opacity={0.55} /> : null}
            <Ellipse cx={ex} cy={ey} rx={5.2} ry={3.8} fill="#FFFFFF" />
            <Circle cx={ex} cy={ey + 0.3} r={2.9} fill={a.eyes} />
            <Circle cx={ex} cy={ey + 0.3} r={1.4} fill="#0B0B0B" />
            <Circle cx={ex + 0.9} cy={ey - 0.8} r={0.8} fill="#FFFFFF" />
            {a.liner ? <Path d={`M${ex - sd * 5.6} ${ey - 0.6} Q${ex} ${ey - 5.4} ${ex + sd * 5.4} ${ey - 1} L${ex + sd * 8.2} ${ey - 3.4}`} stroke="#151010" strokeWidth={1.5} fill="none" strokeLinecap="round" />
              : <Path d={`M${ex - sd * 5.2} ${ey - 0.6} Q${ex} ${ey - 5} ${ex + sd * 5.2} ${ey - 0.6}`} stroke={shade(skin, 0.5)} strokeWidth={0.9} fill="none" />}
            {fem ? <Path d={`M${ex + sd * 2.5} ${ey - 3.8} l${sd * 0.8} -1.8 M${ex + sd * 4.4} ${ey - 2.9} l${sd * 1.3} -1.5`} stroke="#151010" strokeWidth={0.9} strokeLinecap="round" /> : null}
            <Path d={`M${ex - sd * 5.5} ${ey - 7.2} Q${ex} ${ey - (fem ? 10.6 : 9.6)} ${ex + sd * 6} ${ey - 7.6}`} stroke={a.hair === 'bald' ? shade(skin, 0.55) : hairD} strokeWidth={fem ? 1.8 : 2.6} fill="none" strokeLinecap="round" />
          </G>
        );
      })}
      {a.blush ? <><Ellipse cx={CX - 14} cy={hy + 11} rx={5} ry={3} fill="#FF6F86" opacity={0.32} /><Ellipse cx={CX + 14} cy={hy + 11} rx={5} ry={3} fill="#FF6F86" opacity={0.32} /></> : null}
      <Path d={`M${CX - 1} ${hy + 7} Q${CX - 3.2} ${hy + 12.5} ${CX} ${hy + 13}`} stroke={shade(skin, 0.68)} strokeWidth={1.3} fill="none" strokeLinecap="round" />
      {a.lips ? (
        <>
          <Path d={`M${CX - 6.5} ${hy + 18.5} Q${CX - 3} ${hy + 15.6} ${CX} ${hy + 17} Q${CX + 3} ${hy + 15.6} ${CX + 6.5} ${hy + 18.5} Q${CX} ${hy + 19.6} ${CX - 6.5} ${hy + 18.5}Z`} fill={shade(a.lips, 0.85)} />
          <Path d={`M${CX - 6.5} ${hy + 18.5} Q${CX} ${hy + 25} ${CX + 6.5} ${hy + 18.5} Q${CX} ${hy + 19.6} ${CX - 6.5} ${hy + 18.5}Z`} fill={a.lips} />
        </>
      ) : <Path d={`M${CX - 6} ${hy + 18} Q${CX} ${hy + 23} ${CX + 6} ${hy + 18}`} stroke={shade(skin, 0.55)} strokeWidth={1.6} fill="none" strokeLinecap="round" />}

      {/* hair in front */}
      {a.hair === 'hijab' ? (
        <Path d={`M${CX - rx - 2} ${hy + 22} Q${CX - rx - 4} ${hy - ry - 4} ${CX} ${hy - ry - 3} Q${CX + rx + 4} ${hy - ry - 4} ${CX + rx + 2} ${hy + 22}`} stroke={hair} strokeWidth={11} fill="none" strokeLinecap="round" />
      ) : a.hair === 'bald' ? null : a.hair === 'curly' ? (
        <G fill={hair}>
          {Array.from({ length: 9 }, (_, i) => {
            const ang = Math.PI * (1.08 + (i / 8) * 0.84);
            return <Circle key={i} cx={CX + Math.cos(ang) * (rx - 1)} cy={hy - 4 + Math.sin(ang) * (ry - 2)} r={8.5} />;
          })}
        </G>
      ) : (
        <Path d={smooth(a.hair === 'short'
          ? [[CX - rx - 1, hy - 2], [CX - rx + 1, hy - 20], [CX, hy - ry - 5], [CX + rx - 1, hy - 20], [CX + rx + 1, hy - 2], [CX + rx - 3, hy - 13], [CX + 6, hy - 18], [CX - 10, hy - 16], [CX - rx + 3, hy - 12]]
          : a.hair === 'bun' || a.hair === 'pony'
            ? [[CX - rx - 1, hy + 4], [CX - rx, hy - 18], [CX, hy - ry - 4], [CX + rx, hy - 18], [CX + rx + 1, hy + 4], [CX + rx - 3, hy - 10], [CX, hy - 19], [CX - rx + 3, hy - 10]]
            : [[CX - rx - 3, hy + 14], [CX - rx - 1, hy - 18], [CX, hy - ry - 5], [CX + rx + 1, hy - 18], [CX + rx + 3, hy + 14], [CX + rx - 2, hy - 6], [CX + 9, hy - 16], [CX - 4, hy - 12], [CX - rx + 2, hy - 2]])} fill={hair} />
      )}
    </Svg>
    </View>
  );
}
