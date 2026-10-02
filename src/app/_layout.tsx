import { IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold } from '@expo-google-fonts/ibm-plex-sans-arabic';
import { ReadexPro_600SemiBold, ReadexPro_700Bold, useFonts } from '@expo-google-fonts/readex-pro';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStoreProvider, useStore } from '../store/AppStore.tsx';
import { useColors } from '../theme.ts';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

function Gate() {
  const c = useColors();
  const { ready } = useStore();
  if (!ready) {
    return <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg }}><ActivityIndicator color={c.petrol} /></View>;
  }
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({
    ReadexPro_600SemiBold, ReadexPro_700Bold,
    IBMPlexSansArabic_400Regular, IBMPlexSansArabic_500Medium, IBMPlexSansArabic_600SemiBold,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <AppStoreProvider>
        <Gate />
      </AppStoreProvider>
    </SafeAreaProvider>
  );
}
