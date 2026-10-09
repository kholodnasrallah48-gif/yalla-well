// "Add an exercise or machine" on the train page: type a name and pick one of the app's exercises that match, or
// add it in your own words with the machine you use. It's saved to that workout (push, pull...), so it shows up
// every time that day comes around.
import { useMemo, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { EXERCISES, GEAR } from '../lib/data.ts';
import { L, tx } from '../lib/i18n.ts';
import { splitLabel, type Gender, type OwnExercise, type Profile } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Card, RADIUS, START, T, styles } from './ui.tsx';

const norm = (s: string) => s.toLowerCase().replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();

/** App exercises whose Arabic or English name, or machine name, contains every typed word. */
export function matchExercises(q: string, place: 'gym' | 'home', skip: string[], limit = 5): string[] {
  const words = norm(q).split(' ').filter(Boolean);
  if (!words.length) return [];
  const prefix = place === 'gym' ? 'g_' : 'h_';
  return Object.keys(EXERCISES)
    .filter((id) => id.startsWith(prefix) && !skip.includes(id))
    .filter((id) => {
      const hay = norm(`${EXERCISES[id].n} ${tx(EXERCISES[id].n)} ${GEAR[id]?.ar ?? ''} ${GEAR[id]?.en ?? ''}`);
      return words.every((w) => hay.includes(w));
    })
    .slice(0, limit);
}

export function AddExercise({ profile, sid, place, have, g, onSave, onClose }: {
  profile: Profile; sid: string; place: 'gym' | 'home';
  /** Exercise ids already in the day. */
  have: string[];
  g: Gender;
  onSave: (p: Profile) => void; onClose: () => void;
}) {
  const c = useColors();
  const [name, setName] = useState('');
  const [gear, setGear] = useState('');
  const hits = useMemo(() => matchExercises(name, place, have), [name, place, have.join()]);
  const day = splitLabel(sid);
  const input = { borderWidth: 1, borderColor: c.line, borderRadius: RADIUS, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() } as const;

  const save = (o: OwnExercise) => {
    onSave({ ...profile, own: { ...profile.own, [sid]: [...(profile.own?.[sid] ?? []), o] } });
    onClose();
  };

  return (
    <Card style={{ borderColor: c.petrol, gap: 10 }}>
      <View style={styles.rowBetween}>
        <T kind="h2" style={{ flex: 1 }}>{L(`${g('ضيف', 'ضيفي')} تمرين ليوم ${day}`, `Add an exercise to ${day} days`)}</T>
        <Pressable onPress={() => { play('tap'); onClose(); }} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')} hitSlop={10}>
          <Text style={{ fontSize: 24, lineHeight: 26, color: c.muted }}>×</Text>
        </Pressable>
      </View>
      <T kind="small">{L(`هيفضل في قايمتك كل مرة ${g('تلعب', 'تلعبي')} ${day}.`, `It stays on your list every time you do ${day}.`)}</T>
      <View style={{ gap: 4 }}>
        <T kind="label">{L('اسم التمرين أو الجهاز', 'Exercise or machine name')}</T>
        <TextInput value={name} onChangeText={setName} autoFocus placeholder={L('مثلا: هاك سكوات، جهاز صدر هامر، Cable fly', 'e.g. Hack squat, Hammer chest press, cable fly')}
          placeholderTextColor={c.dim} style={input} returnKeyType="done" />
      </View>
      {hits.length ? (
        <View style={{ gap: 0 }}>
          <T kind="label">{L('من تمارين التطبيق (فيها صور وشرح):', "From the app's exercises (with pictures and tips):")}</T>
          {hits.map((id) => (
            <Pressable key={id} onPress={() => { play('add'); save({ id, ref: id }); }} accessibilityRole="button"
              style={({ pressed }) => [styles.row, { gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderColor: c.line }, pressed && { opacity: 0.7 }]}>
              <View style={{ flex: 1 }}>
                <T kind="h3">{tx(EXERCISES[id].n)}</T>
                {GEAR[id] ? <T kind="small">{L(GEAR[id].ar, GEAR[id].en)}</T> : null}
              </View>
              <Text style={{ fontFamily: fonts.displaySemi, fontSize: 20, color: c.petrol }}>+</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {name.trim() ? <>
        <View style={{ gap: 4 }}>
          <T kind="label">{L('الجهاز أو الأداة (اختياري)', 'Machine or equipment (optional)')}</T>
          <TextInput value={gear} onChangeText={setGear} placeholder={L('مثلا: Smith machine، دمبل، كيبل', 'e.g. Smith machine, dumbbells, cable')} placeholderTextColor={c.dim} style={input} />
        </View>
        <Btn title={L(`${g('ضيف', 'ضيفي')} «${name.trim()}»`, `Add “${name.trim()}”`)} sound="add"
          onPress={() => save({ id: `u_${Date.now().toString(36)}`, n: name.trim(), gear: gear.trim() || undefined })} />
      </> : null}
    </Card>
  );
}
