// Weekly calorie check: compares the real weight trend with the goal and suggests a small change to the target.
import { L, num } from './i18n.ts';
import { genderFor, kcalFloor, medical, ownDiet, targets, type Profile } from './plan.ts';

const DAY = 86400000;
const t = (d: string) => { const [y, m, dd] = d.split('-').map(Number); return Date.UTC(y, m - 1, dd) / DAY; };
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Most the weekly checks can move the target away from the computed one, either way. */
export const ADJ_MAX = 300;

/**
 * Weight change per week from the weigh-ins of the last 4 weeks (a straight line through them, so one heavy or
 * light morning doesn't swing it). Needs at least 2 weigh-ins 10 or more days apart.
 */
export function weeklyRate(weights: { d: string; kg: number }[] | undefined, today: Date): { kgPerWeek: number; days: number; n: number } | null {
  const now = t(key(today));
  const xs = (weights ?? []).filter((w) => now - t(w.d) <= 28 && t(w.d) <= now);
  if (xs.length < 2) return null;
  const days = t(xs[xs.length - 1].d) - t(xs[0].d);
  if (days < 10) return null;
  const mx = xs.reduce((a, w) => a + t(w.d), 0) / xs.length;
  const my = xs.reduce((a, w) => a + w.kg, 0) / xs.length;
  const num_ = xs.reduce((a, w) => a + (t(w.d) - mx) * (w.kg - my), 0);
  const den = xs.reduce((a, w) => a + (t(w.d) - mx) ** 2, 0);
  if (!den) return null;
  return { kgPerWeek: Math.round((num_ / den) * 7 * 100) / 100, days, n: xs.length };
}

export type CalorieCheck =
  | { kind: 'change'; delta: number; title: string; why: string }
  | { kind: 'doctor'; title: string; why: string }
  | { kind: 'weigh'; title: string; why: string };

/**
 * This week's suggestion, or null when nothing is needed (on track, or already answered in the last 7 days).
 * Losing: aim for 0.25–1% of body weight a week. Gaining: 0.1–0.5%. Maintaining: within 0.3% either way.
 * People whose condition limits the calorie deficit never get a lower target from here; they're sent to their doctor.
 */
export function calorieCheck(p: Profile, today: Date): CalorieCheck | null {
  // A dietitian's plan is changed by the dietitian, not by the app.
  if (ownDiet(p)) return null;
  if (p.adjAt && t(key(today)) - t(p.adjAt) < 7) return null;
  const g = genderFor(p.sex);
  const r = weeklyRate(p.weights, today);
  const started = p.start ? t(key(today)) - t(p.start) : 0;
  if (!r) {
    if (started < 14) return null;
    return { kind: 'weigh', title: L(`${g('سجل', 'سجلي')} وزنك مرة في الأسبوع`, 'Log your weight once a week'),
      why: L('عشان نعرف لو السعرات محتاجة تتعدل، محتاجين وزنتين على الأقل بينهم أسبوع ونص. الأحسن نفس اليوم ونفس الوقت، الصبح قبل الفطار.', 'To know whether your calories need changing we need at least two weigh-ins about 10 days apart. Same day and time is best, in the morning before breakfast.') };
  }
  const pct = (r.kgPerWeek / p.weight) * 100;
  const rate = L(`${r.kgPerWeek > 0 ? '+' : ''}${num(r.kgPerWeek)} كجم في الأسبوع`, `${r.kgPerWeek > 0 ? '+' : ''}${r.kgPerWeek} kg a week`);
  const T0 = targets(p);
  const adj = p.kcalAdj ?? 0;
  const capped = medical(p).mod.deficit < 0.2;
  const change = (delta: number, title: string, why: string): CalorieCheck | null => {
    const next = Math.max(-ADJ_MAX, Math.min(ADJ_MAX, adj + delta));
    if (next === adj) return null;
    if (delta < 0 && T0.kcal + (next - adj) < kcalFloor(p)) return null;
    return { kind: 'change', delta: next - adj, title, why };
  };
  if (p.goal === 'lose') {
    if (pct > -0.2) {
      if (capped) return { kind: 'doctor', title: L('الوزن ثابت الفترة دي', "Your weight hasn't moved lately"),
        why: L(`وزنك بيتغير ${rate}. مش هنقلل السعرات عشان حالتك محتاجة عجز بسيط. ${g('اسأل', 'اسألي')} دكتورك لو التحاليل أو الجرعة محتاجين مراجعة، ولو ${g('عملت', 'عملتي')} تحليل جديد ${g('سجله', 'سجليه')} في صحتي.`, `Your weight is changing ${rate}. We won't cut calories because your condition needs a small deficit. Ask your doctor whether your labs or dose need a review, and log any new result in My health.`) };
      return change(-100, L('الوزن ثابت، نقلل ١٠٠ سعرة؟', 'Weight is steady: 100 kcal less?'),
        L(`آخر ${num(r.days)} يوم وزنك بيتغير ${rate}، وده أبطأ من المطلوب. لو قللنا ١٠٠ سعرة في اليوم النزول هيرجع يمشي.`, `Over the last ${r.days} days your weight changed ${rate}, slower than planned. 100 fewer kcal a day should get it moving again.`));
    }
    if (pct < -1) return change(150, L('النزول أسرع من اللازم، نزود ١٥٠ سعرة؟', 'Losing too fast: 150 kcal more?'),
      L(`وزنك بينزل ${rate}، وده أسرع من الصحي وممكن يكون على حساب العضل. هنزود ١٥٠ سعرة في اليوم.`, `You're losing ${rate}, faster than is healthy, and some of it may be muscle. We'll add 150 kcal a day.`));
    return null;
  }
  if (p.goal === 'gain') {
    if (pct < 0.1) return change(100, L('الوزن مش بيزيد، نزود ١٠٠ سعرة؟', 'Not gaining: 100 kcal more?'),
      L(`آخر ${num(r.days)} يوم وزنك بيتغير ${rate}. عشان العضل يزيد محتاجين زيادة بسيطة، فهنزود ١٠٠ سعرة في اليوم.`, `Over the last ${r.days} days your weight changed ${rate}. Building muscle needs a slow gain, so we'll add 100 kcal a day.`));
    if (pct > 0.5) return change(-100, L('الزيادة أسرع من اللازم، نقلل ١٠٠ سعرة؟', 'Gaining too fast: 100 kcal less?'),
      L(`وزنك بيزيد ${rate}، وده أسرع من اللي العضل بيبنيه، فالزيادة ممكن تبقى دهون. هنقلل ١٠٠ سعرة.`, `You're gaining ${rate}, faster than muscle can be built, so some of it may be fat. We'll take off 100 kcal.`));
    return null;
  }
  if (pct < -0.3) return change(100, L('الوزن بينزل، نزود ١٠٠ سعرة؟', 'Losing weight: 100 kcal more?'),
    L(`هدفك ثبات الوزن، ووزنك بينزل ${rate}. هنزود ١٠٠ سعرة في اليوم.`, `Your goal is to keep your weight, and it's going down ${rate}. We'll add 100 kcal a day.`));
  if (pct > 0.3 && !capped) return change(-100, L('الوزن بيزيد، نقلل ١٠٠ سعرة؟', 'Gaining weight: 100 kcal less?'),
    L(`هدفك ثبات الوزن، ووزنك بيزيد ${rate}. هنقلل ١٠٠ سعرة في اليوم.`, `Your goal is to keep your weight, and it's going up ${rate}. We'll take off 100 kcal a day.`));
  return null;
}
