// Health: the period or pregnancy (women only), sleep, medicine times and supplements, lab results with when to
// repeat each, and the report for the doctor (last 4 weeks) to print or share as a PDF.
import * as Print from 'expo-print';
import { useState } from 'react';
import { View } from 'react-native';

import { LabCard } from '../../components/LabCard.tsx';
import { MedList, migrateMeds } from '../../components/MedList.tsx';
import { TourTarget } from '../../components/TourTarget.tsx';
import { Btn, Card, Chip, Rise, Screen, T } from '../../components/ui.tsx';
import { CycleCard, PregnancyCard, SleepCard } from '../../components/wellbeing.tsx';
import { dayKey, weekIndex } from '../../lib/day.ts';
import { doctorHTML, newMedPlan } from '../../lib/health.ts';
import { labReportHTML } from '../../lib/labreport.ts';
import { KB_BY_ID } from '../../lib/kb.ts';
import { play } from '../../lib/sound.ts';
import { L } from '../../lib/i18n.ts';
import { genderFor, sessionFor } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { useStore } from '../../store/AppStore.tsx';
import { useColors } from '../../theme.ts';

export default function Health() {
  const c = useColors();
  const { profile, saveProfile, readDay, day, history, updateDay } = useStore();
  const [busy, setBusy] = useState(false);
  const [labBusy, setLabBusy] = useState(false);
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

  const labReport = async () => {
    setLabBusy(true);
    try { await Print.printAsync({ html: labReportHTML(p, new Date()) }); } catch { /* print screen closed or unavailable */ }
    setLabBusy(false);
  };

  return (
    <Screen title={L('الصحة', 'Health')} name="health">
      {p.sex === 'f' ? (
        <Rise>
          <TourTarget id="health.cycle">
            {p.women?.preg === 'yes' ? <PregnancyCard profile={p} /> : <CycleCard profile={p} onChange={saveProfile} />}
          </TourTarget>
        </Rise>
      ) : null}

      <Rise i={1}>
        <TourTarget id="health.sleep">
          <SleepCard profile={p} day={day} history={history} update={updateDay} />
        </TourTarget>
      </Rise>

      <Rise i={2}>
        <TourTarget id="health.meds">
          <Card>
            <T kind="h2">{L('الأدوية والفيتامينات', 'Medicines and supplements')}</T>
            <T kind="small">{L(`لكل واحد: الجرعة والعدد وكل قد إيه والميعاد. هيجي${g('لك', 'لك')} تنبيه في كل ميعاد، و${g('تقدر تعلم', 'تقدري تعلمي')} عليه من صفحة النهارده.`, "For each one: dose, how many, how often and when. You'll get a reminder at each time, and can tick it off on Today.")}</T>
            <MedList value={p} onChange={(patch) => saveProfile({ ...p, ...patch })} />
          </Card>
        </TourTarget>
      </Rise>

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

      <LabCard profile={p} onChange={saveProfile} onReport={labReport} busy={labBusy} />

      <Card>
        <T kind="h2">{L('تقرير للدكتور', 'Report for your doctor')}</T>
        <T kind="small">{L(`آخر ٤ أسابيع: الأدوية ومواعيدها والتزامك بيها، الطاقة والألم والنوم، أيام التعب، التمرين، والتحاليل. ${g('اطبعه', 'اطبعيه')} أو ${g('احفظه', 'احفظيه')} PDF و${g('ابعته', 'ابعتيه')} لدكتورك.`, 'The last 4 weeks: medicines, times and how often you took them, energy, pain and sleep, rough days, workouts and lab results. Print it or save it as a PDF for your doctor.')}</T>
        <Btn title={busy ? L('بيتجهز', 'Preparing') : L(g('اعمل التقرير', 'اعملي التقرير'), 'Make the report')} disabled={busy} onPress={report} />
      </Card>

      <T kind="small" color={c.dim} style={{ textAlign: 'center' }}>{L('التطبيق ده للمساعدة ومش بديل عن دكتورك. أي تغيير في الأدوية أو الأكل لازم يبقى بإشرافه.', "This app is here to help and doesn't replace your doctor. Any change to your medication or diet should be supervised by them.")}</T>
    </Screen>
  );
}
