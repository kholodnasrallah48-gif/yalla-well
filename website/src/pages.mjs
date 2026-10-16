// Every page of the website. Each page is written once with L(arabic, english) and built in both languages.
// Arabic copy: light Egyptian mixed with common colloquial Arabic any Arab reader understands (no heavy dialect words,
// no formal fusha), gender neutral ("we", the app or nouns as the subject, no imperatives), no tashkeel. Use "دايت",
// never "رجيم". No disease or medicine names outside the "try it" examples.
import { SOCIAL_NAMES, champ, contact, hasSocial, icon, socialLinks, storeButtons } from './layout.mjs';
import { SOCIAL, WAITLIST_URL, WHATSAPP_CHANNEL } from './config.mjs';

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
      [L('إيه هو يلا ويل؟', 'What is Yalla Well?'), L('تطبيق بيعملك خطة أكل وتمرين على حسب جسمك وهدفك وصحتك، وبيفكرك بمواعيد الأدوية والتحاليل. ولو صحتك أو أدويتك اتغيرت، الخطة بتتغير معاها.', 'An app that builds a food and training plan around your body, your goal and your health, and keeps track of your medicines and lab tests. When your health or medicines change, the plan changes too.')],
      [L('التطبيق مجاني؟', 'Does it cost anything?'), L('النسخة الحالية تجريبية ومن غير أي اشتراك.', 'The current version is a trial and has no subscription.')],
      [L('لازم أعمل حساب؟', 'Do I need an account?'), L('لا. التطبيق من غير تسجيل دخول، وكل بياناتك متخزنة على موبايلك نفسه.', "No. There's no sign-in, and everything is saved on your phone.")],
      [L('إمتى التطبيق ينزل؟', 'When does the app launch?'), L('قريبا على آيفون وأندرويد. هنعلن على قناة الواتساب والسوشيال ميديا أول ما ينزل.', "Soon on iPhone and Android. We'll announce it on our WhatsApp channel and social media as soon as it's out.")],
      [L('موجود بالإنجليزي؟', 'Is it available in English?'), L('أيوه، عربي وإنجليزي، واللغة بتتغير من صفحة اليوم في أي وقت.', 'Yes, Arabic and English. Switch any time from the Today page.')],
    ] },
    { id: 'food', title: L('الأكل', 'Food'), items: [
      [L('السعرات بتتحسب على أساس إيه؟', 'How are my calories worked out?'), L('على العمر والطول والوزن والنشاط والهدف. ومع بعض الحالات الصحية، أو وقت الحمل، بنقلل العجز في السعرات أو نشيله من الأساس.', 'From your age, height, weight, activity and goal. With some health conditions, or during pregnancy, the app makes the calorie deficit smaller or drops it altogether.')],
      [L('أرقام الأكل جاية منين؟', 'Where do the food numbers come from?'), L('كل أكلة محسوبة بوزنها بالجرام من قاعدة بيانات وزارة الزراعة الأمريكية للأغذية <bdi>(USDA FoodData Central)</bdi>. والمنتجات المغلفة بتتحسب من ملصقها بقراءة الباركود <bdi>(Open Food Facts)</bdi>.', 'Every food is counted by its weight in grams, using values from the USDA FoodData Central database. Packaged products are counted from their label when you scan the barcode <bdi>(Open Food Facts)</bdi>.')],
      [L('فيه وصفات؟', 'Are there recipes?'), L('أكتر من 150 وصفة للفطار والغدا والعشا والسناك، من الشام والخليج والمغرب العربي والعراق واليمن ومصر، بنسخ أخف. وكمية كل وصفة بتتظبط على السعرات الباقية في الوجبة، والمقادير بتتغير معاها.', 'More than 150 recipes for breakfast, lunch, dinner and snacks, from the Levant, the Gulf, the Maghreb, Iraq, Yemen and Egypt, cooked the lighter way. Each one is sized to the calories left for that meal, and the ingredients change with it.')],
      [L('هدف السعرات بيتغير مع الوقت؟', 'Does my calorie target change over time?'), L('أيوه. كل أسبوع بنقارن تغير وزنك الحقيقي بالمتوقع ونعدل الهدف. ولو حالتك الصحية بتخلي التقليل أكتر مش آمن، بنقترح الكلام مع الدكتور الأول بدل ما نقلل السعرات. ولو النظام من أخصائي تغذية، بيفضل زي ما هو.', 'Yes. Each week the app compares your real weight change with what was expected and adjusts the target. If a health condition makes cutting further risky, it suggests talking to your doctor first instead of lowering calories. A plan from your dietitian stays as they wrote it.')],
      [L('فيه كيتو أو كارب أقل؟', 'Is there keto or lower carb?'), L('فيه 4 أنظمة: متوازن، وبروتين أعلى، وكارب أقل، وكيتو. والكيتو بيتقفل لو فيه حالة صحية تخليه مش آمن.', 'There are four modes: balanced, higher protein, lower carb and keto. Keto is locked when a health condition makes it unsafe.')],
      [L('ولو عندي نظام أكل من دكتور أو أخصائي تغذية؟', 'What if a doctor or dietitian gave me a diet plan?'), L('أرقام النظام بتتسجل في التطبيق: السعرات والبروتين والكارب والدهون، والوجبات والاقتراحات بتمشي عليها. والتطبيق مش بيغير الأرقام دي لوحده مع الوزن، ده دور الأخصائي. ولو فيه حالة صحية، الأفضل يكون النظام مكتوب من دكتور أو أخصائي تغذية.', 'You enter its numbers: calories, protein, carbs and fat, and meals and suggestions follow them. The app does not change those numbers by itself as your weight changes; that is for your dietitian. With a health condition, a plan written by a doctor or dietitian is the better choice.')],
      [L('ولو عندي حساسية من أكل؟', 'What if I have a food allergy?'), L('بنسأل عنها في أول مرة: مكسرات، أو فول سوداني، أو لبن، أو بيض، أو سمك، أو جمبري، أو قمح، أو سمسم، أو صويا، أو أي أكل تاني بيتكتب بالاسم. الوصفات اللي فيها الأكل ده مش بتظهر، ولو اتسجل بيظهر عليه تنبيه أحمر.', 'The app asks the first time you open it: tree nuts, peanuts, milk, eggs, fish, shellfish, wheat, sesame, soy, or any other food typed by name. Recipes with it stay out of your suggestions, and if you log it you see a red alert.')],
      [L('ليه الوجبة مش بتتحسب لوحدها؟', "Why doesn't a meal count by itself?"), L('علشان الحساب يكون على اللي اتاكل بجد. الوجبة بتدخل الحساب لما يتحط عليها علامة صح، مش لما ييجي ميعادها.', 'A meal counts once you tick it as eaten, not by the clock, so your totals reflect what actually happened.')],
      [L('ولو الأكلة مش موجودة في القائمة؟', "What if a food isn't on the list?"), L('التطبيق بيدور عليها في قواعد بيانات الأكل العامة على الإنترنت، واللي يلاقيه بيتحفظ في "أكلاتي". وتطبيق الموبايل بيقرا الباركود كمان.', 'The app searches public food databases online, and anything it finds is saved to "My foods". The phone app can also scan barcodes.')],
      [L('إيه اللي بيحصل الساعة 12 بالليل؟', 'What happens at midnight?'), L('اليوم بيتقفل ويتحفظ زي ما هو، ويدخل في التقرير الأسبوعي.', 'The day locks, is saved as it is, and goes into the weekly report.')],
    ] },
    { id: 'training', title: L('التمرين', 'Training'), items: [
      [L('إيه أنظمة التمرين الموجودة؟', 'Which training plans are there?'), L('9 أنظمة من 3 لـ6 أيام، منها الجسم كله، وعلوي وسفلي، ودفع وسحب ورجل، وأرداف ورجل، و5 أيام بين الجيم والبيت. ولو مفيش نظام في دماغك، بنسألك 3 أسئلة ونقترح نظام مناسب.', "Nine plans from 3 to 6 days, including full body, upper and lower, push pull legs, glutes and legs, and 5 days split between gym and home. Not sure? Answer three questions and we'll suggest one.")],
      [L('ينفع التمرين في البيت؟', 'Can I train at home?'), L('أيوه. كل يوم في الأسبوع ممكن يكون جيم أو بيت أو راحة، والتمارين بتتغير على حسبه.', 'Yes. Each day of the week can be gym, home or rest, and the exercises change to match.')],
      [L('التمرين بيتطور مع الوقت؟', 'How does training progress?'), L('أيوه. لما كل التكرارات في كل المجموعات تكمل، الوزن المقترح بيزيد المرة الجاية. والأسابيع بتتبدل بين تقيل وأخف علشان الجسم ياخد وقته في الراحة.', 'Once you hit all your reps in every set, the suggested weight goes up next time. Weeks alternate between heavy and lighter so your body gets time to recover.')],
      [L('ولو الجهاز مشغول أو مش موجود؟', 'What if a machine is busy or missing?'), L('كل تمرين ليه نسخة بالأوزان الحرة ونسخة بالجهاز. وينفع كمان حذف تمرين أو إضافة تمرين جديد لليوم.', 'Every exercise has a free-weight and a machine version. You can also remove an exercise or add your own to the day.')],
      [L('التطبيق بيسجل الأوزان؟', 'Does it keep track of my lifts?'), L('أيوه. كل تمرين ليه سجل فيه أحسن وزن، والهدف الجاي، وفاضل قد إيه عليه، وعمود لكل جلسة. وخطة التمرين بتطلع ملف PDF ينفع يتبعت للمدرب.', 'Yes. Each exercise has a logbook with a record card showing your best lift, your next goal and how far is left, plus a bar for every session. The training plan also exports as a PDF to share with a coach.')],
      [L('التمارين هتناسب أجهزة الجيم؟', 'Will the exercises fit my gym?'), L('أجهزة الجيم بتتحدد مرة واحدة، والتمارين بتيجي على قد الموجود بس.', 'The equipment your gym has is set once, and the exercises match what is there.')],
    ] },
    { id: 'health', title: L('الصحة والأدوية', 'Health and medicines'), items: [
      [L('هو بديل عن الدكتور؟', 'Does it replace my doctor?'), L('لا. يلا ويل بيساعد في التنظيم والمتابعة، ومش بيشخص. والقرار في الدواء أو الأكل أو التمرين بيكون مع الدكتور.', 'No. Yalla Well helps you organise and keep track, and it does not diagnose. Decisions about medicine, diet and training are for you and your doctor.')],
      [L('الحالة الصحية بتغير إيه في الخطة؟', 'How does my health change the plan?'), L('بناخد الحالات الصحية والأدوية في الحسبان في التمرين والأكل: تنبيهات على بعض الأكلات، ومجهود مناسب في التمرين، وبدايل للتمارين اللي مش مناسبة. ولو الحالة مش معروفة للتطبيق، بنسألك 3 أسئلة عن الأكل والتمرين والعلامات اللي لازم التمرين يقف عندها.', 'We take health conditions and medicines into account in training and food: warnings on some foods, a suitable training effort, and swaps for exercises that do not fit. If the app does not know a condition, it asks three questions about food, training and the warning signs to stop at.')],
      [L('والأدوية والفيتامينات؟', 'How does it handle medicines and supplements?'), L('كل دواء ليه جرعته وعدده وعدد مراته ومواعيده، وبنفكرك في كل ميعاد. ولو فيه دواءين لازم يتفصلوا عن بعض، التطبيق بينبهك.', 'Each one gets its dose, amount, frequency and times, with a reminder at each time. It also warns when two must be taken apart.')],
      [L('إيه هو تقرير الدكتور؟', "What's the doctor report?"), L('ملف PDF لآخر 4 أسابيع: الأدوية والالتزام بيها، والطاقة والألم والنوم، والأيام الصعبة، والتمرين، والتحاليل. ينفع يتطبع أو يتبعت.', 'A PDF of the last 4 weeks: medicines and how regularly they were taken, energy, pain and sleep, rough days, workouts and lab results. Print it or send it.')],
      [L('التحاليل بتتسجل على أي شكل؟', 'How do lab results work?'), L('بتتكتب النتيجة والتاريخ، وينفع تتحفظ صورة ورقة التحليل في التطبيق، وبنفكرك لما ييجي ميعاد التحليل الجاي. ألوان النتائج دليل تقريبي بس، والدكتور هو اللي يقرر معناها.', 'You enter the result and the date, can keep a photo of the lab paper in the app, and get a reminder when the next test is due. The colours next to a result are only a rough guide; your doctor decides what it means.')],
      [L('وفي اليوم المتعب؟', 'What happens on a rough day?'), L('كل يوم بنسألك عن الطاقة والألم والنوم. ولو اليوم باين صعب من الإجابات، تمرين اليوم بيتحول لوحده ليوم راحة خفيف.', "Each day the app asks about your energy, pain and sleep. If the answers point to a rough day, that day's workout turns into an easy recovery day by itself.")],
      [L('التطبيق بيراعي الظروف اللي بتتغير، زي الإصابة أو الحمل؟', 'Does it adjust when things change, like an injury or a pregnancy?'), L('أيوه. الإصابة اللي تحت العلاج بتشيل التمارين اللي بتضغط عليها لحد ما تخف، والحمل بيغير السعرات والتمارين على حسب الشهر، وأول أيام الدورة التمرين بيبقى أخف. وكمان فيه متابعة للنوم وعدد ساعاته.', "Yes. An injury being treated takes out the exercises that load it until it heals, a pregnancy changes calories and exercises month by month, and the first days of a period get a lighter workout. Sleep is tracked too.")],
    ] },
    { id: 'privacy', title: L('الخصوصية', 'Privacy'), items: [
      [L('بياناتي بتتحفظ فين؟', 'Where is my data stored?'), L('على موبايلك نفسه، مش على سيرفر عندنا. التفاصيل في <a href="privacy.html">صفحة الخصوصية</a>.', 'On your phone, not on a server of ours. Details are on the <a href="privacy.html">privacy page</a>.')],
      [L('ينفع أمسح بياناتي؟', 'How do I delete my data?'), L('أيوه. في "ملفي" فيه زرار بيمسح كل حاجة ويبدأ من الأول. ومسح التطبيق من الموبايل بيمسح البيانات كمان.', 'In "Me" there\'s a button that deletes everything and starts over. Uninstalling the app deletes it too.')],
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
        <p class="lead">${L('التطبيق جاي قريب على آيفون وأندرويد.', 'The app is coming soon to iPhone and Android.')}</p>
        ${storeButtons(ctx)}
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
    L('يومك <b>قدامك</b>', 'Your <b>day</b>'),
    L('أكلك <b>بالجرام</b>', 'Food, <b>weighed</b>'),
    L('تمرين <b>بيتطور</b>', 'Training <b>grows</b>'),
    L('أرقامك <b>محفوظة</b>', 'Your <b>records</b>'),
    L('صحتك <b>متابعة</b>', 'Health, <b>tracked</b>'),
    L('وصفات <b>كتير</b>', 'Real <b>recipes</b>'),
    L('إنجازك <b>في صورة</b>', 'Snap your <b>progress</b>'),
  ];
  const label = L('فيديو قصير من التطبيق: صفحة اليوم، والأكل، والتمرين، وسجل التمرين، وصفحة الصحة، والوصفات، وصورة الإنجاز', 'A short video of the app: Today, food, training, the logbook, the Health page, recipes and the progress photo');
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
    ['flame', L('عداد السعرات', 'Calorie counter'), L('اشتراك لوحده', 'Separate subscription')],
    ['dumbbell', L('خطة التمرين', 'Workout plan'), L('اشتراك لوحده', 'Separate subscription')],
    ['heart', L('متابعة الدورة', 'Period tracker'), L('اشتراك لوحده', 'Separate subscription')],
    ['moon', L('متابعة النوم', 'Sleep tracker'), L('اشتراك لوحده', 'Separate subscription')],
    ['pill', L('تذكير الأدوية', 'Medicine reminders'), L('تطبيق تاني', 'Another app')],
    ['lab', L('ورق التحاليل', 'Lab papers'), L('في الدرج', 'In a drawer')],
  ];
  return `<section class="section one" id="one" aria-labelledby="one-title">
  <div class="wrap one-in">
    <div class="one-text reveal">
      ${kicker(L('تطبيق واحد', 'One app'))}
      <h2 class="h2" id="one-title">${L('تطبيق واحد بدل كذا تطبيق.', 'One app instead of several.')}</h2>
      <p class="lead">${L('بدل اشتراك لكل حاجة لوحدها: عداد سعرات، وخطة تمرين، وتطبيق للنوم، وتذكير بالأدوية. هنا كله مربوط ببعضه، والتطبيق فاكر تاريخك سنين لقدام.', 'Many people pay for each piece on its own: a calorie counter, a workout plan, a period tracker, a sleep app, medicine reminders, and lab papers in a drawer. None of them knows about the others.')}</p>
      <p class="lead">${L('الأكل عارف عن التمرين، والتمرين عارف عن النوم والأدوية والتحاليل. ومع الوقت الخطة بتتغير مع سنك وظروفك، بدل البداية من الصفر مع كل تطبيق جديد.', 'In Yalla Well, your food knows about your training, and your training knows about your sleep, medicines and lab results. The idea is for it to stay with you for years: easy follow-up that knows your history and changes with your age and your life, instead of starting from zero with every new app.')}</p>
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
      <p class="one-note">${L('الأكل والتمرين والنوم والدورة والأدوية والتحاليل، كلهم في تطبيق واحد عارف حالتك.', 'Food, training, sleep, your cycle, medicines and lab results, in one app that knows your situation.')}</p>
      <button class="btn btn-primary btn-sm stack-btn" type="button" data-merge="${L('جمع التطبيقات', 'Bring them together')}" data-split-label="${L('فصلها تاني', 'Show them apart')}">${L('جمع التطبيقات', 'Bring them together')}</button>
    </div>
  </div>
</section>`;
}

function tour(ctx) {
  const { L } = ctx;
  const steps = [
    { img: 'home', k: L('اليوم', 'Today'), h: L('يومك في نظرة.', 'Your day at a glance.'),
      p: L('جملة عن يومك، والأدوية والفيتامينات بمواعيدها، وسؤال سريع عن الطاقة والألم والنوم، والأيام المتتالية. والأكل والتمرين والصحة كل واحد في صفحته.', 'A line about your day, your medicines and supplements with their times, a quick check on energy, pain and sleep, and your streaks. Food, training and health each have their own page.'),
      alt: L('صفحة اليوم: جملة عن اليوم، وفيتامينات اليوم، وسؤال عن الطاقة والألم والنوم، والأيام المتتالية', "Today page: a line about the day, today's supplements, the energy, pain and sleep check and the streaks") },
    { img: 'train', k: L('التمرين', 'Training'), h: L('تمرين بيتطور مع الوقت.', 'Training that moves forward.'),
      p: L('لما كل التكرارات تكمل، الوزن المقترح بيزيد، والأسابيع بتتبدل بين تقيل وأخف علشان الجسم يرتاح.', 'Once all your reps are done the suggested weight goes up, and weeks alternate between heavy and lighter so your body can recover.'),
      alt: L('شاشة التمرين: يوم رجل فيه 8 تمارين بمجموعاتها وتكراراتها', 'Training screen: a legs day with eight exercises, sets and reps') },
    { img: 'logbook', k: L('سجل التمرين', 'Logbook'), h: L('سجل لكل تمرين.', 'A record for every lift.'),
      p: L('كل مجموعة بتخلص بتتسجل بوزنها وعداتها، ومعاها أحسن رقم، والهدف الجاي، وعمود لكل جلسة. فايدته: الوزن المناسب للمرة الجاية بيبقى قدامك، والقوة وهي بتزيد بتبان بالأرقام.', 'Every set you finish is saved with its weight and reps. You see your best lift, your next goal and a bar for every session, so you know what to lift next time and watch your strength grow.'),
      alt: L('سجل التمرين: أحسن رقم 32.5 كجم، والهدف الجاي، وعمود لكل جلسة', 'Logbook: best lift 32.5 kg, the next goal and a bar for each session') },
    { img: 'health', k: L('الصحة', 'Health'), h: L('صحتك في صفحة واحدة.', 'Your health on one page.'),
      p: L('النوم وعدد ساعاته، والأدوية والفيتامينات بمواعيدها، والتحاليل، وتقرير للدكتور. ولو فيه ظرف زي الحمل أو أيام الدورة، بيتابع هنا كمان.', 'Sleep and its hours, medicines and supplements with their times, lab results and a report for your doctor. A pregnancy or your period is followed here too.'),
      alt: L('صفحة الصحة: النوم وعدد الساعات في الأسبوع، والتحاليل، وتقرير الدكتور', 'Health page: sleep hours over the week, lab results and the doctor report') },
    { img: 'labs', k: L('التحاليل', 'Lab results'), h: L('التحاليل وورقتها مع بعض.', 'Lab results, with the paper.'),
      p: L('النتيجة والتاريخ وميعاد التحليل الجاي، مع صورة الورقة نفسها، وتذكير قبل الميعاد.', "The result, the date and when the next test is due, with a photo of the paper itself and a reminder before it's due."),
      alt: L('شاشة التحاليل: نتيجة فيتامين د وتاريخها وميعاد التحليل الجاي وصور الورق', 'Lab results screen: a vitamin D result, its date, the next test date and photos of the papers') },
    { img: 'recipe', k: L('الوصفات', 'Recipes'), h: L('أكتر من 150 وصفة.', 'More than 150 recipes.'),
      p: L('أكلات من الشام والخليج والمغرب العربي والعراق واليمن ومصر، بنسخة أخف، وبكمية على قد السعرات الباقية.', 'Dishes from the Levant, the Gulf, the Maghreb, Iraq, Yemen and Egypt, cooked lighter and sized to the calories you have left.'),
      alt: L('وصفة كبسة دجاج خفيفة بالرز البني: السعرات والبروتين والمكونات', 'Light chicken kabsa recipe: calories, protein and ingredients') },
    { img: 'progress', k: L('التقدم', 'Progress'), h: L('التقدم في جسمك.', 'Progress in your body.'),
      p: L('ده غير سجل التمرين: هنا الجسم نفسه. الوزن على رسم بياني، والمقاسات كل أسبوعين، لأن الميزان لوحده مش بيقول كل حاجة. فايدته: الدهون اللي بتنزل بتبان حتى لو الوزن ثابت.', 'This is separate from the logbook: it tracks your body. Your weight on a chart and tape measurements every two weeks, because the scale alone does not tell the whole story, so you can see fat going down even when the weight holds still.'),
      alt: L('صفحة التقدم: رسم بياني للوزن والمقاسات', 'Progress page: a weight chart and body measurements') },
    { img: 'cam', k: L('صورة الإنجاز', 'Progress photo'), h: L('إنجازك في صورة.', 'Your progress in a photo.'),
      p: L('الدايرة اللي جنب الاسم فيها أيام الأسبوع. بلمسة الكاميرا بتفتح جوه إطار هادي فيه أرقامك الحقيقية: الأيام المتتالية، والتمارين، وأيام الهدف. والصورة جاهزة للمشاركة.', 'The ring by your name holds the days of your week. One tap opens the camera inside a quiet frame with your real numbers: your streak, workouts and days on target, ready to share.'),
      alt: L('صورة الإنجاز: صورة في الجيم وعليها إطار فيه 13 يوم ورا بعض والتمارين وأيام الهدف', 'Progress photo: a gym photo inside a frame showing a 13-day streak, workouts and days on target') },
  ];
  return `<section class="tour" id="features" aria-labelledby="tour-title">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('جوه التطبيق', 'Inside the app'))}<h2 class="h2" id="tour-title">${L('8 شاشات من يوم حقيقي.', 'Eight screens from a real day.')}</h2></div>
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
    <div class="sec-head reveal">${kicker(L('دقة السعرات', 'Calorie accuracy'))}<h2 class="h2" id="acc-title">${L('ليه بنحسب الأكل بالوزن مش بالصورة.', 'Why we count food by weight, not by photo.')}</h2></div>
    <div class="acc-nums">
      <div class="acc-card reveal"><span class="acc-n num is-warn" dir="ltr">250-345</span><p>${L('سعرة أقل من الحقيقة في الوجبة الواحدة، في اختبار لـ4 تطبيقات تصوير معروفة', 'kcal per meal below the real amount, in a test of 4 well-known photo apps')}</p></div>
      <div class="acc-card reveal"><span class="acc-n num" dir="ltr">USDA</span><p>${L('أرقام الأكل في يلا ويل محسوبة بالجرام من قاعدة بيانات الأكل الأمريكية', 'Food values in Yalla Well are counted by the gram from the US food database')}</p></div>
    </div>
    <div class="acc-text reveal">
      <p class="lead">${L('تطبيقات التصوير بتخمن الكمية من الصورة، وكتير بتغلط. إحنا بنحسب أكلك بالجرام من قاعدة بيانات موثوقة.', 'Photo apps guess the portion from a picture, and they can be far off.')}</p>
      <p class="lead">${L('كل أكلة محسوبة بوزنها من أرقام وزارة الزراعة الأمريكية <bdi>(USDA FoodData Central)</bdi>، والمنتجات المغلفة من ملصقها بقراءة الباركود <bdi>(Open Food Facts)</bdi>.', 'In Yalla Well every food is counted by its weight using USDA FoodData Central values, and packaged products from their own label when you scan the barcode <bdi>(Open Food Facts)</bdi>.')}</p>
    </div>
    <p class="src reveal">${L('المصدر: باحثين في المعاهد الوطنية للصحة الأمريكية <bdi>(NIH)</bdi> اختبروا 102 وجبة، وعرضوا النتائج في مؤتمر NUTRITION 2026، والدراسة لسه مش منشورة في مجلة محكمة.', 'Source: an NIH research team tested 102 meals and presented the results at NUTRITION 2026; the study is not yet peer reviewed.')} <a href="${NEWS}" rel="noopener" target="_blank">${L('الخبر', 'Read the news')}</a></p>
  </div>
</section>`;
}

function coverage(ctx) {
  const { L } = ctx;
  const items = [
    ['plate', L('الأكل', 'Food'), L('سعرات وبروتين محسوبين بالوزن، ووصفات بكمية على قد الوجبة، ومن غير الأكل اللي عندك حساسية منه.', 'Calories and protein counted by weight, recipes sized to the meal, and nothing you are allergic to.'), false],
    ['dumbbell', L('التمرين', 'Training'), L('في الجيم أو البيت، مع سجل وتقدم كل أسبوع.', 'At the gym or at home, with a logbook and weekly progress.'), false],
    ['pill', L('الأدوية والفيتامينات', 'Medicines and supplements'), L('كل دواء بجرعته وميعاده، وبنفكرك في كل ميعاد.', 'Each one with its dose and time, and a reminder at each time.'), false],
    ['lab', L('التحاليل', 'Lab results'), L('النتيجة والتاريخ وصورة الورقة، وتذكير بالتحليل الجاي.', 'Result, date and a photo of the paper, with a reminder for the next test.'), false],
    ['chart', L('المية', 'Water'), L('هدف كل يوم على حسب وزنك، وتسجيل بلمسة واحدة.', 'A daily goal from your weight, logged with one tap.'), false],
    ['moon', L('النوم', 'Sleep'), L('ميعاد النوم والصحيان، وعدد الساعات مقارنة بالمعدل المناسب لسنك.', 'Bed and wake times, and your hours compared with the range for your age.'), false],
    ['heart', L('ظروفك الصحية', 'Your circumstances'), L('إصابة تحت العلاج، أو حمل، أو أيام الدورة: التمرين والأكل بيتعدلوا على حسب الظرف، وبيرجعوا لطبيعتهم لما يخلص.', 'An injury being treated, a pregnancy, or the first days of a period: training and food adjust to it, and go back to normal once it passes.'), false],
  ];
  return `<section class="section cover" aria-labelledby="cover-title">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('التطبيق بيتابع إيه', 'What it covers'))}<h2 class="h2" id="cover-title">${L('الأكل والتمرين والصحة، وكل ظروفك.', 'Food, training and health, and whatever life brings.')}</h2>
      <p class="lead">${L('بنراعي حالتك الصحية وأدويتك، وكل ظرف ممكن يمر بيه أي حد، زي الإصابات والحمل وأيام الدورة. الخطة بتتعدل معاه.', 'We take your health and medicines into account, and the times life changes things, like an injury, a pregnancy or your period. The plan adjusts with them.')}</p></div>
    <ul class="cover-list" role="list">
      ${items.map(([ic, t, d, soon]) => `<li class="cover-item reveal"><span class="tile-ic">${icon(ic, 22)}</span><div><h3>${t}${soon ? ` <span class="badge badge-new">${L('جديد', 'New')}</span>` : ''}</h3><p>${d}</p></div></li>`).join('')}
    </ul>
    <p class="note reveal">${L('يلا ويل بيساعد في المتابعة وبيفكرك بالمواعيد، بس مش بيشخص ومش بديل عن الدكتور. ألوان التحاليل دليل تقريبي، والقرار في الدواء أو الأكل أو التمرين للدكتور.', 'Yalla Well helps you keep track and reminds you. It does not diagnose and does not replace a doctor. Lab colours are only a rough guide, and decisions about medicine, diet or training are for your doctor.')}</p>
  </div>
</section>`;
}

function tryIt(ctx) {
  const { L } = ctx;
  const chips = [
    ['age', L('السن فوق 50', 'Over 50')],
    ['shoulder', L('إصابة في الكتف', 'Shoulder injury')],
    ['preg', L('حمل', 'Pregnant')],
    ['sugar', L('السكري', 'Diabetes')],
    ['home', L('تمرين في البيت', 'Training at home')],
  ];
  // Plain data for the script: the base plan, swaps of base lines, and the lines each choice adds.
  const data = {
    base: [L('خطة أكل على حسب سعراتك', 'A food plan sized to your calories'), L('تمرين 3 أيام في الجيم: دفع وسحب ورجل', '3 gym days: push, pull and legs'), L('زيادة بسيطة في الوزن كل أسبوع', 'A little more weight each week'), L('تذكير بالمية والوجبات', 'Reminders for water and meals')],
    swap: {
      home: [[1, L('تمرين 3 أيام في البيت', '3 home workouts a week')]],
      shoulder: [[1, L('تمرين 3 أيام: رجل وبطن ومشي لحد ما الكتف يخف', '3 days: legs, core and walking until it heals')]],
      age: [[2, L('زيادة هادية في المجهود، من غير ضغط', 'A gentle rise in effort, with no pressure')]],
      preg: [[0, L('خطة أكل من غير عجز في السعرات', 'A food plan with no calorie deficit')], [2, L('زيادة هادية في المجهود، من غير ضغط', 'A gentle rise in effort, with no pressure')]],
    },
    add: {
      age: [L('من غير تمارين قفز', 'No jumping'), L('أوزان أخف وتكرارات أكتر', 'Lighter weights with more reps'), L('إحماء أطول قبل كل تمرين', 'A longer warm-up before each workout')],
      shoulder: [L('تمارين الدفع والسحب للجزء العلوي بتقف لحد ما الكتف يخف', 'Upper-body pushing and pulling are taken out until it heals'), L('مكانها تمارين رجل وبطن ومشي', 'Legs, core and walking take their place'), L('بعد ما الكتف يخف، تحديث الإصابة من الملف الشخصي بيرجع الخطة كاملة', 'Once healed, update it in your profile and the full plan comes back')],
      preg: [L('سعرات زيادة من الثلث التاني من الحمل: 340 في اليوم، وبعدين 450 في الثلث الأخير', 'Extra calories from the second trimester: 340 a day, then 450 in the third'), L('من غير قفز ولا أوزان تقيلة', 'No jumping and no heavy weights'), L('من غير تمارين نايمة على الظهر أو البطن بعد الشهر التالت', 'No exercises lying on your back or belly after month 3'), L('الأكلات اللي لازم تتجنب بيظهر عليها تنبيه', 'Foods to avoid are flagged'), L('الفيتامينات بعد سؤال الدكتور، وبعدها تتسجل في التطبيق للتذكير', 'Ask the doctor about vitamins, then log them for reminders')],
      sugar: [L('نشويات بطيئة، وتنبيه على الأكلات اللي فيها سكر كتير', 'Slow carbs, with sugary foods flagged'), L('تحليل السكر التراكمي كل 3 شهور مع تذكير', 'An HbA1c test every 3 months, with a reminder')],
      home: [L('تمارين في البيت بأدوات بسيطة', 'Home workouts with simple equipment')],
    },
  };
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return `<section class="section try" id="try" aria-labelledby="try-title">
  <div class="wrap try-in">
    <div class="try-text reveal">
      ${kicker(L('تجربة سريعة', 'Try it'))}
      <h2 class="h2" id="try-title">${L('كل حالة بتغير الخطة.', 'Pick a situation and watch the plan change.')}</h2>
      <p class="lead">${L('دي أمثلة مبسطة للي بيعمله التطبيق. الخطة الحقيقية بتتبني من كل بياناتك.', 'These are simplified examples of what the app does. A real plan is built from everything you tell it.')}</p>
    </div>
    <div class="try-box reveal">
      <div class="chips" role="group" aria-label="${L('اختيار الحالة', 'Choose a situation')}">
        ${chips.map(([k, t]) => `<button type="button" class="chip" aria-pressed="false" data-k="${k}">${t}</button>`).join('')}
      </div>
      <div class="plan-box">
        <p class="plan-title">${L('الخطة', 'The plan')}</p>
        <ul class="plan" aria-live="polite">${data.base.map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
      <p class="small muted">${L('التطبيق مش بيشخص، والدكتور هو اللي يقرر.', 'The app does not diagnose; your doctor decides.')}</p>
      <script type="application/json" class="try-data">${json}</script>
    </div>
  </div>
</section>`;
}

function closing(ctx) {
  const { L } = ctx;
  return `<section class="section closing" aria-labelledby="close-title">
  <div class="wrap narrow center">
    <h2 class="h2 reveal" id="close-title">${L('خطة تدوم سنين، مش دايت شهر وخلاص.', 'A plan to live with for years.')}</h2>
    <p class="lead reveal">${L('من غير قائمة ممنوعات. الخطة بتتغير كل ما ظروفك تتغير، علشان الأكل الصحي والحركة يبقوا جزء من يومك العادي، ويكملوا كمان بعد الوصول للهدف.', 'No strict rules and no list of banned foods. Varied food you enjoy, training with real effort and real rest, and a plan that changes as your life does. The aim is for healthy eating and movement to become part of everyday life, without exhaustion, pressure or boredom, and to carry on after you reach your goal.')}</p>
  </div>
</section>`;
}

// ---------- pages ----------

const home = {
  file: 'index.html',
  title: (ctx) => ctx.L('أكلك، تمرينك، وصحتك', 'Your food, your training, your health'),
  desc: (ctx) => ctx.L('يلا ويل بيعملك خطة أكل وتمرين على حسب جسمك وهدفك وصحتك، وبيفكرك بمواعيد الأدوية والتحاليل.', 'Yalla Well builds a food and training plan around your body, your goal and your health, and keeps track of your medicines and lab tests.'),
  body(ctx) {
    const { L } = ctx;
    const stats = [
      [314, '', L('صنف أكل بقيمته الغذائية', 'foods with their nutrition values')],
      [150, '+', L('وصفة من مطابخ عربية مختلفة', 'recipes from across the Arab world')],
      [9, '', L('أنظمة تمرين', 'training plans')],
      [90, '', L('تمرين بالصور والشرح', 'exercises with pictures and cues')],
    ];
    const g = faqGroups(ctx);
    const top = [g[0].items[0], g[3].items[0], g[1].items[1], g[0].items[3], g[0].items[1]];
    return `
<section class="hero">
  <div class="wrap hero-text">
    <p class="pill reveal"><span class="dot" aria-hidden="true"></span>${L('قريبا على آيفون وأندرويد', 'Coming soon to iPhone and Android')}</p>
    <h1 class="display reveal" data-split>${L('أكلك، تمرينك، وصحتك<br>أساس خطتك الشخصية.', 'Your food, your training, your health.<br>The base of your personal plan.')}</h1>
    <p class="lead reveal">${L('يلا ويل بيعملك خطة أكل وتمرين على حسب جسمك وهدفك وصحتك، وبنعدلها كل ما حياتك تتغير. أكل متنوع، وتمرين بجد، وأيام راحة، من غير قواعد صعبة ولا ملل.', 'Yalla Well builds your food and training plan from your body, your goal and your health, and keeps adjusting it with you over time. Varied food, real effort and proper rest, with no strict rules and no boredom, so healthy habits become part of your life for years.')}</p>
    <div class="reveal">${storeButtons(ctx)}</div>
  </div>
  <div class="hero-stage">
    <div class="glow" aria-hidden="true"></div>
    <div class="hero-phone">${trailer(ctx)}</div>
    <div class="float float-a glass" aria-hidden="true">
      <svg width="52" height="52" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" stroke="#2A2E33" stroke-width="6" fill="none"/><path d="M27 5A22 22 0 1 1 8 38" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" fill="none"/></svg>
      <span><b class="num">1,420</b><small>${L('سعرة باقية اليوم', 'kcal left today')}</small></span>
    </div>
    <div class="float float-b glass" aria-hidden="true">
      <span class="tick">${icon('check', 15)}</span>
      <span><b>${L('رقم جديد: 32.5 كجم', 'New best: 32.5 kg')}</b><small>${L('2.5+ عن المرة اللي فاتت', '+2.5 since last time')}</small></span>
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
      <li class="reveal"><span class="how-n">01</span><h3>${L('بنتعرف عليك', 'Getting to know you')}</h3><p>${L('العمر والطول والوزن والهدف، وأي حالة صحية أو أدوية أو حساسية من أكل، ولو فيه نظام أكل من أخصائي تغذية.', 'Age, height, weight and goal, plus any health conditions, medicines or food allergies, and a diet plan from your dietitian if you have one.')}</p></li>
      <li class="reveal"><span class="how-n">02</span><h3>${L('نظام التمرين', 'Choosing a plan')}</h3><p>${L('9 أنظمة، أو 3 أسئلة ونقترح بعدها نظام مناسب. وكل يوم في الأسبوع يا جيم يا بيت يا راحة.', 'One of nine plans, or three questions and we suggest one. Then each day of the week is set to gym, home or rest.')}</p></li>
      <li class="reveal"><span class="how-n">03</span><h3>${L('الخطة جاهزة', 'Your plan is ready')}</h3><p>${L('السعرات والبروتين والمية وأسبوع التمرين، مع ملاحظة على كل حاجة اتغيرت بسبب حالتك الصحية.', 'Calories, protein, water and your training week, with a note on everything adjusted for your health.')}</p></li>
    </ol>
  </div>
</section>


${tryIt(ctx)}

${closing(ctx)}

${downloadPanel(ctx)}

<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('الأسئلة', 'Questions'))}<h2 class="h2">${L('أسئلة بتتكرر كتير', 'Frequently asked')}</h2></div>
    <div class="qas reveal">${top.map(qa).join('')}</div>
    <p class="more-link"><a class="link-arrow" href="faq.html">${L('كل الأسئلة', 'All questions')} ${icon('arrow', 18)}</a></p>
  </div>
</section>`;
  },
};

const features = {
  file: 'features.html',
  title: (ctx) => ctx.L('المميزات', 'Features'),
  desc: (ctx) => ctx.L('مميزات يلا ويل: أكل محسوب بالوزن ووصفات من مطابخ عربية مختلفة، وتمرين في الجيم أو البيت بيتطور مع الوقت، ومتابعة للأدوية والتحاليل على حسب حالتك الصحية.', 'Yalla Well in detail: food counted by weight and recipes from across the Arab world, training at the gym or at home that moves forward, and medicines and lab tests followed around your health.'),
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
    return `${pageHero(ctx, L('المميزات', 'Features'), L('التطبيق بيعمل إيه بالظبط؟', 'What the app does, in detail.'), L('التطبيق بيبدأ من جسمك وهدفك وصحتك. أي حالة صحية أو دواء بيتسجل في الأول بيغير الأكل والتمرين والمواعيد، وعلشان كده مفيش خطتين شبه بعض.', "The app starts from your body, your goal and your health. Every condition or medicine you add changes your food, your training and your timings, so no two plans look the same."))}
<nav class="jump wrap" aria-label="${L('أقسام الصفحة', 'On this page')}">
  <a href="#training">${icon('dumbbell', 18)}${L('التمرين', 'Training')}</a><a href="#food">${icon('plate', 18)}${L('الأكل', 'Food')}</a><a href="#health">${icon('pill', 18)}${L('الصحة والأدوية', 'Health and medicines')}</a><a href="#more">${icon('chart', 18)}${L('التقدم والتنبيهات', 'Progress and reminders')}</a>
</nav>
${block('training', 'train', L('شاشة التمرين', 'Training screen'), L('التمرين', 'Training'), L('تمرين على قد أيامك، وبيتطور مع الوقت.', 'A training week around your days, moving forward.'), L('9 أنظمة بأسامي واضحة، من 3 لـ6 أيام في الأسبوع، وتقدم محسوب كل أسبوع.', 'Nine plans with plain names, from 3 to 6 days a week, with planned weekly progress.'), [
      [L('الأنظمة', 'Plans'), [L('الجسم كله، وعلوي وسفلي، ودفع وسحب ورجل، وأرداف ورجل، وعضلة كل يوم، و5 أيام بين الجيم والبيت', 'Full body, upper and lower, push pull legs, glutes and legs, one muscle a day, and 5 days split between gym and home'), L('لو مفيش نظام في دماغك: 3 أسئلة وبعدها اقتراح مناسب', 'Not sure? Three questions and we suggest one'), L('كل يوم يا جيم يا بيت يا راحة، وكل يوم جيم ليه تقسيمته: دفع أو سحب أو رجل وغيرها', 'Set each day to gym, home or rest, and choose the split for gym days')]],
      [L('التمارين', 'Exercises'), [L('90 تمرين بالصور والشرح بالعربي', '90 exercises with pictures and cues'), L('نسخة بالجهاز واسمه، ونسخة بالأوزان الحرة', 'A machine version with the machine named, and a free-weight version'), L('أجهزة الجيم بتتحدد مرة واحدة، والتمارين بتيجي على قدها', 'The equipment your gym has is set once, and exercises are picked to match it'), L('التمرين اللي مش مناسب لحالتك الصحية أو بيتعب مفصل بيتبدل بتمرين أنسب، مع ذكر السبب', "An exercise that doesn't suit your health or a sore joint is swapped for a better one, with the reason shown"), L('ينفع حذف تمرين أو إضافة تمرين جديد لليوم', 'Remove an exercise, or add your own to the day')]],
      [L('في الجيم', 'At the gym'), [L('الوزن بيتكتب بالأرقام، والتكرارات بزرار زائد وناقص', 'Type the weight, set reps with plus and minus'), L('مؤقت للراحة شغال بالوقت الحقيقي', 'A rest timer that runs in real time'), L('برنامج 4 أسابيع بيتبدل بين تقيل وأخف، والوزن المقترح بيزيد لما كل التكرارات تكمل', 'A 4-week cycle between heavy and lighter weeks, with the suggested weight going up once you hit all your reps'), L('في الأيام المتعبة التمرين بيبقى حركة خفيفة وتنفس', 'On rough days, the workout becomes light mobility and breathing')]],
      [L('سجل التمرين', 'Logbook'), [L('كل تمرين ليه كارت فيه أحسن وزن، والهدف الجاي، وفاضل قد إيه عليه', 'Each exercise has a record card with your best lift, your next goal and how far is left'), L('عمود لكل جلسة بيوضح التقدم من أول نظرة', 'A bar for every session, so progress shows at a glance'), L('خطة التمرين بتطلع ملف PDF ينفع يتبعت للمدرب', 'The training plan exports as a PDF to share with a coach')]],
    ], false)}
${block('food', 'food', L('شاشة الأكل', 'Food screen'), L('الأكل', 'Food'), L('أكل متنوع، ومحسوب بالوزن.', 'Varied food, counted by weight.'), L('هدف السعرات والبروتين والكارب والدهون بيتحسب من العمر والطول والوزن والنشاط والهدف، وبيتعدل على حسب حالتك الصحية.', 'Your calorie, protein, carb and fat targets come from your age, height, weight, activity and goal, and shift with your health.'), [
      [L('التسجيل', 'Logging'), [L('314 صنف، كل صنف بكميته وسعراته والبروتين والكارب والدهون', '314 foods, each with portion, calories and macros'), L('الأرقام محسوبة بالجرام من قاعدة بيانات وزارة الزراعة الأمريكية <bdi>(USDA FoodData Central)</bdi>', 'Values counted by the gram from USDA FoodData Central'), L('فطار وغدا وعشا وسناك، والوجبة بتدخل الحساب لما يتحط عليها علامة صح', "Breakfast, lunch, dinner and snacks; a meal counts once it's ticked as eaten"), L('ينفع كتابة الوجبة بالكلام العادي، والتطبيق بيحسبها', 'Type a meal the way you would say it, and the app works it out'), L('الأصناف اللي بتتكرر بتظهر الأول', 'The foods you log most come first')]],
      [L('لو الأكلة مش في القائمة', "If a food isn't listed"), [L('بحث في قواعد بيانات الأكل العامة على الإنترنت، والنتيجة بتتحفظ في "أكلاتي"', 'Online search in public food databases, saved to "My foods"'), L('قراءة الباركود للمنتجات المغلفة في تطبيق الموبايل، والأرقام من ملصقها <bdi>(Open Food Facts)</bdi>', 'Barcode scanning for packaged food in the phone app, with values from the label <bdi>(Open Food Facts)</bdi>')]],
      [L('الوصفات', 'Recipes'), [L('أكتر من 150 وصفة للفطار والغدا والعشا والسناك', 'More than 150 recipes for breakfast, lunch, dinner and snacks'), L('أكلات من الشام والخليج والمغرب العربي والعراق واليمن ومصر، بنسخ أخف', 'Dishes from the Levant, the Gulf, the Maghreb, Iraq, Yemen and Egypt, cooked lighter'), L('كمية الوصفة على قد السعرات الباقية في الوجبة، والمقادير بتتغير معاها', 'Each is sized to the calories left for that meal, with the ingredients rescaled'), L('الوصفات اللي مش مناسبة لحالتك الصحية مش بتظهر', "Recipes that don't suit your health are left out")]],
      [L('الحساسية ونظامك الخاص', 'Allergies and your own plan'), [L('سؤال عن حساسية الأكل في أول مرة، والوصفات اللي فيها الأكل ده مش بتظهر', 'A question about food allergies the first time, and recipes with that food left out'), L('تنبيه أحمر لو الأكل ده اتسجل', 'A red alert if you log that food'), L('لو فيه نظام من دكتور أو أخصائي تغذية، أرقامه بتتسجل والتطبيق بيمشي عليها', 'A plan from a doctor or dietitian can be entered, and the app follows its numbers')]],
      [L('تنبيهات واقتراحات', 'Warnings and ideas'), [L('علامة حمرا للأكل اللي فيه ملح كتير، أو بيعدي الدهون أو الكارب، أو مش مناسب لحالتك الصحية', "A red warning for high salt, going over your fat or carb limit, or food that doesn't suit your health"), L('لو أكلة هتعدي السعرات، بيظهر لحد 3 بدايل أخف من نفس النوع', 'If a food would take you over, up to 3 lighter swaps of the same kind'), L('لو وجبة زادت، الباقي بيتوزع على باقي اليوم', 'Go over at one meal and the rest of the day is rebalanced'), L('الساعة 12 بالليل اليوم بيتقفل ويتحفظ للتقرير', 'The day locks after midnight and is saved for your report')]],
    ], true)}
<section class="section tight">
  <div class="wrap narrow">
    <p class="note reveal">${L('تطبيقات التصوير بتخمن الكمية من الصورة. في اختبار لـ4 تطبيقات تصوير معروفة، الوجبة الواحدة طلعت أقل من الحقيقة بين 250 و345 سعرة (باحثين في NIH، مؤتمر NUTRITION 2026، والدراسة لسه مش منشورة في مجلة محكمة).', 'Photo apps guess the portion from a picture. In a test of 4 well-known photo apps, meals came out about 250 to 345 kcal under the real amount (an NIH research team, NUTRITION 2026, not yet peer reviewed).')} <a href="${NEWS}" rel="noopener" target="_blank">${L('الخبر', 'Read the news')}</a></p>
  </div>
</section>
${block('health', 'health', L('صفحة الصحة', 'Health page'), L('الصحة والأدوية', 'Health and medicines'), L('صحتك جزء من الخطة.', 'Your health is part of the plan.'), L('بناخد حالتك الصحية وأدويتك في الحسبان في التمرين والأكل. الحالة أو الدواء بيتكتب بالكلام العادي، والتطبيق بيتعرف عليه ويعدل الخطة، ولو مش عارفه بيسأل عنه 3 أسئلة.', "We take health conditions and medicines into account in training and food. Type a condition or medicine in your own words and the app recognises it and adjusts the plan; if it doesn't know it, it asks three questions."), [
      [L('الحالة الصحية', 'Health conditions'), [L('الأكل بيتعدل: تنبيهات، وأكلات الأحسن تتجنب مع بعض الأدوية، وبروتين أقل وقت الحاجة', 'Food adjusts: warnings, foods to avoid with some medicines, and less protein when needed'), L('التمرين بيتعدل: مجهود مناسب، وحركات أخف على المفصل التعبان، وكارت بالعلامات اللي لازم التمرين يقف عندها', 'Training adjusts: a suitable effort, gentler moves for a painful joint, and a card of warning signs to stop'), L('الإصابة اللي تحت العلاج بتبعد التمارين اللي بتضغط عليها لحد ما تخف', 'An injury being treated keeps the exercises that load it out until it heals')]],
      [L('الأدوية والفيتامينات', 'Medicines and supplements'), [L('الجرعة والعدد والشكل: حباية، أو نقط، أو حقنة، وغيرها', 'Dose, count and form: pill, drops, injection and more'), L('كل يوم، أو كل كام يوم، أو أيام محددة، أو كل أسبوع، أو كل شهر، وأكتر من ميعاد في اليوم', 'Daily, every few days, set weekdays, weekly or monthly, with several times a day'), L('تذكير في كل ميعاد، وعلامة لما الدواء يتاخد', "A reminder at each time, and a tick once it's taken"), L('على معدة فاضية، أو مع الأكل، أو قبل النوم، والمواعيد متظبطة مع الوجبات', 'On an empty stomach, with food or at bedtime, with times lined up against your meals'), L('تنبيه لو فيه دواءين لازم يتفصلوا عن بعض', 'A warning when two must be taken apart')]],
      [L('النوم', 'Sleep'), [L('ميعاد النوم والصحيان، وعدد الساعات مقارنة بالمعدل المناسب لسنك', 'Bed and wake times, and your hours compared with the range for your age'), L('عمود لكل ليلة في الأسبوع، والمتوسط', 'A bar for each night of the week, and the average')]],
      [L('سؤال اليوم', 'Daily check-in'), [L('كل يوم بنسألك عن الطاقة والألم والنوم', 'Each day the app asks about your energy, pain and sleep'), L('ولو فيه إرهاق أو نشاط للمرض، زرار في صفحة التمرين بيخلي تمرين اليوم خفيف', 'Feeling worn out or flaring? A switch on the Training page makes the day light'), L('لو اليوم صعب، التمرين بيتحول لوحده ليوم راحة خفيف', 'A rough day turns into an easy recovery day by itself'), L('الإجابات بتدخل في تقرير الدكتور', 'The answers go into the doctor report')]],
      [L('التحاليل', 'Lab tests'), [L('النتيجة والتاريخ وميعاد التحليل الجاي', 'The result, the date and when the next test is due'), L('صورة ورقة التحليل محفوظة في التطبيق', 'A photo of the lab paper kept in the app'), L('تذكير قبل ميعاد التحليل الجاي', 'A reminder before the next test is due'), L('الألوان دليل تقريبي بس، والدكتور هو اللي يقرر', 'Colours are only a rough guide; your doctor decides')]],
      [L('السعرات ونظام الأكل', 'Calories and macros'), [L('كل أسبوع بنقارن تغير وزنك الحقيقي ونعدل هدف السعرات', 'Every week the app looks at your real weight change and adjusts the calorie target'), L('لو التقليل أكتر مش آمن، بنقترح الكلام مع الدكتور', 'If cutting further is risky, it suggests talking to your doctor instead'), L('4 أنظمة: متوازن، وبروتين أعلى، وكارب أقل، وكيتو، والكيتو بيتقفل لو مش آمن', 'Four macro modes: balanced, higher protein, lower carb and keto, with keto locked when unsafe'), L('ومع أي حالة صحية، الأفضل نظام مكتوب من دكتور أو أخصائي تغذية، وأرقامه بتتسجل في التطبيق', 'With a health condition, a plan written by a doctor or dietitian is best, and its numbers can be entered in the app')]],
      [L('تقرير الدكتور', 'Doctor report'), [L('ملف PDF لآخر 4 أسابيع: الأدوية والالتزام بيها، والطاقة والألم والنوم، والأيام الصعبة، والتمرين، والتحاليل', 'A PDF of the last 4 weeks: medicines and adherence, energy, pain and sleep, rough days, workouts and labs'), L('ينفع يتطبع أو يتبعت من الموبايل', 'Print it or send it from your phone')]],
    ], false)}
<section class="section tight">
  <div class="wrap narrow">
    <p class="note reveal">${L('يلا ويل بيساعد في المتابعة وبيفكرك بالمواعيد، بس مش بيشخص ومش بديل عن الدكتور. القرار في الدواء أو الأكل أو التمرين للدكتور.', 'Yalla Well helps you keep track and reminds you. It does not diagnose and does not replace a doctor. Decisions about medicine, diet or training are for your doctor.')}</p>
  </div>
</section>
<section class="section" id="more">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('التقدم والتنبيهات', 'Progress and reminders'))}<h2 class="h2">${L('تقدم باين، وتنبيهات فيها أرقامك.', 'Progress you can see, reminders with your numbers.')}</h2></div>
    <div class="tiles">
      ${[
        ['chart', L('صفحة التقدم', 'Progress page'), L('الوزن على رسم بياني، والمقاسات، ونسبة الدهون التقريبية، وصور التقدم. والصور بتفضل على موبايلك.', 'Your weight on a chart, measurements, an estimated body-fat percentage and progress photos. The photos stay on your phone.')],
        ['instagram', L('صورة الإنجاز', 'Progress photo'), L('الكاميرا بتفتح جوه إطار فيه أرقام أسبوعك الحقيقية: الأيام المتتالية والتمارين وأيام الهدف. الصورة بتتاخد وتتشارك مع الأصحاب.', 'The camera opens inside a frame with your real numbers for the week: streak, workouts and days on target. Take the photo and share it with friends.')],
        ['bell', L('تنبيهات بأرقام اليوم', "Reminders with the day's numbers"), L('للوجبات والمية والتمرين والأدوية والتحاليل. التنبيه بيقول فاضل كام كوباية مية وكام سعرة، وتمرين اليوم، والكلام بيتغير كل يوم. ولو الحاجة اتعملت، التنبيه مش بيوصل. في تطبيق الموبايل بس.', "For meals, water, workouts, medicines and lab tests. Each one mentions your real numbers, like cups of water left, calories left and today's workout, and the wording changes every day. Skipped once it's done. Phone app only.")],
        ['moon', L('النوم', 'Sleep'), L('ميعاد النوم والصحيان، وعدد الساعات مقارنة بالمعدل المناسب لسنك.', 'Bed and wake times, and your hours compared with the range for your age.')],
        ['heart', L('ظروفك الصحية', 'Your circumstances'), L('الإصابات والحمل والرضاعة وأيام الدورة، والخطة بتتعدل على حسب كل ظرف.', 'Injuries, pregnancy, breastfeeding and your period, with the plan adjusting to each.')],
        ['chart', L('تقرير أسبوعي', 'Weekly report'), L('كل يوم بالأخضر أو الأحمر، والأسابيع اللي فاتت موجودة، وينفع يتطبع أو يتبعت PDF.', 'Each day green or red, past weeks included, ready to print or share as a PDF.')],
        ['flame', L('نقاط وأيام متتالية', 'Points and streaks'), L('لما السعرات تفضل بين 75% و110% من الهدف، ومع كل تمرين يكمل.', 'For staying between 75% and 110% of your calorie target, and for every finished workout.')],
        ['globe', L('العربي والإنجليزي', 'Arabic and English'), L('اللغة بتتغير في أي وقت، والكلام بالعربي بيخاطب الرجل والمرأة كل واحد بصيغته.', 'Switch any time; the Arabic text addresses men and women each in their own form.')],
        ['heart', L('الكابتن', 'The captain'), L('بطل الشعار، بيعلق على يومك بجملة على قده، وبياخدك في جولة في التطبيق أول مرة.', 'The champ from our logo comments on your day and gives you a tour the first time.')],
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
  desc: (ctx) => ctx.L('يلا ويل جاي قريب على آيفون وأندرويد.', 'Yalla Well is coming soon to iPhone and Android.'),
  body(ctx) {
    const { L } = ctx;
    return `${pageHero(ctx, L('التحميل', 'Download'), L('يلا ويل على موبايلك.', 'Yalla Well on your phone.'), L('التطبيق جاي قريب على آيفون وأندرويد.', 'The app is coming soon to iPhone and Android.'))}
<section class="section tight">
  <div class="wrap">
    <div class="dl-grid">
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('آيفون', 'iPhone')}</h2>
        <p>${L('على App Store، ومعاه التنبيهات وقراءة الباركود.', 'On the App Store, with reminders and barcode scanning.')}</p>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('أندرويد', 'Android')}</h2>
        <p>${L('على Google Play، ومعاه التنبيهات وقراءة الباركود.', 'On Google Play, with reminders and barcode scanning.')}</p>
      </div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow center reveal">
    <h2 class="h2">${L('التطبيق جاي قريب.', 'Want to know when it launches?')}</h2>
    <p class="lead">${L('أول خبر عن نزول التطبيق هيكون على قناة الواتساب والسوشيال ميديا.', "The first news of the launch goes out on our WhatsApp channel and social media.")}</p>
    ${WAITLIST_URL ? `<p><a class="btn btn-primary" href="join.html">${L('التسجيل في قائمة الانتظار', 'Join the waitlist')}</a></p>` : ''}
    ${WHATSAPP_CHANNEL ? `<p><a class="btn ${WAITLIST_URL ? 'btn-ghost' : 'btn-primary'}" href="${WHATSAPP_CHANNEL}" rel="noopener">${icon('whatsapp', 20)} ${L('قناة يلا ويل على واتساب', 'Yalla Well on WhatsApp')}</a></p>` : ''}
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
    return `${pageHero(ctx, L('الأسئلة الشائعة', 'FAQ'), L('أسئلة وإجابات.', 'Questions and answers.'), L('ولو سؤالك مش هنا، صفحة التواصل مفتوحة.', "If your question isn't here, the contact page is."))}
<nav class="jump wrap" aria-label="${L('أقسام الأسئلة', 'Question topics')}">${groups.map((g) => `<a href="#${g.id}">${g.title}</a>`).join('')}</nav>
<section class="section tight">
  <div class="wrap narrow">
    ${groups.map((g) => `<div class="qa-group reveal" id="${g.id}"><h2 class="h3">${g.title}</h2><div class="qas">${g.items.map(qa).join('')}</div></div>`).join('')}
    <div class="ask reveal">
      ${champ('point', { size: 72 })}
      <div><h2 class="h3">${L('سؤالك مش هنا؟', "Didn't find it?")}</h2><p>${L('رسالة واحدة كفاية، وهنرد عليها.', "Send us a message and we'll get back to you.")}</p></div>
      <a class="btn btn-ghost" href="contact.html">${L('صفحة التواصل', 'Contact us')}</a>
    </div>
  </div>
</section>`;
  },
};

const about = {
  file: 'about.html',
  title: (ctx) => ctx.L('عن يلا ويل', 'About'),
  desc: (ctx) => ctx.L('ليه عملنا يلا ويل: خطة أكل وتمرين على حسب الجسم والصحة والأدوية، وتكمل سنين.', 'Why we made Yalla Well: so each person gets a food and training plan built around their body, their health and their medicines, that stays with them for years.'),
  body(ctx) {
    const { L } = ctx;
    const values = [
      ['chat', L('بكلام بسيط', 'In plain words'), L('التطبيق بيتكلم بكلام بسيط، والعربي فيه بيخاطب الرجل والمرأة كل واحد بصيغته. وفيه إنجليزي كمان.', 'The app talks the way people talk, and its Arabic adjusts for men and women. English too.')],
      ['heart', L('الصحة بتغير الخطة', 'Health changes the plan'), L('بناخد الحالات الصحية والأدوية في الحسبان في التمرين والأكل والمواعيد، بدل ما نسيبها ملاحظة على الجنب.', 'We take health conditions and medicines into account in training, food and timing, instead of leaving them in a side note.')],
      ['lock', L('بياناتك على موبايلك', 'Your data stays on your phone'), L('مفيش حساب، وتاريخك الصحي مش متخزن على أي سيرفر عندنا.', 'No account, and no server of ours holding your health history.')],
      ['doc', L('مش بديل عن الدكتور', 'Not a doctor'), L('إحنا بنساعد في التنظيم والمتابعة، والقرار الطبي للدكتور. والتقرير بيسهل الكلام معاه.', 'We help you organise and keep track; medical decisions stay with your doctor. The report makes that conversation easier.')],
    ];
    return `${pageHero(ctx, L('عن يلا ويل', 'About'), L('ليه عملنا يلا ويل؟', 'Why we made Yalla Well.'), L('أغلب تطبيقات الدايت بتدي الكل نفس الحساب، ومش بتسأل عن الحالة الصحية ولا مواعيد الأدوية، وبتخلص أول ما الوزن المطلوب يتحقق. كنا محتاجين تطبيق يحسب ده كله، ويكمل بعد الهدف: عادات صحية ومتابعة سهلة لسنين.', 'Most diet apps give everyone the same numbers, never ask about health conditions or medicine times, and stop once you reach a target weight. We wanted an app that works all of that out and stays with you after the goal: healthy habits and easy follow-up for years.'))}
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
      <h2 class="h2">${L('بطل الشعار عايش جوه التطبيق.', 'The champ from our logo lives in the app.')}</h2>
      <p class="lead">${L('الكابتن موجود في كل شاشة وبيعمل حاجة على قدها: بيشجع في الرئيسية، وبياكل في صفحة الأكل، وبيرفع حديد في التمرين. وكل يوم بيقول جملة على قد اليوم ده.', 'The captain shows up on every screen doing something that fits it: cheering on Today, eating on Food and lifting on Training. Each day he says something about how your day is going.')}</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('لمين', 'Who it is for'))}<h2 class="h2">${L('يلا ويل مناسب لمين؟', 'Yalla Well is made for')}</h2></div>
    ${ticks([
      L('الناس اللي هدفها تنزل أو تثبت أو تزود وزنها، بأكل متنوع ومن غير دايت مؤقت', 'Anyone who wants to lose, keep or gain weight with varied food, without a short-term diet'),
      L('الناس اللي بتتمرن في الجيم، أو في البيت، أو بين الاتنين', 'People who train at the gym, at home, or a bit of both'),
      L('الناس اللي عندها حالة صحية مزمنة وبتاخد أدوية وفيتامينات', 'People living with a long-term health condition and taking medicines and supplements'),
    ])}
  </div>
</section>
${downloadPanel(ctx)}`;
  },
};

const contactPage = {
  file: 'contact.html',
  title: (ctx) => ctx.L('التواصل', 'Contact us'),
  desc: (ctx) => ctx.L('سؤال أو اقتراح أو مشكلة في يلا ويل؟ رسايلك بتوصلنا على الإيميل وواتساب والسوشيال ميديا.', 'A question, idea or problem with Yalla Well? Reach us by email, WhatsApp or social media.'),
  body(ctx) {
    const { L } = ctx;
    const soon = `<span class="muted">${L('قريبا', 'Coming soon')}</span>`;
    const socials = Object.entries(SOCIAL).filter(([, u]) => u);
    const ready = !!contact.email;
    return `${pageHero(ctx, L('التواصل', 'Contact us'), L('سؤال أو فكرة؟', 'A question, an idea or a problem?'), L('أو مشكلة في التطبيق؟ رسالتك بتوصلنا على طول.', 'A small question or an idea for something new in the app, it comes straight to us.'))}
<section class="section tight">
  <div class="wrap contact-in">
    <form class="form reveal" id="contact-form" data-email="${contact.email}" novalidate>
      <div class="field"><label for="f-name">${L('الاسم', 'Name')}</label><input id="f-name" name="name" autocomplete="name" required></div>
      <div class="field"><label for="f-email">${L('الإيميل', 'Email')}</label><input id="f-email" name="email" type="email" autocomplete="email" dir="ltr" required></div>
      <div class="field"><label for="f-topic">${L('الموضوع', 'Topic')}</label><select id="f-topic" name="topic">
        <option>${L('سؤال', 'Question')}</option><option>${L('اقتراح', 'Suggestion')}</option><option>${L('مشكلة في التطبيق', 'Problem with the app')}</option><option>${L('تعاون أو شغل', 'Partnership or work')}</option>
      </select></div>
      <div class="field"><label for="f-msg">${L('الرسالة', 'Message')}</label><textarea id="f-msg" name="message" rows="6" required></textarea></div>
      <button class="btn btn-primary" type="submit"${ready ? '' : ' disabled'}>${L('إرسال الرسالة', 'Send message')}</button>
      <p class="small muted" id="form-note" aria-live="polite">${ready ? L('الزرار بيفتح تطبيق الإيميل والرسالة جاهزة فيه.', 'The button opens your email app with the message ready.') : L('النموذج هيشتغل أول ما إيميل التواصل يتضاف.', 'The form will work as soon as our contact email is added.')}</p>
    </form>
    <div class="contact-cards">
      <div class="c-card reveal"><span class="tile-ic">${icon('mail', 22)}</span><div><h2 class="h3">${L('الإيميل', 'Email')}</h2>${contact.email ? `<a href="mailto:${contact.email}" dir="ltr">${contact.email}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('whatsapp', 22)}</span><div><h2 class="h3">${L('واتساب', 'WhatsApp')}</h2>${contact.whatsapp ? `<a href="https://wa.me/${contact.whatsapp}" dir="ltr" rel="noopener">+${contact.whatsapp}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('instagram', 22)}</span><div><h2 class="h3">${L('السوشيال ميديا', 'Social media')}</h2>${socials.length ? `<div class="c-links">${socials.map(([k, u]) => `<a href="${u}" rel="noopener">${L(SOCIAL_NAMES[k][0], SOCIAL_NAMES[k][1])}</a>`).join('')}</div>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('book', 22)}</span><div><h2 class="h3">${L('قبل الرسالة', 'Before you write')}</h2><a href="faq.html">${L('ممكن الإجابة تكون في الأسئلة الشائعة', 'The answer may be in the FAQ')}</a></div></div>
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
  desc: (ctx) => ctx.L('يلا ويل بيعمل إيه ببياناتك: كل حاجة على موبايلك، ومن غير حساب.', 'How Yalla Well handles your data: everything stays on your phone, with no account.'),
  body(ctx) {
    const { L } = ctx;
    return legal(ctx, L('الخصوصية', 'Privacy'), [
      [L('باختصار', 'In short'), [L('يلا ويل من غير حساب ولا تسجيل دخول. كل اللي بيتسجل في التطبيق بيتحفظ على موبايلك نفسه، ومش بيتبعت لأي سيرفر عندنا.', "Yalla Well has no account or sign-in. Everything you record in the app is saved on your phone and isn't sent to a server of ours.")]],
      [L('اللي بيتحفظ على الموبايل', 'What the app keeps on your phone'), [[L('البيانات الأساسية: الاسم والعمر والطول والوزن والهدف، وصورة البروفايل لو موجودة', 'Basics: name, age, height, weight, goal, and a profile photo if you add one'), L('الحالات الصحية والأدوية والفيتامينات ومواعيدها، ونتائج التحاليل وصور ورقها', 'Health conditions, medicines and supplements with their times, and lab results with photos of their papers'), L('الأكل والتمرين، وإجابات سؤال اليوم عن الطاقة والألم والنوم', 'Food, workouts and the daily energy, pain and sleep check-in')]]],
      [L('اللي بيخرج من الموبايل', 'What leaves your phone'), [[
        L('البحث عن أكلة مش موجودة في القائمة أو قراءة باركود: بيتبعت كلمة البحث أو رقم الباركود بس لقواعد بيانات أكل عامة (USDA FoodData Central وOpen Food Facts).', 'Searching for a food or scanning a barcode: only the search words or barcode number go to public food databases (USDA FoodData Central and Open Food Facts).'),
        L('الكلام اللي بيتكتب باليد، زي حالة أو دواء مش موجود في القائمة، بيتبعت لخدمة ترجمة (Google Translate أو MyMemory) علشان يظهر باللغة التانية.', 'Text you type yourself, such as a condition or medicine not on the list, is sent to a translation service (Google Translate or MyMemory) so it can be shown in the other language.'),
        L('صور الوصفات والتمارين بتتحمل من مواقع عامة (TheMealDB وWikimedia وGitHub)، وفيديوهات الشرح من يوتيوب. والمواقع دي بتشوف عنوان الإنترنت زي أي موقع.', 'Recipe and exercise pictures load from public sites (TheMealDB, Wikimedia and GitHub), and how-to videos from YouTube. Like any website, these see your internet address.'),
        L('تقرير الدكتور والتقرير الأسبوعي مش بيتبعتوا لحد، إلا لو اتبعتوا يدويا من الموبايل.', 'The doctor report and weekly report go nowhere unless you send them yourself.'),
      ]]],
      [L('التنبيهات', 'Reminders'), [L('التنبيهات بتتجهز على الموبايل نفسه، ومش بتعدي على أي سيرفر.', 'Reminders are scheduled on the phone itself and do not pass through a server.')]],
      [L('الموقع ده', 'This website'), [L('الموقع من غير إعلانات ولا ملفات تتبع ولا أدوات تحليل، والخطوط والصور والفيديو كلها متخزنة عندنا.', 'This website has no ads, tracking cookies or analytics, and serves its own fonts, images and video.')]],
      [L('قائمة الانتظار', 'The waitlist'), [L('اللي بيسجل في قائمة الانتظار بيبعت الاسم والإيميل ونوع الموبايل والبلد واللي يهمه. البيانات دي بتتحفظ في جدول خاص بينا على Google Sheets، وبنستخدمها بس علشان نبلغ بنزول التطبيق ونبعت نسخة التجربة. مش بتتباع ولا بتتشارك، ولمسحها يكفي إيميل لـ <a href="mailto:yallawell@gmail.com" dir="ltr">yallawell@gmail.com</a>.', 'Joining the waitlist sends your name, email, phone type, country and what matters to you. We keep this in a private Google Sheet and use it only to tell you about the launch and send the test version. It is never sold or shared; to have it deleted, email <a href="mailto:yallawell@gmail.com" dir="ltr">yallawell@gmail.com</a>.')]],
      [L('مسح البيانات', 'Deleting your data'), [L('في "ملفي" فيه زرار بيمسح كل البيانات. ومسح التطبيق، أو مسح بيانات الموقع من المتصفح، بيمسحها كمان. وإحنا مش محتفظين بأي نسخة، فمش هينفع ترجع.', 'In "Me" there is a button that deletes all your data. Uninstalling the app or clearing the site data in your browser deletes it too. We hold no copy, so it cannot be restored.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('لو الصفحة دي اتغيرت، التاريخ اللي فوق هيتغير. ولأي سؤال، <a href="contact.html">صفحة التواصل</a>.', 'If this page changes, the date above will change. For any question, see the <a href="contact.html">contact page</a>.')]],
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
      [L('التطبيق', 'The app'), [L('يلا ويل أداة بتساعد في التنظيم والمتابعة: حساب السعرات، وترتيب التمرين، ومواعيد الأدوية. النسخة دي تجريبية، وممكن أجزاء منها تتغير.', 'Yalla Well is a tool to organise and keep track: counting calories, planning training and timing medicines. The current version is a trial, and things may change.')]],
      [L('مش نصيحة طبية', 'Not medical advice'), [L('اللي في التطبيق معلومات عامة ومساعدة في التنظيم، مش تشخيص ولا علاج، ومش بديل عن الدكتور. أي تغيير في الدواء أو الأكل أو التمرين لازم يكون بعد موافقة الدكتور. ولو ظهرت أي علامة خطر وقت التمرين، التمرين يقف فورا ولازم الدكتور يعرف.', 'The app offers general information and help with organising. It is not a diagnosis, treatment or a substitute for a doctor. Talk to your doctor before changing any medicine, diet or training, and stop training and contact a doctor straight away if any warning sign appears.')]],
      [L('دقة المعلومات', 'Accuracy'), [L('السعرات والقيم الغذائية تقريبية، وبتختلف على حسب الكمية وطريقة الطبخ. ونتائج البحث على الإنترنت جاية من قواعد بيانات عامة ممكن يكون فيها أخطاء.', 'Calories and nutrition values are estimates and vary with portion and cooking. Online search results come from public databases that may contain errors.')]],
      [L('الاستخدام', 'Use'), [L('التطبيق للاستخدام الشخصي، والبيانات اللي فيه ملك صاحبها ومتخزنة على موبايله.', 'The app is for personal use. The data you enter is yours and stays on your phone.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('الشروط دي ممكن تتحدث، والتاريخ اللي فوق بيوضح آخر تحديث. ولأي سؤال، <a href="contact.html">صفحة التواصل</a>.', 'These terms may be updated; the date above shows the latest version. For any question, see the <a href="contact.html">contact page</a>.')]],
    ]);
  },
};


const COUNTRIES = [
  ['مصر', 'Egypt'], ['السعودية', 'Saudi Arabia'], ['الإمارات', 'UAE'], ['الكويت', 'Kuwait'], ['قطر', 'Qatar'], ['البحرين', 'Bahrain'],
  ['عمان', 'Oman'], ['الأردن', 'Jordan'], ['فلسطين', 'Palestine'], ['لبنان', 'Lebanon'], ['سوريا', 'Syria'], ['العراق', 'Iraq'],
  ['المغرب', 'Morocco'], ['الجزائر', 'Algeria'], ['تونس', 'Tunisia'], ['ليبيا', 'Libya'], ['السودان', 'Sudan'], ['اليمن', 'Yemen'],
  ['بلد تاني', 'Another country'],
];

const join = {
  file: 'join.html',
  title: (ctx) => ctx.L('قائمة الانتظار', 'Waitlist'),
  desc: (ctx) => ctx.L('التسجيل في قائمة انتظار يلا ويل: أول ناس تعرف بنزول التطبيق وتجربه.', 'Join the Yalla Well waitlist: be among the first to hear when the app launches and to try it.'),
  body(ctx) {
    const { L } = ctx;
    const radio = (name, value, label) => `<label class="pick"><input type="radio" name="${name}" value="${value}" required><span>${label}</span></label>`;
    const check = (name, value, label) => `<label class="pick"><input type="checkbox" name="${name}" value="${value}"><span>${label}</span></label>`;
    const goals = [['lose', L('نزول وزن', 'Lose weight')], ['muscle', L('عضلات وقوة', 'Muscle and strength')], ['fit', L('لياقة وصحة عامة', 'Fitness and general health')], ['health', L('متابعة ظروف صحية', 'Follow a health condition')], ['food', L('أكل منظم', 'Organised eating')]];
    return `${pageHero(ctx, L('قائمة الانتظار', 'Waitlist'), L('أول ناس تجرب يلا ويل.', 'Be first to try Yalla Well.'), L('بعد التسجيل نبعتلك أول ما التطبيق ينزل، واللي موبايلهم أندرويد ممكن يجربوا نسخة التجربة قبل الكل.', "Leave your details and we'll tell you the moment the app is out. Android users can try the test version before everyone else."))}
<section class="section tight">
  <div class="wrap narrow">
    <form class="form join-form reveal" id="join-form" data-endpoint="${WAITLIST_URL}" data-channel="${WHATSAPP_CHANNEL}" data-lang="${ctx.lang}" novalidate>
      <div class="field"><label for="j-name">${L('الاسم', 'Name')}</label><input id="j-name" name="name" autocomplete="name" maxlength="80" required></div>
      <div class="field"><label for="j-email">${L('الإيميل', 'Email')}</label><input id="j-email" name="email" type="email" autocomplete="email" dir="ltr" maxlength="120" required>
        <p class="small muted hint">${L('لو الموبايل أندرويد، يا ريت إيميل جيميل علشان نسخة التجربة على جوجل بلاي بتشتغل بيه.', 'On Android, a Gmail address please: the Google Play test version works with it.')}</p></div>
      <fieldset class="field"><legend>${L('نوع الموبايل', 'Your phone')}</legend><div class="picks">${radio('device', 'android', L('أندرويد', 'Android'))}${radio('device', 'iphone', L('آيفون', 'iPhone'))}</div></fieldset>
      <div class="field"><label for="j-country">${L('البلد', 'Country')}</label><select id="j-country" name="country" required><option value="">${L('اختيار البلد', 'Choose a country')}</option>${COUNTRIES.map(([ar, en]) => `<option value="${en}">${L(ar, en)}</option>`).join('')}</select></div>
      <fieldset class="field"><legend>${L('إيه أكتر حاجة تهمك؟', 'What matters most to you?')} <span class="muted">${L('(اختياري)', '(optional)')}</span></legend><div class="picks">${goals.map(([v, t]) => check('goal', v, t)).join('')}</div></fieldset>
      <label class="agree"><input type="checkbox" name="agree" required><span>${L('أوافق إن يلا ويل يبعتلي على الإيميل ده بخصوص نزول التطبيق بس.', 'I agree that Yalla Well may email me about the app launch only.')}</span></label>
      <div class="hp" aria-hidden="true"><label>Website <input name="website" tabindex="-1" autocomplete="off"></label></div>
      <button class="btn btn-primary" type="submit"${WAITLIST_URL ? '' : ' disabled'}>${L('التسجيل', 'Join the waitlist')}</button>
      <p class="small muted" id="join-note" aria-live="polite">${L('بياناتك بتتحفظ عندنا بس، ومش بتتباع ولا بتتشارك مع حد. التفاصيل في <a href="privacy.html">الخصوصية</a>.', 'Your details stay with us and are never sold or shared. Details in <a href="privacy.html">Privacy</a>.')}</p>
    </form>
    <div class="form join-done" id="join-done" hidden tabindex="-1">
      <span class="done-mark" aria-hidden="true">${icon('heart', 30)}</span>
      <h2 class="h2">${L('تم التسجيل.', "You're on the list.")}</h2>
      <p class="lead">${L('آخر خطوة: قناة يلا ويل على واتساب. أخبار نزول التطبيق ونسخة التجربة بتنزل هناك الأول.', 'One last step: the Yalla Well WhatsApp channel. Launch news and the test version go there first.')}</p>
      <p><a class="btn btn-primary" id="join-go" href="${WHATSAPP_CHANNEL}" rel="noopener">${icon('whatsapp', 20)} ${L('متابعة القناة', 'Follow the channel')}</a></p>
      <p class="small muted" id="join-count"></p>
    </div>
  </div>
</section>`;
  },
};

export const PAGES = [home, features, download, faq, about, contactPage, privacy, terms, join];
