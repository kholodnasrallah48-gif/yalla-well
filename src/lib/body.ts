// Body measurements (tape measure, in cm) and an estimate of body fat from them.
import { L } from './i18n.ts';
import type { Profile, Sex } from './plan.ts';

export type Measure = 'waist' | 'hips' | 'chest' | 'arm' | 'thigh' | 'neck';
export type BodyEntry = { d: string } & Partial<Record<Measure, number>>;

/** What to measure and where, in the order the form shows them. */
export const MEASURES: { id: Measure; n: () => string; how: () => string }[] = [
  { id: 'waist', n: () => L('الوسط', 'Waist'), how: () => L('عند السرة، والبطن مفرودة من غير شفط', 'At the belly button, stomach relaxed') },
  { id: 'hips', n: () => L('الأرداف', 'Hips'), how: () => L('عند أعرض حتة في الأرداف', 'Around the widest part of your hips') },
  { id: 'chest', n: () => L('الصدر', 'Chest'), how: () => L('تحت الإبط على أعرض حتة', 'Under the arms, around the widest part') },
  { id: 'arm', n: () => L('الدراع', 'Arm'), how: () => L('نص المسافة بين الكتف والكوع', 'Halfway between shoulder and elbow') },
  { id: 'thigh', n: () => L('الفخد', 'Thigh'), how: () => L('أعرض حتة في الفخد', 'Around the widest part of the thigh') },
  { id: 'neck', n: () => L('الرقبة', 'Neck'), how: () => L('تحت تفاحة آدم', 'Just below the Adam’s apple') },
];

const today = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Saves the day's measurements, merged with anything already saved that day. */
export function logBody(p: Profile, values: Partial<Record<Measure, number>>, date = today()): Profile {
  const list = p.body ?? [];
  const old = list.find((x) => x.d === date);
  const entry: BodyEntry = { ...old, ...values, d: date };
  const rest = list.filter((x) => x.d !== date);
  return { ...p, body: [...rest, entry].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)) };
}

/** The newest value of each measurement and the change since its first one. */
export function bodyChanges(p: Profile): Partial<Record<Measure, { now: number; first: number; diff: number; d: string }>> {
  const out: Partial<Record<Measure, { now: number; first: number; diff: number; d: string }>> = {};
  for (const { id } of MEASURES) {
    const xs = (p.body ?? []).filter((x) => x[id] != null);
    if (!xs.length) continue;
    const first = xs[0][id]!, now = xs[xs.length - 1][id]!;
    out[id] = { now, first, diff: Math.round((now - first) * 10) / 10, d: xs[xs.length - 1].d };
  }
  return out;
}

/**
 * Body fat % from the US Navy tape method (waist and neck, plus hips for women), or null when a measurement is
 * missing or the numbers can't be right. It's an estimate; the trend matters more than the number.
 */
export function bodyFat(sex: Sex, height: number, m: Partial<Record<Measure, number>>): number | null {
  const { waist, neck, hips } = m;
  if (!waist || !neck || !height) return null;
  let v: number;
  if (sex === 'm') {
    if (waist - neck <= 0) return null;
    v = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
  } else {
    if (!hips || waist + hips - neck <= 0) return null;
    v = 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.221 * Math.log10(height)) - 450;
  }
  return v > 2 && v < 70 ? Math.round(v * 10) / 10 : null;
}

/** Body fat over time from each day that has the needed measurements, oldest first. */
export function fatTrend(p: Profile): { d: string; fat: number; lean: number }[] {
  const out: { d: string; fat: number; lean: number }[] = [];
  // Carry the latest value of each measurement forward, so a day with only the waist still gives a reading.
  const cur: Partial<Record<Measure, number>> = {};
  for (const e of p.body ?? []) {
    for (const { id } of MEASURES) if (e[id] != null) cur[id] = e[id];
    const fat = bodyFat(p.sex, p.height, cur);
    if (fat == null) continue;
    const kg = weightOn(p, e.d);
    out.push({ d: e.d, fat, lean: Math.round(kg * (1 - fat / 100) * 10) / 10 });
  }
  return out;
}

/** The weigh-in on or before a date (the profile weight when there's none). */
export function weightOn(p: Profile, d: string): number {
  const ws = (p.weights ?? []).filter((w) => w.d <= d);
  return ws.length ? ws[ws.length - 1].kg : p.weight;
}
