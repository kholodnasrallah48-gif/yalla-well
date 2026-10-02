// Brand tokens: petrol & lime, light and dark. Fonts: Readex Pro (display) + IBM Plex Sans Arabic (body).
import { useColorScheme } from 'react-native';

const light = {
  petrol: '#0E4C5A', lime: '#A9BD2C', aqua: '#A7DCE3', bg: '#F1F6F7', surface: '#FFFFFF',
  ink: '#10242A', muted: '#5A6E74', line: '#D6E2E5', soft: '#E1EEF0',
  onPetrol: '#FFFFFF', onLime: '#10242A',
  ok: '#1B6B45', okBg: '#DDF3E6', warn: '#8A5A00', warnBg: '#FCEFD3', bad: '#A12C2C', badBg: '#FBE0E0',
};
const dark: typeof light = {
  petrol: '#4FB3C4', lime: '#C3D84A', aqua: '#2E6E7A', bg: '#0B1A1E', surface: '#12262B',
  ink: '#E6F0F2', muted: '#93A9AE', line: '#20393F', soft: '#183238',
  onPetrol: '#0B1A1E', onLime: '#10242A',
  ok: '#7FD6A6', okBg: '#16332A', warn: '#F2C46B', warnBg: '#33290F', bad: '#F29A9A', badBg: '#3A1C1C',
};
export type Colors = typeof light;

export const fonts = {
  display: 'ReadexPro_700Bold',
  displaySemi: 'ReadexPro_600SemiBold',
  body: 'IBMPlexSansArabic_400Regular',
  bodyMedium: 'IBMPlexSansArabic_500Medium',
  bodySemi: 'IBMPlexSansArabic_600SemiBold',
};

export function useColors(): Colors {
  return useColorScheme() === 'dark' ? dark : light;
}
