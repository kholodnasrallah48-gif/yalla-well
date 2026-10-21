import { Redirect } from 'expo-router';
import Tabs from 'expo-router/js-tabs';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Text, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Tour } from '../../components/Tour.tsx';
import { L } from '../../lib/i18n.ts';
import { play } from '../../lib/sound.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

/** Tab icons drawn in the champ's stroke style: the champ for today, a bowl, a dumbbell, a heart, and the person's initial. */
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
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: focused ? c.petrol : c.soft, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.displaySemi, fontSize: 11, lineHeight: 15, color: focused ? c.onPetrol : c.muted }}>{initial}</Text>
      </View>
    );
  } else if (name === 'health') {
    // A heart with a pulse line through it.
    icon = (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />
        <Path d="M3 12.5h4.5l1.5-2.5 2.5 5 1.8-2.5H21" stroke={focused ? c.petrol : color} strokeWidth={2} />
      </Svg>
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
      <Animated.View style={{ transform: [{ scale }] }}>{icon}</Animated.View>
    </View>
  );
}

export default function TabsLayout() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useStore();
  if (!profile) return <Redirect href="/onboarding" />;
  const initial = (profile.name.trim()[0] ?? L('أ', 'M')).toUpperCase();
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenListeners={{ tabPress: () => play('tap') }}
        // The bar floats as a rounded glass pill over the screen, clear of the home indicator.
        safeAreaInsets={{ bottom: 0 }}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: c.petrol,
          tabBarInactiveTintColor: c.muted,
          tabBarStyle: {
            position: 'absolute', left: 14, right: 14, bottom: Math.max(insets.bottom, 12) + (Platform.OS === 'web' ? 4 : 0), height: 72, borderRadius: 36,
            backgroundColor: c.bar, borderTopWidth: 1, borderWidth: 1, borderColor: c.barLine, borderTopColor: c.barLine, paddingTop: 6, paddingBottom: 6,
            elevation: 0, ...(Platform.OS === 'web' ? { backdropFilter: 'blur(20px)' } : {}),
          },
          tabBarItemStyle: { borderRadius: 28 },
          tabBarLabelStyle: { fontFamily: fonts.bodyMedium, fontSize: 11, lineHeight: 15 },
          tabBarIcon: ({ color, focused }) => <Icon name={route.name} color={color} focused={focused} initial={initial} />,
        })}
      >
        <Tabs.Screen name="index" options={{ title: L('النهارده', 'Today') }} />
        <Tabs.Screen name="food" options={{ title: L('الأكل', 'Food') }} />
        <Tabs.Screen name="train" options={{ title: L('التمرين', 'Train') }} />
        <Tabs.Screen name="health" options={{ title: L('الصحة', 'Health') }} />
        <Tabs.Screen name="me" options={{ title: L('ملفي', 'Me') }} />
      </Tabs>
      <Tour />
    </View>
  );
}
