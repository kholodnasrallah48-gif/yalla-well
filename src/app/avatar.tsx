// Avatar builder: pick skin, body type, hair, makeup and clothes; log weight and watch the body change.
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AvatarView } from '../components/Avatar.tsx';
import { Bg, Btn, Card, Chip, START, T, lift, styles } from '../components/ui.tsx';
import {
  BODIES, BOTTOMS, BOTTOMS_M, CLOTHES, EYE_COLORS, FRAMES, HAIRS_F, HAIRS_M, HAIR_COLORS, HIJABS, LIPS, SHADOWS, SKINS, TOPS, TOPS_M,
  avatarOf, bmi, logWeight, weightChange, type Avatar, type Bottom, type HairStyle, type Top,
} from '../lib/avatar.ts';
import type { Crop } from '../lib/avatar-svg.ts';
import { L, num } from '../lib/i18n.ts';
import { genderFor } from '../lib/plan.ts';
import { play } from '../lib/sound.ts';
import { useStore } from '../store/AppStore.tsx';
import { fonts, useColors } from '../theme.ts';

const BODY_N = { hourglass: ['ساعة رملية', 'Hourglass'], pear: ['كمثرى', 'Pear'], apple: ['تفاحة', 'Apple'], straight: ['مستقيم', 'Straight'], athletic: ['رياضي', 'Athletic'] } as const;
// Names are only read out by screen readers; the tiles show the look itself.
const HAIR_N: Record<HairStyle, string> = { long: 'Long', wavy: 'Wavy', pony: 'Ponytail', bun: 'Bun', curly: 'Curly', bob: 'Bob', short: 'Short', braid: 'Braid', hijab: 'Hijab', quiff: 'Quiff', buzz: 'Buzz cut', bald: 'Bald' };
const TOP_N: Record<Top, string> = { bra: 'Sports bra', tank: 'Tank top', crop: 'Crop top', tee: 'T-shirt', oversized: 'Oversized tee', long: 'Long sleeve', hoodie: 'Hoodie', jacket: 'Zip jacket', tunic: 'Long tunic' };
const BOT_N: Record<Bottom, string> = { leggings: 'Leggings', biker: 'Biker shorts', shorts: 'Shorts', joggers: 'Joggers', wide: 'Wide trousers', skirt: 'Skirt', maxi: 'Long skirt' };
const names = <K extends string>(ks: readonly K[]) => Object.fromEntries(ks.map((k) => [k, k])) as unknown as Record<K, string>;
const FACES = ['oval', 'round', 'heart', 'square', 'long'] as const;
const BROWS = ['natural', 'thin', 'thick', 'arched', 'straight'] as const;
const EYES = ['almond', 'round', 'hooded', 'upturned', 'downturned'] as const;
const NOSES = ['small', 'button', 'straight', 'wide', 'pointed'] as const;
const MOUTHS = ['natural', 'full', 'thin', 'wide', 'heart'] as const;
const EARS = ['small', 'normal', 'big'] as const;
const RINGS = ['none', 'studs', 'hoops', 'drops'] as const;
const FACIAL = ['none', 'stubble', 'full', 'goatee', 'mustache'] as const;
const GLASSES = ['none', 'round', 'square', 'cateye', 'sport', 'sun'] as const;
const HATS = ['none', 'cap', 'beanie', 'headband', 'bucket'] as const;

type Cat = 'skin' | 'hair' | 'brows' | 'eyes' | 'head' | 'nose' | 'mouth' | 'ears' | 'facial' | 'makeup' | 'glasses' | 'hat' | 'outfit' | 'body';

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

/** Picture tiles: each one shows the avatar wearing that option. */
function Tiles<K extends string>({ keys, value, onPick, label, render, names, cols = 3 }: {
  keys: readonly K[]; value: K; onPick: (k: K) => void; label: string; render: (k: K) => ReactNode; names: Record<K, string>; cols?: number;
}) {
  const c = useColors();
  return (
    <View style={{ gap: 8 }}>
      <T kind="label">{label}</T>
      <View style={[styles.wrap, { gap: 8 }]}>
        {keys.map((k) => {
          const on = k === value;
          return (
            <Pressable key={k} onPress={() => { play('tap'); onPick(k); }} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={names[k]}
              style={({ pressed }) => [{ width: `${100 / cols - 3}%`, aspectRatio: 1, borderRadius: 16, borderWidth: on ? 2.5 : 1, borderColor: on ? c.petrol : c.line, backgroundColor: on ? c.soft : c.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, lift(c, on ? 'glow' : 'sm'), pressed && styles.pressed]}>
              {render(k)}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function Toggle({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return <Chip label={label} on={on} onPress={onPress} />;
}

export default function AvatarScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, saveProfile } = useStore();
  const [cat, setCat] = useState<Cat>('skin');
  const [whole, setWhole] = useState(false);
  const [kg, setKg] = useState('');
  const [msg, setMsg] = useState('');
  if (!profile) return null;
  const p = profile;
  const g = genderFor(p.sex);
  const a = avatarOf(p);
  const set = (patch: Partial<Avatar>) => saveProfile({ ...p, avatar: { ...a, ...patch } });
  const ch = weightChange(p);
  const startBmi = bmi(ch.start, p.height), nowBmi = bmi(p.weight, p.height);
  const female = p.sex === 'f';

  const save = () => {
    const v = +kg.replace(',', '.').replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
    if (!(v >= 30 && v <= 250)) { setMsg(L(`${g('اكتب', 'اكتبي')} الوزن بالكيلو، مثلًا 68.5`, 'Enter your weight in kg, e.g. 68.5')); return; }
    const before = p.weight;
    saveProfile(logWeight(p, v));
    setKg('');
    setWhole(true);
    const d = Math.round((v - before) * 10) / 10;
    play(d < 0 ? 'win' : 'check');
    setMsg(d < 0 ? L(`برافو! ${g('نزلت', 'نزلتي')} ${num(-d)} كجم، بص${g('', 'ي')} الأفاتار اتغير ✨`, `Well done! Down ${-d} kg, look how your avatar changed ✨`)
      : d > 0 ? L(`اتسجل. زيادة ${num(d)} كجم، عادي يحصل تذبذب، كمل${g('', 'ي')} 💪`, `Saved. Up ${d} kg; ups and downs are normal, keep going 💪`)
      : L('اتسجل، نفس الوزن.', 'Saved, same weight.'));
  };

  const cats: [Cat, string, string][] = [
    ['skin', 'البشرة', 'Skin'], ['hair', 'الشعر', 'Hair'], ['brows', 'الحواجب', 'Brows'], ['eyes', 'العيون', 'Eyes'], ['head', 'شكل الوش', 'Head'],
    ['nose', 'الأنف', 'Nose'], ['mouth', 'البُق', 'Mouth'], ['ears', 'الودان', 'Ears'],
    ...(female ? [['makeup', 'الميكب', 'Makeup'] as [Cat, string, string]] : [['facial', 'الدقن', 'Facial hair'] as [Cat, string, string]]),
    ['glasses', 'النضارة', 'Glasses'], ['hat', 'على الراس', 'Headwear'], ['outfit', 'اللبس', 'Outfit'], ['body', 'الجسم', 'Body'],
  ];
  // A tile shows the avatar with one option applied, zoomed on the part that changes.
  const tile = (patch: Partial<Avatar>, crop: Crop, key: string) => <AvatarView id={key} crop={crop} a={{ ...a, ...patch }} bmi={nowBmi} sex={p.sex} size={crop === 'bottom' ? 92 : 96} />;
  const showWhole = whole || cat === 'outfit' || cat === 'body';

  return (
    <Bg>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 14 }} keyboardShouldPersistTaps="handled" stickyHeaderIndices={[1]}>
        <View style={styles.rowBetween}>
          <T kind="h1">{L('شخصيتك', 'Your avatar')}</T>
          <Btn kind="text" title={L('تم', 'Done')} onPress={() => router.back()} />
        </View>

        <View style={{ gap: 10 }}>
          <Card style={{ alignItems: 'center', paddingVertical: 10 }}>
            <View style={[styles.row, { justifyContent: 'center', gap: 4, alignSelf: 'stretch' }]}>
              {showWhole && ch.diff !== 0 ? (
                <View style={{ alignItems: 'center', opacity: 0.5, marginEnd: 14 }}>
                  <AvatarView id="start" a={a} bmi={startBmi} sex={p.sex} size={230} />
                  <T kind="label" style={{ textAlign: 'center' }}>{L(`البداية: ${num(ch.start)} كجم`, `Start: ${ch.start} kg`)}</T>
                </View>
              ) : null}
              <View style={{ alignItems: 'center' }}>
                <AvatarView id="now" a={a} bmi={nowBmi} sex={p.sex} size={showWhole ? 230 : 210} crop={showWhole ? 'full' : 'bust'} />
                {showWhole ? <T kind="h3" style={{ textAlign: 'center' }}>{L(`دلوقتي: ${num(p.weight)} كجم`, `Now: ${p.weight} kg`)}</T> : null}
              </View>
            </View>
            <View style={[styles.row, { gap: 8 }]}>
              <Chip label={L('الوش', 'Face')} on={!showWhole} onPress={() => { setWhole(false); if (cat === 'outfit' || cat === 'body') setCat('skin'); }} />
              <Chip label={L('الجسم كله', 'Full body')} on={showWhole} onPress={() => setWhole(true)} />
            </View>
          </Card>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 2 }}>
            {cats.map(([k, ar, en]) => (
              <Pressable key={k} onPress={() => { play('tap'); setCat(k); }} accessibilityRole="tab" accessibilityState={{ selected: cat === k }}
                style={[{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 99, backgroundColor: cat === k ? c.petrol : c.surface, borderWidth: 1, borderColor: cat === k ? c.petrol : c.line }, lift(c, cat === k ? 'glow' : 'sm')]}>
                <Text style={{ fontFamily: fonts.bodyMedium, fontSize: 13, color: cat === k ? c.onPetrol : c.ink }}>{L(ar, en)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <Card style={{ gap: 16 }}>
          {cat === 'skin' ? (
            <>
              <Swatches label={L('لون البشرة', 'Skin tone')} colors={SKINS} value={a.skin} onPick={(skin) => set({ skin })} />
              <View style={styles.wrap}>
                <Toggle label={L('نمش', 'Freckles')} on={a.freckles} onPress={() => set({ freckles: !a.freckles })} />
                <Toggle label={L('خدود وردي', 'Rosy cheeks')} on={a.blush} onPress={() => set({ blush: !a.blush })} />
              </View>
            </>
          ) : cat === 'hair' ? (
            <>
              <Tiles label={L('التسريحة', 'Style')} keys={female ? HAIRS_F : HAIRS_M} names={HAIR_N} value={a.hair} onPick={(hair) => set({ hair })} render={(k) => tile({ hair: k }, 'head', `h${k}`)} />
              {a.hair === 'hijab'
                ? <Swatches label={L('لون الحجاب', 'Hijab colour')} colors={HIJABS} value={a.hijabColor} onPick={(hijabColor) => set({ hijabColor })} />
                : <Swatches label={L('لون الشعر', 'Hair colour')} colors={HAIR_COLORS} value={a.hairColor} onPick={(hairColor) => set({ hairColor })} />}
            </>
          ) : cat === 'brows' ? (
            <Tiles label={L('شكل الحواجب', 'Brow shape')} keys={BROWS} names={names(BROWS)} value={a.brows} onPick={(brows) => set({ brows })} render={(k) => tile({ brows: k }, 'face', `b${k}`)} />
          ) : cat === 'eyes' ? (
            <>
              <Tiles label={L('شكل العين', 'Eye shape')} keys={EYES} names={names(EYES)} value={a.eyeShape} onPick={(eyeShape) => set({ eyeShape })} render={(k) => tile({ eyeShape: k }, 'face', `e${k}`)} />
              <Swatches label={L('لون العين', 'Eye colour')} colors={EYE_COLORS} value={a.eyes} onPick={(eyes) => set({ eyes })} />
              <View style={styles.wrap}><Toggle label={L('رموش', 'Lashes')} on={a.lashes} onPress={() => set({ lashes: !a.lashes })} /></View>
            </>
          ) : cat === 'head' ? (
            <Tiles label={L('شكل الوش', 'Face shape')} keys={FACES} names={names(FACES)} value={a.face} onPick={(face) => set({ face })} render={(k) => tile({ face: k }, 'head', `f${k}`)} />
          ) : cat === 'nose' ? (
            <Tiles label={L('شكل الأنف', 'Nose shape')} keys={NOSES} names={names(NOSES)} value={a.nose} onPick={(nose) => set({ nose })} render={(k) => tile({ nose: k }, 'face', `n${k}`)} />
          ) : cat === 'mouth' ? (
            <>
              <Tiles label={L('شكل الشفايف', 'Lip shape')} keys={MOUTHS} names={names(MOUTHS)} value={a.mouth} onPick={(mouth) => set({ mouth })} render={(k) => tile({ mouth: k }, 'face', `m${k}`)} />
              <Swatches label={L('لون الشفايف', 'Lip colour')} colors={LIPS} value={a.lips} onPick={(lips) => set({ lips })} />
            </>
          ) : cat === 'ears' ? (
            <>
              <Tiles label={L('حجم الودان', 'Ear size')} keys={EARS} names={names(EARS)} value={a.ears} onPick={(ears) => set({ ears })} render={(k) => tile({ ears: k, hair: 'pony' }, 'head', `r${k}`)} />
              <Tiles label={L('حلق', 'Earrings')} keys={RINGS} names={names(RINGS)} value={a.earrings} onPick={(earrings) => set({ earrings })} render={(k) => tile({ earrings: k, hair: a.hair === 'hijab' ? 'bun' : 'pony' }, 'head', `g${k}`)} />
            </>
          ) : cat === 'facial' ? (
            <Tiles label={L('الدقن والشنب', 'Beard & moustache')} keys={FACIAL} names={names(FACIAL)} value={a.facial} onPick={(facial) => set({ facial })} render={(k) => tile({ facial: k }, 'head', `x${k}`)} />
          ) : cat === 'makeup' ? (
            <>
              <Swatches label={L('ظل العين', 'Eyeshadow')} colors={SHADOWS} value={a.shadow} onPick={(shadow) => set({ shadow })} />
              <Swatches label={L('روج', 'Lipstick')} colors={LIPS} value={a.lips} onPick={(lips) => set({ lips })} />
              <View style={styles.wrap}>
                <Toggle label={L('آيلاينر', 'Eyeliner')} on={a.liner} onPress={() => set({ liner: !a.liner })} />
                <Toggle label={L('بلاشر', 'Blush')} on={a.blush} onPress={() => set({ blush: !a.blush })} />
                <Toggle label={L('رموش', 'Lashes')} on={a.lashes} onPress={() => set({ lashes: !a.lashes })} />
              </View>
            </>
          ) : cat === 'glasses' ? (
            <>
              <Tiles label={L('النضارة', 'Glasses')} keys={GLASSES} names={names(GLASSES)} value={a.glasses} onPick={(glasses) => set({ glasses })} render={(k) => tile({ glasses: k }, 'head', `o${k}`)} />
              {a.glasses !== 'none' ? <Swatches label={L('لون الفريم', 'Frame colour')} colors={FRAMES} value={a.glassesColor} onPick={(glassesColor) => set({ glassesColor })} /> : null}
            </>
          ) : cat === 'hat' ? (
            a.hair === 'hijab' ? <T kind="small">{L('مع الحجاب مفيش حاجة على الراس.', 'Headwear is off with a hijab.')}</T> : (
              <>
                <Tiles label={L('على الراس', 'Headwear')} keys={HATS} names={names(HATS)} value={a.headwear} onPick={(headwear) => set({ headwear })} render={(k) => tile({ headwear: k }, 'head', `w${k}`)} />
                {a.headwear !== 'none' ? <Swatches label={L('لونها', 'Colour')} colors={CLOTHES} value={a.headwearColor} onPick={(headwearColor) => set({ headwearColor })} /> : null}
              </>
            )
          ) : cat === 'outfit' ? (
            <>
              <Tiles label={L('فوق', 'Top')} keys={female ? TOPS : TOPS_M} names={TOP_N} value={a.top} onPick={(top) => set({ top })} render={(k) => tile({ top: k }, 'top', `t${k}`)} />
              <Swatches label={L('لونه', 'Colour')} colors={CLOTHES} value={a.topColor} onPick={(topColor) => set({ topColor })} />
              <Tiles label={L('تحت', 'Bottom')} keys={female ? BOTTOMS : BOTTOMS_M} names={BOT_N} value={a.bottom} onPick={(bottom) => set({ bottom })} render={(k) => tile({ bottom: k }, 'bottom', `p${k}`)} />
              <Swatches label={L('لونه', 'Colour')} colors={CLOTHES} value={a.bottomColor} onPick={(bottomColor) => set({ bottomColor })} />
              <Swatches label={L('الكوتشي', 'Trainers')} colors={CLOTHES} value={a.shoes} onPick={(shoes) => set({ shoes })} />
            </>
          ) : (
            <>
              <Tiles label={L('شكل الجسم', 'Body type')} keys={BODIES} names={Object.fromEntries(BODIES.map((k) => [k, L(BODY_N[k][0], BODY_N[k][1])])) as Record<typeof a.body, string>} value={a.body} onPick={(body) => set({ body })}
                render={(k) => <View style={{ alignItems: 'center' }}><AvatarView id={`y${k}`} a={{ ...a, body: k }} bmi={nowBmi} sex={p.sex} size={78} /><T kind="label" style={{ textAlign: 'center', fontSize: 11 }}>{L(BODY_N[k][0], BODY_N[k][1])}</T></View>} />
              <T kind="small">{L('الطول والوزن بيتحسبوا من بياناتك، وشكل الجسم بيحدد الوزن بيتوزع فين.', 'Height and weight come from your details; body type decides where the weight sits.')}</T>
            </>
          )}
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
          {ch.diff < 0 ? <T kind="small" color={c.ok}>{L(`${g('نزلت', 'نزلتي')} ${num(-ch.diff)} كجم من أول ما ${g('بدأت', 'بدأتي')} 🎉`, `${-ch.diff} kg down since you started 🎉`)}</T> : null}
        </Card>
      </ScrollView>
    </Bg>
  );
}
