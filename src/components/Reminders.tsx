// Keeps the phone reminders in step with the profile and today's log. Renders nothing; mount it once in the root layout.
import { useEffect, useState } from 'react';

import { getLang, onLangChange } from '../lib/i18n.ts';
import { notifyOn, onNotifyChange, scheduleReminders } from '../lib/notify.ts';
import { useStore } from '../store/AppStore.tsx';

export function Reminders() {
  const { profile, today, day } = useStore();
  const [lang, setLang] = useState(getLang());
  const [on, setOn] = useState(notifyOn());
  useEffect(() => onLangChange(setLang), []);
  useEffect(() => onNotifyChange(setOn), []);

  const meals = (day.meals ?? []).join(',');
  const done = day.done.join(',');
  const foods = day.foods.length;
  useEffect(() => {
    const t = setTimeout(() => { scheduleReminders({ profile, day }); }, 1000);
    return () => clearTimeout(t);
    // `day` is read for its latest value; the parts that matter are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, today, meals, day.water, done, foods, day.flare, lang, on]);
  return null;
}

