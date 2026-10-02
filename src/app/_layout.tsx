import { Almarai_400Regular, Almarai_700Bold } from '@expo-google-fonts/almarai';
import { BalooBhaijaan2_600SemiBold, BalooBhaijaan2_700Bold, BalooBhaijaan2_800ExtraBold } from '@expo-google-fonts/baloo-bhaijaan-2';
import { Rakkas_400Regular } from '@expo-google-fonts/rakkas';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useState } from 'react';
import { I18nManager, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Splash } from '../components/Splash.tsx';
import { AppStoreProvider, useStore } from '../store/AppStore.tsx';
import { ThemeProvider, useColors, useTheme } from '../theme.ts';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

// The expo-localization plugin forces RTL in real builds; Expo Go ignores plugins, so force it once at runtime.
if (Platform.OS !== 'web' && !I18nManager.isRTL) {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);
  Updates.reloadAsync().catch(() => {});
}

function Gate() {
  const c = useColors();
  const { isDark } = useTheme();
  const { ready } = useStore();
  const [intro, setIntro] = useState(true);
  if (!ready || intro) return <><StatusBar style="light" /><Splash onDone={() => setIntro(false)} /></>;
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="report" />
        <Stack.Screen name="recipe/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    BalooBhaijaan2_600SemiBold, BalooBhaijaan2_700Bold, BalooBhaijaan2_800ExtraBold, Almarai_400Regular, Almarai_700Bold, Rakkas_400Regular,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppStoreProvider>
          <Gate />
        </AppStoreProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
