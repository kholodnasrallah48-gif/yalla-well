// Health cards: today's medicine doses with a tick each, the daily check-in, and the easy-day banner.
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import type { DayLog } from '../lib/day.ts';
import { CHECK_ITEMS, checkDone, dosesOn, roughDay, timeText, type CheckIn, type EasyWhy, type Level } from '../lib/health.ts';
import { L } from '../lib/i18n.ts';
import type { Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Card, T, styles } from './ui.tsx';

type G = (m: string, f: string) => string;

/** Today's doses, each with how to take it and a tick. Nothing when the person has no medicine schedule. */
export function TodayDoses({ profile, day, update, g }: { profile: Profile; day: DayLog; update: (f: (d: DayLog) => DayLog) => void; g: G }) {
  const c = useColors();
  const doses = dosesOn(profile, new Date());
  if (!doses.length) return null;
  const taken = day.medsTaken ?? [];
  const tick = (key: string) => {
    const on = taken.includes(key);
    play(on ? 'remove' : 'check');
    update((d) => ({ ...d, medsTaken: on ? (d.medsTaken ?? []).filter((k) => k !== key) : [...(d.medsTaken ?? []), key] }));
  };
  return (
    <Card>
      <View style={styles.rowBetween}>
        <T kind="h2">{L('أدوية النهارده', "Today's medicines")}</T>
        <Pressable onPress={() => { play('tap'); router.push('/health'); }} hitSlop={8} accessibilityRole="button">
          <T kind="small" color={c.petrol} style={{ fontFamily: fonts.bodyMedium }}>{L(g('عدّل المواعيد', 'عدّلي المواعيد'), 'Edit times')}</T>
        </Pressable>
      </View>
      {doses.map((x, i) => {
        const on = taken.includes(x.key);
        return (
          <View key={x.key} style={[styles.row, { gap: 10, alignItems: 'flex-start', paddingVertical: 6, borderTopWidth: i ? 1 : 0, borderColor: c.line }]}>
            <Pressable onPress={() => tick(x.key)} hitSlop={8} accessibilityRole="checkbox" accessibilityState={{ checked: on }}
              accessibilityLabel={L(`${g('خدت', 'خدتي')} ${x.name}`, `Took ${x.name}`)}
              style={{ width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: c.petrol, backgroundColor: on ? c.petrol : 'transparent', alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
              {on ? <Text style={{ color: c.onPetrol, fontSize: 15, fontWeight: '700' }}>✓</Text> : null}
            </Pressable>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={[styles.row, { gap: 8 }]}>
                <T kind="body" style={{ fontFamily: fonts.bodyMedium, flexShrink: 1, opacity: on ? 0.6 : 1 }}>{x.name}</T>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 13, color: c.lime }}>{timeText(x.time)}</Text>
              </View>
              {x.how && !on ? <T kind="small">{x.how}</T> : null}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

/** "How are you today?": three quick questions. A rough answer makes today's workout the easy one. */
export function CheckInCard({ day, update, g }: { day: DayLog; update: (f: (d: DayLog) => DayLog) => void; g: G }) {
  const c = useColors();
  const ch = day.check ?? {};
  const set = (k: keyof CheckIn, v: Level) => {
    play('tap');
    update((d) => ({ ...d, check: { ...d.check, [k]: v }, normalDay: false }));
  };
  const done = checkDone(day.check);
  const rough = roughDay(day.check);
  return (
    <Card>
      <T kind="h2">{L(g('عامل إيه النهارده؟', 'عاملة إيه النهارده؟'), 'How are you today?')}</T>
      {CHECK_ITEMS.map((it) => (
        <View key={it.k} style={{ gap: 6 }}>
          <T kind="small">{L(it.q[0], it.q[1])}</T>
          <View style={[styles.row, { gap: 6 }]}>
            {it.opts.map(([ar, en], v) => {
              const on = ch[it.k] === v;
              const tone = v === 0 ? c.ok : v === 1 ? c.warn : c.bad;
              return (
                <Pressable key={v} onPress={() => set(it.k, v as Level)} accessibilityRole="radio" accessibilityState={{ selected: on }}
                  style={{ flex: 1, alignItems: 'center', paddingVertical: 7, borderRadius: 4, borderWidth: 1.5, borderColor: on ? tone : c.line, backgroundColor: on ? tone : c.surface }}>
                  <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: on ? (v === 0 ? c.onPetrol : '#0B0D0E') : c.ink }}>{L(ar, en)}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ))}
      {done ? (
        <T kind="small" color={rough ? c.warn : c.ok}>
          {rough ? L(`خلينا تمرين النهارده خفيف (يوم تعافي). ${g('خد', 'خدي')} بالك من نفسك.`, "We've made today's workout an easy recovery day. Take care of yourself.")
            : L('تمام، التمرين زي ما هو.', 'Great, your workout stays as planned.')}
        </T>
      ) : null}
    </Card>
  );
}

/** Why today is an easy day, with a way back to the normal workout (not for a flare the person switched on). */
export function EasyBanner({ why, med, update, g }: { why: EasyWhy | null; med?: string; update: (f: (d: DayLog) => DayLog) => void; g: G }) {
  const c = useColors();
  if (why !== 'dose' && why !== 'check') return null;
  return (
    <View style={{ backgroundColor: c.warnBg, borderRadius: 4, padding: 12, gap: 6 }}>
      <T kind="small" color={c.warn} style={{ fontFamily: fonts.bodyMedium }}>
        {why === 'dose' ? L(`امبارح كان ميعاد ${med}، فخلينا النهارده يوم تعافي خفيف.`, `Yesterday was your ${med} dose, so today is an easy recovery day.`)
          : L(`من إجاباتك النهارده خلينا التمرين يوم تعافي خفيف.`, "From your check-in, today's workout is an easy recovery day.")}
      </T>
      <Pressable onPress={() => { play('tap'); update((d) => ({ ...d, normalDay: true })); }} accessibilityRole="button" hitSlop={6}>
        <T kind="small" color={c.petrol} style={{ fontFamily: fonts.bodyMedium }}>{L(`${g('أنا كويس', 'أنا كويسة')}، رجّع التمرين العادي`, "I'm fine, bring back my normal workout")}</T>
      </Pressable>
    </View>
  );
}
