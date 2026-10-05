// Live check of the online lookups: calories (USDA + Open Food Facts), recipes (TheMealDB) and food photos
// (TheMealDB, Wikipedia, Open Food Facts) and the translation of what the person types. Run: node --experimental-strip-types scripts/online-smoke.ts [food words...]
import { hiRes, mealDBThumb, offImage, wikiThumb, foodImage } from '../src/lib/food-images.ts';
import { lastError, searchOnline, toEnglish } from '../src/lib/online.ts';
import { translate } from '../src/lib/translate.ts';
import { dishQuery, estimateKcal, lookupMealDB, searchMealDB } from '../src/lib/online-recipes.ts';

const args = process.argv.slice(2);
const queries = args.length ? args : ['زيتون مخلل', 'توست حبوب كاملة', 'صدور فراخ مشوية', 'سلمون', 'شيبسي', 'نوتيلا', 'افوكادو'];
let failed = 0;
for (const q of queries) {
  const hits = await searchOnline(q);
  console.log(`\n${q} → ${toEnglish(q) ?? '(no English)'} · ${hits.length} hits`);
  for (const h of hits.slice(0, 4)) console.log(`  [${h.src}] ${h.name}: ${h.per100.kcal} kcal / 100 g · P ${h.per100.p} C ${h.per100.c} F ${h.per100.f}`);
  if (!hits.length) failed++;
  if (Object.keys(lastError).length) console.log('  errors:', JSON.stringify(lastError));
  for (const k of Object.keys(lastError)) delete lastError[k];
}
const noCalories = failed === queries.length;
if (noCalories) console.error('No online calorie results at all');
if (args.length) process.exit(noCalories ? 1 : 0);

// Recipes and photos: each check prints ✓/✗; the run fails only when every one of them fails (the hosts are down).
let ok = 0;
let total = 0;
const check = async (label: string, run: () => Promise<string | null>) => {
  total++;
  try {
    const out = await run();
    if (out) ok++;
    console.log(`${out ? '✓' : '✗'} ${label}${out ? ': ' + out : ''}`);
  } catch (e) {
    console.log(`✗ ${label}: ${String(e)}`);
  }
};

console.log('\n— Recipes (TheMealDB) —');
for (const q of ['كشري', 'شكشوكة', 'فراخ مشوية', 'lasagne']) {
  await check(`search "${q}" → ${dishQuery(q)}`, async () => {
    const hits = await searchMealDB(q);
    return hits.length ? `${hits.length} · ${hits.slice(0, 3).map((h) => h.name).join(' | ')}` : null;
  });
}
await check('lookup 52772 + calorie estimate', async () => {
  const r = await lookupMealDB('mdb_52772');
  if (!r) return null;
  const e = await estimateKcal(r);
  return `${r.name}: ${r.ingredients.length} ingredients, ${r.steps.length} steps · ${e ? `≈ ${e.total} kcal (${e.counted} counted, missing: ${e.missing.join(', ') || 'none'})` : 'calories unknown'}`;
});

console.log('\n— Photos —');
const got = (g: { ok: boolean; data?: string | null }) => (g.ok && 'data' in g ? g.data ?? null : null);
await check('TheMealDB thumb "Shakshuka"', async () => got(await mealDBThumb('Shakshuka')));
await check('Wikipedia en "Ful medames"', async () => got(await wikiThumb('Ful medames', 'en')));
await check('Wikipedia en "Mulukhiyah"', async () => got(await wikiThumb('Mulukhiyah', 'en')));
await check('Wikipedia ar "كشري"', async () => got(await wikiThumb('كشري', 'ar')));
await check('Open Food Facts image 3017620422003', async () => got(await offImage('3017620422003')));
await check('foodImage recipe l_koshary_healthy', () => foodImage({ id: 'l_koshary_healthy', n: 'كشري صحي بالرز البني والمكرونة السن' }));
await check('foodImage food "جوافة"', () => foodImage({ id: 'f174', n: 'جوافة' }));
// The sharp versions the recipe page asks for must load too (the app falls back to the small one if not).
for (const [label, get] of [['TheMealDB', () => mealDBThumb('Shakshuka')], ['Wikipedia', () => wikiThumb('Koshary')]] as const) {
  await check(`sharp photo ${label}`, async () => {
    const g = await get();
    const small = g.ok ? g.data : null;
    if (!small) return null;
    const big = hiRes(small);
    const res = await fetch(big, { method: 'GET', headers: { 'User-Agent': 'YallaWell/1.0 (github.com/kholodnasrallah48-gif/yalla-well)' } });
    return res.ok && big !== small ? `${res.status} ${big}` : null;
  });
}

console.log(`\n${ok}/${total} recipe and photo checks passed`);
if (!ok) console.error('No recipe or photo lookups worked');
const lookupsOk = ok;

// Translation of the person's own text: fails the run when none of the translations come back.
ok = 0; total = 0;
console.log('\n— Translation of the person\'s own text (Google Translate, MyMemory fallback) —');
await check('ar → en "بلاش صيام"', () => translate('بلاش صيام'));
await check('ar → en "بلاش رفع أوزان تقيلة"', () => translate('بلاش رفع أوزان تقيلة'));
await check('ar → en "متشيليش حاجة تقيلة ومتصوميش"', () => translate('متشيليش حاجة تقيلة ومتصوميش'));
await check('en → ar "no heavy lifting"', () => translate('no heavy lifting'));

console.log(`\n${ok}/${total} translation checks passed`);
if (!ok) console.error('No translations came back');
process.exit(noCalories || !lookupsOk || !ok ? 1 : 0);
