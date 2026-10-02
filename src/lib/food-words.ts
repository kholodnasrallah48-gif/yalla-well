// Arabic food words with English equivalents, used to search English nutrition databases.
// Arabic (normalized: ة→ه, أ/إ/آ→ا, ى→ي) to English search words. Order inside a phrase doesn't matter to USDA.
export const AR_EN: Record<string, string> = {
  // grains and bread
  'عيش': 'bread', 'خبز': 'bread', 'رغيف': 'bread', 'توست': 'bread toasted', 'فينو': 'roll', 'شامي': 'pita', 'بلدي': 'pita whole wheat',
  'رز': 'rice', 'ارز': 'rice', 'مكرونه': 'pasta', 'معكرونه': 'pasta', 'اسباجتي': 'spaghetti', 'شعريه': 'vermicelli', 'برغل': 'bulgur',
  'شوفان': 'oats', 'كورن': 'corn', 'فليكس': 'flakes', 'كورنفليكس': 'corn flakes', 'جرانولا': 'granola', 'ذره': 'corn', 'فشار': 'popcorn',
  'كينوا': 'quinoa', 'دقيق': 'flour', 'نشا': 'starch', 'بسكوت': 'biscuit', 'كرواسون': 'croissant', 'بان': 'pancake', 'بانكيك': 'pancake',
  'وافل': 'waffle', 'كيك': 'cake', 'كعك': 'cookie', 'بقسماط': 'rusk', 'كراكرز': 'crackers', 'تورتيلا': 'tortilla',
  'حبوب': 'grain', 'كامله': 'whole', 'كامل': 'whole', 'نخاله': 'bran', 'بني': 'brown', 'اسمر': 'whole wheat', 'ابيض': 'white', 'سن': 'whole wheat',
  // proteins
  'فراخ': 'chicken', 'فرخه': 'chicken', 'دجاج': 'chicken', 'صدر': 'breast', 'صدور': 'breast', 'ورك': 'thigh', 'اوراك': 'thigh', 'جناح': 'wing', 'اجنحه': 'wing',
  'لحمه': 'beef', 'لحم': 'beef', 'بقري': 'beef', 'كندوز': 'beef', 'ضاني': 'lamb', 'خروف': 'lamb', 'عجل': 'veal', 'كبده': 'liver', 'كلاوي': 'kidney',
  'مفرومه': 'ground', 'مفروم': 'ground', 'ستيك': 'steak', 'برجر': 'burger', 'سجق': 'sausage', 'سوسيس': 'sausage', 'لانشون': 'luncheon meat',
  'بسطرمه': 'pastrami', 'هوت': 'hot', 'دوج': 'dog', 'بط': 'duck', 'حمام': 'squab', 'سمان': 'quail',
  'سمك': 'fish', 'بلطي': 'tilapia', 'بوري': 'mullet', 'سلمون': 'salmon', 'تونه': 'tuna', 'سردين': 'sardines', 'جمبري': 'shrimp', 'كاليماري': 'squid',
  'سبيط': 'cuttlefish', 'كابوريا': 'crab', 'ماكريل': 'mackerel', 'بكلاه': 'cod', 'قد': 'cod', 'فيليه': 'fillet', 'رنجه': 'herring smoked', 'فسيخ': 'fish salted',
  'بيض': 'egg', 'بيضه': 'egg', 'بياض': 'egg white', 'صفار': 'egg yolk',
  'فول': 'fava beans', 'عدس': 'lentils', 'حمص': 'chickpeas', 'فاصوليا': 'beans', 'لوبيا': 'black-eyed peas', 'ترمس': 'lupini', 'صويا': 'soy', 'توفو': 'tofu',
  // dairy
  'لبن': 'milk', 'حليب': 'milk', 'زبادي': 'yogurt', 'يوجرت': 'yogurt', 'رايب': 'buttermilk', 'جبنه': 'cheese', 'جبن': 'cheese', 'قريش': 'cottage',
  'موتزاريلا': 'mozzarella', 'شيدر': 'cheddar', 'فيتا': 'feta', 'بارميزان': 'parmesan', 'حلوم': 'halloumi', 'كريمي': 'cream cheese', 'لبنه': 'labneh',
  'قشطه': 'cream', 'كريمه': 'cream', 'زبده': 'butter', 'سمنه': 'ghee', 'ايس': 'ice', 'ايسكريم': 'ice cream', 'جيلاتي': 'ice cream',
  'كامل الدسم': 'whole', 'خالي': 'nonfat', 'لايت': 'light', 'دايت': 'diet',
  // vegetables
  'خضار': 'vegetables', 'سلطه': 'salad', 'طماطم': 'tomato', 'قوطه': 'tomato', 'خيار': 'cucumber', 'خس': 'lettuce', 'جرجير': 'arugula', 'بصل': 'onion',
  'ثوم': 'garlic', 'جزر': 'carrot', 'بطاطس': 'potato', 'بطاطا': 'sweet potato', 'كوسه': 'zucchini', 'باذنجان': 'eggplant', 'بتنجان': 'eggplant',
  'فلفل': 'pepper', 'فلفل رومي': 'bell pepper', 'فلفل الوان': 'bell pepper', 'جبنه رومي': 'cheese romano', 'ديك رومي': 'turkey', 'سبانخ': 'spinach', 'ملوخيه': 'jute mallow', 'بامي': 'okra', 'بسله': 'peas', 'فاصولياء': 'green beans',
  'قرنبيط': 'cauliflower', 'كرنب': 'cabbage', 'بروكلي': 'broccoli', 'مشروم': 'mushroom', 'عيش الغراب': 'mushroom', 'بنجر': 'beet', 'لفت': 'turnip',
  'كرفس': 'celery', 'بقدونس': 'parsley', 'شبت': 'dill', 'كزبره': 'coriander', 'نعناع': 'mint', 'فجل': 'radish', 'افوكادو': 'avocado', 'زيتون': 'olives',
  'مخلل': 'pickled', 'مخللات': 'pickles', 'طرشي': 'pickles', 'خرشوف': 'artichoke', 'هليون': 'asparagus', 'قلقاس': 'taro',
  // fruit
  'فاكهه': 'fruit', 'تفاح': 'apple', 'تفاحه': 'apple', 'موز': 'banana', 'موزه': 'banana', 'برتقال': 'orange', 'يوسفي': 'tangerine', 'عنب': 'grapes',
  'فراوله': 'strawberries', 'مانجو': 'mango', 'بطيخ': 'watermelon', 'شمام': 'cantaloupe', 'كنتالوب': 'cantaloupe', 'خوخ': 'peach', 'مشمش': 'apricot',
  'كمثري': 'pear', 'جوافه': 'guava', 'رمان': 'pomegranate', 'تين': 'figs', 'بلح': 'dates', 'تمر': 'dates', 'كيوي': 'kiwi', 'اناناس': 'pineapple',
  'ليمون': 'lemon', 'جريب': 'grapefruit', 'فروت': 'fruit', 'كريز': 'cherries', 'توت': 'berries', 'برقوق': 'plum', 'زبيب': 'raisins', 'قراصيا': 'prunes',
  'جوز الهند': 'coconut', 'نارجيل': 'coconut', 'مجفف': 'dried', 'مجففه': 'dried',
  // nuts, oils, sauces
  'لوز': 'almonds', 'جوز': 'walnuts', 'عين جمل': 'walnuts', 'كاجو': 'cashews', 'فول سوداني': 'peanuts', 'سوداني': 'peanuts', 'فستق': 'pistachio',
  'بندق': 'hazelnuts', 'بذور': 'seeds', 'لب': 'seeds', 'سمسم': 'sesame', 'شيا': 'chia', 'كتان': 'flaxseed', 'زبده فول سوداني': 'peanut butter',
  'زيت': 'oil', 'طحينه': 'tahini', 'مايونيز': 'mayonnaise', 'كاتشب': 'ketchup', 'مستارده': 'mustard', 'صوص': 'sauce', 'عسل': 'honey', 'مربي': 'jam',
  'نوتيلا': 'nutella', 'شوكولاته': 'chocolate', 'شيكولاته': 'chocolate', 'سكر': 'sugar', 'ملح': 'salt', 'خل': 'vinegar', 'دبس': 'molasses', 'عسل اسود': 'molasses',
  'حلاوه': 'halva', 'بسبوسه': 'basbousa', 'كنافه': 'kunafa', 'بقلاوه': 'baklava', 'رز بلبن': 'rice pudding', 'مهلبيه': 'pudding', 'جيلي': 'gelatin', 'دونات': 'doughnut',
  // drinks
  'شاي': 'tea', 'قهوه': 'coffee', 'نسكافيه': 'instant coffee', 'لاتيه': 'latte', 'كابتشينو': 'cappuccino', 'عصير': 'juice', 'مياه': 'water', 'مايه': 'water',
  'كولا': 'cola', 'بيبسي': 'cola', 'كوكاكولا': 'cola', 'سبرايت': 'lemon lime soda', 'صودا': 'soda', 'غازيه': 'carbonated', 'مشروب': 'drink',
  'سموزي': 'smoothie', 'ميلك': 'milk', 'شيك': 'shake', 'كاكاو': 'cocoa', 'سحلب': 'sahlab', 'ينسون': 'anise tea', 'كركديه': 'hibiscus tea', 'قرفه': 'cinnamon',
  'بروتين': 'protein', 'واي': 'whey', 'جاتوه': 'cake', 'بيتزا': 'pizza', 'شاورما': 'shawarma', 'كفته': 'kofta', 'كباب': 'kebab', 'فلافل': 'falafel',
  'طعميه': 'falafel', 'ساندوتش': 'sandwich', 'شيبسي': 'potato chips', 'شيبس': 'chips', 'كرانشي': 'chips', 'فرايز': 'french fries', 'نجتس': 'chicken nuggets',
  'شوربه': 'soup', 'مرق': 'broth', 'كشري': 'koshari', 'محشي': 'stuffed', 'ورق عنب': 'grape leaves stuffed', 'حواوشي': 'hawawshi', 'فطير': 'pastry',
  // cooking words
  'مشوي': 'grilled', 'مشويه': 'grilled', 'مقلي': 'fried', 'مقليه': 'fried', 'مسلوق': 'boiled', 'مسلوقه': 'boiled', 'نيه': 'raw', 'ني': 'raw',
  'مطبوخ': 'cooked', 'مطبوخه': 'cooked', 'فرن': 'baked', 'بالفرن': 'baked', 'مدخن': 'smoked', 'معلب': 'canned', 'معلبه': 'canned', 'مجمد': 'frozen',
  'محمر': 'fried', 'محمره': 'fried', 'بانيه': 'breaded fried', 'كريسبي': 'crispy fried', 'استربس': 'strips', 'ساده': 'plain',
  'سكر خفيف': 'sweetened', 'غير سكر': 'unsweetened', 'محلي': 'sweetened', 'طازه': 'fresh', 'طازج': 'fresh', 'اخضر': 'green', 'اسود': 'black', 'احمر': 'red', 'اصفر': 'yellow',
};
// Words that carry no food meaning on their own.
export const SKIP = new Set(['من', 'في', 'على', 'مع', 'و', 'او', 'بال', 'ال', 'حبه', 'طبق', 'كوبايه', 'كوب', 'معلقه', 'قطعه', 'حته', 'شويه', 'جم', 'جرام', 'جرامات', 'كيلو', 'نص', 'ربع', 'صغير', 'كبير', 'وسط']);

