// A small line chart for progress over time (weights lifted, body weight, body fat), oldest on the left.
import { useState } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';

import { fonts, useColors } from '../theme.ts';
import { T } from './ui.tsx';

export type Point = { label: string; v: number };

/** Plots the points with the lowest and highest values marked; needs at least two points to draw a line. */
export function LineChart({ points, unit = '', height = 150, empty }: { points: Point[]; unit?: string; height?: number; empty?: string }) {
  const c = useColors();
  const [w, setW] = useState(0);
  if (points.length < 2) return empty ? <T kind="small">{empty}</T> : null;
  const pad = { l: 8, r: 8, t: 18, b: 22 };
  const vs = points.map((p) => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (hi === lo) { lo -= 1; hi += 1; }
  const X = (i: number) => pad.l + (i / (points.length - 1)) * (w - pad.l - pad.r);
  const Y = (v: number) => pad.t + (1 - (v - lo) / (hi - lo)) * (height - pad.t - pad.b);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(p.v).toFixed(1)}`).join(' ');
  const last = points.length - 1;
  const iMax = vs.indexOf(Math.max(...vs)), iMin = vs.indexOf(Math.min(...vs));
  const anchor = (i: number) => (i === 0 ? 'start' : i === last ? 'end' : 'middle');
  const show = (v: number) => `${Math.round(v * 10) / 10}${unit}`;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)} style={{ height, direction: 'ltr' }}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Line x1={pad.l} x2={w - pad.r} y1={height - pad.b} y2={height - pad.b} stroke={c.line} strokeWidth={1} />
          <Path d={d} stroke={c.petrol} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          {points.map((p, i) => <Circle key={i} cx={X(i)} cy={Y(p.v)} r={i === last ? 5 : 3} fill={i === last ? c.petrol : c.surface} stroke={c.petrol} strokeWidth={1.5} />)}
          {[...new Set([iMax, iMin, last])].map((i) => (
            <SvgText key={'v' + i} x={X(i)} y={Y(points[i].v) - 8} fontSize={11} fontFamily={fonts.numSemi} fill={c.ink} textAnchor={anchor(i)}>{show(points[i].v)}</SvgText>
          ))}
          <SvgText x={X(0)} y={height - 6} fontSize={10.5} fill={c.muted} textAnchor="start">{points[0].label}</SvgText>
          <SvgText x={X(last)} y={height - 6} fontSize={10.5} fill={c.muted} textAnchor="end">{points[last].label}</SvgText>
        </Svg>
      ) : null}
    </View>
  );
}
