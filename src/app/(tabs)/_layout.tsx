import { Redirect } from 'expo-router';
import Tabs from 'expo-router/js-tabs';
import type { ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

const ICONS: Record<string, string> = {
  index: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  food: 'M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 21V3c-2.5 1-4 3.5-4 7v3h4',
  train: 'M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12',
  me: 'M4 21c1-4 4.5-6 8-6s7 2 8 6',
};

function Icon({ name, color }: { name: string; color: ColorValue }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d={ICONS[name]} />
      {name === 'me' ? <Circle cx={12} cy={8} r={4} /> : null}
    </Svg>
  );
}

export default function TabsLayout() {
  const c = useColors();
  const { profile } = useStore();
  if (!profile) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: c.petrol,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
        tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 12, lineHeight: 18 },
        tabBarIcon: ({ color }) => <Icon name={route.name} color={color} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'الرئيسية' }} />
      <Tabs.Screen name="food" options={{ title: 'الأكل' }} />
      <Tabs.Screen name="train" options={{ title: 'التمرين' }} />
      <Tabs.Screen name="me" options={{ title: 'ملفي' }} />
    </Tabs>
  );
}
