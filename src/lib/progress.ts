// Weekly progression: alternating machines every other week and a 4-week load cycle.
import { L } from './i18n.ts';

export type Phase = { n: string; text: string; setsDelta: number; load: number };

// Getters, so the text follows the app language at read time.
const phase = (ar: string, en: string, arText: string, enText: string, setsDelta: number, load: number): Phase => ({
  get n() { return L(ar, en); }, get text() { return L(arText, enText); }, setsDelta, load,
});
/** 4-week cycle: base, heavier, more volume, lighter recovery week. */
export const PHASES: Phase[] = [
  phase('أسبوع أساس', 'Base week', 'نثبت الحركة والوزن.', 'Lock in the movement and the weight.', 0, 1),
  phase('أسبوع تقيل', 'Heavy week', 'نفس العدات بوزن أتقل شوية.', 'Same reps with a slightly heavier weight.', 0, 1),
  phase('أسبوع حجم', 'Volume week', 'مجموعة زيادة في كل تمرين.', 'One extra set on every exercise.', 1, 1),
  phase('أسبوع خفيف', 'Light week', 'وزن أخف ومجموعات أقل عشان الجسم يرتاح ويستعد للدورة الجاية.', 'Lighter weights and fewer sets so your body recovers and gets ready for the next cycle.', -1, 0.8),
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
