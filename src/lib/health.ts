// Health extras for people with conditions or regular medicines: dose times with how to take each one, the easy
// day after a weekly injection, a one-tap daily check-in that lightens training on rough days, lab results with
// when to repeat them, and a report to show the doctor. Pure logic (no native modules) so it can be unit-tested.
import { CONDITIONS, MEDS } from './data.ts';
import { dayKey, fmt, weekIndex, type DayLog } from './day.ts';
import { L, isEn, tx } from './i18n.ts';
import { KB_BY_ID, effective, matchItems, type DoseForm, type DoseUnit, type KBItem } from './kb.ts';
import { genderFor, type Profile } from './plan.ts';
import { ux } from './translate.ts';

/* ---------- Medicines ---------- */

/** How a medicine is taken relative to food. */
export type MedRule = 'empty' | 'withFood' | 'beforeMeal' | 'sameTime' | 'bed' | 'any';
export type Repeat = 'daily' | 'days' | 'week' | 'month';

/**
 * One medicine's or supplement's schedule: what one dose is, how often, and at what times. Every day unless
 * `repeat` says otherwise. Older plans set only `day` and `every` (weekly on that weekday, every `every` weeks).
 */
export type MedPlan = {
  times: string[];
  /** Weekday for weekly medicines: 0 = Saturday … 6 = Friday (older plans; newer ones use `weekdays`). */
  day?: number;
  /** Weeks between doses for weekly medicines (older plans; newer ones use `n`). */
  every?: number;
  /** The first dose (YYYY-MM-DD): days, weeks and months are counted from it, and nothing is due before it. */
  from?: string;
  /** Name, for medicines the person added themselves. */
  name?: string;
  rule?: MedRule;
  /** A medicine, or a vitamin or supplement. */
  kind?: 'med' | 'vit';
  /** What the app knows this one as (lib/kb), for how to take it and what it changes. */
  kb?: string;
  /** Strength of one pill, drop, injection... and how many to take each time (1.5 = one and a half). */
  dose?: number; unit?: DoseUnit; count?: number; form?: DoseForm;
  /** Every day, every `n` days, on `weekdays` every `n` weeks, or every `n` months on the day of `from`. */
  repeat?: Repeat;
  n?: number;
  weekdays?: number[];
};

type G = (m: string, f: string) => string;
type MedInfo = { rule: MedRule; plan: MedPlan; how: (g: G) => [string, string]; weekly?: boolean };
/** What we know about each medicine on the list: default times and how to take it. */
export const MED_INFO: Record<string, MedInfo> = {
  thyroxine: { rule: 'empty', plan: { times: ['07:00'] }, how: (g) => [`على معدة فاضية بمية بس. الفطار بعده بنص ساعة لساعة، والقهوة واللبن والكالسيوم والحديد بعده بوقت.`, 'On an empty stomach with water only. Breakfast 30–60 minutes later; coffee, milk, calcium and iron later still.'] },
  steroids: { rule: 'withFood', plan: { times: ['08:00'] }, how: (g) => [`الصبح مع الفطار أو بعده، عشان المعدة.`, 'In the morning with or after breakfast, to protect your stomach.'] },
  insulin: { rule: 'beforeMeal', plan: { times: ['08:00', '14:00', '20:00'] }, how: (g) => [`حسب جرعات دكتورك، وغالبا قبل الأكل. خلي كمية الكارب في الوجبة ثابتة.`, "As your doctor set it, usually before meals. Keep each meal's carbs steady."] },
  mtx: { rule: 'any', weekly: true, plan: { times: ['20:00'], day: 5, every: 1 }, how: (g) => [`مرة في الأسبوع في نفس اليوم. ممنوع الكحول، وحمض الفوليك في اليوم اللي دكتورك قاله.`, 'Once a week on the same day. No alcohol, and folic acid on the day your doctor said.'] },
  bio: { rule: 'any', weekly: true, plan: { times: ['10:00'], day: 5, every: 2 }, how: (g) => [`الحقنة في ميعادها. لو عندك سخونية أو التهاب ${g('كلم', 'كلمي')} دكتورك قبلها.`, "Take the injection on schedule. If you have a fever or an infection, call your doctor first."] },
  hcq: { rule: 'withFood', plan: { times: ['20:00'] }, how: (g) => [`مع الأكل أو كوباية لبن عشان المعدة.`, 'With food or a glass of milk, to protect your stomach.'] },
  beta: { rule: 'sameTime', plan: { times: ['08:00'] }, how: (g) => [`نفس الميعاد كل يوم، و${g('متوقفهوش', 'متوقفيهوش')} فجأة.`, "Same time every day, and don't stop it suddenly."] },
  anticoag: { rule: 'sameTime', plan: { times: ['20:00'] }, how: (g) => [`نفس الميعاد كل يوم بالظبط. الخضار الورقية (سبانخ، جرجير، ملوخية) بكمية ثابتة مش فجأة كتير.`, 'At exactly the same time every day. Keep leafy greens (spinach, rocket, molokhia) steady, not suddenly a lot.'] },
};

/** The medicines a person has a schedule for: the ones picked from the list plus the ones they added. */
export function medIds(p: Profile): string[] {
  return [...p.meds.filter((id) => MED_INFO[id]), ...Object.keys(p.medPlan ?? {}).filter((id) => id.startsWith('x:'))];
}

/** A medicine's schedule: the person's own, else our default. */
export function medPlan(p: Profile, id: string): MedPlan {
  return p.medPlan?.[id] ?? MED_INFO[id]?.plan ?? { times: ['09:00'] };
}

/** What the app knows about a medicine the person added (by the item picked when adding it, else by its name). */
export function medKB(id: string, plan?: MedPlan): KBItem | undefined {
  if (!id.startsWith('x:')) return undefined;
  if (plan?.kb && KB_BY_ID[plan.kb]) return KB_BY_ID[plan.kb];
  return matchItems(plan?.name ?? id.slice(2), ['med', 'vit'])[0];
}

/** A new schedule for a medicine the person adds: the usual time, form and unit when the app knows it. */
export function newMedPlan(name: string, kb?: KBItem): MedPlan {
  const vit = kb ? kb.kind === 'vit' : false;
  return {
    name, kb: kb?.id, kind: vit ? 'vit' : 'med', times: [kb?.time ?? '09:00'], rule: kb?.rule, form: kb?.form ?? 'pill', unit: kb?.unit, count: 1,
    repeat: kb?.weekly ? 'week' : 'daily', weekdays: kb?.weekly ? [weekIndex(new Date())] : undefined, n: 1, from: dayKey(new Date()),
  };
}

export function medName(id: string, plan?: MedPlan): string {
  if (id.startsWith('x:')) return plan?.name ?? id.slice(2);
  const n = MEDS.find((m) => m.id === id)?.n ?? id;
  return tx(n);
}

/** How to take a medicine, in the app's language. */
export function medHow(p: Profile, id: string): string {
  const g = genderFor(p.sex);
  const info = MED_INFO[id];
  if (info) { const [ar, en] = info.how(g); return L(ar, en); }
  const plan = medPlan(p, id);
  const kb = medKB(id, plan);
  if (kb?.how) { const [ar, en] = kb.how(g); return L(ar, en); }
  return plan.rule ? RULE_TEXT[plan.rule][0] ? L(RULE_TEXT[plan.rule][0], RULE_TEXT[plan.rule][1]) : '' : '';
}

/** How a medicine is taken, as a label on the form and a line under the dose. */
export const RULE_TEXT: Record<MedRule, [string, string]> = {
  empty: ['على الريق', 'On an empty stomach'],
  beforeMeal: ['قبل الأكل', 'Before food'],
  withFood: ['مع الأكل أو بعده', 'With or after food'],
  bed: ['قبل النوم', 'At bedtime'],
  sameTime: ['نفس الميعاد كل يوم', 'Same time every day'],
  any: ['', ''],
};

export const FORMS: Record<DoseForm, { ar: [string, string, string]; en: [string, string] }> = {
  pill: { ar: ['حباية', 'حبايتين', 'حبايات'], en: ['tablet', 'tablets'] },
  cap: { ar: ['كبسولة', 'كبسولتين', 'كبسولات'], en: ['capsule', 'capsules'] },
  inj: { ar: ['حقنة', 'حقنتين', 'حقن'], en: ['injection', 'injections'] },
  drop: { ar: ['نقطة', 'نقطتين', 'نقط'], en: ['drop', 'drops'] },
  sachet: { ar: ['كيس', 'كيسين', 'أكياس'], en: ['sachet', 'sachets'] },
  spoon: { ar: ['معلقة', 'معلقتين', 'معالق'], en: ['spoon', 'spoons'] },
  puff: { ar: ['بخة', 'بختين', 'بخات'], en: ['puff', 'puffs'] },
  amp: { ar: ['أمبول', 'أمبولتين', 'أمبولات'], en: ['ampoule', 'ampoules'] },
};
export const UNITS: Record<DoseUnit, [string, string]> = {
  mg: ['مجم', 'mg'], mcg: ['ميكروجرام', 'mcg'], iu: ['وحدة دولية', 'IU'], u: ['وحدة', 'units'], ml: ['مل', 'ml'], g: ['جم', 'g'],
};

/** "حباية ونص" / "1½ tablets". */
export function countText(count: number, form: DoseForm = 'pill'): string {
  const f = FORMS[form];
  const whole = Math.floor(count), half = count - whole >= 0.5;
  if (isEn()) return `${whole ? whole : ''}${half ? '½' : ''} ${count <= 1 ? f.en[0] : f.en[1]}`;
  if (!whole) return `نص ${f.ar[0]}`;
  const base = whole === 1 ? f.ar[0] : whole === 2 ? f.ar[1] : `${whole} ${whole <= 10 ? f.ar[2] : f.ar[0]}`;
  return half ? `${base} ونص` : base;
}

/** One dose in words: "حباية · 50 ميكروجرام". */
export function doseText(pl: MedPlan): string {
  const parts = [pl.count || pl.form ? countText(pl.count ?? 1, pl.form) : '', pl.dose ? `${fmt(pl.dose)} ${L(UNITS[pl.unit ?? 'mg'][0], UNITS[pl.unit ?? 'mg'][1])}` : ''];
  return parts.filter(Boolean).join(' · ');
}

/** The schedule's repeat, filled in for older plans. */
export function repeatOf(pl: MedPlan): { repeat: Repeat; n: number; weekdays: number[] } {
  if (pl.repeat) return { repeat: pl.repeat, n: Math.max(1, pl.n ?? (pl.repeat === 'days' ? 2 : 1)), weekdays: pl.weekdays?.length ? pl.weekdays : pl.day !== undefined ? [pl.day] : [weekIndex(new Date())] };
  if (pl.day !== undefined) return { repeat: 'week', n: pl.every ?? 1, weekdays: [pl.day] };
  return { repeat: 'daily', n: 1, weekdays: [] };
}

/** How often, in words: "كل يوم", "يوم ويوم", "كل أسبوعين يوم الخميس", "كل شهر يوم 5". */
export function repeatText(pl: MedPlan): string {
  const r = repeatOf(pl);
  const days = r.weekdays.map((d) => L(DAYS[d][0], DAYS[d][1])).join(L(' و', ' and '));
  const one = r.weekdays.length === 1 ? L(DAYS[r.weekdays[0]][0].replace(/^ال/, ''), DAYS[r.weekdays[0]][1]) : days;
  if (r.repeat === 'days') return r.n === 2 ? L('يوم ويوم', 'Every other day') : L(`كل ${r.n} أيام`, `Every ${r.n} days`);
  if (r.repeat === 'week') {
    if (r.n === 1) return r.weekdays.length === 1 ? L(`كل ${one}`, `Every ${one}`) : L(`أيام ${days}`, `On ${days}`);
    return r.n === 2 ? L(`كل أسبوعين يوم ${days}`, `Every 2 weeks on ${days}`) : L(`كل ${r.n} أسابيع يوم ${days}`, `Every ${r.n} weeks on ${days}`);
  }
  if (r.repeat === 'month') {
    const d = pl.from ? Number(pl.from.slice(8, 10)) : new Date().getDate();
    return r.n === 1 ? L(`كل شهر يوم ${d}`, `Monthly on the ${d}${ordinal(d)}`) : L(`كل ${r.n} شهور يوم ${d}`, `Every ${r.n} months on the ${d}${ordinal(d)}`);
  }
  return L('كل يوم', 'Every day');
}
const ordinal = (d: number) => (d % 10 === 1 && d !== 11 ? 'st' : d % 10 === 2 && d !== 12 ? 'nd' : d % 10 === 3 && d !== 13 ? 'rd' : 'th');

/** Medicines taken too close together (thyroid pills and calcium or iron...): one line each, empty when all is well. */
export function spacing(p: Profile): string[] {
  const ids = medIds(p);
  const who = (id: string) => {
    const kb = medKB(id, medPlan(p, id));
    return new Set([id, kb?.id, kb?.same].filter((x): x is string => !!x));
  };
  const mins = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const out: string[] = [];
  for (let i = 0; i < ids.length; i++) for (let j = 0; j < ids.length; j++) {
    if (i === j) continue;
    const a = ids[i], b = ids[j];
    const ka = medKB(a, medPlan(p, a));
    const rule = ka?.apart?.find((x) => who(b).has(x.id));
    if (!rule) continue;
    const ta = medPlan(p, a).times, tb = medPlan(p, b).times;
    const gap = Math.min(...ta.flatMap((x) => tb.map((y) => Math.abs(mins(x) - mins(y)))));
    if (gap >= rule.h * 60) continue;
    const na = medName(a, medPlan(p, a)), nb = medName(b, medPlan(p, b));
    out.push(L(`${na} و${nb} محتاجين ${rule.h} ساعات بينهم على الأقل، ودلوقتي الفرق ${gap < 60 ? `${gap} دقيقة` : `${Math.round(gap / 6) / 10} ساعة`}. ${genderFor(p.sex)('غير', 'غيري')} ميعاد واحد فيهم.`,
      `${na} and ${nb} need at least ${rule.h} hours between them; right now it's ${gap < 60 ? `${gap} minutes` : `${Math.round(gap / 6) / 10} hours`}. Move one of them.`));
  }
  return out;
}

const DAY = 86400000;
const dayNum = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
const fromKey = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };

const mod = (a: number, n: number) => ((a % n) + n) % n;
/** Whether a medicine is due on a date. */
export function dueOn(plan: MedPlan, d: Date): boolean {
  const r = repeatOf(plan);
  const from = plan.from ? fromKey(plan.from) : null;
  if (from && plan.repeat && dayNum(d) < dayNum(from)) return false;
  if (r.repeat === 'daily') return true;
  if (r.repeat === 'days') return !from || mod(dayNum(d) - dayNum(from), r.n) === 0;
  if (r.repeat === 'week') {
    if (!r.weekdays.includes(weekIndex(d))) return false;
    if (r.n <= 1 || !from) return true;
    // Whole weeks (Saturday to Friday) between the first dose's week and this one.
    const weeks = Math.round(((dayNum(d) - weekIndex(d)) - (dayNum(from) - weekIndex(from))) / 7);
    return mod(weeks, r.n) === 0;
  }
  const f = from ?? d;
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  if (d.getDate() !== Math.min(f.getDate(), last)) return false;
  return mod((d.getFullYear() - f.getFullYear()) * 12 + d.getMonth() - f.getMonth(), r.n) === 0;
}

export type Dose = { id: string; key: string; name: string; time: string; how: string; dose: string; kind: 'med' | 'vit' };

/** The doses due on a date, in time order. `key` identifies the dose in DayLog.medsTaken. */
export function dosesOn(p: Profile, d: Date): Dose[] {
  const out: Dose[] = [];
  for (const id of medIds(p)) {
    const plan = medPlan(p, id);
    if (!dueOn(plan, d)) continue;
    const name = id.startsWith('x:') ? ux(p, plan.name ?? id.slice(2)) : medName(id, plan);
    const kind = plan.kind ?? (medKB(id, plan)?.kind === 'vit' ? 'vit' : 'med');
    for (const time of plan.times) out.push({ id, key: `${id}@${time}`, name, time, how: medHow(p, id), dose: doseText(plan), kind });
  }
  return out.sort((a, b) => a.time.localeCompare(b.time));
}

/** A weekly injection or dose (methotrexate, biologics) was yesterday: today should be easy. */
export function afterWeeklyDose(p: Profile, d: Date): string | null {
  const y = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1);
  for (const id of medIds(p)) {
    const plan = medPlan(p, id);
    const base = id.startsWith('x:') ? medKB(id, plan)?.same : id;
    if (!base || !MED_INFO[base]?.weekly) continue;
    if (dueOn(plan, y)) return medName(id, plan);
  }
  return null;
}

/** "07:00" → "7:00 ص" / "7:00 AM". */
export function timeText(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const h12 = h % 12 || 12;
  return L(`${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'ص' : 'م'}`, `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`);
}

/** Valid "HH:MM" (24 h). */
export const isTime = (t: string) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(t.trim());

/* ---------- Daily check-in ---------- */

/** 0 good, 1 so-so, 2 bad. */
export type Level = 0 | 1 | 2;
export type CheckIn = { energy?: Level; pain?: Level; sleep?: Level };
export const CHECK_ITEMS: { k: keyof CheckIn; q: [string, string]; opts: [string, string][] }[] = [
  { k: 'energy', q: ['طاقتك النهارده', 'Your energy today'], opts: [['كويسة', 'Good'], ['متوسطة', 'OK'], ['تعبانة', 'Low']] },
  { k: 'pain', q: ['الألم', 'Pain'], opts: [['مفيش', 'None'], ['خفيف', 'Mild'], ['جامد', 'Bad']] },
  { k: 'sleep', q: ['نومك', 'Your sleep'], opts: [['كويس', 'Good'], ['متقطع', 'Broken'], ['وحش', 'Poor']] },
];

/** A rough day: bad pain, or two answers on the bad side. Such days get the easy session. */
export function roughDay(c: CheckIn | undefined): boolean {
  if (!c) return false;
  const v = [c.energy, c.pain, c.sleep].filter((x): x is Level => x !== undefined);
  return c.pain === 2 || v.filter((x) => x === 2).length >= 2 || (v.length === 3 && v.reduce<number>((a, b) => a + b, 0) >= 5);
}
export const checkDone = (c: CheckIn | undefined) => !!c && c.energy !== undefined && c.pain !== undefined && c.sleep !== undefined;

/* ---------- Lab results ---------- */

export type LabKind = 'hba1c' | 'tsh' | 'vitd' | 'ferritin' | 'b12' | 'eye' | 'lipids' | 'cbc';
export type LabEntry = { kind: LabKind; value?: number; date: string };

type LabInfo = { n: [string, string]; unit: string; months: number; when: (p: Profile) => boolean; hint?: (v: number) => 'ok' | 'warn' | 'bad'; noValue?: boolean };
const has = (p: Profile, ...ids: string[]) => { const e = effective(p).ids; return ids.some((id) => e.has(id)); };
export const LABS: Record<LabKind, LabInfo> = {
  hba1c: { n: ['السكر التراكمي', 'HbA1c'], unit: '%', months: 3, when: (p) => has(p, 't1d', 't2d', 'ir', 'pcos', 'insulin', 'steroids', 'm_metf', 'm_su', 'm_sglt2', 'm_glp1', 'fatliver'), hint: (v) => (v >= 9 ? 'bad' : v >= 7 ? 'warn' : 'ok') },
  tsh: { n: ['هرمون الغدة (TSH)', 'TSH'], unit: 'mIU/L', months: 6, when: (p) => has(p, 'hashimoto', 'graves', 'thyroxine', 'hypo', 'hyper', 'm_antithy'), hint: (v) => (v < 0.1 || v > 10 ? 'bad' : v < 0.4 || v > 4.5 ? 'warn' : 'ok') },
  vitd: { n: ['فيتامين د', 'Vitamin D'], unit: 'ng/mL', months: 6, when: () => true, hint: (v) => (v < 12 ? 'bad' : v < 20 ? 'warn' : 'ok') },
  ferritin: { n: ['مخزون الحديد (فيريتين)', 'Ferritin'], unit: 'ng/mL', months: 6, when: (p) => p.sex === 'f' || has(p, 'celiac', 'ibd', 'anemia', 'v_iron', 'kidney'), hint: (v) => (v < 15 ? 'bad' : v < 30 ? 'warn' : 'ok') },
  b12: { n: ['فيتامين ب١٢', 'Vitamin B12'], unit: 'pg/mL', months: 12, when: (p) => has(p, 'celiac', 'ibd', 'ms', 'm_metf', 'm_ppi', 'anemia'), hint: (v) => (v < 200 ? 'bad' : v < 300 ? 'warn' : 'ok') },
  lipids: { n: ['الدهون (كوليسترول)', 'Cholesterol'], unit: 'mg/dL', months: 12, when: (p) => has(p, 't2d', 'ir', 'pcos', 'steroids', 'psoriasis', 'lupus', 'ra', 'chol', 'm_statin', 'htn', 'heart', 'fatliver', 'm_isotret', 'kidney'), hint: (v) => (v >= 240 ? 'bad' : v >= 200 ? 'warn' : 'ok') },
  cbc: { n: ['صورة دم ووظائف كبد', 'Blood count and liver tests'], unit: '', months: 3, when: (p) => has(p, 'mtx', 'bio', 'liver', 'm_isotret'), noValue: true },
  eye: { n: ['كشف عيون', 'Eye check'], unit: '', months: 12, when: (p) => has(p, 'hcq', 't1d', 't2d', 'steroids'), noValue: true },
};

/** The lab tests that matter for this person, most relevant first. */
export const labsFor = (p: Profile): LabKind[] => (Object.keys(LABS) as LabKind[]).filter((k) => LABS[k].when(p));

/** The newest result of a test. */
export function latestLab(p: Profile, kind: LabKind): LabEntry | undefined {
  return (p.labs ?? []).filter((x) => x.kind === kind).sort((a, b) => b.date.localeCompare(a.date))[0];
}

/** When a test is due next (YYYY-MM-DD), or null when it was never done (due now). */
export function nextLab(p: Profile, kind: LabKind): string | null {
  const last = latestLab(p, kind);
  if (!last) return null;
  const d = fromKey(last.date);
  d.setMonth(d.getMonth() + LABS[kind].months);
  return dayKey(d);
}

export const labName = (k: LabKind) => L(LABS[k].n[0], LABS[k].n[1]);

/** Adds a result (a newer one on the same day replaces it). */
export function addLab(p: Profile, e: LabEntry): Profile {
  const rest = (p.labs ?? []).filter((x) => !(x.kind === e.kind && x.date === e.date));
  return { ...p, labs: [...rest, e].sort((a, b) => a.date.localeCompare(b.date)) };
}

/* ---------- Report for the doctor ---------- */

const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

export type DoctorInput = {
  profile: Profile;
  /** The last days' logs, oldest first, with their dates. */
  days: { key: string; log: DayLog | null }[];
  /** Planned workout ids per day key (to count workouts done). */
  planned: Record<string, string[]>;
};

/** The summary numbers of the report, separate from the HTML so they can be tested. */
export function doctorSummary({ profile: p, days, planned }: DoctorInput) {
  const logged = days.filter((d) => d.log);
  const checks = logged.map((d) => d.log!.check).filter(checkDone) as Required<CheckIn>[];
  const avg = (k: keyof CheckIn) => (checks.length ? checks.reduce((a, c) => a + c[k], 0) / checks.length : null);
  const rough = logged.filter((d) => roughDay(d.log!.check)).length;
  const flares = logged.filter((d) => d.log!.flare).length;
  let dosesDue = 0, dosesTaken = 0;
  for (const d of days) {
    const due = dosesOn(p, fromKey(d.key));
    dosesDue += due.length;
    dosesTaken += due.filter((x) => d.log?.medsTaken?.includes(x.key)).length;
  }
  let workoutsPlanned = 0, workoutsDone = 0;
  for (const d of days) {
    const ids = planned[d.key] ?? [];
    if (!ids.length) continue;
    workoutsPlanned++;
    if (d.log && ids.filter((id) => d.log!.done.includes(id)).length * 2 >= ids.length) workoutsDone++;
  }
  return { days: days.length, checks: checks.length, energy: avg('energy'), pain: avg('pain'), sleep: avg('sleep'), rough, flares, dosesDue, dosesTaken, workoutsPlanned, workoutsDone };
}

/** Printable HTML (Arabic or English, by the app language) for the doctor. */
export function doctorHTML(input: DoctorInput): string {
  const p = input.profile;
  const s = doctorSummary(input);
  const en = isEn();
  const lvl = (v: number | null, words: [string, string][]) => (v === null ? '—' : L(words[Math.min(2, Math.round(v))][0], words[Math.min(2, Math.round(v))][1]));
  const conds = [...p.conditions.map((id) => tx(CONDITIONS.find((x) => x.id === id)?.n ?? id)), p.otherCond ? ux(p, p.otherCond) : ''].filter(Boolean);
  const meds = medIds(p).map((id) => {
    const pl = medPlan(p, id);
    return `<tr><td>${esc(id.startsWith('x:') ? ux(p, pl.name ?? id.slice(2)) : medName(id, pl))}</td><td>${esc(doseText(pl) || '—')}</td><td>${esc(repeatText(pl))}</td><td>${esc(pl.times.map(timeText).join(L('، ', ', ')))}</td></tr>`;
  });
  if (p.otherMeds?.trim()) meds.push(`<tr><td>${esc(ux(p, p.otherMeds))}</td><td>—</td><td>—</td><td>—</td></tr>`);
  const labs = [...(p.labs ?? [])].sort((a, b) => b.date.localeCompare(a.date)).map((x) =>
    `<tr><td>${esc(labName(x.kind))}</td><td>${x.value !== undefined ? `${x.value} ${LABS[x.kind].unit}` : L('اتعمل', 'done')}</td><td>${x.date}</td></tr>`);
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
  const rows: [string, string][] = [
    [L('الأيام في التقرير', 'Days covered'), String(s.days)],
    [L('أيام سجلت فيها حالتها', 'Days with a check-in'), String(s.checks)],
    [L('متوسط الطاقة', 'Average energy'), lvl(s.energy, CHECK_ITEMS[0].opts)],
    [L('متوسط الألم', 'Average pain'), lvl(s.pain, CHECK_ITEMS[1].opts)],
    [L('متوسط النوم', 'Average sleep'), lvl(s.sleep, CHECK_ITEMS[2].opts)],
    [L('أيام صعبة أو نشاط للمرض', 'Rough or flare days'), String(Math.max(s.rough, s.flares))],
    [L('الالتزام بالأدوية (حسب التسجيل)', 'Medicine doses ticked'), s.dosesDue ? `${s.dosesTaken} / ${s.dosesDue} (${pct(s.dosesTaken, s.dosesDue)})` : '—'],
    [L('التمرين', 'Workouts done'), s.workoutsPlanned ? `${s.workoutsDone} / ${s.workoutsPlanned}` : '—'],
  ];
  const w = p.weights ?? [];
  const wLine = w.length > 1 ? `${w[0].kg} → ${w[w.length - 1].kg} ${L('كجم', 'kg')}` : `${p.weight} ${L('كجم', 'kg')}`;
  const doctor = p.doctorSaid?.trim() ? `<h2>${L('ملاحظات الدكتور السابقة', "Doctor's earlier advice")}</h2><p>${esc(ux(p, p.doctorSaid))}</p>` : '';
  return `<!doctype html><html dir="${en ? 'ltr' : 'rtl'}" lang="${en ? 'en' : 'ar'}"><head><meta charset="utf-8">
<style>body{font-family:-apple-system,'Segoe UI',Tahoma,sans-serif;color:#111;padding:24px;font-size:13px}h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:18px 0 6px;border-bottom:1px solid #ddd;padding-bottom:4px}
table{width:100%;border-collapse:collapse}td,th{border:1px solid #ddd;padding:6px 8px;text-align:${en ? 'left' : 'right'}}th{background:#f3f4f5}.m{color:#666}</style></head><body>
<h1>${L('تقرير للدكتور', 'Report for my doctor')}</h1>
<div class="m">${esc(p.name || '')} · ${p.sex === 'f' ? L('أنثى', 'Female') : L('ذكر', 'Male')} · ${p.age} ${L('سنة', 'yrs')} · ${p.height} ${L('سم', 'cm')} · ${esc(wLine)}</div>
<div class="m">${L('من', 'From')} ${input.days[0]?.key ?? ''} ${L('لـ', 'to')} ${input.days[input.days.length - 1]?.key ?? ''}</div>
<h2>${L('الأمراض', 'Conditions')}</h2><p>${conds.length ? conds.map(esc).join(L('، ', ', ')) : L('مفيش', 'None')}</p>
<h2>${L('الأدوية ومواعيدها', 'Medicines and times')}</h2>${meds.length ? `<table><tr><th>${L('الدوا', 'Medicine')}</th><th>${L('الجرعة', 'Dose')}</th><th>${L('كل قد إيه', 'How often')}</th><th>${L('الميعاد', 'Time')}</th></tr>${meds.join('')}</table>` : `<p>${L('مفيش', 'None')}</p>`}
<h2>${L('آخر شهر', 'Last month')}</h2><table>${rows.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</table>
<h2>${L('التحاليل', 'Lab results')}</h2>${labs.length ? `<table><tr><th>${L('التحليل', 'Test')}</th><th>${L('النتيجة', 'Result')}</th><th>${L('التاريخ', 'Date')}</th></tr>${labs.join('')}</table>` : `<p>${L('لسه مفيش تحاليل متسجلة', 'No results logged yet')}</p>`}
${doctor}
<p class="m" style="margin-top:24px">${L('التقرير ده من تطبيق يلا ويل، من اللي الشخص سجله بنفسه. مش تشخيص طبي.', 'Made with the Yalla Well app from what the person logged. Not a medical diagnosis.')}</p>
</body></html>`;
}

export const DAYS: [string, string][] = [['السبت', 'Saturday'], ['الأحد', 'Sunday'], ['الاتنين', 'Monday'], ['التلات', 'Tuesday'], ['الأربع', 'Wednesday'], ['الخميس', 'Thursday'], ['الجمعة', 'Friday']];

/* ---------- Easy days ---------- */

export type EasyWhy = 'flare' | 'dose' | 'check';
/**
 * Whether a day's workout should be the gentle recovery session, and why: the person said they're in a flare,
 * a weekly injection was the day before, or the check-in says it's a rough day. The last two can be turned off
 * for the day (DayLog.normalDay).
 */
export function easyDay(p: Profile, log: DayLog | null | undefined, d: Date): { easy: boolean; why: EasyWhy | null; med?: string } {
  if (log?.flare) return { easy: true, why: 'flare' };
  if (log?.normalDay) return { easy: false, why: null };
  const med = afterWeeklyDose(p, d);
  if (med) return { easy: true, why: 'dose', med };
  if (roughDay(log?.check)) return { easy: true, why: 'check' };
  return { easy: false, why: null };
}
