// Food allergies asked at the start: the common ones to pick, plus any food the person types. Each one hides the
// recipes that have it (by name or ingredient) and puts a red note on any food with it.
import type { Avoid } from './kb.ts';
import type { Profile } from './plan.ts';

export type Allergen = { id: string; n: [string, string]; re: RegExp; tags?: Avoid['tags'] };

// Patterns run on normalised text (أ/إ/آ → ا, ة → ه, ى → ي, lower case).
export const ALLERGENS: Allergen[] = [
  { id: 'nuts', n: ['المكسرات', 'Tree nuts'], re: /لوز|بندق|كاجو|فستق|عين جمل|جوز(?! الهند)|مكسرات|بيكان|نوتيلا|nut|almond|hazelnut|pistachio|walnut|cashew|pecan|nutella/ },
  { id: 'peanut', n: ['الفول السوداني', 'Peanuts'], re: /سوداني|زبده فول|peanut/ },
  { id: 'milk', n: ['اللبن ومنتجاته', 'Milk and dairy'], re: /لبن(?!ان)|حليب|جبن|زبادي|روب|قشطه|زبده(?! فول)|سمنه بلدي|كريمه|لبنه|ايس كريم|بشاميل|milk|cheese|yogh?urt|butter(?!nut)|cream|labneh/, tags: ['dairy'] },
  { id: 'egg', n: ['البيض', 'Eggs'], re: /(^|[\s،,+و])(بيض|بيضه|بيضتين|البيض|مايونيز)|egg|mayo/ },
  { id: 'fish', n: ['السمك', 'Fish'], re: /سمك|تونه|سلمون|بلطي|بوري|سردين|ماكريل|بكلاه|رنجه|فسيخ|انشوجه|هامور|دنيس|قاروص|fish|tuna|salmon|sardine|mackerel|anchov/ },
  { id: 'shellfish', n: ['الجمبري والمأكولات البحرية', 'Shellfish'], re: /جمبري|روبيان|كابوريا|سلطعون|سبيط|كاليماري|استاكوزا|محار|بلح البحر|shrimp|prawn|crab|squid|calamari|lobster|mussel|oyster/ },
  { id: 'wheat', n: ['القمح (الجلوتين)', 'Wheat (gluten)'], re: /عيش|خبز|قمح|دقيق|مكرونه|شعريه|برغل|فريك|بقسماط|توست|فينو|كرواسون|wheat|bread|pasta|flour|toast|bulgur/, tags: ['gluten'] },
  { id: 'sesame', n: ['السمسم', 'Sesame'], re: /سمسم|طحينه|طحينيه|زعتر|sesame|tahini|zaatar/ },
  { id: 'soy', n: ['الصويا', 'Soy'], re: /صويا|توفو|soy|tofu|edamame/ },
];
export const ALLERGEN_BY_ID: Record<string, Allergen> = Object.fromEntries(ALLERGENS.map((a) => [a.id, a]));

const norm = (s: string) => s.replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase().replace(/\s+/g, ' ').trim();
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Typed allergies: one food per comma, "حساسية من" and "ال" taken off. */
export function typedAllergies(text: string | undefined): string[] {
  return (text ?? '').split(/[،,؛;\n+/]|\s+و\s+|\s+and\s+/i)
    .map((x) => norm(x).replace(/^(حساسيه|allergy)\s+(من\s+|to\s+)?/, '').replace(/^ال(?=\S{2})/, '').trim())
    .filter((x) => x.length >= 2);
}

/** What each allergy rules out, as food warnings (red) that also hide recipes with it. */
export function allergyAvoids(p: Profile): Avoid[] {
  const out: Avoid[] = [];
  for (const id of p.allergies ?? []) {
    const a = ALLERGEN_BY_ID[id];
    if (a) out.push({ re: a.re, tags: a.tags, level: 'bad', allergy: true, text: () => [`عندك حساسية من ${a.n[0]}.`, `You're allergic to ${a.n[1].toLowerCase()}.`] });
  }
  for (const food of typedAllergies(p.otherAllergy)) {
    out.push({ re: new RegExp(esc(food)), level: 'bad', allergy: true, text: () => [`عندك حساسية من ${food}.`, `You're allergic to ${food}.`] });
  }
  return out;
}
