// A suggested dish for one meal: photo, calories, why it suits the person, how much of it fits, and "another one".
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { fmt } from '../lib/day.ts';
import { L, tx } from '../lib/i18n.ts';
import type { Meal, Recipe } from '../lib/recipes-data.ts';
import { portionText } from '../lib/recipe-search.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { FoodPhoto } from './FoodPhoto.tsx';
import { T, styles } from './ui.tsx';

/** Opens a recipe with the calories to fit it to (`max`: the largest portion to offer, 1 for suggestions). */
export const openRecipe = (id: string, meal: Meal, budget: number, max = 1) =>
  router.push({ pathname: '/recipe/[id]', params: { id, meal, budget: String(Math.round(budget)), max: String(max) } });

export function MealIdea({ recipe: r, meal, budget, factor, why, g, onAnother }: {
  recipe: Recipe; meal: Meal; budget: number; factor: number; why: string[];
  g: (m: string, f: string) => string; onAnother: () => void;
}) {
  const c = useColors();
  const open = () => { play('tap'); openRecipe(r.id, meal, budget); };
  return (
    <View style={{ backgroundColor: c.soft, borderRadius: 14, padding: 12, gap: 8, borderWidth: 1, borderColor: c.line }}>
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={L(`${tx(r.n)}، ${g('شوف', 'شوفي')} الطريقة`, `${tx(r.n)}, see the recipe`)} style={[styles.row, { gap: 12, alignItems: 'flex-start' }]}>
        <FoodPhoto item={{ id: r.id, n: r.n }} size={72} radius={14} />
        <View style={{ flex: 1, gap: 2 }}>
          <T kind="body" style={{ fontFamily: fonts.bodyMedium }}>{tx(r.n)}</T>
          <T kind="small">{L(`${fmt(Math.round(r.kcal * factor))} سعرة · ${fmt(r.mins)} دقيقة`, `${fmt(Math.round(r.kcal * factor))} kcal · ${r.mins} min`)}</T>
          {why.length ? <T kind="small" color={c.ok}>{why.join(L('، ', ', '))}</T> : null}
        </View>
      </Pressable>
      {factor < 1 ? (
        <T kind="small" color={c.warn}>{L(`${g('خد', 'خدي')} ${portionText(factor)} بس عشان ${g('تفضل', 'تفضلي')} في حدود سعراتك (تقريبًا)`, `Have ${portionText(factor)} to stay within your calories (roughly)`)}</T>
      ) : null}
      <View style={[styles.row, { gap: 8 }]}>
        <Pressable onPress={open} accessibilityRole="button"
          style={{ flex: 1, alignItems: 'center', borderRadius: 99, paddingVertical: 8, backgroundColor: c.petrol }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.onPetrol }}>{L(`${g('شوف', 'شوفي')} المكونات والطريقة`, 'Ingredients and steps')}</Text>
        </Pressable>
        <Pressable onPress={() => { play('tap'); onAnother(); }} accessibilityRole="button" accessibilityLabel={L('اقترح أكلة تانية', 'Suggest another dish')}
          style={{ alignItems: 'center', borderWidth: 1.5, borderColor: c.petrol, borderRadius: 99, paddingHorizontal: 14, paddingVertical: 7, backgroundColor: c.surface }}>
          <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: c.petrol }}>{L('اقترح تاني', 'Another one')}</Text>
        </Pressable>
      </View>
    </View>
  );
}
