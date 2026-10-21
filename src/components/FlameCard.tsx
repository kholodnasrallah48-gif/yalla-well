// The flame streak on Today: days in a row on calorie target, lit by holding the flame once the day is done, with
// shields that cover a missed day. Tapping the card opens the month calendar. See lib/flame for the rules.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { dayKey, weekIndex, type DayLog } from '../lib/day.ts';
import { flame, MAX_SHIELDS, type FlameEvent, type FlameMark } from '../lib/flame.ts';
import { isEn, L } from '../lib/i18n.ts';
import type { Gender, Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { FlameIcon, ShieldIcon } from './Icons.tsx';
import { Btn, Num, START, T } from './ui.tsx';

const native = Platform.OS !== 'web';
const SEEN = 'yallawell:flameSeen';
const HOLD_MS = 900;
const SHIELD = '#2E9BFF';
const COLORS = { on: ['#FFD60A', '#FF8A3D', '#FF3D3D'], off: ['#D9D9D9', '#8A8A8A', '#4A4A4A'] } as const;

/** 1 يوم, 2 يومين, 3 to 10 أيام, 11 and up يوم. */
export const dayWord = (n: number) => L(n === 1 ? 'يوم' : n === 2 ? 'يومين' : n >= 3 && n <= 10 ? 'أيام' : 'يوم', n === 1 ? 'day' : 'days');

function Fire({ width, on }: { width: number; on: boolean }) {
  const k = on ? 'on' : 'off';
  const [a, b, cc] = COLORS[k];
  return (
    <Svg width={width} height={(width * 170) / 150} viewBox="0 0 150 170">
      <Defs>
        <LinearGradient id={`fo-${k}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={a} /><Stop offset="0.55" stopColor={b} /><Stop offset="1" stopColor={cc} />
        </LinearGradient>
        <LinearGradient id={`fi-${k}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" /><Stop offset="1" stopColor={a} />
        </LinearGradient>
      </Defs>
      <Path d="M75 6c5 22-12 34-23 48C41 68 30 84 30 106a45 45 0 0 0 90 0c0-18-8-33-18-43-2 11-8 19-17 22 5-30-2-58-10-79z" fill={`url(#fo-${k})`} />
      <Path d="M75 151a24 24 0 0 1-24-24c0-13 10-21 16-29 2 8 7 12 13 14 2-7 5-11 8-14 7 8 11 16 11 29a24 24 0 0 1-24 24z" fill={`url(#fi-${k})`} />
    </Svg>
  );
}

export function FlameCard({ profile, logs, update, g }: {
  profile: Profile; logs: Record<string, DayLog | null | undefined>; update: (fn: (d: DayLog) => DayLog) => void; g: Gender;
}) {
  const c = useColors();
  const now = new Date();
  const f = flame(profile, logs, now);
  const ready = f.todayOk && !f.lit;
  const burning = f.lit || (f.n > 0 && !ready);
  const [cal, setCal] = useState(false);
  const [event, setEvent] = useState<FlameEvent | null>(null);
  const flick = useRef(new Animated.Value(0)).current;
  const hold = useRef(new Animated.Value(0)).current;
  const pop = useRef(new Animated.Value(1)).current;
  const holding = useRef<Animated.CompositeAnimation | null>(null);
  // The finger lifting after the flame lights is not a tap on the card.
  const justLit = useRef(false);

  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(flick, { toValue: 1, duration: ready ? 700 : 900, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
      Animated.timing(flick, { toValue: 0, duration: ready ? 700 : 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: native }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [ready, flick]);

  // A shield earned, a shield used or a streak lost since yesterday shows once, after the new-day flame.
  const evKey = f.events.map((e) => `${e.key}:${e.kind}`).join(',');
  useEffect(() => {
    const y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const fresh = f.events.filter((e) => e.key >= dayKey(y));
    if (!fresh.length) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(SEEN).then((raw) => {
      const seen: string[] = raw ? JSON.parse(raw) : [];
      const id = (e: FlameEvent) => `${e.key}:${e.kind}`;
      const next = [...fresh].reverse().find((e) => !seen.includes(id(e)));
      if (!next) return;
      AsyncStorage.setItem(SEEN, JSON.stringify([...seen, ...fresh.map(id)].slice(-20))).catch(() => {});
      t = setTimeout(() => {
        setEvent(next);
        play(next.kind === 'lost' ? 'warn' : next.kind === 'earn' ? 'win' : 'swoosh');
      }, next.key === dayKey(now) ? 900 : 3600);
    }).catch(() => {});
    return () => { if (t) clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evKey]);

  const startHold = () => {
    if (!ready) return;
    holding.current = Animated.timing(hold, { toValue: 1, duration: HOLD_MS, easing: Easing.linear, useNativeDriver: false });
    holding.current.start(({ finished }) => {
      if (!finished) return;
      justLit.current = true;
      setTimeout(() => { justLit.current = false; }, 1500);
      update((d) => ({ ...d, lit: true }));
      play('win');
      pop.setValue(0.6);
      Animated.spring(pop, { toValue: 1, friction: 3, tension: 90, useNativeDriver: native }).start();
      hold.setValue(0);
    });
  };
  const stopHold = () => {
    holding.current?.stop();
    Animated.timing(hold, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const scaleY = flick.interpolate({ inputRange: [0, 1], outputRange: [1, ready ? 1.03 : 1.07] });
  const scaleX = flick.interpolate({ inputRange: [0, 1], outputRange: [1, 0.96] });
  const glow = flick.interpolate({ inputRange: [0, 1], outputRange: ready ? [0.2, 0.55] : [0.35, 0.6] });

  const head = f.n > 0 ? dayWord(f.n) + L(' ورا بعض', ' in a row') : L(g('ابدأ سلسلتك', 'ابدئي سلسلتك'), 'Start your streak');
  const sub = ready
    ? L(g('خلصت السعرات. دوس على الشعلة وسيب صباعك لحد ما تولع.', 'خلصتي السعرات. دوسي على الشعلة وسيبي صباعك لحد ما تولع.'), 'Calories done. Press and hold the flame to light it.')
    : f.lit
      ? L(`أيام التزام ورا بعض، ${g('كمل يا بطل', 'كملي يا بطلة')}.`, 'Days in a row on target. Keep going, champ.')
      : f.n > 0
        ? L(`${g('خلص', 'خلصي')} سعرات النهارده ${g('وولع', 'وولعي')} يوم ${f.n + 1}.`, `Hit today's calories to light day ${f.n + 1}.`)
        : L('أول يوم في السعرات بيولع أول شرارة.', 'Your first day on target lights the first spark.');
  const shieldLine = f.shields >= MAX_SHIELDS
    ? L(`${g('معاك', 'معاكي')} درعين، ده الأقصى.`, 'Two shields, the most you can hold.')
    : L(`باقي ${f.toShield} ${dayWord(f.toShield)} على الدرع الجاي`, `${f.toShield} ${f.toShield === 1 ? 'day' : 'days'} to your next shield`);

  return (
    <>
      <Pressable onPress={() => setCal(true)} accessibilityRole="button" accessibilityLabel={L('تاريخ الشعلة', 'Flame history')}
        style={{ borderWidth: 1, borderColor: ready ? '#FF8A3D' : c.surface, backgroundColor: c.surface, borderRadius: 20, padding: 16, overflow: 'hidden' }}>
        {burning || ready ? (
          <Animated.View pointerEvents="none" style={{ position: 'absolute', top: -60, [isEn() || native ? 'left' : 'right']: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: '#FF8A3D', opacity: Animated.multiply(glow, 0.22) }} />
        ) : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Pressable onPressIn={startHold} onPressOut={stopHold} onPress={() => { if (justLit.current) justLit.current = false; else if (!ready) setCal(true); }}
            accessibilityRole="button" accessibilityLabel={ready ? L(g('دوس مطولا علشان الشعلة تولع', 'دوسي مطولا علشان الشعلة تولع'), 'Press and hold to light the flame') : L('تاريخ الشعلة', 'Flame history')}
            style={{ width: 84, alignItems: 'center' }}>
            <Animated.View style={{ transform: [{ scale: pop }, { translateY: 18 }, { scaleY }, { scaleX }, { translateY: -18 }], opacity: ready ? 0.9 : 1 }}>
              <Fire width={72} on={burning} />
            </Animated.View>
            {ready ? (
              <View style={{ marginTop: 8, width: 72, height: 6, borderRadius: 999, backgroundColor: c.line, overflow: 'hidden' }}>
                <Animated.View style={{ height: 6, borderRadius: 999, backgroundColor: '#FF8A3D', width: hold.interpolate({ inputRange: [0, 1], outputRange: [0, 72] }) }} />
              </View>
            ) : null}
          </Pressable>
          <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
              {f.n > 0 ? <Num size={48} weight="black" color={burning ? '#FF8A3D' : c.ink}>{String(f.n)}</Num> : null}
              <T kind="h2" style={{ flexShrink: 1 }}>{head}</T>
            </View>
            <T kind="small" color={ready ? c.ink : c.muted}>{sub}</T>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
              {Array.from({ length: MAX_SHIELDS }, (_, i) => <ShieldIcon key={i} size={18} color={SHIELD} on={i < f.shields} />)}
              <T kind="label" style={{ flexShrink: 1 }}>{shieldLine}</T>
            </View>
          </View>
        </View>
      </Pressable>
      <FlameCalendar g={g} open={cal} onClose={() => setCal(false)} marks={f.marks} best={f.best} n={f.n} shields={f.shields} start={profile.start} />
      <FlameEventSheet event={event} g={g} onClose={() => setEvent(null)} />
    </>
  );
}

const WEEK_AR = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];
const WEEK_EN = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

function FlameCalendar({ g, open, onClose, marks, best, n, shields, start }: {
  g: Gender; open: boolean; onClose: () => void; marks: Record<string, FlameMark>; best: number; n: number; shields: number; start?: string;
}) {
  const c = useColors();
  const [back, setBack] = useState(0);
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth() - back, 1);
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const lead = weekIndex(first);
  const todayKey = dayKey(now);
  const canBack = !!start && dayKey(first) > start;
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const okN = Object.entries(marks).filter(([k, m]) => m === 'ok' && k.startsWith(dayKey(first).slice(0, 7))).length;
  const title = first.toLocaleDateString(L('ar-EG', 'en-GB'), { month: 'long', year: 'numeric' });
  const arrow = (dir: -1 | 1, on: boolean) => (
    <Pressable disabled={!on} onPress={() => setBack((b) => b - dir)} hitSlop={10} accessibilityRole="button"
      accessibilityLabel={dir < 0 ? L('الشهر اللي فات', 'Previous month') : L('الشهر الجاي', 'Next month')} style={{ opacity: on ? 1 : 0.25, padding: 6 }}>
      <Svg width={18} height={18} viewBox="0 0 24 24">
        <Path d={(dir < 0) === (isEn() || native) ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} stroke={c.ink} strokeWidth={2.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 18 }}>
        <Pressable onPress={() => {}} style={{ backgroundColor: c.surface, borderColor: c.line, borderWidth: 1, borderRadius: 16, padding: 16, gap: 12, maxWidth: 440, width: '100%', alignSelf: 'center' }}>
          <T kind="h2">{L('تاريخ الشعلة', 'Flame history')}</T>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[[String(n), L('دلوقتي', 'now')], [String(best), L('أطول سلسلة', 'longest')], [String(okN), L('يوم الشهر ده', 'days this month')]].map(([v, l]) => (
              <View key={l} style={{ flex: 1, borderWidth: 1, borderColor: c.line, borderRadius: 12, paddingVertical: 8, alignItems: 'center' }}>
                <Num size={26} weight="black" color="#FF8A3D">{v}</Num>
                <T kind="label" style={{ textAlign: 'center', fontSize: 11.5 }}>{l}</T>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            {arrow(-1, canBack)}
            <T kind="h3">{title}</T>
            {arrow(1, back > 0)}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {(isEn() ? WEEK_EN : WEEK_AR).map((w) => (
              <View key={w} style={{ width: `${100 / 7}%`, alignItems: 'center', paddingBottom: 4 }}><T kind="label" style={{ textAlign: 'center' }}>{w}</T></View>
            ))}
            {cells.map((d, i) => {
              if (!d) return <View key={i} style={{ width: `${100 / 7}%`, height: 42 }} />;
              const key = dayKey(new Date(first.getFullYear(), first.getMonth(), d));
              const m = marks[key];
              const isToday = key === todayKey;
              return (
                <View key={i} style={{ width: `${100 / 7}%`, height: 42, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center',
                    borderWidth: isToday ? 1.5 : 0, borderColor: c.ink, backgroundColor: m === 'ok' ? '#FF8A3D22' : 'transparent' }}>
                    {m === 'ok' ? <FlameIcon size={20} /> : m === 'shield' ? <ShieldIcon size={18} color={SHIELD} /> : (
                      <Text style={{ fontFamily: fonts.numSemi, fontSize: 15, color: key > todayKey ? c.dim : m === 'miss' ? c.dim : c.muted }}>{d}</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><FlameIcon size={16} /><T kind="label">{L('يوم في السعرات', 'On target')}</T></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><ShieldIcon size={14} color={SHIELD} /><T kind="label">{L('الدرع حماه', 'Shield used')}</T></View>
          </View>
          <T kind="small" style={{ textAlign: START() }}>
            {L(`كل ٧ أيام ورا بعض ${g('بتكسب', 'بتكسبي')} درع (أقصى حاجة ٢). لو يوم فات من غير ما السعرات تكمل، الدرع بيحمي السلسلة. ${g('معاك', 'معاكي')} دلوقتي ${shields === 0 ? 'صفر' : shields === 1 ? 'درع واحد' : 'درعين'}.`,
              `Every 7 days in a row earns a shield (2 at most). If a day misses the target, a shield keeps the streak alive. You have ${shields} now.`)}
          </T>
          <Btn kind="outline" title={L('قفل', 'Close')} onPress={onClose} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function FlameEventSheet({ event, g, onClose }: { event: FlameEvent | null; g: Gender; onClose: () => void }) {
  const c = useColors();
  if (!event) return null;
  const n = event.n;
  const run = `${n} ${dayWord(n)}`;
  const [head, body, btn] = event.kind === 'earn'
    ? [g('كسبت درع', 'كسبتي درع'), L(`${run} ورا بعض. لو يوم فات منك، الدرع هيحمي الشعلة.`, `${n} days in a row. If you miss a day, the shield keeps your flame alive.`), L('تمام', 'Nice')]
    : event.kind === 'save'
      ? [L('الدرع حمى الشعلة', 'Your shield saved the flame'), L(`يوم فات من غير ما السعرات تكمل، بس سلسلة الـ${run} لسه موجودة.`, `A day missed the target, but your ${n}-day streak is still alive.`), g('كمل', 'كملي')]
      : [L('الشعلة طفت', 'The flame went out'), L(`سلسلة الـ${run} وقفت ومكانش فيه درع. ${g('ابدأ', 'ابدئي')} من جديد النهارده.`, `Your ${n}-day streak ended with no shield left. Start again today.`), L('يلا', "Let's go")];
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable onPress={onClose} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 14 }}>
        {event.kind === 'lost' ? <Fire width={96} on={false} /> : <ShieldIcon size={104} color={SHIELD} />}
        <Text style={{ fontFamily: fonts.display, fontSize: 30, lineHeight: 44, color: '#FFFFFF', textAlign: 'center' }}>{head}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 15, lineHeight: 24, color: '#FFFFFF', opacity: 0.85, textAlign: 'center', maxWidth: 320 }}>{body}</Text>
        <View style={{ marginTop: 6, paddingHorizontal: 22, paddingVertical: 9, borderRadius: 99, backgroundColor: c.petrol }}>
          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 15, color: c.onPetrol }}>{btn}</Text>
        </View>
      </Pressable>
    </Modal>
  );
}
