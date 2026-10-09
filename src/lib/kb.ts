// Conditions, medicines and supplements people type themselves (not on the pick lists): the names they go by
// (Egyptian Arabic, English and brand names), what each changes in food and training, and the signs to stop a
// workout for. A typed item that matches one of these is handled like a picked one everywhere (food alerts,
// workout swaps, calorie target, labs, reminders). One that doesn't match gets three quick questions instead
// (Profile.extra), and the answers are applied the same way.
import type { Joint } from './data.ts';
import type { FoodTag } from './foods.ts';
import type { MedRule } from './health.ts';
import type { Gender, Profile } from './plan.ts';

/** Things to cut down on in food. */
export type FoodFlag = 'salt' | 'sugar' | 'fat' | 'gluten' | 'dairy' | 'caffeine' | 'spicy' | 'redmeat' | 'fiber';
/** Things to avoid in training. */
export type TrainFlag = 'noJump' | 'noHeavy' | 'short' | 'easy' | 'noHeat' | 'machines';
/** Signs to stop a workout for. */
export type Watch = 'dizzy' | 'breath' | 'chest' | 'palp' | 'headache' | 'sugarLow' | 'joint' | 'numb' | 'bleed' | 'fever' | 'cramps' | 'nausea' | 'belly';
/** Answers for a typed item the app doesn't know. `none` = "nothing changes" was picked for that question. */
export type Answers = { food?: FoodFlag[]; train?: TrainFlag[]; watch?: Watch[]; rule?: MedRule };

type Txt = (g: Gender) => [string, string];
type Level = 'ok' | 'warn' | 'bad';
/** A food the item asks to avoid, by name (fava beans with G6PD, grapefruit with statins, nuts with an allergy). */
export type Avoid = { re: RegExp; level: Level; text: Txt };

export type KBItem = {
  id: string;
  kind: 'cond' | 'med' | 'vit';
  n: [string, string];
  /** Ways people write it. Matched at the start of a word, with or without "ال". */
  words: string[];
  /** The pick-list id it is (روماتيزم → ra, يوثيروكس → thyroxine). */
  same?: string;
  /** Another item it implies (a blood-pressure pill implies high blood pressure). */
  implies?: string;
  /** Autoimmune: food notes about inflammation apply. */
  auto?: boolean;
  /** A joint to spare in workouts. */
  pain?: Joint;
  food?: FoodFlag[]; train?: TrainFlag[]; watch?: Watch[];
  avoid?: Avoid[];
  /** Largest calorie deficit when losing weight. */
  deficit?: number;
  proteinMin?: number; proteinMax?: number;
  /** Extra cups of water a day. */
  water?: number;
  foodNote?: Txt; trainNote?: Txt;
  /** Medicines: how it's taken, the usual time and form, and how often (weekly injections). */
  rule?: MedRule; time?: string; how?: Txt; form?: DoseForm; unit?: DoseUnit; weekly?: boolean;
  /** Medicines that shouldn't be taken close to this one, with the hours to leave between them. */
  apart?: { id: string; h: number }[];
};

export type DoseForm = 'pill' | 'cap' | 'inj' | 'drop' | 'sachet' | 'spoon' | 'puff' | 'amp';
export type DoseUnit = 'mg' | 'mcg' | 'iu' | 'u' | 'ml' | 'g';

const SPICY = /حار|شطه|هريسه|سبايسي|spicy|chili|فلفل احمر حار|بالشطه/;

export const KB: KBItem[] = [
  /* ---------- Pick-list conditions written another way ---------- */
  { id: 'k_hashi', kind: 'cond', n: ['هاشيموتو', "Hashimoto's"], words: ['هاشيموتو', 'هشيموتو', 'هاشيموتو', 'hashimoto'], same: 'hashimoto' },
  { id: 'k_graves', kind: 'cond', n: ['جريفز', "Graves'"], words: ['جريفز', 'جرافز', 'graves'], same: 'graves' },
  { id: 'k_ra', kind: 'cond', n: ['روماتويد', 'Rheumatoid arthritis'], words: ['روماتويد', 'روماتيزم', 'روماتزم', 'rheumatoid', 'rheumatism'], same: 'ra' },
  { id: 'k_pso', kind: 'cond', n: ['صدفية', 'Psoriasis'], words: ['صدفيه', 'psoriasis', 'psoriatic'], same: 'psoriasis' },
  { id: 'k_lupus', kind: 'cond', n: ['لوبس', 'Lupus'], words: ['لوبس', 'ذئبه', 'الذئبه الحمراء', 'lupus', 'sle'], same: 'lupus' },
  { id: 'k_t1d', kind: 'cond', n: ['سكر النوع الأول', 'Type 1 diabetes'], words: ['سكر النوع الاول', 'سكر نوع اول', 'سكر اطفال', 'type 1', 'type one'], same: 't1d' },
  { id: 'k_t2d', kind: 'cond', n: ['السكر', 'Diabetes'], words: ['سكر النوع التاني', 'سكر نوع تاني', 'سكري', 'سكر', 'diabetes', 'diabetic', 'type 2'], same: 't2d' },
  { id: 'k_ir', kind: 'cond', n: ['مقاومة الإنسولين', 'Insulin resistance'], words: ['مقاومه انسولين', 'مقاومه الانسولين', 'ما قبل السكر', 'بدايه سكر', 'insulin resistance', 'prediabetes', 'pre diabetes'], same: 'ir' },
  { id: 'k_pcos', kind: 'cond', n: ['تكيس المبايض', 'PCOS'], words: ['تكيس', 'تكيسات', 'pcos', 'pcod', 'polycystic'], same: 'pcos' },
  { id: 'k_celiac', kind: 'cond', n: ['سيلياك', 'Celiac'], words: ['سيلياك', 'حساسيه القمح', 'حساسيه الجلوتين', 'حساسيه جلوتين', 'celiac', 'coeliac', 'gluten'], same: 'celiac' },
  { id: 'k_ms', kind: 'cond', n: ['التصلب المتعدد', 'MS'], words: ['تصلب متعدد', 'التصلب المتعدد', 'multiple sclerosis', 'ms'], same: 'ms' },
  { id: 'k_ibd', kind: 'cond', n: ['كرون أو القولون التقرحي', "Crohn's or colitis"], words: ['كرون', 'قولون تقرحي', 'القولون التقرحي', 'تقرحي', 'crohn', 'colitis', 'ibd'], same: 'ibd' },

  /* ---------- Other conditions ---------- */
  { id: 'htn', kind: 'cond', n: ['ضغط عالي', 'High blood pressure'], words: ['ضغط عالي', 'ارتفاع ضغط', 'ارتفاع في الضغط', 'ضغط مرتفع', 'ضغط الدم', 'ضغط', 'hypertension', 'high blood pressure', 'blood pressure'],
    food: ['salt'], train: ['noHeavy'], watch: ['headache', 'chest', 'dizzy'],
    foodNote: (g) => [`${g('قلل', 'قللي')} الملح: بلاش مخللات وجبنة رومي وشيبس ومعلبات، و${g('دوق', 'دوقي')} الأكل قبل ما ${g('تملح', 'تملحي')}.`, 'Cut down on salt: skip pickles, aged cheese, crisps and canned food, and taste before you salt.'],
    trainNote: (g) => [`${g('متكتمش', 'متكتميش')} نفسك وانت${g('', 'ي')} ${g('بترفع', 'بترفعي')}، ${g('اتنفس', 'اتنفسي')} مع كل عدة، وبلاش أوزان تقيلة جدا. لو الضغط قبل التمرين أعلى من 160/100 خليه يوم مشي خفيف.`, "Don't hold your breath when lifting: breathe with every rep, and skip very heavy weights. If your pressure is over 160/100 before training, just walk that day."] },
  { id: 'lowbp', kind: 'cond', n: ['ضغط واطي', 'Low blood pressure'], words: ['ضغط واطي', 'ضغط منخفض', 'هبوط ضغط', 'هبوط في الضغط', 'انخفاض ضغط', 'انخفاض في الضغط', 'low blood pressure', 'hypotension'],
    watch: ['dizzy'], water: 2,
    foodNote: (g) => [`${g('اشرب', 'اشربي')} مياه كفاية و${g('متسيبش', 'متسيبيش')} وجبات. الملح مش ممنوع ${g('عليك', 'عليكي')} إلا لو دكتورك قال.`, "Drink enough water and don't skip meals. Salt isn't off-limits unless your doctor says so."],
    trainNote: (g) => [`${g('قوم', 'قومي')} من على الأرض أو البنش بالراحة، و${g('اشرب', 'اشربي')} مياه قبل التمرين وفي النص.`, 'Get up from the floor or bench slowly, and drink water before and during training.'] },
  { id: 'asthma', kind: 'cond', n: ['ربو أو حساسية صدر', 'Asthma'], words: ['ربو', 'حساسيه صدر', 'حساسيه الصدر', 'حساسيه على الصدر', 'ازمه ربو', 'asthma'],
    watch: ['breath', 'chest'],
    trainNote: (g) => [`${g('سخن', 'سخني')} ١٠ دقايق، وخلي البخاخة ${g('معاك', 'معاكي')} في التمرين. بلاش كارديو في هوا ساقع أو تراب.`, 'Warm up for 10 minutes and keep your inhaler with you. Avoid cardio in cold or dusty air.'] },
  { id: 'anemia', kind: 'cond', n: ['أنيميا', 'Anaemia'], words: ['انيميا', 'فقر دم', 'نقص حديد', 'نقص الحديد', 'نقص في الحديد', 'هيموجلوبين واطي', 'anemia', 'anaemia', 'iron deficiency'],
    train: ['easy'], watch: ['dizzy', 'breath', 'palp'],
    foodNote: (g) => [`${g('كل', 'كلي')} لحمة أو كبدة أو عدس مع حاجة فيها فيتامين سي (ليمون، برتقان، فلفل). الشاي والقهوة بعد الأكل بساعة مش معاه.`, 'Have meat, liver or lentils with something rich in vitamin C (lemon, orange, peppers). Tea and coffee an hour after meals, not with them.'] },
  { id: 'hypo', kind: 'cond', n: ['قصور الغدة', 'Underactive thyroid'], words: ['قصور الغده', 'قصور في الغده', 'خمول الغده', 'كسل الغده', 'الغده الدرقيه', 'غده درقيه', 'hypothyroid', 'underactive thyroid'],
    deficit: 0.15,
    foodNote: (g) => [`العجز في السعرات محدود (١٥٪) عشان الطاقة. دوا الغدة على الريق، والقهوة والكالسيوم والحديد بعده بوقت.`, 'The calorie deficit is capped at 15% to protect your energy. Thyroid pills on an empty stomach, with coffee, calcium and iron well after.'] },
  { id: 'hyper', kind: 'cond', n: ['نشاط زيادة في الغدة', 'Overactive thyroid'], words: ['فرط نشاط الغده', 'فرط نشاط', 'نشاط زايد في الغده', 'نشاط زياده في الغده', 'زياده نشاط الغده', 'غده نشيطه', 'hyperthyroid', 'overactive thyroid'],
    deficit: 0, train: ['noJump', 'easy'], watch: ['palp', 'chest'],
    trainNote: (g) => [`لحد ما الغدة تتظبط: مجهود خفيف لمتوسط ومن غير قفز، و${g('وقف', 'وقفي')} لو قلبك دق بسرعة.`, 'Until your thyroid is under control: light to moderate effort, no jumping, and stop if your heart races.'] },
  { id: 'fatliver', kind: 'cond', n: ['كبد دهني', 'Fatty liver'], words: ['كبد دهني', 'دهون على الكبد', 'دهون علي الكبد', 'دهون في الكبد', 'fatty liver', 'nafld', 'masld'],
    food: ['sugar', 'fat'],
    foodNote: (g) => [`نزول ٥-١٠٪ من وزنك بيفرق جدا مع الكبد. بلاش المياه الغازية والعصاير المحلاة والمقلي.`, 'Losing 5-10% of your weight makes a real difference to the liver. Skip soft drinks, sweetened juice and fried food.'] },
  { id: 'liver', kind: 'cond', n: ['الكبد', 'Liver disease'], words: ['فيروس سي', 'فيروس c', 'التهاب كبدي', 'التهاب الكبد', 'تليف', 'تليف كبد', 'hepatitis', 'cirrhosis', 'كبد'],
    food: ['fat', 'salt'],
    foodNote: (g) => [`ممنوع الكحول، و${g('قلل', 'قللي')} المقلي والمعلبات. لو في تليف، دكتورك هيقول${g('لك', 'لك')} كمية البروتين والملح.`, 'No alcohol, and cut down on fried and canned food. With cirrhosis, your doctor sets your protein and salt.'] },
  { id: 'kidney', kind: 'cond', n: ['الكلى', 'Kidney disease'], words: ['فشل كلوي', 'قصور كلوي', 'قصور في الكلي', 'ضعف في الكلي', 'ضعف الكلي', 'مرض الكلي', 'غسيل كلوي', 'kidney disease', 'ckd', 'renal', 'كلي'],
    food: ['salt'], proteinMax: 1.0,
    foodNote: (g) => [`البروتين محدود (١ جم لكل كيلو) لحد ما دكتورك يقول غير كده. ${g('قلل', 'قللي')} الملح، و${g('اسأل', 'اسألي')} عن البوتاسيوم والفوسفور (موز، طماطم، بقوليات، ألبان).`, 'Protein is capped at 1 g per kg until your doctor says otherwise. Cut down on salt, and ask about potassium and phosphorus (bananas, tomatoes, beans, dairy).'] },
  { id: 'stones', kind: 'cond', n: ['حصوات الكلى', 'Kidney stones'], words: ['حصوات', 'حصوه', 'حصي في الكلي', 'رمل في الكلي', 'رمل', 'kidney stones', 'kidney stone'],
    food: ['salt'], water: 4,
    foodNote: (g) => [`${g('اشرب', 'اشربي')} مياه كتير لحد ما لون البول يبقى فاتح، و${g('قلل', 'قللي')} الملح.`, 'Drink plenty of water until your urine is pale, and cut down on salt.'] },
  { id: 'gout', kind: 'cond', n: ['النقرس', 'Gout'], words: ['نقرس', 'نقرص', 'حمض اليوريك', 'يوريك اسيد', 'uric', 'gout'],
    food: ['redmeat'], watch: ['joint'], water: 3,
    avoid: [{ re: /كبده|كلاوي|ممبار|سجق|جمبري|سردين|انشوجه|رنجه|فسيخ|liver|sardine|shrimp/, level: 'warn', text: (g) => ['فيه بيورين عالي بيرفع حمض اليوريك.', 'High in purines, which raise uric acid.'] },
      { re: /كولا|بيبسي|سبرايت|فانتا|عصير|cola|soda|juice/, level: 'warn', text: (g) => ['السكر اللي في المشروبات بيرفع حمض اليوريك.', 'The sugar in sweet drinks raises uric acid.'] }],
    foodNote: (g) => [`${g('قلل', 'قللي')} اللحمة الحمرا والكبدة والسجق والجمبري، و${g('اشرب', 'اشربي')} مياه كتير.`, 'Cut down on red meat, liver, sausages and shrimp, and drink plenty of water.'] },
  { id: 'gerd', kind: 'cond', n: ['ارتجاع وحموضة', 'Reflux'], words: ['ارتجاع', 'حموضه', 'حرقان في المعده', 'فتق الحجاب', 'فتق في الحجاب', 'reflux', 'gerd', 'heartburn', 'hiatal'],
    food: ['fat', 'spicy', 'caffeine'],
    foodNote: (g) => [`آخر أكلة قبل النوم بـ٣ ساعات. ${g('قلل', 'قللي')} المقلي والحراق والقهوة والمياه الغازية.`, 'Last meal 3 hours before bed. Cut down on fried and spicy food, coffee and fizzy drinks.'],
    trainNote: (g) => [`${g('اتمرن', 'اتمرني')} بعد الأكل بساعتين على الأقل، وبلاش تمارين على ضهرك أو انحناء على طول بعد الأكل.`, 'Train at least two hours after eating, and avoid lying flat or bending over right after a meal.'] },
  { id: 'ibs', kind: 'cond', n: ['القولون العصبي', 'IBS'], words: ['قولون عصبي', 'القولون العصبي', 'قولون', 'انتفاخ', 'irritable bowel', 'ibs'],
    food: ['fat'],
    foodNote: (g) => [`وجبات صغيرة ومياه كتير. ${g('لاحظ', 'لاحظي')} الأكلات اللي بتعمل${g('لك', 'لك')} انتفاخ (زي البقوليات والبصل والألبان) و${g('قللها', 'قلليها')}.`, 'Small meals and plenty of water. Notice which foods bloat you (often beans, onions, dairy) and cut down on them.'] },
  { id: 'ulcer', kind: 'cond', n: ['التهاب المعدة', 'Gastritis or ulcer'], words: ['قرحه', 'التهاب معده', 'التهاب في المعده', 'جرثومه', 'جرثومه المعده', 'h pylori', 'pylori', 'ulcer', 'gastritis'],
    food: ['spicy', 'caffeine', 'fat'],
    foodNote: (g) => [`وجبات صغيرة على مواعيد، وبلاش الحراق والقهوة على معدة فاضية. المسكنات زي البروفين بتتعب المعدة، ${g('اسأل', 'اسألي')} دكتورك قبلها.`, 'Small regular meals, and no spicy food or coffee on an empty stomach. Painkillers like ibuprofen upset the stomach; ask your doctor first.'] },
  { id: 'lactose', kind: 'cond', n: ['حساسية اللاكتوز', 'Lactose intolerance'], words: ['حساسيه لاكتوز', 'حساسيه اللاكتوز', 'عدم تحمل اللاكتوز', 'حساسيه اللبن', 'حساسيه من اللبن', 'حساسيه الالبان', 'حساسيه من الالبان', 'lactose'],
    food: ['dairy'] },
  { id: 'g6pd', kind: 'cond', n: ['أنيميا الفول (G6PD)', 'G6PD deficiency (favism)'], words: ['انيميا الفول', 'حساسيه الفول', 'حساسيه من الفول', 'g6pd', 'favism'],
    avoid: [{ re: /فول|طعميه|فلافل|بيصاره|fava|falafel/, level: 'bad', text: (g) => ['فيه فول، وده ممنوع مع أنيميا الفول.', 'Contains fava beans, which you must avoid with G6PD deficiency.'] }],
    foodNote: (g) => ['ممنوع الفول والطعمية والبيصارة بكل أشكالها.', 'No fava beans in any form: ful, falafel, bessara.'] },
  { id: 'nuts', kind: 'cond', n: ['حساسية المكسرات', 'Nut allergy'], words: ['حساسيه مكسرات', 'حساسيه المكسرات', 'حساسيه من المكسرات', 'حساسيه فول سوداني', 'حساسيه السوداني', 'nut allergy', 'peanut allergy'],
    avoid: [{ re: /لوز|سوداني|بندق|كاجو|فستق|عين جمل|مكسرات|زبده فول|نوتيلا|nut|almond|peanut|pistachio|walnut|cashew|nutella/, level: 'bad', text: (g) => ['فيه مكسرات.', 'Contains nuts.'] }] },
  { id: 'osteo', kind: 'cond', n: ['هشاشة العظام', 'Osteoporosis'], words: ['هشاشه عظام', 'هشاشه العظام', 'هشاشه', 'لين عظام', 'لين العظام', 'osteoporosis', 'osteopenia'],
    train: ['noJump'],
    trainNote: (g) => ['تمارين الأوزان مفيدة للعضم، بس بلاش الانحناء لقدام بوزن وبلاش القفز.', 'Strength training is good for your bones, but skip loaded forward bends and jumping.'],
    foodNote: (g) => [`كالسيوم كفاية من الألبان والسردين والسمسم، و${g('اسأل', 'اسألي')} عن فيتامين د.`, 'Enough calcium from dairy, sardines and sesame, and ask about vitamin D.'] },
  { id: 'disc', kind: 'cond', n: ['انزلاق غضروفي', 'Slipped disc'], words: ['انزلاق غضروفي', 'غضروف في الضهر', 'غضروف الضهر', 'غضروف', 'ديسك', 'عرق النسا', 'انزلاق', 'herniated', 'slipped disc', 'sciatica', 'disc'],
    pain: 'back', watch: ['numb'],
    trainNote: (g) => [`بلاش الانحناء بوزن ولف الضهر. لو ${g('حسيت', 'حسيتي')} بتنميل نازل في الرجل ${g('وقف', 'وقفي')} التمرين.`, 'No loaded bending or twisting. Stop if you feel tingling down your leg.'] },
  { id: 'knee', kind: 'cond', n: ['خشونة الركبة', 'Knee problems'], words: ['خشونه الركبه', 'خشونه الركب', 'خشونه ركبه', 'خشونه في الركبه', 'خشونه', 'رباط صليبي', 'غضروف الركبه', 'الركبه', 'acl', 'meniscus', 'knee'],
    pain: 'knee' },
  { id: 'shoulder', kind: 'cond', n: ['الكتف', 'Shoulder problems'], words: ['كتف متجمد', 'التهاب الكتف', 'وتر الكتف', 'الكتف', 'rotator', 'frozen shoulder', 'shoulder'], pain: 'shoulder' },
  { id: 'wrist', kind: 'cond', n: ['الرسغ', 'Wrist problems'], words: ['نفق رسغي', 'تنميل الايد', 'تنميل في الايد', 'الرسغ', 'carpal', 'wrist'], pain: 'wrist' },
  { id: 'heart', kind: 'cond', n: ['القلب', 'Heart condition'], words: ['ضعف عضله القلب', 'عضله القلب', 'قصور في القلب', 'عدم انتظام ضربات', 'ذبحه', 'جلطه', 'دعامه', 'قسطره', 'شرايين', 'قلب', 'arrhythmia', 'heart', 'cardiac', 'angina', 'stent'],
    food: ['salt', 'fat'], train: ['easy', 'noHeavy'], watch: ['chest', 'breath', 'palp', 'dizzy'],
    trainNote: (g) => [`دكتور القلب لازم يوافق على التمرين الأول. المجهود خفيف لمتوسط (${g('تقدر تتكلم', 'تقدري تتكلمي')} وانت${g('', 'ي')} ${g('بتتمرن', 'بتتمرني')})، وبلاش أوزان تقيلة.`, 'Your cardiologist should clear you for exercise first. Light to moderate effort (you can talk while training), and no heavy weights.'] },
  { id: 'epilepsy', kind: 'cond', n: ['الصرع', 'Epilepsy'], words: ['صرع', 'تشنجات', 'كهربا زياده', 'epilepsy', 'seizure'],
    train: ['machines'],
    trainNote: (g) => [`بلاش ${g('تتمرن', 'تتمرني')} لوحد${g('ك', 'ك')} في مكان عالي أو في المية، والماكينات أأمن من الأوزان الحرة فوق الوش.`, "Don't train alone at heights or in water, and machines are safer than free weights over your face."] },
  { id: 'migraine', kind: 'cond', n: ['الصداع النصفي', 'Migraine'], words: ['صداع نصفي', 'الصداع النصفي', 'شقيقه', 'ميجرين', 'صداع', 'migraine'],
    watch: ['headache'],
    foodNote: (g) => [`${g('متسيبش', 'متسيبيش')} وجبات و${g('اشرب', 'اشربي')} مياه كفاية. لو الكافيين بيعمل${g('لك', 'لك')} صداع خليه ثابت كل يوم.`, "Don't skip meals and drink enough water. If caffeine triggers headaches, keep it the same every day."] },
  { id: 'preg', kind: 'cond', n: ['الحمل', 'Pregnancy'], words: ['حامل', 'الحمل', 'حمل', 'pregnant', 'pregnancy'],
    deficit: 0, train: ['noJump', 'noHeavy', 'easy'], watch: ['bleed', 'belly', 'dizzy', 'headache', 'breath'], water: 2,
    foodNote: (g) => ['مفيش رجيم لنزول الوزن في الحمل، الهدف أكل متوازن. بلاش الجبن غير المبستر واللحمة النية، والقهوة كوباية في اليوم بالكتير.', 'No weight-loss diet in pregnancy; the goal is balanced eating. No unpasteurised cheese or raw meat, and at most one coffee a day.'],
    trainNote: (g) => ['دكتورة النسا لازم توافق. بلاش تمارين على ضهرك بعد الشهر الرابع، وبلاش قفز أو تمارين فيها احتمال وقوع.', 'Your obstetrician should approve first. No exercises lying on your back after the fourth month, and no jumping or anything with a risk of falling.'] },
  { id: 'nursing', kind: 'cond', n: ['الرضاعة', 'Breastfeeding'], words: ['رضاعه', 'برضع', 'بارضع', 'مرضع', 'breastfeeding', 'nursing'],
    deficit: 0.1, water: 4,
    foodNote: (g) => ['زودي ٣-٤ كوبايات مية في اليوم، والنزول يبقى بالراحة (نص كيلو في الأسبوع) عشان اللبن.', 'Add 3-4 cups of water a day, and lose weight slowly (half a kilo a week) to protect your milk.'] },
  { id: 'fibro', kind: 'cond', n: ['فيبروميالجيا', 'Fibromyalgia'], words: ['فيبروميالجيا', 'الالم العضلي الليفي', 'fibromyalgia'], train: ['easy', 'short'],
    trainNote: (g) => [`${g('ابدأ', 'ابدأي')} قليل و${g('زود', 'زودي')} بالراحة. أيام الألم الجامد يوم تعافي أو مشي خفيف.`, 'Start small and build up slowly. On bad pain days, do the recovery session or a gentle walk.'] },
  { id: 'spond', kind: 'cond', n: ['التهاب الفقرات', 'Ankylosing spondylitis'], words: ['التهاب الفقرات', 'الفقرات اللاصق', 'ankylosing', 'spondylitis'], auto: true, pain: 'back', train: ['noJump'],
    trainNote: (g) => ['تمارين المرونة والإطالة كل يوم بتفرق جدا مع الفقرات.', 'Daily mobility and stretching make a big difference for your spine.'] },
  { id: 'chol', kind: 'cond', n: ['الكوليسترول', 'High cholesterol'], words: ['كوليسترول', 'كولسترول', 'دهون عاليه في الدم', 'دهون في الدم', 'دهون الدم', 'ترايجليسريد', 'cholesterol', 'triglycerides', 'lipids'],
    food: ['fat', 'sugar'],
    foodNote: (g) => [`${g('قلل', 'قللي')} المقلي والسمنة والجبن الدسم واللحوم المصنعة، و${g('زود', 'زودي')} السمك والشوفان والخضار.`, 'Cut down on fried food, ghee, full-fat cheese and processed meat, and eat more fish, oats and vegetables.'] },
  { id: 'mood', kind: 'cond', n: ['القلق أو الاكتئاب', 'Anxiety or depression'], words: ['اكتئاب', 'قلق', 'توتر', 'نوبات هلع', 'هلع', 'anxiety', 'depression', 'panic'],
    trainNote: (g) => ['التمرين بيساعد المزاج، وحتى ١٠ دقايق مشي بتفرق في الأيام الصعبة.', 'Exercise helps your mood; even a 10-minute walk helps on hard days.'] },
  { id: 'varicose', kind: 'cond', n: ['الدوالي', 'Varicose veins'], words: ['دوالي', 'varicose'],
    trainNote: (g) => ['بلاش الوقوف الطويل بوزن تقيل، والشراب الضاغط بيساعد.', 'Avoid standing a long time with heavy loads; compression socks help.'] },
  { id: 'hernia', kind: 'cond', n: ['الفتق', 'Hernia'], words: ['فتق', 'hernia'], train: ['noHeavy'],
    trainNote: (g) => [`بلاش أوزان تقيلة أو ${g('تكتم', 'تكتمي')} نفسك، وبلاش تمارين بطن قوية لحد ما الدكتور يقول.`, "No heavy weights or holding your breath, and no hard ab work until your doctor says so."] },
  { id: 'autoimm', kind: 'cond', n: ['مرض مناعي', 'Autoimmune condition'], words: ['بهاق', 'ثعلبه', 'سجوجرين', 'مناعه ذاتيه', 'مرض مناعي', 'vitiligo', 'alopecia', 'sjogren', 'autoimmune', 'myasthenia', 'وهن عضلي'], auto: true },

  /* ---------- Medicines ---------- */
  { id: 'm_thyrox', kind: 'med', n: ['دوا الغدة', 'Thyroid medicine'], words: ['يوثيروكس', 'التروكسين', 'ليفوثيروكسين', 'ثيروكسين', 'ليفوكسين', 'euthyrox', 'eltroxin', 'levothyroxine', 'thyroxine', 'synthroid'], same: 'thyroxine' },
  { id: 'm_ster', kind: 'med', n: ['كورتيزون', 'Steroids'], words: ['بريدنيزولون', 'سولوبريد', 'ميدرول', 'ديكساميثازون', 'هيدروكورتيزون', 'كورتيزون', 'prednisolone', 'prednisone', 'solupred', 'medrol', 'dexamethasone', 'hydrocortisone', 'cortisone'], same: 'steroids' },
  { id: 'm_ins', kind: 'med', n: ['إنسولين', 'Insulin'], words: ['انسولين', 'لانتوس', 'توجيو', 'نوفورابيد', 'ميكستارد', 'هيومالوج', 'ابيدرا', 'تريسيبا', 'ليفمير', 'insulin', 'lantus', 'toujeo', 'novorapid', 'mixtard', 'humalog', 'apidra', 'tresiba', 'levemir'], same: 'insulin' },
  { id: 'm_mtx', kind: 'med', n: ['ميثوتركسات', 'Methotrexate'], words: ['ميثوتركسات', 'methotrexate', 'mtx', 'unitrexate'], same: 'mtx' },
  { id: 'm_bio', kind: 'med', n: ['مثبط مناعة', 'Immune suppressant'], words: ['هيوميرا', 'انبريل', 'ريمكاد', 'اكتيمرا', 'كوزنتكس', 'ستيلارا', 'زيلجانز', 'اوليوميانت', 'ارافا', 'ليفلونومايد', 'ازاثيوبرين', 'ايموران', 'سيلسبت', 'ميكوفينولات', 'تاكروليمس', 'سيكلوسبورين', 'ريتوكسيماب', 'اوكريفوس', 'تيسابري', 'humira', 'adalimumab', 'enbrel', 'etanercept', 'remicade', 'infliximab', 'actemra', 'cosentyx', 'stelara', 'xeljanz', 'olumiant', 'arava', 'leflunomide', 'azathioprine', 'imuran', 'cellcept', 'mycophenolate', 'tacrolimus', 'cyclosporine', 'rituximab', 'ocrevus', 'tysabri'], same: 'bio' },
  { id: 'm_hcq', kind: 'med', n: ['بلاكونيل', 'Plaquenil'], words: ['بلاكونيل', 'هيدروكسي كلوروكين', 'هيدروكسي', 'ريكونيل', 'plaquenil', 'hydroxychloroquine'], same: 'hcq' },
  { id: 'm_beta', kind: 'med', n: ['حاصرات بيتا', 'Beta blocker'], words: ['كونكور', 'اندرال', 'بيسوبرولول', 'بروبرانولول', 'تينورمين', 'اتينولول', 'نيبيليت', 'كارفيديلول', 'دايلاتريند', 'concor', 'inderal', 'bisoprolol', 'propranolol', 'tenormin', 'atenolol', 'nebilet', 'carvedilol'], same: 'beta' },
  { id: 'm_anticoag', kind: 'med', n: ['مسيل للدم', 'Blood thinner'], words: ['ماريفان', 'وارفارين', 'زاريلتو', 'اليكويس', 'براداكسا', 'كليكسان', 'بلافيكس', 'marevan', 'warfarin', 'xarelto', 'eliquis', 'pradaxa', 'clexane', 'plavix', 'clopidogrel'], same: 'anticoag' },
  { id: 'm_metf', kind: 'med', n: ['ميتفورمين', 'Metformin'], words: ['جلوكوفاج', 'سيدوفاج', 'ميتفورمين', 'ديابتكس', 'metformin', 'glucophage', 'cidophage'],
    rule: 'withFood', time: '14:00', form: 'pill', unit: 'mg',
    how: (g) => ['مع الأكل أو بعده على طول عشان المعدة.', 'With food or right after, to protect your stomach.'],
    foodNote: (g) => [`مع الميتفورمين ${g('اعمل', 'اعملي')} تحليل فيتامين ب١٢ كل سنة.`, 'On metformin, check your vitamin B12 once a year.'] },
  { id: 'm_su', kind: 'med', n: ['دوا سكر بيهبط السكر', 'Sulfonylurea'], words: ['اماريل', 'امريل', 'دياميكرون', 'جليميبرايد', 'جليكلازيد', 'دايونيل', 'amaryl', 'diamicron', 'glimepiride', 'gliclazide', 'daonil'],
    rule: 'withFood', time: '08:00', form: 'pill', unit: 'mg', watch: ['sugarLow'],
    how: (g) => [`مع الفطار، و${g('متسيبش', 'متسيبيش')} وجبات عشان السكر ميهبطش.`, "With breakfast, and don't skip meals so your sugar doesn't drop."],
    trainNote: (g) => [`الدوا ده ممكن يهبط السكر في التمرين: ${g('كل', 'كلي')} سناك فيه كارب قبلها، وخلي ${g('معاك', 'معاكي')} حاجة مسكرة.`, 'This medicine can drop your sugar during exercise: have a carb snack first and keep something sweet with you.'] },
  { id: 'm_sglt2', kind: 'med', n: ['فورسيجا وأمثاله', 'SGLT2 inhibitor'], words: ['فورسيجا', 'جارديانس', 'داباجليفلوزين', 'امباجليفلوزين', 'forxiga', 'jardiance', 'dapagliflozin', 'empagliflozin'],
    rule: 'any', time: '08:00', form: 'pill', unit: 'mg', water: 2, watch: ['dizzy'],
    how: (g) => [`الصبح، و${g('اشرب', 'اشربي')} مياه كتير طول اليوم.`, 'In the morning, and drink plenty of water all day.'] },
  { id: 'm_glp1', kind: 'med', n: ['حقن التخسيس (أوزمبك وأمثاله)', 'GLP-1 injection'], words: ['اوزمبك', 'اوزمبيك', 'مونجارو', 'ساكسندا', 'ويجوفي', 'تروليستي', 'فيكتوزا', 'ozempic', 'mounjaro', 'saxenda', 'wegovy', 'trulicity', 'victoza', 'semaglutide', 'tirzepatide', 'liraglutide'],
    rule: 'any', time: '10:00', form: 'inj', unit: 'mg', weekly: true, food: ['fat'], proteinMin: 1.8, watch: ['nausea', 'belly'],
    how: (g) => ['حقنة تحت الجلد في نفس اليوم كل أسبوع.', 'An injection under the skin on the same day each week.'],
    foodNote: (g) => [`الأكل هيقل، فخلي البروتين أول حاجة في كل وجبة عشان ${g('متخسرش', 'متخسريش')} عضل. وجبات صغيرة، وبلاش الدسم والمقلي عشان الغثيان.`, "You'll eat less, so put protein first in every meal to keep your muscle. Small meals, and skip greasy and fried food to avoid nausea."],
    trainNote: (g) => ['تمارين الأوزان مهمة جدا مع الحقن دي عشان تحافظ على العضل.', 'Strength training matters a lot on these injections, to keep your muscle.'] },
  { id: 'm_statin', kind: 'med', n: ['دوا الكوليسترول', 'Statin'], words: ['ليبيتور', 'كريستور', 'اتورفاستاتين', 'روزوفاستاتين', 'سيمفاستاتين', 'روسوكارد', 'اتور', 'lipitor', 'crestor', 'atorvastatin', 'rosuvastatin', 'simvastatin'],
    implies: 'chol', rule: 'any', time: '21:00', form: 'pill', unit: 'mg', watch: ['cramps'],
    avoid: [{ re: /جريب ?فروت|grapefruit/, level: 'bad', text: (g) => ['الجريب فروت بيتعارض مع دوا الكوليسترول.', 'Grapefruit interacts with your cholesterol medicine.'] }],
    how: (g) => ['بالليل غالبا. بلاش جريب فروت.', 'Usually in the evening. No grapefruit.'] },
  { id: 'm_acearb', kind: 'med', n: ['دوا الضغط', 'Blood pressure medicine'], words: ['كابوتين', 'تريتاس', 'كوفرسيل', 'زستريل', 'كوزار', 'ديوفان', 'اتاكاند', 'ميكارديس', 'اكسفورج', 'capoten', 'tritace', 'coversyl', 'zestril', 'cozaar', 'diovan', 'atacand', 'micardis', 'exforge', 'lisinopril', 'ramipril', 'perindopril', 'losartan', 'valsartan', 'telmisartan', 'candesartan', 'دوا ضغط', 'دوا الضغط'],
    implies: 'htn', rule: 'sameTime', time: '09:00', form: 'pill', unit: 'mg', watch: ['dizzy'],
    how: (g) => [`نفس الميعاد كل يوم. ${g('قوم', 'قومي')} من القعدة بالراحة، وبلاش ملح الريجيم (فيه بوتاسيوم).`, 'Same time every day. Stand up slowly, and avoid salt substitutes (they contain potassium).'] },
  { id: 'm_amlo', kind: 'med', n: ['أملوديبين', 'Amlodipine'], words: ['نورفاسك', 'املوديبين', 'املو', 'norvasc', 'amlodipine'],
    implies: 'htn', rule: 'sameTime', time: '09:00', form: 'pill', unit: 'mg', watch: ['dizzy'],
    avoid: [{ re: /جريب ?فروت|grapefruit/, level: 'warn', text: (g) => ['الجريب فروت بيزود مفعول دوا الضغط.', 'Grapefruit strengthens the effect of your blood pressure medicine.'] }],
    how: (g) => ['نفس الميعاد كل يوم. بلاش جريب فروت.', 'Same time every day. No grapefruit.'] },
  { id: 'm_diur', kind: 'med', n: ['مدر للبول', 'Diuretic'], words: ['لازكس', 'فوروسيميد', 'اسيدريكس', 'هيدروكلوروثيازيد', 'الداكتون', 'سبيرونولاكتون', 'lasix', 'furosemide', 'hydrochlorothiazide', 'aldactone', 'spironolactone'],
    rule: 'any', time: '08:00', form: 'pill', unit: 'mg', watch: ['cramps', 'dizzy'],
    how: (g) => [`الصبح عشان ${g('متصحاش', 'متصحيش')} بالليل. لو ${g('بتعرق', 'بتعرقي')} كتير في التمرين ${g('اشرب', 'اشربي')} مياه.`, "In the morning so it doesn't wake you at night. Drink water if you sweat a lot when training."] },
  { id: 'm_ppi', kind: 'med', n: ['دوا المعدة', 'Stomach acid medicine'], words: ['كونترولوك', 'نيكسيوم', 'اوميبرازول', 'بانتوبرازول', 'ايزوميبرازول', 'لانزوبرازول', 'بنتالوك', 'controloc', 'nexium', 'omeprazole', 'pantoprazole', 'esomeprazole', 'lansoprazole'],
    rule: 'empty', time: '07:30', form: 'pill', unit: 'mg',
    how: (g) => ['على الريق قبل الفطار بنص ساعة.', 'On an empty stomach, 30 minutes before breakfast.'] },
  { id: 'm_nsaid', kind: 'med', n: ['مسكن', 'Painkiller'], words: ['بروفين', 'كتافلام', 'فولتارين', 'ارتوكسيا', 'نابروكسين', 'ايبوبروفين', 'سيليبريكس', 'brufen', 'cataflam', 'voltaren', 'arcoxia', 'ibuprofen', 'naproxen', 'diclofenac', 'celebrex'],
    rule: 'withFood', time: '14:00', form: 'pill', unit: 'mg',
    how: (g) => ['بعد الأكل عشان المعدة.', 'After food, to protect your stomach.'] },
  { id: 'm_aspirin', kind: 'med', n: ['أسبرين', 'Aspirin'], words: ['اسبوسيد', 'اسبرين', 'ريفو', 'aspocid', 'aspirin'],
    rule: 'withFood', time: '14:00', form: 'pill', unit: 'mg', watch: ['bleed'],
    how: (g) => ['بعد الأكل.', 'After food.'] },
  { id: 'm_antithy', kind: 'med', n: ['دوا نشاط الغدة', 'Antithyroid medicine'], words: ['نيوماركازول', 'كاربيمازول', 'ثيامازول', 'بروبيل', 'neomercazole', 'carbimazole', 'methimazole', 'thiamazole', 'ptu'],
    implies: 'hyper', rule: 'sameTime', time: '09:00', form: 'pill', unit: 'mg', watch: ['fever'],
    how: (g) => [`نفس الميعاد كل يوم. لو جات${g('لك', 'لك')} سخونية أو التهاب في الزور ${g('كلم', 'كلمي')} دكتورك على طول.`, 'Same time every day. If you get a fever or sore throat, call your doctor right away.'] },
  { id: 'm_ocp', kind: 'med', n: ['حبوب منع الحمل', 'Birth control pill'], words: ['حبوب منع الحمل', 'منع حمل', 'ياسمين', 'ياز', 'جينيرا', 'دايان', 'yasmin', 'yaz', 'gynera', 'diane'],
    rule: 'sameTime', time: '21:00', form: 'pill', unit: 'mg',
    how: (g) => ['نفس الميعاد كل يوم بالظبط.', 'At exactly the same time every day.'] },
  { id: 'm_ssri', kind: 'med', n: ['دوا نفسي', 'Antidepressant'], words: ['سيبرالكس', 'زولوفت', 'بروزاك', 'لوسترال', 'باروكستين', 'سيرترالين', 'اسيتالوبرام', 'فلوكستين', 'سيمبالتا', 'دولوكستين', 'ويلبوترين', 'cipralex', 'zoloft', 'prozac', 'lustral', 'paroxetine', 'sertraline', 'escitalopram', 'fluoxetine', 'cymbalta', 'duloxetine', 'wellbutrin'],
    rule: 'sameTime', time: '09:00', form: 'pill', unit: 'mg',
    how: (g) => [`نفس الميعاد كل يوم، و${g('متوقفهوش', 'متوقفيهوش')} فجأة.`, "Same time every day, and don't stop it suddenly."] },
  { id: 'm_isotret', kind: 'med', n: ['روكتان', 'Isotretinoin'], words: ['روكتان', 'اكنوتين', 'ايزوتريتينوين', 'زوتان', 'roaccutane', 'acnotin', 'isotretinoin'],
    rule: 'withFood', time: '14:00', form: 'cap', unit: 'mg', watch: ['joint'],
    how: (g) => ['مع أكلة فيها دهون عشان يتمتص.', 'With a meal that has some fat, so it absorbs.'],
    foodNote: (g) => [`مع الروكتان بلاش مكملات فيتامين أ، و${g('استخدم', 'استخدمي')} صن بلوك، و${g('اعمل', 'اعملي')} تحليل دهون ووظائف كبد زي ما الدكتور قال.`, 'On isotretinoin: no vitamin A supplements, wear sunscreen, and get your lipids and liver tests as your doctor says.'] },
  { id: 'm_inhaler', kind: 'med', n: ['بخاخة الصدر', 'Inhaler'], words: ['بخاخه', 'سيريتايد', 'فنتولين', 'سيمبيكورت', 'بلميكورت', 'فوستر', 'ventolin', 'seretide', 'symbicort', 'pulmicort', 'foster', 'inhaler'],
    implies: 'asthma', rule: 'any', time: '09:00', form: 'puff', unit: 'mcg',
    how: (g) => [`${g('اغسل', 'اغسلي')} بق${g('ك', 'ك')} بعد بخاخة الكورتيزون، وخلي بخاخة الإسعاف ${g('معاك', 'معاكي')} في التمرين.`, 'Rinse your mouth after a steroid inhaler, and keep your reliever inhaler with you when training.'] },
  { id: 'm_monte', kind: 'med', n: ['سينجولير', 'Montelukast'], words: ['سينجولير', 'مونتيلوكاست', 'singulair', 'montelukast'], implies: 'asthma', rule: 'any', time: '21:00', form: 'pill', unit: 'mg',
    how: (g) => ['بالليل.', 'In the evening.'] },

  /* ---------- Vitamins and supplements ---------- */
  { id: 'v_iron', kind: 'vit', n: ['حديد', 'Iron'], words: ['حديد', 'فيروجلوبين', 'فيروفول', 'هيموجلوبين', 'فيرو', 'iron', 'ferrous', 'feroglobin', 'ferrofol'],
    rule: 'empty', time: '11:00', form: 'cap', unit: 'mg', apart: [{ id: 'v_calc', h: 2 }, { id: 'thyroxine', h: 4 }],
    how: (g) => ['على معدة فاضية مع عصير برتقان أو ليمون. بعيد عن الشاي والقهوة واللبن والكالسيوم بساعتين.', 'On an empty stomach with orange juice or lemon, two hours away from tea, coffee, milk and calcium.'] },
  { id: 'v_calc', kind: 'vit', n: ['كالسيوم', 'Calcium'], words: ['كالسيوم', 'كالسيمات', 'كالتريت', 'اوستيوكير', 'calcium', 'caltrate', 'osteocare'],
    rule: 'withFood', time: '14:00', form: 'pill', unit: 'mg', apart: [{ id: 'thyroxine', h: 4 }, { id: 'v_iron', h: 2 }],
    how: (g) => ['مع الأكل، وبعيد عن دوا الغدة بـ٤ ساعات وعن الحديد بساعتين.', 'With food, 4 hours away from thyroid medicine and 2 hours from iron.'] },
  { id: 'v_d', kind: 'vit', n: ['فيتامين د', 'Vitamin D'], words: ['فيتامين د', 'فيتامين دال', 'فيتامين دي', 'ديفارول', 'فيدروب', 'ون الفا', 'وان الفا', 'هاي دي', 'd3', 'vitamin d', 'vit d', 'devarol', 'vidrop', 'one alpha', 'hi d'],
    rule: 'withFood', time: '14:00', form: 'drop', unit: 'iu',
    how: (g) => ['مع أكلة فيها دهون عشان يتمتص أحسن.', 'With a meal that has some fat, so it absorbs better.'] },
  { id: 'v_b12', kind: 'vit', n: ['فيتامين ب١٢', 'Vitamin B12'], words: ['ب12', 'ب ١٢', 'فيتامين ب', 'ميلجا', 'نيوروبيون', 'ميكوبالامين', 'دوديكافيت', 'b12', 'milga', 'neurobion', 'methylcobalamin', 'cobalamin'],
    rule: 'any', time: '10:00', form: 'pill', unit: 'mcg', how: (g) => ['في أي وقت، والأحسن الصبح.', 'Any time, ideally in the morning.'] },
  { id: 'v_folic', kind: 'vit', n: ['حمض الفوليك', 'Folic acid'], words: ['فوليك', 'حمض الفوليك', 'folic', 'folate'], rule: 'any', time: '10:00', form: 'pill', unit: 'mg' },
  { id: 'v_omega', kind: 'vit', n: ['أوميجا ٣', 'Omega-3'], words: ['اوميجا', 'اوميغا', 'زيت سمك', 'زيت السمك', 'omega', 'fish oil'], rule: 'withFood', time: '14:00', form: 'cap', unit: 'mg',
    how: (g) => ['مع الأكل.', 'With food.'] },
  { id: 'v_mag', kind: 'vit', n: ['ماغنسيوم', 'Magnesium'], words: ['ماغنسيوم', 'مغنيسيوم', 'ماغنيسيوم', 'magnesium'], rule: 'any', time: '21:00', form: 'pill', unit: 'mg',
    how: (g) => ['بالليل، وبعيد عن دوا الغدة بـ٤ ساعات.', 'In the evening, 4 hours away from thyroid medicine.'], apart: [{ id: 'thyroxine', h: 4 }] },
  { id: 'v_zinc', kind: 'vit', n: ['زنك', 'Zinc'], words: ['زنك', 'zinc'], rule: 'withFood', time: '14:00', form: 'pill', unit: 'mg', how: (g) => ['مع الأكل عشان المعدة.', 'With food, to protect your stomach.'] },
  { id: 'v_multi', kind: 'vit', n: ['فيتامينات متعددة', 'Multivitamin'], words: ['ملتي', 'مالتي', 'فيتامينات', 'سنتروم', 'فيجوروفيت', 'اوكتاتون', 'فارماتون', 'سوبرادين', 'multivitamin', 'multi', 'centrum', 'pharmaton', 'supradyn'],
    rule: 'withFood', time: '10:00', form: 'pill', unit: 'mg', how: (g) => ['مع الفطار.', 'With breakfast.'], apart: [{ id: 'thyroxine', h: 4 }] },
  { id: 'v_biotin', kind: 'vit', n: ['بيوتين', 'Biotin'], words: ['بيوتين', 'biotin'], rule: 'any', time: '10:00', form: 'pill', unit: 'mcg',
    how: (g) => [`${g('وقفه', 'وقفيه')} قبل أي تحليل غدة بيومين، لأنه بيغير النتيجة.`, 'Stop it two days before any thyroid test: it skews the result.'] },
  { id: 'v_c', kind: 'vit', n: ['فيتامين سي', 'Vitamin C'], words: ['فيتامين سي', 'فيتامين c', 'سي ريتارد', 'vitamin c', 'vit c'], rule: 'any', time: '10:00', form: 'sachet', unit: 'mg' },
  { id: 'v_collagen', kind: 'vit', n: ['كولاجين', 'Collagen'], words: ['كولاجين', 'collagen'], rule: 'any', time: '10:00', form: 'sachet', unit: 'g' },
  { id: 'v_creatine', kind: 'vit', n: ['كرياتين', 'Creatine'], words: ['كرياتين', 'creatine'], rule: 'any', time: '10:00', form: 'spoon', unit: 'g', water: 2,
    how: (g) => [`نفس الكمية كل يوم، و${g('زود', 'زودي')} المية.`, 'The same amount every day, with extra water.'] },
  { id: 'v_whey', kind: 'vit', n: ['بروتين باودر', 'Protein powder'], words: ['واي بروتين', 'بروتين باودر', 'بروتين', 'whey', 'protein powder'], rule: 'any', time: '17:00', form: 'spoon', unit: 'g',
    how: (g) => [`${g('سجله', 'سجليه')} في الأكل عشان يتحسب من البروتين والسعرات.`, 'Log it in Food so it counts toward your protein and calories.'] },
];

export const KB_BY_ID: Record<string, KBItem> = Object.fromEntries(KB.map((x) => [x.id, x]));

/* ---------- Matching typed text ---------- */

const DIG: Record<string, string> = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9' };
/** Lower-case, no diacritics, one way of writing alef/ta marbuta/ya, Western digits. */
export const kbNorm = (s: string) => s
  .replace(/[ً-ْٰـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
  .replace(/[٠-٩]/g, (d) => DIG[d]).toLowerCase().replace(/\s+/g, ' ').trim();

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Every way of writing every item, longest first, each as a pattern that matches at the start of a word
// (after "و", "ب", "ال"...). Latin words also have to end at a word edge ("ms" isn't "msg").
const PATTERNS = KB.flatMap((item) => item.words.map((w) => {
  const n = kbNorm(w);
  const latin = /^[a-z0-9 -]+$/.test(n);
  const body = esc(n).replace(/(^|\s)ال(?=\S)/g, '$1(?:ال)?');
  return { item, len: n.length, re: new RegExp(latin ? `(?:^|[^a-z0-9])${body}(?![a-z0-9])` : `(?:^|[^\\p{L}])(?:و|ف|ب|ل)?(?:ال)?${body}`, 'u') };
})).sort((a, b) => b.len - a.len);

/** Typed text split into separate items ("ضغط، سكر وربو" → three). */
export function splitItems(s: string | undefined): string[] {
  return (s ?? '').split(/[،,؛;\n+/]|\s+و\s+|\s+and\s+|\s+&\s+/i).map((x) => x.trim()).filter((x) => /\p{L}/u.test(x));
}

/** The KB items in one piece of typed text (longest names first, without overlaps). */
export function matchItems(text: string, kinds?: KBItem['kind'][]): KBItem[] {
  let t = ` ${kbNorm(text)} `;
  const out: KBItem[] = [];
  for (const p of PATTERNS) {
    if (kinds && !kinds.includes(p.item.kind)) continue;
    const m = p.re.exec(t);
    if (!m) continue;
    if (!out.includes(p.item)) out.push(p.item);
    // Blank out the match so a shorter name inside it (ضغط inside ضغط واطي) doesn't match too.
    t = t.slice(0, m.index) + ' '.repeat(m[0].length) + t.slice(m.index + m[0].length);
  }
  return out;
}

/** "حساسية من الجمبري" → "جمبري": the food in a typed allergy, when there is one. */
export function allergyFood(text: string): string | null {
  const t = kbNorm(text);
  const m = t.match(/حساسيه\s+(?:من\s+|ل|لل)?(.+)/) ?? t.match(/(?:allergy|allergic)\s+(?:to\s+)?(.+)/) ?? t.match(/(.+?)\s+allergy/);
  if (!m) return null;
  const food = m[1].replace(/^ال/, '').trim();
  return food.length >= 2 ? food : null;
}

/** Medicine suggestions while typing a name (on the med form). */
export function suggestMeds(q: string, max = 5): KBItem[] {
  const t = kbNorm(q);
  if (t.length < 2) return [];
  const hits = KB.filter((x) => x.kind !== 'cond' && x.words.some((w) => kbNorm(w).startsWith(t) || kbNorm(w).includes(' ' + t)));
  return hits.slice(0, max);
}

/* ---------- Everything that applies to a person ---------- */

export type Effective = {
  /** Pick-list ids (picked or typed) and KB ids. */
  ids: Set<string>;
  /** Typed items the app knows, with the text they were typed as. */
  known: { item: KBItem; text: string }[];
  /** Typed items it doesn't know, with the person's answers when given. */
  unknown: { text: string; key: string; kind: 'cond' | 'med'; ans?: Answers }[];
  pains: Joint[];
  food: Set<FoodFlag>; train: Set<TrainFlag>; watch: Set<Watch>;
  avoid: Avoid[];
  /** Autoimmune items typed (for the inflammation food notes). */
  auto: string[];
};

/** Key for a typed item's answers in Profile.extra. */
export const itemKey = (s: string) => kbNorm(s);

const cache = new WeakMap<object, Effective>();
/** Everything that applies to this person: picked conditions and medicines, and what they typed. */
export function effective(p: Profile): Effective {
  const hit = cache.get(p);
  if (hit) return hit;
  const e: Effective = { ids: new Set([...p.conditions, ...p.meds]), known: [], unknown: [], pains: [], food: new Set(), train: new Set(), watch: new Set(), avoid: [], auto: [] };
  const add = (item: KBItem, text: string) => {
    if (e.ids.has(item.id)) return;
    e.ids.add(item.id);
    if (item.same) e.ids.add(item.same);
    e.known.push({ item, text });
    item.food?.forEach((f) => e.food.add(f));
    item.train?.forEach((f) => e.train.add(f));
    item.watch?.forEach((f) => e.watch.add(f));
    if (item.avoid) e.avoid.push(...item.avoid);
    if (item.pain && !e.pains.includes(item.pain)) e.pains.push(item.pain);
    if (item.auto) e.auto.push(text);
    if (item.implies && KB_BY_ID[item.implies]) add(KB_BY_ID[item.implies], text);
  };
  const typed = (text: string, kind: 'cond' | 'med', kb?: string) => {
    const items = kb && KB_BY_ID[kb] ? [KB_BY_ID[kb]] : matchItems(text);
    if (items.length) { items.forEach((it) => add(it, text)); return; }
    const key = itemKey(text);
    const ans = p.extra?.[key];
    e.unknown.push({ text, key, kind, ans });
    ans?.food?.forEach((f) => e.food.add(f));
    ans?.train?.forEach((f) => e.train.add(f));
    ans?.watch?.forEach((f) => e.watch.add(f));
    const food = allergyFood(text);
    if (food) e.avoid.push({ re: new RegExp(esc(food)), level: 'bad', text: () => [`مكتوب في ملفك: ${text}.`, `Your profile says: ${text}.`] });
  };
  splitItems(p.otherCond).forEach((t) => typed(t, 'cond'));
  splitItems(p.otherMeds).forEach((t) => typed(t, 'med'));
  for (const [id, m] of Object.entries(p.medPlan ?? {})) if (id.startsWith('x:')) typed(m?.name ?? id.slice(2), 'med', m?.kb);
  cache.set(p, e);
  return e;
}

/** Food tags each flag cuts down on, plus a name pattern for the ones without a tag. */
export const FLAG_TAGS: Record<FoodFlag, { tags: FoodTag[]; re?: RegExp; ar: string; en: string; has: string }> = {
  salt: { tags: ['salty', 'processed', 'canned'], ar: 'الملح', en: 'salt', has: 'ملح كتير' },
  sugar: { tags: ['soda', 'sugary'], ar: 'السكر', en: 'sugar', has: 'سكر كتير' },
  fat: { tags: ['fried'], ar: 'الدهون والمقلي', en: 'fat and fried food', has: 'دهون كتير' },
  gluten: { tags: ['gluten'], ar: 'القمح (الجلوتين)', en: 'wheat (gluten)', has: 'قمح (جلوتين)' },
  dairy: { tags: ['dairy'], ar: 'الألبان', en: 'dairy', has: 'ألبان' },
  caffeine: { tags: ['caffeine'], ar: 'الكافيين', en: 'caffeine', has: 'كافيين' },
  spicy: { tags: [], re: SPICY, ar: 'الأكل الحراق', en: 'spicy food', has: 'شطة' },
  redmeat: { tags: ['redmeat'], ar: 'اللحمة الحمرا', en: 'red meat', has: 'لحمة حمرا' },
  fiber: { tags: ['fiber'], ar: 'الألياف الخشنة', en: 'coarse fibre', has: 'ألياف كتير' },
};

export const TRAIN_LABEL: Record<TrainFlag, [string, string]> = {
  noJump: ['القفز والجري', 'Jumping and running'],
  noHeavy: ['الأوزان التقيلة', 'Heavy weights'],
  short: ['التمرين الطويل', 'Long workouts'],
  easy: ['المجهود العالي', 'Hard effort'],
  noHeat: ['الحر والمكان المكتوم', 'Heat and stuffy rooms'],
  machines: ['الأوزان الحرة', 'Free weights'],
};

export const WATCH_LABEL: Record<Watch, [string, string]> = {
  dizzy: ['دوخة أو زغللة', 'Dizziness or blurred vision'],
  breath: ['نهجان زيادة أو صفير في الصدر', 'Unusual breathlessness or wheezing'],
  chest: ['ألم أو ضغط في الصدر', 'Chest pain or pressure'],
  palp: ['ضربات قلب سريعة أو مش منتظمة', 'A racing or irregular heartbeat'],
  headache: ['صداع جامد مفاجئ', 'A sudden bad headache'],
  sugarLow: ['رعشة أو عرق أو جوع مفاجئ (هبوط سكر)', 'Shaking, sweating or sudden hunger (low sugar)'],
  joint: ['ألم حاد أو ورم في مفصل', 'Sharp pain or swelling in a joint'],
  numb: ['تنميل أو ضعف في إيد أو رجل', 'Numbness or weakness in an arm or leg'],
  bleed: ['نزيف أو كدمات من غير سبب', 'Bleeding or bruises for no reason'],
  fever: ['سخونية أو التهاب في الزور', 'Fever or a sore throat'],
  cramps: ['شد عضلي جامد أو ألم في العضل', 'Bad cramps or muscle pain'],
  nausea: ['غثيان أو ترجيع', 'Nausea or vomiting'],
  belly: ['ألم في البطن', 'Belly pain'],
};

/** Signs to stop for that come with the pick-list conditions and medicines. */
export const LIST_WATCH: Record<string, Watch[]> = {
  t1d: ['sugarLow'], insulin: ['sugarLow'], graves: ['palp', 'chest'], beta: ['dizzy'], anticoag: ['bleed'], bio: ['fever'],
  ms: ['numb', 'dizzy'], ra: ['joint'], psoriasis: ['joint'], lupus: ['joint'], mtx: ['fever'],
};
