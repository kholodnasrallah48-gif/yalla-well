// Menus of big restaurant chains in Egypt and the Gulf with the calories (and macros where published) each chain
// publishes. Only items with real published numbers are here: when a chain publishes only calories, or calories and
// protein, the missing macros are left out (logged as 0) and the item is marked so the app can say so.
// No imports from i18n here: the English names below are merged into the app's English dictionary (en/index.ts).
import type { FoodTag, GI } from './foods.ts';

/** Main dish, side or drink: what a combo is built from. */
export type Role = 'main' | 'side' | 'drink';
/** The place kinds the "eating out" sheet knows. */
export type Kind = 'grill' | 'fast' | 'healthy' | 'cafe' | 'lebanese' | 'indian' | 'asian' | 'italian' | 'turkish';

export type ChainItem = {
  /** Short key, unique in its chain (used for lighter swaps). */
  k: string;
  ar: string; en: string;
  /** Portion text, Arabic and English. */
  u: [string, string];
  kcal: number; p?: number; c?: number; f?: number;
  role: Role;
  /** What people usually order with a main (the usual side or drink of a combo). */
  usual?: boolean;
  /** Key of a lighter version (small instead of medium, grilled instead of fried, diet instead of regular). */
  alt?: string;
  /** Allergens (ids from lib/allergy) the item obviously has. */
  al?: ('milk' | 'egg' | 'wheat' | 'fish' | 'shellfish' | 'sesame' | 'soy' | 'nuts' | 'peanut')[];
  tags?: FoodTag[]; gi?: GI;
};

export type Chain = {
  id: string; ar: string; en: string; kind: Kind;
  /** Matches the chain's name in Arabic or Latin letters (run on normalised, lower-case text). */
  re: RegExp;
  /** Which numbers the chain publishes: all macros, calories and protein, or calories only. */
  has: 'all' | 'protein' | 'kcal';
  /** Where the numbers come from. */
  src: string;
  /** Plain drinks to pair when the chain publishes no drinks (from the app's food list, approximate). */
  drinks?: string[];
  items: ChainItem[];
};

const W = 'wheat' as const, M = 'milk' as const, E = 'egg' as const, S = 'sesame' as const, F = 'fish' as const;

export const CHAINS: Chain[] = [
  {
    // Source: McDonald's Egypt nutrition PDFs (beef, chicken and fish sandwiches, sides):
    // https://www.mcdonalds.eg/Cms_Data/Contents/En/Media/pdfs/Nutrition/Nutrition-Facts-A401.pdf
    // https://www.mcdonalds.eg/Cms_Data/Contents/En/Media/pdfs/Nutrition/Nutrition-Facts-A402.pdf
    // https://www.mcdonalds.eg/Cms_Data/Contents/En/Media/pdfs/Nutrition/Nutrition-Facts-A403.pdf
    id: 'mcd', ar: 'ماكدونالدز', en: "McDonald's", kind: 'fast', has: 'all',
    re: /mc ?donald|ماك ?دونالد|ماكدونلد|ماك ?دونلدز/,
    src: 'https://www.mcdonalds.eg/Cms_Data/Contents/En/Media/pdfs/Nutrition/Nutrition-Facts-A401.pdf',
    drinks: ['كوكاكولا', 'كوكاكولا زيرو'],
    items: [
      { k: 'beef', ar: 'بيف برجر', en: 'Beefburger', u: ['ساندوتش ١٠٣ جم', 'Sandwich, 103 g'], kcal: 252, p: 14.1, c: 33.1, f: 9.4, role: 'main', al: [W], tags: ['redmeat', 'gluten', 'refined'] },
      { k: 'cheese', ar: 'تشيز برجر', en: 'Cheeseburger', u: ['ساندوتش ١١٧ جم', 'Sandwich, 117 g'], kcal: 305, p: 16.7, c: 34, f: 13.5, role: 'main', alt: 'beef', al: [W, M], tags: ['redmeat', 'gluten', 'dairy', 'refined'] },
      { k: 'dcheese', ar: 'دبل تشيز برجر', en: 'Double Cheeseburger', u: ['ساندوتش ١٦٨ جم', 'Sandwich, 168 g'], kcal: 434, p: 28.1, c: 34.9, f: 25.2, role: 'main', alt: 'cheese', al: [W, M], tags: ['redmeat', 'gluten', 'dairy', 'refined'] },
      { k: 'bigmac', ar: 'بيج ماك', en: 'Big Mac', u: ['ساندوتش ٢٣١ جم', 'Sandwich, 231 g'], kcal: 537, p: 27.8, c: 52.4, f: 32.5, role: 'main', alt: 'cheese', al: [W, M, E, S], tags: ['redmeat', 'gluten', 'dairy', 'refined'] },
      { k: 'tasty', ar: 'بيج تيستي', en: 'Big Tasty', u: ['ساندوتش ٣٦٨ جم', 'Sandwich, 368 g'], kcal: 947, p: 52.6, c: 56.9, f: 55.9, role: 'main', alt: 'bigmac', al: [W, M, S], tags: ['redmeat', 'gluten', 'dairy', 'refined'] },
      { k: 'royale', ar: 'ماك رويال', en: 'McRoyale', u: ['ساندوتش ٣٣٤ جم', 'Sandwich, 334 g'], kcal: 880, p: 47.5, c: 55.3, f: 51.4, role: 'main', alt: 'dcheese', al: [W, M], tags: ['redmeat', 'gluten', 'dairy', 'refined'] },
      { k: 'macdo', ar: 'تشيكن ماك دو', en: 'Chicken MACDO', u: ['ساندوتش ١٢٦ جم', 'Sandwich, 126 g'], kcal: 351, p: 13.1, c: 37.3, f: 16.4, role: 'main', al: [W, E], tags: ['fried', 'gluten', 'refined'] },
      { k: 'fillet', ar: 'تشيكن فيليه', en: 'Chicken Fillet', u: ['ساندوتش ٢٢٨ جم', 'Sandwich, 228 g'], kcal: 469, p: 21.1, c: 56.8, f: 17.4, role: 'main', alt: 'macdo', al: [W, E], tags: ['fried', 'gluten', 'refined'] },
      { k: 'grand', ar: 'جراند تشيكن سبايسي', en: 'Grand Chicken Spicy', u: ['ساندوتش ٢٨٥ جم', 'Sandwich, 285 g'], kcal: 799, p: 39.3, c: 71.8, f: 40.9, role: 'main', alt: 'fillet', al: [W, E, M], tags: ['fried', 'gluten', 'refined'] },
      { k: 'fish', ar: 'فيليه أو فيش', en: 'Filet-O-Fish', u: ['ساندوتش ١٥٢ جم', 'Sandwich, 152 g'], kcal: 392, p: 18.6, c: 40.7, f: 17, role: 'main', al: [W, F, M, E], tags: ['fried', 'gluten', 'refined'] },
      { k: 'caesar', ar: 'سلطة سيزر بالفراخ من غير صوص', en: 'Chicken Caesar Salad, no dressing', u: ['طبق ٢١٢ جم', 'Bowl, 212 g'], kcal: 129, p: 18.3, c: 4.8, f: 4.7, role: 'main', al: [M], tags: ['dairy'] },
      { k: 'friesS', ar: 'بطاطس صغيرة', en: 'Small McFries', u: ['١١٦ جم', '116 g'], kcal: 351, p: 4.2, c: 46.1, f: 17, role: 'side', tags: ['fried'], gi: 'high' },
      { k: 'friesR', ar: 'بطاطس عادي', en: 'Regular McFries', u: ['١٦٥ جم', '165 g'], kcal: 500, p: 6, c: 65.5, f: 24.2, role: 'side', alt: 'friesS', tags: ['fried'], gi: 'high' },
      { k: 'friesM', ar: 'بطاطس وسط', en: 'Medium McFries', u: ['٢٣٣ جم', '233 g'], kcal: 706, p: 8.5, c: 92.5, f: 34.2, role: 'side', usual: true, alt: 'friesS', tags: ['fried'], gi: 'high' },
      { k: 'vinaig', ar: 'صوص فينيجريت', en: 'Vinaigrette dressing', u: ['٥٠ جم', '50 g'], kcal: 38, p: 0.3, c: 9, f: 0.1, role: 'side' },
    ],
  },
  {
    // Source: KFC UAE "Nutritional values, UAE market" sheet (KFC's published table, copy at
    // https://www.scribd.com/document/871876052/Nutritional-Info-Uae).
    id: 'kfc', ar: 'كنتاكي', en: 'KFC', kind: 'fast', has: 'all',
    re: /\bkfc\b|kentucky|كنتاكي|كي اف سي|كي إف سي/,
    src: 'https://www.scribd.com/document/871876052/Nutritional-Info-Uae',
    items: [
      { k: 'keel', ar: 'قطعة صدر أوريجينال', en: 'Original Recipe breast piece (keel)', u: ['قطعة', '1 piece'], kcal: 223, p: 25.1, c: 8.3, f: 9.9, role: 'main', al: [W, E, M], tags: ['fried', 'gluten'] },
      { k: 'thigh', ar: 'قطعة ورك أوريجينال', en: 'Original Recipe thigh', u: ['قطعة', '1 piece'], kcal: 375, p: 24.2, c: 15.4, f: 24.4, role: 'main', alt: 'keel', al: [W, E, M], tags: ['fried', 'gluten'] },
      { k: 'drum', ar: 'قطعة دبوس أوريجينال', en: 'Original Recipe drumstick', u: ['قطعة', '1 piece'], kcal: 173, p: 19.3, c: 5.7, f: 8.3, role: 'main', al: [W, E, M], tags: ['fried', 'gluten'] },
      { k: 'strip', ar: 'استربس أوريجينال', en: 'Original Recipe strip', u: ['قطعة', '1 piece'], kcal: 129, p: 13.3, c: 5, f: 6.2, role: 'main', al: [W, E, M], tags: ['fried', 'gluten'] },
      { k: 'zinger', ar: 'ساندوتش زنجر', en: 'Zinger sandwich', u: ['ساندوتش', '1 sandwich'], kcal: 613, p: 31.5, c: 48.2, f: 33.7, role: 'main', alt: 'filletS', al: [W, E, M], tags: ['fried', 'gluten', 'refined'] },
      { k: 'twister', ar: 'تويستر أوريجينال', en: 'Twister Original', u: ['راب', '1 wrap'], kcal: 595, p: 27.9, c: 66.2, f: 24.3, role: 'main', alt: 'filletS', al: [W, E, M], tags: ['fried', 'gluten', 'refined'] },
      { k: 'filletS', ar: 'ساندوتش فيليه فراخ', en: 'Chicken Fillet sandwich', u: ['ساندوتش', '1 sandwich'], kcal: 505, p: 26.8, c: 64.9, f: 17, role: 'main', al: [W, E, M], tags: ['fried', 'gluten', 'refined'] },
      { k: 'popcorn', ar: 'بوب كورن فراخ صغير', en: 'Popcorn Chicken, small', u: ['علبة صغيرة', 'Small box'], kcal: 297, p: 21.5, c: 21.2, f: 14.6, role: 'main', al: [W, E, M], tags: ['fried', 'gluten'] },
      { k: 'friesR', ar: 'بطاطس عادي', en: 'Fries, regular', u: ['عادي', 'Regular'], kcal: 249, p: 4, c: 38.7, f: 9.6, role: 'side', tags: ['fried'], gi: 'high' },
      { k: 'friesM', ar: 'بطاطس وسط', en: 'Fries, medium', u: ['وسط', 'Medium'], kcal: 332, p: 5.3, c: 51.6, f: 12.8, role: 'side', usual: true, alt: 'friesR', tags: ['fried'], gi: 'high' },
      { k: 'rice', ar: 'رز', en: 'Rice', u: ['علبة', '1 portion'], kcal: 260, p: 5.4, c: 56, f: 0.6, role: 'side', gi: 'high' },
      { k: 'bun', ar: 'عيش رول', en: 'Dinner roll', u: ['قطعة', '1 piece'], kcal: 126, p: 3.5, c: 24.6, f: 1.3, role: 'side', al: [W], tags: ['gluten', 'refined'] },
      { k: 'pepsi', ar: 'بيبسي', en: 'Pepsi', u: ['عادي ٤٥٣ مل', 'Regular, 453 ml'], kcal: 199, p: 0, c: 52, f: 0, role: 'drink', usual: true, alt: 'diet', tags: ['soda'], gi: 'high' },
      { k: 'diet', ar: 'دايت بيبسي', en: 'Diet Pepsi', u: ['عادي ٤٥٣ مل', 'Regular, 453 ml'], kcal: 1, p: 0, c: 0, f: 0, role: 'drink', tags: ['sweetener'] },
      { k: 'oj', ar: 'عصير برتقان فريش', en: 'Fresh orange juice', u: ['١٢ أونصة', '12 oz'], kcal: 119, p: 0, c: 30.6, f: 0, role: 'drink', gi: 'mid' },
    ],
  },
  {
    // Source: Starbucks Ireland beverage nutrition guide (official, Autumn FY27):
    // https://starbucks.ie/sites/starbucks-ie-pwa/files/2026-10/Autumn%20FY27%20-%20Nutrition%20011026.pdf
    id: 'sbux', ar: 'ستاربكس', en: 'Starbucks', kind: 'cafe', has: 'all',
    re: /starbucks|ستاربكس|ستار بكس|ستاربوكس/,
    src: 'https://starbucks.ie/sites/starbucks-ie-pwa/files/2026-10/Autumn%20FY27%20-%20Nutrition%20011026.pdf',
    items: [
      { k: 'amer', ar: 'أمريكانو جراندي', en: 'Americano, grande', u: ['جراندي', 'Grande'], kcal: 11, p: 0.6, c: 1.3, f: 0.2, role: 'drink', tags: ['caffeine'] },
      { k: 'doppio', ar: 'إسبريسو دوبيو', en: 'Espresso doppio', u: ['دوبيو', 'Doppio'], kcal: 7, p: 0.4, c: 0.9, f: 0.1, role: 'drink', tags: ['caffeine'] },
      { k: 'coldbrew', ar: 'كولد برو جراندي', en: 'Cold brew, grande', u: ['جراندي', 'Grande'], kcal: 22, p: 1.1, c: 2.2, f: 0.8, role: 'drink', tags: ['caffeine'] },
      { k: 'latteST', ar: 'لاتيه بلبن خالي الدسم تول', en: 'Caffe latte, skimmed milk, tall', u: ['تول', 'Tall'], kcal: 94, p: 8.9, c: 12.5, f: 0.9, role: 'drink', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'latteSG', ar: 'لاتيه بلبن خالي الدسم جراندي', en: 'Caffe latte, skimmed milk, grande', u: ['جراندي', 'Grande'], kcal: 115, p: 10.9, c: 15.3, f: 1, role: 'drink', alt: 'latteST', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'latteG', ar: 'لاتيه بلبن قليل الدسم جراندي', en: 'Caffe latte, semi-skimmed milk, grande', u: ['جراندي', 'Grande'], kcal: 151, p: 10.9, c: 15, f: 5.2, role: 'drink', usual: true, alt: 'latteSG', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'capS', ar: 'كابتشينو بلبن خالي الدسم جراندي', en: 'Cappuccino, skimmed milk, grande', u: ['جراندي', 'Grande'], kcal: 99, p: 9.4, c: 13.2, f: 0.9, role: 'drink', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'iced', ar: 'آيس لاتيه بلبن خالي الدسم جراندي', en: 'Iced latte, skimmed milk, grande', u: ['جراندي', 'Grande'], kcal: 97, p: 9.2, c: 12.9, f: 0.9, role: 'drink', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'caramel', ar: 'كراميل ماكياتو تول', en: 'Caramel macchiato, tall', u: ['تول', 'Tall'], kcal: 167, p: 8.5, c: 22.2, f: 4.9, role: 'drink', alt: 'latteST', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
      { k: 'mocha', ar: 'موكا جراندي', en: 'Caffe mocha, grande', u: ['جراندي', 'Grande'], kcal: 281, p: 10.9, c: 32.2, f: 11.2, role: 'drink', alt: 'capS', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
      { k: 'wmocha', ar: 'وايت موكا جراندي', en: 'White chocolate mocha, grande', u: ['جراندي', 'Grande'], kcal: 345, p: 11.4, c: 46.3, f: 12.6, role: 'drink', alt: 'latteSG', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
      { k: 'frapp', ar: 'كوفي فرابتشينو جراندي', en: 'Coffee Frappuccino, grande', u: ['جراندي', 'Grande'], kcal: 283, p: 4.9, c: 34.1, f: 14, role: 'drink', alt: 'iced', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
    ],
  },
  {
    // Source: Tim Hortons GCC (Saudi) menu with calories: https://timhortonsgcc.com/wp-content/uploads/2024/09/KSA.pdf
    // Calories only; the smallest size where there are sizes.
    id: 'tims', ar: 'تيم هورتنز', en: 'Tim Hortons', kind: 'cafe', has: 'kcal',
    re: /tim ?horton|تيم ?هورتنز|تيم ?هورتونز|تيم ?هورتن/,
    src: 'https://timhortonsgcc.com/wp-content/uploads/2024/09/KSA.pdf',
    items: [
      { k: 'halloumi', ar: 'راب حلوم', en: 'Halloumi wrap', u: ['راب', '1 wrap'], kcal: 220, role: 'main', al: [W, M], tags: ['gluten', 'dairy'] },
      { k: 'tuna', ar: 'راب تونة', en: 'Tuna wrap', u: ['راب', '1 wrap'], kcal: 357, role: 'main', al: [W, F], tags: ['gluten'] },
      { k: 'caesar', ar: 'راب تشيكن سيزر', en: 'Chicken Caesar wrap', u: ['راب', '1 wrap'], kcal: 390, role: 'main', al: [W, M], tags: ['gluten', 'dairy'] },
      { k: 'muffin', ar: 'إنجليش مافن بالبيض بالجبنة', en: 'English muffin, cheesy egg and tomato', u: ['ساندوتش', '1 sandwich'], kcal: 260, role: 'main', al: [W, E, M], tags: ['gluten', 'dairy'] },
      { k: 'croissant', ar: 'كرواسون تركي بالجبنة', en: 'Turkey and cheese croissant', u: ['ساندوتش', '1 sandwich'], kcal: 459, role: 'main', alt: 'muffin', al: [W, M], tags: ['gluten', 'dairy', 'processed'] },
      { k: 'panini', ar: 'بانيني سبايسي تونة', en: 'Spicy tuna panini', u: ['ساندوتش', '1 sandwich'], kcal: 380, role: 'main', al: [W, F], tags: ['gluten'] },
      { k: 'icedAm', ar: 'آيس أمريكانو صغير', en: 'Iced Americano, small', u: ['صغير', 'Small'], kcal: 2, role: 'drink', tags: ['caffeine'] },
      { k: 'brew', ar: 'قهوة فلتر صغير', en: 'Original blend coffee, small', u: ['صغير', 'Small'], kcal: 3, role: 'drink', tags: ['caffeine'] },
      { k: 'cap', ar: 'كابتشينو صغير', en: 'Tims cappuccino, small', u: ['صغير', 'Small'], kcal: 116, role: 'drink', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'latte', ar: 'لاتيه صغير', en: 'Latte, small', u: ['صغير', 'Small'], kcal: 153, role: 'drink', usual: true, alt: 'cap', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'flat', ar: 'فلات وايت', en: 'Flat white', u: ['كوباية', '1 cup'], kcal: 120, role: 'drink', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'icedLatte', ar: 'آيس لاتيه صغير', en: 'Iced latte, small', u: ['صغير', 'Small'], kcal: 93, role: 'drink', al: [M], tags: ['dairy', 'caffeine'] },
      { k: 'dd', ar: 'دبل دبل صغير', en: 'Double double, small', u: ['صغير', 'Small'], kcal: 147, role: 'drink', alt: 'brew', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
      { k: 'spanish', ar: 'سبانش لاتيه صغير', en: 'Spanish latte, small', u: ['صغير', 'Small'], kcal: 198, role: 'drink', alt: 'icedLatte', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
      { k: 'mocha', ar: 'كافيه موكا صغير', en: 'Cafe mocha, small', u: ['صغير', 'Small'], kcal: 290, role: 'drink', alt: 'latte', al: [M], tags: ['dairy', 'caffeine', 'sugary'] },
    ],
  },
  {
    // Source: Zaatar W Zeit Saudi menu with calories (official):
    // https://kms.zaatarwzeit.net/Content/uploads/ZaatarWZeitCountry/ZWZ%20KSA%20-%20Menu%20English_compressed251028082502350~.pdf
    // Calories only.
    id: 'zwz', ar: 'زعتر و زيت', en: 'Zaatar W Zeit', kind: 'lebanese', has: 'kcal',
    re: /za.?atar\s*w.?\s*zeit|zaatarwzeit|زعتر\s*و\s*زيت/,
    src: 'https://kms.zaatarwzeit.net/Content/uploads/ZaatarWZeitCountry/ZWZ%20KSA%20-%20Menu%20English_compressed251028082502350~.pdf',
    items: [
      { k: 'light', ar: 'راب تشيكن لايت', en: 'Chicken Light wrap', u: ['راب', '1 wrap'], kcal: 300, role: 'main', al: [W, E], tags: ['gluten'] },
      { k: 'tuna', ar: 'راب سوبر تونة', en: 'Super Tuna wrap', u: ['راب', '1 wrap'], kcal: 400, role: 'main', al: [W, F, S, E], tags: ['gluten'] },
      { k: 'turkey', ar: 'راب تركي بالجبنة لايت', en: 'Low-cal turkey and cheese wrap', u: ['راب', '1 wrap'], kcal: 511, role: 'main', al: [W, M, E], tags: ['gluten', 'dairy', 'processed'] },
      { k: 'lahme', ar: 'لحم بعجين', en: 'Lahmeh bi ajjine', u: ['منقوشة', '1 manousheh'], kcal: 305, role: 'main', al: [W], tags: ['gluten', 'redmeat'] },
      { k: 'halloumi', ar: 'منقوشة حلوم', en: 'Halloumi manousheh', u: ['منقوشة', '1 manousheh'], kcal: 553, role: 'main', al: [W, M], tags: ['gluten', 'dairy'] },
      { k: 'zaatar', ar: 'منقوشة زعتر', en: 'Zaatar manousheh', u: ['منقوشة', '1 manousheh'], kcal: 739, role: 'main', al: [W, S], tags: ['gluten'] },
      { k: 'shawarma', ar: 'راب شاورما فراخ', en: 'Chicken shawarma wrap', u: ['راب', '1 wrap'], kcal: 666, role: 'main', alt: 'light', al: [W, E], tags: ['gluten'] },
      { k: 'taouk', ar: 'راب طاووق', en: 'Taouk wrap', u: ['راب', '1 wrap'], kcal: 872, role: 'main', alt: 'light', al: [W, E], tags: ['gluten'] },
      { k: 'caesar', ar: 'سلطة سيزر ديلوكس', en: 'Caesar Deluxe salad', u: ['طبق', '1 bowl'], kcal: 575, role: 'main', al: [W, M, E], tags: ['dairy'] },
      { k: 'csalad', ar: 'سلطة فراخ', en: 'Chicken salad', u: ['طبق', '1 bowl'], kcal: 470, role: 'main', al: ['nuts'] },
      { k: 'tabbouleh', ar: 'تبولة كينوا', en: 'Quinoa tabbouleh', u: ['طبق', '1 bowl'], kcal: 258, role: 'side', tags: ['whole'] },
      { k: 'fattoush', ar: 'فتوش', en: 'Z Fattoush', u: ['طبق', '1 bowl'], kcal: 544, role: 'side', alt: 'tabbouleh', al: [W, M], tags: ['gluten', 'dairy'] },
      { k: 'fries', ar: 'بطاطس', en: 'Fries', u: ['علبة', '1 portion'], kcal: 309, role: 'side', usual: true, alt: 'tabbouleh', tags: ['fried'], gi: 'high' },
      { k: 'soda', ar: 'مشروب غازي', en: 'Soft drink', u: ['علبة', '1 can'], kcal: 150, role: 'drink', usual: true, alt: 'tea', tags: ['soda'], gi: 'high' },
      { k: 'tea', ar: 'شاي', en: 'Tea', u: ['كوباية', '1 cup'], kcal: 3, role: 'drink', tags: ['caffeine'] },
      { k: 'coffee', ar: 'قهوة أمريكي', en: 'American coffee', u: ['كوباية', '1 cup'], kcal: 1, role: 'drink', tags: ['caffeine'] },
      { k: 'oj', ar: 'عصير برتقان معصور', en: 'Cold-pressed orange juice', u: ['٣٠٠ مل', '300 ml'], kcal: 135, role: 'drink', gi: 'mid' },
    ],
  },
  {
    // Source: Shawarmer menu (official site, calories and protein per item):
    // https://shawarmer.com/en/menu/category/shawarma and https://shawarmer.com/en/menu/category/signature
    id: 'shawarmer', ar: 'شاورمر', en: 'Shawarmer', kind: 'fast', has: 'protein',
    re: /shawarmer|شاورمر/,
    src: 'https://shawarmer.com/en/menu/category/shawarma',
    drinks: ['كوكاكولا', 'كوكاكولا زيرو'],
    items: [
      { k: 'garsa', ar: 'جرسة', en: 'Garsa', u: ['ساندوتش', '1 sandwich'], kcal: 203, p: 11, role: 'main', al: [W], tags: ['gluten'] },
      { k: 'mafloqah', ar: 'مفلوقة', en: 'Mafloqah', u: ['ساندوتش', '1 sandwich'], kcal: 356, p: 19, role: 'main', al: [W], tags: ['gluten'] },
      { k: 'saji', ar: 'صاجي', en: 'Saji', u: ['ساندوتش', '1 sandwich'], kcal: 599, p: 30, role: 'main', alt: 'mafloqah', al: [W], tags: ['gluten'] },
      { k: 'arabi', ar: 'عربي', en: 'Arabi', u: ['ساندوتش', '1 sandwich'], kcal: 623, p: 30, role: 'main', alt: 'mafloqah', al: [W], tags: ['gluten'] },
      { k: 'sawarikh', ar: 'أبو الصواريخ', en: 'Abo Alsawarikh', u: ['ساندوتش', '1 sandwich'], kcal: 619, p: 39, role: 'main', al: [W], tags: ['gluten'] },
      { k: 'tannouri', ar: 'تنوري', en: 'Tannouri', u: ['ساندوتش', '1 sandwich'], kcal: 714, p: 34, role: 'main', alt: 'sawarikh', al: [W], tags: ['gluten'] },
      { k: 'nahyfat', ar: 'نحيفات', en: 'Nahyfat', u: ['٣ ساندوتشات', '3 sandwiches'], kcal: 734, p: 39, role: 'main', alt: 'sawarikh', al: [W], tags: ['gluten'] },
      { k: 'shat', ar: 'شطشويش', en: 'Shatshaweesh', u: ['ساندوتش', '1 sandwich'], kcal: 803, p: 42, role: 'main', alt: 'sawarikh', al: [W], tags: ['gluten'] },
      { k: 'khalta', ar: 'أبو خلطة', en: 'Abo Khalta', u: ['ساندوتش', '1 sandwich'], kcal: 823, p: 42, role: 'main', alt: 'sawarikh', al: [W], tags: ['gluten'] },
      { k: 'khaltaBeef', ar: 'أبو خلطة لحم', en: 'Abo Khalta Beef', u: ['ساندوتش', '1 sandwich'], kcal: 814, p: 38, role: 'main', alt: 'sawarikh', al: [W], tags: ['gluten', 'redmeat'] },
    ],
  },
];

/** "بيج ماك (ماكدونالدز)": the name an item is logged under, so it reads right in the day and the reports. */
export const itemName = (ch: Chain, it: ChainItem): [string, string] => [`${it.ar} (${ch.ar})`, `${it.en} (${ch.en})`];

/** English for every chain item's logged name and portion, merged into the app's English dictionary. */
export const CHAIN_EN: Record<string, string> = Object.fromEntries(CHAINS.flatMap((ch) => [
  [ch.ar, ch.en],
  ...ch.items.flatMap((it) => [itemName(ch, it), it.u]),
]));
