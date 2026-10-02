// Weekly progression: alternating machines every other week and a 4-week load cycle.

export type Phase = { n: string; text: string; setsDelta: number; load: number };

/** 4-week cycle: base, heavier, more volume, lighter recovery week. */
export const PHASES: Phase[] = [
  { n: 'أسبوع أساس', text: 'نثبت الحركة والوزن.', setsDelta: 0, load: 1 },
  { n: 'أسبوع تقيل', text: 'نفس العدات بوزن أتقل شوية.', setsDelta: 0, load: 1 },
  { n: 'أسبوع حجم', text: 'مجموعة زيادة في كل تمرين.', setsDelta: 1, load: 1 },
  { n: 'أسبوع خفيف', text: 'وزن أخف ومجموعات أقل عشان الجسم يرتاح ويستعد للدورة الجاية.', setsDelta: -1, load: 0.8 },
];

const DAY = 86400000;
const parse = (k: string) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d).getTime(); };

/** Whole weeks since the plan started (0 for the first week). */
export function programWeek(start: string | undefined, today: Date): number {
  if (!start) return 0;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.max(0, Math.floor(Math.round((t - parse(start)) / DAY) / 7));
}

export const phaseFor = (week: number) => PHASES[week % 4];
/** Even weeks use the session's main exercises, odd weeks its alternates. */
export const variantFor = (week: number): 'A' | 'B' => (week % 2 === 0 ? 'A' : 'B');

export type SetLog = { w: number; r: number };
export type LiftLog = { date: string; w: number; reps: number[]; top: number };

/** Kilograms to add once every set reached the top of the rep range. */
export const stepFor = (id: string) => (/squat|legpress|hack|rdl|hipthrust|deadlift|bench|row|latpull|chestm|incline/.test(id) ? 2.5 : 1);

/** Suggested working weight for today, from the last session of this exercise. */
export function suggestWeight(id: string, last: LiftLog | undefined, phase: Phase): number | null {
  if (!last || !last.w) return null;
  const hitTop = last.reps.length > 0 && last.reps.every((r) => r >= last.top);
  const base = hitTop ? last.w + stepFor(id) : last.w;
  return Math.round((base * phase.load) / 0.5) * 0.5;
}
