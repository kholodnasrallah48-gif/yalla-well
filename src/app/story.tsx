// The week as a story picture to post on Instagram, WhatsApp or anywhere: the captain, the calorie streak, the
// week's scoreboard and the days on target, in the app's look. Shared through the phone's share sheet.
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BigFlame } from '../components/DailyFire.tsx';
import { Head, Mascot } from '../components/Mascot.tsx';
import { Bg, Btn, Card, Chip, Segmented, START, T, styles } from '../components/ui.tsx';
import { weightOn } from '../lib/body.ts';
import { dayKey, type DayLog } from '../lib/day.ts';
import { L, isEn } from '../lib/i18n.ts';
import { genderFor, type Profile } from '../lib/plan.ts';
import { shortDate, weekKeys, weekStart } from '../lib/report.ts';
import { shareView } from '../lib/shareImage.ts';
import { weekStory, type WeekStory } from '../lib/story.ts';
import { streaks } from '../lib/streaks.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const GREEN = '#19E68C', INK = '#F3F4F5', MUTED = '#9CA2A8', LINE = '#2A2E33', FAINT = '#121417';
const DAYS_AR = ['س', 'ح', 'ن', 'ث', 'ر', 'خ', 'ج'];
const DAYS_EN = ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr'];

type Show = { weight: boolean; points: boolean };

function StoryCard({ w, p, s, streak, from, to, show, kg }: {
  w: number; p: Profile; s: WeekStory; streak: number; from: Date; to: Date; show: Show; kg: number | null;
}) {
  const u = w / 360;
  const dir = isEn() ? 'ltr' : 'rtl';
  const align = START();
  const row = 'row' as const;
  const txt = (size: number, family: string, color = INK, extra: object = {}) =>
    ({ fontFamily: family, fontSize: size * u, lineHeight: size * u * 1.35, color, writingDirection: dir, textAlign: align, ...extra }) as const;
  const tiles: [string, string][] = [
    [`${s.kcalDays}/${s.past || 7}`, L('أيام في هدف السعرات', 'days on calorie target')],
    [s.workouts.of ? `${s.workouts.done}/${s.workouts.of}` : '0', L('تمارين خلصت', 'workouts done')],
    [`${s.waterDays}`, L('أيام المية كاملة', 'days with full water')],
    show.points ? [`${s.points}`, L('نقطة الأسبوع ده', 'points this week')] : [`${streak}`, L('يوم ورا بعض', 'day streak')],
  ];
  return (
    <LinearGradient colors={['#0F1A15', '#050706', '#000000']} locations={[0, 0.45, 1]} style={{ width: w, height: (w * 16) / 9, paddingHorizontal: 22 * u, paddingTop: 26 * u, paddingBottom: 20 * u, overflow: 'hidden' }}>
      <Svg width={w} height={w} style={{ position: 'absolute', top: -w * 0.35, left: -w * 0.25 }}>
        <Defs><RadialGradient id="storyglow" cx="50%" cy="50%" r="50%"><Stop offset="0" stopColor={GREEN} stopOpacity={0.13} /><Stop offset="1" stopColor={GREEN} stopOpacity={0} /></RadialGradient></Defs>
        <Rect width={w} height={w} fill="url(#storyglow)" />
      </Svg>
      <View style={{ flexDirection: row, justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={txt(26, fonts.brand, INK, { lineHeight: 34 * u })}>{L('يلا ', 'Yalla ')}<Text style={{ color: GREEN }}>{L('ويل', 'Well')}</Text></Text>
        <Text style={txt(11, fonts.bodyMedium, MUTED)}>{shortDate(from)} – {shortDate(to)}</Text>
      </View>

      <Text style={[txt(12, fonts.bodyMedium, GREEN), { marginTop: 14 * u, letterSpacing: isEn() ? 2 * u : 0 }]}>{L('أسبوعي', 'MY WEEK')}</Text>
      <Text style={txt(34, fonts.display, INK, { lineHeight: 46 * u })}>{s.headline}</Text>
      <Text style={txt(13, fonts.body, MUTED)}>{s.line}</Text>

      <View style={{ height: 160 * u, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ position: 'absolute', zIndex: 0, fontFamily: fonts.num, fontSize: 170 * u, lineHeight: 176 * u, color: FAINT, includeFontPadding: false }}>{streak}</Text>
        <View style={{ zIndex: 1 }}><Mascot pose="cheer" size={140 * u} color={INK} head={GREEN} animate={false} excited /></View>
      </View>

      <View style={{ flexDirection: row, alignItems: 'center', gap: 12 * u, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, paddingVertical: 8 * u }}>
        <BigFlame width={34 * u} />
        <Text style={{ fontFamily: fonts.num, fontSize: 52 * u, lineHeight: 54 * u, color: GREEN, includeFontPadding: false }}>{streak}</Text>
        <View style={{ flex: 1 }}>
          <Text style={txt(18, fonts.display)}>{L(streak === 1 || streak > 10 ? 'يوم ورا بعض' : 'أيام ورا بعض', streak === 1 ? 'day in a row' : 'days in a row')}</Text>
          <Text style={txt(11, fonts.body, MUTED)}>{L('في هدف السعرات', 'on my calorie target')}</Text>
        </View>
      </View>

      <View style={{ flexDirection: row, flexWrap: 'wrap', marginTop: 4 * u }}>
        {tiles.map(([v, label], i) => (
          <View key={i} style={{ width: '50%', paddingVertical: 7 * u, borderBottomWidth: i < 2 ? 1 : 0, borderColor: LINE }}>
            <Text style={{ fontFamily: fonts.num, fontSize: 30 * u, lineHeight: 33 * u, color: INK, textAlign: align, includeFontPadding: false }}>{v}</Text>
            <Text style={txt(11, fonts.bodyMedium, MUTED)}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={{ flexDirection: row, justifyContent: 'space-between', marginTop: 10 * u }}>
        {s.days.map((d, i) => (
          <View key={d.key} style={{ alignItems: 'center', gap: 5 * u, opacity: d.future ? 0.35 : 1 }}>
            <Head on={d.kcalOk} size={20 * u} color={GREEN} ring={LINE} />
            <View style={{ width: 16 * u, height: 3 * u, borderRadius: 2 * u, backgroundColor: d.workoutOk ? GREEN : d.workoutOk === false ? LINE : 'transparent' }} />
            <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 11 * u, color: MUTED }}>{(isEn() ? DAYS_EN : DAYS_AR)[i]}</Text>
          </View>
        ))}
      </View>

      {show.weight && kg ? (
        <Text style={[txt(14, fonts.bodyMedium, INK), { marginTop: 10 * u }]}>
          {L('الوزن الأسبوع ده: ', 'Weight this week: ')}
          <Text style={{ fontFamily: fonts.numSemi, color: kg < 0 ? GREEN : INK }}>{kg > 0 ? '+' : ''}{kg.toFixed(1)}</Text>{L(' كجم', ' kg')}
        </Text>
      ) : null}

      <View style={{ flex: 1 }} />
      <Text style={[txt(11, fonts.bodyMedium, MUTED), { textAlign: 'center' }]}>{L('متسجل في تطبيق يلا ويل', 'Tracked with the Yalla Well app')}</Text>
    </LinearGradient>
  );
}

export default function Story() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { profile, readDay, day, today, history } = useStore();
  const [offset, setOffset] = useState<'0' | '1'>('0');
  const [show, setShow] = useState<Show>({ weight: false, points: true });
  const [logs, setLogs] = useState<Record<string, DayLog | null> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; bad?: boolean } | null>(null);
  const ref = useRef<View>(null);
  const start = useMemo(() => weekStart(new Date(), Number(offset)), [offset]);
  useEffect(() => {
    let live = true;
    setLogs(null);
    const keys = weekKeys(start).map(dayKey);
    Promise.all(keys.map(readDay)).then((xs) => { if (live) setLogs(Object.fromEntries(keys.map((k, i) => [k, xs[i]]))); });
    return () => { live = false; };
  }, [start, day]);
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const end = weekKeys(start)[6];
  const now = new Date();
  // The streak on the story is the one at the end of that week (today for this week).
  const until = end < now ? end : now;
  const st = streaks(profile, { ...history, ...(logs ?? {}), [today]: day } as Record<string, DayLog>, until);
  const s = logs ? weekStory(profile, start, { ...logs, [today]: day }, now) : null;
  const before = new Date(start); before.setDate(before.getDate() - 1);
  const kg = Math.round((weightOn(profile, dayKey(until)) - weightOn(profile, dayKey(before))) * 10) / 10;
  const w = Math.min(width - 32, 360);

  const share = async () => {
    setBusy(true); setMsg(null); play('tap');
    try {
      const r = await shareView(ref, { width: 1080, height: 1920 }, `yalla-well-${dayKey(start)}`, L('أسبوعي في يلا ويل', 'My week on Yalla Well'));
      if (r === 'downloaded') setMsg({ text: L(`الصورة نزلت. ${g('افتحها', 'افتحيها')} من التنزيلات و${g('نزلها', 'نزليها')} ستوري.`, 'The picture was downloaded. Open it from your downloads and post it as a story.') });
    } catch {
      setMsg({ text: L(`معرفناش نعمل الصورة. ${g('جرب', 'جربي')} تاني.`, "Couldn't make the picture. Try again."), bad: true });
    }
    setBusy(false);
  };

  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('ستوري الأسبوع', 'Week story')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>
      <Segmented items={[['0', L('الأسبوع ده', 'This week')], ['1', L('الأسبوع اللي فات', 'Last week')]]} value={offset} onChange={setOffset} />
      <View style={[styles.row, { gap: 8, flexWrap: 'wrap' }]}>
        <Chip label={L('النقط', 'Points')} on={show.points} onPress={() => setShow({ ...show, points: !show.points })} />
        <Chip label={L('الوزن', 'Weight')} on={show.weight} onPress={() => setShow({ ...show, weight: !show.weight })} />
      </View>
      <View style={{ alignItems: 'center' }}>
        {s ? (
          <View ref={ref} collapsable={false} style={{ overflow: 'hidden' }}>
            <StoryCard w={w} p={profile} s={s} streak={st.kcal} from={start} to={end} show={show} kg={kg} />
          </View>
        ) : <View style={{ height: (w * 16) / 9, justifyContent: 'center' }}><ActivityIndicator color={c.petrol} /></View>}
      </View>
      <Card>
        <Btn title={busy ? L('بنجهز الصورة...', 'Making the picture...') : L(g('شارك الستوري', 'شاركي الستوري'), 'Share the story')} onPress={share} disabled={busy || !s} />
        <T kind="small">{L(`من قايمة المشاركة ${g('تقدر', 'تقدري')} ${g('تختار', 'تختاري')} ستوري انستجرام أو واتساب، أو ${g('تحفظ', 'تحفظي')} الصورة.`, 'From the share menu you can pick an Instagram or WhatsApp story, or save the picture.')}</T>
        {msg ? <T kind="small" color={msg.bad ? c.bad : c.ok}>{msg.text}</T> : null}
      </Card>
    </ScrollView></Bg>
  );
}
