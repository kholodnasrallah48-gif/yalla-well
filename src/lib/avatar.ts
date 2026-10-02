// The person's avatar: what they pick (skin, hair, makeup, clothes) and the body shape that follows their weight.
import type { Profile } from './plan.ts';

export type HairStyle = 'long' | 'wavy' | 'pony' | 'bun' | 'curly' | 'bob' | 'short' | 'hijab' | 'bald';
export type BodyType = 'hourglass' | 'pear' | 'apple' | 'straight' | 'athletic';
export type Top = 'bra' | 'tank' | 'tee' | 'long' | 'hoodie';
export type Bottom = 'leggings' | 'shorts' | 'joggers' | 'skirt';

export type Avatar = {
  skin: string;
  body: BodyType;
  eyes: string;
  hair: HairStyle;
  hairColor: string;
  /** Lipstick colour, '' = none. */
  lips: string;
  blush: boolean;
  liner: boolean;
  /** Eyeshadow colour, '' = none. */
  shadow: string;
  beard: boolean;
  top: Top;
  topColor: string;
  bottom: Bottom;
  bottomColor: string;
  shoes: string;
};

export const SKINS = ['#FBE3D3', '#F3CBAE', '#E7B48F', '#D29B72', '#B97E56', '#966042', '#74472F', '#55331F'];
export const HAIR_COLORS = ['#1B1210', '#3B2416', '#5E3A21', '#8A5A33', '#B9874E', '#E2C17E', '#A33A2A', '#7C7C86'];
export const EYE_COLORS = ['#3B2416', '#6B4423', '#5C7A3A', '#3F6E9E', '#7C8A96'];
export const LIPS = ['', '#C2566B', '#A3253A', '#D9787A', '#8C3B4F', '#B5655A'];
export const SHADOWS = ['', '#B88A6A', '#8E6BB5', '#D49A6A', '#5F8FB8', '#C2788E'];
export const CLOTHES = ['#0E1621', '#2E9BFF', '#FFD60A', '#19C37D', '#FF5C6C', '#F2A0C0', '#8B7CFF', '#FFFFFF', '#7C8A96', '#C9A27E'];
export const HAIRS_F: HairStyle[] = ['long', 'wavy', 'pony', 'bun', 'curly', 'bob', 'short', 'hijab'];
export const HAIRS_M: HairStyle[] = ['short', 'curly', 'bob', 'bald', 'long', 'bun'];
export const BODIES: BodyType[] = ['hourglass', 'pear', 'apple', 'straight', 'athletic'];
export const TOPS: Top[] = ['bra', 'tank', 'tee', 'long', 'hoodie'];
export const BOTTOMS: Bottom[] = ['leggings', 'shorts', 'joggers', 'skirt'];

export function defaultAvatar(sex: 'f' | 'm'): Avatar {
  return sex === 'm'
    ? { skin: SKINS[3], body: 'straight', eyes: EYE_COLORS[0], hair: 'short', hairColor: HAIR_COLORS[0], lips: '', blush: false, liner: false, shadow: '', beard: true, top: 'tee', topColor: CLOTHES[1], bottom: 'joggers', bottomColor: CLOTHES[0], shoes: CLOTHES[7] }
    : { skin: SKINS[2], body: 'hourglass', eyes: EYE_COLORS[1], hair: 'long', hairColor: HAIR_COLORS[1], lips: LIPS[1], blush: true, liner: true, shadow: '', beard: false, top: 'tank', topColor: CLOTHES[1], bottom: 'leggings', bottomColor: CLOTHES[0], shoes: CLOTHES[7] };
}

export const avatarOf = (p: Profile): Avatar => ({ ...defaultAvatar(p.sex), ...(p.avatar ?? {}) });

export const bmi = (kg: number, cm: number) => (cm > 0 ? kg / (cm / 100) ** 2 : 22);

/** Half-widths (from the body's centre line) of each part of the figure, in a 200 x 400 drawing. */
export type Shape = {
  shoulder: number; chest: number; waist: number; hip: number; thigh: number; knee: number;
  arm: number; forearm: number; cheek: number; neck: number; belly: number;
};

/** Body proportions for a BMI: 18 draws slim, 38 draws full; the body type shifts where the weight sits. */
export function shapeFor(b: number, body: BodyType, sex: 'f' | 'm'): Shape {
  const t = Math.max(0, Math.min(1, (b - 18) / 20));
  const s: Shape = {
    shoulder: 30 + t * 10, chest: 26 + t * 14, waist: 19 + t * 21, hip: 29 + t * 17, thigh: 13 + t * 9, knee: 8.5 + t * 3.5,
    arm: 6.5 + t * 5, forearm: 5 + t * 3, cheek: 22 + t * 5, neck: 7.5 + t * 2.5, belly: t * 6,
  };
  const adj: Record<BodyType, Partial<Shape>> = {
    hourglass: { waist: s.waist - 3, chest: s.chest + 1.5, hip: s.hip + 1.5 },
    pear: { hip: s.hip + 4, thigh: s.thigh + 2, shoulder: s.shoulder - 2, chest: s.chest - 1.5 },
    apple: { waist: s.waist + 4, belly: s.belly + 4, hip: s.hip - 1.5, thigh: s.thigh - 1 },
    straight: { waist: s.waist + 2, hip: s.hip - 2 },
    athletic: { shoulder: s.shoulder + 3, arm: s.arm + 1.5, waist: s.waist - 1, thigh: s.thigh + 1 },
  };
  Object.assign(s, adj[body]);
  if (sex === 'm') { s.shoulder += 4; s.chest += 2; s.hip -= 4; s.waist += 1; s.neck += 1.5; }
  s.waist = Math.min(s.waist, Math.max(s.chest, s.hip) + 2);
  return s;
}

const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Saves a new weight: one entry per day, the first ever entry is the starting point. */
export function logWeight(p: Profile, kg: number, date = todayKey()): Profile {
  const log = p.weights?.length ? p.weights : [{ d: p.start ?? date, kg: p.weight }];
  const [start, ...rest] = log;
  // The starting entry never changes; a second weigh-in on the same day replaces the first one.
  const later = [...rest.filter((w) => w.d !== date), { d: date, kg }].sort((x, y) => (x.d < y.d ? -1 : x.d > y.d ? 1 : 0));
  return { ...p, weight: kg, weights: [start, ...later] };
}

/** Starting weight and change so far (negative = lost). */
export function weightChange(p: Profile) {
  const start = p.weights?.[0]?.kg ?? p.weight;
  return { start, now: p.weight, diff: Math.round((p.weight - start) * 10) / 10 };
}
