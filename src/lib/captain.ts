// What the captain (the champ from the logo) says on each screen: one short line in the person's own Egyptian
// Arabic (or English), picked from where their day stands.
import { fmt } from './day.ts';
import { L } from './i18n.ts';
import type { Gender } from './plan.ts';

export type Line = { head: string; body: string };

/** Home: the streak, today's workout, and how the calories stand. */
export function homeLine(o: {
  g: Gender; name: string; hour: number; kcalStreak: number; left: number; target: number; eaten: number;
  /** Today's workout short name, or null on a rest day; done / total exercises ticked. */
  workout: string | null; done: number; total: number;
}): Line {
  const { g } = o;
  const champ = L(g('يا بطل', 'يا بطلة'), 'champ');
  const today = o.workout
    ? L(`النهارده ${o.workout}، يلا ننزل الملعب.`, `Today it's ${o.workout}. Let's hit the field.`)
    : L(`النهارده راحة، ${g('اشرب', 'اشربي')} مياه ${g('وفك', 'وفكّي')} عضلاتك.`, 'Rest day today. Drink water and loosen up.');
  if (o.total > 0 && o.done >= o.total && o.left >= 0) {
    return { head: L(`${g('كسبت', 'كسبتي')} ماتش النهارده!`, "You won today's match!"), body: L(`التمرين خلص، فاضل ${fmt(o.left)} سعرة ${g('تقفل', 'تقفلي')} بيهم اليوم.`, `Workout done. ${fmt(o.left)} kcal left to close the day.`) };
  }
  if (o.left < 0) {
    return { head: L('عدّينا الهدف شوية', 'A little over today'), body: L(`مش مشكلة، تمشية ٢٠ دقيقة وبكرة نظبطها.`, "No problem. A 20-minute walk and we'll even it out tomorrow.") };
  }
  if (o.kcalStreak >= 2) {
    return { head: L(`${o.kcalStreak} أيام ورا بعض!`, `${o.kcalStreak} days in a row!`), body: today };
  }
  if (o.eaten === 0 && o.hour < 12) {
    return { head: L(`صباح الفل${o.name ? ' يا ' + o.name : ''}!`, `Morning${o.name ? ', ' + o.name : ''}!`), body: L(`${g('ابدأ', 'ابدئي')} بفطار فيه بروتين، وأنا معاك${g('', 'ي')} طول اليوم.`, "Start with a breakfast that has protein. I'm with you all day.") };
  }
  return { head: L(`يلا ${champ}!`, `Let's go, ${champ}!`), body: today };
}

/** Food: what the next meal can take, with an idea when there is one. `left` is the whole day's, `budget` the meal's. */
export function foodLine(o: { g: Gender; left: number; budget: number; meal: string | null; idea?: { name: string; kcal: number } | null; pending?: string | null }): string {
  const { g } = o;
  const tick = o.pending ? L(` ${g('علّم', 'علّمي')} على ${o.pending} لما ${g('تخلصه', 'تخلصيه')} عشان يتحسب.`, ` Tick ${o.pending} when you finish it so it counts.`) : '';
  if (o.left < 0) return L(`${g('عديت', 'عديتي')} بـ${fmt(-o.left)} سعرة. خلّي الوجبة الجاية خفيفة، خضار وبروتين.`, `${fmt(-o.left)} kcal over. Keep the next meal light: veg and protein.`);
  if (!o.meal) return o.pending ? tick.trim() : L(`${g('قفلت', 'قفلتي')} وجبات النهارده. فاضل ${fmt(o.left)} سعرة لو ${g('جعت', 'جعتي')}.`, `All meals done. ${fmt(o.left)} kcal left if you get hungry.`);
  const idea = o.idea ? L(` ${o.idea.name} بـ${fmt(o.idea.kcal)} ${g('وتكسب', 'وتكسبي')} الماتش.`, ` ${o.idea.name} for ${fmt(o.idea.kcal)} and you win the match.`) : '';
  return L(`عندك ${fmt(o.budget)} سعرة ${o.meal}.`, `You have ${fmt(o.budget)} kcal for ${o.meal}.`) + idea + tick;
}

/** Train: cheers that follow the workout from warm-up to the final whistle. */
export function trainLine(o: { g: Gender; done: number; total: number; rest: boolean }): string {
  const { g } = o;
  if (o.rest) return L(`النهارده راحة. العضل بيكبر وانت${g('', 'ي')} مرتاح${g('', 'ة')}.`, 'Rest day. Muscles grow while you rest.');
  const left = o.total - o.done;
  if (o.total && left <= 0) return L(`صفّارة النهاية! ${g('كسبت', 'كسبتي')} الماتش.`, 'Final whistle! You won the match.');
  if (o.done === 0) return L(`${g('سخّن', 'سخّني')} ٥ دقايق ويلا نبدأ.`, 'Warm up for 5 minutes and kick off.');
  if (left <= 2) return L(`آخر ${left === 1 ? 'واحد' : 'اتنين'}، ${g('شد', 'شدّي')} حيلك!`, left === 1 ? 'Last one, push!' : 'Last two, push!');
  if (o.done * 2 >= o.total) return L(`نص الماتش خلص، ${g('كمّل', 'كمّلي')}!`, 'Half time. Keep going!');
  return L(`حلو! فاضل ${left} تمارين.`, `Nice! ${left} exercises to go.`);
}
