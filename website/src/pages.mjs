// Every page of the website. Each page is written once with L(arabic, english) and built in both languages.
// Arabic copy: light Egyptian mixed with common colloquial Arabic any Arab reader understands (no heavy dialect words,
// no formal fusha), gender neutral ("we", the app or nouns as the subject, no imperatives), no tashkeel. Use "دايت",
// never "رجيم". No disease or medicine names anywhere (lab test names are fine). The streak is "ستريك" with "فريز".
import { SOCIAL_NAMES, champ, contact, hasSocial, icon, socialLinks, storeButtons } from './layout.mjs';
import { SECTIONS, beforeAfter, captainModule, dayModule, foodModule, healthModule, numbersModule, outModule, planModule, reportsModule, streakModule, teaser, trainModule, womenModule } from './modules.mjs';
import { SOCIAL, WAITLIST_URL, WHATSAPP_CHANNEL } from './config.mjs';

// ---------- small pieces ----------

const ticks = (items) => `<ul class="ticks">${items.map((t) => `<li>${icon('check', 18)}<span>${t}</span></li>`).join('')}</ul>`;

const kicker = (t) => `<p class="kicker">${t}</p>`;

/** The app's slogan, always in Latin letters. */
const slogan = (cls = '') => `<p class="slogan ${cls}" dir="ltr" lang="en">Be well. Live more.</p>`;

/** The waitlist pill (or the download page while there is no waitlist). */
const mainCta = (ctx, cls = '') => WAITLIST_URL
  ? `<a class="btn btn-primary ${cls}" href="join.html">${ctx.L('قائمة الانتظار', 'Join waitlist')}</a>`
  : `<a class="btn btn-primary ${cls}" href="download.html">${ctx.L('التحميل', 'Download')}</a>`;

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
      [L('لازم أعمل حساب؟', 'Do I need an account?'), L('لا، الحساب اختياري. من غيره كل حاجة بتتحفظ على الموبايل. ومع الحساب بالإيميل وكود من ٦ أرقام، بياناتك بتتحفظ فيه وترجع لو الموبايل اتغير.', "No, an account is optional. Without one, everything is saved on your phone. With one (your email and a 6-digit code), your data is saved to it and comes back if you change phones.")],
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
      [L('التحاليل بتتسجل على أي شكل؟', 'How do lab results work?'), L('بتتكتب النتيجة والتاريخ، وبنفكرك لما ييجي ميعاد التحليل الجاي، وينفع تتحمل تقرير PDF بيقارن آخر ٣ نتايج لكل تحليل. ألوان النتائج دليل تقريبي بس، والدكتور هو اللي يقرر معناها.', 'You enter the result and the date, get a reminder when the next test is due, and can download a PDF comparing the last 3 results of each test. The colours next to a result are only a rough guide; your doctor decides what it means.')],
      [L('وفي اليوم المتعب؟', 'What happens on a rough day?'), L('كل يوم بنسألك عن الطاقة والألم والنوم. ولو اليوم باين صعب من الإجابات، تمرين اليوم بيتحول لوحده ليوم راحة خفيف.', "Each day the app asks about your energy, pain and sleep. If the answers point to a rough day, that day's workout turns into an easy recovery day by itself.")],
      [L('التطبيق بيراعي الظروف اللي بتتغير، زي الإصابة أو الحمل؟', 'Does it adjust when things change, like an injury or a pregnancy?'), L('أيوه. الإصابة اللي تحت العلاج بتشيل التمارين اللي بتضغط عليها لحد ما تخف، والحمل بيغير السعرات والتمارين على حسب الشهر، وأول أيام الدورة التمرين بيبقى أخف. وكمان فيه متابعة للنوم وعدد ساعاته.', "Yes. An injury being treated takes out the exercises that load it until it heals, a pregnancy changes calories and exercises month by month, and the first days of a period get a lighter workout. Sleep is tracked too.")],
    ] },
    { id: 'privacy', title: L('الخصوصية', 'Privacy'), items: [
      [L('بياناتي بتتحفظ فين؟', 'Where is my data stored?'), L('على موبايلك نفسه. ولو اتعمل حساب، بيتحفظ منها نسخة في الحساب بتاعك بس. التفاصيل في <a href="privacy.html">صفحة الخصوصية</a>.', 'On your phone. If you sign in, a copy is also saved to your own account. Details are on the <a href="privacy.html">privacy page</a>.')],
      [L('ينفع أمسح بياناتي؟', 'How do I delete my data?'), L('أيوه. في "ملفي" فيه زرار بيمسح كل حاجة ويبدأ من الأول. ومسح التطبيق من الموبايل بيمسح البيانات كمان.', 'In "Me" there\'s a button that deletes everything and starts over. Uninstalling the app deletes it too.')],
    ] },
  ];
}

function downloadPanel(ctx) {
  const { L } = ctx;
  return `<section class="end" id="download"><div class="wrap narrow center reveal">
    ${slogan('slogan-green')}
    <h2 class="h2">${L('يلا نبدأ.', "Let's start.")}</h2>
    <p class="lead">${L('التطبيق جاي قريب على آيفون وأندرويد.', 'The app is coming soon to iPhone and Android.')}</p>
    <div class="end-ctas">${mainCta(ctx)}</div>
    ${storeButtons(ctx)}
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
    const g = faqGroups(ctx);
    const top = [g[0].items[0], g[3].items[0], g[1].items[1], g[0].items[3], g[0].items[1]];
    return `
<section class="hero">
  <div class="wrap hero-text">
    ${slogan('reveal')}
    <h1 class="display reveal" data-split>${L('أكلك، تمرينك، وصحتك<br><span class="sub">أساس خطتك الشخصية.</span>', 'Your food, your training, your health.<br><span class="sub">The base of your personal plan.</span>')}</h1>
    <p class="lead reveal">${L('يلا ويل بيعملك خطة أكل وتمرين على حسب جسمك وهدفك وصحتك، وبنعدلها كل ما حياتك تتغير. أكل متنوع، وتمرين بجد، وأيام راحة، من غير قواعد صعبة ولا ملل.', 'Yalla Well builds your food and training plan from your body, your goal and your health, and keeps adjusting it with you over time. Varied food, real effort and proper rest, with no strict rules and no boredom, so healthy habits become part of your life for years.')}</p>
    <div class="ctas reveal">${mainCta(ctx)}<a class="btn btn-dark" href="features.html">${L('المميزات', 'Features')}</a></div>
    <p class="soon reveal"><span class="dot" aria-hidden="true"></span>${L('قريبا على آيفون وأندرويد', 'Coming soon to iPhone and Android')}</p>
  </div>
  <div class="hero-stage">
    <div class="glow" aria-hidden="true"></div>
    <div class="hero-phone">${trailer(ctx)}</div>
  </div>
</section>

${dayModule(ctx)}

${beforeAfter(ctx)}

${planModule(ctx)}

${numbersModule(ctx)}

${teaser(ctx)}

${accuracy(ctx)}

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
  desc: (ctx) => ctx.L('مميزات يلا ويل: أكل محسوب بالجرام ووصفات بنسخ أخف، والأكل برة البيت، وتمرين في الجيم أو البيت، والأدوية والتحاليل والتقارير، ومتابعة الدورة والحمل.', 'Yalla Well in detail: food counted by the gram and lighter recipes, eating out, training at the gym or at home, medicines, lab tests and reports, and period and pregnancy tracking.'),
  body(ctx) {
    const { L } = ctx;
    const more = [
      ['chart', L('صفحة التقدم', 'Progress page'), L('الوزن على رسم بياني، والمقاسات، ونسبة الدهون التقريبية، وصور التقدم. والصور بتفضل على موبايلك.', 'Your weight on a chart, measurements, an estimated body-fat percentage and progress photos. The photos stay on your phone.')],
      ['instagram', L('صورة الإنجاز', 'Progress photo'), L('الكاميرا بتفتح جوه إطار فيه أرقام أسبوعك الحقيقية: الستريك والتمارين وأيام الهدف. الصورة بتتاخد وتتشارك مع الأصحاب.', 'The camera opens inside a frame with your real numbers for the week: streak, workouts and days on target. Take the photo and share it with friends.')],
      ['bell', L('تنبيهات بأرقام اليوم', "Reminders with the day's numbers"), L('للوجبات والمية والتمرين والأدوية والتحاليل. التنبيه بيقول فاضل كام كوباية مية وكام سعرة، وتمرين اليوم، ولو الحاجة اتعملت مش بيوصل. في تطبيق الموبايل بس.', "For meals, water, workouts, medicines and lab tests. Each one mentions your real numbers, like cups of water and calories left, and is skipped once it's done. Phone app only.")],
      ['plate', L('الحساسية ونظامك الخاص', 'Allergies and your own plan'), L('سؤال عن حساسية الأكل في أول مرة، والوصفات اللي فيها الأكل ده مش بتظهر. ولو فيه نظام من دكتور أو أخصائي تغذية، أرقامه بتتسجل والتطبيق بيمشي عليها.', 'A question about food allergies the first time, and recipes with that food are left out. A plan from a doctor or dietitian can be entered, and the app follows its numbers.')],
      ['dumbbell', L('الإصابات', 'Injuries'), L('الإصابة اللي تحت العلاج بتشيل التمارين اللي بتضغط عليها لحد ما تخف، وبعدها الخطة الكاملة بترجع.', 'An injury being treated takes out the exercises that load it until it heals, and then the full plan comes back.')],
      ['globe', L('العربي والإنجليزي', 'Arabic and English'), L('اللغة بتتغير في أي وقت، والعربي بيخاطب الرجل والمرأة كل واحد بصيغته. وفيه لايت ودارك.', 'Switch language any time; the Arabic text addresses men and women each in their own form. Light and dark themes too.')],
    ];
    return `${pageHero(ctx, L('المميزات', 'Features'), L('التطبيق بيعمل إيه بالظبط؟', 'What the app does, in detail.'), L('التطبيق بيبدأ من جسمك وهدفك وصحتك. أي حالة صحية أو دواء بيتسجل في الأول بيغير الأكل والتمرين والمواعيد، وعلشان كده مفيش خطتين شبه بعض.', "The app starts from your body, your goal and your health. Every condition or medicine you add changes your food, your training and your timings, so no two plans look the same."))}
<nav class="jump wrap" aria-label="${L('أقسام الصفحة', 'On this page')}">
  ${SECTIONS(L).map(([id, ic, t]) => `<a href="#${id}">${icon(ic, 18)}${t}</a>`).join('')}
</nav>
${foodModule(ctx)}
<section class="section tight m-after">
  <div class="wrap narrow">
    <p class="note reveal">${L('تطبيقات التصوير بتخمن الكمية من الصورة. في اختبار لـ4 تطبيقات تصوير معروفة، الوجبة الواحدة طلعت أقل من الحقيقة بين 250 و345 سعرة (باحثين في NIH، مؤتمر NUTRITION 2026، والدراسة لسه مش منشورة في مجلة محكمة).', 'Photo apps guess the portion from a picture. In a test of 4 well-known photo apps, meals came out about 250 to 345 kcal under the real amount (an NIH research team, NUTRITION 2026, not yet peer reviewed).')} <a href="${NEWS}" rel="noopener" target="_blank">${L('الخبر', 'Read the news')}</a></p>
  </div>
</section>
${outModule(ctx)}
${trainModule(ctx)}
${healthModule(ctx)}
${womenModule(ctx)}
${reportsModule(ctx)}
${streakModule(ctx)}
${captainModule(ctx)}
<section class="m-mod" id="more" aria-labelledby="more-title">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('وكمان', 'And more'))}<h2 class="h2" id="more-title">${L('حاجات تانية بتفرق.', 'A few more things.')}</h2></div>
    <div class="tiles">
      ${more.map(([ic, t, d]) => `<div class="tile reveal"><span class="tile-ic">${icon(ic, 24)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
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
      ['lock', L('بياناتك تحت إيدك', 'Your data, your call'), L('من غير حساب كل حاجة بتفضل على الموبايل. والحساب اختياري، علشان البيانات ترجع لو الموبايل اتغير.', 'Without an account everything stays on your phone. An account is optional, so your data can come back on a new phone.')],
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

function legal(ctx, title, sections, day = 18) {
  const { L } = ctx;
  return `${pageHero(ctx, L(`مسودة · آخر تحديث ${day} أكتوبر 2026`, `Draft · last updated ${day} October 2026`), title, '')}
<section class="section tight"><div class="wrap narrow prose">
${sections.map(([h, ps]) => `<h2 class="h3">${h}</h2>${ps.map((p) => Array.isArray(p) ? ticks(p) : `<p>${p}</p>`).join('')}`).join('\n')}
</div></section>`;
}

const privacy = {
  file: 'privacy.html',
  title: (ctx) => ctx.L('الخصوصية', 'Privacy'),
  desc: (ctx) => ctx.L('يلا ويل بيعمل إيه ببياناتك: على موبايلك، والحساب اختياري.', 'How Yalla Well handles your data: on your phone, with an optional account.'),
  body(ctx) {
    const { L } = ctx;
    return legal(ctx, L('الخصوصية', 'Privacy'), [
      [L('باختصار', 'In short'), [L('الحساب في يلا ويل اختياري. من غير حساب، كل اللي بيتسجل في التطبيق بيتحفظ على موبايلك نفسه ومش بيتبعت لأي سيرفر.', "An account in Yalla Well is optional. Without one, everything you record in the app is saved on your phone and isn't sent to any server.")]],
      [L('الحساب', 'Your account'), [L('الدخول بيكون بالإيميل وكود من ٦ أرقام بيوصل عليه، من غير باسورد. ومع الحساب، بيتحفظ نسخة من بيانات التطبيق في الحساب على خدمة Supabase، علشان ترجع لو الموبايل اتغير. النسخة دي محدش يقدر يشوفها غير صاحب الحساب، ومش بتتباع ولا بتتشارك. وفي "ملفي" فيه زرار بيمسح الحساب والنسخة اللي فيه.', "You sign in with your email and a 6-digit code sent to it, with no password. With an account, a copy of the app's data is saved to it on Supabase, so it comes back if you change phones. Only the account owner can see that copy, and it is never sold or shared. In \"Me\" there is a button that deletes the account and the copy in it.")]],
      [L('اللي بيتحفظ على الموبايل', 'What the app keeps on your phone'), [[L('البيانات الأساسية: الاسم والعمر والطول والوزن والهدف، وصورة البروفايل لو موجودة', 'Basics: name, age, height, weight, goal, and a profile photo if you add one'), L('الحالات الصحية والأدوية والفيتامينات ومواعيدها، ونتائج التحاليل وتواريخها', 'Health conditions, medicines and supplements with their times, and lab results with their dates'), L('الأكل والتمرين، وإجابات سؤال اليوم عن الطاقة والألم والنوم', 'Food, workouts and the daily energy, pain and sleep check-in')]]],
      [L('اللي بيخرج من الموبايل', 'What leaves your phone'), [[
        L('البحث عن أكلة مش موجودة في القائمة أو قراءة باركود: بيتبعت كلمة البحث أو رقم الباركود بس لقواعد بيانات أكل عامة (USDA FoodData Central وOpen Food Facts).', 'Searching for a food or scanning a barcode: only the search words or barcode number go to public food databases (USDA FoodData Central and Open Food Facts).'),
        L('الكلام اللي بيتكتب باليد، زي حالة أو دواء مش موجود في القائمة، بيتبعت لخدمة ترجمة (Google Translate أو MyMemory) علشان يظهر باللغة التانية.', 'Text you type yourself, such as a condition or medicine not on the list, is sent to a translation service (Google Translate or MyMemory) so it can be shown in the other language.'),
        L('زرار "أنا برة البيت": وقت البحث عن الأماكن القريبة بس، الموبايل بيسأل عن إذن الموقع، وبيتبعت المكان التقريبي لخدمة بحث في خريطة OpenStreetMap (Photon من komoot، أو Overpass) علشان تجيب المطاعم والكافيهات القريبة. المكان مش بيتحفظ في أي حتة.', 'The "I\'m eating out" button: only when you ask for places near you, the phone asks for location access and sends your approximate position to an OpenStreetMap search service (Photon by komoot, or Overpass) to find nearby restaurants and cafes. Your location is never saved.'),
        L('صور الوصفات والتمارين بتتحمل من مواقع عامة (TheMealDB وWikimedia وGitHub)، وفيديوهات الشرح من يوتيوب. والمواقع دي بتشوف عنوان الإنترنت زي أي موقع.', 'Recipe and exercise pictures load from public sites (TheMealDB, Wikimedia and GitHub), and how-to videos from YouTube. Like any website, these see your internet address.'),
        L('تقرير الدكتور والتقرير الأسبوعي مش بيتبعتوا لحد، إلا لو اتبعتوا يدويا من الموبايل.', 'The doctor report and weekly report go nowhere unless you send them yourself.'),
      ]]],
      [L('التنبيهات', 'Reminders'), [L('التنبيهات بتتجهز على الموبايل نفسه، ومش بتعدي على أي سيرفر.', 'Reminders are scheduled on the phone itself and do not pass through a server.')]],
      [L('الموقع ده', 'This website'), [L('الموقع من غير إعلانات ولا ملفات تتبع ولا أدوات تحليل، والخطوط والصور والفيديو كلها متخزنة عندنا.', 'This website has no ads, tracking cookies or analytics, and serves its own fonts, images and video.')]],
      [L('قائمة الانتظار', 'The waitlist'), [L('اللي بيسجل في قائمة الانتظار بيبعت الاسم والإيميل ونوع الموبايل والبلد واللي يهمه. البيانات دي بتتحفظ في جدول خاص بينا على Google Sheets، وبنستخدمها بس علشان نبلغ بنزول التطبيق ونبعت نسخة التجربة. مش بتتباع ولا بتتشارك، ولمسحها يكفي إيميل لـ <a href="mailto:yallawell@gmail.com" dir="ltr">yallawell@gmail.com</a>.', 'Joining the waitlist sends your name, email, phone type, country and what matters to you. We keep this in a private Google Sheet and use it only to tell you about the launch and send the test version. It is never sold or shared; to have it deleted, email <a href="mailto:yallawell@gmail.com" dir="ltr">yallawell@gmail.com</a>.')]],
      [L('مسح البيانات', 'Deleting your data'), [L('في "ملفي" فيه زرار بيمسح كل البيانات من الموبايل، وزرار تاني بيمسح الحساب والنسخة اللي فيه. ومسح التطبيق، أو مسح بيانات الموقع من المتصفح، بيمسح اللي على الموبايل. ومن غير حساب مفيش أي نسخة عندنا، فاللي يتمسح مش هيرجع.', 'In "Me" one button deletes all data on the phone and another deletes the account and the copy in it. Uninstalling the app or clearing the site data in your browser deletes what is on the phone. Without an account there is no copy anywhere, so deleted data cannot come back.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('لو الصفحة دي اتغيرت، التاريخ اللي فوق هيتغير. ولأي سؤال، <a href="contact.html">صفحة التواصل</a>.', 'If this page changes, the date above will change. For any question, see the <a href="contact.html">contact page</a>.')]],
    ], 23);
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
      [L('الاستخدام', 'Use'), [L('التطبيق للاستخدام الشخصي، والبيانات اللي فيه ملك صاحبها.', 'The app is for personal use. The data you enter is yours.')]],
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
