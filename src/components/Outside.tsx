// "أنا برة البيت" on the Food tab: a button under the captain that opens a sheet in two steps. First the meal (with
// an option to hold its calories so the rest of the day gets lighter) and the place: by name, near the person, or a kind
// of food. Then the place's page: its logo, a map button, a whole meal that fits and single dishes. Big chains use the
// numbers they publish; other places get dishes for their kind of food with approximate calories.
import { useEffect, useRef, useState } from 'react';
import { Image, Linking, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { CHAINS } from '../lib/chains-data.ts';
import { addFood, fmt, type DayLog } from '../lib/day.ts';
import { foodLevel } from '../lib/foods.ts';
import { isEn, L, tx } from '../lib/i18n.ts';
import { MEAL_NAME, MEALS, outReserve, toMeal } from '../lib/mealplan.ts';
import { BREAKFAST_KINDS, brandOf, buildCombo, chainById, dishesFor, KINDS, kindName, logoFor, mapLinks, nearby, picks, searchBrands, searchChains, searchPlaces, servesMeal, type Dish, type Kind, type Place } from '../lib/outside.ts';
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

/** The place's logo for a known chain, else a tile with a pin. */
function Logo({ place, size = 44 }: { place: Place; size?: number }) {
  const c = useColors();
  const uri = logoFor(place);
  const [bad, setBad] = useState(false);
  useEffect(() => setBad(false), [uri]);
  const box = { width: size, height: size, borderRadius: size * 0.26, overflow: 'hidden' as const, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (uri && !bad) {
    return (
      <View style={[box, { backgroundColor: '#fff', borderWidth: 1, borderColor: c.line }]}>
        <Image source={{ uri }} onError={() => setBad(true)} style={{ width: size * 0.72, height: size * 0.72 }} resizeMode="contain" accessibilityIgnoresInvertColors />
      </View>
    );
  }
  return (
    <View style={[box, { backgroundColor: c.soft }]}>
      <PinIcon size={size * 0.46} color={c.petrol} />
    </View>
  );
}

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
  const [meal, setMeal] = useState<Meal>(day.out?.meal ?? start);
  const [status, setStatus] = useState<Status>('idle');
  const [places, setPlaces] = useState<Place[]>([]);
  /** The chosen place, or a kind of food picked without a place (id "kind/..."). */
  const [place, setPlace] = useState<Place | null>(null);
  const [here, setHere] = useState<{ lat: number; lon: number } | null>(null);
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found>(null);
  const [added, setAdded] = useState('');
  const [kinds, setKinds] = useState(false);
  const [more, setMore] = useState(false);
  const asked = useRef('');

  // Each time the sheet opens: the meal held for eating out, or the next meal.
  useEffect(() => {
    if (!open) return;
    setMeal(day.out?.meal ?? start);
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
  };
  const choose = (x: Place) => { play('tap'); setPlace(x); setAdded(''); setMore(false); };
  const kindPlace = (k: Kind): Place => ({ id: 'kind/' + k, name: kindName(k), kind: k, m: NaN, lat: 0, lon: 0 });

  const generic = !!place?.id.startsWith('kind/');
  const chain = chainById(place?.chain);
  const source = place ? { kind: place.kind, cuisine: place.cuisine, chain: place.chain } : null;
  const budget = budgets[meal] > 0 ? Math.min(budgets[meal], Math.max(kcalLeft, 0)) : Math.max(kcalLeft, 0);
  const cafe = (chain?.kind ?? place?.kind) === 'cafe';
  const dishes = source ? dishesFor(source, meal) : [];
  const combo = source ? buildCombo(profile, dishes, budget, cafe) : null;
  const list = source ? picks(profile, source.kind, budget, more ? 8 : 3, source.cuisine, source.chain, meal) : [];
  const serves = source ? servesMeal(source, meal) : true;
  const chainHits = searchChains(q);
  const brandHits = searchBrands(q).filter((b) => !chainHits.length || !chainHits.some((ch) => ch.re.test(b.en.toLowerCase())));
  const held = day.out;
  const heldHere = held?.meal === meal;
  const reserve = outReserve(profile, meal, 'usual');
  const done = ticked.includes(meal);
  const mealName = (m: Meal) => tx(MEAL_NAME[m]).toLowerCase();

  const msg: Partial<Record<Status, string>> = {
    looking: L('بندور على الأماكن اللي جنبك.', 'Looking for places near you.'),
    denied: L(`من غير إذن الموقع مش هنعرف الأماكن اللي جنبك. ${g('دور', 'دوري')} بالاسم.`, "Without location access we can't see places near you. Search by name."),
    off: L(`مقدرناش نعرف المكان دلوقتي. ${g('دور', 'دوري')} بالاسم.`, "We couldn't get your location right now. Search by name."),
    none: L(`ملقيناش أماكن قريبة على الخريطة. ${g('دور', 'دوري')} بالاسم.`, 'We found no places near you on the map. Search by name.'),
  };
  // Inside a place's page its name is on top, so "Big Mac (McDonald's)" shows as "Big Mac".
  const dishName = (d: Dish) => tx(d.food.n).replace(/\s*\([^)]*\)$/, '');
  const kcalNote = (d: Dish) => (d.chain ? L('سعرة منشورة', 'kcal published') : L('سعرة تقريبا', 'kcal approx.'));
  const placeSub = (x: Place) => [kindName(x.kind), Number.isFinite(x.m) ? far(x.m) : x.area].filter(Boolean).join(' · ');
  const placeRow = (x: Place, sub: string) => (
    <Pressable key={x.id} onPress={() => choose(x)} accessibilityRole="button"
      style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }, pressed && styles.pressed]}>
      <Logo place={x} size={40} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T kind="h3" numberOfLines={1}>{x.name}</T>
        <T kind="label" numberOfLines={1}>{sub}</T>
      </View>
      <Text style={{ fontFamily: fonts.displaySemi, fontSize: 18, color: c.dim }}>{isEn() ? '›' : '‹'}</Text>
    </Pressable>
  );
  const links = place && !generic ? mapLinks(place, here) : null;
  const ios = Platform.OS === 'ios';

  return (
    <Modal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel={L('قفل', 'Close')} />
        <View style={{ maxHeight: '90%', backgroundColor: c.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 24, gap: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <T kind="h2">{L('أنا برة البيت', "I'm eating out")}</T>
              <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel={L('قفل', 'Close')}>
                <Text style={{ fontFamily: fonts.displaySemi, fontSize: 22, color: c.muted }}>×</Text>
              </Pressable>
            </View>

            {/* 1. Which meal, and holding its calories. */}
            <View style={{ gap: 8 }}>
              <Segmented<Meal> items={MEALS.map((m) => [m, tx(MEAL_NAME[m])] as [Meal, string])} value={meal} onChange={(m) => { setMeal(m); setAdded(''); }} />
              <T kind="small" color={c.muted}>
                {kcalLeft > 0
                  ? L(`${tx(MEAL_NAME[meal])} على قد ${fmt(budget)} سعرة${proteinLeft > 0 ? `، وفاضلك ${fmt(proteinLeft)} جم بروتين النهارده` : ''}.`, `${tx(MEAL_NAME[meal])} within ${fmt(budget)} kcal${proteinLeft > 0 ? `, with ${fmt(proteinLeft)} g protein left today` : ''}.`)
                  : L('سعرات النهارده خلصت، فهنوريك أخف حاجات.', "Today's calories are used up, so here are the lightest options.")}
              </T>
              {held ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.soft, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T kind="h3">{L(`محجوز ${fmt(held.kcal)} سعرة ${toMeal(held.meal)}`, `${fmt(held.kcal)} kcal held for ${mealName(held.meal)}`)}</T>
                    <T kind="label">{L(`لما ${g('تعلم', 'تعلمي')} على ${tx(MEAL_NAME[held.meal])} إنه خلص، السعرات دي بتتحسب لو مفيش أكل متسجل فيه.`, `When you tick ${mealName(held.meal)}, these calories count if nothing is logged in it.`)}</T>
                  </View>
                  <Btn kind="text" title={L('إلغاء', 'Cancel')} onPress={() => update((d) => { const { out: _o, ...rest } = d; return rest; })} />
                </View>
              ) : !done ? (
                <Btn kind="secondary" title={L(`${g('احجز', 'احجزي')} ${fmt(reserve)} سعرة ${toMeal(meal)}`, `Hold ${fmt(reserve)} kcal for ${mealName(meal)}`)}
                  onPress={() => { play('check'); update((d) => ({ ...d, out: { meal, kcal: reserve } })); }} />
              ) : null}
              {!held && !done ? <T kind="label">{L('الحجز بيخلي باقي وجبات النهارده أخف علشان السعرات تكفي. للنهارده بس.', "Holding makes today's other meals lighter so the calories last. Today only.")}</T> : null}
            </View>

            {!place ? (
              /* 2. Find the place. */
              <View style={{ gap: 12 }}>
                <TextInput value={q} onChangeText={setQ} placeholder={L(`${g('دور', 'دوري')} على مطعم بالاسم`, 'Search a restaurant by name')} placeholderTextColor={c.muted}
                  accessibilityLabel={L('اسم المطعم', 'Restaurant name')} autoCorrect={false} returnKeyType="search"
                  style={{ backgroundColor: c.surface, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontFamily: fonts.body, fontSize: 15, color: c.ink, textAlign: START() }} />
                {q.trim().length >= 2 ? (
                  <View>
                    {chainHits.map((ch) => placeRow({ id: 'chain/' + ch.id, name: L(ch.ar, ch.en), kind: ch.kind, m: NaN, lat: 0, lon: 0, chain: ch.id }, L('منيو المحل بالسعرات اللي بينشرها', 'Its menu with the calories it publishes')))}
                    {brandHits.map((b) => placeRow({ id: 'brand/' + b.id, name: L(b.ar, b.en), kind: b.kind, cuisine: b.cuisine, m: NaN, lat: 0, lon: 0 }, L(`${kindName(b.kind)} · سعرات تقريبية`, `${kindName(b.kind)} · approximate calories`)))}
                    {q.trim().length >= 3 && found?.q === q.trim() ? (
                      found.places == null
                        ? <T kind="small" color={c.warn}>{L('مقدرناش ندور على الخريطة دلوقتي.', "We couldn't search the map right now.")}</T>
                        : found.places.filter((x) => !x.chain && !brandOf(x.name)).map((x) => placeRow(x, placeSub(x)))
                    ) : null}
                    {q.trim().length >= 3 && found?.q === q.trim() && found.places?.length === 0 && !chainHits.length && !brandHits.length
                      ? <T kind="small" color={c.muted}>{L(`ملقيناش مطعم بالاسم ده. ${g('اختار', 'اختاري')} نوع الأكل من تحت.`, 'No restaurant found by that name. Pick the kind of food below.')}</T> : null}
                  </View>
                ) : null}

                {status === 'done' ? (
                  <View>
                    <T kind="label">{L('جنبك دلوقتي', 'Near you now')}</T>
                    {places.map((x) => placeRow(x, placeSub(x)))}
                  </View>
                ) : status === 'looking' ? (
                  <T kind="small" color={c.muted}>{msg.looking}</T>
                ) : (
                  <View style={{ gap: 6 }}>
                    {msg[status] ? <T kind="small" color={c.warn}>{msg[status]}</T> : null}
                    <Btn kind="outline" title={status === 'idle' ? L(`${g('دور', 'دوري')} على الأماكن اللي جنبي`, 'Find places near me') : L(g('جرب تاني', 'جربي تاني'), 'Try again')} onPress={look} />
                  </View>
                )}

                <Btn kind="text" title={kinds ? L('إخفاء أنواع الأكل', 'Hide kinds of food') : L(`مش ${g('لاقي', 'لاقية')} المكان؟ ${g('اختار', 'اختاري')} نوع الأكل`, "Can't find the place? Pick the kind of food")} onPress={() => setKinds(!kinds)} />
                {kinds ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {KINDS.filter((k) => meal !== 'breakfast' || BREAKFAST_KINDS.includes(k)).map((k) => <Chip key={k} label={kindName(k)} on={false} onPress={() => choose(kindPlace(k))} />)}
                  </View>
                ) : null}
              </View>
            ) : (
              /* 3. The place's page. */
              <View style={{ gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Logo place={place} size={52} />
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <T kind="h2" numberOfLines={2}>{generic ? kindName(place.kind) : place.name}</T>
                    <T kind="label" numberOfLines={1}>{generic ? L('سعرات تقريبية لحصة عادية', 'Approximate calories for a usual portion') : placeSub(place)}</T>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {links ? <Chip label={ios ? L('خرايط أبل', 'Apple Maps') : L('افتح على الخريطة', 'Open in Maps')} on={false} onPress={() => Linking.openURL(ios ? links.apple : links.google)} /> : null}
                  {links && ios ? <Chip label={L('خرايط جوجل', 'Google Maps')} on={false} onPress={() => Linking.openURL(links.google)} /> : null}
                  <Chip label={L('مكان تاني', 'Another place')} on={false} onPress={() => { setPlace(null); setAdded(''); }} />
                </View>

                <View style={{ gap: 4 }}>
                  {!serves ? <T kind="small" color={c.warn}>{L(`المكان ده غالبا مش بيقدم فطار، فدي أصناف المنيو العادي.`, "This place usually doesn't serve breakfast, so these are from its usual menu.")}</T> : null}
                  {chain ? (
                    <T kind="small" color={c.muted}>{L(`السعرات دي اللي ${chain.ar} بتنشرها.${chain.has === 'kcal' ? ' المحل بينشر السعرات بس، فالبروتين والكارب والدهون مش هيتسجلوا.' : chain.has === 'protein' ? ' المحل بينشر السعرات والبروتين بس، فالكارب والدهون مش هيتسجلوا.' : ''}`,
                      `These are the calories ${chain.en} publishes.${chain.has === 'kcal' ? ' It only publishes calories, so protein, carbs and fat are not logged.' : chain.has === 'protein' ? ' It only publishes calories and protein, so carbs and fat are not logged.' : ''}`)}</T>
                  ) : !generic ? <T kind="small" color={c.muted}>{L('المحل مش بينشر سعراته، فدي سعرات تقريبية لأصناف زي اللي عنده.', "This place doesn't publish its calories, so these are approximate for dishes like its own.")}</T> : null}
                </View>

                {/* A whole meal that fits this meal's calories. */}
                {combo ? (
                  <Card style={{ gap: 8 }}>
                    <Kicker>{L(`وجبة كاملة على قد ${fmt(budget)} سعرة`, `A whole meal within ${fmt(budget)} kcal`)}</Kicker>
                    {combo.items.map((d) => (
                      <View key={d.food.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <T kind="body" style={{ flex: 1 }}>{dishName(d)}</T>
                        <T kind="small" color={c.muted}>{fmt(d.food.kcal)}</T>
                      </View>
                    ))}
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: 2 }}>
                      <Num size={28} weight="black">{fmt(combo.kcal)}</Num>
                      <T kind="small" color={c.muted} style={{ paddingBottom: 4, flex: 1 }}>
                        {L(`سعرة${combo.items.some((d) => !d.chain) ? ' تقريبا' : ''}${combo.p > 0 ? ` · ${fmt(combo.p)} جم بروتين` : ''}`, `kcal${combo.items.some((d) => !d.chain) ? ' approx.' : ''}${combo.p > 0 ? ` · ${fmt(combo.p)} g protein` : ''}`)}
                      </T>
                    </View>
                    {combo.swaps.length ? (
                      <T kind="small" color={c.petrol}>{L(`أخف من الطلب العادي (${fmt(combo.usual)} سعرة): `, `Lighter than the usual order (${fmt(combo.usual)} kcal): `) + combo.swaps.map((s) => (s.to ? L(`${dishName(s.to)} بدل ${dishName(s.from)}`, `${dishName(s.to)} instead of ${dishName(s.from)}`) : L(`من غير ${dishName(s.from)}`, `no ${dishName(s.from)}`))).join(L('، ', ', '))}</T>
                    ) : null}
                    {!combo.fits ? <T kind="small" color={c.warn}>{L('دي أخف وجبة هنا، وبرضه أكتر من اللي فاضل. خلي الوجبة الجاية خفيفة.', "This is the lightest meal here and it's still over. Keep the next meal light.")}</T> : null}
                    <Btn title={L(`${g('ضيف', 'ضيفي')} الوجبة ${toMeal(meal)}`, `Add it to ${mealName(meal)}`)}
                      onPress={() => { play('add'); update((d) => combo.items.reduce((acc, it) => addFood(acc, it.food, meal), d)); setAdded(combo.items.map(dishName).join(L('، ', ', '))); }} />
                  </Card>
                ) : null}

                <View style={{ gap: 0 }}>
                  <T kind="label">{L('أو طبق لوحده', 'Or one dish')}</T>
                  {list.map(({ food, fits, dish }) => {
                    const warn = foodLevel(profile, food) === 'warn';
                    return (
                      <View key={food.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: c.line, paddingVertical: 10 }}>
                        <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                          <T kind="body">{dishName(dish)}</T>
                          <T kind="label">{`${fmt(food.kcal)} ${kcalNote(dish)}${food.p > 0 ? L(` · ${fmt(food.p)} جم بروتين`, ` · ${fmt(food.p)} g protein`) : ''}`}</T>
                          {!fits ? <T kind="label" color={c.warn}>{L('أكتر من اللي فاضل، بس دي أخف حاجة هنا.', "More than you have left, but it's the lightest here.")}</T> : null}
                          {warn ? <T kind="label" color={c.warn}>{L('مش أحسن اختيار لحالتك، لو فيه بديل يبقى أحسن.', 'Not the best for your health; pick another if you can.')}</T> : null}
                        </View>
                        <Pressable onPress={() => { play('add'); update((d) => addFood(d, food, meal)); setAdded(dishName(dish)); }} accessibilityRole="button"
                          accessibilityLabel={L(`إضافة ${dishName(dish)} ${toMeal(meal)}`, `Add ${dishName(dish)} to ${mealName(meal)}`)}
                          style={({ pressed }) => [{ minHeight: 36, minWidth: 36, borderRadius: 999, backgroundColor: c.soft, alignItems: 'center', justifyContent: 'center' }, pressed && styles.pressed]}>
                          <Text style={{ fontFamily: fonts.displaySemi, fontSize: 18, lineHeight: 20, color: c.ink }}>+</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                  {!more && dishes.filter((d) => d.role === 'main' || cafe).length > 3 ? <Btn kind="text" title={L('أطباق أكتر', 'More dishes')} onPress={() => setMore(true)} /> : null}
                </View>
                {added ? <T kind="small" color={c.petrol}>{L(`اتضاف ${added} ${toMeal(meal)}. ${g('علم', 'علمي')} على الوجبة لما ${g('تخلصها', 'تخلصيها')} علشان تتحسب.`, `${added} added to ${mealName(meal)}. Tick the meal when you finish it so it counts.`)}</T> : null}
                <T kind="small" color={c.dim}>{L(...TIP[place.kind](g))}</T>
              </View>
            )}

            <T kind="label" color={c.dim}>{L(`سعرات ${CHAINS.map((x) => x.ar).join('، ')} هي الأرقام اللي المحل بينشرها، وباقي الأماكن سعرات تقريبية. الأماكن من خريطة OpenStreetMap، ومكانك مش بيتحفظ.`,
              `Calories for ${CHAINS.map((x) => x.en).join(', ')} are what each chain publishes; other places are approximate. Places come from OpenStreetMap, and your location isn't saved.`)}</T>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
