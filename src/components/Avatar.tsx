// The person's avatar. The drawing itself lives in lib/avatar-svg.ts; this eases the body to a new shape when the
// weight changes and renders the SVG.
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';

import type { Avatar as A } from '../lib/avatar.ts';
import { avatarSVG, type Crop } from '../lib/avatar-svg.ts';

/** Eases the BMI to a new value so the body visibly changes when the weight is updated. */
function useEased(target: number, ms = 1400) {
  const [v, setV] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const a = from.current;
    if (a === target) return;
    const start = Date.now();
    const timer = setInterval(() => {
      const k = Math.min(1, (Date.now() - start) / ms);
      const x = a + (target - a) * (1 - (1 - k) ** 3);
      from.current = x; setV(x);
      if (k >= 1) clearInterval(timer);
    }, 60);
    return () => clearInterval(timer);
  }, [target, ms]);
  return v;
}

const RATIO: Record<Crop, number> = { full: 200 / 404, bust: 172 / 186, head: 1, face: 1, top: 1, bottom: 152 / 190 };

/** size = height in points. */
export function AvatarView({ a, bmi, sex, size = 220, id = 'av', crop = 'full' }: { a: A; bmi: number; sex: 'f' | 'm'; size?: number; id?: string; crop?: Crop }) {
  const b = useEased(bmi);
  const xml = useMemo(() => avatarSVG(a, Math.round(b * 10) / 10, sex, { id, crop }), [a, b, sex, id, crop]);
  const w = size * RATIO[crop];
  return (
    <View style={{ width: w, height: size }}>
      <SvgXml xml={xml} width={w} height={size} />
    </View>
  );
}
