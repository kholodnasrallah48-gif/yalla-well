// "أنا برة البيت" on the Food tab: a button under the captain that opens a sheet to plan a meal out (calories held
// for it, the other meals get lighter), find a restaurant by name or near the person, and pick from it: single dishes
// or a whole meal (main, side and drink) that fits. Big chains use the numbers they publish; other places get dishes
// for their kind of food with approximate calories.
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { CHAINS } from '../lib/chains-data.ts';
import { addFood, fmt, type DayLog } from '../lib/day.ts';
import { foodLevel } from '../lib/foods.ts';
import { isEn, L, tx } from '../lib/i18n.ts';
import { MEAL_NAME, MEALS, outReserve, toMeal, type OutSize } from '../lib/mealplan.ts';
import { buildCombo, chainById, dishesFor, KINDS, kindName, nearby, picks, searchChains, searchPlaces, type Dish, type Kind, type Place } from '../lib/outside.ts';
import type { Gender, Profile } from '../lib/plan.ts';
import type { Meal } from '../lib/recipes-data.ts';
import { play } from '../lib/sound.ts';
import { whereAmI } from '../lib/where.ts';
import { fonts, useColors } from '../theme.ts';
import { Btn, Card, Chip, Kicker, Num, Segmented, START, T, styles } from './ui.tsx';

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
  lebanese: (g) => [`المشاوي أخف من المقليات، خلي الحمص والعيش على قد معلقتين ورغيف صغير.`, 'Grills are lighter than fried dishes; keep hummus and bread small.'],
  turkish: (g) => [`${g('اطلب', 'اطلبي')} الكباب مع سلطة بدل العيش، والزبادي أحسن من الصوص بالزبدة.`, 'Have the kebab with salad instead of bread; yogurt is better than butter sauce.'],
  indian: (g) => [`التندوري أخف من الكاري بالكريمة، ${g('خليك', 'خليكي')} في رز قليل أو من غيره.`, 'Tandoori is lighter than creamy curries; go easy on the rice.'],
  asian: (g) => [`المشوي والمسلوق أخف من المقلي، ${g('اطلب', 'اطلبي')} الصوص على جنب.`, 'Steamed or grilled beats fried; ask for the sauce on the side.'],
  italian: (g) => [`الصوص الأحمر أخف من الأبيض، خلي البيتزا شريحتين مع سلطة.`, 'Tomato sauce is lighter than cream; keep pizza to two slices with a salad.'],
};

const SIZES: OutSize[] = ['light', 'usual', 'big'];
const SIZE_NAME: Record<OutSize, [string, string]> = { light: ['خفيفة', 'Light'], usual: ['عادية', 'Usual'], big: ['كبيرة', 'Big'] };

export function OutsideButton({ onPress, out }: { onPress: () => void; out?: { meal: Meal; kcal: number } | null }) {
  const c = useColors();
  return (
    <Pressable onPress={() => { play('swoosh'); onPress(); }} accessibilityRole="button"
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.soft, borderRadius: 99, paddingVertical: 10, paddingHorizontal: 14, alignSelf: 'flex-start' }, pressed && styles.pressed]}>
      <PinIcon color={c.petrol} />
      <View>
        <Text style={{ fontFamily: fonts.displaySemi, fontSize: 14.5, lineHeight: 20, color: c.ink }}>{L('أنا برة البيت', "I'm eating out")}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: out ? c.petrol : c.muted }}>
          {out ? L(`محجوز ${fmt(out.kcal)} سعرة ${toMeal(out.meal)}`, `${fmt(out.kcal)} kcal held for ${tx(MEAL_NAME[out.meal]).toLowerCase()}`) : L('حجز سعرات لأكلة برة، ومنيوهات المطاعم', 'Plan a meal out, and restaurant menus')}
        </Text>
      </View>
    </Pressable>
  );
}

type Status = 'idle' | 'looking' | 'denied' | 'off' | 'none' | 'done';
type Found = { q: string; places: Place[] | null } | null;

export function OutsideSheet({ open, onClose, profile, kcalLeft, proteinLeft, meal: start, budgets, day, update, g }: {
  open: boolean; onClose: () => void; profile: Profile; kcalLeft: number; proteinLeft: number; meal: Meal;
  /** Calories each meal can still take today (the plan's split, with a meal out held). */
  budgets: Record<Meal, number>;
  day: DayLog;
  update: (fn: (d: DayLog) => DayLog) => void; g: Gender;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const ticked = day.meals ?? [];
  const planDefault = (): Meal => day.out?.meal ?? (!ticked.includes('dinner') ? 'dinner' : start);
  const [kind, setKind] = useState<Kind>('grill');
  const [meal, setMeal] = useState<Meal>(day.out?.meal ?? start);
  const [outMeal, setOutMeal] = useState<Meal>(planDefault);
  const [size, setSize] = useState<OutSize>('usual');
  const [status, setStatus] = useState<Status>('idle');
  const [places, setPlaces] = useState<Place[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found>(null);
  const [added, setAdded] = useState('');
  const asked = useRef('');

  // Each time the sheet opens: add to the meal held for eating out, or the next meal.
  useEffect(() => {
    if (!open) return;
    setMeal(day.out?.meal ?? start);
    setOutMeal(planDefault());
    setAdded('');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // A name search: chains we know answer at once (offline too); other places come from the map after a short pause.
  useEffect(() => {
    const text = q.trim();
    if (text.length < 3) { setFound(null); return; }
    const t = setTimeout(async () => {
      asked.current = text;
      const got = await searchPlaces(text, here);
      if (asked.current === text) setFound({ q: text, places: got });
    }, 500);
    return () => clearTimeout(t);
  }, [q, here]);

  const look = async () => {
    setStatus('looking');
    const at = await whereAmI();
    if (at === 'denied' || at === 'off') { setStatus(at); return; }
    setHere(at);
    const got = await nearby(at.lat, at.lon, !isEn());
    if (got == null) { setStatus('off'); return; }
    setPlaces(got.slice(0, 8));
    setStatus(got.length ? 'done' : 'none');
    if (got[0]) choose(got[0]);
  };
  const choose = (x: Place) => { setPlace(x); setKind(x.kind); setAdded(''); };

  const chain = chainById(place?.chain);
  const source = { kind, cuisine: place?.kind === kind ? place.cuisine : undefined, chain: place?.kind === kind ? place.chain : undefined };
  const list = picks(profile, kind, kcalLeft, 4, source.cuisine, source.chain);
  const budget = budgets[meal] > 0 ? Math.min(budgets[meal], Math.max(kcalLeft, 0)) : Math.max(kcalLeft, 0);
  const combo = buildCombo(profile, dishesFor(source), budget, (chainById(source.chain)?.kind ?? kind) === 'cafe');
  const chainHits = searchChains(q);
  const reserve = outReserve(profile, outMeal, size);
  const outDone = ticked.includes(outMeal);

  const msg: Partial<Record<Status, string>> = {
    looking: L('بندور على الأماكن اللي جنبك.', 'Looking for places near you.'),
    denied: L(`من غير إذن الموقع مش هنعرف الأماكن اللي جنبك. ${g('دور', 'دوري')} بالاسم أو ${g('اختار', 'اختاري')} نوع المكان من تحت.`, "Without location access we can't see places near you. Search by name or pick the kind of place below."),
    off: L(`مقدرناش نعرف المكان دلوقتي. ${g('دور', 'دوري')} بالاسم أو ${g('اختار', 'اختاري')} نوع المكان من تحت.`, "We couldn't get your location right now. Search by name or pick the kind of place below."),
    none: L(`ملقيناش أماكن قريبة على الخريطة. ${g('دور', 'دوري')} بالاسم أو ${g('اختار', 'اختاري')} نوع المكان من تحت.`, 'We found no places near you on the map. Search by name or pick the kind of place below.'),
  };
  // Inside a chain's menu its name is already on top, so "Big Mac (McDonald's)" shows as "Big Mac".
  const dishName = (d: Dish) => (d.chain ? tx(d.food.n).replace(/\s*\([^)]*\)$/, '') : tx(d.food.n));
  const kcalNote = (d: Dish) => (d.chain ? L('سعرة منشورة', 'kcal published') : L('سعرة تقريبا', 'kcal approx.'));
  const placeRow = (x: Place, sub: string) => {
    const on = place?.id === x.id;
    const ch = chainById(x.chain);
    return (
      <Pressable key={x.id} onPress={() => { play('tap'); choose(x); }} accessibilityRole="radio" accessibilityState={{ selected: on }}
        style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, paddingVertical: 9, paddingHorizontal: 12, backgroundColor: on ? c.soft : 'transparent' }, pressed && styles.pressed]}>
        <PinIcon size={16} color={on ? c.petrol : c.dim} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T kind="h3" numberOfLines={1}>{x.name}</T>
          <T kind="label" numberOfLines={1}>{sub}</T>
        </View>
        {ch ? <T kind="label" color={c.petrol}>{L('منيو المحل', 'Its menu')}</T> : null}
      </Pressable>
    );
  };
  const placeSub = (x: Place) => [kindName(x.kind), Number.isFinite(x.m) ? far(x.m) : x.area].filter(Boolean).join(' · ');

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={L('قفل', 'Close')} />
        <View style={{ maxHeight: '90%', backgroundColor: c.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 24, gap: 14 }}>
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

            {/* Plan a meal out: hold its calories so the rest of the day gets lighter. */}
            <Card style={{ gap: 10 }}>
              <Kicker>{L('هاكل برة النهارده', 'Eating out today')}</Kicker>
              {day.out ? (
                <>
                  <T kind="h3">{L(`محجوز ${fmt(day.out.kcal)} سعرة ${toMeal(day.out.meal)} برة البيت`, `${fmt(day.out.kcal)} kcal held for ${tx(MEAL_NAME[day.out.meal]).toLowerCase()} out`)}</T>
                  <T kind="small" color={c.muted}>{L('باقي وجبات النهارده اتقسمت على اللي فاضل بعد الحجز، فاقتراحاتها بقت أخف. الحجز للنهارده بس.', "Today's other meals now share what's left after the hold, so their suggestions are lighter. The hold is for today only.")}</T>
                  <Btn kind="secondary" title={L('إلغاء الحجز', 'Cancel the hold')} onPress={() => update((d) => { const { out: _o, ...rest } = d; return rest; })} />
                </>
              ) : (
                <>
                  <T kind="small" color={c.muted}>{L(`لو ${g('هتاكل', 'هتاكلي')} برة، ${g('احجز', 'احجزي')} سعرات الوجبة دي من دلوقتي، وباقي وجبات اليوم هتبقى أخف علشان ${g('توصل', 'توصلي')} وانت${g('', 'ي')} مرتاح${g('', 'ة')}. الحجز للنهارده بس.`,
                    "If you're eating out, hold that meal's calories now and the rest of today's meals get lighter, so you get there with room. The hold is for today only.")}</T>
                  <Segmented<Meal> items={MEALS.map((m) => [m, tx(MEAL_NAME[m])] as [Meal, string])} value={outMeal} onChange={setOutMeal} />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {SIZES.map((s) => <Chip key={s} label={`${L(...SIZE_NAME[s])} · ${fmt(outReserve(profile, outMeal, s))}`} on={size === s} onPress={() => setSize(s)} />)}
                  </View>
                  {outDone ? <T kind="small" color={c.warn}>{L(`${g('علمت', 'علمتي')} على الوجبة دي إنها خلصت.`, 'You ticked this meal as done.')}</T> : null}
                  <Btn title={L(`${g('احجز', 'احجزي')} ${fmt(reserve)} سعرة ${toMeal(outMeal)}`, `Hold ${fmt(reserve)} kcal for ${tx(MEAL_NAME[outMeal]).toLowerCase()}`)} disabled={outDone}
                    onPress={() => { update((d) => ({ ...d, out: { meal: outMeal, kcal: reserve } })); setMeal(outMeal); }} />
                </>
              )}
            </Card>

            {/* Find the place: by name (chains first), or near the person. */}
            <View style={{ gap: 8 }}>
              <T kind="label">{L(`${g('دور', 'دوري')} على مطعم بالاسم`, 'Search a restaurant by name')}</T>
              <TextInput value={q} onChangeText={setQ} placeholder={L('مثلا: ماكدونالدز، كنتاكي، زعتر و زيت', "e.g. McDonald's, KFC, Zaatar W Zeit")} placeholderTextColor={c.muted}
                accessibilityLabel={L('اسم المطعم', 'Restaurant name')} autoCorrect={false} returnKeyType="search"
                style={{ backgroundColor: c.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() }} />
              {chainHits.map((ch) => placeRow({ id: 'chain/' + ch.id, name: L(ch.ar, ch.en), kind: ch.kind, m: NaN, lat: 0, lon: 0, chain: ch.id },
                L('منيو المحل بالسعرات اللي بينشرها', 'Its menu with the calories it publishes')))}
              {q.trim().length >= 3 && found?.q === q.trim() ? (
                found.places == null
                  ? <T kind="small" color={c.warn}>{L(`مقدرناش ندور على الخريطة دلوقتي. ${chainHits.length ? 'المحلات اللي فوق شغالة من غير نت.' : `${g('اختار', 'اختاري')} نوع المكان من تحت.`}`, `We couldn't search the map right now. ${chainHits.length ? 'The chains above work offline.' : 'Pick the kind of place below.'}`)}</T>
                  : found.places.filter((x) => !chainHits.some((ch) => ch.id === x.chain)).map((x) => placeRow(x, placeSub(x)))
              ) : null}
              {q.trim().length >= 3 && found?.q === q.trim() && found.places?.length === 0 && !chainHits.length
                ? <T kind="small" color={c.muted}>{L(`ملقيناش مطعم بالاسم ده. ${g('اختار', 'اختاري')} نوع المكان من تحت.`, 'No restaurant found by that name. Pick the kind of place below.')}</T> : null}
            </View>

            {status === 'done' ? (
              <View style={{ gap: 2 }}>
                <T kind="label">{L('جنبك دلوقتي', 'Near you now')}</T>
                {places.map((x) => placeRow(x, placeSub(x)))}
              </View>
            ) : status === 'looking' ? (
              <T kind="small" color={c.muted}>{msg.looking}</T>
            ) : (
              <View style={{ gap: 8 }}>
                {msg[status] ? <T kind="small" color={c.warn}>{msg[status]}</T> : null}
                {status === 'idle' ? <Btn kind="outline" title={L(`${g('دور', 'دوري')} على الأماكن اللي جنبي`, 'Find places near me')} onPress={look} /> : null}
                {status === 'off' || status === 'none' ? <Btn kind="text" title={L(g('جرب تاني', 'جربي تاني'), 'Try again')} onPress={look} /> : null}
              </View>
            )}

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {KINDS.map((k) => <Chip key={k} label={kindName(k)} on={kind === k} onPress={() => { setKind(k); if (place && place.kind !== k) setPlace(null); }} />)}
            </View>

            <View style={{ gap: 6 }}>
              <Segmented<Meal> items={MEALS.map((m) => [m, tx(MEAL_NAME[m])] as [Meal, string])} value={meal} onChange={setMeal} />
              <T kind="label">{L(`الأكل هيتضاف ${toMeal(meal)}`, `Food is added to ${tx(MEAL_NAME[meal]).toLowerCase()}`)}</T>
            </View>

            <View style={{ gap: 4 }}>
              <T kind="h3">{place ? L(`${g('تختار', 'تختاري')} إيه من ${place.name}`, `What to get at ${place.name}`) : L(`من ${kindName(kind)}`, `From ${kindName(kind).toLowerCase()}`)}</T>
              {chain && source.chain ? (
                <T kind="small" color={c.muted}>{L(`السعرات دي اللي ${chain.ar} بتنشرها.${chain.has === 'kcal' ? ' المحل بينشر السعرات بس، فالبروتين والكارب والدهون مش هيتسجلوا.' : chain.has === 'protein' ? ' المحل بينشر السعرات والبروتين بس، فالكارب والدهون مش هيتسجلوا.' : ''}`,
                  `These are the calories ${chain.en} publishes.${chain.has === 'kcal' ? ' It only publishes calories, so protein, carbs and fat are not logged.' : chain.has === 'protein' ? ' It only publishes calories and protein, so carbs and fat are not logged.' : ''}`)}</T>
              ) : null}
              <T kind="small" color={c.muted}>{L(...TIP[kind](g))}</T>
            </View>

            {/* A whole meal that fits this meal's calories. */}
            {combo ? (
              <Card style={{ gap: 8 }}>
                <Kicker>{L(`وجبة كاملة على قد ${fmt(budget)} سعرة`, `A whole meal within ${fmt(budget)} kcal`)}</Kicker>
                {combo.items.map((d) => (
                  <View key={d.food.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <T kind="body" style={{ flex: 1 }}>{dishName(d)}</T>
                    <T kind="small" color={c.muted}>{`${fmt(d.food.kcal)} ${kcalNote(d)}`}</T>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 2 }}>
                  <Num size={28} weight="black">{fmt(combo.kcal)}</Num>
                  <T kind="small" color={c.muted} style={{ paddingBottom: 4, flex: 1 }}>
                    {L(`سعرة${combo.items.some((d) => !d.chain) ? ' تقريبا' : ''}${combo.p > 0 ? ` · ${fmt(combo.p)} جم بروتين` : ''}`, `kcal${combo.items.some((d) => !d.chain) ? ' approx.' : ''}${combo.p > 0 ? ` · ${fmt(combo.p)} g protein` : ''}`)}
                  </T>
                </View>
                {combo.swaps.length ? (
                  <View style={{ gap: 2 }}>
                    <T kind="small" color={c.petrol}>{L(`الطلب العادي ${fmt(combo.usual)} سعرة، فخففناه:`, `The usual order is ${fmt(combo.usual)} kcal, so it's lighter:`)}</T>
                    {combo.swaps.map((s, i) => (
                      <T key={i} kind="small" color={c.muted}>{s.to ? L(`${dishName(s.to)} بدل ${dishName(s.from)}`, `${dishName(s.to)} instead of ${dishName(s.from)}`) : L(`من غير ${dishName(s.from)}`, `No ${dishName(s.from)}`)}</T>
                    ))}
                  </View>
                ) : null}
                {!combo.fits ? <T kind="small" color={c.warn}>{L('دي أخف وجبة هنا، وبرضه أكتر من اللي فاضل. خلي الوجبة الجاية خفيفة.', "This is the lightest meal here and it's still over. Keep the next meal light.")}</T> : null}
                <Btn title={L(`${g('ضيف', 'ضيفي')} الوجبة كلها ${toMeal(meal)}`, `Add the whole meal to ${tx(MEAL_NAME[meal]).toLowerCase()}`)}
                  onPress={() => { update((d) => combo.items.reduce((acc, it) => addFood(acc, it.food, meal), d)); setAdded(combo.items.map(dishName).join(L('، ', ', '))); }} />
              </Card>
            ) : null}

            <T kind="label">{L('أو طبق لوحده', 'Or one dish')}</T>
            {list.map(({ food, fits, dish }) => {
              const warn = foodLevel(profile, food) === 'warn';
              const noProtein = dish.chain && chainById(dish.chain)?.has === 'kcal';
              return (
                <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: c.line, paddingBottom: 10 }}>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <T kind="h3">{dishName(dish)}</T>
                    <T kind="label">{noProtein ? tx(food.u) : `${tx(food.u)} · ${L(`${fmt(food.p)} جم بروتين`, `${fmt(food.p)} g protein`)}`}</T>
                    {!fits ? <T kind="label" color={c.warn}>{L('أكتر من اللي فاضل، بس دي أخف حاجة هنا.', "More than you have left, but it's the lightest here.")}</T> : null}
                    {warn ? <T kind="label" color={c.warn}>{L('مش أحسن اختيار لحالتك، لو فيه بديل يبقى أحسن.', 'Not the best for your health; pick another if you can.')}</T> : null}
                  </View>
                  <View style={{ alignItems: 'center' }}>
                    <Num size={24} weight="black">{fmt(food.kcal)}</Num>
                    <T kind="label" style={{ fontSize: 11 }}>{kcalNote(dish)}</T>
                  </View>
                  <Pressable onPress={() => { play('add'); update((d) => addFood(d, food, meal)); setAdded(tx(food.n)); }} accessibilityRole="button"
                    accessibilityLabel={L(`إضافة ${food.n} ${toMeal(meal)}`, `Add ${tx(food.n)} to ${tx(MEAL_NAME[meal]).toLowerCase()}`)}
                    style={({ pressed }) => [{ minHeight: 36, minWidth: 36, borderRadius: 999, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
                    <Text style={{ fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 20, color: c.ink }}>+</Text>
                  </Pressable>
                </View>
              );
            })}
            {added ? <T kind="small" color={c.petrol} style={{ textAlign: START() }}>{L(`اتضاف ${added} ${toMeal(meal)}. ${g('علم', 'علمي')} على الوجبة لما ${g('تخلصها', 'تخلصيها')} علشان تتحسب.`, `${added} added to ${tx(MEAL_NAME[meal]).toLowerCase()}. Tick the meal when you finish it so it counts.`)}</T> : null}

            <T kind="small" color={c.dim}>{L(`سعرات ${CHAINS.map((x) => x.ar).join('، ')} هي الأرقام اللي المحل بينشرها. باقي الأماكن السعرات تقريبا لحصة عادية. الأماكن من خريطة OpenStreetMap، ومكانك مش بيتحفظ.`,
              `Calories for ${CHAINS.map((x) => x.en).join(', ')} are the numbers each chain publishes. Other places get approximate calories for a usual portion. Places come from OpenStreetMap, and your location isn't saved.`)}</T>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
