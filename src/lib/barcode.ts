// Product lookup by barcode from Open Food Facts (free, no key), mapped onto our Food shape.
import type { Food, FoodTag, GI } from './foods.ts';
import { L } from './i18n.ts';

type OFFProduct = {
  product_name?: string; product_name_ar?: string; brands?: string; serving_size?: string; serving_quantity?: number | string;
  nova_group?: number; categories_tags?: string[]; allergens_tags?: string[];
  nutriments?: Record<string, number | undefined>;
};

/** Turns an Open Food Facts product into one portion (the serving, or 100 g/ml). */
export function fromOFF(code: string, p: OFFProduct): Food | null {
  const n = p.nutriments ?? {};
  const kcal100 = n['energy-kcal_100g'] ?? (n['energy_100g'] != null ? n['energy_100g']! / 4.184 : undefined);
  if (kcal100 == null) return null;
  const serving = Number(p.serving_quantity) || 0;
  const k = serving > 0 ? serving / 100 : 1;
  const name = (p.product_name_ar || p.product_name || L('منتج', 'Product')).trim();
  const cats = (p.categories_tags ?? []).join(' ');
  const sugar = n['sugars_100g'] ?? 0;
  const tags: FoodTag[] = [];
  if (/soft-drinks|sodas|energy-drinks|colas/.test(cats)) tags.push(n['sugars_100g'] ? 'soda' : 'sweetener');
  if (sugar >= 15) tags.push('sugary');
  if (p.nova_group === 4) tags.push('processed');
  if ((p.allergens_tags ?? []).some((a) => /gluten|wheat/.test(a))) tags.push('gluten');
  if ((n['salt_100g'] ?? 0) >= 1.5) tags.push('salty');
  if ((n['fiber_100g'] ?? 0) >= 6) tags.push('fiber');
  const carbs = n['carbohydrates_100g'] ?? 0;
  const gi: GI = carbs < 5 ? 'none' : sugar >= 15 || (carbs > 50 && (n['fiber_100g'] ?? 0) < 3) ? 'high' : sugar >= 6 ? 'mid' : 'low';
  const r = (v: number | undefined) => Math.round((v ?? 0) * k * 10) / 10;
  return {
    id: 'bc' + code, cat: 'أكلاتي', n: p.brands ? `${name} (${p.brands.split(',')[0]})` : name,
    u: serving > 0 ? L(`حصة ${p.serving_size ?? serving + ' جم'}`, `serving ${p.serving_size ?? serving + ' g'}`) : L('١٠٠ جم/مل', '100 g/ml'),
    kcal: Math.round(kcal100 * k), p: r(n['proteins_100g']), c: r(carbs), f: r(n['fat_100g']), gi, tags,
  };
}

export async function lookupBarcode(code: string): Promise<Food | null> {
  const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=product_name,product_name_ar,brands,serving_size,serving_quantity,nova_group,categories_tags,allergens_tags,nutriments`, {
    headers: { 'User-Agent': 'YallaWell/1.0 (github.com/kholodnasrallah48-gif/yalla-well)' },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { status?: number; product?: OFFProduct };
  return j.status === 1 && j.product ? fromOFF(code, j.product) : null;
}
