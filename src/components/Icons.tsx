// Drawn icons for the streak tiles (instead of emoji), each in a soft round badge.
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { View } from 'react-native';

export function FlameIcon({ size = 22, color = '#FF8A3D', core = '#FFD60A' }: { size?: number; color?: string; core?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={core} />
          <Stop offset="1" stopColor={color} />
        </LinearGradient>
      </Defs>
      <Path d="M12 2.5c.6 3-1.6 4.6-3 6.4C7.6 10.7 6.5 12.6 6.5 15A5.5 5.5 0 0 0 12 20.5 5.5 5.5 0 0 0 17.5 15c0-2.2-1-4-2.2-5.2-.3 1.4-1 2.3-2 2.7.6-3.6-.2-7.2-1.3-10z" fill="url(#fl)" />
      <Path d="M12 20.5a3 3 0 0 1-3-3c0-1.6 1.2-2.6 2-3.6.3 1 .9 1.5 1.6 1.7.2-.8.6-1.4 1-1.8.8 1 1.4 2 1.4 3.7a3 3 0 0 1-3 3z" fill={core} opacity={0.9} />
    </Svg>
  );
}

export function DumbbellIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M8 12h8" />
      <Rect x={4} y={7} width={4} height={10} rx={1.5} fill={color} />
      <Rect x={16} y={7} width={4} height={10} rx={1.5} fill={color} />
      <Path d="M2 10v4M22 10v4" />
    </Svg>
  );
}

export function BoltIcon({ size = 22, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13.5 2 5 13.2h5.6L9.8 22 19 10.4h-5.8z" fill={color} stroke={color} strokeWidth={1} strokeLinejoin="round" />
    </Svg>
  );
}

/** Round tinted badge around an icon. */
export function Badge({ color, size = 40, children }: { color: string; size?: number; children: React.ReactNode }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}55` }}>
      {children}
    </View>
  );
}

