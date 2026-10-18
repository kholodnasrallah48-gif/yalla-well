// The person's whole plan on one printable page, to share with their trainer or dietitian: daily targets and the
// macro split, calories per meal, the week's workouts with sets, reps and the last weight used, and recent progress.
import { bodyChanges, bodyFat, MEASURES, type Measure } from './body.ts';
import { CONDITIONS, GEAR, PAINS, WEEK } from './data.ts';
import { L, isEn, num, tx } from './i18n.ts';
import { MEALS, MEAL_NAME, SHARE } from './mealplan.ts';
import { genderFor, macroName, medical, sessionFor, splitLabel, targets, type Profile } from './plan.ts';
import type { LiftLog } from './progress.ts';
import { ux } from './translate.ts';
import { doseText, medIds, medName, medPlan } from './health.ts';
import { weightChange } from './weight.ts';

const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch]!);
const GOAL = { lose: ['نزول وزن', 'Lose weight'], maintain: ['ثبات الوزن وشد', 'Maintain and tone'], gain: ['زيادة عضل', 'Build muscle'] } as const;

export function planHTML(p: Profile, lifts: Record<string, LiftLog>, opts: { health: boolean; week: number }): string {
  const T = targets(p);
  const W = weightChange(p);
  const ch = bodyChanges(p);
  const latest = Object.fromEntries(Object.entries(ch).map(([k, v]) => [k, v!.now])) as Partial<Record<Measure, number>>;
  const fat = bodyFat(p.sex, p.height, latest);
  const g = genderFor(p.sex);
  const pct = (n: number, k: number) => Math.round((n * k * 100) / Math.max(T.kcal, 1));

  const meals = MEALS.map((m) => `<tr><td>${MEAL_NAME[m]}</td><td>${num(Math.round((T.kcal * SHARE[m]) / 10) * 10)}</td></tr>`).join('');
  const days = WEEK.map((w, i) => {
    const s = sessionFor(p, i, false, opts.week);
    if (!s) return `<h3>${esc(tx(w))}: ${L('راحة', 'Rest')}</h3>`;
    const rows = s.items.map((x) => {
      const gear = GEAR[x.id] ? L(GEAR[x.id].ar, GEAR[x.id].en) : x.gear ?? '';
      const last = lifts[x.id];
      return `<tr><td>${esc(tx(x.ex.n))}${gear ? `<div class="m">${esc(gear)}</div>` : ''}</td><td>${esc(x.rx)}</td><td>${last ? L(`${last.w} كجم × ${last.reps.join('، ')}`, `${last.w} kg × ${last.reps.join(', ')}`) : '—'}</td></tr>`;
    }).join('');
    return `<h3>${esc(tx(w))}: ${esc(splitLabel(s.id))} (${s.place === 'gym' ? L('جيم', 'gym') : L('بيت', 'home')})</h3>
      <table><thead><tr><th>${L('التمرين', 'Exercise')}</th><th>${L('المطلوب', 'Prescription')}</th><th>${L('آخر وزن', 'Last weight')}</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('');

  const measures = MEASURES.filter((m) => ch[m.id]).map((m) => `<tr><td>${esc(m.n())}</td><td>${ch[m.id]!.now}</td><td>${ch[m.id]!.diff > 0 ? '+' : ''}${ch[m.id]!.diff}</td></tr>`).join('');

  let health = '';
  if (opts.health) {
    const M = medical(p);
    const conds = [...p.conditions.map((id) => tx(CONDITIONS.find((x) => x.id === id)?.n ?? '')), ux(p, p.otherCond)].filter(Boolean);
    const pains = [...p.pains.map((id) => tx(PAINS.find((x) => x.id === id)?.n ?? '')), ux(p, p.otherPain)].filter(Boolean);
    const meds = [...medIds(p).map((id) => { const pl = medPlan(p, id); const d = doseText(pl); return `${id.startsWith('x:') ? ux(p, medName(id, pl)) : medName(id, pl)}${d ? ` (${d})` : ''}`; }), ux(p, p.otherMeds)].filter(Boolean);
    const notes = [...M.food, ...M.train].map((n) => `<li><b>${esc(n.title)}:</b> ${esc(n.text)}</li>`).join('');
    health = `<h2>${L('الحالة الصحية', 'Health')}</h2>
      <p>${L('الأمراض:', 'Conditions:')} ${conds.length ? esc(conds.join(L('، ', ', '))) : L('مفيش', 'None')}<br>
      ${L('الأدوية والفيتامينات:', 'Medicines and supplements:')} ${meds.length ? esc(meds.join(L('، ', ', '))) : L('مفيش', 'None')}<br>
      ${L('أماكن الألم:', 'Pain areas:')} ${pains.length ? esc(pains.join(L('، ', ', '))) : L('مفيش', 'None')}</p>
      ${notes ? `<ul>${notes}</ul>` : ''}
      ${M.watch.length ? `<p class="bad">${L(g('يوقف التمرين فورا لو حس بـ:', 'توقف التمرين فورا لو حست بـ:'), 'Stop training right away with:')} ${esc(M.watch.join(L('، ', ', ')))}</p>` : ''}`;
  }

  return `<!doctype html><html dir="${L('rtl', 'ltr')}" lang="${L('ar', 'en')}"><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,"Geeza Pro",Tahoma,sans-serif;color:#0A0F16;margin:28px}
  h1{margin:0}h1 span{color:#0A8F55}.sub{color:#5B6676;margin:4px 0 18px}
  h2{font-size:16px;margin:22px 0 6px;border-bottom:2px solid #0A8F55;padding-bottom:4px}h3{font-size:14px;margin:14px 0 4px}
  table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{border-bottom:1px solid #D6E2E5;padding:6px;text-align:${L('right', 'left')};vertical-align:top}
  th{color:#5A6E74;font-weight:600}.m{color:#5A6E74;font-size:11px}.bad{color:#A12C2C}li{margin:4px 0;font-size:13px}
  .grid td{font-size:14px}</style></head><body>
  <h1>${L('يلا <span>ويل</span>', 'Yalla <span>Well</span>')}</h1>
  <p class="sub">${L('خطة الأكل والتمرين', 'Food and training plan')}${p.name ? ' · ' + esc(p.name) : ''} · ${new Date().toLocaleDateString(isEn() ? 'en-GB' : 'ar-EG')}</p>
  <h2>${L('البيانات', 'Details')}</h2>
  <table class="grid"><tbody>
    <tr><td>${L('النوع والسن', 'Sex and age')}</td><td>${p.sex === 'm' ? L('ذكر', 'Male') : L('أنثى', 'Female')}، ${num(p.age)}</td></tr>
    <tr><td>${L('الطول والوزن', 'Height and weight')}</td><td>${num(p.height)} ${L('سم', 'cm')}، ${p.weight} ${L('كجم', 'kg')}${W.diff ? L(` (${g('بدأ', 'بدأت')} ${W.start}، ${W.diff > 0 ? '+' : ''}${W.diff})`, ` (started ${W.start}, ${W.diff > 0 ? '+' : ''}${W.diff})`) : ''}</td></tr>
    <tr><td>${L('الهدف', 'Goal')}</td><td>${L(GOAL[p.goal][0], GOAL[p.goal][1])}</td></tr>
    ${fat != null ? `<tr><td>${L('نسبة الدهون (تقدير بالشريط)', 'Body fat (tape estimate)')}</td><td>${fat}%</td></tr>` : ''}
  </tbody></table>
  <h2>${L('الهدف اليومي', 'Daily targets')}</h2>
  <table class="grid"><tbody>
    <tr><td>${L('السعرات', 'Calories')}</td><td>${num(T.kcal)}${p.kcalAdj ? L(` (فيها تعديل ${p.kcalAdj > 0 ? '+' : ''}${p.kcalAdj} من متابعة الوزن)`, ` (includes ${p.kcalAdj > 0 ? '+' : ''}${p.kcalAdj} from weight check-ins)`) : ''}</td></tr>
    <tr><td>${L('البروتين', 'Protein')}</td><td>${num(T.protein)} ${L('جم', 'g')} (${pct(T.protein, 4)}%)</td></tr>
    <tr><td>${L('الكارب', 'Carbs')}</td><td>${num(T.carbs)} ${L('جم', 'g')} (${pct(T.carbs, 4)}%)</td></tr>
    <tr><td>${L('الدهون', 'Fat')}</td><td>${num(T.fat)} ${L('جم', 'g')} (${pct(T.fat, 9)}%)</td></tr>
    <tr><td>${L('توزيع الماكروز', 'Macro split')}</td><td>${esc(macroName(p.macro?.mode ?? 'auto'))}</td></tr>
    <tr><td>${L('المياه', 'Water')}</td><td>${num(T.waterCups)} ${L('كوباية', 'cups')}</td></tr>
  </tbody></table>
  <h3>${L('السعرات في كل وجبة', 'Calories per meal')}</h3>
  <table><tbody>${meals}</tbody></table>
  <h2>${L('التمرين في الأسبوع', 'Weekly training')}</h2>${days}
  ${measures ? `<h2>${L('القياسات (سم)', 'Measurements (cm)')}</h2><table><thead><tr><th></th><th>${L('آخر قياس', 'Latest')}</th><th>${L('التغيير', 'Change')}</th></tr></thead><tbody>${measures}</tbody></table>` : ''}
  ${health}
  <p class="m" style="margin-top:24px">${L('الخطة دي معمولة في تطبيق يلا ويل للمساعدة، ومش بديل عن الدكتور.', 'This plan was made in the Yalla Well app to help; it does not replace a doctor.')}</p>
  </body></html>`;
}
