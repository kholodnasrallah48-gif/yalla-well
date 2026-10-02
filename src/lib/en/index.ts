// English for Arabic data text, merged from the per-topic dictionaries. Keys are the exact Arabic strings.
import { EN_EXERCISES } from './exercises.ts';
import { EN_FOODS } from './foods.ts';
import { EN_RECIPES } from './recipes.ts';

export const EN_DATA: Record<string, string> = { ...EN_FOODS, ...EN_RECIPES, ...EN_EXERCISES };
