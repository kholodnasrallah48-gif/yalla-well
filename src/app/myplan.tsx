// Share the plan: a PDF of the targets, meals, weekly workouts and progress for a trainer or dietitian.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Bg, Btn, Card, Chip, T, styles } from '../components/ui.tsx';
import { L } from '../lib/i18n.ts';
import { genderFor } from '../lib/plan.ts';
import { planHTML } from '../lib/planpdf.ts';
import { programWeek } from '../lib/progress.ts';
import { useStore } from '../store/AppStore.tsx';
import { useColors } from '../theme.ts';

export default function MyPlan() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { profile, lifts } = useStore();
  const [health, setHealth] = useState(true);
  const [err, setErr] = useState('');
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const share = () => {
    setErr('');
    Print.printAsync({ html: planHTML(profile, lifts, { health, week: programWeek(profile.start, new Date()) }) })
      .catch(() => setErr(L(`معرفناش نفتح صفحة الطباعة. ${g('جرب', 'جربي')} تاني.`, "Couldn't open the print page. Try again.")));
  };
  return (
    <Bg><ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('خطتي في ملف', 'My plan as a file')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>
      <Card>
        <T kind="body">{L(`ملف PDF فيه خطتك كلها عشان ${g('تبعته', 'تبعتيه')} للكابتن أو أخصائي التغذية: السعرات والماكروز، السعرات في كل وجبة، تمارين كل يوم بالمجموعات والعدات وآخر وزن ${g('لعبته', 'لعبتيه')}، والوزن والقياسات.`, 'A PDF of your whole plan to send to your trainer or dietitian: calories and macros, calories per meal, each day’s exercises with sets, reps and the last weight you used, and your weight and measurements.')}</T>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <T kind="h3">{L('الحالة الصحية والأدوية', 'Health and medicines')}</T>
            <T kind="small">{L('الأمراض وأماكن الألم وملاحظات الأكل والتمرين بسببها.', 'Conditions, pain areas and the food and training notes for them.')}</T>
          </View>
          <Chip label={health ? L('هتتحط', 'Included') : L('مش هتتحط', 'Left out')} on={health} onPress={() => setHealth(!health)} />
        </View>
        <Btn title={L(g('اطبع أو ابعت PDF', 'اطبعي أو ابعتي PDF'), 'Print or share PDF')} onPress={share} />
        {err ? <T kind="small" color={c.bad}>{err}</T> : null}
      </Card>
    </ScrollView></Bg>
  );
}
