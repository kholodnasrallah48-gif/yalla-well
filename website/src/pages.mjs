// Every page of the website. Each page is written once with L(arabic, english) and built in both languages.
// Arabic copy: simple, clear Arabic any Arab reader understands (no dialect words), gender neutral (the app or "we"
// as the subject, no imperatives), no tashkeel. No disease or medicine names outside the "try it" examples.
import { WEB_APP } from './config.mjs';
import { SOCIAL_NAMES, champ, contact, hasSocial, icon, socialLinks, storeButtons } from './layout.mjs';
import { SOCIAL } from './config.mjs';

// ---------- small pieces ----------

/** A real app screen in a phone frame, from static/media (600 x 1298 webp per language). */
const phone = (ctx, img, alt, cls = '', eager = false) =>
  `<figure class="phone ${cls}"><img src="${ctx.media(img)}" alt="${alt}" width="600" height="1298" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>`;

const ticks = (items) => `<ul class="ticks">${items.map((t) => `<li>${icon('check', 18)}<span>${t}</span></li>`).join('')}</ul>`;

const kicker = (t) => `<p class="kicker">${t}</p>`;

function pageHero(ctx, k, title, lead) {
  return `<section class="page-hero"><div class="wrap narrow reveal">${kicker(k)}<h1 class="h1" data-split>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></section>`;
}

const qa = ([q, a]) => `<details class="qa"><summary><span>${q}</span><span class="qa-mark" aria-hidden="true"></span></summary><div class="qa-a"><p>${a}</p></div></details>`;

const NEWS = 'https://www.newswise.com/articles/photo-based-calorie-tracking-apps-may-underestimate-energy-in-meals';

// ---------- shared content ----------

/** Questions and answers, grouped. The home page shows a few of them. */
function faqGroups(ctx) {
  const { L } = ctx;
  return [
    { id: 'general', title: L('عام', 'General'), items: [
      [L('ما هو يلا ويل؟', 'What is Yalla Well?'), L('تطبيق يضع خطة أكل وتمرين حسب الجسم والهدف والحالة الصحية، ويذكر بمواعيد الأدوية والتحاليل. وعندما تتغير الحالة الصحية أو الأدوية، تتغير الخطة معها.', 'An app that builds a food and training plan around your body, your goal and your health, and keeps track of your medicines and lab tests. When your health or medicines change, the plan changes too.')],
      [L('هل التطبيق مجاني؟', 'Does it cost anything?'), L('النسخة الحالية تجريبية وليس فيها اشتراك.', 'The current version is a trial and has no subscription.')],
      [L('هل يحتاج إلى حساب؟', 'Do I need an account?'), L('لا. لا يوجد تسجيل دخول، وكل البيانات محفوظة على الهاتف نفسه.', "No. There's no sign-in, and everything is saved on your phone.")],
      [L('على أي هواتف يعمل؟', 'Which phones does it work on?'), L('نسخة الويب تعمل الآن على أي هاتف أو كمبيوتر، وتطبيق آيفون وأندرويد قريبا.', 'The web version works now on any phone or computer. iPhone and Android apps are coming soon.')],
      [L('هل يوجد باللغة الإنجليزية؟', 'Is it available in English?'), L('نعم، بالعربية والإنجليزية، ويمكن تغيير اللغة من الشاشة الرئيسية في أي وقت.', 'Yes, Arabic and English. Switch any time from the home screen.')],
    ] },
    { id: 'food', title: L('الأكل', 'Food'), items: [
      [L('كيف تحسب السعرات؟', 'How are my calories worked out?'), L('من العمر والطول والوزن والنشاط والهدف. ومع بعض الحالات الصحية أو أثناء الحمل، يقل العجز في السعرات أو يلغى تماما.', 'From your age, height, weight, activity and goal. With some health conditions, or during pregnancy, the app makes the calorie deficit smaller or drops it altogether.')],
      [L('من أين تأتي أرقام الأكل؟', 'Where do the food numbers come from?'), L('كل أكلة محسوبة بوزنها بالجرام من قيم قاعدة بيانات وزارة الزراعة الأمريكية للأغذية <bdi>(USDA FoodData Central)</bdi>. والمنتجات المغلفة تحسب من ملصقها عند قراءة الباركود <bdi>(Open Food Facts)</bdi>.', 'Every food is counted by its weight in grams, using values from the USDA FoodData Central database. Packaged products are counted from their label when you scan the barcode <bdi>(Open Food Facts)</bdi>.')],
      [L('هل توجد وصفات؟', 'Are there recipes?'), L('أكثر من 150 وصفة للفطور والغداء والعشاء والوجبات الخفيفة، من الشام والخليج والمغرب العربي والعراق واليمن ومصر، بنسخ أخف. وكمية كل وصفة تحسب على السعرات المتبقية في الوجبة، والمقادير تتغير معها.', 'More than 150 recipes for breakfast, lunch, dinner and snacks, from the Levant, the Gulf, the Maghreb, Iraq, Yemen and Egypt, cooked the lighter way. Each one is sized to the calories left for that meal, and the ingredients change with it.')],
      [L('هل يتغير هدف السعرات مع الوقت؟', 'Does my calorie target change over time?'), L('نعم. كل أسبوع يقارن التطبيق تغير الوزن الحقيقي بالمتوقع ويعدل الهدف. وإذا كانت الحالة الصحية تجعل التقليل أكثر غير آمن، يقترح الحديث مع الطبيب أولا بدل تقليل السعرات.', 'Yes. Each week the app compares your real weight change with what was expected and adjusts the target. If a health condition makes cutting further risky, it suggests talking to your doctor first instead of lowering calories.')],
      [L('هل يوجد كيتو أو كارب أقل؟', 'Is there keto or lower carb?'), L('توجد 4 أنظمة: متوازن، وبروتين أعلى، وكارب أقل، وكيتو. ويغلق الكيتو إذا كانت هناك حالة صحية تجعله غير آمن.', 'There are four modes: balanced, higher protein, lower carb and keto. Keto is locked when a health condition makes it unsafe.')],
      [L('لماذا لا تحسب الوجبة وحدها؟', "Why doesn't a meal count by itself?"), L('حتى يكون الحساب على ما تم أكله فعلا. الوجبة تدخل في الحساب عند تعليمها، وليس عند حلول موعدها.', 'A meal counts once you tick it as eaten, not by the clock, so your totals reflect what actually happened.')],
      [L('وإذا لم تكن الأكلة في القائمة؟', "What if a food isn't on the list?"), L('يبحث التطبيق عنها في قواعد بيانات الأغذية العامة على الإنترنت، ويحفظ ما يجده في "أكلاتي". وتطبيق الهاتف يقرأ الباركود أيضا.', 'The app searches public food databases online, and anything it finds is saved to "My foods". The phone app can also scan barcodes.')],
      [L('ماذا يحدث في منتصف الليل؟', 'What happens at midnight?'), L('يغلق اليوم ويحفظ كما هو، ويدخل في التقرير الأسبوعي.', 'The day locks, is saved as it is, and goes into the weekly report.')],
    ] },
    { id: 'training', title: L('التمرين', 'Training'), items: [
      [L('ما أنظمة التمرين الموجودة؟', 'Which training plans are there?'), L('9 أنظمة من 3 إلى 6 أيام، منها الجسم كله، وعلوي وسفلي، ودفع وسحب ورجل، وأرداف ورجل، و5 أيام بين الجيم والبيت. ومن لم يحدد نظاما بعد، يجيب عن 3 أسئلة ويقترح التطبيق نظاما مناسبا.', "Nine plans from 3 to 6 days, including full body, upper and lower, push pull legs, glutes and legs, and 5 days split between gym and home. Not sure? Answer three questions and we'll suggest one.")],
      [L('هل يمكن التمرين في البيت؟', 'Can I train at home?'), L('نعم. كل يوم في الأسبوع يكون جيم أو بيت أو راحة، والتمارين تتغير حسبه.', 'Yes. Each day of the week can be gym, home or rest, and the exercises change to match.')],
      [L('كيف يتقدم التمرين مع الوقت؟', 'How does training progress?'), L('عندما تكتمل كل التكرارات في كل المجموعات، يرتفع الوزن المقترح في المرة التالية. والأسابيع تتبدل بين ثقيل وأخف حتى يأخذ الجسم وقته للتعافي.', 'Once you hit all your reps in every set, the suggested weight goes up next time. Weeks alternate between heavy and lighter so your body gets time to recover.')],
      [L('وإذا كان الجهاز مشغولا أو غير موجود؟', 'What if a machine is busy or missing?'), L('لكل تمرين نسخة بالأوزان الحرة ونسخة بالجهاز. ويمكن أيضا حذف تمرين أو إضافة تمرين جديد إلى اليوم.', 'Every exercise has a free-weight and a machine version. You can also remove an exercise or add your own to the day.')],
      [L('هل يتابع التطبيق الأوزان؟', 'Does it keep track of my lifts?'), L('نعم. لكل تمرين سجل فيه أفضل وزن، والهدف التالي، وكم بقي عليه، وعمود لكل جلسة. وخطة التمرين تصدر ملف PDF يمكن إرساله إلى المدرب.', 'Yes. Each exercise has a logbook with a record card showing your best lift, your next goal and how far is left, plus a bar for every session. The training plan also exports as a PDF to share with a coach.')],
      [L('هل تناسب التمارين أجهزة الجيم؟', 'Will the exercises fit my gym?'), L('تحدد الأجهزة الموجودة في الجيم مرة واحدة، وتأتي التمارين على قدر الموجود فقط.', 'The equipment your gym has is set once, and the exercises match what is there.')],
    ] },
    { id: 'health', title: L('الصحة والأدوية', 'Health and medicines'), items: [
      [L('هل يغني عن الطبيب؟', 'Does it replace my doctor?'), L('لا. يلا ويل يساعد في التنظيم والمتابعة، ولا يشخص. أما القرار في الدواء أو الأكل أو التمرين فيكون مع الطبيب.', 'No. Yalla Well helps you organise and keep track, and it does not diagnose. Decisions about medicine, diet and training are for you and your doctor.')],
      [L('كيف تؤثر الحالة الصحية على الخطة؟', 'How does my health change the plan?'), L('نأخذ الحالات الصحية والأدوية في الحسبان في التمرين والأكل: تنبيهات على بعض الأكلات، ومجهود مناسب في التمرين، وبدائل للتمارين التي لا تناسب. وإذا كانت الحالة غير معروفة للتطبيق، يسأل 3 أسئلة عن الأكل والتمرين والعلامات التي يجب أن يتوقف التمرين عندها.', 'We take health conditions and medicines into account in training and food: warnings on some foods, a suitable training effort, and swaps for exercises that do not fit. If the app does not know a condition, it asks three questions about food, training and the warning signs to stop at.')],
      [L('كيف تنظم الأدوية والفيتامينات؟', 'How does it handle medicines and supplements?'), L('لكل دواء جرعته وعدده وعدد مرات أخذه ومواعيده، مع تذكير في كل موعد. وإذا كان هناك دواءان يجب الفصل بينهما، ينبه التطبيق إلى ذلك.', 'Each one gets its dose, amount, frequency and times, with a reminder at each time. It also warns when two must be taken apart.')],
      [L('ما هو تقرير الطبيب؟', "What's the doctor report?"), L('ملف PDF لآخر 4 أسابيع: الأدوية والالتزام بها، والطاقة والألم والنوم، والأيام الصعبة، والتمرين، والتحاليل. يمكن طباعته أو إرساله.', 'A PDF of the last 4 weeks: medicines and how regularly they were taken, energy, pain and sleep, rough days, workouts and lab results. Print it or send it.')],
      [L('كيف تسجل التحاليل؟', 'How do lab results work?'), L('تكتب النتيجة والتاريخ، ويمكن حفظ صورة ورقة التحليل في التطبيق، ويصل تذكير عند موعد التحليل التالي. ألوان النتائج دليل تقريبي فقط، والطبيب هو من يقرر معناها.', 'You enter the result and the date, can keep a photo of the lab paper in the app, and get a reminder when the next test is due. The colours next to a result are only a rough guide; your doctor decides what it means.')],
      [L('ماذا يحدث في يوم متعب؟', 'What happens on a rough day?'), L('كل يوم يسأل التطبيق عن الطاقة والألم والنوم. وإذا كانت الإجابات تشير إلى يوم صعب، يتحول تمرين اليوم تلقائيا إلى يوم راحة خفيف.', "Each day the app asks about your energy, pain and sleep. If the answers point to a rough day, that day's workout turns into an easy recovery day by itself.")],
      [L('هل يتابع النوم وصحة المرأة؟', "Does it cover sleep and women's health?"), L('نعمل الآن على إضافتهما. النوم: وقت النوم والاستيقاظ، وعدد الساعات مقارنة بالمعدل المناسب للعمر. وصحة المرأة: تقويم الدورة مع موعدها المتوقع وأيام الخصوبة، وتمرين أخف في أول أيامها، ومتابعة الحمل أسبوعا بأسبوع، والرضاعة.', "We are adding both now. Sleep: bed and wake times, and your hours compared with the range for your age. Women's health: a period calendar with the expected period and fertile days, lighter training on the first days, pregnancy week by week, and breastfeeding.")],
    ] },
    { id: 'privacy', title: L('الخصوصية', 'Privacy'), items: [
      [L('أين تحفظ البيانات؟', 'Where is my data stored?'), L('على الهاتف نفسه، وليس على خادم لدينا. التفاصيل في <a href="privacy.html">صفحة الخصوصية</a>.', 'On your phone, not on a server of ours. Details are on the <a href="privacy.html">privacy page</a>.')],
      [L('كيف تحذف البيانات؟', 'How do I delete my data?'), L('في "ملفي" زر يحذف كل شيء ويبدأ من جديد. وحذف التطبيق من الهاتف يحذف البيانات أيضا.', 'In "Me" there\'s a button that deletes everything and starts over. Uninstalling the app deletes it too.')],
    ] },
  ];
}

function downloadPanel(ctx) {
  const { L } = ctx;
  return `<section class="cta-band" id="download"><div class="wrap">
    <div class="cta reveal">
      <div class="cta-text">
        ${champ('cheer', { size: 96, cls: 'cta-champ' })}
        <h2 class="h2">${L('يلا نبدأ.', "Let's start.")}</h2>
        <p class="lead">${L('نسخة الويب متاحة الآن على أي هاتف أو كمبيوتر، وتطبيق آيفون وأندرويد قريبا.', 'The web version works now on any phone or computer. iPhone and Android are coming soon.')}</p>
        ${storeButtons(ctx)}
      </div>
      <div class="qr-box">
        <img src="${ctx.root}static/img/qr-web.svg" alt="${L('رمز QR يفتح نسخة الويب', 'QR code that opens the web version')}" width="148" height="148">
        <p class="small">${L('الرمز يفتح نسخة الويب من كاميرا الهاتف', "Scan with your phone's camera to open the web version")}</p>
      </div>
    </div>
  </div></section>`;
}

// ---------- home sections ----------

/** The trailer: real screen recordings in a phone frame, with a two-word caption per shot. */
function trailer(ctx) {
  const { L, lang } = ctx;
  // Shot boundaries in seconds (59 frames at 30 fps each), then the end card.
  const caps = [
    L('يومك <b>واضح</b>', 'Your <b>day</b>'),
    L('أكلك <b>بالجرام</b>', 'Food, <b>weighed</b>'),
    L('تمرين <b>يتطور</b>', 'Training <b>grows</b>'),
    L('أرقامك <b>محفوظة</b>', 'Your <b>records</b>'),
    L('تحاليلك <b>معك</b>', 'Labs, <b>kept</b>'),
    L('وصفات <b>متنوعة</b>', 'Real <b>recipes</b>'),
    L('أسبوعك <b>بصورة</b>', 'Your <b>week</b>'),
  ];
  const label = L('فيديو قصير من التطبيق: الشاشة الرئيسية، والأكل، والتمرين، وسجل التمرين، والتحاليل، والوصفات، وصورة الأسبوع', 'A short video of the app: the home screen, food, training, the logbook, lab results, recipes and the week picture');
  return `<div class="trailer" data-trailer>
      <figure class="phone phone-hero">
        <video class="trailer-video" muted loop playsinline preload="none" poster="${ctx.root}static/media/trailer-${lang}.webp" width="332" height="720" aria-label="${label}"><source data-src="${ctx.root}static/media/trailer-${lang}.mp4" type="video/mp4"><source data-src="${ctx.root}static/media/trailer-${lang}.webm" type="video/webm"></video>
        <p class="trailer-cap" aria-hidden="true" data-caps='${JSON.stringify(caps).replace(/'/g, '&#39;')}'>${caps[0]}</p>
      </figure>
      <button class="trailer-btn" type="button" aria-pressed="false" data-play="${L('تشغيل الفيديو', 'Play video')}" data-pause="${L('إيقاف الفيديو', 'Pause video')}"><span class="tb-ic" aria-hidden="true"></span><span class="tb-t">${L('تشغيل الفيديو', 'Play video')}</span></button>
    </div>`;
}

function oneApp(ctx) {
  const { L } = ctx;
  const apps = [
    ['flame', L('عداد السعرات', 'Calorie counter'), L('اشتراك منفصل', 'Separate subscription')],
    ['dumbbell', L('خطة التمرين', 'Workout plan'), L('اشتراك منفصل', 'Separate subscription')],
    ['heart', L('متابعة الدورة', 'Period tracker'), L('اشتراك منفصل', 'Separate subscription')],
    ['moon', L('متابعة النوم', 'Sleep tracker'), L('اشتراك منفصل', 'Separate subscription')],
    ['pill', L('تذكير الأدوية', 'Medicine reminders'), L('تطبيق آخر', 'Another app')],
    ['lab', L('ورق التحاليل', 'Lab papers'), L('في الدرج', 'In a drawer')],
  ];
  return `<section class="section one" id="one" aria-labelledby="one-title">
  <div class="wrap one-in">
    <div class="one-text reveal">
      ${kicker(L('تطبيق واحد', 'One app'))}
      <h2 class="h2" id="one-title">${L('تطبيق واحد بدل عدة تطبيقات.', 'One app instead of several.')}</h2>
      <p class="lead">${L('كثير من الناس يدفعون اشتراكا لكل جزء وحده: عداد سعرات، وخطة تمرين، ومتابعة للدورة، وتطبيق للنوم، وتذكير بالأدوية، وورق التحاليل في الدرج. ولا يعرف أي منها شيئا عن الآخر.', 'Many people pay for each piece on its own: a calorie counter, a workout plan, a period tracker, a sleep app, medicine reminders, and lab papers in a drawer. None of them knows about the others.')}</p>
      <p class="lead">${L('في يلا ويل يعرف الأكل عن التمرين، ويعرف التمرين عن النوم والأدوية والتحاليل. والفكرة أن يبقى التطبيق معك لسنوات: متابعة سهلة تعرف تاريخك، وتتغير مع عمرك وظروفك، بدل البدء من الصفر مع كل تطبيق جديد.', 'In Yalla Well, your food knows about your training, and your training knows about your sleep, medicines and lab results. The idea is for it to stay with you for years: easy follow-up that knows your history and changes with your age and your life, instead of starting from zero with every new app.')}</p>
    </div>
    <div class="stack" data-stack>
      <div class="stack-area">
        <ul class="apps" role="list">
          ${apps.map(([ic, t, s]) => `<li class="app-card"><span class="app-ic">${icon(ic, 20)}</span><b>${t}</b><span>${s}</span></li>`).join('')}
        </ul>
        <div class="one-card" aria-hidden="true">
          ${champ('logo', { size: 46 })}
          <span class="one-wm">${L('<span class="wm-ar">يلا ويل</span><span class="wm-en">YALLA WELL</span>', '<span class="wm-en">YALLA WELL</span>')}</span>
        </div>
      </div>
      <p class="one-note">${L('الأكل والتمرين والنوم والدورة والأدوية والتحاليل، في تطبيق واحد يعرف حالتك.', 'Food, training, sleep, your cycle, medicines and lab results, in one app that knows your situation.')}</p>
      <button class="btn btn-primary btn-sm stack-btn" type="button" data-merge="${L('جمع التطبيقات', 'Bring them together')}" data-split-label="${L('إعادة العرض', 'Show them apart')}">${L('جمع التطبيقات', 'Bring them together')}</button>
    </div>
  </div>
</section>`;
}

function tour(ctx) {
  const { L } = ctx;
  const steps = [
    { img: 'home', k: L('الشاشة الرئيسية', 'Home'), h: L('اليوم كله أمامك.', 'Your whole day at a glance.'),
      p: L('السعرات المتبقية والبروتين والماء وتمرين اليوم، في الشاشة التي تفتح عليها كل صباح.', "Calories left, protein, water and today's workout, on the screen you open each morning."),
      alt: L('الشاشة الرئيسية: السعرات المتبقية والبروتين والكارب والدهون وتمرين اليوم', "Home screen: calories left, protein, carbs, fat and today's workout") },
    { img: 'train', k: L('التمرين', 'Training'), h: L('تمرين يتقدم مع الوقت.', 'Training that moves forward.'),
      p: L('عندما تكتمل كل التكرارات يرتفع الوزن المقترح، والأسابيع تتبدل بين ثقيل وأخف حتى يرتاح الجسم.', 'Once all your reps are done the suggested weight goes up, and weeks alternate between heavy and lighter so your body can recover.'),
      alt: L('شاشة التمرين: يوم رجل بثمانية تمارين ومجموعاتها وتكراراتها', 'Training screen: a legs day with eight exercises, sets and reps') },
    { img: 'logbook', k: L('سجل التمرين', 'Logbook'), h: L('سجل لكل تمرين.', 'A record for every lift.'),
      p: L('أفضل رقم، والهدف التالي، وعمود لكل جلسة يبين التقدم من أول نظرة.', 'Your best lift, your next goal and a bar for every session, so progress shows at a glance.'),
      alt: L('سجل التمرين: أفضل رقم 32.5 كجم، والهدف التالي، وعمود لكل جلسة', 'Logbook: best lift 32.5 kg, the next goal and a bar for each session') },
    { img: 'labs', k: L('التحاليل', 'Lab results'), h: L('التحاليل وورقتها معا.', 'Lab results, with the paper.'),
      p: L('النتيجة والتاريخ وموعد التحليل التالي، مع صورة الورقة نفسها، وتذكير قبل الموعد.', "The result, the date and when the next test is due, with a photo of the paper itself and a reminder before it's due."),
      alt: L('شاشة التحاليل: نتيجة فيتامين د وتاريخها وموعد التحليل التالي وصور الورق', 'Lab results screen: a vitamin D result, its date, the next test date and photos of the papers') },
    { img: 'recipe', k: L('الوصفات', 'Recipes'), h: L('أكثر من 150 وصفة.', 'More than 150 recipes.'),
      p: L('أطباق من الشام والخليج والمغرب العربي والعراق واليمن ومصر، بنسخة أخف، وبكمية تناسب السعرات المتبقية.', 'Dishes from the Levant, the Gulf, the Maghreb, Iraq, Yemen and Egypt, cooked lighter and sized to the calories you have left.'),
      alt: L('وصفة كبسة دجاج خفيفة بالرز البني: السعرات والبروتين والمكونات', 'Light chicken kabsa recipe: calories, protein and ingredients') },
    { img: 'progress', k: L('التقدم', 'Progress'), h: L('التقدم بالأرقام.', 'Progress in numbers.'),
      p: L('الوزن على رسم بياني، والمقاسات كل أسبوعين، لأن الميزان وحده لا يبين كل شيء.', 'Your weight on a chart and tape measurements every two weeks, because the scale alone does not tell the whole story.'),
      alt: L('صفحة التقدم: رسم بياني للوزن والمقاسات', 'Progress page: a weight chart and body measurements') },
    { img: 'story', k: L('صورة الأسبوع', 'Week story'), h: L('أسبوعك في صورة.', 'Your week in one picture.'),
      p: L('صورة جاهزة للمشاركة فيها الأيام المتتالية، والأيام التي كانت في الهدف، وعدد التمارين.', 'A picture ready to share, with your streak, days on target and workouts done.'),
      alt: L('صورة الأسبوع: 13 يوما متتاليا وأيام الهدف والتمارين', 'Week story: a 13-day streak, days on target and workouts') },
  ];
  return `<section class="tour" id="features" aria-labelledby="tour-title">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('داخل التطبيق', 'Inside the app'))}<h2 class="h2" id="tour-title">${L('سبع شاشات من يوم حقيقي.', 'Seven screens from a real day.')}</h2></div>
    <div class="tour-in">
      <div class="tour-tabs" role="tablist" aria-label="${L('شاشات التطبيق', 'App screens')}">
        ${steps.map((s, i) => `<button type="button" role="tab" id="tt-${i}" aria-controls="tour-stage" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">${s.k}</button>`).join('')}
      </div>
      <div class="tour-steps">
        ${steps.map((s, i) => `<article class="tour-step${i === 0 ? ' is-on' : ''}" data-i="${i}">
          <span class="tour-n num">0${i + 1}</span>
          ${kicker(s.k)}
          <h3 class="h3">${s.h}</h3>
          <p>${s.p}</p>
        </article>`).join('')}
      </div>
      <div class="tour-phone" id="tour-stage" role="tabpanel" aria-labelledby="tt-0">
        <figure class="phone phone-tour"><div class="screens">${steps.map((s, i) => `<img class="screen${i === 0 ? ' is-on' : ''}" src="${ctx.media(s.img)}" alt="${s.alt}" width="600" height="1298" loading="${i === 0 ? 'lazy' : 'lazy'}" decoding="async"${i ? ' aria-hidden="true"' : ''}>`).join('')}</div></figure>
        <div class="tour-dots" aria-hidden="true">${steps.map((_, i) => `<i${i === 0 ? ' class="is-on"' : ''}></i>`).join('')}</div>
      </div>
    </div>
  </div>
</section>`;
}

function accuracy(ctx) {
  const { L } = ctx;
  return `<section class="section acc" aria-labelledby="acc-title">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('دقة السعرات', 'Calorie accuracy'))}<h2 class="h2" id="acc-title">${L('لماذا نحسب الأكل بالوزن وليس بالصورة.', 'Why we count food by weight, not by photo.')}</h2></div>
    <div class="acc-nums">
      <div class="acc-card reveal"><span class="acc-n num is-warn" dir="ltr">250-345</span><p>${L('سعرة في الوجبة الواحدة أقل من الحقيقة، في اختبار لـ4 تطبيقات تصوير معروفة', 'kcal per meal below the real amount, in a test of 4 well-known photo apps')}</p></div>
      <div class="acc-card reveal"><span class="acc-n num" dir="ltr">USDA</span><p>${L('أرقام الأكل في يلا ويل محسوبة بالجرام من قاعدة بيانات الأغذية الأمريكية', 'Food values in Yalla Well are counted by the gram from the US food database')}</p></div>
    </div>
    <div class="acc-text reveal">
      <p class="lead">${L('تطبيقات التصوير تخمن الكمية من الصورة، وقد تخطئ كثيرا.', 'Photo apps guess the portion from a picture, and they can be far off.')}</p>
      <p class="lead">${L('في يلا ويل كل أكلة محسوبة بوزنها من قيم وزارة الزراعة الأمريكية <bdi>(USDA FoodData Central)</bdi>، والمنتجات المغلفة من ملصقها عند قراءة الباركود <bdi>(Open Food Facts)</bdi>.', 'In Yalla Well every food is counted by its weight using USDA FoodData Central values, and packaged products from their own label when you scan the barcode <bdi>(Open Food Facts)</bdi>.')}</p>
    </div>
    <p class="src reveal">${L('المصدر: باحثون في المعاهد الوطنية للصحة الأمريكية <bdi>(NIH)</bdi> اختبروا 102 وجبة، وعرضوا النتائج في مؤتمر NUTRITION 2026، ولم تنشر بعد في مجلة محكمة.', 'Source: an NIH research team tested 102 meals and presented the results at NUTRITION 2026; the study is not yet peer reviewed.')} <a href="${NEWS}" rel="noopener" target="_blank">${L('الخبر', 'Read the news')}</a></p>
  </div>
</section>`;
}

function coverage(ctx) {
  const { L } = ctx;
  const items = [
    ['plate', L('الأكل', 'Food'), L('سعرات وبروتين محسوبة بالوزن، ووصفات بكمية تناسب الوجبة.', 'Calories and protein counted by weight, and recipes sized to the meal.'), false],
    ['dumbbell', L('التمرين', 'Training'), L('في الجيم أو البيت، مع سجل وتقدم أسبوعي.', 'At the gym or at home, with a logbook and weekly progress.'), false],
    ['pill', L('الأدوية والفيتامينات', 'Medicines and supplements'), L('كل دواء بجرعته وموعده، وتذكير في كل موعد.', 'Each one with its dose and time, and a reminder at each time.'), false],
    ['lab', L('التحاليل', 'Lab results'), L('النتيجة والتاريخ وصورة الورقة، وتذكير بالتحليل التالي.', 'Result, date and a photo of the paper, with a reminder for the next test.'), false],
    ['chart', L('الماء', 'Water'), L('هدف يومي حسب الوزن، وتسجيل بلمسة واحدة.', 'A daily goal from your weight, logged with one tap.'), false],
    ['moon', L('النوم', 'Sleep'), L('وقت النوم والاستيقاظ، وعدد الساعات مقارنة بالمعدل المناسب للعمر.', 'Bed and wake times, and your hours compared with the range for your age.'), true],
    ['heart', L('الدورة', 'Period'), L('تقويم فيه الموعد المتوقع وأيام الخصوبة، وتمرين أخف في أول الأيام.', 'A calendar with the expected period and fertile days, and lighter training on the first days.'), true],
    ['heart', L('الحمل والرضاعة', 'Pregnancy and breastfeeding'), L('متابعة الحمل أسبوعا بأسبوع، وأكل وتمرين يناسبان كل مرحلة، ثم فترة الرضاعة.', 'Pregnancy week by week, food and training for each stage, then breastfeeding.'), true],
  ];
  return `<section class="section cover" aria-labelledby="cover-title">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('ما يتابعه التطبيق', 'What it covers'))}<h2 class="h2" id="cover-title">${L('الأكل والتمرين والصحة، والنوم وصحة المرأة أيضا.', "Food, training and health, now with sleep and women's health.")}</h2>
      <p class="lead">${L('نأخذ الحالات الصحية والأدوية في الحسبان في التمرين والأكل، وأضفنا النوم وصحة المرأة.', "We take health conditions and medicines into account in training and food, and we've added sleep and women's health.")}</p></div>
    <ul class="cover-list" role="list">
      ${items.map(([ic, t, d, soon]) => `<li class="cover-item reveal"><span class="tile-ic">${icon(ic, 22)}</span><div><h3>${t}${soon ? ` <span class="badge badge-new">${L('جديد', 'New')}</span>` : ''}</h3><p>${d}</p></div></li>`).join('')}
    </ul>
    <p class="note reveal">${L('يلا ويل يساعد في المتابعة ويذكر بالمواعيد، لكنه لا يشخص ولا يغني عن الطبيب. ألوان التحاليل دليل تقريبي، والقرار في الدواء أو الأكل أو التمرين للطبيب.', 'Yalla Well helps you keep track and reminds you. It does not diagnose and does not replace a doctor. Lab colours are only a rough guide, and decisions about medicine, diet or training are for your doctor.')}</p>
  </div>
</section>`;
}

function tryIt(ctx) {
  const { L } = ctx;
  const chips = [
    ['age', L('العمر فوق 50', 'Over 50')],
    ['shoulder', L('إصابة في الكتف', 'Shoulder injury')],
    ['preg', L('حمل', 'Pregnant')],
    ['sugar', L('السكري', 'Diabetes')],
    ['home', L('التمرين في البيت', 'Training at home')],
  ];
  // Plain data for the script: the base plan, swaps of base lines, and the lines each choice adds.
  const data = {
    base: [L('خطة أكل حسب سعراتك', 'A food plan sized to your calories'), L('تمرين 3 أيام في الجيم: دفع وسحب ورجل', '3 gym days: push, pull and legs'), L('زيادة تدريجية في الوزن كل أسبوع', 'A little more weight each week'), L('تذكير بالماء والوجبات', 'Reminders for water and meals')],
    swap: {
      home: [[1, L('تمرين 3 أيام في البيت', '3 home workouts a week')]],
      shoulder: [[1, L('تمرين 3 أيام: رجل وبطن ومشي حتى التعافي', '3 days: legs, core and walking until it heals')]],
      age: [[2, L('زيادة هادئة في المجهود، بدون ضغط', 'A gentle rise in effort, with no pressure')]],
      preg: [[0, L('خطة أكل بدون عجز في السعرات', 'A food plan with no calorie deficit')], [2, L('زيادة هادئة في المجهود، بدون ضغط', 'A gentle rise in effort, with no pressure')]],
    },
    add: {
      age: [L('لا تمارين قفز', 'No jumping'), L('أوزان أخف مع تكرارات أكثر', 'Lighter weights with more reps'), L('إحماء أطول قبل كل تمرين', 'A longer warm-up before each workout')],
      shoulder: [L('تمارين الدفع والسحب للجزء العلوي تتوقف حتى التعافي', 'Upper-body pushing and pulling are taken out until it heals'), L('مكانها تمارين للرجل والبطن ومشي', 'Legs, core and walking take their place'), L('بعد الشفاء يكفي تحديث الإصابة من الملف الشخصي لتعود الخطة كاملة', 'Once healed, update it in your profile and the full plan comes back')],
      preg: [L('سعرات إضافية من الثلث الثاني للحمل: 340 في اليوم، ثم 450 في الثلث الأخير', 'Extra calories from the second trimester: 340 a day, then 450 in the third'), L('لا قفز ولا أوزان ثقيلة', 'No jumping and no heavy weights'), L('لا تمارين بالاستلقاء على الظهر أو البطن بعد الشهر الثالث', 'No exercises lying on your back or belly after month 3'), L('الأكلات التي يجب تجنبها تظهر مع تنبيه', 'Foods to avoid are flagged'), L('الفيتامينات بعد سؤال الطبيب، ثم تسجيلها في التطبيق للتذكير', 'Ask the doctor about vitamins, then log them for reminders')],
      sugar: [L('نشويات بطيئة، وتنبيه على الأكلات السكرية', 'Slow carbs, with sugary foods flagged'), L('تحليل السكر التراكمي كل 3 أشهر مع تذكير', 'An HbA1c test every 3 months, with a reminder')],
      home: [L('تمارين في البيت بأدوات بسيطة', 'Home workouts with simple equipment')],
    },
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<section class="section try" id="try" aria-labelledby="try-title">
  <div class="wrap try-in">
    <div class="try-text reveal">
      ${kicker(L('تجربة سريعة', 'Try it'))}
      <h2 class="h2" id="try-title">${L('اختيار الحالة يغير الخطة.', 'Pick a situation and watch the plan change.')}</h2>
      <p class="lead">${L('هذه أمثلة مبسطة لما يفعله التطبيق. الخطة الحقيقية تبنى من البيانات كلها.', 'These are simplified examples of what the app does. A real plan is built from everything you tell it.')}</p>
    </div>
    <div class="try-box reveal">
      <div class="chips" role="group" aria-label="${L('اختيار الحالة', 'Choose a situation')}">
        ${chips.map(([k, t]) => `<button type="button" class="chip" aria-pressed="false" data-k="${k}">${t}</button>`).join('')}
      </div>
      <div class="plan-box">
        <p class="plan-title">${L('الخطة', 'The plan')}</p>
        <ul class="plan" aria-live="polite">${data.base.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
      <p class="small muted">${L('التطبيق لا يشخص، والطبيب هو من يقرر.', 'The app does not diagnose; your doctor decides.')}</p>
      <script type="application/json" class="try-data">${json}</script>
    </div>
  </div>
</section>`;
}

function closing(ctx) {
  const { L } = ctx;
  return `<section class="section closing" aria-labelledby="close-title">
  <div class="wrap narrow center">
    <h2 class="h2 reveal" id="close-title">${L('خطة تعيش معها سنوات.', 'A plan to live with for years.')}</h2>
    <p class="lead reveal">${L('لا قواعد صارمة ولا قائمة ممنوعات. أكل متنوع ولذيذ، وتمرين فيه مجهود حقيقي وأيام راحة، وخطة تتغير كلما تغيرت ظروفك. الهدف أن يصبح الأكل الصحي والحركة جزءا من الحياة اليومية، من غير إرهاق ولا ضغط ولا ملل، وأن يستمر ذلك بعد الوصول إلى الهدف.', 'No strict rules and no list of banned foods. Varied food you enjoy, training with real effort and real rest, and a plan that changes as your life does. The aim is for healthy eating and movement to become part of everyday life, without exhaustion, pressure or boredom, and to carry on after you reach your goal.')}</p>
  </div>
</section>`;
}

// ---------- pages ----------

const home = {
  file: 'index.html',
  title: (ctx) => ctx.L('أكلك، تمرينك، وصحتك', 'Your food, your training, your health'),
  desc: (ctx) => ctx.L('يلا ويل يضع خطة أكل وتمرين حسب جسمك وهدفك وحالتك الصحية، ويذكر بمواعيد الأدوية والتحاليل.', 'Yalla Well builds a food and training plan around your body, your goal and your health, and keeps track of your medicines and lab tests.'),
  body(ctx) {
    const { L } = ctx;
    const stats = [
      [314, '', L('صنف أكل بقيمه الغذائية', 'foods with their nutrition values')],
      [150, '+', L('وصفة من مطابخ عربية مختلفة', 'recipes from across the Arab world')],
      [9, '', L('أنظمة تمرين', 'training plans')],
      [90, '', L('تمرينا بالصور والشرح', 'exercises with pictures and cues')],
    ];
    const g = faqGroups(ctx);
    const top = [g[0].items[0], g[3].items[0], g[1].items[1], g[0].items[3], g[0].items[1]];
    return `
<section class="hero">
  <div class="wrap hero-text">
    <p class="pill reveal"><span class="dot" aria-hidden="true"></span>${L('قريبا على آيفون وأندرويد', 'Coming soon to iPhone and Android')}</p>
    <h1 class="display reveal" data-split>${L('أكلك، تمرينك، وصحتك<br>أساس خطتك الشخصية.', 'Your food, your training, your health.<br>The base of your personal plan.')}</h1>
    <p class="lead reveal">${L('يلا ويل يبني خطة أكل وتمرين من جسمك وهدفك وصحتك، ويعدلها معك مع الوقت. أكل متنوع، وتمرين بمجهود حقيقي وأيام راحة، من غير قواعد صارمة ولا ملل، حتى تصبح العادات الصحية جزءا من حياتك لسنوات.', 'Yalla Well builds your food and training plan from your body, your goal and your health, and keeps adjusting it with you over time. Varied food, real effort and proper rest, with no strict rules and no boredom, so healthy habits become part of your life for years.')}</p>
    <div class="reveal">${storeButtons(ctx)}</div>
  </div>
  <div class="hero-stage">
    <div class="glow" aria-hidden="true"></div>
    <div class="hero-phone">${trailer(ctx)}</div>
    <div class="float float-a glass" aria-hidden="true">
      <svg width="52" height="52" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" stroke="#2A2E33" stroke-width="6" fill="none"/><path d="M27 5A22 22 0 1 1 8 38" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" fill="none"/></svg>
      <span><b class="num">1,420</b><small>${L('سعرة متبقية اليوم', 'kcal left today')}</small></span>
    </div>
    <div class="float float-b glass" aria-hidden="true">
      <span class="tick">${icon('check', 15)}</span>
      <span><b>${L('رقم جديد: 32.5 كجم', 'New best: 32.5 kg')}</b><small>${L('2.5+ عن المرة السابقة', '+2.5 since last time')}</small></span>
    </div>
  </div>
</section>

<section class="stats" aria-label="${L('يلا ويل بالأرقام', 'Yalla Well in numbers')}">
  <div class="wrap stats-in">
    ${stats.map(([n, plus, t]) => `<div class="stat reveal"><span class="num" dir="ltr"><span data-count="${n}">${n}</span>${plus}</span><span>${t}</span></div>`).join('')}
  </div>
</section>

${oneApp(ctx)}

${tour(ctx)}

${accuracy(ctx)}

${coverage(ctx)}

<section class="section" id="how">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('البداية', 'Getting started'))}<h2 class="h2">${L('أول مرة في التطبيق.', 'The first time you open it.')}</h2></div>
    <div class="how-line" aria-hidden="true"><span></span></div>
    <ol class="how">
      <li class="reveal"><span class="how-n">01</span><h3>${L('نتعرف عليك', 'Getting to know you')}</h3><p>${L('العمر والطول والوزن والهدف، وأي حالة صحية أو أدوية.', 'Age, height, weight and goal, plus any health conditions or medicines.')}</p></li>
      <li class="reveal"><span class="how-n">02</span><h3>${L('نظام التمرين', 'Choosing a plan')}</h3><p>${L('9 أنظمة، أو 3 أسئلة يقترح بعدها التطبيق نظاما مناسبا. وكل يوم في الأسبوع يكون جيم أو بيت أو راحة.', 'One of nine plans, or three questions and we suggest one. Then each day of the week is set to gym, home or rest.')}</p></li>
      <li class="reveal"><span class="how-n">03</span><h3>${L('الخطة جاهزة', 'Your plan is ready')}</h3><p>${L('السعرات والبروتين والماء وأسبوع التمرين، مع ملاحظة عن كل شيء تغير بسبب الحالة الصحية.', 'Calories, protein, water and your training week, with a note on everything adjusted for your health.')}</p></li>
    </ol>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('الأسئلة', 'Questions'))}<h2 class="h2">${L('أسئلة متكررة', 'Frequently asked')}</h2></div>
    <div class="qas reveal">${top.map(qa).join('')}</div>
    <p class="more-link"><a class="link-arrow" href="faq.html">${L('كل الأسئلة', 'All questions')} ${icon('arrow', 18)}</a></p>
  </div>
</section>

${tryIt(ctx)}

${closing(ctx)}

${downloadPanel(ctx)}`;
  },
};

const features = {
  file: 'features.html',
  title: (ctx) => ctx.L('المميزات', 'Features'),
  desc: (ctx) => ctx.L('مميزات يلا ويل: أكل محسوب بالوزن ووصفات من مطابخ عربية مختلفة، وتمرين في الجيم أو البيت يتقدم مع الوقت، ومتابعة للأدوية والتحاليل حسب الحالة الصحية.', 'Yalla Well in detail: food counted by weight and recipes from across the Arab world, training at the gym or at home that moves forward, and medicines and lab tests followed around your health.'),
  body(ctx) {
    const { L } = ctx;
    const block = (id, img, alt, k, h, lead, groups, flip) => `<section class="feature${flip ? ' is-flip' : ''}" id="${id}">
      <div class="wrap feature-in">
        <div class="feature-text reveal">
          ${kicker(k)}<h2 class="h2">${h}</h2><p class="lead">${lead}</p>
          ${groups.map(([t, items]) => `<h3 class="h3">${t}</h3>${ticks(items)}`).join('')}
        </div>
        <div class="feature-media reveal">${phone(ctx, img, alt)}</div>
      </div>
    </section>`;
    return `${pageHero(ctx, L('المميزات', 'Features'), L('ماذا يفعل التطبيق بالضبط؟', 'What the app does, in detail.'), L('يبدأ التطبيق من الجسم والهدف والصحة. كل حالة صحية أو دواء يسجل في البداية يغير الأكل والتمرين والمواعيد، ولهذا تختلف خطة كل شخص عن غيره.', "The app starts from your body, your goal and your health. Every condition or medicine you add changes your food, your training and your timings, so no two plans look the same."))}
<nav class="jump wrap" aria-label="${L('أقسام الصفحة', 'On this page')}">
  <a href="#training">${icon('dumbbell', 18)}${L('التمرين', 'Training')}</a><a href="#food">${icon('plate', 18)}${L('الأكل', 'Food')}</a><a href="#health">${icon('pill', 18)}${L('الصحة والأدوية', 'Health and medicines')}</a><a href="#more">${icon('chart', 18)}${L('التقدم والتنبيهات', 'Progress and reminders')}</a>
</nav>
${block('training', 'train', L('شاشة التمرين', 'Training screen'), L('التمرين', 'Training'), L('تمرين حسب أيامك، يتقدم معك.', 'A training week around your days, moving forward.'), L('9 أنظمة بأسماء واضحة، من 3 إلى 6 أيام في الأسبوع، وتقدم أسبوعي محسوب.', 'Nine plans with plain names, from 3 to 6 days a week, with planned weekly progress.'), [
      [L('الأنظمة', 'Plans'), [L('الجسم كله، وعلوي وسفلي، ودفع وسحب ورجل، وأرداف ورجل، وعضلة في كل يوم، و5 أيام بين الجيم والبيت', 'Full body, upper and lower, push pull legs, glutes and legs, one muscle a day, and 5 days split between gym and home'), L('لمن لم يحدد نظاما: 3 أسئلة ثم اقتراح مناسب', 'Not sure? Three questions and we suggest one'), L('كل يوم جيم أو بيت أو راحة، ولكل يوم جيم تقسيمته: دفع أو سحب أو رجل وغيرها', 'Set each day to gym, home or rest, and choose the split for gym days')]],
      [L('التمارين', 'Exercises'), [L('90 تمرينا بالصور والشرح بالعربية', '90 exercises with pictures and cues'), L('نسخة بالجهاز مع اسمه، ونسخة بالأوزان الحرة', 'A machine version with the machine named, and a free-weight version'), L('تحدد أجهزة الجيم مرة واحدة، وتأتي التمارين على قدرها', 'The equipment your gym has is set once, and exercises are picked to match it'), L('التمرين الذي لا يناسب الحالة الصحية أو يتعب مفصلا يستبدل بتمرين أنسب، مع ذكر السبب', "An exercise that doesn't suit your health or a sore joint is swapped for a better one, with the reason shown"), L('يمكن حذف تمرين أو إضافة تمرين جديد إلى اليوم', 'Remove an exercise, or add your own to the day')]],
      [L('في الجيم', 'At the gym'), [L('الوزن يكتب بالأرقام، والتكرارات بزر زائد وناقص', 'Type the weight, set reps with plus and minus'), L('مؤقت للراحة بالوقت الحقيقي', 'A rest timer that runs in real time'), L('برنامج 4 أسابيع يتبدل بين ثقيل وأخف، ويرتفع الوزن المقترح عندما تكتمل كل التكرارات', 'A 4-week cycle between heavy and lighter weeks, with the suggested weight going up once you hit all your reps'), L('في الأيام المتعبة يصبح التمرين حركة خفيفة وتنفسا', 'On rough days, the workout becomes light mobility and breathing')]],
      [L('سجل التمرين', 'Logbook'), [L('لكل تمرين بطاقة فيها أفضل وزن، والهدف التالي، وكم بقي عليه', 'Each exercise has a record card with your best lift, your next goal and how far is left'), L('عمود لكل جلسة يبين التقدم من أول نظرة', 'A bar for every session, so progress shows at a glance'), L('خطة التمرين تصدر ملف PDF يمكن إرساله إلى المدرب', 'The training plan exports as a PDF to share with a coach')]],
    ], false)}
${block('food', 'food', L('شاشة الأكل', 'Food screen'), L('الأكل', 'Food'), L('أكل متنوع، محسوب بالوزن.', 'Varied food, counted by weight.'), L('هدف السعرات والبروتين والكارب والدهون يحسب من العمر والطول والوزن والنشاط والهدف، ويتعدل حسب الحالة الصحية.', 'Your calorie, protein, carb and fat targets come from your age, height, weight, activity and goal, and shift with your health.'), [
      [L('التسجيل', 'Logging'), [L('314 صنفا، كل صنف بكميته وسعراته والبروتين والكارب والدهون', '314 foods, each with portion, calories and macros'), L('القيم محسوبة بالجرام من قاعدة بيانات وزارة الزراعة الأمريكية <bdi>(USDA FoodData Central)</bdi>', 'Values counted by the gram from USDA FoodData Central'), L('فطور وغداء وعشاء ووجبات خفيفة، والوجبة تدخل في الحساب عند تعليمها', "Breakfast, lunch, dinner and snacks; a meal counts once it's ticked as eaten"), L('يمكن كتابة الوجبة بالكلمات، والتطبيق يحسبها', 'Type a meal the way you would say it, and the app works it out'), L('الأصناف المتكررة تظهر أولا', 'The foods you log most come first')]],
      [L('إذا لم تكن الأكلة في القائمة', "If a food isn't listed"), [L('بحث في قواعد بيانات الأغذية العامة على الإنترنت، وحفظ النتيجة في "أكلاتي"', 'Online search in public food databases, saved to "My foods"'), L('قراءة الباركود للمنتجات المغلفة في تطبيق الهاتف، والقيم من ملصقها <bdi>(Open Food Facts)</bdi>', 'Barcode scanning for packaged food in the phone app, with values from the label <bdi>(Open Food Facts)</bdi>')]],
      [L('الوصفات', 'Recipes'), [L('أكثر من 150 وصفة للفطور والغداء والعشاء والوجبات الخفيفة', 'More than 150 recipes for breakfast, lunch, dinner and snacks'), L('أطباق من الشام والخليج والمغرب العربي والعراق واليمن ومصر، بنسخ أخف', 'Dishes from the Levant, the Gulf, the Maghreb, Iraq, Yemen and Egypt, cooked lighter'), L('كمية الوصفة على قدر السعرات المتبقية في الوجبة، والمقادير تتغير معها', 'Each is sized to the calories left for that meal, with the ingredients rescaled'), L('الوصفات التي لا تناسب الحالة الصحية لا تظهر', "Recipes that don't suit your health are left out")]],
      [L('تنبيهات واقتراحات', 'Warnings and ideas'), [L('علامة حمراء للأكل كثير الملح، أو الذي يتجاوز الدهون أو الكارب، أو لا يناسب الحالة الصحية', "A red warning for high salt, going over your fat or carb limit, or food that doesn't suit your health"), L('إذا كانت أكلة ستتجاوز السعرات، تظهر حتى 3 بدائل أخف من النوع نفسه', 'If a food would take you over, up to 3 lighter swaps of the same kind'), L('إذا زادت وجبة، يقسم الباقي على بقية اليوم', 'Go over at one meal and the rest of the day is rebalanced'), L('في منتصف الليل يغلق اليوم ويحفظ للتقرير', 'The day locks after midnight and is saved for your report')]],
    ], true)}
<section class="section tight">
  <div class="wrap narrow">
    <p class="note reveal">${L('تطبيقات التصوير تخمن الكمية من الصورة. في اختبار لـ4 تطبيقات تصوير معروفة كان الفرق بين 250 و345 سعرة أقل من الحقيقة في الوجبة الواحدة (باحثون في NIH، مؤتمر NUTRITION 2026، لم تنشر بعد في مجلة محكمة).', 'Photo apps guess the portion from a picture. In a test of 4 well-known photo apps, meals came out about 250 to 345 kcal under the real amount (an NIH research team, NUTRITION 2026, not yet peer reviewed).')} <a href="${NEWS}" rel="noopener" target="_blank">${L('الخبر', 'Read the news')}</a></p>
  </div>
</section>
${block('health', 'labs', L('شاشة التحاليل', 'Lab results screen'), L('الصحة والأدوية', 'Health and medicines'), L('الصحة جزء من الخطة.', 'Your health is part of the plan.'), L('نأخذ الحالات الصحية والأدوية في الحسبان في التمرين والأكل. تكتب الحالة أو الدواء بالكلمات، ويتعرف عليها التطبيق ويعدل الخطة، وإذا لم يعرفها يسأل عنها 3 أسئلة.', "We take health conditions and medicines into account in training and food. Type a condition or medicine in your own words and the app recognises it and adjusts the plan; if it doesn't know it, it asks three questions."), [
      [L('الحالة الصحية', 'Health conditions'), [L('الأكل يتعدل: تنبيهات، وأكلات يفضل تجنبها مع بعض الأدوية، وبروتين أقل عند الحاجة', 'Food adjusts: warnings, foods to avoid with some medicines, and less protein when needed'), L('التمرين يتعدل: مجهود مناسب، وحركات أخف على المفصل المتعب، وبطاقة بالعلامات التي يجب أن يتوقف التمرين عندها', 'Training adjusts: a suitable effort, gentler moves for a painful joint, and a card of warning signs to stop'), L('الإصابة التي تحت العلاج تبعد التمارين التي تضغط عليها حتى الشفاء', 'An injury being treated keeps the exercises that load it out until it heals')]],
      [L('الأدوية والفيتامينات', 'Medicines and supplements'), [L('الجرعة والعدد والشكل: حبة، أو نقط، أو حقنة، وغيرها', 'Dose, count and form: pill, drops, injection and more'), L('كل يوم، أو كل عدة أيام، أو أيام محددة، أو كل أسبوع، أو كل شهر، وأكثر من موعد في اليوم', 'Daily, every few days, set weekdays, weekly or monthly, with several times a day'), L('تذكير في كل موعد، وعلامة عند أخذ الدواء', "A reminder at each time, and a tick once it's taken"), L('على معدة فارغة، أو مع الأكل، أو قبل النوم، والمواعيد منسقة مع الوجبات', 'On an empty stomach, with food or at bedtime, with times lined up against your meals'), L('تنبيه إذا كان هناك دواءان يجب الفصل بينهما', 'A warning when two must be taken apart')]],
      [L('سؤال اليوم', 'Daily check-in'), [L('كل يوم سؤال عن الطاقة والألم والنوم', 'Each day the app asks about your energy, pain and sleep'), L('إذا كان اليوم صعبا، يتحول التمرين تلقائيا إلى يوم راحة خفيف', 'A rough day turns into an easy recovery day by itself'), L('الإجابات تدخل في تقرير الطبيب', 'The answers go into the doctor report')]],
      [L('التحاليل', 'Lab tests'), [L('النتيجة والتاريخ وموعد التحليل التالي', 'The result, the date and when the next test is due'), L('صورة ورقة التحليل محفوظة في التطبيق', 'A photo of the lab paper kept in the app'), L('تذكير قبل موعد التحليل التالي', 'A reminder before the next test is due'), L('الألوان دليل تقريبي فقط، والطبيب هو من يقرر', 'Colours are only a rough guide; your doctor decides')]],
      [L('السعرات ونظام الأكل', 'Calories and macros'), [L('كل أسبوع يقارن التطبيق تغير الوزن الحقيقي ويعدل هدف السعرات', 'Every week the app looks at your real weight change and adjusts the calorie target'), L('إذا كان التقليل أكثر غير آمن، يقترح الحديث مع الطبيب', 'If cutting further is risky, it suggests talking to your doctor instead'), L('4 أنظمة: متوازن، وبروتين أعلى، وكارب أقل، وكيتو، والكيتو يغلق إذا كان غير آمن', 'Four macro modes: balanced, higher protein, lower carb and keto, with keto locked when unsafe')]],
      [L('تقرير الطبيب', 'Doctor report'), [L('ملف PDF لآخر 4 أسابيع: الأدوية والالتزام بها، والطاقة والألم والنوم، والأيام الصعبة، والتمرين، والتحاليل', 'A PDF of the last 4 weeks: medicines and adherence, energy, pain and sleep, rough days, workouts and labs'), L('يطبع أو يرسل من الهاتف', 'Print it or send it from your phone')]],
    ], false)}
<section class="section tight">
  <div class="wrap narrow">
    <p class="note reveal">${L('يلا ويل يساعد في المتابعة ويذكر بالمواعيد، لكنه لا يشخص ولا يغني عن الطبيب. القرار في الدواء أو الأكل أو التمرين للطبيب.', 'Yalla Well helps you keep track and reminds you. It does not diagnose and does not replace a doctor. Decisions about medicine, diet or training are for your doctor.')}</p>
  </div>
</section>
<section class="section" id="more">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('التقدم والتنبيهات', 'Progress and reminders'))}<h2 class="h2">${L('تقدم واضح، وتنبيهات بأرقامك.', 'Progress you can see, reminders with your numbers.')}</h2></div>
    <div class="tiles">
      ${[
        ['chart', L('صفحة التقدم', 'Progress page'), L('الوزن على رسم بياني، والمقاسات، ونسبة الدهون التقريبية، وصور التقدم. والصور تبقى على الهاتف.', 'Your weight on a chart, measurements, an estimated body-fat percentage and progress photos. The photos stay on your phone.')],
        ['instagram', L('صورة الأسبوع', 'Your weekly story'), L('صورة كل أسبوع فيها الأيام المتتالية، والأيام التي كانت في الهدف، وعدد التمارين، جاهزة للمشاركة.', 'A picture each week with your streak, days on target and workouts, ready to share.')],
        ['bell', L('تنبيهات بأرقام اليوم', "Reminders with the day's numbers"), L('للوجبات والماء والتمرين والأدوية والتحاليل. التنبيه يذكر كم كوب ماء وكم سعرة بقيت، وتمرين اليوم، والصياغة تتغير كل يوم. ولا يصل التنبيه إذا تم الأمر. في تطبيق الهاتف فقط.', "For meals, water, workouts, medicines and lab tests. Each one mentions your real numbers, like cups of water left, calories left and today's workout, and the wording changes every day. Skipped once it's done. Phone app only.")],
        ['moon', L('النوم', 'Sleep'), L('وقت النوم والاستيقاظ، وعدد الساعات مقارنة بالمعدل المناسب للعمر.', 'Bed and wake times, and your hours compared with the range for your age.')],
        ['heart', L('صحة المرأة', "Women's health"), L('تقويم الدورة مع الموعد المتوقع وأيام الخصوبة، وتمرين أخف في أول الأيام، ومتابعة الحمل أسبوعا بأسبوع، والرضاعة.', 'A period calendar with the expected period and fertile days, lighter training on the first days, pregnancy week by week, and breastfeeding.')],
        ['chart', L('تقرير أسبوعي', 'Weekly report'), L('كل يوم بالأخضر أو الأحمر، والأسابيع السابقة موجودة، ويمكن طباعته أو إرساله PDF.', 'Each day green or red, past weeks included, ready to print or share as a PDF.')],
        ['flame', L('نقاط وأيام متتالية', 'Points and streaks'), L('عندما تبقى السعرات بين 75% و110% من الهدف، ومع كل تمرين يكتمل.', 'For staying between 75% and 110% of your calorie target, and for every finished workout.')],
        ['globe', L('العربية والإنجليزية', 'Arabic and English'), L('اللغة تتغير في أي وقت، والنص العربي يخاطب الرجل والمرأة كل بصيغته.', 'Switch any time; the Arabic text addresses men and women each in their own form.')],
        ['heart', L('الكابتن', 'The captain'), L('بطل الشعار، يعلق على اليوم بجملة تناسبه، ويقدم جولة في التطبيق أول مرة.', 'The champ from our logo comments on your day and gives you a tour the first time.')],
      ].map(([ic, t, d]) => `<div class="tile reveal"><span class="tile-ic">${icon(ic, 24)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>
${downloadPanel(ctx)}`;
  },
};

const download = {
  file: 'download.html',
  title: (ctx) => ctx.L('التحميل', 'Download'),
  desc: (ctx) => ctx.L('يلا ويل متاح الآن على الويب من أي هاتف أو كمبيوتر، وقريبا على آيفون وأندرويد.', 'Yalla Well works now on the web from any phone or computer, and is coming soon to iPhone and Android.'),
  body(ctx) {
    const { L } = ctx;
    return `${pageHero(ctx, L('التحميل', 'Download'), L('يلا ويل على هاتفك.', 'Yalla Well on your phone.'), L('نسخة الويب متاحة الآن، وتطبيق آيفون وأندرويد في الطريق.', 'The web version works today. iPhone and Android apps are on the way.'))}
<section class="section tight">
  <div class="wrap">
    <div class="dl-grid">
      <div class="dl-card is-live reveal">
        <span class="badge">${L('متاح الآن', 'Available now')}</span>
        <span class="dl-ic">${icon('globe', 30)}</span>
        <h2 class="h3">${L('نسخة الويب', 'Web version')}</h2>
        <p>${L('تفتح من المتصفح على أي هاتف أو كمبيوتر، ولا تحتاج إلى تحميل.', 'Opens in the browser on any phone or computer, nothing to install.')}</p>
        <div class="dl-actions">
          <a class="btn btn-primary" href="${WEB_APP}">${L('فتح نسخة الويب', 'Open the web version')}</a>
          <img class="dl-qr" src="${ctx.root}static/img/qr-web.svg" alt="${L('رمز QR يفتح نسخة الويب', 'QR code that opens the web version')}" width="112" height="112">
        </div>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('آيفون', 'iPhone')}</h2>
        <p>${L('على App Store، مع التنبيهات وقراءة الباركود.', 'On the App Store, with reminders and barcode scanning.')}</p>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('أندرويد', 'Android')}</h2>
        <p>${L('على Google Play، مع التنبيهات وقراءة الباركود.', 'On Google Play, with reminders and barcode scanning.')}</p>
      </div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('خطوة صغيرة', 'One small step'))}<h2 class="h2">${L('يلا ويل على الشاشة الرئيسية', 'Yalla Well on your home screen')}</h2><p class="lead">${L('حتى يفتح مثل أي تطبيق، بأيقونة الكابتن.', 'So it opens like any app, with the captain as its icon.')}</p></div>
    <div class="howto">
      <div class="howto-col reveal"><h3 class="h3">${L('آيفون (Safari)', 'iPhone (Safari)')}</h3><ol><li>${L('فتح نسخة الويب في Safari', 'Open the web version in Safari')}</li><li>${L('زر المشاركة في الأسفل', 'Tap the Share button')}</li><li>${L('"إضافة إلى الشاشة الرئيسية"', '"Add to Home Screen"')}</li></ol></div>
      <div class="howto-col reveal"><h3 class="h3">${L('أندرويد (Chrome)', 'Android (Chrome)')}</h3><ol><li>${L('فتح نسخة الويب في Chrome', 'Open the web version in Chrome')}</li><li>${L('القائمة ⋮ في الأعلى', 'Tap the ⋮ menu')}</li><li>${L('"إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"', '"Add to Home screen" or "Install app"')}</li></ol></div>
    </div>
    <p class="note reveal">${L('نسخة الويب ليس فيها تنبيهات ولا قراءة الباركود، وهذه تأتي مع تطبيق الهاتف.', 'The web version has no reminders or barcode camera. Those come with the phone app.')}</p>
  </div>
</section>
<section class="section">
  <div class="wrap narrow center reveal">
    <h2 class="h2">${L('التطبيق قادم قريبا.', 'Want to know when it launches?')}</h2>
    <p class="lead">${hasSocial() ? L('سنعلن على وسائل التواصل الاجتماعي أول ما ينزل التطبيق.', "Follow us on social media; we'll announce it there first.") : L('سنعلن على وسائل التواصل الاجتماعي أول ما ينزل التطبيق، والحسابات ستضاف هنا قريبا.', "We'll announce it on social media first; our accounts will be listed here soon.")}</p>
    ${hasSocial() ? `<div class="socials socials-lg">${socialLinks(ctx)}</div>` : ''}
    <p><a class="link-arrow" href="contact.html">${L('صفحة التواصل', 'Or contact us')} ${icon('arrow', 18)}</a></p>
  </div>
</section>`;
  },
};

const faq = {
  file: 'faq.html',
  title: (ctx) => ctx.L('الأسئلة الشائعة', 'FAQ'),
  desc: (ctx) => ctx.L('أسئلة عن يلا ويل: السعرات، وأنظمة التمرين، والحالة الصحية والأدوية، والخصوصية، والتحميل.', 'Answers about Yalla Well: calories, training plans, health conditions and medicines, privacy and downloading.'),
  body(ctx) {
    const { L } = ctx;
    const groups = faqGroups(ctx);
    return `${pageHero(ctx, L('الأسئلة الشائعة', 'FAQ'), L('أسئلة وإجابات.', 'Questions and answers.'), L('وإذا لم يكن السؤال هنا، فصفحة التواصل مفتوحة.', "If your question isn't here, the contact page is."))}
<nav class="jump wrap" aria-label="${L('أقسام الأسئلة', 'Question topics')}">${groups.map((g) => `<a href="#${g.id}">${g.title}</a>`).join('')}</nav>
<section class="section tight">
  <div class="wrap narrow">
    ${groups.map((g) => `<div class="qa-group reveal" id="${g.id}"><h2 class="h3">${g.title}</h2><div class="qas">${g.items.map(qa).join('')}</div></div>`).join('')}
    <div class="ask reveal">
      ${champ('point', { size: 72 })}
      <div><h2 class="h3">${L('السؤال ليس هنا؟', "Didn't find it?")}</h2><p>${L('رسالة واحدة تكفي، ونرد عليها.', "Send us a message and we'll get back to you.")}</p></div>
      <a class="btn btn-ghost" href="contact.html">${L('صفحة التواصل', 'Contact us')}</a>
    </div>
  </div>
</section>`;
  },
};

const about = {
  file: 'about.html',
  title: (ctx) => ctx.L('عن يلا ويل', 'About'),
  desc: (ctx) => ctx.L('لماذا صنعنا يلا ويل: حتى يحصل كل شخص على خطة أكل وتمرين تناسب جسمه وصحته وأدويته، وتستمر معه لسنوات.', 'Why we made Yalla Well: so each person gets a food and training plan built around their body, their health and their medicines, that stays with them for years.'),
  body(ctx) {
    const { L } = ctx;
    const values = [
      ['chat', L('بلغة واضحة', 'In plain words'), L('التطبيق يتحدث بلغة بسيطة، والنص العربي يخاطب الرجل والمرأة كل بصيغته. والإنجليزية متاحة أيضا.', 'The app talks the way people talk, and its Arabic adjusts for men and women. English too.')],
      ['heart', L('الصحة تغير الخطة', 'Health changes the plan'), L('نأخذ الحالات الصحية والأدوية في الحسبان في التمرين والأكل والمواعيد، ولا نتركها في ملاحظة جانبية.', 'We take health conditions and medicines into account in training, food and timing, instead of leaving them in a side note.')],
      ['lock', L('البيانات على الهاتف', 'Your data stays on your phone'), L('لا يوجد حساب، والتاريخ الصحي غير مخزن على أي خادم لدينا.', 'No account, and no server of ours holding your health history.')],
      ['doc', L('لا يغني عن الطبيب', 'Not a doctor'), L('نساعد في التنظيم والمتابعة، والقرار الطبي للطبيب. والتقرير يسهل الحديث معه.', 'We help you organise and keep track; medical decisions stay with your doctor. The report makes that conversation easier.')],
    ];
    return `${pageHero(ctx, L('عن يلا ويل', 'About'), L('لماذا صنعنا يلا ويل؟', 'Why we made Yalla Well.'), L('أغلب تطبيقات الحمية تعطي الجميع الحساب نفسه، ولا تسأل عن الحالة الصحية ولا عن مواعيد الدواء، وتنتهي عند الوصول إلى الوزن المطلوب. أردنا تطبيقا يحسب هذا كله، ويبقى معك بعد الهدف: عادات صحية ومتابعة سهلة لسنوات.', 'Most diet apps give everyone the same numbers, never ask about health conditions or medicine times, and stop once you reach a target weight. We wanted an app that works all of that out and stays with you after the goal: healthy habits and easy follow-up for years.'))}
<section class="section tight">
  <div class="wrap">
    <div class="tiles tiles-4">
      ${values.map(([ic, t, d]) => `<div class="tile reveal"><span class="tile-ic">${icon(ic, 24)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap split">
    <div class="split-media reveal">${champ('cheer', { size: 260, cls: 'about-champ' })}</div>
    <div class="split-text reveal">
      ${kicker(L('الكابتن', 'The captain'))}
      <h2 class="h2">${L('بطل الشعار داخل التطبيق.', 'The champ from our logo lives in the app.')}</h2>
      <p class="lead">${L('الكابتن موجود في كل شاشة ويفعل ما يناسبها: يشجع في الرئيسية، ويأكل في صفحة الأكل، ويرفع الحديد في التمرين. وكل يوم يقول جملة تناسب ذلك اليوم.', 'The captain shows up on every screen doing something that fits it: cheering on Today, eating on Food and lifting on Training. Each day he says something about how your day is going.')}</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('لمن', 'Who it is for'))}<h2 class="h2">${L('يلا ويل مناسب لـ', 'Yalla Well is made for')}</h2></div>
    ${ticks([
      L('من يريد إنقاص الوزن أو تثبيته أو زيادته، بأكل متنوع من غير حمية مؤقتة', 'Anyone who wants to lose, keep or gain weight with varied food, without a short-term diet'),
      L('من يتمرن في الجيم، أو في البيت، أو بين الاثنين', 'People who train at the gym, at home, or a bit of both'),
      L('من لديه حالة صحية مزمنة ويأخذ أدوية وفيتامينات', 'People living with a long-term health condition and taking medicines and supplements'),
    ])}
  </div>
</section>
${downloadPanel(ctx)}`;
  },
};

const contactPage = {
  file: 'contact.html',
  title: (ctx) => ctx.L('التواصل', 'Contact us'),
  desc: (ctx) => ctx.L('سؤال أو اقتراح أو مشكلة في يلا ويل؟ عبر البريد الإلكتروني أو واتساب أو وسائل التواصل الاجتماعي.', 'A question, idea or problem with Yalla Well? Reach us by email, WhatsApp or social media.'),
  body(ctx) {
    const { L } = ctx;
    const soon = `<span class="muted">${L('قريبا', 'Coming soon')}</span>`;
    const socials = Object.entries(SOCIAL).filter(([, u]) => u);
    const ready = !!contact.email;
    return `${pageHero(ctx, L('التواصل', 'Contact us'), L('سؤال أو فكرة؟', 'A question, an idea or a problem?'), L('أو مشكلة في التطبيق؟ الرسالة تصل إلينا مباشرة.', 'A small question or an idea for something new in the app, it comes straight to us.'))}
<section class="section tight">
  <div class="wrap contact-in">
    <form class="form reveal" id="contact-form" data-email="${contact.email}" novalidate>
      <div class="field"><label for="f-name">${L('الاسم', 'Name')}</label><input id="f-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="f-email">${L('البريد الإلكتروني', 'Email')}</label><input id="f-email" name="email" type="email" autocomplete="email" dir="ltr" required></div>
      <div class="field"><label for="f-topic">${L('الموضوع', 'Topic')}</label><select id="f-topic" name="topic">
        <option>${L('سؤال', 'Question')}</option><option>${L('اقتراح', 'Suggestion')}</option><option>${L('مشكلة في التطبيق', 'Problem with the app')}</option><option>${L('تعاون أو عمل', 'Partnership or work')}</option>
      </select></div>
      <div class="field"><label for="f-msg">${L('الرسالة', 'Message')}</label><textarea id="f-msg" name="message" rows="6" required></textarea></div>
      <button class="btn btn-primary" type="submit"${ready ? '' : ' disabled'}>${L('إرسال الرسالة', 'Send message')}</button>
      <p class="small muted" id="form-note" aria-live="polite">${ready ? L('الزر يفتح تطبيق البريد والرسالة جاهزة فيه.', 'The button opens your email app with the message ready.') : L('النموذج يعمل بمجرد إضافة بريد التواصل.', 'The form will work as soon as our contact email is added.')}</p>
    </form>
    <div class="contact-cards">
      <div class="c-card reveal"><span class="tile-ic">${icon('mail', 22)}</span><div><h2 class="h3">${L('البريد الإلكتروني', 'Email')}</h2>${contact.email ? `<a href="mailto:${contact.email}" dir="ltr">${contact.email}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('chat', 22)}</span><div><h2 class="h3">${L('واتساب', 'WhatsApp')}</h2>${contact.whatsapp ? `<a href="https://wa.me/${contact.whatsapp}" dir="ltr" rel="noopener">+${contact.whatsapp}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('instagram', 22)}</span><div><h2 class="h3">${L('وسائل التواصل الاجتماعي', 'Social media')}</h2>${socials.length ? `<div class="c-links">${socials.map(([k, u]) => `<a href="${u}" rel="noopener">${L(SOCIAL_NAMES[k][0], SOCIAL_NAMES[k][1])}</a>`).join('')}</div>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('book', 22)}</span><div><h2 class="h3">${L('قبل الرسالة', 'Before you write')}</h2><a href="faq.html">${L('قد تكون الإجابة في الأسئلة الشائعة', 'The answer may be in the FAQ')}</a></div></div>
    </div>
  </div>
</section>`;
  },
};

function legal(ctx, title, sections) {
  const { L } = ctx;
  return `${pageHero(ctx, L('مسودة · آخر تحديث 15 أكتوبر 2026', 'Draft · last updated 15 October 2026'), title, '')}
<section class="section tight"><div class="wrap narrow prose">
${sections.map(([h, ps]) => `<h2 class="h3">${h}</h2>${ps.map((p) => Array.isArray(p) ? ticks(p) : `<p>${p}</p>`).join('')}`).join('\n')}
</div></section>`;
}

const privacy = {
  file: 'privacy.html',
  title: (ctx) => ctx.L('الخصوصية', 'Privacy'),
  desc: (ctx) => ctx.L('ماذا يفعل يلا ويل بالبيانات: كل شيء على الهاتف، ومن غير حساب.', 'How Yalla Well handles your data: everything stays on your phone, with no account.'),
  body(ctx) {
    const { L } = ctx;
    return legal(ctx, L('الخصوصية', 'Privacy'), [
      [L('باختصار', 'In short'), [L('يلا ويل ليس فيه حساب ولا تسجيل دخول. كل ما يسجل في التطبيق يحفظ على الهاتف نفسه، ولا يرسل إلى أي خادم لدينا.', "Yalla Well has no account or sign-in. Everything you record in the app is saved on your phone and isn't sent to a server of ours.")]],
      [L('ما يحفظ على الهاتف', 'What the app keeps on your phone'), [[L('البيانات الأساسية: الاسم والعمر والطول والوزن والهدف، وصورة الملف الشخصي إن وجدت', 'Basics: name, age, height, weight, goal, and a profile photo if you add one'), L('الحالات الصحية والأدوية والفيتامينات ومواعيدها، ونتائج التحاليل وصور أوراقها', 'Health conditions, medicines and supplements with their times, and lab results with photos of their papers'), L('الأكل والتمرين، وإجابات سؤال اليوم عن الطاقة والألم والنوم', 'Food, workouts and the daily energy, pain and sleep check-in')]]],
      [L('ما يخرج من الهاتف', 'What leaves your phone'), [[
        L('البحث عن أكلة غير موجودة في القائمة أو قراءة باركود: ترسل كلمة البحث أو رقم الباركود فقط إلى قواعد بيانات أغذية عامة (USDA FoodData Central وOpen Food Facts).', 'Searching for a food or scanning a barcode: only the search words or barcode number go to public food databases (USDA FoodData Central and Open Food Facts).'),
        L('النص المكتوب باليد، مثل حالة أو دواء غير موجود في القائمة، يرسل إلى خدمة ترجمة (Google Translate أو MyMemory) حتى يظهر باللغة الأخرى.', 'Text you type yourself, such as a condition or medicine not on the list, is sent to a translation service (Google Translate or MyMemory) so it can be shown in the other language.'),
        L('صور الوصفات والتمارين تحمل من مواقع عامة (TheMealDB وWikimedia وGitHub)، وفيديوهات الشرح من يوتيوب. وهذه المواقع ترى عنوان الإنترنت مثل أي موقع.', 'Recipe and exercise pictures load from public sites (TheMealDB, Wikimedia and GitHub), and how-to videos from YouTube. Like any website, these see your internet address.'),
        L('تقرير الطبيب والتقرير الأسبوعي لا يرسلان إلى أحد، إلا إذا تم إرسالهما من الهاتف يدويا.', 'The doctor report and weekly report go nowhere unless you send them yourself.'),
      ]]],
      [L('التنبيهات', 'Reminders'), [L('التنبيهات تجهز على الهاتف نفسه، ولا تمر بأي خادم.', 'Reminders are scheduled on the phone itself and do not pass through a server.')]],
      [L('هذا الموقع', 'This website'), [L('الموقع ليس فيه إعلانات ولا ملفات تتبع ولا أدوات تحليل، والخطوط والصور والفيديو كلها مستضافة عندنا.', 'This website has no ads, tracking cookies or analytics, and serves its own fonts, images and video.')]],
      [L('حذف البيانات', 'Deleting your data'), [L('في "ملفي" زر يحذف كل البيانات. وحذف التطبيق، أو مسح بيانات الموقع من المتصفح، يحذفها أيضا. ولا توجد لدينا نسخة يمكن استرجاعها.', 'In "Me" there is a button that deletes all your data. Uninstalling the app or clearing the site data in your browser deletes it too. We hold no copy, so it cannot be restored.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('إذا تغيرت هذه الصفحة، يتغير التاريخ في أعلاها. ولأي سؤال، <a href="contact.html">صفحة التواصل</a>.', 'If this page changes, the date above will change. For any question, see the <a href="contact.html">contact page</a>.')]],
    ]);
  },
};

const terms = {
  file: 'terms.html',
  title: (ctx) => ctx.L('الشروط', 'Terms'),
  desc: (ctx) => ctx.L('شروط استخدام يلا ويل.', 'Terms of use for Yalla Well.'),
  body(ctx) {
    const { L } = ctx;
    return legal(ctx, L('شروط الاستخدام', 'Terms of use'), [
      [L('التطبيق', 'The app'), [L('يلا ويل أداة تساعد في التنظيم والمتابعة: حساب السعرات، وترتيب التمرين، ومواعيد الأدوية. هذه النسخة تجريبية، وقد تتغير بعض أجزائها.', 'Yalla Well is a tool to organise and keep track: counting calories, planning training and timing medicines. The current version is a trial, and things may change.')]],
      [L('ليست نصيحة طبية', 'Not medical advice'), [L('ما في التطبيق معلومات عامة ومساعدة في التنظيم، وليس تشخيصا ولا علاجا، ولا يغني عن الطبيب. أي تغيير في الدواء أو الأكل أو التمرين يكون بعد موافقة الطبيب. وإذا ظهرت أي علامة خطر أثناء التمرين، يتوقف التمرين فورا ويجب إبلاغ الطبيب.', 'The app offers general information and help with organising. It is not a diagnosis, treatment or a substitute for a doctor. Talk to your doctor before changing any medicine, diet or training, and stop training and contact a doctor straight away if any warning sign appears.')]],
      [L('دقة المعلومات', 'Accuracy'), [L('السعرات والقيم الغذائية تقريبية، وتختلف حسب الكمية وطريقة الطبخ. ونتائج البحث على الإنترنت تأتي من قواعد بيانات عامة قد تحتوي على أخطاء.', 'Calories and nutrition values are estimates and vary with portion and cooking. Online search results come from public databases that may contain errors.')]],
      [L('الاستخدام', 'Use'), [L('التطبيق للاستخدام الشخصي، والبيانات فيه ملك لصاحبها ومخزنة على هاتفه.', 'The app is for personal use. The data you enter is yours and stays on your phone.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('قد تحدث هذه الشروط، والتاريخ في الأعلى يبين آخر تحديث. ولأي سؤال، <a href="contact.html">صفحة التواصل</a>.', 'These terms may be updated; the date above shows the latest version. For any question, see the <a href="contact.html">contact page</a>.')]],
    ]);
  },
};

export const PAGES = [home, features, download, faq, about, contactPage, privacy, terms];
