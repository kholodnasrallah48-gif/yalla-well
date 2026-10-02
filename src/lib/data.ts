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
};

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
  gentle: { n: 'يوم هادي للتعافي', pl: 'home', ex: ['h_mobility', 'h_walk', 'h_bridge', 'h_deadbug', 'h_breath'] },
};

export type ScheduleId = '3' | '5mix' | '5gym';
/** map: Saturday-first day index → session id. */
export const SCHEDULES: Record<ScheduleId, { n: string; d: string; map: Record<number, string> }> = {
  '3': { n: '٣ أيام جيم', d: 'Push / Pull / Legs: السبت، الاتنين، الأربع', map: { 0: 'push', 2: 'pull', 4: 'legs' } },
  '5mix': {
    n: '٥ أيام: ٣ جيم + ٢ بيت',
    d: 'جيم Push / Pull / Legs: السبت، الاتنين، الخميس. بيت: الأحد، الأربع',
    map: { 0: 'push', 1: 'homeA', 2: 'pull', 4: 'homeB', 5: 'legs' },
  },
  '5gym': { n: '٥ أيام جيم', d: 'دفع، سحب، رجل، علوي، سفلي', map: { 0: 'push', 1: 'pull', 2: 'legs', 4: 'upper', 5: 'lower' } },
};
