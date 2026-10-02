// The person's avatar: what they pick (skin, hair, makeup, clothes) and the body shape that follows their weight.
import type { Profile } from './plan.ts';

export type HairStyle = 'long' | 'wavy' | 'pony' | 'bun' | 'curly' | 'bob' | 'short' | 'braid' | 'hijab' | 'quiff' | 'buzz' | 'bald';
export type BodyType = 'hourglass' | 'pear' | 'apple' | 'straight' | 'athletic';
export type Top = 'bra' | 'tank' | 'crop' | 'tee' | 'oversized' | 'long' | 'hoodie' | 'jacket' | 'tunic';
export type Bottom = 'leggings' | 'biker' | 'shorts' | 'joggers' | 'wide' | 'skirt' | 'maxi';

export type Avatar = {
  skin: string;
  body: BodyType;
  eyes: string;
  hair: HairStyle;
  hairColor: string;
  hijabColor: string;
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
export const HIJABS = ['#C9A27E', '#E8D9C4', '#0E1621', '#FFFFFF', '#7C8A96', '#F2A0C0', '#8C3B4F', '#2E9BFF', '#4F6B4A', '#8B7CFF'];
export const CLOTHES = ['#0E1621', '#2E9BFF', '#FFD60A', '#19C37D', '#FF5C6C', '#F2A0C0', '#8B7CFF', '#FFFFFF', '#7C8A96', '#C9A27E'];
export const HAIRS_F: HairStyle[] = ['long', 'wavy', 'pony', 'bun', 'curly', 'bob', 'braid', 'short', 'hijab'];
export const HAIRS_M: HairStyle[] = ['short', 'quiff', 'curly', 'buzz', 'long', 'bun', 'bald'];
export const BODIES: BodyType[] = ['hourglass', 'pear', 'apple', 'straight', 'athletic'];
export const TOPS: Top[] = ['bra', 'tank', 'crop', 'tee', 'oversized', 'long', 'hoodie', 'jacket', 'tunic'];
export const TOPS_M: Top[] = ['tank', 'tee', 'oversized', 'long', 'hoodie', 'jacket'];
export const BOTTOMS: Bottom[] = ['leggings', 'biker', 'shorts', 'joggers', 'wide', 'skirt', 'maxi'];
export const BOTTOMS_M: Bottom[] = ['shorts', 'joggers', 'wide'];

export function defaultAvatar(sex: 'f' | 'm'): Avatar {
  return sex === 'm'
    ? { skin: SKINS[3], body: 'straight', eyes: EYE_COLORS[0], hair: 'short', hairColor: HAIR_COLORS[0], hijabColor: '#C9A27E', lips: '', blush: false, liner: false, shadow: '', beard: true, top: 'tee', topColor: CLOTHES[1], bottom: 'joggers', bottomColor: CLOTHES[0], shoes: CLOTHES[7] }
    : { skin: SKINS[2], body: 'hourglass', eyes: EYE_COLORS[1], hair: 'long', hairColor: HAIR_COLORS[1], hijabColor: '#C9A27E', lips: LIPS[1], blush: true, liner: true, shadow: '', beard: false, top: 'tank', topColor: CLOTHES[1], bottom: 'leggings', bottomColor: CLOTHES[0], shoes: CLOTHES[7] };
}

export const avatarOf = (p: Profile): Avatar => ({ ...defaultAvatar(p.sex), ...(p.avatar ?? {}) });

export const bmi = (kg: number, cm: number) => (cm > 0 ? kg / (cm / 100) ** 2 : 22);

/** Half-widths (from the body's centre line) of each part of the figure, in a 200 x 400 drawing. */
export type Shape = {
  shoulder: number; chest: number; under: number; waist: number; belly: number; hip: number;
  thigh: number; knee: number; calf: number; ankle: number; arm: number; forearm: number; cheek: number; neck: number;
};

/** Body proportions for a BMI: 18 draws slim, 38 draws full; the body type shifts where the weight sits. */
export function shapeFor(b: number, body: BodyType, sex: 'f' | 'm'): Shape {
  const t = Math.max(0, Math.min(1, (b - 18) / 20));
  const s: Shape = {
    shoulder: 30 + t * 10, chest: 25 + t * 14, under: 21.5 + t * 14, waist: 18 + t * 20, belly: t * 6, hip: 28 + t * 16,
    thigh: 12.5 + t * 9, knee: 8 + t * 3.5, calf: 8.5 + t * 4, ankle: 4.6 + t * 1.4, arm: 5.6 + t * 4.4, forearm: 4.6 + t * 2.6,
    cheek: 24.5 + t * 4, neck: 8 + t * 2.5,
  };
  const adj: Record<BodyType, Partial<Shape>> = {
    hourglass: { waist: s.waist - 3, chest: s.chest + 1.5, hip: s.hip + 1.5 },
    pear: { hip: s.hip + 4, thigh: s.thigh + 2, shoulder: s.shoulder - 2, chest: s.chest - 1.5 },
    apple: { waist: s.waist + 4, under: s.under + 2, belly: s.belly + 4, hip: s.hip - 1.5, thigh: s.thigh - 1 },
    straight: { waist: s.waist + 2, hip: s.hip - 2 },
    athletic: { shoulder: s.shoulder + 3, arm: s.arm + 1.2, waist: s.waist - 1, thigh: s.thigh + 1, calf: s.calf + 1 },
  };
  Object.assign(s, adj[body]);
  if (sex === 'm') { s.shoulder += 5; s.chest += 3; s.under += 3; s.hip -= 4; s.waist += 2; s.neck += 2; s.arm += 1; }
  s.waist = Math.min(s.waist, Math.max(s.under, s.hip) + 2);
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
