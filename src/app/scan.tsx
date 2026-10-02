// Barcode scanner: reads a product barcode and shows its calories with personal advice.
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdviceView } from '../components/food.tsx';
import { Btn, Card, T } from '../components/ui.tsx';
import { lookupBarcode } from '../lib/barcode.ts';
import { addFood, fmt, totals } from '../lib/day.ts';
import { foodAdvice, type Food } from '../lib/foods.ts';
import { L, tx } from '../lib/i18n.ts';
import { genderFor, targets } from '../lib/plan.ts';
import type { Meal } from '../lib/recipes-data.ts';
import { useStore } from '../store/AppStore.tsx';
import { useColors } from '../theme.ts';

export default function Scan() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [perm, requestPerm] = useCameraPermissions();
  const { profile, day, custom, updateDay, addCustomFood } = useStore();
  const { meal } = useLocalSearchParams<{ meal?: Meal }>();
  const [state, setState] = useState<'scan' | 'loading' | 'found' | 'missing' | 'error'>('scan');
  const [food, setFood] = useState<Food | null>(null);
  const busy = useRef(false);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const remaining = targets(profile).kcal - totals(day).kcal;

  const onScan = async (code: string) => {
    if (busy.current) return;
    busy.current = true;
    setState('loading');
    try {
      const f = custom.find((x) => x.id === 'bc' + code) ?? (await lookupBarcode(code));
      setFood(f);
      setState(f ? 'found' : 'missing');
    } catch {
      setState('error');
    }
  };
  const again = () => { busy.current = false; setFood(null); setState('scan'); };
  const add = (f: Food) => {
    if (f.id.startsWith('bc') && !custom.some((x) => x.id === f.id)) addCustomFood(f);
    updateDay((d) => addFood(d, f, meal || undefined));
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: 16, paddingBottom: insets.bottom + 16, paddingHorizontal: 16, gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <T kind="h1">{L(`${g('صوّر', 'صوّري')} الباركود`, 'Scan a barcode')}</T>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')} hitSlop={10}><Text style={{ fontSize: 26, color: c.muted }}>×</Text></Pressable>
      </View>

      {!perm ? null : !perm.granted ? (
        <Card>
          <T kind="body">{L('محتاجين إذن الكاميرا عشان نقرا الباركود.', 'We need camera access to read the barcode.')}</T>
          <Btn title={L('اسمح بالكاميرا', 'Allow camera')} onPress={requestPerm} />
        </Card>
      ) : state === 'scan' ? (
        <View style={{ flex: 1, borderRadius: 20, overflow: 'hidden' }}>
          <CameraView style={{ flex: 1 }} facing="back" onBarcodeScanned={({ data }) => onScan(data)}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }} />
          <View pointerEvents="none" style={{ position: 'absolute', left: '12%', right: '12%', top: '38%', height: '22%', borderWidth: 3, borderColor: c.lime, borderRadius: 16 }} />
          <T kind="small" color="#FFFFFF" style={{ position: 'absolute', bottom: 16, left: 0, right: 0, textAlign: 'center' }}>{L(`${g('قرّب', 'قرّبي')} الباركود جوه المربع`, 'Bring the barcode inside the frame')}</T>
        </View>
      ) : state === 'loading' ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}><ActivityIndicator color={c.petrol} /><T kind="small">{L('بندور على المنتج...', 'Looking up the product...')}</T></View>
      ) : state === 'found' && food ? (
        <Card>
          <T kind="h2">{tx(food.n)}</T>
          <T kind="small">{tx(food.u)}</T>
          <T kind="big">{fmt(food.kcal)} <T kind="small">{L('سعرة', 'kcal')}</T></T>
          <T kind="small">{L(`بروتين ${food.p} جم · كارب ${food.c} جم · دهون ${food.f} جم`, `Protein ${food.p} g · Carbs ${food.c} g · Fat ${food.f} g`)}</T>
          <AdviceView advice={foodAdvice(profile, food, remaining)} onSwap={add} female={profile.sex !== 'm'} />
          <Btn title={L(g('ضيفها لأكل النهارده', 'ضيفيها لأكل النهارده'), "Add to today's food")} onPress={() => add(food)} />
          <Btn kind="text" title={L(g('صوّر منتج تاني', 'صوّري منتج تاني'), 'Scan another product')} onPress={again} />
        </Card>
      ) : (
        <Card>
          <T kind="body">{L(`${state === 'missing' ? 'المنتج ده مش موجود في قاعدة البيانات لسه.' : 'مقدرناش نوصل للإنترنت.'} ${g('ضيفه', 'ضيفيه')} كأكلة خاصة ${g('بيك', 'بيكي')} من صفحة الأكل بالأرقام اللي على العلبة.`, `${state === 'missing' ? "This product isn't in the database yet." : "We couldn't reach the internet."} Add it as your own food from the Food page, using the numbers on the pack.`)}</T>
          <Btn title={L('جرب تاني', 'Try again')} onPress={again} />
          <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
        </Card>
      )}
    </View>
  );
}
