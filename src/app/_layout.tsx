import { Almarai_400Regular, Almarai_700Bold } from '@expo-google-fonts/almarai';
import { BalooBhaijaan2_600SemiBold, BalooBhaijaan2_700Bold, BalooBhaijaan2_800ExtraBold } from '@expo-google-fonts/baloo-bhaijaan-2';
import { Rakkas_400Regular } from '@expo-google-fonts/rakkas';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { I18nManager, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Reminders } from '../components/Reminders.tsx';
import { Splash } from '../components/Splash.tsx';
import { loadLang, onLangChange, type Lang } from '../lib/i18n.ts';
import { AppStoreProvider, useStore } from '../store/AppStore.tsx';
import { ThemeProvider, useColors, useTheme } from '../theme.ts';

const setDocLang = (l: Lang) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    document.documentElement.dir = l === 'en' ? 'ltr' : 'rtl';
    document.documentElement.lang = l;
  }
};
setDocLang('ar');

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
  // null until the saved language is read; changing it re-renders every screen in the new language and direction.
  const [lang, setLangState] = useState<Lang | null>(null);
  useEffect(() => {
    loadLang().then((l) => { setDocLang(l); setLangState(l); });
    return onLangChange((l) => { setDocLang(l); setLangState(l); });
  }, []);
  if (!ready || intro || !lang) return <><StatusBar style="light" /><Splash onDone={() => setIntro(false)} /></>;
  return (
    <View key={lang} style={{ flex: 1, direction: lang === 'en' ? 'ltr' : 'rtl' }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Reminders />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="exercise/[id]" options={{ presentation: 'modal' }} />
        <Stack.Screen name="scan" options={{ presentation: 'modal' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
        <Stack.Screen name="report" />
        <Stack.Screen name="health" />
        <Stack.Screen name="recipe/[id]" options={{ presentation: 'modal' }} />
      </Stack>
    </View>
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
