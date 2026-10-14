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
  return `<section class="page-hero"><div class="wrap narrow reveal">${kicker(k)}<h1 class="h1" data-split>${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ''}</div></section>`;
}

const qa = ([q, a]) => `<details class="qa"><summary><span>${q}</span><span class="qa-mark" aria-hidden="true"></span></summary><div class="qa-a"><p>${a}</p></div></details>`;

// ---------- shared content ----------

/** Questions and answers, grouped. The home page shows a few of them. */
function faqGroups(ctx) {
  const { L } = ctx;
  return [
    { id: 'general', title: L('عام', 'General'), items: [
      [L('إيه هو يلا ويل؟', 'What is Yalla Well?'), L('تطبيق بيعملك خطة أكل وتمرين على حسب جسمك وهدفك وحالتك الصحية، وبيفكرك بمواعيد أدويتك وتحاليلك. ولو حالتك أو أدويتك اتغيرت، الخطة بتتغير معاها.', 'An app that builds a food and training plan around your body, your goal and your health, and keeps track of your medicines and lab tests. When your health or medicines change, the plan changes too.')],
      [L('التطبيق بفلوس؟', 'Does it cost anything?'), L('لأ، النسخة دي تجريبية ومفيهاش اشتراك.', 'The current version is a trial and has no subscription.')],
      [L('لازم أعمل حساب؟', 'Do I need an account?'), L('لأ، مفيش تسجيل دخول، وكل البيانات بتتحفظ على الموبايل نفسه.', "No. There's no sign-in, and everything is saved on your phone.")],
      [L('شغال على أنهي موبايلات؟', 'Which phones does it work on?'), L('نسخة الويب شغالة دلوقتي على أي موبايل أو كمبيوتر، وتطبيق آيفون وأندرويد نازلين قريب.', 'The web version works now on any phone or computer. iPhone and Android apps are coming soon.')],
      [L('فيه إنجليزي؟', 'Is it available in English?'), L('أيوه، عربي وإنجليزي، واللغة بتتغير من الصفحة الرئيسية في أي وقت.', 'Yes, Arabic and English. Switch any time from the home screen.')],
    ] },
    { id: 'food', title: L('الأكل', 'Food'), items: [
      [L('السعرات بتتحسب إزاي؟', 'How are my calories worked out?'), L('من سنك وطولك ووزنك ونشاطك وهدفك. ولو عندك مشكلة في الغدة مثلا، أو فيه حمل، بنقلل العجز في السعرات أو نلغيه خالص.', 'From your age, height, weight, activity and goal. With a condition like thyroid disease, or during pregnancy, the app makes the calorie deficit smaller or drops it altogether.')],
      [L('فيه وصفات؟', 'Are there recipes?'), L('فيه 106 وصفة للفطار والغدا والعشا والسناكس. بنظبط كمية الوصفة على السعرات اللي فاضلالك في الوجبة، والمقادير بتتغير معاها.', '106 recipes for breakfast, lunch, dinner and snacks. Each one is sized to the calories you have left for that meal, and the ingredients change with it.')],
      [L('هدف السعرات بيتغير مع الوقت؟', 'Does my calorie target change over time?'), L('أيوه. كل أسبوع التطبيق بيقارن الوزن الحقيقي بالمتوقع وبيظبط الهدف على أساسه. ولو فيه حالة صحية تخلي التقليل أكتر فيه خطر، بدل ما يقلل السعرات بيقترح الكلام مع الدكتور الأول.', 'Yes. Each week the app compares your real weight change with what was expected and adjusts the target. If a health condition makes cutting further risky, it suggests talking to your doctor first instead of lowering calories.')],
      [L('فيه كيتو أو كارب أقل؟', 'Is there keto or lower carb?'), L('فيه 4 أنظمة: متوازن، وبروتين أعلى، وكارب أقل، وكيتو. والكيتو بيتقفل لو فيه حالة صحية تخليه مش آمن.', 'There are four modes: balanced, higher protein, lower carb and keto. Keto is locked when a health condition makes it unsafe.')],
      [L('ليه الوجبة مش بتتحسب لوحدها؟', "Why doesn't a meal count by itself?"), L('عشان الحساب يبقى على اللي اتاكل فعلا. الوجبة بتدخل في الحساب لما يتعلم عليها، مش لما ييجي ميعادها.', 'A meal counts once you tick it as eaten, not by the clock, so your totals reflect what actually happened.')],
      [L('الأكلة مش موجودة في القايمة؟', "What if a food isn't on the list?"), L('بندور عليها أونلاين، واللي نلاقيه بيتحفظ في "أكلاتي". وتطبيق الموبايل فيه كمان قارئ باركود.', 'The app searches public food databases online, and anything it finds is saved to "My foods". The phone app can also scan barcodes.')],
      [L('إيه اللي بيحصل الساعة 12 بالليل؟', 'What happens at midnight?'), L('اليوم بيتقفل ويتحفظ زي ما هو، ويدخل في التقرير الأسبوعي.', 'The day locks, is saved as it is, and goes into the weekly report.')],
    ] },
    { id: 'training', title: L('التمرين', 'Training'), items: [
      [L('فيه أنهي أنظمة تمرين؟', 'Which training plans are there?'), L('9 أنظمة من 3 لـ6 أيام، منها الجسم كله، وفوق وتحت، ودفع وسحب ورجل، وأرداف ورجل، و5 أيام بين الجيم والبيت. ولو مفيش نظام معين في دماغك، بنسألك 3 أسئلة ونرشحلك واحد.', "Nine plans from 3 to 6 days, including full body, upper and lower, push pull legs, glutes and legs, and 5 days split between gym and home. Not sure? Answer three questions and we'll suggest one.")],
      [L('ينفع أتمرن في البيت؟', 'Can I train at home?'), L('أيوه. كل يوم في الأسبوع يا جيم يا بيت يا راحة، والتمارين بتتغير على حسبه.', 'Yes. Each day of the week can be gym, home or rest, and the exercises change to match.')],
      [L('لو الجهاز مشغول أو مش موجود؟', 'What if a machine is busy or missing?'), L('كل تمرين ليه نسخة بالأوزان الحرة ونسخة بالجهاز. وكمان ممكن تمرين يتشال أو تمرين جديد يتضاف لليوم.', 'Every exercise has a free-weight and a machine version. You can also remove an exercise or add your own to the day.')],
      [L('التطبيق بيتابع الأوزان؟', 'Does it keep track of my lifts?'), L('أيوه. كل تمرين ليه دفتر فيه كارت بأحسن وزن اتشال، والهدف الجاي، وفاضل قد إيه عليه، وعمود لكل جلسة. وخطة التمرين بتطلع ملف PDF يتبعت للكوتش.', 'Yes. Each exercise has a logbook with a record card showing your best lift, your next goal and how far is left, plus a bar for every session. The training plan also exports as a PDF to share with a coach.')],
      [L('التمارين بتناسب الجيم بتاعي؟', 'Will the exercises fit my gym?'), L('الأجهزة الموجودة في الجيم بتتحدد مرة واحدة، والتمارين بتيجي على قد الموجود بس.', 'The equipment your gym has is set once, and the exercises match what is there.')],
    ] },
    { id: 'health', title: L('الصحة والأدوية', 'Health and medicines'), items: [
      [L('يغني عن الدكتور؟', 'Does it replace my doctor?'), L('لأ. يلا ويل بيساعد في التنظيم والمتابعة، لكن أي قرار في الدوا أو الأكل أو التمرين بيكون مع الدكتور.', 'No. Yalla Well helps you organise and keep track; decisions about medicine, diet and training are for you and your doctor.')],
      [L('الحالة الصحية مش في القايمة؟', "What if my condition isn't on the list?"), L('ممكن تتكتب بالكلام العادي. لو التطبيق عارفها بياخدها في الحساب على طول، ولو مش عارفها بيسألك 3 أسئلة عن الأكل والتمرين والعلامات اللي التمرين لازم يقف عندها.', "Type it in. If the app knows it, it's taken into account straight away; if not, it asks three quick questions about food, training and warning signs.")],
      [L('الأدوية والفيتامينات بتتنظم إزاي؟', 'How does it handle medicines and supplements?'), L('كل دوا ليه جرعته وعدده وبيتاخد كل قد إيه وفي أنهي ميعاد، وبنفكرك في كل ميعاد. ولو فيه اتنين لازم يبعدوا عن بعض، زي الكالسيوم ودوا الغدة، بنقولك.', 'Each one gets its dose, amount, frequency and times, with a reminder at each time. It also warns when two must be taken apart, like calcium and thyroid medicine.')],
      [L('إيه هو تقرير الدكتور؟', "What's the doctor report?"), L('ملف PDF فيه آخر 4 أسابيع: الأدوية والالتزام بيها، والطاقة والألم والنوم، وأيام التعب، والتمرين، والتحاليل. ينفع يتطبع أو يتبعت.', 'A PDF of the last 4 weeks: medicines and how regularly they were taken, energy, pain and sleep, rough days, workouts and lab results. Print it or send it.')],
      [L('التحاليل بتتسجل إزاي؟', 'How do lab results work?'), L('النتيجة والتاريخ بيتكتبوا، وصورة ورقة التحليل ممكن تتحفظ في التطبيق، وبنفكرك لما ييجي ميعاد التحليل الجاي. فيه التراكمي والغدة وفيتامين د والفيريتين وB12 والدهون وصورة الدم وكشف العين. الألوان اللي جنب النتيجة دليل تقريبي بس، والدكتور هو اللي بيقرر.', 'You enter the result and the date, can keep a photo of the lab paper in the app, and get a reminder when the next test is due. It covers HbA1c, TSH, vitamin D, ferritin, B12, lipids, CBC and eye exams. The colours next to a result are only a rough guide; your doctor decides what it means.')],
      [L('إيه اللي بيحصل في يوم تعبان؟', 'What happens on a rough day?'), L('كل يوم بنسألك عن الطاقة والألم والنوم. ولو الإجابات بتقول إن اليوم تقيل، تمرين اليوم بيتحول لوحده ليوم راحة خفيف.', 'Each day the app asks about your energy, pain and sleep. If the answers point to a rough day, that day\'s workout turns into an easy recovery day by itself.')],
    ] },
    { id: 'privacy', title: L('الخصوصية', 'Privacy'), items: [
      [L('البيانات بتتحفظ فين؟', 'Where is my data stored?'), L('على الموبايل نفسه، مش على سيرفر عندنا. التفاصيل في <a href="privacy.html">صفحة الخصوصية</a>.', 'On your phone, not on a server of ours. Details are on the <a href="privacy.html">privacy page</a>.')],
      [L('إزاي أمسح بياناتي؟', 'How do I delete my data?'), L('في "ملفي" فيه زرار بيمسح كل حاجة ويبدأ من الأول. ولو التطبيق اتمسح من الموبايل، البيانات بتتمسح معاه.', 'In "Me" there\'s a button that deletes everything and starts over. Uninstalling the app deletes it too.')],
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
        <p class="lead">${L('نسخة الويب شغالة دلوقتي على أي موبايل أو كمبيوتر، وآيفون وأندرويد قريب.', 'The web version works now on any phone or computer. iPhone and Android are coming soon.')}</p>
        ${storeButtons(ctx)}
      </div>
      <div class="qr-box">
        <img src="${ctx.root}static/img/qr-web.svg" alt="${L('كود QR بيفتح نسخة الويب', 'QR code that opens the web version')}" width="148" height="148">
        <p class="small">${L('الكود ده بيفتح نسخة الويب من كاميرا الموبايل', "Scan with your phone's camera to open the web version")}</p>
      </div>
    </div>
  </div></section>`;
}

// ---------- pages ----------

const home = {
  file: 'index.html',
  title: (ctx) => ctx.L('خطة أكل وتمرين بتبدأ من صحتك', 'A food and training plan that starts with your health'),
  desc: (ctx) => ctx.L('يلا ويل بيعملك خطة أكل وتمرين على حسب حالتك الصحية وأدويتك وجسمك وهدفك، وبيفكرك بمواعيد أدويتك وتحاليلك.', 'Yalla Well builds a food and training plan around your health, your medicines, your body and your goal, and keeps track of your medicines and lab tests.'),
  body(ctx) {
    const { L } = ctx;
    const stats = [
      [314, L('أكلة بسعراتها', 'foods with their calories')],
      [106, L('وصفة بالكمية اللي تناسبك', 'recipes sized to your calories')],
      [9, L('أنظمة تمرين', 'training plans')],
      [90, L('تمرين بالصور والشرح', 'exercises with pictures and cues')],
      [85, L('مرض ودوا وفيتامين التطبيق عارفهم', 'conditions, medicines and supplements it knows')],
    ];
    const steps = [
      { img: 'health', alt: L('شاشة صحتي: الأدوية والفيتامينات بالجرعة والميعاد', 'My health screen: medicines and supplements with dose and time'), k: L('الصحة والأدوية', 'Health and medicines'),
        h: L('صحتك هي أول حاجة بنسأل عنها.', 'Your health is the first thing we ask about.'),
        p: L('المرض أو الدوا بيتكتب بالكلام العادي، زي "هاشيموتو" أو "سكر" أو "تكيس مبايض"، والتطبيق بيتعرف عليه ويغير الخطة كلها: تنبيهات الأكل، ومجهود التمرين، والحاجات اللي الأحسن تتجنب.', 'Type a condition or medicine in your own words, like Hashimoto\'s, diabetes or PCOS. The app recognises it and adjusts the whole plan: food warnings, how hard you train and what to avoid.'),
        li: [L('تنبيه لكل دوا في ميعاده، والدوا بيتعلم عليه لما يتاخد', 'A reminder for each medicine at its time, ticked off once taken'), L('كل يوم بنسألك عن الطاقة والألم والنوم، واليوم التقيل بيبقى يوم راحة خفيف', 'A daily check-in on energy, pain and sleep, and a rough day becomes an easy recovery day'), L('التحاليل بنتيجتها وتاريخها وصورة ورقتها، وتقرير PDF بآخر 4 أسابيع للدكتور', 'Lab results with their date and a photo of the paper, plus a PDF of the last 4 weeks for your doctor')] },
      { img: 'food', alt: L('شاشة الأكل: السعرات والبروتين والكارب والدهون والوجبات', 'Food screen: calories, protein, carbs, fat and meals'), k: L('الأكل', 'Food'),
        h: L('أكل عادي، بالكمية اللي تناسبك.', 'Everyday recipes, in the amount your calories allow.'),
        p: L('مفيش أكل دايت مخصوص. فيه 106 وصفة، وبنحسب كمية كل وصفة على قد السعرات اللي فاضلالك في الوجبة، ربع ولا نص ولا واحدة كاملة، والمقادير بتتغير معاها.', 'No special diet food. There are 106 recipes, and each one is resized to the calories you have left for that meal, a quarter, a half or more, with the ingredients changing to match.'),
        li: [L('الوجبة بتدخل في الحساب لما يتعلم عليها، مش على حسب الساعة', 'A meal counts when you tick it as eaten, not by the clock'), L('كل أسبوع هدف السعرات بيتظبط على تغير الوزن الحقيقي', 'Each week the calorie target is adjusted to your real weight change'), L('لو أكلة مش مناسبة لحالتك أو بتتعارض مع دوا، بننبهك', "A warning when a food doesn't suit your condition or one of your medicines")] },
      { img: 'train', alt: L('شاشة التمرين: يوم أرداف وتمارينه بالمجموعات والعدات', 'Training screen: a glutes day with sets and reps'), k: L('التمرين', 'Training'),
        h: L('تمرين على قد صحتك والجيم بتاعك.', 'Training that fits your health and your gym.'),
        p: L('كل يوم في الأسبوع يا جيم يا بيت يا راحة. ولو فيه تمرين مش مناسب لحالتك، أو بيتعب الركبة أو الضهر، بنبدله بتمرين أنسب ونكتبلك السبب.', "Each day of the week is gym, home or rest. If an exercise doesn't suit your condition or a sore joint, it's swapped for a better one, with the reason next to it."),
        li: [L('الأجهزة اللي في الجيم بتتحدد، والتمارين بتيجي على قد الموجود', 'Exercises match the equipment your gym actually has'), L('كل تمرين ليه نسخة بالأجهزة ونسخة بالأوزان الحرة', 'Every exercise has a machine and a free-weight version'), L('دفتر لكل تمرين فيه أحسن وزن اتشال، والهدف الجاي، وفاضل قد إيه عليه', 'A logbook for each exercise with your best lift, your next goal and how far is left')] },
    ];
    const gallery = [
      ['today', L('النهارده', 'Today'), L('فاضلك كام سعرة، وأدوية النهارده', "Calories left and today's medicines")],
      ['food', L('الأكل', 'Food'), L('كل وجبة وسعراتها والبروتين بتاعها', 'Each meal with its calories and protein')],
      ['train', L('التمرين', 'Training'), L('تمارين النهارده بالمجموعات والعدات', "The day's exercises with sets and reps")],
      ['today-meds', L('سؤال اليوم', 'Daily check-in'), L('الطاقة والنوم والألم النهارده، ولو اليوم تقيل التمرين بيخف', 'Energy, pain and sleep. On a rough day, training eases off')],
      ['health', L('صحتي', 'My health'), L('الأدوية والفيتامينات بجرعاتها ومواعيدها', 'Medicines and supplements with dose and time')],
    ];
    const more = [
      ['heart', L('حالتك بالكلام العادي', 'Your condition, in your own words'), L('مرض مناعي، أو سكر، أو غدة، أو تكيس مبايض، أو أدوية مستمرة. بيتكتب زي ما بيتقال، والتطبيق بيغير على أساسه تنبيهات الأكل ومجهود التمرين والحاجات اللي الأحسن تتجنب.', 'An autoimmune disease, diabetes, thyroid problems, PCOS or long-term medicines. Type it the way you would say it, and the app changes food warnings, training intensity and what to avoid around it.')],
      ['pill', L('الأدوية ومواعيدها', 'Medicines and their times'), L('الجرعة والعدد وكل قد إيه والمواعيد، وتنبيه في كل ميعاد، وعلامة لما الدوا يتاخد. ميعاد الدوا بيتظبط مع الوجبات، واليوم اللي بعد الحقنة الأسبوعية بيبقى أخف.', "Dose, count, how often and at what times, with a reminder at each one and a tick once it's taken. Medicine times are lined up with meals, and the day after a weekly injection is kept lighter.")],
      ['moon', L('سؤال اليوم', 'Daily check-in'), L('كل يوم بنسألك عن الطاقة والألم والنوم. ولو اليوم طلع تقيل، التمرين بيتحول لوحده ليوم راحة خفيف.', 'Each day the app asks about energy, pain and sleep. If it turns out to be a rough day, the workout becomes an easy recovery day by itself.')],
      ['lab', L('التحاليل وورقتها', 'Lab tests and their papers'), L('التراكمي والغدة وفيتامين د والفيريتين وB12 والدهون وصورة الدم وكشف العين. النتيجة والتاريخ بيتكتبوا، وصورة الورقة بتتحفظ في التطبيق، وبنفكرك بميعاد التحليل الجاي.', 'HbA1c, TSH, vitamin D, ferritin, B12, lipids, CBC and eye exams. The result and date go in, a photo of the lab paper can be kept in the app, and a reminder comes when the next test is due.')],
      ['doc', L('تقرير للدكتور', 'A report for your doctor'), L('ملف PDF بآخر 4 أسابيع: الأدوية والالتزام بيها، والطاقة والألم والنوم، والأيام التقيلة، والتمرين، والتحاليل. بيسهل الكلام مع الدكتور في الزيارة الجاية.', 'A PDF of the last 4 weeks: medicines and how regularly they were taken, energy, pain and sleep, rough days, workouts and labs. It makes the next visit easier.')],
      ['chart', L('مراجعة السعرات كل أسبوع', 'A weekly calorie check'), L('كل أسبوع التطبيق بيبص على تغير الوزن الحقيقي وبيظبط هدف السعرات. ولو الحالة فيها خطر، بدل ما يقلل أكتر بيقترح الكلام مع الدكتور الأول.', 'Every week the app looks at your real weight change and adjusts the calorie target. With a higher-risk condition, it suggests talking to your doctor first instead of cutting further.')],
      ['flame', L('توزيع الأكل اللي يناسبك', 'Macro modes'), L('متوازن، أو بروتين أعلى، أو كارب أقل، أو كيتو. والكيتو بيتقفل لو فيه حالة صحية تخليه مش آمن.', 'Balanced, higher protein, lower carb or keto. Keto is locked when a health condition makes it unsafe.')],
      ['plate', L('الدوا والأكل مع بعض', 'Medicines and food together'), L('لو دوا الغدة لازم يبعد عن الكالسيوم أو الحديد، بنقولك. ولو أكلة بتتعارض مع دوا، زي الجريب فروت مع دوا الكوليسترول، بتظهرلك بالأحمر.', 'If thyroid medicine has to be kept apart from calcium or iron, the app tells you. A food that clashes with a medicine, like grapefruit with cholesterol pills, shows in red.')],
      ['dumbbell', L('تمارين بتتبدل لوحدها', 'Exercises that swap themselves'), L('لو عندك وجع في الركبة أو الضهر أو الكتف، أو حالة محتاجة حرص، بنبدل التمرين بتمرين أنسب ونكتبلك السبب.', 'With knee, back or shoulder pain, or a condition that needs care, an exercise is swapped for a safer one, with the reason next to it.')],
    ];
    const extra = [
      ['dumbbell', L('دفتر لكل تمرين', 'A logbook for every exercise'), L('كارت فيه أحسن وزن اتشال، والهدف الجاي، وفاضل قد إيه عليه، وعمود لكل جلسة عشان التقدم يبان.', 'A record card with your best lift, your next goal and how far is left, plus a bar for every session so progress is easy to see.')],
      ['check', L('على قد أجهزة الجيم', 'Matched to your gym'), L('الأجهزة الموجودة في الجيم بتتحدد مرة واحدة، والتمارين بتيجي على قدها. وكل تمرين ليه نسخة بالأوزان الحرة ونسخة بالجهاز.', 'The equipment at your gym is set once, and the exercises match it. Every exercise has a free-weight and a machine version.')],
      ['doc', L('الخطة للكوتش', 'Your plan for a coach'), L('خطة التمرين بتطلع ملف PDF يتبعت للكوتش أو يتطبع.', 'The training plan exports as a PDF to send to a coach or print.')],
      ['chart', L('صفحة التقدم', 'Progress page'), L('المقاسات، ونسبة الدهون التقريبية، وصور التقدم. والصور بتفضل على الموبايل ومش بتطلع منه.', 'Measurements, an estimated body-fat percentage and progress photos. The photos stay on your phone.')],
      ['instagram', L('ستوري الأسبوع', 'Your weekly story'), L('صورة كل أسبوع فيها الأيام ورا بعض، والأيام اللي كانت في الهدف، وعدد التمارين، جاهزة تتنزل على انستجرام أو واتساب.', 'A picture each week with your streak, days on target and workouts, ready to post on Instagram or WhatsApp.')],
      ['bell', L('تنبيهات بأرقام يومك', "Reminders with the day's numbers"), L('التنبيه بيقول فاضلالك كام كوباية مية وكام سعرة، وتمرين النهارده إيه. والكلام بيتغير كل يوم، فمش بيتكرر.', "Reminders mention your real numbers: cups of water left, calories left and today's workout. The wording changes every day, so they don't repeat.")],
    ];
    const g = faqGroups(ctx);
    const top = [g[0].items[0], g[3].items[0], g[4].items[0], g[0].items[3], g[0].items[1]];
    return `
<section class="hero">
  <div class="wrap hero-text">
    <p class="pill reveal"><span class="dot" aria-hidden="true"></span>${L('قريبا على آيفون وأندرويد', 'Coming soon to iPhone and Android')}</p>
    <h1 class="display reveal" data-split>${L('خطة أكل وتمرين<br>بتبدأ من صحتك.', 'A food and training plan<br>that starts with your health.')}</h1>
    <p class="lead reveal">${L('بنسألك الأول عن حالتك الصحية وأدويتك، وبعدها عن سنك ووزنك وهدفك، ومن الإجابات دي بنعملك خطة أكل وتمرين. ولو حالتك أو أدويتك اتغيرت، الخطة بتتغير معاها. فممكن اتنين بنفس الوزن تطلعلهم خطتين مختلفين خالص.', 'Yalla Well asks about your health and your medicines first, then your age, weight and goal, and builds your food and training plan from the answers. When your health or medicines change, the plan changes with them. Two people with the same weight can end up with very different plans.')}</p>
    <div class="reveal">${storeButtons(ctx)}</div>
  </div>
  <div class="hero-stage">
    <div class="glow" aria-hidden="true"></div>
    <div class="hero-phone">${phone(ctx, 'today', L('شاشة النهارده في يلا ويل: السعرات الفاضلة والبروتين والكارب والدهون', 'The Today screen in Yalla Well: calories left, protein, carbs and fat'), 'phone-hero', true)}</div>
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

<section class="statement" aria-label="${L('يلا ويل في جملة', 'Yalla Well in a sentence')}">
  <div class="wrap">
    <p class="say" data-say>${L('اللي عنده سكر محتاج حاجة، واللي عنده روماتويد محتاج حاجة تانية خالص. واللي بيتمرن في البيت مش زي اللي بيروح الجيم. <em>عشان كده كل واحد في يلا ويل له خطته.</em>', "Someone with diabetes needs something different from someone with rheumatoid arthritis, and training at home isn't training at the gym. <em>So every plan in Yalla Well is made for one person.</em>")}</p>
  </div>
</section>

<section class="story" id="features">
  <div class="wrap story-in">
    <div class="story-text">
    <div class="story-nav" aria-hidden="true">${steps.map((s, i) => `<span class="sn${i === 0 ? ' is-on' : ''}"><b>${s.k}</b><i><u></u></i></span>`).join('')}</div>
    <div class="story-steps">
      ${steps.map((s, i) => `<article class="step${i === 0 ? ' is-on' : ''}" data-img="${ctx.img(s.img)}" data-alt="${s.alt}">
        ${kicker(s.k)}
        <h2 class="h2">${s.h}</h2>
        <p class="lead">${s.p}</p>
        ${ticks(s.li)}
        ${phone(ctx, s.img, s.alt, 'phone-inline')}
      </article>`).join('')}
    </div>
    </div>
    <div class="story-phone" aria-hidden="true">
      <figure class="phone phone-sticky"><div class="screens">${steps.map((s, i) => `<img class="screen${i === 0 ? ' is-on' : ''}" src="${ctx.img(s.img)}" alt="" width="390" height="844" decoding="async">`).join('')}</div></figure>
      <div class="story-dots">${steps.map((_, i) => `<i${i === 0 ? ' class="is-on"' : ''}></i>`).join('')}</div>
    </div>
  </div>
</section>

<section class="gallery" aria-labelledby="gal-title">
  <div class="wrap gal-head reveal">${kicker(L('الشاشات', 'Screens'))}<h2 class="h2" id="gal-title">${L('شكل التطبيق من جوه.', 'A look inside.')}</h2></div>
  <div class="gal-viewport">
    <div class="gal-track">
      ${gallery.map(([img, t, d]) => `<figure class="gal-item">${phone(ctx, img, `${t}: ${d}`, 'gal-phone')}<figcaption><b>${t}</b><span>${d}</span></figcaption></figure>`).join('')}
    </div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('الفرق', 'The difference'))}<h2 class="h2">${L('إيه اللي بيفرق يلا ويل عن غيره؟', 'What sets Yalla Well apart.')}</h2><p class="lead">${L('أغلب التطبيقات بتحسب السعرات وخلاص. يلا ويل بيبدأ من صحتك: المرض والأدوية والتحاليل بيغيروا الأكل والتمرين فعلا.', 'Most apps count calories and stop there. Yalla Well starts from your health, so conditions, medicines and lab results really change your food and training.')}</p></div>
    <div class="tiles">
      ${more.map(([ic, t, d]) => `<div class="tile reveal"><span class="tile-ic">${icon(ic, 24)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
    <p class="note reveal">${L('يلا ويل بيساعد في المتابعة وبيفكرك، لكنه مش بيشخص ومش بديل عن الدكتور. ألوان التحاليل دليل تقريبي، وأي قرار في الدوا أو الأكل أو التمرين الدكتور هو اللي بياخده.', 'Yalla Well helps you keep track and reminds you. It does not diagnose and does not replace a doctor. Lab colours are only a rough guide, and decisions about medicine, diet or training are for your doctor.')}</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('التمرين والتقدم', 'Training and progress'))}<h2 class="h2">${L('وكمان في التمرين والتقدم.', 'Training and progress, too.')}</h2></div>
    <div class="tiles">
      ${extra.map(([ic, t, d]) => `<div class="tile reveal"><span class="tile-ic">${icon(ic, 24)}</span><h3>${t}</h3><p>${d}</p></div>`).join('')}
    </div>
    <p class="more-link reveal"><a class="link-arrow" href="features.html">${L('كل المميزات', 'All features')} ${icon('arrow', 18)}</a></p>
  </div>
</section>

<section class="section" id="how">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('البداية', 'Getting started'))}<h2 class="h2">${L('أول مرة في التطبيق.', 'The first time you open it.')}</h2></div>
    <div class="how-line" aria-hidden="true"><span></span></div>
    <ol class="how">
      <li class="reveal"><span class="how-n">01</span><h3>${L('بنتعرف عليك', 'Getting to know you')}</h3><p>${L('سنك وطولك ووزنك وهدفك، وأي حالة صحية أو أدوية.', 'Age, height, weight and goal, plus any health conditions or medicines.')}</p></li>
      <li class="reveal"><span class="how-n">02</span><h3>${L('نظام التمرين', 'Choosing a plan')}</h3><p>${L('فيه 9 أنظمة، ولو مفيش نظام معين في دماغك بنسألك 3 أسئلة ونرشحلك واحد. وبعدها كل يوم في الأسبوع يا جيم يا بيت يا راحة.', 'One of nine plans, or three questions and we suggest one. Then each day of the week is set to gym, home or rest.')}</p></li>
      <li class="reveal"><span class="how-n">03</span><h3>${L('خطتك جاهزة', 'Your plan is ready')}</h3><p>${L('السعرات والبروتين والمية وأسبوع التمرين، ومعاهم ملاحظة بكل حاجة غيرناها عشان حالتك.', 'Calories, protein, water and your training week, with a note on everything adjusted for your health.')}</p></li>
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
  desc: (ctx) => ctx.L('مميزات يلا ويل: أكل ووصفات على قد سعراتك، وتمرين في الجيم أو البيت، ومتابعة لأدويتك وتحاليلك على حسب حالتك.', 'Yalla Well in detail: food and recipes sized to your calories, training at the gym or at home, and medicines and lab tests followed around your health.'),
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
    return `${pageHero(ctx, L('المميزات', 'Features'), L('التطبيق بيعمل إيه بالظبط؟', 'What the app does, in detail.'), L('أول حاجة بنسأل عنها هي صحتك. أي مرض أو دوا بيتسجل في الأول بيغير الأكل والتمرين والمواعيد، وعشان كده خطة كل واحد مختلفة عن التاني.', "The first thing the app asks about is your health. Every condition or medicine you add changes your food, your training and your timings, so no two plans look the same."))}
<nav class="jump wrap" aria-label="${L('أقسام الصفحة', 'On this page')}">
  <a href="#health">${icon('pill', 18)}${L('الصحة والأدوية', 'Health and medicines')}</a><a href="#training">${icon('dumbbell', 18)}${L('التمرين', 'Training')}</a><a href="#food">${icon('plate', 18)}${L('الأكل', 'Food')}</a><a href="#more">${icon('chart', 18)}${L('التقدم والتنبيهات', 'Progress and reminders')}</a>
</nav>
${block('health', 'health', L('شاشة صحتي', 'My health screen'), L('الصحة والأدوية', 'Health and medicines'), L('صحتك بتغير الخطة كلها.', 'Your health changes the whole plan.'), L('المرض أو الدوا بيتكتب بالكلام العادي، والتطبيق بيتعرف عليه ويظبط الأكل والتمرين على أساسه. فيه 12 حالة في القايمة، والتطبيق عارف 85 مرض ودوا وفيتامين بأكتر من 700 طريقة كتابة، ولو حاجة مش معروفة بنسألك عنها 3 أسئلة.', "Type a condition or medicine in your own words and the app recognises it and adjusts your food and training around it. Twelve conditions are on the list, the app knows 85 conditions, medicines and supplements in more than 700 spellings, and it asks three questions about anything else."), [
      [L('الحالات الصحية', 'Conditions'), [L('أمراض مناعية زي هاشيموتو وجريفز والروماتويد والصدفية والذئبة الحمرا والتصلب المتعدد وكرون والقولون التقرحي والسيلياك', "Autoimmune conditions such as Hashimoto's, Graves', rheumatoid arthritis, psoriasis, lupus, MS, Crohn's, ulcerative colitis and coeliac disease"), L('سكر نوع أول وتاني، ومقاومة الإنسولين، وتكيس المبايض، ومشاكل الغدة', 'Type 1 and type 2 diabetes, insulin resistance, PCOS and thyroid problems'), L('أي حالة تانية ينفع تتكتب، ولو مش معروفة بنسألك 3 أسئلة عن الأكل والتمرين والعلامات اللي التمرين لازم يقف عندها', 'Type anything else; if the app does not know it, it asks three quick questions about food, training and warning signs'), L('الأكل بيتظبط: تنبيهات، وأكل الأحسن يتجنب مع أدوية معينة، وبروتين أقل لو فيه مشكلة في الكلى', 'Food adjusts: warnings, foods to avoid with certain medicines, and less protein with kidney problems'), L('التمرين بيتظبط: مجهود أقل، وتمارين أخف على المفصل اللي بيوجع، وكارت بالعلامات اللي التمرين لازم يقف عندها', 'Training adjusts: lower intensity, gentler moves for painful joints, and a card of warning signs to stop')]],
      [L('الأدوية والفيتامينات', 'Medicines and supplements'), [L('الجرعة والعدد والشكل: حباية، نقط، حقنة، فوار وغيرهم', 'Dose, count and form: pill, drops, injection, sachet and more'), L('كل يوم، أو كل كام يوم، أو أيام معينة، أو كل أسبوع، أو كل شهر، وأكتر من ميعاد في اليوم', 'Daily, every few days, set weekdays, weekly or monthly, with several times a day'), L('تنبيه في كل ميعاد، والدوا بيتعلم عليه لما يتاخد', "A reminder at each time, and a tick once it's taken"), L('على معدة فاضية، أو مع الأكل، أو قبل النوم، والميعاد بيتظبط مع مواعيد الوجبات', 'On an empty stomach, with food or at bedtime, with times lined up against your meals'), L('لو فيه اتنين لازم يبعدوا عن بعض، زي الكالسيوم ودوا الغدة، بنقولك', 'A warning when two must be taken apart, like calcium and thyroid medicine'), L('اليوم اللي بعد الحقنة الأسبوعية، زي الميثوتركسات أو الدوا البيولوجي، بيبقى أخف في التمرين', 'The day after a weekly injection, like methotrexate or a biologic, is planned as a lighter training day')]],
      [L('سؤال اليوم', 'Daily check-in'), [L('كل يوم بنسألك عن الطاقة والألم والنوم', 'Each day the app asks about your energy, pain and sleep'), L('لو اليوم طلع تقيل، التمرين بيتحول لوحده ليوم راحة خفيف', 'A rough day turns into an easy recovery day by itself'), L('الإجابات بتدخل في تقرير الدكتور', 'The answers go into the doctor report')]],
      [L('التحاليل', 'Lab tests'), [L('التراكمي، والغدة، وفيتامين د، والفيريتين، وB12، والدهون، وصورة الدم، وكشف العين', 'HbA1c, TSH, vitamin D, ferritin, B12, lipids, CBC and eye exams'), L('النتيجة والتاريخ بيتكتبوا، وصورة ورقة التحليل ممكن تتحفظ في التطبيق', 'The result and date go in, and a photo of the lab paper can be kept in the app'), L('بنفكرك لما ييجي ميعاد التحليل الجاي', 'A reminder when the next test is due'), L('نتيجة التراكمي والغدة بتغير الخطة', 'HbA1c and TSH results change your plan'), L('الألوان دليل تقريبي بس، والدكتور هو اللي بيقرر', 'Colours are only a rough guide; your doctor decides')]],
      [L('السعرات ونظام الأكل', 'Calories and macros'), [L('كل أسبوع التطبيق بيبص على تغير الوزن الحقيقي وبيظبط هدف السعرات', 'Every week the app looks at your real weight change and adjusts the calorie target'), L('لو الحالة فيها خطر، بدل ما يقلل أكتر بيقترح الكلام مع الدكتور', 'With a higher-risk condition, it suggests talking to your doctor instead of cutting further'), L('4 أنظمة: متوازن، وبروتين أعلى، وكارب أقل، وكيتو', 'Four macro modes: balanced, higher protein, lower carb and keto'), L('الكيتو بيتقفل لو فيه حالة صحية تخليه مش آمن', 'Keto is locked when a health condition makes it unsafe')]],
      [L('تقرير الدكتور', 'Doctor report'), [L('ملف PDF بآخر 4 أسابيع: الأدوية والالتزام بيها، والطاقة والألم والنوم، والأيام التقيلة، والتمرين، والتحاليل', 'A PDF of the last 4 weeks: medicines and adherence, energy, pain and sleep, rough days, workouts and labs'), L('بيتطبع أو بيتبعت من الموبايل', 'Print it or send it from your phone')]],
    ], false)}
<section class="section tight">
  <div class="wrap narrow">
    <p class="note reveal">${L('يلا ويل بيساعد في المتابعة وبيفكرك، لكنه مش بيشخص ومش بديل عن الدكتور. أي قرار في الدوا أو الأكل أو التمرين الدكتور هو اللي بياخده.', 'Yalla Well helps you keep track and reminds you. It does not diagnose and does not replace a doctor. Decisions about medicine, diet or training are for your doctor.')}</p>
  </div>
</section>
${block('training', 'train', L('شاشة التمرين', 'Training screen'), L('التمرين', 'Training'), L('تمرين على حسب أيامك.', 'A training week around your days.'), L('9 أنظمة بأسامي سهلة، من 3 لـ6 أيام في الأسبوع.', 'Nine plans with plain names, from 3 to 6 days a week.'), [
      [L('الأنظمة', 'Plans'), [L('الجسم كله، فوق وتحت، دفع وسحب ورجل، أرداف ورجل، عضلة كل يوم، و5 أيام بين الجيم والبيت', 'Full body, upper and lower, push pull legs, glutes and legs, one muscle a day, and 5 days split between gym and home'), L('لو مفيش نظام معين في دماغك، 3 أسئلة ونرشحلك واحد', 'Not sure? Three questions and we suggest one'), L('كل يوم يا جيم يا بيت يا راحة، ويوم الجيم ليه تقسيمته: دفع أو سحب أو رجل وغيرهم', 'Set each day to gym, home or rest, and choose the split for gym days')]],
      [L('التمارين', 'Exercises'), [L('90 تمرين بالصور والشرح بالعربي', '90 exercises with pictures and cues'), L('نسخة بالجهاز واسم الجهاز، ونسخة بالأوزان الحرة', 'A machine version with the machine named, and a free-weight version'), L('الأجهزة الموجودة في الجيم بتتحدد مرة واحدة، والتمارين بتيجي على قدها', 'The equipment your gym has is set once, and exercises are picked to match it'), L('لو تمرين مش مناسب لحالتك أو بيتعب الركبة أو الضهر، بنبدله بتمرين أنسب ونكتبلك السبب', "An exercise that doesn't suit your condition or a sore joint is swapped for a better one, with the reason shown"), L('ممكن تمرين يتشال أو تمرين جديد يتضاف لليوم', 'Remove an exercise, or add your own to the day')]],
      [L('في الجيم', 'At the gym'), [L('الوزن بيتكتب بالأرقام، والعدات بزرار زائد وناقص', 'Type the weight, set reps with plus and minus'), L('تايمر للراحة شغال بالوقت الحقيقي', 'A rest timer that runs in real time'), L('برنامج 4 أسابيع، ولما المجموعات كلها توصل للعدد المطلوب بنزودلك الوزن', 'A 4-week program, with the suggested weight going up once you hit all your reps'), L('في أيام التعب، التمرين بيبقى حركة خفيفة وتنفس', 'On rough days, the workout becomes light mobility and breathing')]],
      [L('دفتر التمرين', 'Logbook'), [L('كل تمرين ليه كارت فيه أحسن وزن اتشال، والهدف الجاي، وفاضل قد إيه عليه', 'Each exercise has a record card with your best lift, your next goal and how far is left'), L('عمود لكل جلسة، عشان التقدم يبان من أول نظرة', 'A bar for every session, so progress shows at a glance'), L('خطة التمرين بتطلع ملف PDF يتبعت للكوتش', 'The training plan exports as a PDF to share with a coach')]],
    ], true)}
${block('food', 'food', L('شاشة الأكل', 'Food screen'), L('الأكل', 'Food'), L('أكلك العادي، بسعراته.', 'Your everyday food, counted.'), L('بنحسب هدف السعرات والبروتين والكارب والدهون من سنك وطولك ووزنك ونشاطك وهدفك، ولو عندك حالة صحية بنظبطه عليها.', 'Your calorie, protein, carb and fat targets come from your age, height, weight, activity and goal, and shift with any health condition.'), [
      [L('التسجيل', 'Logging'), [L('314 أكلة، كل واحدة بكميتها وسعراتها والبروتين والكارب والدهون', '314 foods, each with portion, calories and macros'), L('فطار وغدا وعشا وسناك، والوجبة بتدخل في الحساب لما يتعلم عليها', "Breakfast, lunch, dinner and snacks; a meal counts once it's ticked as eaten"), L('الوجبة بتتكتب بالكلام، زي "2 بيض وعيش بلدي"، والتطبيق بيحسبها', 'Type a meal in Arabic the way you would say it, and the app works it out'), L('الأكلات اللي بتتكرر كتير بتطلعلك الأول', 'The foods you log most come first')]],
      [L('لو الأكلة مش في القايمة', "If a food isn't listed"), [L('بندور عليها أونلاين، واللي نلاقيه بيتحفظ في "أكلاتي"', 'Online search in public food databases, saved to "My foods"'), L('وفي تطبيق الموبايل فيه قارئ باركود للمنتجات', 'Barcode scanning for packaged food in the phone app')]],
      [L('الوصفات', 'Recipes'), [L('106 وصفة للفطار والغدا والعشا والسناكس', '106 recipes for breakfast, lunch, dinner and snacks'), L('كمية الوصفة على قد السعرات اللي فاضلالك في الوجبة، من ربع لواحدة ونص، والمقادير بتتغير معاها', 'Each is sized to the calories left for that meal, from a quarter to one and a half servings, with the ingredients rescaled'), L('الوصفات اللي مش مناسبة لحالتك مش بتظهرلك', "Recipes that don't suit your health are left out")]],
      [L('تنبيهات واقتراحات', 'Warnings and ideas'), [L('علامة حمرا لو الأكلة فيها ملح كتير، أو هتعدي الدهون أو الكارب، أو مش مناسبة لحالتك', "A red warning for high salt, going over your fat or carb limit, or food that doesn't suit your condition"), L('لو أكلة هتعدي سعراتك، بنقترح لحد 3 حاجات أخف من نفس النوع: حلو بحلو، ومقرمش بمقرمش', 'If a food would take you over, up to 3 lighter swaps of the same kind: sweet for sweet, crunchy for crunchy'), L('لو وجبة زادت، بنقسم الباقي على بقية اليوم، واقتراحات الوجبات بتصغر', 'Go over at one meal and the rest of the day is rebalanced, with smaller meal ideas'), L('الساعة 12 بالليل اليوم بيتقفل ويتحفظ للتقرير', 'The day locks after midnight and is saved for your report')]],
    ], false)}
<section class="section" id="more">
  <div class="wrap">
    <div class="sec-head reveal">${kicker(L('التقدم والتنبيهات', 'Progress and reminders'))}<h2 class="h2">${L('التقدم بيبان، والتنبيهات بأرقامك.', 'Progress you can see, reminders with your numbers.')}</h2></div>
    <div class="tiles">
      ${[
        ['globe', L('عربي وإنجليزي', 'Arabic and English'), L('اللغة بتتغير في أي وقت، والعربي بيكلم الولد بصيغة الولد والبنت بصيغة البنت.', 'Switch any time; Arabic text adapts to you as a man or a woman.')],
        ['chart', L('صفحة التقدم', 'Progress page'), L('المقاسات، ونسبة الدهون التقريبية، وصور التقدم. والصور بتفضل على الموبايل ومش بتطلع منه.', 'Measurements, an estimated body-fat percentage and progress photos. The photos stay on your phone.')],
        ['instagram', L('ستوري الأسبوع', 'Your weekly story'), L('صورة كل أسبوع فيها الأيام ورا بعض، والأيام اللي كانت في الهدف، وعدد التمارين، جاهزة تتنزل على انستجرام أو واتساب.', 'A picture each week with your streak, days on target and workouts, ready to post on Instagram or WhatsApp.')],
        ['bell', L('تنبيهات بأرقام يومك', "Reminders with the day's numbers"), L('للوجبات والمية والتمرين والأدوية والتحاليل. التنبيه بيقول فاضلالك كام كوباية مية وكام سعرة، وتمرين النهارده إيه، والكلام بيتغير كل يوم فمش بيتكرر. ولو الحاجة اتعملت، التنبيه مش بييجي. موجودة في تطبيق الموبايل بس.', "For meals, water, workouts, medicines and lab tests. Each one mentions your real numbers, like cups of water left, calories left and today's workout, and the wording changes every day so it never repeats. Skipped once it's done. Phone app only.")],
        ['chart', L('تقرير أسبوعي', 'Weekly report'), L('كل يوم أخضر أو أحمر، والأسابيع اللي فاتت موجودة، وينفع يتطبع أو يتبعت PDF.', 'Each day green or red, past weeks included, ready to print or share as a PDF.')],
        ['flame', L('نقط وأيام ورا بعض', 'Points and streaks'), L('لما السعرات تبقى بين 75% و110% من الهدف، ومع كل تمرين يخلص.', 'For staying between 75% and 110% of your calorie target, and for every finished workout.')],
        ['doc', L('الخطة للكوتش', 'Your plan for a coach'), L('خطة التمرين بتطلع ملف PDF يتبعت للكوتش أو يتطبع.', 'The training plan exports as a PDF to send to a coach or print.')],
        ['moon', L('على مزاجك', 'Your way'), L('فاتح أو غامق، وصورة بروفايل، والأصوات ممكن تتقفل.', 'Light or dark, a profile photo, and sounds you can turn off.')],
        ['heart', L('الكابتن', 'The captain'), L('بطل اللوجو، بيقولك جملة على حسب يومك، وبياخدك لفة في التطبيق أول مرة.', 'The champ from our logo comments on your day and gives you a tour the first time.')],
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
  desc: (ctx) => ctx.L('يلا ويل شغال دلوقتي على الويب من أي موبايل أو كمبيوتر، وقريب على آيفون وأندرويد.', 'Yalla Well works now on the web from any phone or computer, and is coming soon to iPhone and Android.'),
  body(ctx) {
    const { L } = ctx;
    return `${pageHero(ctx, L('التحميل', 'Download'), L('يلا ويل على موبايلك.', 'Yalla Well on your phone.'), L('نسخة الويب شغالة دلوقتي، وتطبيق آيفون وأندرويد في الطريق.', 'The web version works today. iPhone and Android apps are on the way.'))}
<section class="section tight">
  <div class="wrap">
    <div class="dl-grid">
      <div class="dl-card is-live reveal">
        <span class="badge">${L('متاح دلوقتي', 'Available now')}</span>
        <span class="dl-ic">${icon('globe', 30)}</span>
        <h2 class="h3">${L('نسخة الويب', 'Web version')}</h2>
        <p>${L('بتتفتح من المتصفح على أي موبايل أو كمبيوتر، ومش محتاجة تحميل.', 'Opens in the browser on any phone or computer, nothing to install.')}</p>
        <div class="dl-actions">
          <a class="btn btn-primary" href="${WEB_APP}">${L('يلا نجرب', 'Open the web version')}</a>
          <img class="dl-qr" src="${ctx.root}static/img/qr-web.svg" alt="${L('كود QR بيفتح نسخة الويب', 'QR code that opens the web version')}" width="112" height="112">
        </div>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('آيفون', 'iPhone')}</h2>
        <p>${L('على App Store، ومعاه التنبيهات وقارئ الباركود.', 'On the App Store, with reminders and barcode scanning.')}</p>
      </div>
      <div class="dl-card reveal">
        <span class="badge badge-soon">${L('قريبا', 'Coming soon')}</span>
        <span class="dl-ic">${icon('phone', 30)}</span>
        <h2 class="h3">${L('أندرويد', 'Android')}</h2>
        <p>${L('على Google Play، ومعاه التنبيهات وقارئ الباركود.', 'On Google Play, with reminders and barcode scanning.')}</p>
      </div>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('خطوة صغيرة', 'One small step'))}<h2 class="h2">${L('يلا ويل على الشاشة الرئيسية', 'Yalla Well on your home screen')}</h2><p class="lead">${L('عشان يتفتح زي أي تطبيق، بأيقونة الكابتن.', 'So it opens like any app, with the captain as its icon.')}</p></div>
    <div class="howto">
      <div class="howto-col reveal"><h3 class="h3">${L('آيفون (Safari)', 'iPhone (Safari)')}</h3><ol><li>${L('نسخة الويب تتفتح في Safari', 'Open the web version in Safari')}</li><li>${L('زرار المشاركة اللي تحت', 'Tap the Share button')}</li><li>${L('"إضافة إلى الشاشة الرئيسية"', '"Add to Home Screen"')}</li></ol></div>
      <div class="howto-col reveal"><h3 class="h3">${L('أندرويد (Chrome)', 'Android (Chrome)')}</h3><ol><li>${L('نسخة الويب تتفتح في Chrome', 'Open the web version in Chrome')}</li><li>${L('القايمة ⋮ اللي فوق', 'Tap the ⋮ menu')}</li><li>${L('"إضافة إلى الشاشة الرئيسية" أو "تثبيت التطبيق"', '"Add to Home screen" or "Install app"')}</li></ol></div>
    </div>
    <p class="note reveal">${L('نسخة الويب مفيهاش تنبيهات ولا قارئ الباركود، ودول هييجوا مع تطبيق الموبايل.', "The web version has no reminders or barcode camera. Those come with the phone app.")}</p>
  </div>
</section>
<section class="section">
  <div class="wrap narrow center reveal">
    <h2 class="h2">${L('التطبيق نازل قريب.', 'Want to know when it launches?')}</h2>
    <p class="lead">${hasSocial() ? L('هنعلن على السوشيال ميديا أول ما التطبيق ينزل.', "Follow us on social media; we'll announce it there first.") : L('هنعلن على السوشيال ميديا أول ما التطبيق ينزل، والحسابات هتتحط هنا قريب.', "We'll announce it on social media first; our accounts will be listed here soon.")}</p>
    ${hasSocial() ? `<div class="socials socials-lg">${socialLinks(ctx)}</div>` : ''}
    <p><a class="link-arrow" href="contact.html">${L('صفحة التواصل', 'Or contact us')} ${icon('arrow', 18)}</a></p>
  </div>
</section>`;
  },
};

const faq = {
  file: 'faq.html',
  title: (ctx) => ctx.L('الأسئلة الشائعة', 'FAQ'),
  desc: (ctx) => ctx.L('أسئلة عن يلا ويل: السعرات، وأنظمة التمرين، والأمراض والأدوية، والخصوصية، والتحميل.', 'Answers about Yalla Well: calories, training plans, health conditions and medicines, privacy and downloading.'),
  body(ctx) {
    const { L } = ctx;
    const groups = faqGroups(ctx);
    return `${pageHero(ctx, L('الأسئلة الشائعة', 'FAQ'), L('أسئلة وإجابات.', 'Questions and answers.'), L('ولو سؤالك مش هنا، هتلاقينا في صفحة التواصل.', "If your question isn't here, the contact page is."))}
<nav class="jump wrap" aria-label="${L('أقسام الأسئلة', 'Question topics')}">${groups.map((g) => `<a href="#${g.id}">${g.title}</a>`).join('')}</nav>
<section class="section tight">
  <div class="wrap narrow">
    ${groups.map((g) => `<div class="qa-group reveal" id="${g.id}"><h2 class="h3">${g.title}</h2><div class="qas">${g.items.map(qa).join('')}</div></div>`).join('')}
    <div class="ask reveal">
      ${champ('point', { size: 72 })}
      <div><h2 class="h3">${L('سؤالك مش هنا؟', "Didn't find it?")}</h2><p>${L('رسالة واحدة وهنرد عليك.', "Send us a message and we'll get back to you.")}</p></div>
      <a class="btn btn-ghost" href="contact.html">${L('صفحة التواصل', 'Contact us')}</a>
    </div>
  </div>
</section>`;
  },
};

const about = {
  file: 'about.html',
  title: (ctx) => ctx.L('عن يلا ويل', 'About'),
  desc: (ctx) => ctx.L('ليه عملنا يلا ويل: عشان كل واحد ياخد خطة أكل وتمرين على حسب جسمه وصحته وأدويته.', 'Why we made Yalla Well: so each person gets a food and training plan built around their body, their health and their medicines.'),
  body(ctx) {
    const { L } = ctx;
    const values = [
      ['chat', L('بكلامنا', 'In plain words'), L('التطبيق بيتكلم زي ما احنا بنتكلم، والعربي بيكلم الولد بصيغة الولد والبنت بصيغة البنت. وفيه إنجليزي كمان.', 'The app talks the way people talk, and its Arabic adjusts for men and women. English too.')],
      ['heart', L('صحتك بتغير الخطة', 'Health changes the plan'), L('الأمراض المزمنة والمناعية والأدوية بتغير الأكل والتمرين والمواعيد فعلا، مش بتتكتب في ملاحظة وخلاص.', 'Chronic and autoimmune conditions and medicines really change food, training and timing, instead of sitting in a note.')],
      ['lock', L('بياناتك على موبايلك', 'Your data stays on your phone'), L('مفيش حساب، وتاريخك الصحي مش متخزن على سيرفر عندنا.', 'No account, and no server of ours holding your health history.')],
      ['doc', L('مش بديل للدكتور', 'Not a doctor'), L('بنساعد في التنظيم والمتابعة، لكن القرار الطبي للدكتور. والتقرير بيسهل الكلام معاه.', 'We help you organise and keep track; medical decisions stay with your doctor. The report makes that conversation easier.')],
    ];
    return `${pageHero(ctx, L('عن يلا ويل', 'About'), L('ليه عملنا يلا ويل؟', 'Why we made Yalla Well.'), L('أغلب تطبيقات الدايت بتدي كل الناس نفس الحساب، ومحدش فيها بيسأل عن الغدة ولا الروماتويد ولا مواعيد الدوا. واللي عنده حالة زي دي بيفضل يحسب كل حاجة في دماغه لوحده. عملنا يلا ويل عشان يشيل عنه الحساب ده.', 'Most diet apps give everyone the same numbers and never ask about thyroid problems, rheumatoid arthritis or medicine times. People living with those end up working it all out in their heads. We made Yalla Well to do that part for them.'))}
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
      <h2 class="h2">${L('بطل اللوجو جوه التطبيق.', 'The champ from our logo lives in the app.')}</h2>
      <p class="lead">${L('الكابتن موجود في كل شاشة وبيعمل حاجة تناسبها: بيشجع في الرئيسية، وبياكل في صفحة الأكل، وبيرفع حديد في التمرين. وكل يوم بيقولك جملة على حسب يومك.', 'The captain shows up on every screen doing something that fits it: cheering on Today, eating on Food and lifting on Training. Each day he says something about how your day is going.')}</p>
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap narrow">
    <div class="sec-head reveal">${kicker(L('لمين', 'Who it is for'))}<h2 class="h2">${L('معمول لأي حد من دول.', 'Yalla Well is made for')}</h2></div>
    ${ticks([
      L('اللي هدفه ينزل أو يثبت أو يزود وزنه وهو بياكل أكله العادي', 'Anyone who wants to lose, keep or gain weight while eating their usual food'),
      L('اللي بيتمرن في الجيم، أو في البيت، أو بين الاتنين', 'People who train at the gym, at home, or a bit of both'),
      L('اللي عنده مرض مزمن أو مناعي وبياخد أدوية وفيتامينات', 'People living with a chronic or autoimmune condition and taking medicines and supplements'),
    ])}
  </div>
</section>
${downloadPanel(ctx)}`;
  },
};

const contactPage = {
  file: 'contact.html',
  title: (ctx) => ctx.L('التواصل', 'Contact us'),
  desc: (ctx) => ctx.L('عندك سؤال أو اقتراح أو مشكلة في يلا ويل؟ بالإيميل أو واتساب أو السوشيال ميديا.', 'A question, idea or problem with Yalla Well? Reach us by email, WhatsApp or social media.'),
  body(ctx) {
    const { L } = ctx;
    const soon = `<span class="muted">${L('قريبا', 'Coming soon')}</span>`;
    const socials = Object.entries(SOCIAL).filter(([, u]) => u);
    const ready = !!contact.email;
    return `${pageHero(ctx, L('التواصل', 'Contact us'), L('عندك سؤال أو فكرة؟', 'A question, an idea or a problem?'), L('أو مشكلة في التطبيق؟ الرسالة بتوصلنا احنا على طول.', 'A small question or an idea for something new in the app, it comes straight to us.'))}
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
      <p class="small muted" id="form-note" aria-live="polite">${ready ? L('الزرار بيفتح الإيميل والرسالة جاهزة فيه.', 'The button opens your email app with the message ready.') : L('الفورم هيشتغل أول ما نحط إيميل التواصل.', 'The form will work as soon as our contact email is added.')}</p>
    </form>
    <div class="contact-cards">
      <div class="c-card reveal"><span class="tile-ic">${icon('mail', 22)}</span><div><h2 class="h3">${L('الإيميل', 'Email')}</h2>${contact.email ? `<a href="mailto:${contact.email}" dir="ltr">${contact.email}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('chat', 22)}</span><div><h2 class="h3">${L('واتساب', 'WhatsApp')}</h2>${contact.whatsapp ? `<a href="https://wa.me/${contact.whatsapp}" dir="ltr" rel="noopener">+${contact.whatsapp}</a>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('instagram', 22)}</span><div><h2 class="h3">${L('السوشيال ميديا', 'Social media')}</h2>${socials.length ? `<div class="c-links">${socials.map(([k, u]) => `<a href="${u}" rel="noopener">${L(SOCIAL_NAMES[k][0], SOCIAL_NAMES[k][1])}</a>`).join('')}</div>` : soon}</div></div>
      <div class="c-card reveal"><span class="tile-ic">${icon('book', 22)}</span><div><h2 class="h3">${L('قبل الرسالة', 'Before you write')}</h2><a href="faq.html">${L('ممكن تلاقي الإجابة في الأسئلة الشائعة', 'The answer may be in the FAQ')}</a></div></div>
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
  desc: (ctx) => ctx.L('يلا ويل بيعمل إيه في بياناتك: كل حاجة على الموبايل، ومن غير حساب.', 'How Yalla Well handles your data: everything stays on your phone, with no account.'),
  body(ctx) {
    const { L } = ctx;
    return legal(ctx, L('الخصوصية', 'Privacy'), [
      [L('باختصار', 'In short'), [L('يلا ويل مفيهوش حساب ولا تسجيل دخول. كل اللي بيتسجل في التطبيق بيتحفظ على الموبايل نفسه، ومش بيتبعت لأي سيرفر عندنا.', "Yalla Well has no account or sign-in. Everything you record in the app is saved on your phone and isn't sent to a server of ours.")]],
      [L('اللي بيتحفظ على الموبايل', 'What the app keeps on your phone'), [[L('بياناتك الأساسية: الاسم والسن والطول والوزن والهدف، وصورة البروفايل لو فيه', 'Basics: name, age, height, weight, goal, and a profile photo if you add one'), L('الأمراض والأدوية والفيتامينات ومواعيدها، ونتايج التحاليل', 'Health conditions, medicines and supplements with their times, and lab results'), L('الأكل والتمرين، وإجابات سؤال اليوم عن الطاقة والألم والنوم', 'Food, workouts and the daily energy, pain and sleep check-in')]]],
      [L('إيه اللي بيطلع من الموبايل', 'What leaves your phone'), [[
        L('البحث عن أكلة مش في القايمة أو قراءة باركود: الكلمة أو رقم الباركود بس هو اللي بيتبعت لقواعد بيانات أكل عامة (USDA FoodData Central وOpen Food Facts).', 'Searching for a food or scanning a barcode: only the search words or barcode number go to public food databases (USDA FoodData Central and Open Food Facts).'),
        L('الكلام اللي بيتكتب بالإيد، زي مرض أو دوا مش في القايمة، بيتبعت لخدمة ترجمة (Google Translate أو MyMemory) عشان يظهر باللغة التانية.', 'Text you type yourself, such as a condition or medicine not on the list, is sent to a translation service (Google Translate or MyMemory) so it can be shown in the other language.'),
        L('صور الوصفات والتمارين بتتحمل من مواقع عامة (TheMealDB وWikimedia وGitHub)، وفيديوهات الطريقة من يوتيوب. والمواقع دي بتشوف عنوان الإنترنت بتاعك زي أي موقع.', 'Recipe and exercise pictures load from public sites (TheMealDB, Wikimedia and GitHub), and how-to videos from YouTube. Like any website, these see your internet address.'),
        L('تقرير الدكتور والتقرير الأسبوعي مش بيروحوا لأي حد، غير لو اتبعتوا من الموبايل بإيدك.', 'The doctor report and weekly report go nowhere unless you send them yourself.'),
      ]]],
      [L('التنبيهات', 'Reminders'), [L('التنبيهات بتتجهز على الموبايل نفسه، ومش بتعدي على أي سيرفر.', 'Reminders are scheduled on the phone itself and do not pass through a server.')]],
      [L('الموقع ده', 'This website'), [L('الموقع مفيهوش إعلانات ولا كوكيز تتبع ولا أدوات تحليل، والخطوط والصور كلها عندنا.', 'This website has no ads, tracking cookies or analytics, and serves its own fonts and images.')]],
      [L('مسح البيانات', 'Deleting your data'), [L('في "ملفي" فيه زرار بيمسح كل البيانات. ولو التطبيق اتمسح، أو بيانات الموقع اتمسحت من المتصفح، البيانات بتتمسح معاها. ومفيش عندنا نسخة نرجعها منها.', 'In "Me" there is a button that deletes all your data. Uninstalling the app or clearing the site data in your browser deletes it too. We hold no copy, so it cannot be restored.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('لو الصفحة دي اتغيرت، التاريخ اللي فوق هيتغير. ولو عندك أي سؤال، هتلاقينا في <a href="contact.html">صفحة التواصل</a>.', 'If this page changes, the date above will change. For any question, see the <a href="contact.html">contact page</a>.')]],
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
      [L('التطبيق', 'The app'), [L('يلا ويل أداة بتساعد في التنظيم والمتابعة: حساب السعرات، وترتيب التمرين، ومواعيد الأدوية. النسخة دي تجريبية، وممكن حاجات فيها تتغير.', 'Yalla Well is a tool to organise and keep track: counting calories, planning training and timing medicines. The current version is a trial, and things may change.')]],
      [L('مش نصيحة طبية', 'Not medical advice'), [L('اللي في التطبيق معلومات عامة ومساعدة في التنظيم، مش تشخيص ولا علاج، ومش بديل عن الدكتور. أي تغيير في الدوا أو الأكل أو التمرين لازم يكون بعد ما الدكتور يوافق. ولو ظهرت أي علامة خطر أثناء التمرين، التمرين يقف على طول والدكتور لازم يعرف.', 'The app offers general information and help with organising. It is not a diagnosis, treatment or a substitute for a doctor. Talk to your doctor before changing any medicine, diet or training, and stop training and contact a doctor straight away if any warning sign appears.')]],
      [L('دقة المعلومات', 'Accuracy'), [L('السعرات والقيم الغذائية تقريبية، وبتختلف على حسب الكمية وطريقة الطبخ. ونتايج البحث أونلاين جاية من قواعد بيانات عامة ممكن يكون فيها غلط.', 'Calories and nutrition values are estimates and vary with portion and cooking. Online search results come from public databases that may contain errors.')]],
      [L('الاستخدام', 'Use'), [L('التطبيق للاستخدام الشخصي، والبيانات اللي فيه بتاعة صاحبها ومتخزنة على موبايله.', 'The app is for personal use. The data you enter is yours and stays on your phone.')]],
      [L('التغييرات والتواصل', 'Changes and contact'), [L('الشروط دي ممكن تتحدث، والتاريخ اللي فوق بيقول آخر تحديث. ولو عندك أي سؤال، هتلاقينا في <a href="contact.html">صفحة التواصل</a>.', 'These terms may be updated; the date above shows the latest version. For any question, see the <a href="contact.html">contact page</a>.')]],
    ]);
  },
};

export const PAGES = [home, features, download, faq, about, contactPage, privacy, terms];
