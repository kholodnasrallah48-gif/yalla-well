// Reference data: conditions, medications, exercises, weekly schedules and Egyptian foods.

export type Option = { id: string; n: string };

export const CONDITIONS: Option[] = [
  { id: 'hashimoto', n: 'هاشيموتو (قصور الغدة المناعي)' },
  { id: 'graves', n: 'جريفز (فرط نشاط الغدة)' },
  { id: 'ra', n: 'روماتويد مفصلي' },
  { id: 'psoriasis', n: 'صدفية أو التهاب مفاصل صدفي' },
  { id: 'lupus', n: 'الذئبة الحمراء (لوبس)' },
  { id: 't1d', n: 'سكر النوع الأول' },
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
  h_mobility: { n: 'إطالات ومرونة للجسم كله', k: 'mob', stress: [] },
  h_breath: { n: 'تنفس واسترخاء', k: 'mob', stress: [] },
};

export type Place = 'gym' | 'home';
export type Session = { n: string; pl: Place; ex: string[] };

export const SESSIONS: Record<string, Session> = {
  fbA: { n: 'جسم كامل (أ)', pl: 'gym', ex: ['g_squat', 'g_bench', 'g_latpull', 'g_rdl', 'g_lateral', 'g_plank'] },
  fbB: { n: 'جسم كامل (ب)', pl: 'gym', ex: ['g_legpress', 'g_chestm', 'g_dbrow', 'g_legcurl', 'g_facepull', 'g_deadbug'] },
  fbC: { n: 'جسم كامل (ج)', pl: 'gym', ex: ['g_lunge', 'g_ohp', 'g_cablerow', 'g_hipthrust', 'g_curl', 'g_pushdown', 'g_plank'] },
  upper: { n: 'الجزء العلوي', pl: 'gym', ex: ['g_bench', 'g_latpull', 'g_ohp', 'g_cablerow', 'g_curl', 'g_pushdown'] },
  lower: { n: 'الجزء السفلي', pl: 'gym', ex: ['g_squat', 'g_rdl', 'g_legext', 'g_legcurl', 'g_hipthrust', 'g_calf', 'g_deadbug'] },
  full: { n: 'جسم كامل', pl: 'gym', ex: ['g_legpress', 'g_chestm', 'g_dbrow', 'g_hipthrust', 'g_lateral', 'g_plank'] },
  push: { n: 'دفع: صدر وكتف وترايسبس', pl: 'gym', ex: ['g_bench', 'g_chestm', 'g_ohp', 'g_lateral', 'g_pushdown'] },
  pull: { n: 'سحب: ضهر وباي', pl: 'gym', ex: ['g_latpull', 'g_cablerow', 'g_dbrow', 'g_facepull', 'g_curl'] },
  legs: { n: 'رجل', pl: 'gym', ex: ['g_squat', 'g_rdl', 'g_legpress', 'g_legcurl', 'g_calf', 'g_plank'] },
  homeA: { n: 'تمرين بيت: قوة', pl: 'home', ex: ['h_squat', 'h_pushup', 'h_row', 'h_bridge', 'h_bottlepress', 'h_birddog'] },
  homeB: { n: 'تمرين بيت: كارديو وبطن', pl: 'home', ex: ['h_jacks', 'h_lunge', 'h_mountain', 'h_chair', 'h_deadbug', 'h_calf'] },
  gentle: { n: 'يوم هادي للتعافي', pl: 'home', ex: ['h_mobility', 'h_walk', 'h_bridge', 'h_deadbug', 'h_breath'] },
};

export type ScheduleId = '3' | '5mix' | '5gym';
/** map: Saturday-first day index → session id. */
export const SCHEDULES: Record<ScheduleId, { n: string; d: string; map: Record<number, string> }> = {
  '3': { n: '٣ أيام جيم', d: 'السبت، الاتنين، الأربع', map: { 0: 'fbA', 2: 'fbB', 4: 'fbC' } },
  '5mix': {
    n: '٥ أيام: ٣ جيم + ٢ بيت',
    d: 'جيم: السبت، الاتنين، الخميس. بيت: الأحد، الأربع',
    map: { 0: 'upper', 1: 'homeA', 2: 'lower', 4: 'homeB', 5: 'full' },
  },
  '5gym': { n: '٥ أيام جيم', d: 'دفع، سحب، رجل، علوي، سفلي', map: { 0: 'push', 1: 'pull', 2: 'legs', 4: 'upper', 5: 'lower' } },
};

export type Food = { id: string; cat: string; n: string; u: string; kcal: number; p: number; c: number; f: number; gluten?: boolean };

// [category, name, portion, kcal, protein g, carbs g, fat g, contains gluten]
const RAW: [string, string, string, number, number, number, number, 1?][] = [
  ['فطار', 'فول مدمس', 'طبق ٢٠٠ جم بزيت قليل', 250, 13, 30, 8],
  ['فطار', 'طعمية', 'قرص واحد', 60, 2, 5, 3.5],
  ['فطار', 'بيضة مسلوقة', 'بيضة', 78, 6, 0.6, 5],
  ['فطار', 'بيضة أومليت', 'بيضة بزيت قليل', 95, 6, 0.6, 7],
  ['فطار', 'جبنة قريش', '١٠٠ جم', 98, 11, 3.4, 4.3],
  ['فطار', 'جبنة رومي', 'شريحة ٢٠ جم', 80, 6, 0, 6],
  ['فطار', 'جبنة بيضا فيتا', '٣٠ جم', 80, 4.3, 1.2, 6.4],
  ['فطار', 'شوفان', 'نص كوب ناشف ٤٠ جم', 150, 5, 27, 2.7],
  ['فطار', 'زبادي', 'علبة ١٠٥ جم', 65, 4, 5, 3.3],
  ['فطار', 'زبادي يوناني', 'علبة ١٥٠ جم', 100, 15, 6, 1],
  ['فطار', 'لبن كامل الدسم', 'كوب ٢٤٠ مل', 150, 8, 12, 8],
  ['فطار', 'لبن خالي الدسم', 'كوب ٢٤٠ مل', 85, 8, 12, 0.2],
  ['عيش ونشويات', 'عيش بلدي', 'رغيف', 230, 8, 48, 1, 1],
  ['عيش ونشويات', 'عيش فينو', 'رغيف صغير', 150, 5, 30, 1, 1],
  ['عيش ونشويات', 'توست أسمر', 'شريحة', 70, 3.5, 12, 1, 1],
  ['عيش ونشويات', 'رز أبيض مطبوخ', 'كوب', 205, 4, 45, 0.4],
  ['عيش ونشويات', 'مكرونة مطبوخة', 'كوب', 220, 8, 43, 1.3, 1],
  ['عيش ونشويات', 'بطاطس مسلوقة', 'حباية متوسطة', 160, 4, 37, 0.2],
  ['عيش ونشويات', 'بطاطا مشوية', 'حباية متوسطة', 180, 4, 41, 0.3],
  ['عيش ونشويات', 'بطاطس محمرة', 'طبق صغير ١٠٠ جم', 312, 3.4, 41, 15],
  ['بروتين', 'صدر فراخ مشوي', '١٠٠ جم', 165, 31, 0, 3.6],
  ['بروتين', 'فراخ بانيه', 'قطعة ١٠٠ جم', 260, 20, 12, 15, 1],
  ['بروتين', 'كفتة مشوية', '١٠٠ جم', 250, 20, 2, 18],
  ['بروتين', 'لحمة حمرا مسلوقة', '١٠٠ جم', 220, 28, 0, 12],
  ['بروتين', 'سمك بلطي مشوي', '١٠٠ جم', 130, 26, 0, 2.7],
  ['بروتين', 'سمك مقلي', '١٠٠ جم', 230, 20, 8, 13, 1],
  ['بروتين', 'تونة مصفاة', 'علبة صغيرة ١٢٠ جم', 130, 29, 0, 1],
  ['بروتين', 'عدس (شوربة)', 'طبق', 230, 13, 35, 4],
  ['بروتين', 'حمص الشام', 'كوب', 210, 11, 35, 3],
  ['بروتين', 'بروتين شيك', 'سكوب واحد', 120, 24, 3, 1.5],
  ['أكل بيتي', 'كشري', 'طبق متوسط', 600, 18, 110, 10, 1],
  ['أكل بيتي', 'محشي', '٥ صوابع', 250, 5, 40, 8],
  ['أكل بيتي', 'ملوخية', 'طبق', 120, 3, 8, 8],
  ['أكل بيتي', 'بامية بالصلصة', 'طبق', 150, 4, 14, 9],
  ['أكل بيتي', 'مسقعة', 'طبق', 300, 5, 20, 22],
  ['أكل بيتي', 'شاورما فراخ', 'ساندوتش', 450, 25, 40, 20, 1],
  ['أكل بيتي', 'فطير مشلتت', 'ربع فطيرة', 400, 7, 40, 24, 1],
  ['أكل بيتي', 'سلطة خضرا', 'طبق', 40, 2, 8, 0.3],
  ['فاكهة وسناكس', 'موزة', 'واحدة متوسطة', 105, 1.3, 27, 0.4],
  ['فاكهة وسناكس', 'تفاحة', 'واحدة متوسطة', 95, 0.5, 25, 0.3],
  ['فاكهة وسناكس', 'برتقانة', 'واحدة', 62, 1.2, 15, 0.2],
  ['فاكهة وسناكس', 'بلح', '٣ حبات', 70, 0.6, 18, 0.1],
  ['فاكهة وسناكس', 'مانجا', 'كوب مكعبات', 100, 1.4, 25, 0.6],
  ['فاكهة وسناكس', 'مكسرات', 'حفنة ٣٠ جم', 175, 6, 6, 15],
  ['فاكهة وسناكس', 'زبدة فول سوداني', 'معلقة كبيرة', 95, 4, 3, 8],
  ['فاكهة وسناكس', 'عسل نحل', 'معلقة كبيرة', 64, 0, 17, 0],
  ['فاكهة وسناكس', 'بسبوسة', 'قطعة', 300, 4, 45, 12, 1],
  ['فاكهة وسناكس', 'كنافة', 'قطعة', 350, 5, 45, 17, 1],
  ['فاكهة وسناكس', 'شوكولاتة', '٢٥ جم', 135, 1.9, 15, 7.5],
  ['مشروبات', 'شاي بسكر', 'كوباية بمعلقتين سكر', 32, 0, 8, 0],
  ['مشروبات', 'قهوة باللبن', 'كوب', 60, 3, 5, 3],
  ['مشروبات', 'عصير قصب', 'كوب', 180, 0, 45, 0],
  ['مشروبات', 'عصير برتقان فريش', 'كوب', 110, 1.7, 26, 0.5],
  ['مشروبات', 'مياه غازية', 'كانز', 140, 0, 39, 0],
];

export const FOODS: Food[] = RAW.map((r, i) => ({
  id: 'f' + i, cat: r[0], n: r[1], u: r[2], kcal: r[3], p: r[4], c: r[5], f: r[6], gluten: r[7] === 1,
}));

export const MY_FOODS_CAT = 'أكلاتي';
export const ALL_CAT = 'الكل';
export const FOOD_CATS = [ALL_CAT, ...Array.from(new Set(FOODS.map((f) => f.cat))), MY_FOODS_CAT];
