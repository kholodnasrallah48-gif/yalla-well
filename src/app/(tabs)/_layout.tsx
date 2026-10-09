import { Redirect } from 'expo-router';
import Tabs from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Text, View, type ColorValue } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Tour } from '../../components/Tour.tsx';
import { L } from '../../lib/i18n.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

/** Tab icons drawn in the champ's stroke style: the champ for today, a bowl, a dumbbell, and the person's initial. */
function Icon({ name, color, focused, initial }: { name: string; color: ColorValue; focused: boolean; initial: string }) {
  const c = useColors();
  const pop = useRef(new Animated.Value(focused ? 1 : 0)).current;
  useEffect(() => { Animated.spring(pop, { toValue: focused ? 1 : 0, friction: 5, tension: 140, useNativeDriver: true }).start(); }, [focused]);
  const scale = pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  let icon;
  if (name === 'index') {
    icon = (
      <Svg width={24} height={24} viewBox="0 0 100 100">
        <Path d="M50 58V84" stroke={color} strokeWidth={10} strokeLinecap="round" fill="none" />
        <Path d="M26 34L50 58L74 34" stroke={color} strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <Circle cx={50} cy={20} r={10} fill={focused ? c.petrol : color} />
      </Svg>
    );
  } else if (name === 'me') {
    icon = (
      <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: focused ? c.ink : c.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.displaySemi, fontSize: 11, lineHeight: 15, color: focused ? c.bg : c.muted }}>{initial}</Text>
      </View>
    );
  } else {
    icon = (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d={name === 'food' ? 'M4 11h16a8 8 0 0 1-16 0zM10 4.5v3M14 4.5v3' : 'M4 9.5v5M7.5 7v10M16.5 7v10M20 9.5v5M7.5 12h9'} />
      </Svg>
    );
  }
  return (
    <View style={{ alignItems: 'center' }}>
      {/* The LED dot over the open tab, like a scoreboard light. */}
      <View style={{ position: 'absolute', top: -9, width: 5, height: 5, borderRadius: 3, backgroundColor: focused ? c.petrol : 'transparent' }} />
      <Animated.View style={{ transform: [{ scale }] }}>{icon}</Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const c = useColors();
  const { profile } = useStore();
  if (!profile) return <Redirect href="/onboarding" />;
  const initial = (profile.name.trim()[0] ?? L('أ', 'M')).toUpperCase();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenListeners={{ tabPress: () => play('tap') }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: c.ink,
          tabBarInactiveTintColor: c.dim,
          tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line, borderTopWidth: 1 },
          tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11.5, lineHeight: 16 },
          tabBarIcon: ({ color, focused }) => <Icon name={route.name} color={color} focused={focused} initial={initial} />,
        })}
      >
        <Tabs.Screen name="index" options={{ title: L('النهارده', 'Today') }} />
        <Tabs.Screen name="food" options={{ title: L('الأكل', 'Food') }} />
        <Tabs.Screen name="train" options={{ title: L('التمرين', 'Train') }} />
        <Tabs.Screen name="me" options={{ title: L('ملفي', 'Me') }} />
      </Tabs>
      <Tour />
    </View>
  );
}
