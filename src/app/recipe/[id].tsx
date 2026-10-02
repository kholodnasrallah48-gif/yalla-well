// One suggested recipe: what it gives, ingredients, steps, a cooking video, and add it to today's food.
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AdviceView, MacroChips, arNum } from '../../components/food.tsx';
import { Btn, Card, T, styles } from '../../components/ui.tsx';
import { addFood, fmt, totals } from '../../lib/day.ts';
import { foodAdvice, recipeFood } from '../../lib/foods.ts';
import { MEAL_NAME, suitability, videoURL } from '../../lib/mealplan.ts';
import { genderFor, targets } from '../../lib/plan.ts';
import { RECIPES } from '../../lib/recipes-data.ts';
import { useStore } from '../../store/AppStore.tsx';
import { fonts, useColors } from '../../theme.ts';

export default function RecipeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile, day, updateDay } = useStore();
  const r = RECIPES.find((x) => x.id === id);
  if (!profile || !r) return null;
  const g = genderFor(profile.sex);
  const food = recipeFood(r);
  const adv = foodAdvice(profile, food, targets(profile).kcal - totals(day).kcal);
  const added = day.foods.some((x) => x.ref === food.id);
  const video = () => WebBrowser.openBrowserAsync(videoURL(r), {
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET, controlsColor: c.petrol,
  }).catch(() => {});

  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="label" color={c.petrol}>{MEAL_NAME[r.meal]} · {arNum(r.mins)} دقيقة</T>
        <Btn kind="outline" title="رجوع" onPress={() => router.back()} />
      </View>
      <T kind="h1">{r.n}</T>
      <Card>
        <View style={styles.rowBetween}>
          <T kind="big">{fmt(r.kcal)}</T>
          <T kind="small">سعرة · {r.serving}</T>
        </View>
        <MacroChips p={r.p} c={r.c} f={r.f} />
        {suitability(profile, r).why.map((w) => <T key={w} kind="small" color={c.ok}>✓ {w}</T>)}
      </Card>
      {adv.level === 'warn' || adv.level === 'bad' ? <AdviceView advice={adv} female={profile.sex !== 'm'} /> : null}
      <Card>
        <T kind="h2">المكونات</T>
        {r.ingredients.map((x, i) => (
          <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: c.lime, marginTop: 9 }} />
            <T kind="body" style={{ flex: 1 }}>{x}</T>
          </View>
        ))}
      </Card>
      <Card>
        <T kind="h2">الطريقة</T>
        {r.steps.map((x, i) => (
          <View key={i} style={[styles.row, { gap: 10, alignItems: 'flex-start' }]}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: c.petrol, alignItems: 'center', justifyContent: 'center' }}>
              <T kind="small" color={c.onPetrol} style={{ fontFamily: fonts.displaySemi }}>{arNum(i + 1)}</T>
            </View>
            <T kind="body" style={{ flex: 1 }}>{x}</T>
          </View>
        ))}
      </Card>
      <Btn kind="outline" title={g('شوف فيديو الطريقة', 'شوفي فيديو الطريقة')} onPress={video} />
      <Btn title={added ? 'اتضافت لأكل النهارده ✓' : g('ضيفها لأكل النهارده', 'ضيفيها لأكل النهارده')} disabled={added}
        onPress={() => { updateDay((d) => addFood(d, food)); router.back(); }} />
    </ScrollView>
  );
}
