// Avatar builder: pick skin, body type, hair, makeup and clothes; log weight and watch the body change.
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarView } from '../components/Avatar.tsx';
import { Bg, Btn, Card, Chip, START, T, lift, styles } from '../components/ui.tsx';
import {
  BODIES, BOTTOMS, CLOTHES, EYE_COLORS, HAIRS_F, HAIRS_M, HAIR_COLORS, LIPS, SHADOWS, SKINS, TOPS,
  avatarOf, bmi, logWeight, weightChange, type Avatar,
} from '../lib/avatar.ts';
import { L, num } from '../lib/i18n.ts';
import { genderFor } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const BODY_N = { hourglass: ['ساعة رملية', 'Hourglass'], pear: ['كمثرى', 'Pear'], apple: ['تفاحة', 'Apple'], straight: ['مستقيم', 'Straight'], athletic: ['رياضي', 'Athletic'] } as const;
const HAIR_N = {
  long: ['طويل ناعم', 'Long'], wavy: ['طويل مموج', 'Wavy'], pony: ['ديل حصان', 'Ponytail'], bun: ['كعكة', 'Bun'], curly: ['كيرلي', 'Curly'],
  bob: ['بوب', 'Bob'], short: ['قصير', 'Short'], hijab: ['حجاب', 'Hijab'], bald: ['صلعة', 'Bald'],
} as const;
const TOP_N = { bra: ['سبورت برا', 'Sports bra'], tank: ['تانك توب', 'Tank top'], tee: ['تيشيرت', 'T-shirt'], long: ['كم طويل', 'Long sleeve'], hoodie: ['هودي', 'Hoodie'] } as const;
const BOT_N = { leggings: ['ليجن', 'Leggings'], shorts: ['شورت', 'Shorts'], joggers: ['سويت بانتس', 'Joggers'], skirt: ['جيبة', 'Skirt'] } as const;
type Tab = 'body' | 'face' | 'hair' | 'clothes';

function Swatches({ colors, value, onPick, label }: { colors: string[]; value: string; onPick: (c: string) => void; label: string }) {
  const c = useColors();
  return (
    <View style={{ gap: 6 }}>
      <T kind="label">{label}</T>
      <View style={styles.wrap}>
        {colors.map((col) => {
          const on = col === value;
          return (
            <Pressable key={col || 'none'} onPress={() => { play('tap'); onPick(col); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
              accessibilityLabel={col || L('من غير', 'None')}
              style={[{ width: 36, height: 36, borderRadius: 18, borderWidth: on ? 3 : 1, borderColor: on ? c.petrol : c.line, backgroundColor: col || c.surface, alignItems: 'center', justifyContent: 'center' }, lift(c, on ? 'glow' : 'sm')]}>
              {col ? null : <Text style={{ color: c.muted, fontSize: 16 }}>⊘</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Options<K extends string>({ keys, names, value, onPick, label }: { keys: readonly K[]; names: Record<K, readonly [string, string]>; value: K; onPick: (k: K) => void; label: string }) {
  return (
    <View style={{ gap: 6 }}>
      <T kind="label">{label}</T>
      <View style={styles.wrap}>{keys.map((k) => <Chip key={k} label={L(names[k][0], names[k][1])} on={k === value} onPress={() => onPick(k)} />)}</View>
    </View>
  );
}

export default function AvatarScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  const [tab, setTab] = useState<Tab>('body');
  const [kg, setKg] = useState('');
  const [msg, setMsg] = useState('');
  if (!profile) return null;
  const p = profile;
  const g = genderFor(p.sex);
  const a = avatarOf(p);
  const set = (patch: Partial<Avatar>) => saveProfile({ ...p, avatar: { ...a, ...patch } });
  const ch = weightChange(p);
  const startBmi = bmi(ch.start, p.height), nowBmi = bmi(p.weight, p.height);

  const save = () => {
    const v = +kg.replace(',', '.').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    if (!(v >= 30 && v <= 250)) { setMsg(L(`${g('اكتب', 'اكتبي')} الوزن بالكيلو، مثلًا 68.5`, 'Enter your weight in kg, e.g. 68.5')); return; }
    const before = p.weight;
    saveProfile(logWeight(p, v));
    setKg('');
    const d = Math.round((v - before) * 10) / 10;
    play(d < 0 ? 'win' : 'check');
    setMsg(d < 0 ? L(`برافو! ${g('نزلت', 'نزلتي')} ${num(-d)} كجم، بص${g('', 'ي')} الأفاتار اتغير ✨`, `Well done! Down ${-d} kg, look how your avatar changed ✨`)
      : d > 0 ? L(`اتسجل. زيادة ${num(d)} كجم، عادي يحصل تذبذب، كمل${g('', 'ي')} 💪`, `Saved. Up ${d} kg; ups and downs are normal, keep going 💪`)
      : L('اتسجل، نفس الوزن.', 'Saved, same weight.'));
  };

  const female = p.sex === 'f';
  const tabs: [Tab, string][] = [['body', L('الجسم', 'Body')], ['face', L(female ? 'الوش والميكب' : 'الوش', female ? 'Face & makeup' : 'Face')], ['hair', L('الشعر', 'Hair')], ['clothes', L('اللبس', 'Clothes')]];

  return (
    <Bg>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={styles.rowBetween}>
          <T kind="h1">{L('شخصيتك', 'Your avatar')}</T>
          <Btn kind="text" title={L('رجوع', 'Back')} onPress={() => router.back()} />
        </View>

        <Card style={{ alignItems: 'center' }}>
          <View style={[styles.row, { justifyContent: 'center', gap: 4, alignSelf: 'stretch' }]}>
            {ch.diff !== 0 ? (
              <View style={{ alignItems: 'center', opacity: 0.55, marginEnd: 18 }}>
                <AvatarView id="start" a={a} bmi={startBmi} sex={p.sex} size={250} />
                <T kind="label" style={{ textAlign: 'center' }}>{L(`البداية: ${num(ch.start)} كجم`, `Start: ${ch.start} kg`)}</T>
              </View>
            ) : null}
            <View style={{ alignItems: 'center' }}>
              <AvatarView id="now" a={a} bmi={nowBmi} sex={p.sex} size={ch.diff !== 0 ? 250 : 300} />
              <T kind="h3" style={{ textAlign: 'center' }}>{L(`دلوقتي: ${num(p.weight)} كجم`, `Now: ${p.weight} kg`)}</T>
            </View>
          </View>
          {ch.diff < 0 ? <T kind="small" color={c.ok} style={{ textAlign: 'center' }}>{L(`${g('نزلت', 'نزلتي')} ${num(-ch.diff)} كجم من أول ما ${g('بدأت', 'بدأتي')} 🎉`, `${-ch.diff} kg down since you started 🎉`)}</T> : null}
        </Card>

        <Card>
          <T kind="h2">{L(g('سجّل وزنك', 'سجّلي وزنك'), 'Log your weight')}</T>
          <T kind="small">{L(`كل ما ${g('تسجل', 'تسجلي')} وزن جديد، جسم الأفاتار بيتغير معاه. الأحسن ${g('توزن', 'توزني')} مرة في الأسبوع الصبح على الريق.`, 'Each new weight reshapes your avatar. Best once a week, in the morning before eating.')}</T>
          <View style={[styles.row, { gap: 10 }]}>
            <TextInput value={kg} onChangeText={(v) => { setKg(v); setMsg(''); }} keyboardType="decimal-pad" placeholder={L(`مثلًا ${p.weight}`, `e.g. ${p.weight}`)} placeholderTextColor={c.muted}
              accessibilityLabel={L('الوزن بالكيلو', 'Weight in kg')}
              style={{ flex: 1, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 16, color: c.ink, textAlign: START() }} />
            <Btn title={L('سجّل', 'Save')} onPress={save} style={{ paddingHorizontal: 24 }} />
          </View>
          {msg ? <T kind="small" color={c.ink}>{msg}</T> : null}
        </Card>

        <View style={[styles.row, { gap: 6 }]}>
          {tabs.map(([k, l]) => (
            <Pressable key={k} onPress={() => { play('tap'); setTab(k); }} accessibilityRole="tab" accessibilityState={{ selected: tab === k }}
              style={[{ flex: 1, paddingVertical: 9, borderRadius: 12, alignItems: 'center', backgroundColor: tab === k ? c.petrol : c.surface, borderWidth: 1, borderColor: tab === k ? c.petrol : c.line }, lift(c, tab === k ? 'glow' : 'sm')]}>
              <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 12.5, color: tab === k ? c.onPetrol : c.ink }}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <Card style={{ gap: 16 }}>
          {tab === 'body' ? (
            <>
              <Swatches label={L('لون البشرة', 'Skin tone')} colors={SKINS} value={a.skin} onPick={(skin) => set({ skin })} />
              <Options label={L('شكل الجسم', 'Body type')} keys={BODIES} names={BODY_N} value={a.body} onPick={(body) => set({ body })} />
              <T kind="small">{L('الطول والوزن بيتحسبوا من بياناتك، وشكل الجسم بيحدد الوزن بيتوزع فين.', 'Height and weight come from your details; body type decides where the weight sits.')}</T>
            </>
          ) : tab === 'face' ? (
            <>
              <Swatches label={L('لون العين', 'Eye colour')} colors={EYE_COLORS} value={a.eyes} onPick={(eyes) => set({ eyes })} />
              <Swatches label={L('روج', 'Lipstick')} colors={LIPS} value={a.lips} onPick={(lips) => set({ lips })} />
              <Swatches label={L('ظل العين', 'Eyeshadow')} colors={SHADOWS} value={a.shadow} onPick={(shadow) => set({ shadow })} />
              <View style={styles.wrap}>
                <Chip label={L('بلاشر', 'Blush')} on={a.blush} onPress={() => set({ blush: !a.blush })} />
                <Chip label={L('آيلاينر', 'Eyeliner')} on={a.liner} onPress={() => set({ liner: !a.liner })} />
                <Chip label={L('دقن', 'Beard')} on={a.beard} onPress={() => set({ beard: !a.beard })} />
              </View>
            </>
          ) : tab === 'hair' ? (
            <>
              <Options label={L('التسريحة', 'Style')} keys={female ? HAIRS_F : HAIRS_M} names={HAIR_N} value={a.hair} onPick={(hair) => set({ hair })} />
              <Swatches label={a.hair === 'hijab' ? L('لون الحجاب', 'Hijab colour') : L('لون الشعر', 'Hair colour')}
                colors={a.hair === 'hijab' ? [...CLOTHES, ...HAIR_COLORS.slice(0, 4)] : HAIR_COLORS} value={a.hairColor} onPick={(hairColor) => set({ hairColor })} />
            </>
          ) : (
            <>
              <Options label={L('فوق', 'Top')} keys={TOPS} names={TOP_N} value={a.top} onPick={(top) => set({ top })} />
              <Swatches label={L('لونه', 'Colour')} colors={CLOTHES} value={a.topColor} onPick={(topColor) => set({ topColor })} />
              <Options label={L('تحت', 'Bottom')} keys={BOTTOMS} names={BOT_N} value={a.bottom} onPick={(bottom) => set({ bottom })} />
              <Swatches label={L('لونه', 'Colour')} colors={CLOTHES} value={a.bottomColor} onPick={(bottomColor) => set({ bottomColor })} />
              <Swatches label={L('الكوتشي', 'Trainers')} colors={CLOTHES} value={a.shoes} onPick={(shoes) => set({ shoes })} />
            </>
          )}
        </Card>
      </ScrollView>
    </Bg>
  );
}
