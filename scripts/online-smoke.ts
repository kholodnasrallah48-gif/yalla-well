// Live check of the online calorie lookup (USDA + Open Food Facts). Run: node --experimental-strip-types scripts/online-smoke.ts
import { lastError, searchOnline, toEnglish } from '../src/lib/online.ts';

const queries = process.argv.slice(2).length ? process.argv.slice(2) : ['زيتون مخلل', 'توست حبوب كاملة', 'صدور فراخ مشوية', 'سلمون', 'شيبسي', 'نوتيلا', 'افوكادو'];
let failed = 0;
for (const q of queries) {
  const hits = await searchOnline(q);
  console.log(`\n${q} → ${toEnglish(q) ?? '(no English)'} · ${hits.length} hits`);
  for (const h of hits.slice(0, 4)) console.log(`  [${h.src}] ${h.name}: ${h.per100.kcal} kcal / 100 g · P ${h.per100.p} C ${h.per100.c} F ${h.per100.f}`);
  if (!hits.length) failed++;
  if (Object.keys(lastError).length) console.log('  errors:', JSON.stringify(lastError));
  for (const k of Object.keys(lastError)) delete lastError[k];
}
if (failed === queries.length) { console.error('No online results at all'); process.exit(1); }
