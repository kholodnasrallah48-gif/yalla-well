// A food or dish photo looked up online (see lib/food-images), on a soft tinted tile with a drawn icon while it loads
// or when there's none. Decorative: it never blocks a tap, and a broken image falls back to the icon.
import { useEffect, useState } from 'react';
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { foodImage, peekImage, type ImageKey } from '../lib/food-images.ts';
import { useColors } from '../theme.ts';

export type PhotoKind = 'dish' | 'drink' | 'fruit';

/** The icon kind for a food list section. */
export const kindOf = (cat?: string): PhotoKind => (cat === 'مشروبات' ? 'drink' : cat === 'فاكهة' || cat === 'خضار وسلطات' ? 'fruit' : 'dish');

/** The photo URL for an item: from memory at once, then from the cache or network. */
export function useFoodImage(k: ImageKey | null): string | null {
  const id = k ? `${k.id}|${k.n}|${k.img ?? ''}` : '';
  const [url, setUrl] = useState<string | null>(() => (k ? peekImage(k) ?? null : null));
  useEffect(() => {
    if (!k) { setUrl(null); return; }
    let live = true;
    setUrl(peekImage(k) ?? null);
    foodImage(k).then((u) => { if (live) setUrl(u); }).catch(() => {});
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);
  return url;
}

function Icon({ kind, size, color }: { kind: PhotoKind; size: number; color: string }) {
  const p = { fill: 'none', stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {kind === 'drink' ? (
        <>
          <Path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V9z" {...p} />
          <Path d="M16 10.5h1.5a2.5 2.5 0 0 1 0 5H16" {...p} />
          <Path d="M8.5 3.5c-.8 1 .8 2-.1 3M12 3.5c-.8 1 .8 2-.1 3" {...p} />
        </>
      ) : kind === 'fruit' ? (
        <>
          <Path d="M12 8c-2.5-1.6-7-.9-7 4.2C5 16.6 8 21 10.2 21c1 0 1.2-.5 1.8-.5s.8.5 1.8.5C16 21 19 16.6 19 12.2 19 7.1 14.5 6.4 12 8z" {...p} />
          <Path d="M12 8c0-2 .6-3.5 2-4.5M12.6 6c1.6-1.6 3.6-1.7 4.4-1.3-.4 1.6-2.4 2.6-4.4 1.3z" {...p} />
        </>
      ) : (
        <>
          <Circle cx={12} cy={13} r={6.5} {...p} />
          <Circle cx={12} cy={13} r={3.6} {...p} opacity={0.6} />
          <Path d="M2.8 4v4.2c0 .9.7 1.6 1.6 1.6M4.4 4v16M6 4v4.2c0 .9-.7 1.6-1.6 1.6" {...p} />
          <Path d="M20.4 20V4c-1.6.6-2.4 2.6-2.4 5.4V12h2.4" {...p} />
        </>
      )}
    </Svg>
  );
}

/** A rounded photo tile; `item` null shows the placeholder only. */
export function FoodPhoto({ item, size = 52, height, radius = 12, kind = 'dish', style }: {
  item: ImageKey | null; size?: number; height?: number; radius?: number; kind?: PhotoKind; style?: StyleProp<ViewStyle>;
}) {
  const c = useColors();
  const url = useFoodImage(item);
  const [broken, setBroken] = useState<string | null>(null);
  const h = height ?? size;
  const show = url && broken !== url;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" pointerEvents="none"
      style={[{ width: size, height: h, borderRadius: radius, overflow: 'hidden', backgroundColor: c.soft, borderWidth: 1, borderColor: c.line, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Icon kind={kind} size={Math.min(size, h) * 0.5} color={c.petrol} />
      {show ? (
        <Image source={{ uri: url }} resizeMode="cover" onError={() => setBroken(url)} accessibilityIgnoresInvertColors
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} />
      ) : null}
    </View>
  );
}
