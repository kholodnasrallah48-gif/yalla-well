// "أنا برة البيت" on the Food tab: a button under the captain that opens a sheet with the places near the person
// (when they allow the location) and dishes from that kind of place sized to what's left today.
import { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { addFood, fmt, type DayLog } from '../lib/day.ts';
import { foodLevel } from '../lib/foods.ts';
import { isEn, L, tx } from '../lib/i18n.ts';
import { MEAL_NAME, MEALS, toMeal } from '../lib/mealplan.ts';
import { KINDS, kindName, nearby, picks, type Kind, type Place } from '../lib/outside.ts';
import type { Gender, Profile } from '../lib/plan.ts';
import type { Meal } from '../lib/recipes-data.ts';
import { play } from '../lib/sound.ts';
import { whereAmI } from '../lib/where.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Chip, Num, RADIUS, Segmented, START, T, styles } from './ui.tsx';

function PinIcon({ size = 18, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 22s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z" fill={color} />
      <Circle cx={12} cy={10} r={2.6} fill="#000" opacity={0.55} />
    </Svg>
  );
}

const far = (m: number) => (m < 1000 ? L(`${fmt(Math.round(m / 10) * 10)} متر`, `${fmt(Math.round(m / 10) * 10)} m`) : L(`${(m / 1000).toFixed(1)} كم`, `${(m / 1000).toFixed(1)} km`));

const TIP: Record<Kind, (g: Gender) => [string, string]> = {
  grill: (g) => [`${g('اطلب', 'اطلبي')} سلطة جنبها بدل العيش والرز، والطحينة معلقة واحدة.`, 'Ask for salad instead of bread and rice, and keep tahini to a spoon.'],
  fast: (g) => [`${g('خليك', 'خليكي')} في الحجم الصغير، ومن غير بطاطس ولا مشروب بسكر.`, 'Go for the small size, without fries or a sugary drink.'],
  healthy: (g) => [`${g('اطلب', 'اطلبي')} الصوص على جنب علشان ${g('تتحكم', 'تتحكمي')} في الكمية.`, 'Ask for the dressing on the side so you control how much.'],
  cafe: () => ['اللبن الخالي الدسم ومن غير سكر بيوفر سعرات كتير.', 'Skim milk and no sugar save a lot of calories.'],
};

export function OutsideButton({ onPress }: { onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { play('swoosh'); onPress(); }} accessibilityRole="button"
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: c.petrol, borderRadius: 99, paddingVertical: 9, paddingHorizontal: 14, alignSelf: 'flex-start' }, pressed && styles.pressed]}>
      <PinIcon color={c.petrol} />
      <View>
        <Text style={{ fontFamily: fonts.displaySemi, fontSize: 14.5, lineHeight: 20, color: c.ink }}>{L('أنا برة البيت', "I'm eating out")}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: c.muted }}>{L('اقتراحات من الأماكن اللي جنبك', 'Picks from places near you')}</Text>
      </View>
    </Pressable>
  );
}

type Status = 'idle' | 'looking' | 'denied' | 'off' | 'none' | 'done';

export function OutsideSheet({ open, onClose, profile, kcalLeft, proteinLeft, meal: start, update, g }: {
  open: boolean; onClose: () => void; profile: Profile; kcalLeft: number; proteinLeft: number; meal: Meal;
  update: (fn: (d: DayLog) => DayLog) => void; g: Gender;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<Kind>('grill');
  const [meal, setMeal] = useState<Meal>(start);
  const [status, setStatus] = useState<Status>('idle');
  const [places, setPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [added, setAdded] = useState('');

  const look = async () => {
    setStatus('looking');
    const here = await whereAmI();
    if (here === 'denied' || here === 'off') { setStatus(here); return; }
    const found = await nearby(here.lat, here.lon, !isEn());
    if (found == null) { setStatus('off'); return; }
    setPlaces(found.slice(0, 8));
    setStatus(found.length ? 'done' : 'none');
    if (found[0]) { setPlace(found[0]); setKind(found[0].kind); }
  };
  const list = picks(profile, kind, kcalLeft, 4, place?.kind === kind ? place.cuisine : undefined);
  const msg: Partial<Record<Status, string>> = {
    looking: L('بندور على الأماكن اللي جنبك.', 'Looking for places near you.'),
    denied: L(`من غير إذن الموقع مش هنعرف الأماكن اللي جنبك. ${g('اختار', 'اختاري')} نوع المكان من تحت.`, "Without location access we can't see places near you. Pick the kind of place below."),
    off: L(`مقدرناش نعرف المكان دلوقتي. ${g('اختار', 'اختاري')} نوع المكان من تحت.`, "We couldn't get your location right now. Pick the kind of place below."),
    none: L(`ملقيناش أماكن قريبة على الخريطة. ${g('اختار', 'اختاري')} نوع المكان من تحت.`, "We found no places near you on the map. Pick the kind of place below."),
  };

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={L('قفل', 'Close')} />
        <View style={{ maxHeight: '88%', backgroundColor: c.surface, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderWidth: 1, borderColor: c.line }}>
          <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 24, gap: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T kind="h2">{L('أنا برة البيت', "I'm eating out")}</T>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')}>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 22, color: c.muted }}>×</Text>
              </Pressable>
            </View>
            <T kind="body" color={c.muted}>
              {kcalLeft > 0
                ? L(`فاضلك ${fmt(kcalLeft)} سعرة النهارده${proteinLeft > 0 ? ` و${fmt(proteinLeft)} جم بروتين` : ''}.`, `${fmt(kcalLeft)} kcal left today${proteinLeft > 0 ? ` and ${fmt(proteinLeft)} g protein` : ''}.`)
                : L('سعرات النهارده خلصت، فهنوريك أخف حاجات.', "Today's calories are used up, so here are the lightest options.")}
            </T>

            {status === 'done' ? (
              <View style={{ gap: 6 }}>
                <T kind="label">{L('جنبك دلوقتي', 'Near you now')}</T>
                {places.map((x) => {
                  const on = place?.id === x.id;
                  return (
                    <Pressable key={x.id} onPress={() => { play('tap'); setPlace(x); setKind(x.kind); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
                      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: on ? c.petrol : c.line, borderRadius: RADIUS, paddingVertical: 9, paddingHorizontal: 12 }, pressed && styles.pressed]}>
                      <PinIcon size={16} color={on ? c.petrol : c.dim} />
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <T kind="h3" numberOfLines={1}>{x.name}</T>
                        <T kind="label">{`${kindName(x.kind)} · ${far(x.m)}`}</T>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : status === 'looking' ? (
              <T kind="small" color={c.muted}>{msg.looking}</T>
            ) : (
              <View style={{ gap: 8 }}>
                {msg[status] ? <T kind="small" color={c.warn}>{msg[status]}</T> : null}
                {status === 'idle' ? <Btn kind="outline" title={L('دور على الأماكن اللي جنبي', 'Find places near me')} onPress={look} /> : null}
                {status === 'off' || status === 'none' ? <Btn kind="text" title={L(g('جرب تاني', 'جربي تاني'), 'Try again')} onPress={look} /> : null}
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {KINDS.map((k) => <Chip key={k} label={kindName(k)} on={kind === k} onPress={() => { setKind(k); if (place && place.kind !== k) setPlace(null); }} />)}
            </View>

            <View style={{ gap: 4 }}>
              <T kind="h3">{place ? L(`${g('تختار', 'تختاري')} إيه من ${place.name}`, `What to get at ${place.name}`) : L(`من ${kindName(kind)}`, `From ${kindName(kind).toLowerCase()}`)}</T>
              <T kind="small" color={c.muted}>{L(...TIP[kind](g))}</T>
            </View>
            {list.map(({ food, fits }) => {
              const warn = foodLevel(profile, food) === 'warn';
              return (
                <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: c.line, paddingBottom: 10 }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <T kind="h3">{tx(food.n)}</T>
                    <T kind="label">{`${tx(food.u)} · ${L(`${fmt(food.p)} جم بروتين`, `${fmt(food.p)} g protein`)}`}</T>
                    {!fits ? <T kind="label" color={c.warn}>{L('أكتر من اللي فاضل، بس دي أخف حاجة هنا.', "More than you have left, but it's the lightest here.")}</T> : null}
                    {warn ? <T kind="label" color={c.warn}>{L('مش أحسن اختيار لحالتك، لو فيه بديل يبقى أحسن.', 'Not the best for your health; pick another if you can.')}</T> : null}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Num size={24} weight="black">{fmt(food.kcal)}</Num>
                    <T kind="label" style={{ fontSize: 11 }}>{L('سعرة تقريبا', 'kcal approx.')}</T>
                  </View>
                  <Pressable onPress={() => { play('add'); update((d) => addFood(d, food, meal)); setAdded(tx(food.n)); }} accessibilityRole="button"
                    accessibilityLabel={L(`إضافة ${food.n} ${toMeal(meal)}`, `Add ${tx(food.n)} to ${MEAL_NAME[meal].toLowerCase()}`)}
                    style={({ pressed }) => [{ minHeight: 36, minWidth: 36, borderRadius: 3, borderWidth: 1.5, borderColor: c.petrol, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
                    <Text style={{ fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 20, color: c.petrol }}>+</Text>
                  </Pressable>
                </View>
              );
            })}
            {added ? <T kind="small" color={c.petrol} style={{ textAlign: START() }}>{L(`اتضافت ${added} ${toMeal(meal)}. ${g('علم', 'علمي')} على الوجبة لما ${g('تخلصها', 'تخلصيها')} علشان تتحسب.`, `${added} added to ${MEAL_NAME[meal].toLowerCase()}. Tick the meal when you finish it so it counts.`)}</T> : null}

            <View style={{ gap: 6 }}>
              <T kind="label">{L('هتتضاف في:', 'Add to:')}</T>
              <Segmented<Meal> items={MEALS.map((m) => [m, MEAL_NAME[m]] as [Meal, string])} value={meal} onChange={setMeal} />
            </View>
            <T kind="small" color={c.dim}>{L('السعرات تقديرية لحصة عادية، لأن منيوهات المحلات مش منشورة. الأماكن من خريطة OpenStreetMap، ومكانك مش بيتحفظ.', "Calories are estimates for a usual portion, since shop menus aren't published. Places come from OpenStreetMap, and your location isn't saved.")}</T>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
