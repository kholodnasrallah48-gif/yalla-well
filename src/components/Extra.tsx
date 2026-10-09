// Conditions the person typed themselves: what the app recognised as they type, what it will do about each one
// it knows, and three quick questions for one it doesn't, so it's still taken into account in food and training.
import { View } from 'react-native';

import { L } from '../lib/i18n.ts';
import { FLAG_TAGS, TRAIN_LABEL, WATCH_LABEL, matchItems, splitItems, type Answers, type FoodFlag, type KBItem, type TrainFlag, type Watch } from '../lib/kb.ts';
import type { Gender } from '../lib/plan.ts';
import { Head } from './Mascot.tsx';
import { Card, Chip, Kicker, T, styles } from './ui.tsx';
import { useColors } from '../theme.ts';

/** Under the "something else" box: each typed item and whether the app knows it. */
export function TypedList({ text, g }: { text: string | undefined; g: Gender }) {
  const c = useColors();
  const items = splitItems(text);
  if (!items.length) return null;
  return (
    <View style={{ gap: 6 }}>
      {items.map((t, i) => {
        const hit = matchItems(t);
        return (
          <View key={i} style={[styles.row, { gap: 8, alignItems: 'flex-start' }]}>
            <View style={{ marginTop: 5 }}><Head on={!!hit.length} size={10} ring={c.dim} /></View>
            <T kind="small" style={{ flex: 1 }} color={hit.length ? c.ink : c.muted}>
              {hit.length
                ? L(`${t}: عارفينه (${hit.map((h) => h.n[0]).join('، ')})، وهنراعيه في الأكل والتمرين.`, `${t}: recognised (${hit.map((h) => h.n[1]).join(', ')}); food and training will take it into account.`)
                : L(`${t}: مش في قائمتنا، هنسأل${g('ك', 'كي')} عنه ٣ أسئلة في الخطوة الجاية.`, `${t}: not on our list; we'll ask you three quick questions about it next.`)}
            </T>
          </View>
        );
      })}
    </View>
  );
}

/** What the app does for a typed condition it knows. */
export function KnownCard({ item, text, g }: { item: KBItem; text: string; g: Gender }) {
  const c = useColors();
  const lines = [item.foodNote?.(g), item.trainNote?.(g)].filter((x): x is [string, string] => !!x).map(([a, e]) => L(a, e));
  if (item.pain) lines.push(L('بدلنا التمارين اللي بتضغط عليه بتمارين ألطف.', 'Exercises that strain it are swapped for gentler ones.'));
  const watch = (item.watch ?? []).map((w) => L(WATCH_LABEL[w][0], WATCH_LABEL[w][1]));
  return (
    <Card>
      <Kicker>{L(`${g('كتبت', 'كتبتي')}: ${text}`, `You wrote: ${text}`)}</Kicker>
      <T kind="h2">{L(item.n[0], item.n[1])}</T>
      {lines.length ? lines.map((l, i) => <T key={i} kind="small">{l}</T>) : <T kind="small">{L('هنراعيه في التنبيهات والتقرير للدكتور.', "We'll take it into account in alerts and the doctor's report.")}</T>}
      {watch.length ? <T kind="small" color={c.warn}>{L(`${g('وقف', 'وقفي')} التمرين لو ${g('حسيت', 'حسيتي')} بـ: ${watch.join('، ')}.`, `Stop training if you feel: ${watch.join(', ').toLowerCase()}.`)}</T> : null}
    </Card>
  );
}

const ASK_WATCH: Watch[] = ['dizzy', 'breath', 'chest', 'palp', 'headache', 'joint', 'numb', 'sugarLow'];

/** Three quick questions about a typed condition the app doesn't know. */
export function UnknownCard({ text, ans, onChange, g }: { text: string; ans: Answers | undefined; onChange: (a: Answers) => void; g: Gender }) {
  const c = useColors();
  const a = ans ?? {};
  const flip = <K extends 'food' | 'train' | 'watch'>(k: K, v: NonNullable<Answers[K]>[number]) => {
    const cur = (a[k] ?? []) as string[];
    onChange({ ...a, [k]: cur.includes(v as string) ? cur.filter((x) => x !== v) : [...cur, v] });
  };
  const none = (k: 'food' | 'train' | 'watch') => onChange({ ...a, [k]: [] });
  const isNone = (k: 'food' | 'train' | 'watch') => Array.isArray(a[k]) && !a[k]!.length;
  return (
    <Card>
      <Kicker>{L(`${g('كتبت', 'كتبتي')}: ${text}`, `You wrote: ${text}`)}</Kicker>
      <T kind="h2">{L(`${g('ساعدنا', 'ساعدينا')} نراعي (${text})`, `Help us account for "${text}"`)}</T>
      <T kind="small">{L(`مش في قائمتنا، فـ${g('جاوب', 'جاوبي')} على قد ما ${g('تعرف', 'تعرفي')} من كلام دكتورك.`, "It isn't on our list, so answer as far as you know from your doctor.")}</T>

      <T kind="label">{L(`${g('محتاج تقلل', 'محتاجة تقللي')} إيه في الأكل؟`, 'What do you need to cut down on?')}</T>
      <View style={styles.wrap}>
        {(Object.keys(FLAG_TAGS) as FoodFlag[]).map((f) => <Chip key={f} label={L(FLAG_TAGS[f].ar, FLAG_TAGS[f].en)} on={!!a.food?.includes(f)} onPress={() => flip('food', f)} />)}
        <Chip label={L('مفيش', 'Nothing')} on={isNone('food')} onPress={() => none('food')} />
      </View>

      <T kind="label">{L(`إيه اللي ${g('تبعد', 'تبعدي')} عنه في التمرين؟`, 'What should you avoid in training?')}</T>
      <View style={styles.wrap}>
        {(Object.keys(TRAIN_LABEL) as TrainFlag[]).map((f) => <Chip key={f} label={L(TRAIN_LABEL[f][0], TRAIN_LABEL[f][1])} on={!!a.train?.includes(f)} onPress={() => flip('train', f)} />)}
        <Chip label={L('مفيش', 'Nothing')} on={isNone('train')} onPress={() => none('train')} />
      </View>

      <T kind="label">{L(`لو ${g('حسيت', 'حسيتي')} بإيه ${g('توقف', 'توقفي')} التمرين؟`, 'Which signs mean you should stop training?')}</T>
      <View style={styles.wrap}>
        {ASK_WATCH.map((w) => <Chip key={w} label={L(WATCH_LABEL[w][0], WATCH_LABEL[w][1])} on={!!a.watch?.includes(w)} onPress={() => flip('watch', w)} />)}
        <Chip label={L('مفيش', 'Nothing')} on={isNone('watch')} onPress={() => none('watch')} />
      </View>
      <T kind="small" color={c.muted}>{L(`لو مش ${g('متأكد', 'متأكدة')} ${g('سيبها', 'سيبيها')} و${g('اسأل', 'اسألي')} دكتورك، و${g('تقدر ترجع تعدل', 'تقدري ترجعي تعدلي')} من ملفي.`, "If you're not sure, leave it, ask your doctor, and come back to it from Me.")}</T>
    </Card>
  );
}
