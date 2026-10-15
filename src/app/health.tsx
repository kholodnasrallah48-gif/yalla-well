// "My health": medicine times (and medicines the person adds), lab results with when to repeat each, and the
// report for the doctor (last 4 weeks) to print or share as a PDF.
import * as Print from 'expo-print';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LabCard } from '../components/LabCard.tsx';
import { MedList, migrateMeds } from '../components/MedList.tsx';
import { Bg, Btn, Card, Chip, T, styles } from '../components/ui.tsx';
import { dayKey, weekIndex } from '../lib/day.ts';
import { doctorHTML, newMedPlan } from '../lib/health.ts';
import { KB_BY_ID } from '../lib/kb.ts';
import { play } from '../lib/sound.ts';
import { L } from '../lib/i18n.ts';
import { genderFor, sessionFor } from '../lib/plan.ts';
import { programWeek } from '../lib/progress.ts';
import { useStore } from '../store/AppStore.tsx';

export default function Health() {
  const insets = useSafeAreaInsets();
  const { profile, saveProfile, readDay } = useStore();
  const [busy, setBusy] = useState(false);
  if (!profile) return null;
  // Older profiles kept other medicines as one line of text; show them as medicines with a schedule.
  const p = migrateMeds(profile);
  const g = genderFor(p.sex);

  const report = async () => {
    setBusy(true);
    try {
      const keys = Array.from({ length: 28 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 27 + i); return d; });
      const logs = await Promise.all(keys.map((d) => readDay(dayKey(d))));
      const planned: Record<string, string[]> = {};
      keys.forEach((d) => { planned[dayKey(d)] = sessionFor(p, weekIndex(d), false, programWeek(p.start, d))?.items.map((x) => x.id) ?? []; });
      const html = doctorHTML({ profile: p, days: keys.map((d, i) => ({ key: dayKey(d), log: logs[i] })), planned });
      await Print.printAsync({ html });
    } catch { /* print screen closed or unavailable */ }
    setBusy(false);
  };

  return (
    <Bg><ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
      <View style={styles.rowBetween}>
        <T kind="h1">{L('صحتي', 'My health')}</T>
        <Btn kind="outline" title={L('رجوع', 'Back')} onPress={() => router.back()} />
      </View>

      <Card>
        <T kind="h2">{L('الأدوية والفيتامينات', 'Medicines and supplements')}</T>
        <T kind="small">{L(`لكل واحد: الجرعة والعدد وكل قد إيه والميعاد. هيجي${g('لك', 'لك')} تنبيه في كل ميعاد، و${g('تقدر تعلم', 'تقدري تعلمي')} عليه من الصفحة الرئيسية.`, "For each one: dose, how many, how often and when. You'll get a reminder at each time, and can tick it off on Home.")}</T>
        <MedList value={p} onChange={(patch) => saveProfile({ ...p, ...patch })} />
      </Card>

      {p.sex === 'f' && p.women?.preg && p.women.preg !== 'no' ? (
        <Card>
          <T kind="h2">{p.women.preg === 'yes' ? L('فيتامينات الحمل', 'Pregnancy vitamins') : p.women.preg === 'nursing' ? L('فيتامينات الرضاعة', 'Breastfeeding vitamins') : L('قبل الحمل', 'Before pregnancy')}</T>
          <T kind="small">{p.women.preg === 'trying'
            ? L('حمض الفوليك قبل الحمل بشهور بيحمي الجنين. اسألي دكتورتك عن الجرعة المناسبة ليكي، ولو كتبته دوسي عليه وهنفكرك بيه كل يوم.', 'Folic acid for a few months before pregnancy protects the baby. Ask your doctor about the right dose, and if it is prescribed, tap it and we will remind you daily.')
            : L('اسألي دكتورتك عن دول. اللي تكتبهولك دوسي عليه، هيتضاف لأدويتك فوق ونفكرك بيه، وتقدري تظبطي الجرعة والميعاد.', "Ask your doctor about these. Tap the ones she prescribes: they're added to your medicines above with reminders, and you can set the dose and time.")}</T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {(p.women.preg === 'trying' ? ['v_folic', 'v_d'] : ['v_folic', 'v_iron', 'v_d', 'v_calc', 'v_omega']).map((id) => {
              const kb = KB_BY_ID[id];
              const name = L(kb.n[0], kb.n[1]);
              const have = Object.values(p.medPlan ?? {}).some((m) => m?.kb === id);
              return <Chip key={id} label={have ? L(`${name} ✓`, `${name} ✓`) : `+ ${name}`} on={have} onPress={() => { if (have) return; play('add'); saveProfile({ ...p, medPlan: { ...p.medPlan, ['x:' + name]: newMedPlan(name, kb) } }); }} />;
            })}
          </View>
        </Card>
      ) : null}

      <LabCard profile={p} onChange={saveProfile} />

      <Card>
        <T kind="h2">{L('تقرير للدكتور', 'Report for your doctor')}</T>
        <T kind="small">{L(`آخر ٤ أسابيع: الأدوية ومواعيدها والتزامك بيها، الطاقة والألم والنوم، أيام التعب، التمرين، والتحاليل. ${g('اطبعه', 'اطبعيه')} أو ${g('احفظه', 'احفظيه')} PDF و${g('ابعته', 'ابعتيه')} لدكتورك.`, 'The last 4 weeks: medicines, times and how often you took them, energy, pain and sleep, rough days, workouts and lab results. Print it or save it as a PDF for your doctor.')}</T>
        <Btn title={busy ? L('بيتجهز…', 'Preparing…') : L(g('اعمل التقرير', 'اعملي التقرير'), 'Make the report')} disabled={busy} onPress={report} />
      </Card>
    </ScrollView></Bg>
  );
}

