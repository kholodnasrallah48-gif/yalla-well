// Every page of the website. Each page is written once with L(arabic, english) and built in both languages.
import { WEB_APP } from './config.mjs';
import { SOCIAL_NAMES, champ, contact, hasSocial, icon, socialLinks, storeButtons } from './layout.mjs';
import { SOCIAL } from './config.mjs';

// ---------- small pieces ----------

const phone = (ctx, img, alt, cls = '', eager = false) =>
  `<figure class="phone ${cls}"><img src="${ctx.img(img)}" alt="${alt}" width="390" height="844" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></figure>`;

const ticks = (items) => `<ul class="ticks">${items.map((t) => `<li>${icon('check', 18)}<span>${t}</span></li>`).join('')}</ul>`;

const kicker = (t) => `<p class="kicker">${t}</p>`;

function pageHero(ctx, k, title, lead) {
  return `<section class="page-hero"><div class="wrap narrow reveal">${kicker(k)}<h1 class="h1">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></section>`;
}

const qa = ([q, a]) => `<details class="qa"><summary><span>${q}</span><span class="qa-mark" aria-hidden="true"></span></summary><div class="qa-a"><p>${a}</p></div></details>`;

// ---------- shared content ----------

/** Questions and answers, grouped. The home page shows a few of them. */
function faqGroups(ctx) {
  const { L } = ctx;
  return [
    { id: 'general', title: L('عام', 'General'), items: [
      [L('إيه هو يلا ويل؟', 'What is Yalla Well?'), L('تطبيق بيحسب السعرات من الأكل المصري، وبيرتب أسبوع التمرين في الجيم أو البيت، وبينظم مواعيد الأدوية والفيتامينات، وبيراعي أي حالة صحية في كل ده.', 'An app that counts calories from Egyptian food, plans your training week at the gym or at home, organises medicine and supplement times, and takes any health condition into account in all of it.')],
      [L('التطبيق بفلوس؟', 'Does it cost anything?'), L('النسخة الحالية للتجربة ومن غير أي اشتراك.', 'The current version is a trial and has no subscription.')],
      [L('محتاج أعمل حساب؟', 'Do I need an account?'), L('لأ. مفيش تسجيل دخول، وكل البيانات بتتحفظ على الموبايل نفسه.', "No. There's no sign-in, and everything is saved on your phone.")],
      [L('بيشتغل على أنهي موبايلات؟', 'Which phones does it work on?'), L('النسخة على الويب شغالة دلوقتي على أي موبايل أو كمبيوتر. تطبيق آيفون وأندرويد قريبا.', 'The web version works now on any phone or computer. iPhone and Android apps are coming soon.')],
      [L('فيه إنجليزي؟', 'Is it available in English?'), L('أيوه، عربي وإنجليزي، واللغة بتتغير من الصفحة الرئيسية في أي وقت.', 'Yes, Arabic and English. Switch any time from the home screen.')],
    ] },
    { id: 'food', title: L('الأكل', 'Food'), items: [
      [L('السعرات بتتحسب إزاي؟', 'How are my calories worked out?'), L('من السن والطول والوزن والنشاط والهدف، ومعاها هدف البروتين والكارب والدهون.', 'From your age, height, weight, activity and goal, together with protein, carb and fat targets.')],
      [L('ليه الوجبة مش بتتحسب لوحدها؟', "Why doesn't a meal count by itself?"), L('الوجبة بتدخل في الحساب لما يتعلم عليها إنها اتاكلت، مش على حسب الساعة، عشان الحساب يبقى على اللي حصل فعلا.', 'A meal counts once you tick it as eaten, not by the clock, so your totals reflect what actually happened.')],
      [L('الأكلة مش موجودة في القايمة؟', "What if a food isn't on the list?"), L('التطبيق بيدور عليها أونلاين في قواعد بيانات أكل عامة، واللي يتلاقي بيتحفظ في "أكلاتي". وفي تطبيق الموبايل فيه كمان قراية باركود.', 'The app searches public food databases online, and anything it finds is saved to "My foods". The phone app can also scan barcodes.')],
      [L('إيه اللي بيحصل نص الليل؟', 'What happens at midnight?'), L('اليوم بيتقفل ويتحفظ زي ما هو، ويدخل في التقرير الأسبوعي.', 'The day locks, is saved as it is, and goes into the weekly report.')],
    ] },
    { id: 'training', title: L('التمرين', 'Training'), items: [
      [L('أنهي أنظمة تمرين موجودة؟', 'Which training plans are there?'), L('9 أنظمة من 3 لـ6 أيام، منها الجسم كله، فوق وتحت، دفع وسحب ورجل، أرداف ورجل، و5 أيام بين الجيم والبيت. ولو مفيش نظام في الدماغ، 3 أسئلة ونرشح واحد.', "Nine plans from 3 to 6 days, including full body, upper and lower, push pull legs, glutes and legs, and 5 days split between gym and home. Not sure? Answer three questions and we'll suggest one.")],
      [L('ينفع التمرين في البيت؟', 'Can I train at home?'), L('أيوه. كل يوم في الأسبوع بيتحدد جيم أو بيت أو راحة، والتمارين بتتغير على حسبه.', 'Yes. Each day of the week can be gym, home or rest, and the exercises change to match.')],
      [L('الجهاز مشغول أو مش موجود؟', 'What if a machine is busy or missing?'), L('كل تمرين ليه بديل بالأوزان الحرة وبديل بالجهاز. وممكن تمرين يتشال أو تمرين جديد يتضاف لليوم.', 'Every exercise has a free-weight and a machine version. You can also remove an exercise or add your own to the day.')],
    ] },
    { id: 'health', title: L('الصحة والأدوية', 'Health and medicines'), items: [
      [L('يغني عن الدكتور؟', 'Does it replace my doctor?'), L('لأ. يلا ويل بيساعد في التنظيم والمتابعة، والقرار في الدوا والأكل والتمرين بيكون مع الدكتور.', 'No. Yalla Well helps you organise and keep track; decisions about medicine, diet and training are for you and your doctor.')],
      [L('الحالة الصحية مش في القايمة؟', "What if my condition isn't on the list?"), L('تتكتب بالكلام. لو التطبيق عارفها بيراعيها على طول، ولو مش عارفها بيسأل 3 أسئلة سريعة عن الأكل والتمرين وعلامات التوقف.', "Type it in. If the app knows it, it's taken into account straight away; if not, it asks three quick questions about food, training and warning signs.")],
      [L('إزاي بيتعامل مع الأدوية والفيتامينات؟', 'How does it handle medicines and supplements?'), L('لكل واحد الجرعة والعدد وكل قد إيه والميعاد، مع تنبيه في الميعاد. وبينبه لو فيه اتنين لازم يبعدوا عن بعض، زي الكالسيوم ودوا الغدة.', 'Each one gets its dose, amount, frequency and times, with a reminder at each time. It also warns when two must be taken apart, like calcium and thyroid medicine.')],
      [L('إيه هو تقرير الدكتور؟', "What's the doctor report?"), L('ملف PDF عن آخر 4 أسابيع: الأدوية والالتزام بيها، الطاقة والألم والنوم، أيام التعب، التمرين، والتحاليل. يتطبع أو يتبعت.', 'A PDF of the last 4 weeks: medicines and how regularly they were taken, energy, pain and sleep, rough days, workouts and lab results. Print it or send it.')],
    ] },
    { id: 'privacy', title: L('الخصوصية', 'Privacy'), items: [
      [L('البيانات بتتحفظ فين؟', 'Where is my data stored?'), L('على الموبايل نفسه، مش على سيرفر عندنا. التفاصيل في <a href="privacy.html">صفحة الخصوصية</a>.', 'On your phone, not on a server of ours. Details are on the <a href="privacy.html">privacy page</a>.')],
      [L('البيانات بتتمسح إزاي؟', 'How do I delete my data?'), L('من "ملفي" فيه زرار بيمسح كل البيانات ويبدأ من الأول. ومسح التطبيق نفسه بيمسحها كمان.', 'In "Me" there\'s a button that deletes everything and starts over. Uninstalling the app deletes it too.')],
    ] },
  ];
}

function downloadPanel(ctx) {
  const { L } = ctx;
  return `<section class="cta-band"><div class="wrap">
    <div class="cta reveal">
      <div class="cta-text">
        ${champ('cheer', { size: 96, cls: 'cta-champ' })}
        <h2 class="h2">${L('يلا نبدأ.', "Let's start.")}</h2>
        <p class="lead">${L('النسخة على الويب شغالة دلوقتي من أي موبايل أو كمبيوتر. آيفون وأندرويد قريبا.', 'The web version works now on any phone or computer. iPhone and Android are coming soon.')}</p>
        ${storeButtons(ctx)}
      </div>
      <div class="qr-box">
        <img src="${ctx.root}static/img/qr-web.svg" alt="${L('كود QR بيفتح النسخة على الويب', 'QR code that opens the web version')}" width="148" height="148">
        <p class="small">${L('الكود بيفتح النسخة على الويب من كاميرا الموبايل', "Scan with your phone's camera to open the web version")}</p>
      </div>
    </div>
  </div></section>`;
}

// ---------- pages ----------

const home = {
  file: 'index.html',
  title: (ctx) => ctx.L('كابتن صحتك في جيبك', 'Your health captain, in your pocket'),
  desc: (ctx) => ctx.L('يلا ويل: تطبيق مصري بيحسب سعرات الأكل المصري، وبيرتب تمرينك في الجيم أو البيت، وبينظم مواعيد أدويتك وبيراعي حالتك الصحية.', 'Yalla Well is an Egyptian app that counts calories in Egyptian food, plans your training at the gym or at home, and organises your medicines around your health.'),
  body(ctx) {
    const { L } = ctx;
    const stats = [
      [314, L('أكلة مصرية وعربية بالسعرات', 'Egyptian and Arab foods with calories')],
      [90, L('تمرين بصور وشرح', 'exercises with pictures and cues')],
      [9, L('أنظمة تمرين', 'training plans')],
      [56, L('وصفة على قد سعراتك', 'recipes scaled to your calories')],
      [85, L('حالة صحية ودوا وفيتامين بيفهمهم', 'conditions, medicines and supplements it understands')],
    ];
    const steps = [
      { img: 'food', alt: L('شاشة الأكل: السعرات والبروتين والكارب والدهون والوجبات', 'Food screen: calories, protein, carbs, fat and meals'), k: L('الأكل', 'Food'),
        h: L('الأكلة اللي اتاكلت بس هي اللي بتتحسب.', 'Only what you actually ate counts.'),
        p: L('السعرات والبروتين محسوبين على الجسم والهدف، والأكل مصري حقيقي: فول وكشري وملوخية ومحشي.', 'Calories and protein are set for your body and goal, and the food is real Egyptian food: ful, koshari, molokhia and mahshi.'),
        li: [L('الوجبة بتتحسب لما يتعلم عليها، مش بالساعة', 'Meals count when you tick them, not by the clock'), L('بروتين وكارب ودهون لكل أكلة، وتنبيه لو فيها ملح كتير أو مش مناسبة للحالة الصحية', "Protein, carbs and fat for every food, with a warning for high salt or anything that doesn't suit your condition"), L('أي أكلة مش في القايمة بتتدور أونلاين', 'Anything not on the list is looked up online')] },
      { img: 'train', alt: L('شاشة التمرين: يوم أرداف وتمارينه بالمجموعات والعدات', 'Training screen: a glutes day with sets and reps'), k: L('التمرين', 'Training'),
        h: L('جيم، بيت، أو راحة. كل يوم ليه اختياره.', 'Gym, home or rest. Every day, your call.'),
        p: L('نظام من 9، وكل يوم جاهز بالتمارين والمجموعات والعدات.', 'Pick one of nine plans, and every day comes ready with exercises, sets and reps.'),
        li: [L('بديل بالجهاز وبديل بالأوزان الحرة لكل تمرين', 'A machine and a free-weight version of every exercise'), L('الوزن بالأرقام والعدات بزرار، وتايمر راحة', 'Log weight and reps, with a rest timer'), L('برنامج بيزود الحمل أسبوع ورا أسبوع', 'A program that steps up the load week by week')] },
      { img: 'health', alt: L('شاشة صحتي: الأدوية والفيتامينات بالجرعة والميعاد', 'My health screen: medicines and supplements with dose and time'), k: L('الصحة والأدوية', 'Health and medicines'),
        h: L('بيفهم حالتك الصحية، وبيظبط كل حاجة عليها.', 'It understands your health, and adjusts everything to it.'),
        p: L('هاشيموتو والروماتويد والسكر والضغط وغيرهم، وأي حالة تانية تتكتب بالكلام.', "Hashimoto's, rheumatoid arthritis, diabetes, blood pressure and more, plus anything you type in yourself."),
        li: [L('مواعيد الأدوية والفيتامينات بالجرعة والتكرار', 'Medicine and supplement times with dose and frequency'), L('علامات توقف التمرين على حسب الحالة', 'Warning signs to stop training, based on your condition'), L('التحاليل وتقرير PDF للدكتور', 'Lab tracking and a PDF report for your doctor')] },
    ];
    const more = [
      ['globe', L('عربي وإنجليزي', 'Arabic and English'), L('والكلام العربي بيتظبط لو ولد أو بنت.', 'Arabic text adapts to you as a man or a woman.')],
      ['bell', L('تنبيهات في وقتها', 'Timely reminders'), L('للوجبات والمية والتمرين والأدوية، بكلام متغير، ومش بتيجي لو الحاجة اتعملت.', "For meals, water, workouts and medicines, worded differently each day, and skipped once it's done.")],
      ['chart', L('تقرير أسبوعي', 'Weekly report'), L('كل يوم أخضر أو أحمر، ويتطبع أو يتبعت PDF.', 'Every day green or red, ready to print or share as a PDF.')],
      ['flame', L('نقط وأيام متواصلة', 'Points and streaks'), L('لما السعرات تبقى في الحدود، ولما التمرين يخلص.', 'For staying within your calories and finishing workouts.')],
      ['book', L('وصفات على قد سعراتك', 'Recipes that fit'), L('56 وصفة، والكمية بتتظبط على اللي فاضل في اليوم.', "56 recipes, scaled to what's left in your day.")],
      ['moon', L('فاتح وغامق', 'Light and dark'), L('والأصوات ممكن تتقفل.', 'And sounds can be turned off.')],
    ];
    const g = faqGroups(ctx);
    const top = [g[0].items[0], g[3].items[0], g[4].items[0], g[0].items[3], g[0].items[1]];
    return `
<section class="hero">
  <div class="wrap hero-text">
    <p class="pill reveal"><span class="dot" aria-hidden="true"></span>${L('قريبا على آيفون وأندرويد', 'Coming soon to iPhone and Android')}</p>
    <h1 class="display reveal">${L('كابتن صحتك في جيبك.', 'Your health captain, in your pocket.')}</h1>
    <p class="lead reveal">${L('أكل مصري بالسعرات، تمرين في الجيم أو البيت، ومواعيد أدويتك. كله في تطبيق واحد بالعربي.', 'Egyptian food with calories, training at the gym or at home, and your medicine times. All in one app, in Arabic and English.')}</p>
    <div class="reveal">${storeButtons(ctx)}</div>
  </div>
  <div class="hero-stage">
    <div class="glow" aria-hidden="true"></div>
    ${phone(ctx, 'today', L('شاشة النهارده في يلا ويل: السعرات الفاضلة والبروتين والكارب والدهون', 'The Today screen in Yalla Well: calories left, protein, carbs and fat'), 'phone-hero', true)}
    <div class="float float-a glass" aria-hidden="true">
      <svg width="52" height="52" viewBox="0 0 54 54"><circle cx="27" cy="27" r="22" stroke="#2A2E33" stroke-width="6" fill="none"/><path d="M27 5A22 22 0 1 1 8 38" stroke="var(--accent)" stroke-width="6" stroke-linecap="round" fill="none"/></svg>
      <span><b class="num">1,179</b><small>${L('سعرة فاضلة النهارده', 'kcal left today')}</small></span>
    </div>
    <div class="float float-b glass" aria-hidden="true">
      <span class="tick">${icon('check', 15)}</span>
      <span><b>${L('هرمون الغدة', 'Thyroid hormone')}</b><small>${L('حباية · 7:00 ص · اتاخد', '1 pill · 7:00 AM · taken')}</small></span>
    </div>
  </div>
</section>

<section class="stats" aria-label="${L('يلا ويل بالأرقام', 'Yalla Well in numbers')}">
  <div class="wrap stats-in">
    ${stats.map(([n, t]) => `<div class="stat reveal"><span class="num" data-count="${n}">${n}</span><span>${t}</span></div>`).join('')}
  </div>
</section>

<section class="story" id="features">
  <div class="wrap story-in">
    <div class="story-steps">
      ${steps.map((s, i) => `<article class="step${i === 0 ? ' is-on' : ''}" data-img="${ctx.img(s.img)}" data-alt="${s.alt}">
        ${kicker(s.k)}
        <h2 class="h2">${s.h}</h2>
        <p class="lead">${s.p}</p>
        ${ticks(s.li)}
        ${phone(ctx, s.img, s.alt, 'phone-inline')}
      </article>`).join('')}
    </div>
    <div class="story-phone" aria-hidden="true">
      <figure class="phone phone-sticky"><img id="story-img" src="${ctx.img(steps[0].img)}" alt="" width="390" height="844" loading="lazy" decoding="async"></figure>
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('وكمان', 'And also'))}<h2 class="h2">${L('حاجات صغيرة بتفرق كل يوم.', 'Small things that help every day.')}</h2></div>
    <div class="tiles">
      ${more.map(([ic, t, d]) => `<div class="tile reveal"><span class="tile-ic">${icon(ic, 24)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
    <p class="more-link reveal"><a class="link-arrow" href="features.html">${L('كل المميزات', 'All features')} ${icon('arrow', 18)}</a></p>
  </div>
</section>

<section class="section" id="how">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('إزاي بيشتغل', 'How it works'))}<h2 class="h2">${L('3 خطوات، والكابتن يكمل الباقي.', 'Three steps, and the captain does the rest.')}</h2></div>
    <ol class="how">
      <li class="reveal"><span class="how-n">01</span><h3>${L('نتعرف', 'Get to know you')}</h3><p>${L('السن والطول والوزن والهدف، والحالات الصحية والأدوية لو فيه.', 'Age, height, weight and goal, plus any health conditions and medicines.')}</p></li>
      <li class="reveal"><span class="how-n">02</span><h3>${L('نختار النظام', 'Pick a plan')}</h3><p>${L('نظام تمرين جاهز، أو 3 أسئلة ونرشح واحد، وبعدها كل يوم جيم أو بيت أو راحة.', 'Choose a training plan or answer three questions for a suggestion, then set each day to gym, home or rest.')}</p></li>
      <li class="reveal"><span class="how-n">03</span><h3>${L('يلا نبدأ', "Let's go")}</h3><p>${L('الكابتن بياخدك جولة سريعة في التطبيق، وبعدها هو معاك كل يوم.', "The captain gives you a quick tour of the app, then he's with you every day.")}</p></li>
    </ol>
  </div>
</section>

<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('الأسئلة', 'Questions'))}<h2 class="h2">${L('أسئلة بتتسأل كتير', 'Frequently asked')}</h2></div>
    <div class="qas reveal">${top.map(qa).join('')}</div>
    <p class="more-link"><a class="link-arrow" href="faq.html">${L('كل الأسئلة', 'All questions')} ${icon('arrow', 18)}</a></p>
  </div>
</section>

${downloadPanel(ctx)}`;
  },
};

const features = {
  file: 'features.html',
  title: (ctx) => ctx.L('المميزات', 'Features'),
  desc: (ctx) => ctx.L('كل اللي جوه يلا ويل: حساب سعرات الأكل المصري، أنظمة تمرين للجيم والبيت، ومتابعة الأدوية والتحاليل على حسب حالتك الصحية.', "Everything inside Yalla Well: calorie counting for Egyptian food, training plans for gym and home, and medicine and lab tracking around your health."),
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
    return `${pageHero(ctx, L('المميزات', 'Features'), L('كل اللي جوه يلا ويل.', 'Everything inside Yalla Well.'), L('الأكل والتمرين والصحة في مكان واحد، وكل جزء بيكلم التاني: الحالة الصحية بتغير الأكل والتمرين، والدوا بيغير اليوم.', 'Food, training and health in one place, and each part talks to the others: your condition shapes your food and training, and your medicines shape your day.'))}
<nav class="jump wrap" aria-label="${L('أقسام الصفحة', 'On this page')}">
  <a href="#food">${icon('plate', 18)}${L('الأكل', 'Food')}</a><a href="#training">${icon('dumbbell', 18)}${L('التمرين', 'Training')}</a><a href="#health">${icon('pill', 18)}${L('الصحة والأدوية', 'Health and medicines')}</a><a href="#more">${icon('flame', 18)}${L('وكمان', 'And also')}</a>
</nav>
${block('food', 'food', L('شاشة الأكل', 'Food screen'), L('الأكل', 'Food'), L('أكل مصري حقيقي، بحساب حقيقي.', 'Real Egyptian food, honestly counted.'), L('هدف السعرات والبروتين والكارب والدهون محسوب من السن والطول والوزن والنشاط والهدف.', 'Your calorie, protein, carb and fat targets come from your age, height, weight, activity and goal.'), [
      [L('التسجيل', 'Logging'), [L('314 أكلة مصرية وعربية، كل واحدة بالكمية والسعرات والماكروز', '314 Egyptian and Arab foods, each with portion, calories and macros'), L('فطار وغدا وعشا وسناك، والوجبة بتتحسب لما يتعلم عليها إنها اتاكلت', "Breakfast, lunch, dinner and snacks; a meal counts once it's ticked as eaten"), L('الوجبة تتكتب بالكلام، زي "2 بيض وعيش بلدي"، والتطبيق يفهمها', 'Type a meal in words, like "2 eggs and baladi bread", and the app understands it'), L('الأكثر استخدام بيظهر الأول', 'Your most used foods come first')]],
      [L('لو الأكلة مش في القايمة', "If a food isn't listed"), [L('بحث أونلاين في قواعد بيانات أكل عامة، واللي يتلاقي يتحفظ في "أكلاتي"', 'Online search in public food databases, saved to "My foods"'), L('قراية باركود للمنتجات في تطبيق الموبايل', 'Barcode scanning for packaged food in the phone app')]],
      [L('تنبيهات واقتراحات', 'Warnings and ideas'), [L('تنبيه أحمر لو الأكلة فيها ملح كتير، أو فوق المسموح من الدهون أو الكارب، أو مش مناسبة للحالة الصحية', 'A red warning for high salt, going over your fat or carb limit, or food that does not suit your condition'), L('اقتراح وجبة على قد اللي فاضل، وأخف لو السعرات قربت تخلص', "Meal ideas sized to what's left, lighter when you're close to your limit"), L('56 وصفة بالاسم، والكمية بتتظبط على السعرات الفاضلة', "56 recipes by name, scaled to the calories you've got left"), L('اليوم بيتقفل بعد نص الليل ويتحفظ للتقرير', 'The day locks after midnight and is saved for your report')]],
    ], false)}
${block('training', 'train', L('شاشة التمرين', 'Training screen'), L('التمرين', 'Training'), L('أسبوع تمرين على مقاسك.', 'A training week that fits you.'), L('9 أنظمة بأسامي مفهومة، من 3 لـ6 أيام، وكل يوم في الأسبوع ليه اختياره.', 'Nine plans with plain names, from 3 to 6 days, and every day of the week set your way.'), [
      [L('الأنظمة', 'Plans'), [L('الجسم كله، فوق وتحت، دفع وسحب ورجل، أرداف ورجل، عضلة كل يوم، و5 أيام بين الجيم والبيت', 'Full body, upper and lower, push pull legs, glutes and legs, one muscle a day, and 5 days split between gym and home'), L('لو مفيش نظام في الدماغ، 3 أسئلة ونرشح واحد', 'Not sure? Three questions and we suggest one'), L('كل يوم يتحدد جيم أو بيت أو راحة، ويوم الجيم بتقسيمه', 'Set each day to gym, home or rest, and choose the split for gym days')]],
      [L('التمارين', 'Exercises'), [L('90 تمرين بصور وشرح بالعربي', '90 exercises with pictures and cues'), L('بديل بالجهاز واسم الجهاز، وبديل بالأوزان الحرة', 'A machine version with the machine named, and a free-weight version'), L('تمرين مش مناسب يتشال، وتمرين جديد يتضاف لليوم', 'Remove an exercise, or add your own to the day'), L('فيديو للطريقة الصح من يوتيوب', 'A how-to video search on YouTube')]],
      [L('في الجيم', 'At the gym'), [L('الوزن بالأرقام، والعدات بزرار زائد وناقص', 'Type the weight, set reps with plus and minus'), L('تايمر راحة بالوقت الحقيقي', 'A rest timer that runs in real time'), L('برنامج 4 أسابيع بيزود الحمل، والأسابيع بتبدل بين الأجهزة والأوزان الحرة', 'A 4-week program that steps up the load, alternating machine and free-weight weeks')]],
    ], true)}
${block('health', 'health', L('شاشة صحتي', 'My health screen'), L('الصحة والأدوية', 'Health and medicines'), L('بيفهم حالتك، وبيظبط كل حاجة عليها.', 'It understands your health, and adjusts to it.'), L('12 حالة في القايمة، ومعاها 85 حالة ودوا وفيتامين التطبيق بيعرفهم لما يتكتبوا بالكلام.', 'Twelve conditions to pick from, plus 85 conditions, medicines and supplements the app recognises when you type them.'), [
      [L('الحالات الصحية', 'Conditions'), [L('هاشيموتو، جريفز، روماتويد، صدفية، ذئبة حمرا، سكر نوع أول وتاني، مقاومة إنسولين، تكيس مبايض، سيلياك، تصلب متعدد، كرون والقولون التقرحي', "Hashimoto's, Graves', rheumatoid arthritis, psoriasis, lupus, type 1 and 2 diabetes, insulin resistance, PCOS, coeliac disease, MS, Crohn's and ulcerative colitis"), L('أي حالة تانية تتكتب؛ لو مش معروفة، 3 أسئلة سريعة عن الأكل والتمرين وعلامات التوقف', 'Type anything else; if the app does not know it, three quick questions about food, training and warning signs'), L('الأكل بيتظبط: تنبيهات، أكل ممنوع مع أدوية معينة، بروتين أقل لمشاكل الكلى', 'Food adjusts: warnings, foods to avoid with certain medicines, less protein for kidney problems'), L('التمرين بيتظبط: شدة أقل، تمارين ألطف للمفصل اللي بيوجع، وكارت بعلامات توقف التمرين', 'Training adjusts: lower intensity, gentler moves for painful joints, and a card of warning signs to stop')]],
      [L('الأدوية والفيتامينات', 'Medicines and supplements'), [L('الجرعة والعدد والشكل: حباية، نقط، حقنة، فوار…', 'Dose, amount and form: pill, drops, injection, sachet and more'), L('كل يوم، كل كام يوم، أيام معينة، كل أسبوع، أو كل شهر، وأكتر من ميعاد في اليوم', 'Daily, every few days, set weekdays, weekly or monthly, with several times a day'), L('على معدة فاضية، مع الأكل، أو قبل النوم، وتنبيه في كل ميعاد', 'On an empty stomach, with food or at bedtime, with a reminder each time'), L('تنبيه لو فيه اتنين لازم يبعدوا عن بعض، واليوم اللي بعد الحقنة الأسبوعية تمرينه أخف', 'A warning when two must be taken apart, and a lighter workout the day after a weekly injection')]],
      [L('المتابعة', 'Keeping track'), [L('سؤال كل يوم عن الطاقة والألم والنوم، ولو اليوم تقيل التمرين بيخف', 'A daily check-in on energy, pain and sleep, with an easier workout on rough days'), L('التحاليل المهمة للحالة، والنتيجة، وميعاد التحليل الجاي', 'The lab tests that matter for you, your results and when the next one is due'), L('تقرير PDF للدكتور عن آخر 4 أسابيع', 'A PDF report for your doctor covering the last 4 weeks')]],
    ], false)}
<section class="section" id="more">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('وكمان', 'And also'))}<h2 class="h2">${L('اللي بيخلي كل يوم أسهل.', 'What makes every day easier.')}</h2></div>
    <div class="tiles">
      ${[
        ['globe', L('عربي وإنجليزي', 'Arabic and English'), L('اللغة بتتغير في أي وقت، والكلام العربي بيتظبط لو ولد أو بنت.', 'Switch any time; Arabic text adapts to you as a man or a woman.')],
        ['bell', L('تنبيهات', 'Reminders'), L('للوجبات والمية والتمرين والأدوية والتحاليل، بكلام متغير كل يوم.', 'For meals, water, workouts, medicines and lab tests, worded differently each day.')],
        ['chart', L('تقرير أسبوعي', 'Weekly report'), L('كل يوم أخضر أو أحمر، والأسابيع اللي فاتت، ويتطبع أو يتبعت PDF.', 'Each day green or red, past weeks included, ready to print or share as a PDF.')],
        ['flame', L('نقط وأيام متواصلة', 'Points and streaks'), L('لما السعرات تبقى بين 75% و110% من الهدف، ومع كل تمرين يخلص.', 'For staying between 75% and 110% of your calorie target, and for every finished workout.')],
        ['heart', L('الكابتن', 'The captain'), L('بطل اللوجو، بيقول جملة على حسب يومك، وبياخدك جولة أول مرة.', 'The champ from our logo comments on your day and gives you a tour the first time.')],
        ['moon', L('على مزاجك', 'Your way'), L('فاتح أو غامق، صورة بروفايل، وأصوات ممكن تتقفل.', 'Light or dark, a profile photo, and sounds you can turn off.')],
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
  desc: (ctx) => ctx.L('يلا ويل شغال دلوقتي على الويب من أي موبايل أو كمبيوتر، وقريبا على آيفون وأندرويد.', 'Yalla Well works now on the web from any phone or computer, and is coming soon to iPhone and Android.'),
  body(ctx) {
    const { L } = ctx;
    return `${pageHero(ctx, L('التحميل', 'Download'), L('يلا ويل على موبايلك.', 'Yalla Well on your phone.'), L('النسخة على الويب شغالة دلوقتي. تطبيق آيفون وأندرويد في الطريق.', 'The web version works today. iPhone and Android apps are on the way.'))}
<section class="section tight">
  <div class="wrap">
    <div class="dl-grid">
      <div class="dl-card is-live reveal">
        <span class="badge">${L('متاح دلوقتي', 'Available now')}</span>
        <span class="dl-ic">${icon('globe', 30)}</span>
        <h2 class="h3">${L('النسخة على الويب', 'Web version')}</h2>
        <p>${L('بتتفتح من المتصفح على أي موبايل أو كمبيوتر، من غير تحميل.', 'Opens in the browser on any phone or computer, nothing to install.')}</p>
        <div class="dl-actions">
          <a class="btn btn-primary" href="${WEB_APP}">${L('فتح النسخة على الويب', 'Open the web version')}</a>
          <img class="dl-qr" src="${ctx.root}static/img/qr-web.svg" alt="${L('كود QR بيفتح النسخة على الويب', 'QR code that opens the web version')}" width="112" height="112">
        </div>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('آيفون', 'iPhone')}</h2>
        <p>${L('على App Store، ومعاه التنبيهات وقراية الباركود.', 'On the App Store, with reminders and barcode scanning.')}</p>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('أندرويد', 'Android')}</h2>
        <p>${L('على Google Play، ومعاه التنبيهات وقراية الباركود.', 'On Google Play, with reminders and barcode scanning.')}</p>
      </div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('خطوة صغيرة', 'One small step'))}<h2 class="h2">${L('النسخة على الويب على الشاشة الرئيسية', 'Put the web version on your home screen')}</h2><p class="lead">${L('عشان تتفتح زي أي تطبيق، بأيقونة الكابتن.', 'So it opens like any app, with the captain as its icon.')}</p></div>
    <div class="howto">
      <div class="howto-col reveal"><h3 class="h3">${L('آيفون (Safari)', 'iPhone (Safari)')}</h3><ol><li>${L('فتح النسخة على الويب في Safari', 'Open the web version in Safari')}</li><li>${L('زرار المشاركة تحت', 'Tap the Share button')}</li><li>${L('"إضافة إلى الشاشة الرئيسية"', '"Add to Home Screen"')}</li></ol></div>
      <div class="howto-col reveal"><h3 class="h3">${L('أندرويد (Chrome)', 'Android (Chrome)')}</h3><ol><li>${L('فتح النسخة على الويب في Chrome', 'Open the web version in Chrome')}</li><li>${L('القايمة ⋮ فوق', 'Tap the ⋮ menu')}</li><li>${L('"إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"', '"Add to Home screen" or "Install app"')}</li></ol></div>
    </div>
    <p class="note reveal">${L('النسخة على الويب مفيهاش تنبيهات ولا كاميرا الباركود. دول هييجوا مع تطبيق الموبايل.', "The web version has no reminders or barcode camera. Those come with the phone app.")}</p>
  </div>
</section>
<section class="section">
  <div class="wrap narrow center reveal">
    <h2 class="h2">${L('التطبيق نازل قريبا.', 'Want to know when it launches?')}</h2>
    <p class="lead">${hasSocial() ? L('هنعلن على حساباتنا في السوشيال ميديا أول ما التطبيق ينزل.', "Follow us on social media; we'll announce it there first.") : L('هنعلن على السوشيال ميديا أول ما التطبيق ينزل، والحسابات هتتضاف هنا قريبا.', "We'll announce it on social media first; our accounts will be listed here soon.")}</p>
    ${hasSocial() ? `<div class="socials socials-lg">${socialLinks(ctx)}</div>` : ''}
    <p><a class="link-arrow" href="contact.html">${L('أو من صفحة التواصل', 'Or contact us')} ${icon('arrow', 18)}</a></p>
  </div>
</section>`;
  },
};

const faq = {
  file: 'faq.html',
  title: (ctx) => ctx.L('الأسئلة الشائعة', 'FAQ'),
  desc: (ctx) => ctx.L('إجابات عن يلا ويل: السعرات، أنظمة التمرين، الحالات الصحية والأدوية، الخصوصية، والتحميل.', 'Answers about Yalla Well: calories, training plans, health conditions and medicines, privacy and downloading.'),
  body(ctx) {
    const { L } = ctx;
    const groups = faqGroups(ctx);
    return `${pageHero(ctx, L('الأسئلة الشائعة', 'FAQ'), L('أسئلة وإجابات.', 'Questions and answers.'), L('لو السؤال مش هنا، صفحة التواصل موجودة.', "If your question isn't here, the contact page is."))}
<nav class="jump wrap" aria-label="${L('أقسام الأسئلة', 'Question topics')}">${groups.map((g) => `<a href="#${g.id}">${g.title}</a>`).join('')}</nav>
<section class="section tight">
  <div class="wrap narrow">
    ${groups.map((g) => `<div class="qa-group reveal" id="${g.id}"><h2 class="h3">${g.title}</h2><div class="qas">${g.items.map(qa).join('')}</div></div>`).join('')}
    <div class="ask reveal">
      ${champ('point', { size: 72 })}
      <div><h2 class="h3">${L('السؤال مش هنا؟', "Didn't find it?")}</h2><p>${L('رسالة واحدة ونرد.', "Send us a message and we'll get back to you.")}</p></div>
      <a class="btn btn-ghost" href="contact.html">${L('صفحة التواصل', 'Contact us')}</a>
    </div>
  </div>
</section>`;
  },
};

const about = {
  file: 'about.html',
  title: (ctx) => ctx.L('عن يلا ويل', 'About'),
  desc: (ctx) => ctx.L('يلا ويل تطبيق مصري للأكل والتمرين والصحة، اتعمل للأكل المصري وللناس اللي عندهم حالات صحية وأدوية.', 'Yalla Well is an Egyptian app for food, training and health, built around Egyptian food and for people living with health conditions and medicines.'),
  body(ctx) {
    const { L } = ctx;
    const values = [
      ['globe', L('بالمصري', 'In Egyptian'), L('الأكل اللي على السفرة فعلا، والكلام اللي بنقوله فعلا، وبالإنجليزي كمان.', 'The food actually on the table, the way people actually talk, and English too.')],
      ['heart', L('بيفهم الحالة الصحية', 'Health-aware'), L('الأمراض المزمنة والمناعية والأدوية بتغير الأكل والتمرين والمواعيد، مش مجرد ملاحظة.', 'Chronic and autoimmune conditions and medicines change food, training and timing, not just a note.')],
      ['lock', L('البيانات على الموبايل', 'Your data stays on your phone'), L('مفيش حساب ولا سيرفر بيتخزن عليه تاريخك الصحي.', 'No account, and no server of ours holding your health history.')],
      ['doc', L('مش بديل للدكتور', 'Not a doctor'), L('بنساعد في التنظيم والمتابعة، والقرار الطبي مع الدكتور. والتقرير بيسهل الكلام معاه.', 'We help you organise and keep track; medical decisions stay with your doctor. The report makes that conversation easier.')],
    ];
    return `${pageHero(ctx, L('عن يلا ويل', 'About'), L('تطبيق اتعمل للأكل المصري والحياة الحقيقية.', 'An app built for Egyptian food and real life.'), L('أغلب تطبيقات الدايت والتمرين مش بتعرف الكشري، ومش بتسأل عن الغدة ولا الروماتويد ولا مواعيد الدوا. يلا ويل اتعمل عشان يسد الفرق ده.', "Most diet and fitness apps don't know koshari, and never ask about your thyroid, rheumatoid arthritis or medicine times. Yalla Well was built to close that gap."))}
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
      <h2 class="h2">${L('بطل اللوجو هو اللي معاك.', 'The champ from our logo is on your side.')}</h2>
      <p class="lead">${L('الكابتن بيظهر في كل شاشة بحركة على قد اللي بتعمله: بيشجع في الصفحة الرئيسية، بياكل في صفحة الأكل، وبيرفع حديد في التمرين. وكل يوم بيقول جملة على حسب يومك.', "The captain shows up on every screen doing what you're doing: cheering on Today, eating on Food and lifting on Training. Every day he has something to say about your day.")}</p>
      <p class="lead">${L('ولما يوم يعدي على خير، بيفرح بجد.', 'And when a day goes well, he genuinely celebrates.')}</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('لمين', 'Who it is for'))}<h2 class="h2">${L('يلا ويل معمول لـ', 'Yalla Well is made for')}</h2></div>
    ${ticks([
      L('أي حد عايز ينزل أو يثبت أو يزود وزنه بالأكل اللي بياكله كل يوم', 'Anyone who wants to lose, keep or gain weight eating their everyday food'),
      L('اللي بيتمرن في الجيم، أو في البيت، أو بين الاتنين', 'People who train at the gym, at home, or a bit of both'),
      L('اللي عنده حالة مزمنة أو مناعية وبياخد أدوية وفيتامينات', 'People living with a chronic or autoimmune condition and taking medicines and supplements'),
    ])}
  </div>
</section>
${downloadPanel(ctx)}`;
  },
};

const contactPage = {
  file: 'contact.html',
  title: (ctx) => ctx.L('التواصل', 'Contact us'),
  desc: (ctx) => ctx.L('سؤال أو اقتراح أو مشكلة في يلا ويل؟ التواصل بالإيميل أو واتساب أو السوشيال ميديا.', 'A question, idea or problem with Yalla Well? Reach us by email, WhatsApp or social media.'),
  body(ctx) {
    const { L } = ctx;
    const soon = `<span class="muted">${L('قريبا', 'Coming soon')}</span>`;
    const socials = Object.entries(SOCIAL).filter(([, u]) => u);
    const ready = !!contact.email;
    return `${pageHero(ctx, L('التواصل', 'Contact us'), L('سؤال، اقتراح، أو مشكلة؟', 'A question, an idea or a problem?'), L('أي رسالة بتساعدنا نخلي يلا ويل أحسن.', 'Every message helps us make Yalla Well better.'))}
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
      <p class="small muted" id="form-note" aria-live="polite">${ready ? L('الزرار بيفتح تطبيق الإيميل والرسالة جاهزة.', 'The button opens your email app with the message ready.') : L('الفورم هيشتغل أول ما إيميل التواصل يتضاف.', 'The form will work as soon as our contact email is added.')}</p>
    </form>
    <div class="contact-cards">
      <div class="c-card reveal"><span class="tile-ic">${icon('mail', 22)}</span><div><h2 class="h3">${L('الإيميل', 'Email')}</h2>${contact.email ? `<a href="mailto:${contact.email}" dir="ltr">${contact.email}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('chat', 22)}</span><div><h2 class="h3">${L('واتساب', 'WhatsApp')}</h2>${contact.whatsapp ? `<a href="https://wa.me/${contact.whatsapp}" dir="ltr" rel="noopener">+${contact.whatsapp}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('instagram', 22)}</span><div><h2 class="h3">${L('السوشيال ميديا', 'Social media')}</h2>${socials.length ? `<div class="c-links">${socials.map(([k, u]) => `<a href="${u}" rel="noopener">${L(SOCIAL_NAMES[k][0], SOCIAL_NAMES[k][1])}</a>`).join('')}</div>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('book', 22)}</span><div><h2 class="h3">${L('قبل ما تكتب', 'Before you write')}</h2><a href="faq.html">${L('يمكن الإجابة في الأسئلة الشائعة', 'The answer may be in the FAQ')}</a></div></div>
    </div>
  </div>
</section>`;
  },
};

function legal(ctx, title, sections) {
  const { L } = ctx;
  return `${pageHero(ctx, L('مسودة · آخر تحديث 10 أكتوبر 2026', 'Draft · last updated 10 October 2026'), title, '')}
<section class="section tight"><div class="wrap narrow prose">
${sections.map(([h, ps]) => `<h2 class="h3">${h}</h2>${ps.map((p) => Array.isArray(p) ? ticks(p) : `<p>${p}</p>`).join('')}`).join('\n')}
</div></section>`;
}

const privacy = {
  file: 'privacy.html',
  title: (ctx) => ctx.L('الخصوصية', 'Privacy'),
  desc: (ctx) => ctx.L('إزاي يلا ويل بيتعامل مع البيانات: كل حاجة على الموبايل، ومن غير حساب.', 'How Yalla Well handles your data: everything stays on your phone, with no account.'),
  body(ctx) {
    const { L } = ctx;
    return legal(ctx, L('الخصوصية', 'Privacy'), [
      [L('باختصار', 'In short'), [L('يلا ويل مفيهوش حساب ولا تسجيل دخول. كل اللي بيتسجل في التطبيق بيتحفظ على الموبايل نفسه، ومش بيتبعت لسيرفر عندنا.', "Yalla Well has no account or sign-in. Everything you record in the app is saved on your phone and isn't sent to a server of ours.")]],
      [L('اللي التطبيق بيحفظه على الموبايل', 'What the app keeps on your phone'), [[L('البيانات الأساسية: الاسم، السن، الطول، الوزن، الهدف، وصورة البروفايل لو اتضافت', 'Basics: name, age, height, weight, goal, and a profile photo if you add one'), L('الحالات الصحية والأدوية والفيتامينات ومواعيدها، ونتايج التحاليل', 'Health conditions, medicines and supplements with their times, and lab results'), L('الأكل والتمرين وسؤال اليوم عن الطاقة والألم والنوم', 'Food, workouts and the daily energy, pain and sleep check-in')]]],
      [L('الحاجات اللي بتخرج من الموبايل', 'What leaves your phone'), [[
        L('البحث عن أكلة مش في القايمة أو قراية باركود: الكلمة أو رقم الباركود بس بيتبعت لقواعد بيانات أكل عامة (USDA FoodData Central وOpen Food Facts).', 'Searching for a food or scanning a barcode: only the search words or barcode number go to public food databases (USDA FoodData Central and Open Food Facts).'),
        L('الكلام اللي بيتكتب بالإيد، زي حالة صحية أو دوا مش في القايمة، بيتبعت لخدمة ترجمة (Google Translate أو MyMemory) عشان يظهر باللغة التانية.', 'Text you type yourself, such as a condition or medicine not on the list, is sent to a translation service (Google Translate or MyMemory) so it can be shown in the other language.'),
        L('صور الوصفات والتمارين بتتحمل من مواقع عامة (TheMealDB وWikimedia وGitHub)، وفيديوهات الطريقة من يوتيوب. المواقع دي بتشوف عنوان الإنترنت زي أي موقع.', 'Recipe and exercise pictures load from public sites (TheMealDB, Wikimedia and GitHub), and how-to videos from YouTube. Like any website, these see your internet address.'),
        L('تقرير الدكتور والتقرير الأسبوعي مش بيتبعتوا لحد غير لما يتبعتوا من الموبايل بإيدك.', 'The doctor report and weekly report go nowhere unless you send them yourself.'),
      ]]],
      [L('التنبيهات', 'Reminders'), [L('التنبيهات بتتجهز على الموبايل نفسه، ومش بتعدي على سيرفر.', 'Reminders are scheduled on the phone itself and do not pass through a server.')]],
      [L('الموقع ده', 'This website'), [L('الموقع مفيهوش إعلانات ولا كوكيز تتبع ولا أدوات تحليل، والخطوط والصور متخزنة عندنا.', 'This website has no ads, tracking cookies or analytics, and serves its own fonts and images.')]],
      [L('مسح البيانات', 'Deleting your data'), [L('من "ملفي" فيه زرار بيمسح كل البيانات. ومسح التطبيق أو مسح بيانات الموقع من المتصفح بيمسحها كمان. ومفيش نسخة عندنا نرجعها منها.', 'In "Me" there is a button that deletes all your data. Uninstalling the app or clearing the site data in your browser deletes it too. We hold no copy, so it cannot be restored.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('لو الصفحة دي اتغيرت، التاريخ اللي فوق هيتغير. وأي سؤال، <a href="contact.html">صفحة التواصل</a> موجودة.', 'If this page changes, the date above will change. For any question, see the <a href="contact.html">contact page</a>.')]],
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
      [L('التطبيق', 'The app'), [L('يلا ويل أداة للتنظيم والمتابعة: حساب السعرات، ترتيب التمرين، ومواعيد الأدوية. النسخة الحالية نسخة تجريبية، وممكن يتغير فيها حاجات.', 'Yalla Well is a tool to organise and keep track: counting calories, planning training and timing medicines. The current version is a trial, and things may change.')]],
      [L('مش نصيحة طبية', 'Not medical advice'), [L('اللي في التطبيق معلومات عامة ومساعدة في التنظيم، ومش تشخيص ولا علاج ولا بديل عن الدكتور. أي تغيير في الدوا أو الأكل أو التمرين يكون بعد استشارة الدكتور. ولو ظهرت أي علامة خطر أثناء التمرين، التمرين يقف والدكتور يعرف فورا.', 'The app offers general information and help with organising. It is not a diagnosis, treatment or a substitute for a doctor. Talk to your doctor before changing any medicine, diet or training, and stop training and contact a doctor straight away if any warning sign appears.')]],
      [L('دقة المعلومات', 'Accuracy'), [L('السعرات والقيم الغذائية تقريبية، وبتختلف على حسب الكمية والطريقة. ونتايج البحث أونلاين جاية من قواعد بيانات عامة ممكن يكون فيها أخطاء.', 'Calories and nutrition values are estimates and vary with portion and cooking. Online search results come from public databases that may contain errors.')]],
      [L('الاستخدام', 'Use'), [L('التطبيق للاستخدام الشخصي. والبيانات اللي بتتسجل فيه مسؤولية صاحبها، ومتخزنة على موبايله.', 'The app is for personal use. The data you enter is yours and stays on your phone.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('الشروط دي ممكن تتحدث، والتاريخ اللي فوق بيبين آخر تحديث. وأي سؤال، <a href="contact.html">صفحة التواصل</a> موجودة.', 'These terms may be updated; the date above shows the latest version. For any question, see the <a href="contact.html">contact page</a>.')]],
    ]);
  },
};

export const PAGES = [home, features, download, faq, about, contactPage, privacy, terms];
