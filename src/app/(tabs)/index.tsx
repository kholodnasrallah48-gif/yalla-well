import { CheckInCard, TodayDoses } from '../../components/health.tsx';
import { DailyFire } from '../../components/DailyFire.tsx';
import { CaptainCard, ScoreRow } from '../../components/match.tsx';
import { StoryRing } from '../../components/StoryRing.tsx';
import { TourTarget } from '../../components/TourTarget.tsx';
import { Rise, Screen } from '../../components/ui.tsx';
import { homeLine } from '../../lib/captain.ts';
import { totals, weekIndex } from '../../lib/day.ts';
import { easyDay } from '../../lib/health.ts';
import { L } from '../../lib/i18n.ts';
import { genderFor, sessionFor, splitLabel, targets } from '../../lib/plan.ts';
import { programWeek } from '../../lib/progress.ts';
import { streaks } from '../../lib/streaks.ts';
import { useStore } from '../../store/AppStore.tsx';
import { useColors } from '../../theme.ts';

/** Today: the captain's line about the day, today's medicines, how the person feels, and the streaks. Calories and
 * water live on Food, the workout on Train, sleep and the cycle on Health. */
export default function Home() {
  const c = useColors();
  const { profile, day, updateDay, history, today } = useStore();
  if (!profile) return null;
  const g = genderFor(profile.sex);
  const T0 = targets(profile);
  const t = totals(day);
  const now = new Date();
  const todayIdx = weekIndex(now);
  const ses = sessionFor(profile, todayIdx, easyDay(profile, day, now).easy, programWeek(profile.start, now));
  const left = T0.kcal - t.kcal;
  const st = streaks(profile, { ...history, [today]: day }, now);
  const greet = now.getHours() < 12 ? L('صباح الخير', 'Good morning') : L('مساء الخير', 'Good evening');
  const doneN = ses ? ses.items.filter((x) => day.done.includes(x.id)).length : 0;
  const finished = !!ses && ses.items.length > 0 && doneN >= ses.items.length;
  const workout = ses ? (ses.place === 'home' ? L('تمرين بيت', 'a home workout') : splitLabel(ses.id)) : null;
  const line = homeLine({ g, name: profile.name, hour: now.getHours(), kcalStreak: st.kcal, left, target: T0.kcal, eaten: t.kcal, workout, done: doneN, total: ses?.items.length ?? 0 });
  const dayNo = profile.start ? Math.max(1, Math.floor((Date.parse(today) - Date.parse(profile.start)) / 86400000) + 1) : 1;

  return (
    <Screen title={profile.name ? profile.name : greet} kicker={profile.name ? greet : undefined} bigTitle={!!profile.name} themeToggle name="index"
      lead={<TourTarget id="home.story"><StoryRing profile={profile} g={g} /></TourTarget>}>
      <DailyFire streak={st.kcal} />
      <Rise>
        <TourTarget id="home.day">
          <CaptainCard pose="cheer" excited={finished} head={line.head} body={line.body} big={String(dayNo)} caption={L(`يوم ${dayNo}`, `Day ${dayNo}`)} />
        </TourTarget>
      </Rise>

      <TodayDoses profile={profile} day={day} update={updateDay} g={g} />

      <Rise i={2}>
        <TourTarget id="home.check">
          <CheckInCard day={day} update={updateDay} g={g} />
        </TourTarget>
      </Rise>

      <Rise i={3}>
        <TourTarget id="home.streak">
          <ScoreRow items={[
            { value: String(st.kcal), label: L(st.kcal === 1 ? 'يوم في السعرات' : 'أيام في السعرات', st.kcal === 1 ? 'day on target' : 'days on target'), color: st.kcal ? c.petrol : undefined },
            { value: String(st.workout), label: L('تمارين ورا بعض', 'workouts in a row') },
            { value: String(st.points), label: st.todayPoints ? L(`نقطة (+${st.todayPoints} النهارده)`, `points (+${st.todayPoints} today)`) : L('نقطة', 'points') },
          ]} />
        </TourTarget>
      </Rise>
    </Screen>
  );
}
