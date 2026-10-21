// The logo lockup as on the splash, still: the champ in its dark tile, "يلا ويل" in Rakkas (the logo's own font,
// used nowhere else) and YALLA WELL in green caps, with the brand line under it when asked.
import { Text, View } from 'react-native';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';

import { fonts, useColors } from '../theme.ts';
import { SLOGAN } from './Splash.tsx';

export function Lockup({ size = 64, slogan }: { size?: number; slogan?: boolean }) {
  const c = useColors();
  const k = size / 96;
  return (
    <View style={{ alignItems: 'center', gap: 14 * k }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 * k, direction: 'rtl' }} accessible accessibilityLabel="يلا ويل · Yalla Well">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Rect x={1} y={1} width={98} height={98} rx={24} fill="#0B100E" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
          <G transform="translate(50 50) scale(0.78) translate(-50 -49.5)">
            <Path d="M50 58V82" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" />
            <Path d="M28 36L50 58L72 36" fill="none" stroke="#FFFFFF" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={50} cy={26} r={8} fill="#19E68C" />
            <Path d="M20 28L16 22M24 22L22 15M80 28L84 22M76 22L78 15" fill="none" stroke="#19E68C" strokeWidth={3.5} strokeLinecap="round" />
          </G>
        </Svg>
        <View style={{ alignItems: 'flex-start' }}>
          <View style={{ flexDirection: 'row', gap: 10 * k }}>
            <Text style={{ fontFamily: fonts.brand, fontSize: 50 * k, lineHeight: 64 * k, color: c.ink }}>يلا</Text>
            <Text style={{ fontFamily: fonts.brand, fontSize: 50 * k, lineHeight: 64 * k, color: c.petrol }}>ويل</Text>
          </View>
          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 12 * k, letterSpacing: 4 * k, color: c.petrol, writingDirection: 'ltr' }}>YALLA WELL</Text>
        </View>
      </View>
      {slogan ? <Text style={{ fontFamily: fonts.body, fontSize: 14, letterSpacing: 1, color: c.muted, writingDirection: 'ltr' }}>{SLOGAN}</Text> : null}
    </View>
  );
}
