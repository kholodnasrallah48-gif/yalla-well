// The content modules: the home page's day timeline, plan example, before and after, numbers and feature teaser, and
// the features page's sections (food, eating out, training, health, for women, reports, progress, streak, the captain).
// Every module is written once with L(arabic, english). App screens live in static/media/modules as
// <name>-ar.webp and <name>-en.webp (phones 600 px wide; report sheets 909 x 1287).
// Copy rules as in pages.mjs: light colloquial Arabic, gender neutral, "دايت" never "رجيم", no disease or medicine
// names (lab test names are fine), "ستريك" and "فريز" for the streak and its freezes.
import { champ, icon } from './layout.mjs';

/** A module screen for the page's language. */
const shot = (ctx, name) => `${ctx.root}static/media/modules/${name}-${ctx.lang}.webp`;

/** One app screen in a phone frame. */
const phone = (ctx, name, alt, cls = '') =>
  `<figure class="phone m-ph ${cls}"><img src="${shot(ctx, name)}" alt="${alt}" width="600" height="1298" loading="lazy" decoding="async"></figure>`;

/** Several screens stacked in one phone frame; the script shows one at a time (the first without it). */
const stackPhone = (ctx, id, items, cls = '') =>
  `<figure class="phone m-ph ${cls}"><div class="m-stack" id="${id}">${items.map(([name, alt], i) =>
    `<img${i === 0 ? ' class="on"' : ' aria-hidden="true"'} src="${shot(ctx, name)}" alt="${alt}" width="600" height="1298" loading="lazy" decoding="async">`).join('')}</div></figure>`;

const head = (k, h, lead, id) => `<div class="sec-head reveal"><p class="kicker">${k}</p><h2 class="h2"${id ? ` id="${id}"` : ''}>${h}</h2>${lead ? `<p class="lead">${lead}</p>` : ''}</div>`;

const shotCard = (ctx, name, alt, h, p) =>
  `<div class="m-shot reveal">${phone(ctx, name, alt)}<div><h3 class="h3">${h}</h3><p>${p}</p></div></div>`;

const json = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

// ---------- home ----------

/** 1. A day with the app: the steps scroll by while one sticky phone changes its screen. */
export function dayModule(ctx) {
  const { L } = ctx;
  const steps = [
    ['7:30', L('الصبح', 'Morning'), L('صباح الخير', 'Good morning'), L('اليوم بيفتح بجملة من الكابتن، وعدد الأيام اللي ورا بعض، والفريز اللي فاضل.', 'The day opens with a line from the Captain, your streak and the freezes you have left.'),
      'day-morning', L('صفحة اليوم الصبح: صباح الخير، والستريك، وجملة الكابتن', 'Today in the morning: good morning, the streak and a line from the Captain')],
    ['7:40', L('الصبح', 'Morning'), L('سؤال الصبح', 'Morning check-in'), L('الطاقة والألم والنوم في ٣ ضغطات. ولو الإجابات بتقول إن اليوم صعب، التمرين بيخف لوحده.', 'Energy, pain and sleep in three taps. If the answers point to a rough day, the workout gets lighter on its own.'),
      'day-checkin', L('سؤال الصبح عن الطاقة والألم والنوم', 'The morning check-in on energy, pain and sleep')],
    ['8:30', L('الفطار', 'Breakfast'), L('فطار على قد السعرات', 'A breakfast that fits'), L('اقتراح على قد اللي فاضل في اليوم، والوجبة بتدخل الحساب لما يتحط عليها علامة صح.', "An idea sized to what's left of your day, and the meal counts once it's ticked."),
      'day-breakfast', L('صفحة الأكل والفطار متسجل', 'The Food page with breakfast logged')],
    ['2:00', L('الضهر', 'Afternoon'), L('الدوا في ميعاده', 'Medicine on time'), L('تذكير على الموبايل في الميعاد، ومعاه مكانه من الأكل. وعلامة صح على اللي اتاخد.', "A reminder on your phone at the right time, with where it fits around your meals. Tick it once it's taken."),
      'day-meds', L('أدوية وفيتامينات النهارده بمواعيدها', "Today's medicines and supplements with their times")],
    ['6:00', L('بالليل', 'Evening'), L('تمرين النهارده', "Today's workout"), L('جيم أو بيت، والتمارين جاهزة بمجموعاتها وعداتها والوزن المقترح.', 'Gym or home, with every exercise ready: sets, reps and a suggested weight.'),
      'train-day', L('تمرين النهارده في الجيم', "Today's gym workout")],
    [L('طول اليوم', 'All day'), '', L('المياه', 'Water'), L('كوبايات بتتملي بضغطة، والهدف محسوب على جسمك ونشاطك.', 'Cups fill with a tap, and the goal is worked out from your body and activity.'),
      'day-water', L('كارت المياه بالكوبايات', 'The water card with its cups')],
    ['11:00', L('بالليل', 'Night'), L('النوم', 'Sleep'), L('ميعاد النوم والصحيان، وعدد الساعات على مدار الأسبوع. والساعة ١٢ اليوم بيتقفل ويدخل في تقرير الأسبوع.', 'Bed and wake times, and your hours across the week. At midnight the day locks and goes into your weekly report.'),
      'day-sleep', L('صفحة الصحة: النوم وعدد الساعات', 'The Health page: sleep and hours')],
  ];
  return `<section class="m-mod" id="day" aria-labelledby="day-title">
  <div class="wrap">
    ${head(L('يومك معانا', 'A day with us'), L('من أول الصبح لحد النوم.', 'From morning to bedtime.'), L('ده شكل يوم عادي مع يلا ويل. كل لحظة ليها شاشتها، وكلهم عارفين بعض.', 'Here is an ordinary day with Yalla Well. Each moment has its own screen, and they all know about each other.'), 'day-title')}
    <div class="m-day" data-day>
      <ol class="m-steps m-rail">
        ${steps.map(([t, w, h, p], i) => `<li class="m-step${i === 0 ? ' on' : ''}" data-i="${i}"><div class="m-t"><span class="m-tn" dir="ltr">${t}</span>${w ? `<span class="m-tw">${w}</span>` : ''}</div><h3 class="h3">${h}</h3><p>${p}</p></li>`).join('')}
      </ol>
      <div class="m-day-phone">
        ${stackPhone(ctx, 'dayStack', steps.map((s) => [s[4], s[5]]))}
        <div class="m-clock" aria-hidden="true"><span class="num" dir="ltr">${steps[0][0]}</span><span>${steps[0][1]}</span></div>
      </div>
    </div>
  </div>
</section>`;
}

/** 2. The plan example: a few answers change an example plan. */
export function planModule(ctx) {
  const { L } = ctx;
  const qs = [
    ['goal', L('الهدف', 'Goal'), [['lose', L('خسارة وزن', 'Lose weight')], ['keep', L('ثبات', 'Stay steady')], ['gain', L('عضل', 'Build muscle')]]],
    ['days', L('أيام التمرين في الأسبوع', 'Training days a week'), [['3', L('٣ أيام', '3 days')], ['4', L('٤ أيام', '4 days')], ['5', L('٥ أيام', '5 days')]]],
    ['place', L('التمرين فين', 'Where you train'), [['gym', L('جيم', 'Gym')], ['home', L('بيت', 'Home')]]],
    ['health', L('صحتك', 'Your health'), [['none', L('مفيش', 'Nothing to note')], ['chronic', L('حالة مزمنة', 'A long-term condition')], ['allergy', L('حساسية أكل', 'A food allergy')]]],
  ];
  const data = {
    split: {
      gym: { 3: L('الجسم كله، ٣ أيام في الجيم', 'Full body, 3 gym days'), 4: L('علوي وسفلي، ٤ أيام في الجيم', 'Upper and lower, 4 gym days'), 5: L('دفع وسحب ورجل وعلوي وسفلي، ٥ أيام', 'Push, pull, legs, upper and lower, 5 days') },
      home: { 3: L('الجسم كله في البيت، ٣ أيام', 'Full body at home, 3 days'), 4: L('علوي وسفلي في البيت، ٤ أيام', 'Upper and lower at home, 4 days'), 5: L('٥ أيام في البيت بالدمبل ووزن الجسم', '5 home days with dumbbells and bodyweight') },
    },
    today: {
      gym: { 3: L('جسم كله: ٦ تمارين', 'Full body: 6 exercises'), 4: L('علوي: صدر وضهر وكتف، ٦ تمارين', 'Upper: chest, back and shoulders, 6 exercises'), 5: L('دفع: صدر وكتف وترايسبس، ٦ تمارين', 'Push: chest, shoulders and triceps, 6 exercises') },
      home: { 3: L('جسم كله في البيت: ٥ تمارين', 'Full body at home: 5 exercises'), 4: L('علوي في البيت: ٥ تمارين', 'Upper body at home: 5 exercises'), 5: L('أرداف ورجل في البيت: ٥ تمارين', 'Glutes and legs at home: 5 exercises') },
    },
    effort: { normal: L('، مجهود ٧ من ١٠', ', effort 7 of 10'), gentle: L('، مجهود ٥ لـ٦ من ١٠', ', effort 5 to 6 of 10') },
    meals: {
      lose: [L('فول بزيت الزيتون والطماطم', 'Ful with olive oil and tomato'), L('كبسة دجاج خفيفة بالرز البني', 'Light chicken kabsa with brown rice'), L('زبادي بالفواكه', 'Yogurt with fruit'), L('شوربة عدس وسلطة', 'Lentil soup and salad')],
      keep: [L('بلاليط خفيف بالبيض والهيل', 'Light balaleet with egg and cardamom'), L('فراخ مشوية ورز وخضار', 'Grilled chicken, rice and vegetables'), L('تفاحة بالجبنة القريش والقرفة', 'Apple with areesh cheese and cinnamon'), L('شيش طاووق وسلطة', 'Shish tawook and salad')],
      gain: [L('بيض وجبنة وعيش بلدي', 'Eggs, cheese and baladi bread'), L('كفتة لحمة بالرز والخضار', 'Beef kofta with rice and vegetables'), L('زبادي بالشوفان والموز', 'Yogurt with oats and banana'), L('تونة بالمكرونة الخفيفة', 'Tuna with light pasta')],
    },
    notes: {
      none: L('مفيش ملاحظات خاصة، والخطة ماشية على هدفك.', 'Nothing special to note; the plan follows your goal.'),
      chronic: L('بنسأل عن الحالة وأدويتها، والعجز في السعرات بيبقى أهدى، والتمرين بمجهود مناسب، والتمارين اللي مش مناسبة بتتبدل. ولو التقليل مش آمن، بنقترح الكلام مع الدكتور الأول.', "We ask about the condition and its medicines. The calorie deficit gets gentler, the training effort is set to suit, and exercises that don't fit are swapped. If cutting isn't safe, we suggest talking to your doctor first."),
      allergy: L('الأكلة اللي عندك حساسية منها مش بتظهر في الوصفات، ولو اتسجلت بيظهر عليها تنبيه أحمر ومعاه بدايل.', "Foods you're allergic to stay out of the recipes, and if one gets logged it shows a red alert with swaps."),
    },
  };
  const rows = [['m0', L('الفطار', 'Breakfast'), 410], ['m1', L('الغدا', 'Lunch'), 580], ['m2', L('السناك', 'Snack'), 200], ['m3', L('العشا', 'Dinner'), 460]];
  return `<section class="m-mod" id="plan" aria-labelledby="plan-title">
  <div class="wrap">
    ${head(L('خطة على مقاسك', 'Made to fit'), L('كام إجابة، والخطة بتتفصل قدامك.', 'A few answers, and the plan takes shape.'), L('كام سؤال بسيط، والخطة بتتغير مع كل إجابة. الأرقام هنا مثال، والحقيقية بتطلع من سنك وطولك ووزنك ونشاطك.', 'Pick a few answers and watch the plan change. These numbers are an example; your real ones come from your age, height, weight and activity.'), 'plan-title')}
    <div class="m-builder" data-plan>
      <div class="m-card reveal">
        ${qs.map(([q, label, opts]) => `<div class="m-q"><p class="m-q-l" id="q-${q}">${label}</p><div class="chips" role="group" aria-labelledby="q-${q}" data-q="${q}">${opts.map(([v, t], i) => `<button class="chip" type="button" data-v="${v}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div></div>`).join('')}
      </div>
      <div class="m-card m-plan reveal" aria-live="polite">
        <div class="m-plan-top"><p class="kicker">${L('خطتك', 'Your plan')}</p><span class="m-ex">${L('مثال', 'Example')}</span></div>
        <div class="m-kcal"><span class="num" data-p="k" dir="ltr">1,650</span><span class="muted">${L('سعرة في اليوم', 'kcal a day')}</span></div>
        <div class="m-macros"><span>${L('بروتين', 'Protein')} <b data-p="p">135</b> ${L('جم', 'g')}</span><span>${L('مياه', 'Water')} <b data-p="w">10</b> ${L('كوبايات', 'cups')}</span></div>
        <div class="m-row"><span class="m-k">${L('نظام التمرين', 'Training plan')}</span><span class="m-v" data-p="s">${data.split.gym[3]}</span></div>
        <div class="m-row"><span class="m-k">${L('تمرين النهارده', "Today's workout")}</span><span class="m-v" data-p="t">${data.today.gym[3]}${data.effort.normal}</span></div>
        ${rows.map(([id, k, kc], i) => `<div class="m-row"><span class="m-k">${k}</span><span class="m-v"><span data-p="${id}">${data.meals.lose[i]}</span> · <span class="num" data-p="${id}k">${kc}</span></span></div>`).join('')}
        <div class="m-note">${icon('heart', 18)}<span data-p="n">${data.notes.none}</span></div>
      </div>
      <script type="application/json" class="m-plan-data">${json(data)}</script>
    </div>
  </div>
</section>`;
}

/** 3. Before and after: a pile of separate apps and papers, then the app. */
export function beforeAfter(ctx) {
  const { L } = ctx;
  const ic = (bg, d) => `<span class="m-bic" style="background:${bg}"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="${d}"/></svg></span>`;
  return `<section class="m-mod" id="one" aria-labelledby="one-title">
  <div class="wrap">
    ${head(L('قبل وبعد', 'Before and after'), L('كل ده، في شاشة.', 'All of that, on one screen.'), '', 'one-title')}
    <div class="m-ba">
      <div class="m-side reveal">
        <h3 class="h3">${L('من غيره', 'Without it')}</h3>
        <p class="m-cap">${L('تطبيق لكل حاجة، وورق في الدرج', 'An app for everything, and papers in a drawer')}</p>
        <div class="m-pile" aria-hidden="true">
          <div class="m-bit m-b1">${ic('#ff7a45', 'M12 21c4 0 6-2.7 6-6 0-4-3-6-4-9-1 2-2 3-3 3 0-2-1-4-1-6-2 2-4 6-4 10 0 4.5 2.5 8 6 8z')}<b>${L('عداد سعرات', 'Calorie counter')}</b><span class="muted">${L('اشتراك لوحده', 'Separate subscription')}</span></div>
          <div class="m-bit is-sticky m-b2"><b>${L('نوتس الأكل', 'Food notes')}</b><span>${L('فطار: ٢ بيض وعيش', 'Breakfast: 2 eggs, toast')}</span><span>${L('غدا: نسيت أكتب', 'Lunch: forgot to write it')}</span></div>
          <div class="m-bit is-alarm m-b3"><span class="muted">${L('منبه', 'Alarm')}</span><span class="num" dir="ltr">8:00</span><b>${L('الدوا', 'Medicine')}</b></div>
          <div class="m-bit is-paper m-b4"><b>${L('نتيجة تحليل', 'Lab result')}</b><span class="m-ln"></span><span class="m-ln is-r"></span><span class="m-ln"></span><span class="m-ln is-s"></span><span class="m-old">${L('من ٦ شهور، في الدرج', '6 months old, in a drawer')}</span></div>
          <div class="m-bit m-b5">${ic('#5a6cff', 'M3 10v4M6 7v10M18 7v10M21 10v4M6 12h12')}<b>${L('تطبيق تمرين', 'Workout app')}</b><span class="muted">${L('مش عارف حاجة عن أكلك', 'Knows nothing about your food')}</span></div>
          <div class="m-bit m-b6">${ic('#8e5cff', 'M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z')}<b>${L('تطبيق نوم', 'Sleep app')}</b><span class="muted">${L('اشتراك تاني', 'Another subscription')}</span></div>
        </div>
      </div>
      <div class="m-side is-with reveal">
        <h3 class="h3">${L('مع يلا ويل', 'With Yalla Well')}</h3>
        <p class="m-cap">${L('الأكل عارف التمرين، والتمرين عارف النوم والأدوية', 'Your food knows your training, and your training knows your sleep and medicines')}</p>
        ${phone(ctx, 'home', L('صفحة اليوم في يلا ويل', 'The Today page in Yalla Well'))}
      </div>
    </div>
  </div>
</section>`;
}

/** 12. The numbers. They read right at rest and count up from a smaller number when they come into view. */
export function numbersModule(ctx) {
  const { L } = ctx;
  const n = (to, from, plus, l, s) => `<div class="m-nb reveal"><div class="num"><span data-to="${to}" data-from="${from}">${to}</span>${plus ? '<small>+</small>' : ''}</div><div class="m-l">${l}</div><div class="m-s">${s}</div></div>`;
  return `<section class="m-mod" id="numbers" aria-labelledby="numbers-title">
  <div class="wrap">
    ${head(L('بالأرقام', 'In numbers'), L('أرقام بتتكلم.', 'By the numbers.'), '', 'numbers-title')}
    <div class="m-nums">
      ${n(151, 120, false, L('وصفة', 'recipes'), L('بنسخ أخف، والمقادير على قد السعرات', 'Lighter versions, with amounts sized to your calories'))}
      ${n(350, 280, true, L('أكلة', 'foods'), L('كل واحدة محسوبة بالجرام', 'Each one counted by the gram'))}
      ${n(9, 6, false, L('أنظمة تمرين', 'training plans'), L('من ٣ لـ٦ أيام، جيم أو بيت', '3 to 6 days a week, gym or home'))}
      ${n(8, 5, false, L('تحاليل بتتابع', 'lab tests tracked'), L('بتذكير قبل الميعاد ومقارنة النتايج', 'With a reminder before each is due and a comparison of results'))}
      ${n(2, 1, false, L('لغتين', 'languages'), L('عربي وإنجليزي، والتغيير بضغطة', 'Arabic and English, switched with a tap'))}
      <div class="m-nb reveal"><div class="m-theme" aria-hidden="true"><span class="m-sw is-d"><i></i><i></i><i></i><i></i></span><span class="m-sw is-l"><i></i><i></i><i></i><i></i></span></div><div class="m-l">${L('لايت ودارك', 'Light and dark')}</div><div class="m-s">${L('على حسب الموبايل، أو على مزاجك', 'Follows your phone, or your choice')}</div></div>
    </div>
  </div>
</section>`;
}

/** The features page sections, for the home page's teaser row and the features page's jump bar. */
export const SECTIONS = (L) => [
  ['food', 'plate', L('الأكل', 'Food'), L('بحث بالاسم ووصفات على قد السعرات', 'Search by name, recipes sized to your calories')],
  ['outside', 'pin', L('أنا برة البيت', 'Eating out'), L('وجبة من المطعم على قد اللي فاضل', "A restaurant meal sized to what's left")],
  ['training', 'dumbbell', L('التمرين', 'Training'), L('جيم أو بيت، وسجل لكل تمرين', 'Gym or home, with a logbook for every lift')],
  ['health', 'pill', L('صحتك', 'Your health'), L('الأدوية والتحاليل وتقرير للدكتور', 'Medicines, lab tests and a doctor report')],
  ['women', 'heart', L('للستات', 'For women'), L('الدورة والحمل جوه الخطة', 'Your cycle and pregnancy, inside the plan')],
  ['reports', 'doc', L('التقارير', 'Reports'), L('ملفات PDF للأسبوع والتحاليل والدكتور', 'PDFs for your week, your labs and your doctor')],
  ['progress', 'chart', L('التقدم', 'Progress'), L('الوزن والمقاسات وصورة الإنجاز', 'Weight, measurements and progress photos')],
  ['streak', 'flame', L('الستريك', 'Streak'), L('ستريك وفريز ونقط', 'Streaks, freezes and points')],
  ['captain', 'chat', L('الكابتن', 'The Captain'), L('جملة على قد يومك', 'A line that fits your day')],
];

/** A compact row of links to the features page sections. */
export function teaser(ctx) {
  const { L } = ctx;
  return `<section class="m-mod m-teaser-sec" aria-labelledby="teaser-title">
  <div class="wrap">
    ${head(L('جوه التطبيق', 'Inside the app'), L('كل قسم بتفاصيله.', 'Every part, in detail.'), '', 'teaser-title')}
    <ul class="m-teaser" role="list">
      ${SECTIONS(L).map(([id, ic, t, d]) => `<li class="reveal"><a href="features.html#${id}"><span class="m-tic">${icon(ic, 20)}</span><span class="m-tt"><b>${t}</b><span>${d}</span></span></a></li>`).join('')}
    </ul>
    <p class="more-link"><a class="link-arrow" href="features.html">${L('كل المميزات', 'All features')} ${icon('arrow', 18)}</a></p>
  </div>
</section>`;
}

// ---------- features ----------

/** 4. Food. */
export function foodModule(ctx) {
  const { L } = ctx;
  return `<section class="m-mod" id="food" aria-labelledby="food-title">
  <div class="wrap">
    ${head(L('الأكل', 'Food'), L('أي أكلة، بسعراتها.', 'Any food, with its calories.'), L('بحث بالاسم، ووصفات بتتظبط على اللي فاضل في اليوم، وتنبيه لما أكلة متكونش مناسبة لحالتك.', "Search by name, recipes that adjust to what's left of your day, and an alert when a food doesn't suit you."), 'food-title')}
    <div class="m-grid4">
      ${shotCard(ctx, 'food-search', L('بحث عن جبنة: كل نوع بسعراته بالجرام', 'A search for cheese: each kind with its calories by weight'), L('بحث بالاسم', 'Search by name'), L('أكتر من ٣٥٠ أكلة، كل واحدة بوزنها وسعراتها والبروتين والكارب والدهون.', 'More than 350 foods, each with its weight, calories, protein, carbs and fat.'))}
      ${shotCard(ctx, 'food-suggest', L('اقتراح فطار على قد السعرات اللي فاضلة', 'A breakfast idea sized to the calories left'), L('اقتراح على قد اللي فاضل', "Ideas that fit what's left"), L('الوجبة الجاية بتتقترح على قد السعرات الباقية، مش رقم ثابت.', 'The next meal is suggested from the calories you have left, not a fixed number.'))}
      ${shotCard(ctx, 'food-recipe', L('وصفة مقاديرها متظبطة على السعرات', 'A recipe with amounts set to the calories'), L('وصفات بنسخ أخف', 'Lighter recipes'), L('١٥١ وصفة من المطبخ العربي، والمقادير بتتغير مع السعرات.', '151 recipes from Arab kitchens, with amounts that change with your calories.'))}
      ${shotCard(ctx, 'food-warn', L('تنبيه أحمر: أكلة مش مناسبة، وبدايل أحسن', 'A red alert: a food that does not fit, with better swaps'), L('تنبيه وبدايل', 'Alerts and swaps'), L('لو أكلة مش مناسبة لحالتك أو فيها حساسية، بيظهر تنبيه أحمر ومعاه بدايل أخف.', "If a food doesn't suit your health or you're allergic to it, a red alert shows up with lighter swaps."))}
    </div>
    <div class="tiles m-food-more">
      <div class="tile reveal"><span class="tile-ic">${icon('plate', 24)}</span><h3>${L('حساسية الأكل', 'Food allergies')}</h3><p>${L('بنسأل عنها في أول مرة: مكسرات، أو لبن، أو بيض، أو سمك، أو قمح، أو أي أكل تاني بالاسم. الوصفات اللي فيها الأكل ده مش بتظهر، ولو اتسجل بيظهر تنبيه أحمر.', "Asked the first time: nuts, milk, eggs, fish, wheat or any other food by name. Recipes with it stay out of your suggestions, and logging it shows a red alert.")}</p></div>
      <div class="tile reveal"><span class="tile-ic">${icon('doc', 24)}</span><h3>${L('نظامك الخاص', 'Your own plan')}</h3><p>${L('لو فيه نظام أكل من دكتور أو أخصائي تغذية، أرقامه بتتسجل والتطبيق بيمشي عليها بدل حسابه هو.', 'If a doctor or dietitian gave you a plan, enter its numbers and the app follows them instead of its own.')}</p></div>
    </div>
    <p class="m-disc reveal">${L('قراءة الباركود للمنتجات المغلفة في تطبيق الموبايل، ولو الأكلة مش موجودة، فيه بحث في قواعد بيانات الأكل العامة.', "Barcode scanning for packaged food is in the phone app, and foods that aren't listed can be found in public food databases.")}</p>
  </div>
</section>`;
}

/** 5. Eating out: four steps that play in turn, with the phone following. */
export function outModule(ctx) {
  const { L } = ctx;
  const steps = [
    [L('الوجبة اللي برة', 'Which meal'), L('فطار أو غدا أو سناك أو عشا، وبنقول قد إيه فاضل ليها.', 'Breakfast, lunch, a snack or dinner, and how much is left for it.'), 'out-start', L('أنا برة البيت: اختيار الوجبة', 'Eating out: choosing the meal')],
    [L('المطعم', 'The place'), L('بحث بالاسم، أو الأماكن اللي جنبك على الخريطة.', 'Search by name, or find places near you on the map.'), 'out-search', L('بحث عن المطعم بالاسم', 'Searching for the restaurant by name')],
    [L('وجبة كاملة على قدك', 'A whole meal that fits'), L('طبق ومشروب على قد السعرات، وأخف من الطلب العادي.', 'A dish and a drink within your calories, lighter than the usual order.'), 'out-place', L('وجبة كاملة على قد ٥٤٦ سعرة', 'A whole meal within 546 kcal')],
    [L('اتحجزت', 'Held'), L('السعرات بتتحجز، وباقي وجبات اليوم بتخف علشانها.', "The calories are held, and the day's other meals get lighter to make room."), 'out-held', L('الوجبة اتحجزت للغدا', 'The meal is held for lunch')],
  ];
  const chains = ["McDonald's", 'KFC', 'Starbucks', 'Tim Hortons', 'Zaatar W Zeit', 'Shawarmer'];
  return `<section class="m-mod" id="outside" aria-labelledby="outside-title">
  <div class="wrap">
    <div class="m-out" data-out>
      <div class="m-opane reveal">
        <p class="kicker">${L('أنا برة البيت', 'Eating out')}</p>
        <h2 class="h2" id="outside-title">${L('الأكل برة، محسوب برضه.', 'Eating out still counts.')}</h2>
        <p class="lead">${L('المطعم بيتحدد، والوجبة الكاملة بتطلع على قد السعرات، وبتتحجز من بدري علشان باقي اليوم يتظبط عليها.', 'Pick the place, get a whole meal that fits your calories, and hold it ahead of time so the rest of the day adjusts around it.')}</p>
        <ol class="m-olist">
          ${steps.map(([b, d], i) => `<li><button type="button" aria-pressed="${i === 0}" data-i="${i}"><span class="m-n num">${i + 1}</span><span><b>${b}</b><span class="m-d">${d}</span><span class="m-bar" aria-hidden="true"><i></i></span></span></button></li>`).join('')}
        </ol>
        <div class="m-chains" role="list" aria-label="${L('مطاعم سعراتها منشورة', 'Chains with published calories')}">${chains.map((c) => `<span role="listitem" lang="en" dir="ltr">${c}</span>`).join('')}</div>
        <p class="small muted m-chains-note">${L('الأماكن دي بأرقام المنيو المنشورة، وباقي الأماكن سعراتها تقريبية.', 'These use the calories each chain publishes; other places are approximate.')}</p>
      </div>
      ${stackPhone(ctx, 'outStack', steps.map((s) => [s[2], s[3]]), 'm-out-ph')}
    </div>
  </div>
</section>`;
}

/** 6. Training. */
export function trainModule(ctx) {
  const { L } = ctx;
  const week = [['g', L('جيم', 'Gym'), L('سبت', 'Sat')], ['', L('راحة', 'Rest'), L('أحد', 'Sun')], ['g', L('جيم', 'Gym'), L('اتنين', 'Mon')], ['', L('راحة', 'Rest'), L('تلات', 'Tue')], ['h', L('بيت', 'Home'), L('أربع', 'Wed')], ['', L('راحة', 'Rest'), L('خميس', 'Thu')], ['g', L('جيم', 'Gym'), L('جمعة', 'Fri')]];
  return `<section class="m-mod" id="training" aria-labelledby="training-title">
  <div class="wrap">
    ${head(L('التمرين', 'Training'), L('كل يوم ليه تمرينه.', 'Every day has its workout.'), L('جيم أو بيت أو راحة، يوم بيوم. والجهاز لو مشغول، فيه نسخة بالأوزان الحرة لنفس التمرين.', "Gym, home or rest, day by day. If a machine is taken, there's a free-weight version of the same exercise."), 'training-title')}
    <div class="m-train-top">
      <div class="m-card reveal">
        <h3 class="h3">${L('أسبوع على مزاجك', 'A week your way')}</h3>
        <p class="muted small m-sub">${L('كل يوم بيتحدد جيم أو بيت أو راحة، والتمارين بتتغير على حسبه.', 'Set each day to gym, home or rest, and the exercises change to match.')}</p>
        <div class="m-wk">${week.map(([c, t, d]) => `<div${c ? ` class="is-${c}"` : ''}><b>${t}</b>${d}</div>`).join('')}</div>
      </div>
      <div class="m-card reveal">
        <h3 class="h3">${L('عداد الراحة', 'Rest timer')}</h3>
        <p class="muted small m-sub">${L('بعد كل مجموعة بيبدأ لوحده، ويرن لما الراحة تخلص.', 'It starts by itself after each set and chimes when the rest is over.')}</p>
        <div class="m-timer" data-timer>
          <div class="m-ring" aria-hidden="true"><span class="m-ring-tr"></span><span class="m-half is-r"><i></i></span><span class="m-half is-l"><i></i></span><span class="m-ring-v num">01:00</span></div>
          <div class="m-timer-c"><button class="btn btn-primary btn-sm" type="button" data-start="${L('راحة ٦٠ ثانية', '60 s rest')}" data-skip="${L('تخطي', 'Skip')}" data-go="${L('يلا', 'Go')}">${L('راحة ٦٠ ثانية', '60 s rest')}</button><span class="small muted">${L('مجموعة ١ من ٣ · ٢٠ كجم × ١٥', 'Set 1 of 3 · 20 kg × 15')}</span></div>
        </div>
      </div>
    </div>
    <div class="m-grid4">
      ${shotCard(ctx, 'train-day', L('تمرين يوم دفع في الجيم', 'A push day at the gym'), L('تمرين النهارده', "Today's workout"), L('المجموعات والعدات والراحة لكل تمرين، و٩ أنظمة من ٣ لـ٦ أيام.', 'Sets, reps and rest for every exercise, across 9 plans of 3 to 6 days.'))}
      ${shotCard(ctx, 'train-swap', L('نفس التمرين بالأوزان الحرة أو بالجهاز', 'The same exercise with free weights or a machine'), L('جهاز أو أوزان حرة', 'Machine or free weights'), L('كل تمرين ليه نسختين، والاختيار بيفضل محفوظ للمرة الجاية.', 'Every exercise has two versions, and your pick is saved for next time.'))}
      ${shotCard(ctx, 'train-rest', L('عداد الراحة بعد تسجيل مجموعة', 'The rest timer after logging a set'), L('تسجيل وراحة', 'Log and rest'), L('الوزن والعدات لكل مجموعة، وعداد الراحة بيشتغل لوحده.', 'Weight and reps for each set, and the rest timer starts on its own.'))}
      ${shotCard(ctx, 'train-log', L('سجل التمرين: أحسن رقم والهدف الجاي', 'The logbook: best lift and next goal'), L('سجل الأوزان', 'Your logbook'), L('أحسن رقم، والهدف الجاي، وعمود لكل جلسة. والوزن المقترح بيزيد لما العدات تكمل.', 'Your best lift, the next goal and a bar for every session. The suggested weight goes up once you hit all your reps.'))}
    </div>
  </div>
</section>`;
}

/** 7. Health. */
export function healthModule(ctx) {
  const { L } = ctx;
  const card = (h, p, media) => `<div class="m-card m-hcard reveal"><div><h3 class="h3">${h}</h3><p class="muted small">${p}</p></div>${media}</div>`;
  return `<section class="m-mod" id="health" aria-labelledby="health-title">
  <div class="wrap">
    ${head(L('صحتك', 'Your health'), L('الخطة عارفة حالتك.', 'The plan knows your health.'), L('الأدوية بمواعيدها مع الأكل، ويوم تعبان معناه تمرين أخف، والتحاليل وتقرير الدكتور جاهزين في أي وقت.', 'Medicines timed around your meals, a lighter workout on a rough day, and lab results and a doctor report ready whenever you need them.'), 'health-title')}
    <div class="m-grid2">
      ${card(L('الأدوية مع الوجبات', 'Medicines with meals'), L('كل دوا بجرعته وميعاده، ومكانه من الأكل: قبله أو معاه أو بعده. وتطبيق الموبايل بيفكر بيه في الميعاد.', 'Each one with its dose and time, and where it sits around food: before, with or after. The phone app reminds you on time.'), phone(ctx, 'day-meds', L('أدوية وفيتامينات النهارده بمواعيدها', "Today's medicines and supplements with their times"), 'is-sm'))}
      ${card(L('يوم صعب؟ الخطة بتخف', 'A rough day? The plan eases off'), L('لو الطاقة قليلة والألم جامد والنوم وحش، تمرين النهارده بيتحول ليوم تعافي خفيف لوحده. ولو اليوم طلع كويس، بيرجع بضغطة.', 'When energy is low, pain is bad and sleep was poor, today\'s workout turns into an easy recovery day on its own. If the day turns out fine, one tap brings it back.'), phone(ctx, 'health-light', L('تمرين اليوم اتحول ليوم تعافي خفيف', "Today's workout turned into an easy recovery day"), 'is-sm'))}
      ${card(L('التحاليل ومقارنتها', 'Lab results, compared'), L('النتيجة والتاريخ، وتذكير قبل التحليل الجاي. و٨ تحاليل بتتابع، وتقرير PDF بيقارن آخر ٣ نتايج لكل تحليل.', 'The result and the date, with a reminder before the next test. 8 tests are tracked, and a PDF compares the last 3 results of each.'), phone(ctx, 'health-labs', L('كارت التحاليل والنتايج', 'The lab results card'), 'is-sm'))}
      ${card(L('تقرير للدكتور', 'A report for your doctor'), L('آخر ٤ أسابيع في ملف PDF: الالتزام بالدوا، والطاقة والألم والنوم، والأيام الصعبة، والتمرين، والتحاليل. ينفع يتطبع أو يتبعت.', 'The last 4 weeks in a PDF: medicines taken, energy, pain and sleep, rough days, workouts and lab results. Print it or send it.'), `<div class="m-paper"><img src="${shot(ctx, 'rep-doctor')}" alt="${L('صفحة من تقرير الدكتور', 'A page of the doctor report')}" width="909" height="1287" loading="lazy" decoding="async"></div>`)}
    </div>
    <p class="m-disc reveal">${L('يلا ويل بيساعد في التنظيم والمتابعة، ومش بيشخص. والقرار في الدوا أو الأكل أو التمرين بيكون مع الدكتور.', "Yalla Well helps you organise and keep track. It doesn't diagnose, and decisions about medicine, food or training are made with your doctor.")}</p>
  </div>
</section>`;
}

/** 8. For women. */
export function womenModule(ctx) {
  const { L } = ctx;
  const card = (name, alt, w, h) => `<div class="m-cardimg"><img src="${shot(ctx, name)}" alt="${alt}" width="${w}" height="${h}" loading="lazy" decoding="async"></div>`;
  const txt = (h, p) => `<div><h3 class="h3">${h}</h3><p class="muted small">${p}</p></div>`;
  return `<section class="m-mod" id="women" aria-labelledby="women-title">
  <div class="wrap">
    ${head(L('للستات', 'For women'), L('الدورة والحمل، والخطة معاهم.', 'Your cycle and pregnancy, inside the plan.'), L('متابعة الدورة والحمل جوه نفس الخطة، فالتمرين والسعرات بيتغيروا على حسب اليوم والشهر.', 'Period and pregnancy tracking live in the same plan, so training and calories change with the day and the month.'), 'women-title')}
    <div class="m-women">
      <div class="m-wcol reveal">${card('women-cyclecard', L('كارت الدورة: اليوم التاني، والجاية متوقعة إمتى', 'The period card: day 2, and when the next one is expected'), 600, 315)}${txt(L('الدورة', 'Your cycle'), L('تسجيل أول يوم بس، والتطبيق بيحسب الدورة الجاية وأيام التبويض من التواريخ اللي فاتت.', 'Log the first day only, and the app works out your next period and fertile days from past dates.'))}${phone(ctx, 'women-cycle', L('تقويم الدورة', 'The cycle calendar'))}</div>
      <div class="m-wcol reveal">${phone(ctx, 'women-period', L('أول يومين في الدورة، التمرين النهارده خفيف', "The first days of a period: today's workout is lighter"))}${txt(L('أول يومين أخف', 'Lighter first two days'), L('في أول يومين من الدورة التمرين بيبقى أخف لوحده. ولو اليوم كويس، التمرين العادي بيرجع بضغطة.', 'On the first two days of your period, the workout gets lighter by itself. Feeling fine? One tap brings back the usual one.'))}</div>
      <div class="m-wcol reveal">${card('women-pregcard', L('كارت الحمل: الأسبوع ٢٢، الثلث التاني', 'The pregnancy card: week 22, second trimester'), 600, 292)}${txt(L('الحمل', 'Pregnancy'), L('أسبوع الحمل والثلث اللي فيه. السعرات من غير عجز، والتمارين اللي مش مناسبة بتتبدل على حسب الشهر.', "Your week and trimester. Calories with no deficit, and exercises that don't fit are swapped month by month."))}${phone(ctx, 'women-preg', L('تمرين متظبط للحمل، وتمرين متبدل عشان الحمل', 'A workout set for pregnancy, with an exercise swapped for it'))}</div>
    </div>
  </div>
</section>`;
}

/** 9. Reports: a stack of printed sheets that flips. */
export function reportsModule(ctx) {
  const { L } = ctx;
  const reps = [
    ['rep-weekly', L('تقرير الأسبوع', 'Weekly report'), L('درجة الأسبوع من السعرات والبروتين والمياه والتمرين، ويوم بيوم، واللي اتحقق واللي محتاج يتحسن.', 'A week score from calories, protein, water and workouts, day by day, with what went well and what needs work.')],
    ['rep-lab', L('مقارنة التحاليل', 'Lab comparison'), L('آخر ٣ نتايج لكل تحليل جنب بعض، والمعدل الطبيعي، والتغيير، واللي محتاج متابعة.', 'The last 3 results of each test side by side, with the normal range, the change and what needs follow-up.')],
    ['rep-doctor', L('تقرير الدكتور', 'Doctor report'), L('آخر ٤ أسابيع: الأدوية والالتزام بيها، والطاقة والألم والنوم، والتمرين، والتحاليل.', 'The last 4 weeks: medicines and how regularly they were taken, energy, pain and sleep, workouts and lab results.')],
  ];
  return `<section class="m-mod" id="reports" aria-labelledby="reports-title">
  <div class="wrap">
    <div class="m-rep" data-reports>
      <div class="m-rep-txt reveal">
        <p class="kicker">${L('التقارير', 'Reports')}</p>
        <h2 class="h2" id="reports-title">${L('ورق ينفع يتطبع.', 'Reports you can print.')}</h2>
        <p class="lead">${L('تقرير للأسبوع، ومقارنة للتحاليل، وتقرير للدكتور. كل واحد ملف PDF ينفع يتبعت أو يتطبع.', 'A weekly report, a lab comparison and a report for your doctor. Each one is a PDF to print or send.')}</p>
        <div class="chips m-tabs" role="group" aria-label="${L('التقارير', 'Reports')}">${reps.map(([, t], i) => `<button class="chip" type="button" data-r="${i}" aria-pressed="${i === 0}">${t}</button>`).join('')}</div>
        <p class="muted small m-rep-cap" aria-live="polite" data-caps='${JSON.stringify(reps.map((r) => r[2])).replace(/'/g, '&#39;')}'>${reps[0][2]}</p>
      </div>
      <div class="reveal">
        <div class="m-deck">${reps.map(([img, t], i) => `<div class="m-sheet" data-pos="${i}" data-k="${i}"><img src="${shot(ctx, img)}" alt="${t}" width="909" height="1287" loading="lazy" decoding="async"></div>`).join('')}</div>
        <div class="m-rep-nav"><button class="btn btn-dark btn-sm" type="button" data-step="-1">${L('السابق', 'Previous')}</button><button class="btn btn-primary btn-sm" type="button" data-step="1">${L('التالي', 'Next')}</button></div>
      </div>
    </div>
  </div>
</section>`;
}

/** 10. Streak, freezes and points. */
export function streakModule(ctx) {
  const { L } = ctx;
  const snow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2M4 10.5l1-3.4-3.3-1M22.3 6.1l-3.3 1 1 3.4M2.7 17.9l3.3-1-1-3.4M20 13.5l-1 3.4 3.3 1"/></svg>';
  const pts = [[L('السعرات في حدودها', 'Calories on target'), 10], [L('التمرين خلص', 'Workout done'), 15], [L('المياه كاملة', 'All your water'), 5], [L('كل الوجبات متعلم عليها', 'Every meal ticked'), 5], [L('يوم كامل', 'A full day'), 5]];
  return `<section class="m-mod" id="streak" aria-labelledby="streak-title">
  <div class="wrap">
    ${head(L('الستريك', 'Streak'), L('ولو يوم فات، الفريز موجود.', 'Miss a day? A freeze has it covered.'), L('كل يوم في حدود السعرات بيزود الستريك. وكل ٧ أيام ورا بعض بيضيفوا فريز، ولو يوم فات، الفريز بيغطيه والستريك يفضل شغال.', 'Every day within your calories adds to your streak. Every 7 days in a row earns a freeze, and if you miss a day, the freeze covers it and the streak keeps going.'), 'streak-title')}
    <div class="m-streak">
      <div class="m-card m-flame-c reveal">
        <div class="m-fl">
          <svg class="m-flame" viewBox="0 0 74 96" aria-hidden="true"><defs><linearGradient id="m-fg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4d2e"/><stop offset=".6" stop-color="#ff9f43"/><stop offset="1" stop-color="#ffd166"/></linearGradient></defs><path d="M37 94c18 0 32-12 32-30 0-20-14-30-20-46-4 9-8 13-12 13 1-9-3-20-8-27C21 15 5 34 5 60c0 20 13 34 32 34z" fill="url(#m-fg)"/><path d="M37 92c9 0 15-6 15-15 0-9-6-13-9-21-2 5-4 7-6 7 0-4-2-8-4-11-6 7-11 15-11 25 0 9 6 15 15 15z" fill="#ffe08a"/></svg>
          <div><div class="num m-big-w" dir="ltr"><span data-to="11" data-from="9">11</span></div><div class="h3">${L('يوم ورا بعض', 'days in a row')}</div></div>
        </div>
        <div class="m-snow">${snow}${snow}<span>${L('فريزين جاهزين، وأقصى حاجة ٢', '2 freezes ready, 2 at most')}</span></div>
        <div class="m-cardimg"><img src="${shot(ctx, 'streak-card')}" alt="${L('كارت الستريك في صفحة اليوم', 'The streak card on Today')}" width="563" height="${ctx.en ? 226 : 265}" loading="lazy" decoding="async"></div>
      </div>
      <div class="m-card reveal">
        <div class="m-total"><span class="num" dir="ltr"><span data-to="110" data-from="70">110</span></span><span class="muted">${L('نقطة', 'points')}</span></div>
        <div class="m-pts">${pts.map(([t, n]) => `<div class="m-pt"><span>${t}</span><b dir="ltr">+${n}</b></div>`).join('')}</div>
        <p class="muted small m-pts-note">${L('النقط بتتجمع كل يوم، وبتظهر في صورة الأسبوع.', 'Points add up every day and show on your progress photo.')}</p>
      </div>
      <div class="m-streak-ph reveal">${phone(ctx, 'streak-cal', L('تاريخ الستريك: أيام في السعرات ويوم الفريز غطاه', 'Streak history: days on target and a day a freeze covered'))}</div>
    </div>
  </div>
</section>`;
}

/** Progress: the progress page and the progress photo, side by side. */
export function progressModule(ctx) {
  const { L } = ctx;
  return `<section class="m-mod" id="progress" aria-labelledby="progress-title">
  <div class="wrap">
    ${head(L('التقدم', 'Progress'), L('التغيير باين بالأرقام.', 'The change, in numbers.'), L('الوزن لوحده مش بيحكي كل حاجة، فالتطبيق بيتابع المقاسات ونسبة الدهون كمان، وبيطلع صورة للأسبوع بأرقامه.', "Weight alone doesn't tell the whole story, so the app also tracks measurements and body fat, and makes a photo of your week with its numbers."), 'progress-title')}
    <div class="m-grid2 m-prog">
      ${shotCard(ctx, 'prog-page', L('صفحة التقدم: الوزن على رسم بياني والمقاسات', 'The progress page: weight on a chart and measurements'), L('صفحة التقدم', 'Progress page'), L('الوزن على رسم بياني، والمقاسات بالسنتي، ونسبة الدهون التقريبية، وصور التقدم. والصور بتفضل على موبايلك.', 'Your weight on a chart, measurements in cm, an estimated body-fat percentage and progress photos. The photos stay on your phone.'))}
      ${shotCard(ctx, 'prog-photo', L('صورة الإنجاز: إطار فيه أرقام الأسبوع', 'Progress photo: a frame with the week\'s numbers'), L('صورة الإنجاز', 'Progress photo'), L('الكاميرا بتفتح جوه إطار فيه أرقام أسبوعك الحقيقية: الستريك والتمارين وأيام الهدف. الصورة بتتاخد وتتشارك مع الأصحاب.', 'The camera opens inside a frame with your real numbers for the week: streak, workouts and days on target. Take the photo and share it with friends.'))}
    </div>
  </div>
</section>`;
}

/** 11. The captain's lines through the day; the highlighted card moves along. */
export function captainModule(ctx) {
  const { L } = ctx;
  const cards = [
    [L('الصبح', 'Morning'), '7:30', L('صباح الفل! فطار فيه بروتين، ويومك يبدأ صح.', 'Morning! A breakfast with protein gets the day off right.'), L('أول ما التطبيق يفتح، ومعاها اقتراح فطار على قد السعرات.', 'When the app opens, with a breakfast idea that fits your calories.')],
    [L('قبل التمرين', 'Before training'), '6:00', L('تسخين ٥ دقايق ويلا نبدأ. النهارده دفع، ٦ تمارين.', "5 minutes of warm-up and let's go. Today is push, 6 exercises."), L('في صفحة التمرين، ونص التمرين بيقول "فاضل ٣ تمارين".', 'On the Training page. Halfway through, it says “3 exercises left”.')],
    [L('برة البيت', 'Eating out'), '1:30', L('محجوز ٤٦٩ سعرة للغدا برة. باقي اليوم متظبط عليهم.', '469 kcal held for lunch out. The rest of the day is set around it.'), L('بعد حجز وجبة من "أنا برة البيت"، والوجبات التانية بتخف.', 'After holding a meal from “I’m eating out”, with the other meals made lighter.')],
    [L('يوم صعب', 'Rough day'), '8:10', L('مش مشكلة، تمشية ٢٠ دقيقة وبكرة نظبطها.', "No problem. A 20-minute walk, and we'll pick it up tomorrow."), L('لما سؤال الصبح يقول إن الطاقة قليلة، التمرين بيبقى يوم تعافي.', 'When the morning check-in shows low energy, the workout becomes a recovery day.')],
    [L('آخر اليوم', 'End of day'), '9:00', L('الوجبات خلصت، وفاضل ٢٨٠ سعرة لو الجوع جه.', 'Meals are done, with 280 kcal left if you get hungry.'), L('والساعة ١٢ اليوم بيتقفل ويدخل في تقرير الأسبوع.', 'At midnight the day locks and goes into the weekly report.')],
  ];
  // Real reminder texts from src/lib/reminders.ts (gender neutral ones), newest on top like a lock screen.
  const notes = [
    ['9:45', L('يوم النهارده', 'Today'), L('مفيش أكل متسجل النهارده', 'No food logged today')],
    ['7:30', L('تمرين النهارده', "Today's workout"), L('تمرين النهارده في البيت، ٦ تمارين', "Today's workout is at home: 6 exercises")],
    ['4:00', L('الغدا', 'Lunch'), L('فاضلك ٧٢٠ سعرة، يعني غدا مريح من غير قلق', '720 kcal left, so lunch can be a proper meal')],
    ['2:00', L('ميعاد الدوا', 'Medicine time'), L('قرص واحد. مع الأكل أو بعده', '1 tablet. With or after food')],
    ['1:30', L('المية', 'Water'), L('فاضلك ٣ كوبايات مية النهارده', '3 cups of water left today')],
  ];
  return `<section class="m-mod" id="captain" aria-labelledby="captain-title">
  <div class="wrap">
    ${head(L('الكابتن', 'The Captain'), L('جملة في وقتها.', 'The right line at the right time.'), L('الكابتن عارف ساعة كام، وفاضل كام سعرة، والنهارده تمرين ولا راحة. فالكلام بيتغير مع اليوم.', 'The Captain knows the time, the calories you have left and whether today is for training or rest, so what he says changes through the day.'), 'captain-title')}
    <div class="m-capt reveal" data-captain>
      ${cards.map(([w, t, q, c], i) => `<div class="m-cc${i === 0 ? ' now' : ''}"><div class="m-when"><span>${w}</span><span class="num" dir="ltr">${t}</span></div><div class="m-who"><span class="m-av">${champ('cheer', { size: 30, ink: '#fff' })}</span><span class="m-dot"></span><span>${L('الكابتن بيقول', 'The Captain says')}</span></div><q>${q}</q><p class="m-ctx">${c}</p></div>`).join('')}
    </div>
    <div class="m-notif">
      <div class="m-notif-txt reveal">
        <h3 class="h3">${L('ومعاك على الموبايل طول اليوم.', 'And with you on your phone all day.')}</h3>
        <p>${L('الكابتن بيبعت تنبيهات بأرقام يومك: فاضل كام كوباية مية، وكام سعرة، وميعاد الدوا، وتمرين النهارده، ولو الأكل لسه متسجلش. ولو الحاجة اتعملت، التنبيه بتاعها مش بيوصل.', "The Captain sends reminders with your day's numbers: cups of water left, calories left, medicine times, today's workout and food that isn't logged yet. Anything already done is skipped.")}</p>
        <p class="muted small">${L('التنبيهات في تطبيق الموبايل بس.', 'Reminders are in the phone app only.')}</p>
      </div>
      <div class="m-lock reveal" data-lock aria-label="${L('تنبيهات يلا ويل على شاشة الموبايل', 'Yalla Well reminders on a phone lock screen')}">
        <div class="m-lock-time num" dir="ltr">9:45</div>
        <ul role="list">
          ${notes.map(([t, h, b]) => `<li><span class="m-nic">${champ('cheer', { size: 22, ink: '#fff' })}</span><div><div class="m-nt"><b>${h}</b><span class="num" dir="ltr">${t}</span></div><p>${b}</p></div></li>`).join('')}
        </ul>
      </div>
    </div>
  </div>
</section>`;
}
