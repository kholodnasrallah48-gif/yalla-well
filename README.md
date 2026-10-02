# يلا ويل (Yalla Well)

Arabic (Egyptian dialect, RTL) fitness app: calorie tracking with Egyptian foods, weekly training plans, and adjustments for autoimmune conditions and ongoing medications.

- **Onboarding:** body stats, daily activity, goal, schedule (3 gym days / 5 days with 3 gym + 2 home / 5 gym days), level, conditions, medications, joint pain.
- **Calories:** Mifflin-St Jeor targets with macro split, capped deficits for thyroid conditions, higher protein on corticosteroids.
- **Training:** sessions per weekday with automatic swaps for joint pain, low-impact needs and machine-only cases, plus a "flare day" recovery session.
- **Data** stays on the device (AsyncStorage).

The app gives general guidance and is not a substitute for a doctor.

## Develop

```bash
npm install
npx expo start      # scan the QR code with a development build or Expo Go
npm test            # plan/calorie logic tests (Node test runner)
npm run typecheck
```

Brand: petrol `#0E4C5A` + lime `#A9BD2C`, Readex Pro + IBM Plex Sans Arabic. See `src/theme.ts`.

## التجربة على الموبايل (Expo Go)

1. نزّلي **Expo Go** من App Store واعملي حساب على expo.dev.
2. من expo.dev > Account settings > Access tokens اعملي token، وحطيه في الـ repo:
   Settings > Secrets and variables > Actions > New repository secret، باسم `EXPO_TOKEN`.
3. أي push على `main` بيشغّل الـ workflow اللي اسمه **Preview on phone**، وفي صفحة الـ run هتلاقي QR تمسحيه بكاميرا الآيفون.
