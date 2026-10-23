// The person's whole plan on one printable page, to share with their trainer or dietitian: daily targets and the
// macro split, calories per meal, the week's workouts with sets, reps and the last weight used, and recent progress.
import { bodyChanges, bodyFat, MEASURES, type Measure } from './body.ts';
import { CONDITIONS, GEAR, PAINS, WEEK } from './data.ts';
import { L, tx } from './i18n.ts';
import { MEALS, MEAL_NAME, SHARE } from './mealplan.ts';
import { genderFor, macroName, medical, sessionFor, splitLabel, targets, type Profile } from './plan.ts';
import type { LiftLog } from './progress.ts';
import { ux } from './translate.ts';
import { doseText, medIds, medName, medPlan } from './health.ts';
import { weightChange } from './weight.ts';

import { FONT, PC, esc, page, scoreBand, scoreCSS, scoreFoot } from './printkit.ts';
const GOAL = { lose: ['نزول وزن', 'Lose weight'], maintain: ['ثبات الوزن وشد', 'Maintain and tone'], gain: ['زيادة عضل', 'Build muscle'] } as const;

export function planHTML(p: Profile, lifts: Record<string, LiftLog>, opts: { health: boolean; week: number }): string {
  const T = targets(p);
  const W = weightChange(p);
  const ch = bodyChanges(p);
  const latest = Object.fromEntries(Object.entries(ch).map(([k, v]) => [k, v!.now])) as Partial<Record<Measure, number>>;
  const fat = bodyFat(p.sex, p.height, latest);
  const g = genderFor(p.sex);
  const pct = (n: number, k: number) => Math.round((n * k * 100) / Math.max(T.kcal, 1));

  const meals = MEALS.map((m) => `<tr><td>${MEAL_NAME[m]}</td><td class="n">${Math.round((T.kcal * SHARE[m]) / 10) * 10}</td></tr>`).join('');
  const days = WEEK.map((w, i) => {
    const s = sessionFor(p, i, false, opts.week);
    if (!s) return `<div class="day rest"><p class="h">${esc(tx(w))}</p><span class="mut">${L('راحة', 'Rest')}</span></div>`;
    const rows = s.items.map((x) => {
      const gear = GEAR[x.id] ? L(GEAR[x.id].ar, GEAR[x.id].en) : x.gear ?? '';
      const last = lifts[x.id];
      return `<tr><td>${esc(tx(x.ex.n))}${gear ? `<div class="m">${esc(gear)}</div>` : ''}</td><td>${esc(x.rx)}</td><td>${last ? `<span class="n">${last.w} kg × ${last.reps.join(', ')}</span>` : '—'}</td></tr>`;
    }).join('');
    return `<div class="day"><p class="h">${esc(tx(w))} <span class="tag">${esc(splitLabel(s.id))} · ${s.place === 'gym' ? L('جيم', 'gym') : L('بيت', 'home')}</span></p>
      <table><thead><tr><th>${L('التمرين', 'Exercise')}</th><th>${L('المطلوب', 'Prescription')}</th><th>${L('آخر وزن', 'Last weight')}</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join('');

  const measures = MEASURES.filter((m) => ch[m.id]).map((m) => `<tr><td>${esc(m.n())}</td><td class="n">${ch[m.id]!.now}</td><td class="n">${ch[m.id]!.diff > 0 ? '+' : ''}${ch[m.id]!.diff}</td></tr>`).join('');

  let health = '';
  if (opts.health) {
    const M = medical(p);
    const conds = [...p.conditions.map((id) => tx(CONDITIONS.find((x) => x.id === id)?.n ?? '')), ux(p, p.otherCond)].filter(Boolean);
    const pains = [...p.pains.map((id) => tx(PAINS.find((x) => x.id === id)?.n ?? '')), ux(p, p.otherPain)].filter(Boolean);
    const meds = [...medIds(p).map((id) => { const pl = medPlan(p, id); const d = doseText(pl); return `${id.startsWith('x:') ? ux(p, medName(id, pl)) : medName(id, pl)}${d ? ` (${d})` : ''}`; }), ux(p, p.otherMeds)].filter(Boolean);
    const notes = [...M.food, ...M.train].map((n) => `<li><b>${esc(n.title)}:</b> ${esc(n.text)}</li>`).join('');
    health = `<div class="sec"><h2>${L('الحالة الصحية', 'Health')}</h2>
      <table class="kv"><tbody>
        <tr><td>${L('الأمراض', 'Conditions')}</td><td>${conds.length ? esc(conds.join(L('، ', ', '))) : L('مفيش', 'None')}</td></tr>
        <tr><td>${L('الأدوية والفيتامينات', 'Medicines and supplements')}</td><td>${meds.length ? esc(meds.join(L('، ', ', '))) : L('مفيش', 'None')}</td></tr>
        <tr><td>${L('أماكن الألم', 'Pain areas')}</td><td>${pains.length ? esc(pains.join(L('، ', ', '))) : L('مفيش', 'None')}</td></tr>
      </tbody></table>
      ${notes ? `<ul style="margin-top:8px">${notes}</ul>` : ''}
      ${M.watch.length ? `<div class="stop">${L(g('يوقف التمرين فورا لو حس بـ:', 'توقف التمرين فورا لو حست بـ:'), 'Stop training right away with:')} ${esc(M.watch.join(L('، ', ', ')))}</div>` : ''}</div>`;
  }

  // The band: a ring split into protein, carbs and fat (by calories), with the day's calories in the middle.
  const split = [[pct(T.protein, 4), PC.neon], [pct(T.carbs, 4), '#3DA5FF'], [pct(T.fat, 9), '#FFC23D']] as const;
  const C = 2 * Math.PI * 40;
  let at = 0;
  const arcs = split.map(([v, c]) => { const len = (Math.max(0, v) / 100) * C; const a = `<circle cx="50" cy="50" r="40" fill="none" stroke="${c}" stroke-width="10" stroke-dasharray="${Math.max(0, len - 2).toFixed(1)} ${C.toFixed(1)}" stroke-dashoffset="${(-at).toFixed(1)}" transform="rotate(-90 50 50)"/>`; at += len; return a; }).join('');
  const donut = `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="${PC.nightRing}" stroke-width="10"/>${arcs}<text x="50" y="52" text-anchor="middle" font-family='${FONT}' font-weight="300" font-size="20" fill="#F5F5F7">${T.kcal}</text><text x="50" y="66" text-anchor="middle" font-family='${FONT}' font-size="9" fill="${PC.nightMuted}">${L('سعرة', 'kcal')}</text></svg>`;
  const band = scoreBand(donut, p.name ? L(`خطة ${p.name}`, `${p.name}'s plan`) : L('خطتي', 'My plan'),
    `${L('خطة الأكل والتمرين', 'Food and training plan')} · ${L(GOAL[p.goal][0], GOAL[p.goal][1])} · <span class="n">${new Date().toLocaleDateString('en-GB')}</span>`);
  const tile = (label: string, v: string, sub: string, color: string) => `<div><span class="mut">${label}</span><span class="n" style="color:${color}">${v}</span><span class="mut" style="font-size:10px">${sub}</span></div>`;
  const tiles = `<div class="tiles">
    ${tile(L('البروتين', 'Protein'), `${T.protein}g`, `${pct(T.protein, 4)}%`, PC.green)}
    ${tile(L('الكارب', 'Carbs'), `${T.carbs}g`, `${pct(T.carbs, 4)}%`, PC.blue)}
    ${tile(L('الدهون', 'Fat'), `${T.fat}g`, `${pct(T.fat, 9)}%`, PC.orange)}
    ${tile(L('المياه', 'Water'), `${T.waterCups}`, L('كوباية في اليوم', 'cups a day'), PC.ink)}</div>`;

  const body = `<div class="wrap">${band}${tiles}
  <div class="two sec">
    <div><h2>${L('البيانات', 'Details')}</h2>
    <table class="kv"><tbody>
      <tr><td>${L('النوع والسن', 'Sex and age')}</td><td>${p.sex === 'm' ? L('ذكر', 'Male') : L('أنثى', 'Female')} · <span class="n">${p.age}</span></td></tr>
      <tr><td>${L('الطول والوزن', 'Height and weight')}</td><td><span class="n">${p.height} cm · ${p.weight} kg</span>${W.diff ? L(` (${g('بدأ', 'بدأت')} <span class="n">${W.start}</span>، <span class="n">${W.diff > 0 ? '+' : ''}${W.diff}</span>)`, ` (started <span class="n">${W.start}</span>, <span class="n">${W.diff > 0 ? '+' : ''}${W.diff}</span>)`) : ''}</td></tr>
      <tr><td>${L('الهدف', 'Goal')}</td><td>${L(GOAL[p.goal][0], GOAL[p.goal][1])}</td></tr>
      ${fat != null ? `<tr><td>${L('نسبة الدهون (تقدير بالشريط)', 'Body fat (tape estimate)')}</td><td class="n">${fat}%</td></tr>` : ''}
      <tr><td>${L('السعرات', 'Calories')}</td><td><span class="n">${T.kcal}</span>${p.kcalAdj ? L(` (فيها تعديل <span class="n">${p.kcalAdj > 0 ? '+' : ''}${p.kcalAdj}</span> من متابعة الوزن)`, ` (includes <span class="n">${p.kcalAdj > 0 ? '+' : ''}${p.kcalAdj}</span> from weight check-ins)`) : ''}</td></tr>
      <tr><td>${L('توزيع الماكروز', 'Macro split')}</td><td>${esc(macroName(p.macro?.mode ?? 'auto'))}</td></tr>
    </tbody></table></div>
    <div><h2>${L('السعرات في كل وجبة', 'Calories per meal')}</h2><table class="kv"><tbody>${meals}</tbody></table></div>
  </div>
  <div><h2>${L('التمرين في الأسبوع', 'Weekly training')}</h2><div class="days">${days}</div></div>
  ${measures ? `<div class="sec"><h2>${L('القياسات (سم)', 'Measurements (cm)')}</h2><table><thead><tr><th></th><th>${L('آخر قياس', 'Latest')}</th><th>${L('التغيير', 'Change')}</th></tr></thead><tbody>${measures}</tbody></table></div>` : ''}
  ${health}
  <p class="mut" style="font-size:10px">${L('الخطة دي معمولة في تطبيق يلا ويل للمساعدة، ومش بديل عن الدكتور.', 'This plan was made in the Yalla Well app to help; it does not replace a doctor.')}</p>
  ${scoreFoot(L('خطتي من يلا ويل', 'My plan from Yalla Well'))}</div>`;
  const css = `
h2{font-size:14px;margin:0 0 6px}
.two{display:grid;grid-template-columns:1.5fr 1fr;gap:16px}
.kv td:first-child{color:${PC.muted};width:42%}
.tiles>div .n{margin-top:2px}
.days{display:flex;flex-direction:column;gap:10px}
.day{break-inside:avoid;border:1px solid ${PC.line};border-radius:11px;padding:9px 12px}
.day .h{font-size:13px;margin-bottom:4px}
.day.rest{display:flex;justify-content:space-between;align-items:center;background:${PC.grey};border-color:${PC.grey}}
.day.rest .h{margin:0}
.tag{font-weight:400;font-size:10.5px;color:${PC.muted};background:${PC.grey};border-radius:99px;padding:1px 8px;margin-inline-start:6px}
.m{color:${PC.muted};font-size:10px}
.stop{margin-top:8px;background:${PC.redBg};color:${PC.red};border-radius:10px;padding:8px 12px}
`;
  return page(L('خطتي', 'My plan'), body, scoreCSS() + css);
}
