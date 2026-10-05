// Reference data: conditions, medications, exercises and weekly schedules. Foods live in foods.ts.

export type Option = { id: string; n: string };

export const CONDITIONS: Option[] = [
  { id: 'hashimoto', n: 'هاشيموتو (قصور الغدة المناعي)' },
  { id: 'graves', n: 'جريفز (فرط نشاط الغدة)' },
  { id: 'ra', n: 'روماتويد مفصلي' },
  { id: 'psoriasis', n: 'صدفية أو التهاب مفاصل صدفي' },
  { id: 'lupus', n: 'الذئبة الحمراء (لوبس)' },
  { id: 't1d', n: 'سكر النوع الأول' },
  { id: 't2d', n: 'سكر النوع التاني' },
  { id: 'ir', n: 'مقاومة الإنسولين' },
  { id: 'pcos', n: 'تكيس المبايض' },
  { id: 'celiac', n: 'حساسية القمح (سيلياك)' },
  { id: 'ms', n: 'التصلب المتعدد (MS)' },
  { id: 'ibd', n: 'كرون أو القولون التقرحي' },
];

export const MEDS: Option[] = [
  { id: 'steroids', n: 'كورتيزون (بريدنيزولون وغيره)' },
  { id: 'thyroxine', n: 'هرمون الغدة (ليفوثيروكسين / يوثيروكس)' },
  { id: 'insulin', n: 'إنسولين' },
  { id: 'mtx', n: 'ميثوتركسات' },
  { id: 'bio', n: 'علاج بيولوجي أو مثبط مناعة' },
  { id: 'hcq', n: 'هيدروكسي كلوروكين (بلاكونيل)' },
  { id: 'beta', n: 'حاصرات بيتا (كونكور، إندرال)' },
  { id: 'anticoag', n: 'مسيّل للدم' },
];

export type Joint = 'knee' | 'back' | 'shoulder' | 'wrist';
export const PAINS: { id: Joint; n: string }[] = [
  { id: 'knee', n: 'الركبة' },
  { id: 'back', n: 'الضهر' },
  { id: 'shoulder', n: 'الكتف' },
  { id: 'wrist', n: 'الرسغ / الإيد' },
];

/** Saturday-first week, as used in Egypt. */
export const WEEK = ['السبت', 'الأحد', 'الاتنين', 'التلات', 'الأربع', 'الخميس', 'الجمعة'];
export const WEEK_SHORT = ['سبت', 'أحد', 'اتنين', 'تلات', 'أربع', 'خميس', 'جمعة'];

export type ExerciseKind = 'str' | 'core' | 'cardio' | 'mob';
export type Exercise = {
  n: string;
  k: ExerciseKind;
  /** Joints this exercise loads. */
  stress: Joint[];
  /** Jumping or pounding. */
  impact?: 'high';
  /** Free weight (dumbbell/barbell) rather than a machine. */
  free?: boolean;
  /** Gentler swap when this one doesn't fit the person. */
  alt?: string;
  /** What it's done with; the gym name of the machine or equipment is in GEAR. */
  eq?: Equip;
};

export type Equip = 'machine' | 'cable' | 'smith' | 'dumbbell' | 'barbell' | 'body' | 'band' | 'none';
/** Machines and cables vs free weights, for the picker on each exercise. */
export const isFreeWeight = (e: Equip | undefined) => e === 'dumbbell' || e === 'barbell';

export const EXERCISES: Record<string, Exercise> = {
  g_squat: { n: 'سكوات بالبار', k: 'str', stress: ['knee', 'back'], free: true, alt: 'g_legpress' },
  g_legpress: { n: 'ضغط الرجل (ليج برس)', k: 'str', stress: ['knee'], alt: 'g_hipthrust' },
  g_hipthrust: { n: 'هيب ثرست على الماكينة', k: 'str', stress: [] },
  g_rdl: { n: 'رومانيان ديدليفت بالدمبل', k: 'str', stress: ['back'], free: true, alt: 'g_legcurl' },
  g_legcurl: { n: 'ليج كيرل (خلفي)', k: 'str', stress: [] },
  g_legext: { n: 'ليج إكستنشن (أمامي)', k: 'str', stress: ['knee'], alt: 'g_abduct' },
  g_abduct: { n: 'أبدكشن على الماكينة', k: 'str', stress: [] },
  g_lunge: { n: 'لانجز بالدمبل', k: 'str', stress: ['knee'], free: true, alt: 'g_legpress' },
  g_calf: { n: 'سمانة على الماكينة', k: 'str', stress: [] },
  g_bench: { n: 'تشست برس بالدمبل', k: 'str', stress: ['shoulder', 'wrist'], free: true, alt: 'g_chestm' },
  g_chestm: { n: 'تشست برس على الماكينة', k: 'str', stress: ['shoulder'], alt: 'g_pecdeck' },
  g_pecdeck: { n: 'بيك ديك (فراشة)', k: 'str', stress: [] },
  g_latpull: { n: 'لات بول داون', k: 'str', stress: ['shoulder'], alt: 'g_cablerow' },
  g_cablerow: { n: 'سحب كيبل وانت قاعد', k: 'str', stress: [] },
  g_dbrow: { n: 'دمبل رو بإيد واحدة', k: 'str', stress: ['back'], free: true, alt: 'g_cablerow' },
  g_ohp: { n: 'شولدر برس بالدمبل', k: 'str', stress: ['shoulder', 'wrist'], free: true, alt: 'g_lateral' },
  g_lateral: { n: 'رفرفة جانبي خفيف', k: 'str', stress: ['shoulder'], alt: 'g_facepull' },
  g_facepull: { n: 'فيس بول بالكيبل', k: 'str', stress: [] },
  g_curl: { n: 'بايسبس كيرل', k: 'str', stress: ['wrist'], alt: 'g_cablecurl' },
  g_cablecurl: { n: 'بايسبس على الكيبل بالحبل', k: 'str', stress: [] },
  g_pushdown: { n: 'ترايسبس بوش داون', k: 'str', stress: [] },
  g_inclinedb: { n: 'إنكلاين برس بالدمبل', k: 'str', stress: ['shoulder', 'wrist'], free: true, alt: 'g_inclinem' },
  g_inclinem: { n: 'إنكلاين برس على الماكينة', k: 'str', stress: ['shoulder'], alt: 'g_pecdeck' },
  g_shoulderm: { n: 'شولدر برس على الماكينة', k: 'str', stress: ['shoulder'], alt: 'g_cablelateral' },
  g_cablelateral: { n: 'رفرفة جانبي بالكيبل', k: 'str', stress: ['shoulder'], alt: 'g_facepull' },
  g_ohtricep: { n: 'ترايسبس فوق الراس بالكيبل', k: 'str', stress: ['shoulder'], alt: 'g_pushdown' },
  g_assistpull: { n: 'عقلة بالماكينة المساعدة', k: 'str', stress: ['shoulder'], alt: 'g_latpull' },
  g_machinerow: { n: 'سحب على الماكينة بسند للصدر', k: 'str', stress: [] },
  g_straightarm: { n: 'سحب بدراع مفرود بالكيبل', k: 'str', stress: ['shoulder'], alt: 'g_machinerow' },
  g_reardelt: { n: 'كتف خلفي على البيك ديك', k: 'str', stress: [] },
  g_hammer: { n: 'هامر كيرل بالدمبل', k: 'str', stress: ['wrist'], free: true, alt: 'g_cablecurl' },
  g_hacksquat: { n: 'هاك سكوات على الماكينة', k: 'str', stress: ['knee'], alt: 'g_hipthrust' },
  g_splitsquat: { n: 'سبليت سكوات بالدمبل', k: 'str', stress: ['knee'], free: true, alt: 'g_hipthrust' },
  g_seatedcalf: { n: 'سمانة وانت قاعد', k: 'str', stress: [] },
  g_glutekick: { n: 'جلوت كيك باك بالكيبل', k: 'str', stress: [] },
  g_plank: { n: 'بلانك', k: 'core', stress: ['wrist', 'back'], alt: 'g_deadbug' },
  g_deadbug: { n: 'ديد باج', k: 'core', stress: [] },
  g_hiit: { n: 'HIIT على المشاية (جري متقطع)', k: 'cardio', impact: 'high', stress: ['knee'], alt: 'g_bike' },
  g_bike: { n: 'عجلة ثابتة', k: 'cardio', stress: [] },
  g_incline: { n: 'مشي على المشاية بميل', k: 'cardio', stress: [] },
  // Extra versions of the same movement, so each exercise can be done with free weights or on a machine.
  g_benchbb: { n: 'بنش برس بالبار', k: 'str', stress: ['shoulder', 'wrist'], free: true, alt: 'g_chestm' },
  g_smithbench: { n: 'بنش برس على السميث', k: 'str', stress: ['shoulder'], alt: 'g_chestm' },
  g_inclinebb: { n: 'إنكلاين برس بالبار', k: 'str', stress: ['shoulder', 'wrist'], free: true, alt: 'g_inclinem' },
  g_cablefly: { n: 'فراشة بالكيبل (كروس أوفر)', k: 'str', stress: ['shoulder'], alt: 'g_pecdeck' },
  g_dbfly: { n: 'فراشة بالدمبل على البنش', k: 'str', stress: ['shoulder'], free: true, alt: 'g_pecdeck' },
  g_ohpbb: { n: 'شولدر برس بالبار وانت واقف', k: 'str', stress: ['shoulder', 'wrist', 'back'], free: true, alt: 'g_shoulderm' },
  g_skull: { n: 'ترايسبس بالبار المتعرج (سكال كراشر)', k: 'str', stress: ['wrist'], free: true, alt: 'g_pushdown' },
  g_dipm: { n: 'ترايسبس على ماكينة الديبس', k: 'str', stress: ['shoulder'], alt: 'g_pushdown' },
  g_kickback: { n: 'ترايسبس كيك باك بالدمبل', k: 'str', stress: [], free: true },
  g_pullup: { n: 'عقلة بوزن الجسم', k: 'str', stress: ['shoulder'], alt: 'g_assistpull' },
  g_bbrow: { n: 'سحب بالبار وانت مايل', k: 'str', stress: ['back'], free: true, alt: 'g_machinerow' },
  g_highrow: { n: 'سحب عالي على الماكينة', k: 'str', stress: [] },
  g_ezcurl: { n: 'بايسبس بالبار المتعرج', k: 'str', stress: ['wrist'], free: true, alt: 'g_cablecurl' },
  g_preacher: { n: 'بايسبس على ماكينة البريتشر', k: 'str', stress: [] },
  g_gobletsquat: { n: 'سكوات بالدمبل قدام الصدر (جوبلت)', k: 'str', stress: ['knee'], free: true, alt: 'g_legpress' },
  g_smithsquat: { n: 'سكوات على السميث', k: 'str', stress: ['knee'], alt: 'g_legpress' },
  g_rdlbb: { n: 'رومانيان ديدليفت بالبار', k: 'str', stress: ['back'], free: true, alt: 'g_legcurl' },
  g_seatedcurl: { n: 'ليج كيرل وانت قاعد', k: 'str', stress: [] },
  g_bbthrust: { n: 'هيب ثرست بالبار على البنش', k: 'str', stress: [], free: true, alt: 'g_hipthrust' },
  g_dbcalf: { n: 'سمانة بالدمبل على سلمة', k: 'str', stress: [], free: true },
  g_smithcalf: { n: 'سمانة على السميث', k: 'str', stress: [] },
  g_dbreardelt: { n: 'كتف خلفي بالدمبل وانت مايل', k: 'str', stress: ['back'], free: true, alt: 'g_reardelt' },
  g_cablereardelt: { n: 'كتف خلفي بالكيبل', k: 'str', stress: [] },
  g_bblunge: { n: 'لانجز بالبار', k: 'str', stress: ['knee', 'back'], free: true, alt: 'g_legpress' },
  g_adduct: { n: 'أدكشن على الماكينة (داخلي)', k: 'str', stress: [] },
  h_squat: { n: 'سكوات بوزن الجسم', k: 'str', stress: ['knee'], alt: 'h_bridge' },
  h_chair: { n: 'قعدة وقومة من على الكرسي', k: 'str', stress: [] },
  h_bridge: { n: 'جلوت بريدج', k: 'str', stress: [] },
  h_lunge: { n: 'لانجز ورا', k: 'str', stress: ['knee'], alt: 'h_bridge' },
  h_pushup: { n: 'ضغط على الكنبة أو الحيطة', k: 'str', stress: ['wrist', 'shoulder'], alt: 'h_bandpress' },
  h_bandpress: { n: 'دفع بالأستك قدامك', k: 'str', stress: [] },
  h_row: { n: 'سحب بزجاجات مياه أو أستك', k: 'str', stress: ['back'], alt: 'h_bandrow' },
  h_bandrow: { n: 'سحب بالأستك وانت قاعد', k: 'str', stress: [] },
  h_bottlepress: { n: 'ضغط كتف بزجاجات مياه', k: 'str', stress: ['shoulder'], alt: 'h_bandrow' },
  h_birddog: { n: 'بيرد دوج', k: 'core', stress: ['wrist'], alt: 'h_deadbug' },
  h_deadbug: { n: 'ديد باج', k: 'core', stress: [] },
  h_calf: { n: 'سمانة على السلمة', k: 'str', stress: [] },
  h_jacks: { n: 'جامبينج جاك', k: 'cardio', impact: 'high', stress: ['knee'], alt: 'h_march' },
  h_mountain: { n: 'ماونتن كلايمبر', k: 'cardio', impact: 'high', stress: ['wrist', 'knee'], alt: 'h_march' },
  h_march: { n: 'مشي سريع في المكان', k: 'cardio', stress: [] },
  h_walk: { n: 'مشي سريع برا أو على المشاية', k: 'cardio', stress: [] },
  h_sumo: { n: 'سومو سكوات بزجاجة مياه', k: 'str', stress: ['knee'], alt: 'h_bridge' },
  h_glutekick: { n: 'رفع الرجل لورا على الأربع', k: 'str', stress: ['wrist'], alt: 'h_sidelying' },
  h_sidelying: { n: 'رفع الرجل جانبي وانت نايم', k: 'str', stress: [] },
  h_bandcurl: { n: 'بايسبس بالأستك أو زجاجات مياه', k: 'str', stress: [] },
  h_dips: { n: 'ترايسبس على الكرسي', k: 'str', stress: ['shoulder', 'wrist'], alt: 'h_bandpress' },
  h_sideplank: { n: 'بلانك جانبي على الركبة', k: 'core', stress: ['shoulder'], alt: 'h_deadbug' },
  h_stepjack: { n: 'جامبينج جاك من غير نط', k: 'cardio', stress: [] },
  h_mobility: { n: 'إطالات ومرونة للجسم كله', k: 'mob', stress: [] },
  h_breath: { n: 'تنفس واسترخاء', k: 'mob', stress: [] },
};

/** What each gym exercise is done with: equipment type and the name people use for it in the gym. */
export const GEAR: Record<string, { eq: Equip; ar: string; en: string }> = {
  g_squat: { eq: 'barbell', ar: 'بار على حامل السكوات (Squat Rack)', en: 'Barbell on a squat rack' },
  g_legpress: { eq: 'machine', ar: 'ماكينة ليج برس (Leg Press)', en: 'Leg press machine' },
  g_hipthrust: { eq: 'machine', ar: 'ماكينة هيب ثرست (Hip Thrust)', en: 'Hip thrust machine' },
  g_rdl: { eq: 'dumbbell', ar: 'دمبلز', en: 'Dumbbells' },
  g_legcurl: { eq: 'machine', ar: 'ماكينة ليج كيرل نايم (Lying Leg Curl)', en: 'Lying leg curl machine' },
  g_legext: { eq: 'machine', ar: 'ماكينة ليج إكستنشن (Leg Extension)', en: 'Leg extension machine' },
  g_abduct: { eq: 'machine', ar: 'ماكينة أبدكتور (Hip Abductor)', en: 'Hip abductor machine' },
  g_lunge: { eq: 'dumbbell', ar: 'دمبلز', en: 'Dumbbells' },
  g_calf: { eq: 'machine', ar: 'ماكينة سمانة واقف (Standing Calf Raise)', en: 'Standing calf raise machine' },
  g_bench: { eq: 'dumbbell', ar: 'دمبلز + بنش مسطح', en: 'Dumbbells and a flat bench' },
  g_chestm: { eq: 'machine', ar: 'ماكينة تشست برس (Chest Press)', en: 'Chest press machine' },
  g_pecdeck: { eq: 'machine', ar: 'ماكينة بيك ديك / فلاي (Pec Deck)', en: 'Pec deck machine' },
  g_latpull: { eq: 'machine', ar: 'ماكينة لات بول داون (Lat Pulldown)', en: 'Lat pulldown machine' },
  g_cablerow: { eq: 'cable', ar: 'كيبل سحب أرضي (Seated Cable Row)', en: 'Seated cable row' },
  g_dbrow: { eq: 'dumbbell', ar: 'دمبل + بنش', en: 'Dumbbell and a bench' },
  g_ohp: { eq: 'dumbbell', ar: 'دمبلز + بنش بضهر', en: 'Dumbbells and an upright bench' },
  g_lateral: { eq: 'dumbbell', ar: 'دمبلز خفيفة', en: 'Light dumbbells' },
  g_facepull: { eq: 'cable', ar: 'كيبل عالي بالحبل (Rope)', en: 'High cable with a rope' },
  g_curl: { eq: 'dumbbell', ar: 'دمبلز', en: 'Dumbbells' },
  g_cablecurl: { eq: 'cable', ar: 'كيبل تحت بالحبل (Rope)', en: 'Low cable with a rope' },
  g_pushdown: { eq: 'cable', ar: 'كيبل عالي بالحبل أو البار', en: 'High cable with a rope or bar' },
  g_inclinedb: { eq: 'dumbbell', ar: 'دمبلز + بنش مايل', en: 'Dumbbells and an incline bench' },
  g_inclinem: { eq: 'machine', ar: 'ماكينة إنكلاين تشست برس (Incline Press)', en: 'Incline chest press machine' },
  g_shoulderm: { eq: 'machine', ar: 'ماكينة شولدر برس (Shoulder Press)', en: 'Shoulder press machine' },
  g_cablelateral: { eq: 'cable', ar: 'كيبل تحت بمقبض واحد', en: 'Low cable with a single handle' },
  g_ohtricep: { eq: 'cable', ar: 'كيبل بالحبل', en: 'Cable with a rope' },
  g_assistpull: { eq: 'machine', ar: 'ماكينة العقلة المساعدة (Assisted Pull-up)', en: 'Assisted pull-up machine' },
  g_machinerow: { eq: 'machine', ar: 'ماكينة رو بسند صدر (Chest-Supported Row)', en: 'Chest-supported row machine' },
  g_straightarm: { eq: 'cable', ar: 'كيبل عالي بالبار أو الحبل', en: 'High cable with a bar or rope' },
  g_reardelt: { eq: 'machine', ar: 'ماكينة بيك ديك بالعكس (Reverse Fly)', en: 'Pec deck, reverse fly' },
  g_hammer: { eq: 'dumbbell', ar: 'دمبلز', en: 'Dumbbells' },
  g_hacksquat: { eq: 'machine', ar: 'ماكينة هاك سكوات (Hack Squat)', en: 'Hack squat machine' },
  g_splitsquat: { eq: 'dumbbell', ar: 'دمبلز', en: 'Dumbbells' },
  g_seatedcalf: { eq: 'machine', ar: 'ماكينة سمانة قاعد (Seated Calf)', en: 'Seated calf raise machine' },
  g_glutekick: { eq: 'cable', ar: 'كيبل تحت + رباط الكاحل', en: 'Low cable with an ankle strap' },
  g_benchbb: { eq: 'barbell', ar: 'بار + بنش مسطح', en: 'Barbell and a flat bench' },
  g_smithbench: { eq: 'smith', ar: 'ماكينة السميث + بنش مسطح', en: 'Smith machine and a flat bench' },
  g_inclinebb: { eq: 'barbell', ar: 'بار + بنش مايل', en: 'Barbell and an incline bench' },
  g_cablefly: { eq: 'cable', ar: 'الكيبل الكروس أوفر (Cable Crossover)', en: 'Cable crossover station' },
  g_dbfly: { eq: 'dumbbell', ar: 'دمبلز + بنش مسطح', en: 'Dumbbells and a flat bench' },
  g_ohpbb: { eq: 'barbell', ar: 'بار على الحامل', en: 'Barbell on a rack' },
  g_skull: { eq: 'barbell', ar: 'بار متعرج (EZ Bar) + بنش', en: 'EZ bar and a bench' },
  g_dipm: { eq: 'machine', ar: 'ماكينة ديبس (Dip Machine)', en: 'Dip machine' },
  g_kickback: { eq: 'dumbbell', ar: 'دمبل + بنش', en: 'Dumbbell and a bench' },
  g_pullup: { eq: 'body', ar: 'بار العقلة (Pull-up Bar)', en: 'Pull-up bar' },
  g_bbrow: { eq: 'barbell', ar: 'بار', en: 'Barbell' },
  g_highrow: { eq: 'machine', ar: 'ماكينة هاي رو (High Row)', en: 'High row machine' },
  g_ezcurl: { eq: 'barbell', ar: 'بار متعرج (EZ Bar)', en: 'EZ bar' },
  g_preacher: { eq: 'machine', ar: 'ماكينة بريتشر كيرل (Preacher Curl)', en: 'Preacher curl machine' },
  g_gobletsquat: { eq: 'dumbbell', ar: 'دمبل واحد تقيل', en: 'One heavy dumbbell' },
  g_smithsquat: { eq: 'smith', ar: 'ماكينة السميث', en: 'Smith machine' },
  g_rdlbb: { eq: 'barbell', ar: 'بار', en: 'Barbell' },
  g_seatedcurl: { eq: 'machine', ar: 'ماكينة ليج كيرل قاعد (Seated Leg Curl)', en: 'Seated leg curl machine' },
  g_bbthrust: { eq: 'barbell', ar: 'بار + بنش + مخدة للبار', en: 'Barbell, bench and a bar pad' },
  g_dbcalf: { eq: 'dumbbell', ar: 'دمبل + سلمة أو ستيب', en: 'Dumbbell and a step' },
  g_smithcalf: { eq: 'smith', ar: 'ماكينة السميث + ستيب', en: 'Smith machine and a step' },
  g_dbreardelt: { eq: 'dumbbell', ar: 'دمبلز خفيفة', en: 'Light dumbbells' },
  g_cablereardelt: { eq: 'cable', ar: 'الكيبل الكروس أوفر من غير مقابض', en: 'Cable crossover, no handles' },
  g_bblunge: { eq: 'barbell', ar: 'بار على الكتف', en: 'Barbell on your back' },
  g_adduct: { eq: 'machine', ar: 'ماكينة أدكتور (Hip Adductor)', en: 'Hip adductor machine' },
  g_plank: { eq: 'none', ar: 'من غير أدوات', en: 'No equipment' },
  g_deadbug: { eq: 'none', ar: 'مرتبة', en: 'A mat' },
  g_hiit: { eq: 'machine', ar: 'المشاية (Treadmill)', en: 'Treadmill' },
  g_bike: { eq: 'machine', ar: 'العجلة الثابتة (Bike)', en: 'Stationary bike' },
  g_incline: { eq: 'machine', ar: 'المشاية بميل (Treadmill)', en: 'Treadmill on an incline' },
};

/** Versions of the same movement (free weights, machine, cable...). The first is the plan's default. */
export const VARIANT_GROUPS: string[][] = [
  ['g_bench', 'g_chestm', 'g_benchbb', 'g_smithbench'],
  ['g_inclinedb', 'g_inclinem', 'g_inclinebb'],
  ['g_pecdeck', 'g_cablefly', 'g_dbfly'],
  ['g_ohp', 'g_shoulderm', 'g_ohpbb'],
  ['g_lateral', 'g_cablelateral'],
  ['g_pushdown', 'g_ohtricep', 'g_dipm', 'g_skull', 'g_kickback'],
  ['g_latpull', 'g_assistpull', 'g_pullup'],
  ['g_cablerow', 'g_machinerow', 'g_dbrow', 'g_bbrow', 'g_highrow'],
  ['g_curl', 'g_cablecurl', 'g_ezcurl', 'g_preacher'],
  ['g_hammer', 'g_cablecurl'],
  ['g_squat', 'g_legpress', 'g_hacksquat', 'g_smithsquat', 'g_gobletsquat'],
  ['g_rdl', 'g_rdlbb'],
  ['g_legcurl', 'g_seatedcurl'],
  ['g_hipthrust', 'g_bbthrust'],
  ['g_calf', 'g_seatedcalf', 'g_smithcalf', 'g_dbcalf'],
  ['g_lunge', 'g_splitsquat', 'g_bblunge'],
  ['g_facepull', 'g_reardelt', 'g_dbreardelt', 'g_cablereardelt'],
  ['g_abduct', 'g_adduct'],
];
/** The other ways to do this exercise, itself included, in the group's order. */
export function variantsOf(id: string): string[] {
  return VARIANT_GROUPS.find((g) => g.includes(id)) ?? [id];
}

export type Place = 'gym' | 'home';
/** ex is week A; exB, when given, is the alternate week with different machines. */
export type Session = { n: string; pl: Place; ex: string[]; exB?: string[] };

export const SESSIONS: Record<string, Session> = {
  upper: {
    n: 'الجزء العلوي', pl: 'gym',
    ex: ['g_bench', 'g_latpull', 'g_ohp', 'g_cablerow', 'g_curl', 'g_pushdown'],
    exB: ['g_inclinem', 'g_assistpull', 'g_shoulderm', 'g_machinerow', 'g_hammer', 'g_ohtricep'],
  },
  lower: {
    n: 'الجزء السفلي', pl: 'gym',
    ex: ['g_squat', 'g_rdl', 'g_legext', 'g_legcurl', 'g_hipthrust', 'g_calf', 'g_deadbug'],
    exB: ['g_legpress', 'g_hipthrust', 'g_splitsquat', 'g_legcurl', 'g_glutekick', 'g_seatedcalf', 'g_plank'],
  },
  push: {
    n: 'Push: صدر وكتف وترايسبس', pl: 'gym',
    ex: ['g_bench', 'g_chestm', 'g_ohp', 'g_lateral', 'g_pushdown'],
    exB: ['g_inclinedb', 'g_pecdeck', 'g_shoulderm', 'g_cablelateral', 'g_ohtricep'],
  },
  pull: {
    n: 'Pull: ضهر وباي', pl: 'gym',
    ex: ['g_latpull', 'g_cablerow', 'g_dbrow', 'g_facepull', 'g_curl'],
    exB: ['g_assistpull', 'g_machinerow', 'g_straightarm', 'g_reardelt', 'g_hammer'],
  },
  legs: {
    n: 'Legs: رجل', pl: 'gym',
    ex: ['g_squat', 'g_rdl', 'g_legpress', 'g_legcurl', 'g_calf', 'g_plank'],
    exB: ['g_hacksquat', 'g_hipthrust', 'g_splitsquat', 'g_legcurl', 'g_abduct', 'g_seatedcalf', 'g_deadbug'],
  },
  homeA: {
    n: 'تمرين بيت: قوة', pl: 'home',
    ex: ['h_squat', 'h_pushup', 'h_row', 'h_bridge', 'h_bottlepress', 'h_birddog'],
    exB: ['h_sumo', 'h_dips', 'h_bandrow', 'h_glutekick', 'h_bandcurl', 'h_sideplank'],
  },
  homeB: {
    n: 'تمرين بيت: كارديو وبطن', pl: 'home',
    ex: ['h_jacks', 'h_lunge', 'h_mountain', 'h_chair', 'h_deadbug', 'h_calf'],
    exB: ['h_stepjack', 'h_sumo', 'h_march', 'h_sidelying', 'h_sideplank', 'h_calf'],
  },
  fullA: {
    n: 'Full Body: الجسم كله (أ)', pl: 'gym',
    ex: ['g_squat', 'g_bench', 'g_cablerow', 'g_ohp', 'g_legcurl', 'g_plank'],
    exB: ['g_legpress', 'g_inclinedb', 'g_latpull', 'g_lateral', 'g_hipthrust', 'g_deadbug'],
  },
  fullB: {
    n: 'Full Body: الجسم كله (ب)', pl: 'gym',
    ex: ['g_rdl', 'g_chestm', 'g_latpull', 'g_lunge', 'g_facepull', 'g_curl'],
    exB: ['g_hipthrust', 'g_inclinem', 'g_machinerow', 'g_splitsquat', 'g_reardelt', 'g_pushdown'],
  },
  chest: {
    n: 'صدر', pl: 'gym',
    ex: ['g_bench', 'g_inclinedb', 'g_chestm', 'g_pecdeck', 'g_pushdown'],
    exB: ['g_benchbb', 'g_inclinem', 'g_cablefly', 'g_dbfly', 'g_ohtricep'],
  },
  back: {
    n: 'ضهر', pl: 'gym',
    ex: ['g_latpull', 'g_cablerow', 'g_dbrow', 'g_straightarm', 'g_facepull'],
    exB: ['g_assistpull', 'g_machinerow', 'g_highrow', 'g_straightarm', 'g_reardelt'],
  },
  shoulders: {
    n: 'كتف', pl: 'gym',
    ex: ['g_ohp', 'g_lateral', 'g_reardelt', 'g_cablelateral', 'g_facepull'],
    exB: ['g_shoulderm', 'g_cablelateral', 'g_dbreardelt', 'g_lateral', 'g_cablereardelt'],
  },
  arms: {
    n: 'دراع: باي وتراي', pl: 'gym',
    ex: ['g_curl', 'g_pushdown', 'g_hammer', 'g_ohtricep', 'g_cablecurl'],
    exB: ['g_ezcurl', 'g_dipm', 'g_preacher', 'g_skull', 'g_hammer'],
  },
  glutes: {
    n: 'أرداف ورجل خلفي', pl: 'gym',
    ex: ['g_hipthrust', 'g_rdl', 'g_splitsquat', 'g_glutekick', 'g_abduct'],
    exB: ['g_bbthrust', 'g_legcurl', 'g_lunge', 'g_glutekick', 'g_abduct'],
  },
  gentle: { n: 'يوم هادي للتعافي', pl: 'home', ex: ['h_mobility', 'h_walk', 'h_bridge', 'h_deadbug', 'h_breath'] },
};

export type ScheduleId = '3' | 'fb3' | 'ul4' | 'glute4' | '5mix' | '5gym' | 'bro5' | 'ppl6' | 'custom';
/** map: Saturday-first day index → session id. The most common plans that get results, plus "other". */
export const SCHEDULES: Record<ScheduleId, { n: string; d: string; map: Record<number, string> }> = {
  fb3: { n: 'Full Body: ٣ أيام', d: 'الجسم كله كل مرة: السبت، الاتنين، الأربع. أحسن بداية للمبتدئين', map: { 0: 'fullA', 2: 'fullB', 4: 'fullA' } },
  '3': { n: '٣ أيام جيم', d: 'Push / Pull / Legs: السبت، الاتنين، الأربع', map: { 0: 'push', 2: 'pull', 4: 'legs' } },
  ul4: { n: 'Upper / Lower: ٤ أيام', d: 'علوي وسفلي مرتين في الأسبوع: السبت، الأحد، التلات، الأربع', map: { 0: 'upper', 1: 'lower', 3: 'upper', 4: 'lower' } },
  glute4: { n: 'تركيز أرداف ورجل: ٤ أيام', d: 'أرداف مرتين + علوي + سفلي: السبت، الأحد، التلات، الأربع', map: { 0: 'glutes', 1: 'upper', 3: 'glutes', 4: 'lower' } },
  '5mix': {
    n: '٥ أيام: ٣ جيم + ٢ بيت',
    d: 'جيم Push / Pull / Legs: السبت، الاتنين، الخميس. بيت: الأحد، الأربع',
    map: { 0: 'push', 1: 'homeA', 2: 'pull', 4: 'homeB', 5: 'legs' },
  },
  '5gym': { n: '٥ أيام جيم', d: 'دفع، سحب، رجل، علوي، سفلي', map: { 0: 'push', 1: 'pull', 2: 'legs', 4: 'upper', 5: 'lower' } },
  bro5: { n: 'عضلة كل يوم: ٥ أيام', d: 'صدر، ضهر، رجل، كتف، دراع (Bro Split)', map: { 0: 'chest', 1: 'back', 2: 'legs', 3: 'shoulders', 4: 'arms' } },
  ppl6: { n: 'Push / Pull / Legs: ٦ أيام', d: 'كل عضلة مرتين في الأسبوع، للمستوى المتوسط', map: { 0: 'push', 1: 'pull', 2: 'legs', 3: 'push', 4: 'pull', 5: 'legs' } },
  custom: { n: 'نظام تاني', d: 'نبدأ بـ ٣ أيام Full Body، وتقدر تختار نوع تمرين كل يوم من صفحة التمرين', map: { 0: 'fullA', 2: 'fullB', 4: 'fullA' } },
};
/** Gym workouts a person can pick for a day under this plan; "other" can pick any. */
export function gymChoices(id: ScheduleId): string[] {
  if (id === 'custom') return ['fullA', 'fullB', 'push', 'pull', 'legs', 'upper', 'lower', 'chest', 'back', 'shoulders', 'arms', 'glutes'];
  const own = [...new Set(Object.values(SCHEDULES[id].map))].filter((s) => SESSIONS[s].pl === 'gym');
  return own.length >= 2 ? own : ['push', 'pull', 'legs', 'upper', 'lower'];
}
