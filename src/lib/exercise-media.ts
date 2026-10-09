// How-to media for each exercise: free-exercise-db images (public domain), Arabic cues and an English name for video search.
export type ExerciseMedia = {
  /** English exercise name used to search for a form video. */
  en: string;
  /** free-exercise-db image paths (start and end position), or [] when no good match exists. */
  img: string[];
  /** 3-4 short Arabic form cues (Egyptian, gender-neutral noun phrases). */
  cues: string[];
};

export const MEDIA: Record<string, ExerciseMedia> = {
  g_squat: {
    en: 'Barbell back squat',
    img: ['Barbell_Squat/0.jpg', 'Barbell_Squat/1.jpg'],
    cues: ['ضهر مفرود وصدر لفوق', 'الركب في اتجاه صوابع الرجل', 'النزول ببطء لحد ما الفخد يوازي الأرض', 'نفس قبل النزول وزفير مع الطلوع'],
  },
  g_legpress: {
    en: 'Machine leg press',
    img: ['Leg_Press/0.jpg', 'Leg_Press/1.jpg'],
    cues: ['ضهر لازق في المسند طول الوقت', 'الرجلين بعرض الكتف على المنصة', 'من غير قفل الركبة فوق', 'النزول ببطء والدفع من الكعب'],
  },
  g_hipthrust: {
    en: 'Machine hip thrust',
    img: ['Barbell_Hip_Thrust/0.jpg', 'Barbell_Hip_Thrust/1.jpg'],
    cues: ['الدقن لتحت والضلوع مقفولة', 'الدفع من الكعب', 'عصر المؤخرة ثانية فوق', 'من غير تقويس أسفل الضهر'],
  },
  g_rdl: {
    en: 'Dumbbell Romanian deadlift',
    img: ['Stiff-Legged_Dumbbell_Deadlift/0.jpg', 'Stiff-Legged_Dumbbell_Deadlift/1.jpg'],
    cues: ['ضهر مفرود طول الحركة', 'الحوض لورا والركبة مثنية خفيف', 'الدمبل قريب من الرجل', 'الطلوع بعصر المؤخرة'],
  },
  g_legcurl: {
    en: 'Lying leg curl machine',
    img: ['Lying_Leg_Curls/0.jpg', 'Lying_Leg_Curls/1.jpg'],
    cues: ['الحوض لازق في الماكينة', 'الثني لآخر المدى وثبات ثانية', 'الرجوع ببطء من غير خبط', 'من غير مرجحة الجسم'],
  },
  g_legext: {
    en: 'Leg extension machine',
    img: ['Leg_Extensions/0.jpg', 'Leg_Extensions/1.jpg'],
    cues: ['الركبة على محور الماكينة', 'الفرد لفوق وعصر الفخد ثانية', 'النزول ببطء', 'ضهر لازق في المسند'],
  },
  g_abduct: {
    en: 'Hip abduction machine',
    img: ['Thigh_Abductor/0.jpg', 'Thigh_Abductor/1.jpg'],
    cues: ['ضهر مفرود على المسند', 'الفتح بتحكم لآخر المدى', 'الرجوع ببطء من غير خبط الوزن', 'زفير مع الفتح'],
  },
  g_lunge: {
    en: 'Dumbbell lunge',
    img: ['Dumbbell_Lunges/0.jpg', 'Dumbbell_Lunges/1.jpg'],
    cues: ['جذع مفرود والبطن مشدودة', 'خطوة واسعة والركبتين على ٩٠ درجة', 'الركبة الأمامية فوق مشط الرجل', 'الدفع من كعب الرجل القدام'],
  },
  g_calf: {
    en: 'Standing calf raise machine',
    img: ['Standing_Calf_Raises/0.jpg', 'Standing_Calf_Raises/1.jpg'],
    cues: ['الطلوع لأعلى نقطة على المشط', 'ثبات ثانية فوق', 'النزول ببطء لآخر مطة', 'الركبة مفرودة من غير قفل'],
  },
  g_bench: {
    en: 'Dumbbell bench press',
    img: ['Dumbbell_Bench_Press/0.jpg', 'Dumbbell_Bench_Press/1.jpg'],
    cues: ['لوحين الكتف مضمومين لورا', 'الكوع زاوية ٤٥ درجة من الجسم', 'النزول ببطء لحد الصدر', 'زفير مع الدفع لفوق'],
  },
  g_chestm: {
    en: 'Machine chest press',
    img: ['Machine_Bench_Press/0.jpg', 'Machine_Bench_Press/1.jpg'],
    cues: ['المقابض على مستوى نص الصدر', 'ضهر لازق في المسند', 'الدفع من غير قفل الكوع', 'الرجوع ببطء مع شهيق'],
  },
  g_pecdeck: {
    en: 'Pec deck machine fly',
    img: ['Butterfly/0.jpg', 'Butterfly/1.jpg'],
    cues: ['الكوع مثني خفيف وثابت', 'الضم قدام الصدر وعصر ثانية', 'الفتح ببطء لحد مطة مريحة', 'الكتف لتحت بعيد عن الودن'],
  },
  g_latpull: {
    en: 'Lat pulldown',
    img: ['Wide-Grip_Lat_Pulldown/0.jpg', 'Wide-Grip_Lat_Pulldown/1.jpg'],
    cues: ['صدر لفوق وميلة بسيطة لورا', 'السحب لأعلى الصدر بالكوع', 'الكتف لتحت قبل السحب', 'الطلوع ببطء لفرد كامل'],
  },
  g_cablerow: {
    en: 'Seated cable row',
    img: ['Seated_Cable_Rows/0.jpg', 'Seated_Cable_Rows/1.jpg'],
    cues: ['ضهر مفرود من غير مرجحة', 'السحب لحد البطن', 'ضم لوحين الكتف في الآخر', 'الرجوع ببطء مع فرد الدراع'],
  },
  g_dbrow: {
    en: 'One-arm dumbbell row',
    img: ['One-Arm_Dumbbell_Row/0.jpg', 'One-Arm_Dumbbell_Row/1.jpg'],
    cues: ['ضهر مفرود وموازي للأرض', 'السحب بالكوع ناحية الوسط', 'من غير لف الجذع', 'النزول ببطء لفرد كامل'],
  },
  g_ohp: {
    en: 'Seated dumbbell shoulder press',
    img: ['Dumbbell_Shoulder_Press/0.jpg', 'Dumbbell_Shoulder_Press/1.jpg'],
    cues: ['ضهر لازق في المسند', 'البطن مشدودة من غير تقويس', 'الدفع لفوق من غير خبط الدمبل', 'النزول ببطء لمستوى الودن'],
  },
  g_lateral: {
    en: 'Dumbbell lateral raise',
    img: ['Side_Lateral_Raise/0.jpg', 'Side_Lateral_Raise/1.jpg'],
    cues: ['وزن خفيف وحركة متحكمة', 'الرفع لحد مستوى الكتف بس', 'الكوع مثني خفيف', 'النزول ببطء من غير مرجحة'],
  },
  g_facepull: {
    en: 'Cable face pull',
    img: ['Face_Pull/0.jpg', 'Face_Pull/1.jpg'],
    cues: ['الحبل على مستوى الوش', 'السحب ناحية الجبهة والكوع عالي', 'ضم لوحين الكتف ثانية', 'الرجوع ببطء'],
  },
  g_curl: {
    en: 'Dumbbell biceps curl',
    img: ['Dumbbell_Bicep_Curl/0.jpg', 'Dumbbell_Bicep_Curl/1.jpg'],
    cues: ['الكوع ثابت جنب الجسم', 'الرفع من غير مرجحة الضهر', 'عصر البايسبس فوق', 'النزول ببطء لفرد كامل'],
  },
  g_cablecurl: {
    en: 'Cable rope biceps curl',
    img: ['Cable_Hammer_Curls_-_Rope_Attachment/0.jpg', 'Cable_Hammer_Curls_-_Rope_Attachment/1.jpg'],
    cues: ['الكوع لازق في الجنب', 'السحب لفوق وعصر ثانية', 'جسم ثابت من غير ميلان', 'النزول ببطء'],
  },
  g_pushdown: {
    en: 'Cable triceps pushdown',
    img: ['Triceps_Pushdown/0.jpg', 'Triceps_Pushdown/1.jpg'],
    cues: ['الكوع ثابت جنب الجسم', 'الفرد لتحت لآخر المدى', 'عصر الترايسبس ثانية', 'الطلوع ببطء لحد ٩٠ درجة'],
  },
  g_inclinedb: {
    en: 'Incline dumbbell press',
    img: ['Incline_Dumbbell_Press/0.jpg', 'Incline_Dumbbell_Press/1.jpg'],
    cues: ['البنش على ميل ٣٠ درجة تقريبا', 'لوحين الكتف مضمومين', 'النزول ببطء لأعلى الصدر', 'زفير مع الدفع لفوق'],
  },
  g_inclinem: {
    en: 'Incline machine chest press',
    img: ['Leverage_Incline_Chest_Press/0.jpg', 'Leverage_Incline_Chest_Press/1.jpg'],
    cues: ['المقابض على مستوى أعلى الصدر', 'ضهر لازق في المسند', 'الدفع من غير قفل الكوع', 'الرجوع ببطء'],
  },
  g_shoulderm: {
    en: 'Machine shoulder press',
    img: ['Machine_Shoulder_Military_Press/0.jpg', 'Machine_Shoulder_Military_Press/1.jpg'],
    cues: ['المقابض على مستوى الكتف', 'ضهر لازق في المسند', 'الدفع لفوق من غير قفل الكوع', 'النزول ببطء مع شهيق'],
  },
  g_cablelateral: {
    en: 'Cable lateral raise',
    img: ['Standing_Low-Pulley_Deltoid_Raise/0.jpg', 'Standing_Low-Pulley_Deltoid_Raise/1.jpg'],
    cues: ['الكيبل من تحت ومن ورا الجسم', 'الرفع لحد مستوى الكتف', 'الكوع مثني خفيف', 'النزول ببطء من غير مرجحة'],
  },
  g_ohtricep: {
    en: 'Cable overhead triceps extension',
    img: ['Cable_Rope_Overhead_Triceps_Extension/0.jpg', 'Cable_Rope_Overhead_Triceps_Extension/1.jpg'],
    cues: ['الكوع ثابت وقريب من الراس', 'الفرد لقدام وفوق لآخر المدى', 'البطن مشدودة من غير تقويس', 'الرجوع ببطء لمطة كاملة'],
  },
  g_assistpull: {
    en: 'Assisted pull-up machine',
    img: ['Band_Assisted_Pull-Up/0.jpg', 'Band_Assisted_Pull-Up/1.jpg'],
    cues: ['الكتف لتحت قبل السحب', 'السحب لحد الدقن فوق المسكة', 'جسم ثابت من غير مرجحة', 'النزول ببطء لفرد كامل'],
  },
  g_machinerow: {
    en: 'Chest-supported machine row',
    img: ['Leverage_Iso_Row/0.jpg', 'Leverage_Iso_Row/1.jpg'],
    cues: ['الصدر لازق في المسند', 'السحب بالكوع لورا', 'ضم لوحين الكتف ثانية', 'الرجوع ببطء لفرد كامل'],
  },
  g_straightarm: {
    en: 'Cable straight-arm pulldown',
    img: ['Straight-Arm_Pulldown/0.jpg', 'Straight-Arm_Pulldown/1.jpg'],
    cues: ['دراع مفرود والكوع مثني خفيف', 'السحب لحد الفخد', 'ميلة بسيطة لقدام وضهر مفرود', 'الطلوع ببطء لمستوى الراس'],
  },
  g_reardelt: {
    en: 'Reverse pec deck (rear delt fly)',
    img: ['Reverse_Machine_Flyes/0.jpg', 'Reverse_Machine_Flyes/1.jpg'],
    cues: ['الصدر لازق في المسند', 'الفتح لورا بالكوع مثني خفيف', 'من غير ما الكتف يطلع لفوق', 'الرجوع ببطء'],
  },
  g_hammer: {
    en: 'Dumbbell hammer curl',
    img: ['Hammer_Curls/0.jpg', 'Hammer_Curls/1.jpg'],
    cues: ['الكف ناحية الجسم طول الحركة', 'الكوع ثابت جنب الجسم', 'الرفع من غير مرجحة', 'النزول ببطء'],
  },
  g_hacksquat: {
    en: 'Machine hack squat',
    img: ['Hack_Squat/0.jpg', 'Hack_Squat/1.jpg'],
    cues: ['ضهر لازق في المسند', 'الرجلين بعرض الكتف', 'النزول ببطء لحد ٩٠ درجة', 'الدفع من الكعب من غير قفل الركبة'],
  },
  g_splitsquat: {
    en: 'Dumbbell split squat',
    img: ['Split_Squat_with_Dumbbells/0.jpg', 'Split_Squat_with_Dumbbells/1.jpg'],
    cues: ['جذع مفرود والبطن مشدودة', 'النزول عمودي لتحت', 'الركبة الأمامية فوق مشط الرجل', 'الطلوع بالدفع من الرجل القدام'],
  },
  g_seatedcalf: {
    en: 'Seated calf raise machine',
    img: ['Seated_Calf_Raise/0.jpg', 'Seated_Calf_Raise/1.jpg'],
    cues: ['المشط على الحافة والكعب حر', 'الطلوع لأعلى نقطة وثبات ثانية', 'النزول ببطء لآخر مطة', 'حركة كاملة من غير نط'],
  },
  g_glutekick: {
    en: 'Cable glute kickback',
    img: ['One-Legged_Cable_Kickback/0.jpg', 'One-Legged_Cable_Kickback/1.jpg'],
    cues: ['ضهر مفرود والبطن مشدودة', 'الرجل لورا بعصر المؤخرة', 'من غير تقويس أسفل الضهر', 'الرجوع ببطء'],
  },
  g_plank: {
    en: 'Plank',
    img: ['Plank/0.jpg', 'Plank/1.jpg'],
    cues: ['الكوع تحت الكتف', 'الجسم خط مستقيم من الراس للكعب', 'البطن والمؤخرة مشدودين', 'نفس منتظم من غير كتم'],
  },
  g_deadbug: {
    en: 'Dead bug exercise',
    img: ['Dead_Bug/0.jpg', 'Dead_Bug/1.jpg'],
    cues: ['أسفل الضهر لازق في الأرض', 'دراع ورجل عكس بعض ببطء', 'زفير مع فرد الرجل', 'حركة بطيئة ومتحكمة'],
  },
  g_hiit: {
    en: 'Treadmill interval running',
    img: ['Running_Treadmill/0.jpg', 'Running_Treadmill/1.jpg'],
    cues: ['إحماء ٥ دقايق مشي الأول', 'جري سريع قصير وبعده مشي للراحة', 'جسم مفرود من غير مسك المشاية', 'تهدئة بمشي في الآخر'],
  },
  g_bike: {
    en: 'Stationary bike',
    img: ['Bicycling_Stationary/0.jpg', 'Bicycling_Stationary/1.jpg'],
    cues: ['الكرسي على مستوى الحوض', 'الركبة مثنية خفيف تحت', 'ضهر مفرود والكتف مرتاح', 'سرعة ثابتة ونفس منتظم'],
  },
  g_incline: {
    en: 'Incline treadmill walking',
    img: ['Walking_Treadmill/0.jpg', 'Walking_Treadmill/1.jpg'],
    cues: ['ميل متوسط وسرعة مريحة', 'جسم مفرود من غير مسك المشاية', 'خطوات طبيعية من الكعب للمشط', 'نفس منتظم يسمح بالكلام'],
  },
  h_squat: {
    en: 'Bodyweight squat',
    img: ['Bodyweight_Squat/0.jpg', 'Bodyweight_Squat/1.jpg'],
    cues: ['الرجلين بعرض الكتف', 'الحوض لورا كأنه قعدة على كرسي', 'الركب في اتجاه صوابع الرجل', 'النزول ببطء والطلوع بالكعب'],
  },
  h_chair: {
    en: 'Chair sit to stand (box squat)',
    img: ['Dumbbell_Squat_To_A_Bench/0.jpg', 'Dumbbell_Squat_To_A_Bench/1.jpg'],
    cues: ['الرجلين بعرض الكتف قدام الكرسي', 'القعدة ببطء من غير رمي الجسم', 'القومة بالدفع من الكعب', 'الدراعات قدام للتوازن'],
  },
  h_bridge: {
    en: 'Glute bridge',
    img: ['Butt_Lift_Bridge/0.jpg', 'Butt_Lift_Bridge/1.jpg'],
    cues: ['الكعب قريب من المؤخرة', 'رفع الحوض بعصر المؤخرة', 'ثبات ثانية فوق', 'النزول ببطء من غير تقويس'],
  },
  h_lunge: {
    en: 'Reverse lunge',
    img: ['Dumbbell_Rear_Lunge/0.jpg', 'Dumbbell_Rear_Lunge/1.jpg'],
    cues: ['خطوة لورا والجذع مفرود', 'الركبتين على ٩٠ درجة', 'الوزن على كعب الرجل القدام', 'الرجوع بتحكم ومسك كرسي لو محتاج'],
  },
  h_pushup: {
    en: 'Incline push-up (wall or couch)',
    img: ['Incline_Push-Up/0.jpg', 'Incline_Push-Up/1.jpg'],
    cues: ['الإيدين بعرض الكتف على الحافة', 'الجسم خط مستقيم', 'الكوع زاوية ٤٥ درجة من الجسم', 'النزول ببطء وزفير مع الدفع'],
  },
  h_bandpress: {
    en: 'Resistance band chest press',
    img: ['Standing_Cable_Chest_Press/0.jpg', 'Standing_Cable_Chest_Press/1.jpg'],
    cues: ['الأستك مربوط ورا الضهر', 'الدفع لقدام على مستوى الصدر', 'البطن مشدودة والضهر مفرود', 'الرجوع ببطء'],
  },
  h_row: {
    en: 'Bent-over dumbbell row (water bottles)',
    img: ['Bent_Over_Two-Dumbbell_Row/0.jpg', 'Bent_Over_Two-Dumbbell_Row/1.jpg'],
    cues: ['ميلة لقدام وضهر مفرود', 'السحب بالكوع ناحية الوسط', 'ضم لوحين الكتف فوق', 'النزول ببطء'],
  },
  h_bandrow: {
    en: 'Seated resistance band row',
    img: ['Seated_Cable_Rows/0.jpg', 'Seated_Cable_Rows/1.jpg'],
    cues: ['قعدة والرجلين مفرودين والأستك حوالين المشط', 'ضهر مفرود من غير ميلان لورا', 'السحب لحد البطن وضم الكتف', 'الرجوع ببطء'],
  },
  h_bottlepress: {
    en: 'Dumbbell shoulder press (water bottles)',
    img: ['Dumbbell_Shoulder_Press/0.jpg', 'Dumbbell_Shoulder_Press/1.jpg'],
    cues: ['البطن مشدودة من غير تقويس', 'الدفع لفوق فوق الراس', 'النزول ببطء لمستوى الودن', 'زفير مع الدفع'],
  },
  h_birddog: {
    en: 'Bird dog exercise',
    img: [],
    cues: ['الإيدين تحت الكتف والركب تحت الحوض', 'دراع ورجل عكس بعض لقدام ولورا', 'ضهر مفرود من غير لف الحوض', 'ثبات ثانيتين والرجوع ببطء'],
  },
  h_deadbug: {
    en: 'Dead bug exercise',
    img: ['Dead_Bug/0.jpg', 'Dead_Bug/1.jpg'],
    cues: ['أسفل الضهر لازق في الأرض', 'دراع ورجل عكس بعض ببطء', 'زفير مع فرد الرجل', 'حركة بطيئة ومتحكمة'],
  },
  h_calf: {
    en: 'Calf raise on a step',
    img: ['Standing_Dumbbell_Calf_Raise/0.jpg', 'Standing_Dumbbell_Calf_Raise/1.jpg'],
    cues: ['المشط على السلمة والكعب برا', 'مسك الحيطة أو الدرابزين للتوازن', 'الطلوع لأعلى نقطة وثبات ثانية', 'النزول ببطء تحت مستوى السلمة'],
  },
  h_jacks: {
    en: 'Jumping jacks',
    img: ['Star_Jump/0.jpg', 'Star_Jump/1.jpg'],
    cues: ['نزول خفيف على المشط', 'الدراعات فوق والرجلين مفتوحين مع بعض', 'ركب مثنية خفيف', 'نفس منتظم وإيقاع ثابت'],
  },
  h_mountain: {
    en: 'Mountain climbers',
    img: ['Mountain_Climbers/0.jpg', 'Mountain_Climbers/1.jpg'],
    cues: ['الإيدين تحت الكتف', 'الجسم خط مستقيم والحوض ثابت', 'الركبة ناحية الصدر بالتبادل', 'سرعة مع الحفاظ على الشكل'],
  },
  h_march: {
    en: 'Marching in place',
    img: [],
    cues: ['جسم مفرود والبطن مشدودة', 'رفع الركبة لمستوى الوسط', 'الدراعات تتحرك مع الرجل', 'نفس منتظم وإيقاع سريع'],
  },
  h_walk: {
    en: 'Brisk walking',
    img: ['Walking_Treadmill/0.jpg', 'Walking_Treadmill/1.jpg'],
    cues: ['جسم مفرود والكتف مرتاح', 'خطوات سريعة من الكعب للمشط', 'الدراعات تتمرجح طبيعي', 'نفس يسمح بالكلام بصعوبة بسيطة'],
  },
  h_sumo: {
    en: 'Dumbbell sumo squat (water bottle)',
    img: ['Plie_Dumbbell_Squat/0.jpg', 'Plie_Dumbbell_Squat/1.jpg'],
    cues: ['الرجلين أوسع من الكتف والصوابع لبرا', 'الزجاجة متدلية بين الرجلين', 'الركب في اتجاه الصوابع', 'النزول ببطء وضهر مفرود'],
  },
  h_glutekick: {
    en: 'Quadruped glute kickback',
    img: ['Glute_Kickback/0.jpg', 'Glute_Kickback/1.jpg'],
    cues: ['الإيدين تحت الكتف والركب تحت الحوض', 'رفع الرجل لورا بعصر المؤخرة', 'من غير تقويس أسفل الضهر', 'النزول ببطء'],
  },
  h_sidelying: {
    en: 'Side-lying leg raise',
    img: ['Side_Leg_Raises/0.jpg', 'Side_Leg_Raises/1.jpg'],
    cues: ['الجسم على خط واحد على الجنب', 'رفع الرجل لفوق والصوابع لقدام', 'من غير ميلان الحوض لورا', 'النزول ببطء'],
  },
  h_bandcurl: {
    en: 'Resistance band biceps curl',
    img: ['Dumbbell_Bicep_Curl/0.jpg', 'Dumbbell_Bicep_Curl/1.jpg'],
    cues: ['الكوع ثابت جنب الجسم', 'الرفع من غير مرجحة', 'عصر البايسبس فوق', 'النزول ببطء'],
  },
  h_dips: {
    en: 'Chair triceps dips',
    img: ['Bench_Dips/0.jpg', 'Bench_Dips/1.jpg'],
    cues: ['كرسي ثابت ومسنود على الحيطة', 'الضهر قريب من حافة الكرسي', 'النزول لحد ٩٠ درجة في الكوع', 'الكتف لتحت بعيد عن الودن'],
  },
  h_sideplank: {
    en: 'Kneeling side plank',
    img: ['Side_Bridge/0.jpg', 'Side_Bridge/1.jpg'],
    cues: ['الكوع تحت الكتف مباشرة', 'الركب مثنية والحوض لفوق', 'الجسم خط مستقيم من الراس للركبة', 'نفس منتظم من غير كتم'],
  },
  h_stepjack: {
    en: 'Step jacks (low impact jumping jacks)',
    img: ['Star_Jump/0.jpg', 'Star_Jump/1.jpg'],
    cues: ['خطوة لجنب بدل النط', 'الدراعات لفوق مع كل خطوة', 'إيقاع ثابت ونفس منتظم', 'ركب مرتاحة من غير قفل'],
  },
  h_mobility: {
    en: 'Full body mobility stretching routine',
    img: ['Worlds_Greatest_Stretch/0.jpg', 'Worlds_Greatest_Stretch/1.jpg'],
    cues: ['حركات بطيئة من غير شد زيادة', 'ثبات ٢٠-٣٠ ثانية في كل مطة', 'نفس عميق مع كل مطة', 'من غير ألم، مطة مريحة بس'],
  },
  h_breath: {
    en: 'Diaphragmatic breathing relaxation',
    img: [],
    cues: ['قعدة مريحة وضهر مفرود', 'شهيق من الأنف ٤ عدات', 'البطن تطلع مع الشهيق', 'زفير بطيء من البوق ٦ عدات'],
  },
  g_benchbb: {
    en: 'Barbell bench press',
    img: ['Barbell_Bench_Press_-_Medium_Grip/0.jpg', 'Barbell_Bench_Press_-_Medium_Grip/1.jpg'],
    cues: ['لوحي الكتف مضمومين على البنش', 'البار ينزل لنص الصدر ببطء', 'الرجلين ثابتين على الأرض'],
  },
  g_smithbench: {
    en: 'Smith machine bench press',
    img: ['Smith_Machine_Bench_Press/0.jpg', 'Smith_Machine_Bench_Press/1.jpg'],
    cues: ['البنش تحت البار بحيث ينزل على نص الصدر', 'الكوع بزاوية ٤٥ درجة من الجسم', 'قفل الأمان قبل ما تسيب البار'],
  },
  g_inclinebb: {
    en: 'Barbell incline bench press',
    img: ['Barbell_Incline_Bench_Press_-_Medium_Grip/0.jpg', 'Barbell_Incline_Bench_Press_-_Medium_Grip/1.jpg'],
    cues: ['البنش مايل ٣٠ لـ ٤٥ درجة', 'البار ينزل لأعلى الصدر', 'من غير ما الضهر يتقوس جامد'],
  },
  g_cablefly: {
    en: 'Cable crossover',
    img: ['Cable_Crossover/0.jpg', 'Cable_Crossover/1.jpg'],
    cues: ['كوع مثني خفيف وثابت', 'الإيدين يتقابلوا قدام الصدر', 'الرجوع ببطء لحد ما تحس بشد في الصدر'],
  },
  g_dbfly: {
    en: 'Dumbbell fly',
    img: ['Dumbbell_Flyes/0.jpg', 'Dumbbell_Flyes/1.jpg'],
    cues: ['كوع مثني خفيف طول الحركة', 'النزول لحد مستوى الصدر بس', 'الطلوع كأنك بتحضن شجرة'],
  },
  g_ohpbb: {
    en: 'Standing barbell overhead press',
    img: ['Standing_Military_Press/0.jpg', 'Standing_Military_Press/1.jpg'],
    cues: ['بطن مشدودة ومؤخرة معصورة', 'البار يطلع قريب من الوش', 'من غير ما تميل لورا'],
  },
  g_skull: {
    en: 'EZ-bar skull crusher',
    img: ['EZ-Bar_Skullcrusher/0.jpg', 'EZ-Bar_Skullcrusher/1.jpg'],
    cues: ['الكوع ثابت ومتجه للسقف', 'البار ينزل لورا الراس ببطء', 'الفرد من الكوع بس'],
  },
  g_dipm: {
    en: 'Machine triceps dip',
    img: ['Dip_Machine/0.jpg', 'Dip_Machine/1.jpg'],
    cues: ['ضهر لازق في المسند', 'الكوع قريب من الجسم', 'الفرد لآخره من غير قفل جامد'],
  },
  g_kickback: {
    en: 'Dumbbell triceps kickback',
    img: ['Tricep_Dumbbell_Kickback/0.jpg', 'Tricep_Dumbbell_Kickback/1.jpg'],
    cues: ['الدراع العلوي موازي للأرض وثابت', 'الفرد لورا وعصر التراي', 'وزن خفيف وحركة بطيئة'],
  },
  g_pullup: {
    en: 'Pull-up',
    img: ['Pullups/0.jpg', 'Pullups/1.jpg'],
    cues: ['مسكة أعرض من الكتف شوية', 'الصدر يطلع ناحية البار', 'النزول ببطء لحد ما الدراع يتفرد'],
  },
  g_bbrow: {
    en: 'Bent-over barbell row',
    img: ['Bent_Over_Barbell_Row/0.jpg', 'Bent_Over_Barbell_Row/1.jpg'],
    cues: ['ضهر مفرود ومايل لقدام', 'البار يتسحب لتحت الصدر', 'من غير ما تشد بالضهر'],
  },
  g_highrow: {
    en: 'Machine high row',
    img: ['Leverage_High_Row/0.jpg', 'Leverage_High_Row/1.jpg'],
    cues: ['الصدر لازق في المسند', 'السحب بالكوع لتحت ولورا', 'عصر لوحي الكتف ثانية'],
  },
  g_ezcurl: {
    en: 'EZ-bar curl',
    img: ['EZ-Bar_Curl/0.jpg', 'EZ-Bar_Curl/1.jpg'],
    cues: ['الكوع جنب الجسم ثابت', 'الطلوع من غير ما تمرجح', 'النزول ببطء'],
  },
  g_preacher: {
    en: 'Machine preacher curl',
    img: ['Machine_Preacher_Curls/0.jpg', 'Machine_Preacher_Curls/1.jpg'],
    cues: ['الباط لازق في المسند', 'الطلوع لحد ما العضلة تتعصر', 'النزول ببطء من غير قفل الكوع'],
  },
  g_gobletsquat: {
    en: 'Goblet squat',
    img: ['Goblet_Squat/0.jpg', 'Goblet_Squat/1.jpg'],
    cues: ['الدمبل لازق في الصدر', 'الكوع بين الركب تحت', 'صدر لفوق وضهر مفرود'],
  },
  g_smithsquat: {
    en: 'Smith machine squat',
    img: ['Smith_Machine_Squat/0.jpg', 'Smith_Machine_Squat/1.jpg'],
    cues: ['الرجلين قدام البار شوية', 'النزول لحد ما الفخد يوازي الأرض', 'الطلوع بالدفع من الكعب'],
  },
  g_rdlbb: {
    en: 'Barbell Romanian deadlift',
    img: ['Romanian_Deadlift/0.jpg', 'Romanian_Deadlift/1.jpg'],
    cues: ['البار قريب من الرجل طول الحركة', 'الحوض لورا والضهر مفرود', 'الطلوع بعصر المؤخرة'],
  },
  g_seatedcurl: {
    en: 'Seated leg curl',
    img: ['Seated_Leg_Curl/0.jpg', 'Seated_Leg_Curl/1.jpg'],
    cues: ['المخدة فوق الكاحل', 'الشد لتحت لآخره', 'الرجوع ببطء'],
  },
  g_bbthrust: {
    en: 'Barbell hip thrust',
    img: ['Barbell_Hip_Thrust/0.jpg', 'Barbell_Hip_Thrust/1.jpg'],
    cues: ['أعلى الضهر على البنش', 'مخدة تحت البار', 'عصر المؤخرة فوق والدقن لتحت'],
  },
  g_dbcalf: {
    en: 'Dumbbell calf raise',
    img: ['Standing_Dumbbell_Calf_Raise/0.jpg', 'Standing_Dumbbell_Calf_Raise/1.jpg'],
    cues: ['صوابع الرجل على حرف السلمة', 'الطلوع لآخره والنزول تحت مستوى السلمة', 'مسكة في الحيطة للتوازن'],
  },
  g_smithcalf: {
    en: 'Smith machine calf raise',
    img: ['Smith_Machine_Calf_Raise/0.jpg', 'Smith_Machine_Calf_Raise/1.jpg'],
    cues: ['الكتف تحت البار وصوابع الرجل على الستيب', 'الطلوع لآخره ووقفة ثانية', 'النزول ببطء'],
  },
  g_dbreardelt: {
    en: 'Bent-over dumbbell rear delt raise',
    img: ['Seated_Bent-Over_Rear_Delt_Raise/0.jpg', 'Seated_Bent-Over_Rear_Delt_Raise/1.jpg'],
    cues: ['مايل لقدام وضهر مفرود', 'رفع الدمبل للجنب بكوع مثني خفيف', 'وزن خفيف من غير مرجحة'],
  },
  g_cablereardelt: {
    en: 'Cable rear delt fly',
    img: ['Cable_Rear_Delt_Fly/0.jpg', 'Cable_Rear_Delt_Fly/1.jpg'],
    cues: ['الكيبلات متقاطعة قدامك', 'فتح الدراعات للجنب في مستوى الكتف', 'الرجوع ببطء'],
  },
  g_bblunge: {
    en: 'Barbell lunge',
    img: ['Barbell_Lunge/0.jpg', 'Barbell_Lunge/1.jpg'],
    cues: ['خطوة واسعة وجسم مفرود', 'الركبة الورانية تقرب من الأرض', 'الدفع من كعب الرجل القدامية'],
  },
  g_adduct: {
    en: 'Hip adductor machine',
    img: ['Cable_Hip_Adduction/0.jpg', 'Cable_Hip_Adduction/1.jpg'],
    cues: ['ضهر لازق في المسند', 'ضم الرجلين ببطء', 'الفتح ببطء من غير ما الوزن يخبط'],
  },
};
