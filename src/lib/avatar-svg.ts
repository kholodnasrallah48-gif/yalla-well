// Draws the avatar as an SVG string (soft shading, clean vector style). Pure, so the app, thumbnails and tests share it.
import { shapeFor, type Avatar, type Shape } from './avatar.ts';

type P = [number, number];
const CX = 100;
const f1 = (n: number) => (Math.round(n * 10) / 10).toString();

/** Smooth closed (or open) curve through the points. */
function smooth(pts: P[], closed = true): string {
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${f1(pts[0][0])} ${f1(pts[0][1])}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${f1(p1[0] + (p2[0] - p0[0]) / 6)} ${f1(p1[1] + (p2[1] - p0[1]) / 6)} ${f1(p2[0] - (p3[0] - p1[0]) / 6)} ${f1(p2[1] - (p3[1] - p1[1]) / 6)} ${f1(p2[0])} ${f1(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
/** Right-half points (x from the centre line) → a symmetric outline. */
const mirror = (r: P[]): P[] => [...r.map(([x, y]) => [CX + x, y] as P), ...[...r].reverse().map(([x, y]) => [CX - x, y] as P)];
const side = (pts: P[], sd: number): P[] => pts.map(([x, y]) => [CX + sd * x, y]);

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}
/** Lighter (k > 1) or darker (k < 1) version of a colour. */
function sh(hex: string, k: number): string {
  const c = rgb(hex).map((v) => (k <= 1 ? v * k : v + (255 - v) * (k - 1)));
  return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function mix(a: string, b: string, k: number): string {
  const x = rgb(a), y = rgb(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * k).toString(16).padStart(2, '0')).join('');
}
const light = (hex: string) => { const [r, g, b] = rgb(hex); return 0.299 * r + 0.587 * g + 0.114 * b > 200; };

export type Crop = 'full' | 'bust' | 'head' | 'face' | 'top' | 'bottom';
const VIEW: Record<Crop, string> = { full: '0 -14 200 404', bust: '14 -14 172 186', head: '44 -4 112 112', face: '60 30 80 80', top: '18 96 164 164', bottom: '24 200 152 190' };

// ---- body geometry ----
function torsoPts(s: Shape, fem: boolean): P[] {
  return mirror([
    [s.neck, 102], [s.neck + 9, 108], [s.shoulder - 4, 113], [s.shoulder, 124], [s.chest, 140],
    [s.chest + (fem ? 1.5 : 0), 152], [s.under, 168], [s.waist + s.belly * 0.3, 190], [s.waist + s.belly, 204],
    [s.hip, 226], [s.hip - 1, 244], [4, 252],
  ]);
}
const legC = (s: Shape) => Math.max(s.hip * 0.5, s.thigh + 1.5);
function legPts(s: Shape, sd: number, w = 0, flare = 0): P[] {
  const c = legC(s);
  return side([
    [s.hip - 1 + w, 232], [c + s.thigh + w, 262], [c + s.knee + 2 + w + flare * 0.4, 312], [c + s.calf + w + flare * 0.7, 336], [c + s.ankle + 1 + w + flare, 368],
    [c - s.ankle - w - flare * 0.6, 368], [c - s.calf + 2 - w - flare * 0.4, 338], [c - s.knee - w * 0.6, 314], [Math.max(1, c - s.thigh) - w * 0.4, 262], [1, 250],
  ], sd);
}
function armPts(s: Shape, sd: number, w = 0, to = 236): P[] {
  const x = s.shoulder;
  const all: P[] = [
    [x - 3, 114], [x + s.arm * 0.8 + w, 128], [x + s.arm * 0.55 + 4 + w, 184], [x + 5 + s.forearm * 0.7 + w, to],
    [x + 5 - s.forearm * 1.3 - w, to - 2], [x + 3 - s.arm * 1.15 - w, 182], [s.chest - 3, 142],
  ];
  return side(all, sd);
}
const handAt = (s: Shape, sd: number): P => [CX + sd * (s.shoulder + 5 - s.forearm * 0.3), 244];

// ---- the drawing ----
export function avatarSVG(a: Avatar, bmiValue: number, sex: 'f' | 'm', opts: { id?: string; crop?: Crop } = {}): string {
  const id = (opts.id ?? 'av').replace(/[^a-z0-9]/gi, '');
  const crop = opts.crop ?? 'full';
  const s = shapeFor(bmiValue, a.body, sex);
  const fem = sex === 'f';
  const t = Math.max(0, Math.min(1, (bmiValue - 18) / 20));
  const skin = a.skin, skinD = sh(skin, 0.86), skinDD = sh(skin, 0.72), skinL = sh(skin, 1.08);
  const hair = a.hairColor, hairD = sh(hair, 0.7), hairL = sh(hair, light(hair) ? 1.05 : 1.45);
  const hy = 60, cw = s.cheek;
  const top = a.top, bot = a.bottom;
  const out: string[] = [];
  const add = (x: string) => out.push(x);
  const G = (n: string) => `url(#${id}${n})`;

  // gradients
  const grad = (n: string, c: string, horiz = true, k1 = 0.84, k2 = 1.06) => horiz
    ? `<linearGradient id="${id}${n}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${sh(c, k1)}"/><stop offset=".45" stop-color="${sh(c, k2)}"/><stop offset=".6" stop-color="${sh(c, k2)}"/><stop offset="1" stop-color="${sh(c, k1)}"/></linearGradient>`
    : `<linearGradient id="${id}${n}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(c, k2)}"/><stop offset="1" stop-color="${sh(c, k1)}"/></linearGradient>`;
  const sleeveTo = ({ bra: 0, tank: 0, crop: 150, tee: 150, oversized: 172, long: 232, hoodie: 234, jacket: 232, tunic: 232 } as const)[top];
  const lipCol = a.lips || mix(sh(skin, 0.8), '#C46A6A', 0.45);
  add(`<defs>
    ${grad('sk', skin, true, 0.88, 1.04)}${grad('top', a.topColor, true, light(a.topColor) ? 0.88 : 0.78, 1.06)}${grad('bot', a.bottomColor, true, light(a.bottomColor) ? 0.88 : 0.76, 1.08)}
    ${grad('hr', hair, false, 0.72, light(hair) ? 1.02 : 1.25)}${grad('sh', a.shoes, false, 0.85, 1.04)}
    <radialGradient id="${id}face" cx=".45" cy=".42" r=".62"><stop offset="0" stop-color="${skinL}"/><stop offset=".7" stop-color="${skin}"/><stop offset="1" stop-color="${skinD}"/></radialGradient>
    <radialGradient id="${id}blush" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FF5F7E" stop-opacity=".42"/><stop offset="1" stop-color="#FF5F7E" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}lip" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sh(lipCol, 0.86)}"/><stop offset="1" stop-color="${sh(lipCol, 1.08)}"/></linearGradient>
    <linearGradient id="${id}neck" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skinDD}"/><stop offset=".55" stop-color="${skinD}"/><stop offset="1" stop-color="${skin}"/></linearGradient>
    <radialGradient id="${id}iris" cx=".5" cy=".45" r=".55"><stop offset="0" stop-color="${sh(a.eyes, 1.35)}"/><stop offset=".75" stop-color="${a.eyes}"/><stop offset="1" stop-color="${sh(a.eyes, 0.55)}"/></radialGradient>
    ${grad('hj', a.hijabColor, true, 0.8, 1.05)}
    <radialGradient id="${id}gnd" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#000" stop-opacity=".28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    ${[-1, 1].map((sd) => `<clipPath id="${id}eye${sd > 0 ? 'r' : 'l'}"><path d="${eyePath(CX + sd * 11, hy + 4, sd, a.eyeShape)}"/></clipPath>`).join('')}
    <clipPath id="${id}cTop"><rect x="0" y="${top === 'bra' ? 132 : top === 'crop' ? 100 : 100}" width="200" height="${({ bra: 40, tank: 136, crop: 84, tee: 140, oversized: 152, long: 140, hoodie: 150, jacket: 148, tunic: 196 } as const)[top] - (top === 'bra' ? 0 : 0)}"/></clipPath>
    <clipPath id="${id}sl"><rect x="0" y="100" width="200" height="${Math.max(1, sleeveTo - 100)}"/></clipPath>
    <clipPath id="${id}cBot"><rect x="0" y="212" width="200" height="${({ leggings: 154, biker: 76, shorts: 50, joggers: 154, wide: 156, skirt: 60, maxi: 152 } as const)[bot]}"/></clipPath>
  </defs>`);

  // ground shadow
  add(`<ellipse cx="100" cy="383" rx="${48 + t * 14}" ry="7" fill="${G('gnd')}"/>`);

  // ---- hair behind ----
  add(`<g transform="translate(100 100) scale(1.16) translate(-100 -100)">${hairBack(a, s, hy, G, hairD, fem)}</g>`);
  if (top === 'hoodie') add(`<path d="${smooth([[CX - s.neck - 16, 112], [CX - s.neck - 14, 96], [CX, 92], [CX + s.neck + 14, 96], [CX + s.neck + 16, 112], [CX, 118]])}" fill="${sh(a.topColor, 0.72)}"/>`);

  // ---- legs & feet ----
  const legs = [legPts(s, 1), legPts(s, -1)];
  legs.forEach((l) => add(`<path d="${smooth(l)}" fill="${G('sk')}"/>`));
  legs.forEach((l, i) => add(`<path d="M${f1(l[2][0] - (i ? -4 : 4))} 314 q${i ? 3 : -3} 3 ${i ? 7 : -7} 1" stroke="${skinD}" stroke-width="1" fill="none" opacity=".6"/>`));

  // ---- torso ----
  const body = smooth(torsoPts(s, fem));
  add(`<path d="${body}" fill="${G('sk')}"/>`);
  if (top === 'bra' || top === 'crop') add(`<path d="M${CX} 196 q-1 4 0 7" stroke="${skinDD}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".7"/>`);
  if (fem) add(`<path d="M${CX - s.chest + 6} 150 Q${CX - 8} ${163 + t * 3} ${CX - 2} 150 M${CX + s.chest - 6} 150 Q${CX + 8} ${163 + t * 3} ${CX + 2} 150" stroke="${skinD}" stroke-width="1.2" fill="none" opacity=".5"/>`);

  // ---- bottoms ----
  add(bottoms(a, s, body, G, id));

  // ---- top ----
  add(tops(a, s, body, G, id, skin, fem));

  // ---- arms ----
  const loose = top === 'oversized' || top === 'hoodie' || top === 'jacket' ? 2.5 : top === 'tunic' ? 1.5 : 0.8;
  [1, -1].forEach((sd) => {
    const arm = smooth(armPts(s, sd));
    add(`<path d="${arm}" fill="${G('sk')}"/>`);
    if (sleeveTo) {
      add(`<path d="${smooth(armPts(s, sd, loose))}" fill="${G('top')}" clip-path="url(#${id}sl)"/>`);
      const yy = sleeveTo - 2, ap = armPts(s, sd, loose);
      const k = (yy - 128) / (236 - 128);
      const xo = ap[1][0] + (ap[3][0] - ap[1][0]) * k, xi = ap[6][0] + (ap[4][0] - ap[6][0]) * k;
      if (sleeveTo > 200) add(`<path d="M${f1(xo)} ${yy - 4} L${f1(xi)} ${yy - 6}" stroke="${sh(a.topColor, 0.75)}" stroke-width="3.5" stroke-linecap="round"/>`);
      else add(`<path d="M${f1(xo)} ${yy} L${f1(xi + sd * 2)} ${yy - 4}" stroke="${sh(a.topColor, 0.82)}" stroke-width="1.4" stroke-linecap="round"/>`);
    }
    const [hx, hyy] = handAt(s, sd);
    const r = s.forearm + 1.6;
    add(`<path d="${smooth([[hx - r, hyy - 8], [hx + r, hyy - 8], [hx + r + 0.5, hyy + 2], [hx + r * 0.4, hyy + r + 3], [hx - r * 0.5, hyy + r + 2.5], [hx - r - 0.5, hyy + 1]])}" fill="${skin}"/>`);
    add(`<path d="M${f1(hx - sd * r * 0.9)} ${hyy - 4} q${-sd * 2.2} 4 ${-sd * 0.6} 8" stroke="${skinD}" stroke-width="1.1" fill="none"/>`);
  });

  // ---- shoes ----
  legs.forEach((l, i) => {
    const sd = i ? -1 : 1;
    const x = (l[4][0] + l[5][0]) / 2 + sd * 2;
    add(`<path d="${smooth([[x - 10, 376], [x - 9.5, 366], [x - 4, 360], [x + 5, 360], [x + 10, 366], [x + 11.5, 376]])}" fill="${G('sh')}"/>`);
    add(`<rect x="${f1(x - 11)}" y="374" width="23" height="6" rx="3" fill="${light(a.shoes) ? '#D9DEE5' : '#F4F6F8'}"/>`);
    add(`<path d="M${f1(x - 3)} 364 h6 M${f1(x - 3.5)} 367.5 h7" stroke="${light(a.shoes) ? '#B9C2CC' : sh(a.shoes, 1.5)}" stroke-width="1.1" stroke-linecap="round"/>`);
    add(`<path d="M${f1(x - 9)} 371 q${10} -4 ${20} 0" stroke="${light(a.shoes) ? CLR_ACCENT : '#FFFFFF'}" stroke-width="1.3" fill="none" opacity=".85"/>`);
  });

  // ---- neck & head (drawn slightly larger, for the friendly big-head look) ----
  if (a.hair !== 'hijab') add(`<path d="M${CX - s.neck} 84 L${CX - s.neck - 0.5} 106 Q${CX} 112 ${CX + s.neck + 0.5} 106 L${CX + s.neck} 84 Z" fill="${G('neck')}"/>`);
  add(`<g transform="translate(100 100) scale(1.16) translate(-100 -100)">`);
  if (a.hair === 'hijab') add(hijabBack(a, s, hy, G));
  // ears (+ earrings)
  const ek = { small: 0.8, normal: 1, big: 1.25 }[a.ears];
  [1, -1].forEach((sd) => add(`<path d="${smooth(side([[cw - 2, hy - 3], [cw + 4.5 * ek, hy - 1], [cw + 5 * ek, hy + 8], [cw + 1 + ek, hy + 14], [cw - 2, hy + 12]], sd))}" fill="${skinD}"/><path d="M${CX + sd * (cw + 1)} ${hy + 1} q${sd * 2.5 * ek} 3 ${sd * 0.5} 8" stroke="${skinDD}" stroke-width="1" fill="none"/>`));
  if (a.hair !== 'hijab') add(earrings(a, cw, hy));
  add(`<path d="${facePath(a.face, cw, hy)}" fill="${G('face')}"/>`);
  // soft light: forehead and cheek highlights, shade under the hairline
  add(`<ellipse cx="${CX - 4}" cy="${hy - 16}" rx="12" ry="7" fill="#fff" opacity=".13"/><ellipse cx="${CX - cw * 0.55}" cy="${hy + 12}" rx="6" ry="4" fill="#fff" opacity=".1"/><ellipse cx="${CX + cw * 0.55}" cy="${hy + 12}" rx="6" ry="4" fill="#fff" opacity=".08"/>`);
  if (a.freckles) add([[-15, 13], [-12, 16], [-17, 17], [-10, 12], [15, 13], [12, 16], [17, 17], [10, 12], [-3, 14], [3, 14]].map(([x, y]) => `<circle cx="${CX + x}" cy="${hy + y}" r=".75" fill="${skinDD}" opacity=".7"/>`).join(''));
  if (a.facial !== 'none') add(facialHair(a.facial, a.face, cw, hy, hair, hairD));

  // eyes
  [-1, 1].forEach((sd) => {
    const ex = CX + sd * 11, ey = hy + 4, cid = `${id}eye${sd > 0 ? 'r' : 'l'}`;
    const ep = eyePath(ex, ey, sd, a.eyeShape);
    const lid = lidPath(ex, ey, sd, a.eyeShape);
    if (a.shadow) add(`<path d="M${ex - sd * 7.5} ${ey + 0.5} Q${ex} ${ey - 11} ${ex + sd * 8.5} ${ey - 0.5} Q${ex} ${ey - 5} ${ex - sd * 7.5} ${ey + 0.5}Z" fill="${a.shadow}" opacity=".6"/>`);
    add(`<path d="M${ex - sd * 6} ${ey - (a.eyeShape === 'hooded' ? 4.6 : 6.8)} Q${ex} ${ey - (a.eyeShape === 'hooded' ? 7.6 : 10.8)} ${ex + sd * 7} ${ey - (a.eyeShape === 'hooded' ? 3.4 : 5)}" stroke="${skinD}" stroke-width="${a.eyeShape === 'hooded' ? 1.6 : 0.9}" fill="none" opacity=".6"/>`);
    add(`<path d="${ep}" fill="#FAFAFA"/>`);
    add(`<g clip-path="url(#${cid})"><circle cx="${ex + sd * 0.4}" cy="${ey}" r="4.7" fill="${G('iris')}"/><circle cx="${ex + sd * 0.4}" cy="${ey}" r="2.1" fill="#0C0A0A"/><path d="${ep}" fill="none" stroke="#000" stroke-opacity=".14" stroke-width="2.6"/></g>`);
    add(`<circle cx="${ex + sd * 0.4 + 1.6}" cy="${ey - 1.6}" r="1.3" fill="#fff"/><circle cx="${ex + sd * 0.4 - 1.2}" cy="${ey + 1.3}" r=".5" fill="#fff" opacity=".8"/>`);
    add(`<path d="${lid}${a.liner ? ` q${sd * 1.6} -0.6 ${sd * 2.8} -2.4` : ''}" stroke="#1A1212" stroke-width="${a.lashes ? 1.6 : 1.15}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`);
    if (a.lashes) add(`<path d="M${ex + sd * 4.6} ${ey - 3.6 + lift(a.eyeShape)} q${sd * 1.2} -0.9 ${sd * 2.4} -1.1 M${ex + sd * 6.2} ${ey - 1.8 + lift(a.eyeShape)} q${sd * 1.2} -0.5 ${sd * 2.3} -0.4" stroke="#1A1212" stroke-width=".8" fill="none" stroke-linecap="round"/>`);
    const bc = a.hair === 'bald' || a.hair === 'buzz' ? sh(hair, 0.8) : a.hair === 'hijab' ? '#3A2618' : hairD;
    add(`<path d="${browPath(ex, ey, sd, a.brows)}" fill="${bc}"/>`);
  });
  add(nosePath(a.nose, hy, skinD, skinDD));
  if (a.blush) add(`<ellipse cx="${CX - 15.5}" cy="${hy + 15}" rx="7.5" ry="5" fill="${G('blush')}"/><ellipse cx="${CX + 15.5}" cy="${hy + 15}" rx="7.5" ry="5" fill="${G('blush')}"/>`);
  add(lipsPath(a.mouth, hy + 26.5, lipCol, G));

  // ---- hair in front, then glasses and headwear ----
  add(a.hair === 'hijab' ? hijabFront(a, s, hy, G) : hairFront(a, s, hy, G, hairD, hairL, fem));
  if (a.glasses !== 'none') add(glasses(a.glasses, a.glassesColor, cw, hy));
  if (a.headwear !== 'none' && a.hair !== 'hijab') add(headwear(a.headwear, a.headwearColor, cw, hy));
  add('</g>');

  const vb = VIEW[crop];
  const [, , w, h] = vb.split(' ').map(Number);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${w}" height="${h}">${out.join('')}</svg>`;
}
const CLR_ACCENT = '#2E9BFF';

type EyeShape = Avatar['eyeShape'];
/** How much the outer corner rises (negative) or drops for each eye shape. */
const lift = (e: EyeShape) => ({ almond: 0, round: 0, hooded: 0.6, upturned: -1.6, downturned: 1.6 })[e];
function eyePath(ex: number, ey: number, sd: number, e: EyeShape) {
  const h = e === 'round' ? 9.4 : e === 'hooded' ? 6.2 : 8, lo = e === 'round' ? 7 : 6, o = lift(e);
  return `M${ex - sd * 6.6} ${ey + 0.8} Q${ex - sd * 1.2} ${ey - h} ${ex + sd * 6.8} ${ey - 0.2 + o} Q${ex + sd * 0.6} ${ey + lo} ${ex - sd * 6.6} ${ey + 0.8}Z`;
}
function lidPath(ex: number, ey: number, sd: number, e: EyeShape) {
  const h = e === 'round' ? 9.6 : e === 'hooded' ? 6.2 : 8.2, o = lift(e);
  return `M${ex - sd * 6.8} ${ey + 0.6} Q${ex - sd * 1.2} ${ey - h} ${ex + sd * 7} ${ey - 0.4 + o}`;
}
function browPath(ex: number, ey: number, sd: number, b: Avatar['brows']) {
  const [th, arch, len] = ({ natural: [1.4, 13.8, 8.8], thin: [0.6, 13.4, 8.4], thick: [2.6, 14, 9.2], arched: [1.3, 16, 8.6], straight: [1.6, 11.4, 9] } as const)[b];
  return `M${ex - sd * 7.8} ${ey - 8.2} Q${ex - sd * 0.5} ${ey - arch - th} ${ex + sd * len} ${ey - 9.8 + (b === 'straight' ? -1.2 : 0)} Q${ex} ${ey - arch + 2.6 - th * 0.3} ${ex - sd * 7.4} ${ey - 5.6 - th}Z`;
}
function facePath(f: Avatar['face'], cw: number, hy: number) {
  const [top, jaw, jawY, chin, len] = ({ oval: [6, 4, 24, 9, 36.5], round: [5, 1.5, 24, 12, 34], heart: [3, 7, 22, 6, 37], square: [5, 0.5, 26, 13, 35], long: [6, 4.5, 27, 9, 40] } as const)[f];
  return smooth([
    [CX, hy - 34], [CX + cw - top, hy - 28], [CX + cw, hy - 10], [CX + cw + 0.5, hy + 8], [CX + cw - jaw, hy + jawY], [CX + chin, hy + len - 2.5], [CX, hy + len],
    [CX - chin, hy + len - 2.5], [CX - cw + jaw, hy + jawY], [CX - cw - 0.5, hy + 8], [CX - cw, hy - 10], [CX - cw + top, hy - 28],
  ]);
}
function nosePath(n: Avatar['nose'], hy: number, d: string, dd: string) {
  const [w, len, tip] = ({ small: [3.6, 16, 1.4], button: [4, 15, 2.4], straight: [4.4, 18, 1.6], wide: [6, 17, 2], pointed: [3.8, 19, 1.2] } as const)[n];
  return `<path d="M${CX + 2} ${hy + 4} Q${CX + 4.6} ${hy + len - 4} ${CX + w - 0.6} ${hy + len}" stroke="${d}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".7"/>`
    + `<path d="M${CX - w} ${hy + len + 1} q2 1.6 ${w - 1.2} 0.4 M${CX + w} ${hy + len + 1} q-2 1.6 ${-(w - 1.2)} 0.4" stroke="${dd}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="${CX + 0.6}" cy="${hy + len - 2.5}" rx="${tip}" ry="${tip * 0.7}" fill="#fff" opacity=".35"/>`;
}
function lipsPath(m: Avatar['mouth'], my: number, col: string, G: (n: string) => string) {
  const [w, up, lo] = ({ natural: [8, 3.8, 6.5], full: [8.6, 5, 8.4], thin: [8, 2.4, 4.4], wide: [10.5, 3.6, 6], heart: [7, 5, 6.4] } as const)[m];
  const dip = m === 'heart' ? 3.4 : 2.2;
  return `<path d="M${CX - w} ${my} Q${CX - w / 2} ${my - up} ${CX} ${my - dip} Q${CX + w / 2} ${my - up} ${CX + w} ${my} Q${CX} ${my + 1} ${CX - w} ${my}Z" fill="${sh(col, 0.86)}"/>`
    + `<path d="M${CX - w} ${my} Q${CX - w / 2} ${my + lo} ${CX} ${my + lo - 0.2} Q${CX + w / 2} ${my + lo} ${CX + w} ${my} Q${CX} ${my + 1.2} ${CX - w} ${my}Z" fill="${G('lip')}"/>`
    + `<path d="M${CX - w - 0.6} ${my - 0.4} Q${CX} ${my + 1.8} ${CX + w + 0.6} ${my - 0.4}" stroke="${sh(col, 0.55)}" stroke-width=".9" fill="none" stroke-linecap="round"/>`
    + `<ellipse cx="${CX + 1}" cy="${my + lo * 0.55}" rx="${w * 0.36}" ry="1" fill="#fff" opacity=".28"/>`;
}
function earrings(a: Avatar, cw: number, hy: number) {
  const gold = '#E8C15A';
  return [1, -1].map((sd) => {
    const x = CX + sd * (cw + 2.6), y = hy + 14;
    if (a.earrings === 'studs') return `<circle cx="${x}" cy="${y}" r="1.7" fill="#F4F7FA" stroke="#B9C2CC" stroke-width=".5"/>`;
    if (a.earrings === 'hoops') return `<circle cx="${x}" cy="${y + 5}" r="5" fill="none" stroke="${gold}" stroke-width="1.4"/>`;
    if (a.earrings === 'drops') return `<path d="M${x} ${y} v4" stroke="${gold}" stroke-width=".9"/><path d="M${x} ${y + 3.5} q3 4 0 7.5 q-3 -3.5 0 -7.5Z" fill="${gold}"/>`;
    return '';
  }).join('');
}
function facialHair(k: Avatar['facial'], f: Avatar['face'], cw: number, hy: number, hair: string, hairD: string) {
  if (k === 'stubble') return `<path d="${smooth([[CX - cw + 0.5, hy + 6], [CX - cw + 3, hy + 22], [CX - 9, hy + 34], [CX, hy + 36.5], [CX + 9, hy + 34], [CX + cw - 3, hy + 22], [CX + cw - 0.5, hy + 6], [CX + cw - 6, hy + 18], [CX, hy + 20], [CX - cw + 6, hy + 18]])}" fill="${hair}" opacity=".28"/>`;
  const must = `<path d="M${CX - 10} ${hy + 25} Q${CX - 5} ${hy + 20} ${CX} ${hy + 22} Q${CX + 5} ${hy + 20} ${CX + 10} ${hy + 25} Q${CX + 5} ${hy + 23} ${CX} ${hy + 24} Q${CX - 5} ${hy + 23} ${CX - 10} ${hy + 25}Z" fill="${hair}"/>`;
  if (k === 'mustache') return must;
  if (k === 'goatee') return must + `<path d="${smooth([[CX - 7, hy + 31], [CX, hy + 30.5], [CX + 7, hy + 31], [CX + 5, hy + 38], [CX, hy + 40], [CX - 5, hy + 38]])}" fill="${hair}"/>`;
  return `<path d="${smooth([
    [CX - cw + 0.5, hy + 4], [CX - cw + 2, hy + 18], [CX - cw + 7, hy + 28], [CX - 8, hy + 36], [CX, hy + 39], [CX + 8, hy + 36], [CX + cw - 7, hy + 28], [CX + cw - 2, hy + 18], [CX + cw - 0.5, hy + 4],
    [CX + cw - 5, hy + 15], [CX + 9, hy + 22], [CX + 4, hy + 21], [CX, hy + 22], [CX - 4, hy + 21], [CX - 9, hy + 22], [CX - cw + 5, hy + 15],
  ])}" fill="${hair}" opacity=".93"/><path d="M${CX - 9} ${hy + 31} Q${CX} ${hy + 36} ${CX + 9} ${hy + 31}" stroke="${hairD}" stroke-width="1" fill="none" opacity=".5"/>`;
}
function glasses(k: Avatar['glasses'], col: string, cw: number, hy: number) {
  const ey = hy + 4, sun = k === 'sun';
  const lens = (ex: number, sd: number) => {
    if (k === 'round') return `<circle cx="${ex}" cy="${ey}" r="8.4"/>`;
    if (k === 'square') return `<rect x="${ex - 9}" y="${ey - 7}" width="18" height="13.5" rx="3"/>`;
    if (k === 'cateye') return `<path d="M${ex - sd * 8.5} ${ey - 4} Q${ex} ${ey - 9} ${ex + sd * 10.5} ${ey - 8} Q${ex + sd * 9} ${ey + 7.5} ${ex} ${ey + 7} Q${ex - sd * 9} ${ey + 6} ${ex - sd * 8.5} ${ey - 4}Z"/>`;
    return `<path d="M${ex - sd * 9} ${ey - 6} Q${ex} ${ey - 8.5} ${ex + sd * 9.5} ${ey - 6} Q${ex + sd * 10} ${ey + 4} ${ex + sd * 2} ${ey + 8} Q${ex - sd * 8} ${ey + 8} ${ex - sd * 9} ${ey - 6}Z"/>`;
  };
  let o = '';
  for (const sd of [-1, 1]) {
    const ex = CX + sd * 11;
    o += `<g fill="${sun ? '#1A2230' : '#DDEBFF'}" fill-opacity="${sun ? 0.88 : 0.14}" stroke="${col}" stroke-width="${k === 'round' ? 1.4 : 1.8}">${lens(ex, sd)}</g>`;
    o += `<path d="M${ex - 4} ${ey - 4} l3 -2" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity="${sun ? 0.5 : 0.6}"/>`;
    o += `<path d="M${CX + sd * 20} ${ey - 3} L${CX + sd * (cw + 1)} ${ey - 4}" stroke="${col}" stroke-width="1.6"/>`;
  }
  return o + `<path d="M${CX - 3} ${ey - 2} Q${CX} ${ey - 4.5} ${CX + 3} ${ey - 2}" stroke="${col}" stroke-width="1.6" fill="none"/>`;
}
function headwear(k: Avatar['headwear'], col: string, cw: number, hy: number) {
  const d = sh(col, light(col) ? 0.8 : 0.68), l = sh(col, light(col) ? 1 : 1.3);
  if (k === 'headband') return `<path d="M${CX - cw - 1} ${hy - 16} Q${CX} ${hy - 32} ${CX + cw + 1} ${hy - 16}" stroke="${col}" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M${CX - cw} ${hy - 18} Q${CX} ${hy - 33} ${CX + cw} ${hy - 18}" stroke="${l}" stroke-width="1" fill="none" opacity=".6"/>`;
  if (k === 'cap') return `<path d="${smooth([[CX - cw - 2, hy - 14], [CX - cw + 1, hy - 34], [CX, hy - 45], [CX + cw - 1, hy - 34], [CX + cw + 2, hy - 14], [CX, hy - 18]])}" fill="${col}"/><path d="M${CX - cw - 1} ${hy - 16} Q${CX} ${hy - 26} ${CX + cw + 1} ${hy - 16} Q${CX + cw * 0.7} ${hy - 6} ${CX} ${hy - 7} Q${CX - cw * 0.7} ${hy - 6} ${CX - cw - 1} ${hy - 16}Z" fill="${d}"/><circle cx="${CX}" cy="${hy - 44}" r="2" fill="${d}"/><path d="M${CX} ${hy - 43} V${hy - 21}" stroke="${d}" stroke-width=".8" opacity=".6"/>`;
  if (k === 'beanie') return `<path d="${smooth([[CX - cw - 3, hy - 14], [CX - cw, hy - 36], [CX, hy - 48], [CX + cw, hy - 36], [CX + cw + 3, hy - 14], [CX, hy - 18]])}" fill="${col}"/><path d="M${CX - cw - 3.5} ${hy - 22} Q${CX} ${hy - 30} ${CX + cw + 3.5} ${hy - 22} L${CX + cw + 3} ${hy - 12} Q${CX} ${hy - 19} ${CX - cw - 3} ${hy - 12}Z" fill="${d}"/>${[-12, -6, 0, 6, 12].map((x) => `<path d="M${CX + x} ${hy - 26 + Math.abs(x) * 0.08} v8" stroke="${sh(d, 0.85)}" stroke-width=".8"/>`).join('')}`;
  // bucket hat
  return `<path d="${smooth([[CX - cw + 1, hy - 18], [CX - cw + 3, hy - 38], [CX, hy - 44], [CX + cw - 3, hy - 38], [CX + cw - 1, hy - 18]])}" fill="${col}"/><path d="M${CX - cw - 10} ${hy - 10} Q${CX} ${hy - 26} ${CX + cw + 10} ${hy - 10} Q${CX} ${hy - 16} ${CX - cw - 10} ${hy - 10}Z" fill="${d}"/><path d="M${CX - cw + 2} ${hy - 22} Q${CX} ${hy - 28} ${CX + cw - 2} ${hy - 22}" stroke="${l}" stroke-width="1.6" fill="none" opacity=".6"/>`;
}

// ---- hair ----
function hairBack(a: Avatar, s: Shape, hy: number, G: (n: string) => string, hairD: string, fem: boolean): string {
  const cw = s.cheek, h = a.hair;
  if (h === 'long') return `<path d="${smooth([[CX - cw - 4, hy - 20], [CX - cw - 9, hy + 30], [CX - cw - 11, hy + 92], [CX - cw + 4, hy + 102], [CX, hy + 96], [CX + cw - 4, hy + 102], [CX + cw + 11, hy + 92], [CX + cw + 9, hy + 30], [CX + cw + 4, hy - 20], [CX, hy - 40]])}" fill="${hairD}"/>`;
  if (h === 'wavy') {
    const pts: P[] = [[CX - cw - 6, hy - 20]];
    for (let i = 1; i <= 6; i++) pts.push([CX - cw - 11 - (i % 2 ? 5 : 0), hy - 10 + i * 17]);
    pts.push([CX - 14, hy + 102], [CX, hy + 96], [CX + 14, hy + 102]);
    for (let i = 6; i >= 1; i--) pts.push([CX + cw + 11 + (i % 2 ? 5 : 0), hy - 10 + i * 17]);
    pts.push([CX + cw + 6, hy - 20], [CX, hy - 42]);
    return `<path d="${smooth(pts)}" fill="${hairD}"/>`;
  }
  if (h === 'bob') return `<path d="${smooth([[CX - cw - 5, hy - 20], [CX - cw - 9, hy + 18], [CX - cw - 6, hy + 40], [CX - cw + 6, hy + 44], [CX + cw - 6, hy + 44], [CX + cw + 6, hy + 40], [CX + cw + 9, hy + 18], [CX + cw + 5, hy - 20], [CX, hy - 42]])}" fill="${hairD}"/>`;
  if (h === 'curly') {
    let o = '';
    for (let i = 0; i < 18; i++) {
      const ang = Math.PI * (0.92 + (i / 17) * 1.16);
      const r = 11 + (i % 3) * 1.5;
      o += `<circle cx="${f1(CX + Math.cos(ang) * (cw + 11))}" cy="${f1(hy - 4 + Math.sin(ang) * -(cw + 14) * -1)}" r="${r}" fill="${hairD}"/>`;
    }
    for (const sd of [-1, 1]) for (let j = 0; j < 4; j++) o += `<circle cx="${CX + sd * (cw + 9 - j * 0.5)}" cy="${hy + 2 + j * 12}" r="${11 - j}" fill="${hairD}"/>`;
    return o;
  }
  if (h === 'pony') return `<path d="${smooth([[CX + cw - 6, hy - 30], [CX + cw + 12, hy - 22], [CX + cw + 20, hy + 10], [CX + cw + 16, hy + 54], [CX + cw + 8, hy + 82], [CX + cw + 4, hy + 50], [CX + cw + 6, hy + 10], [CX + cw - 2, hy - 14]])}" fill="${G('hr')}"/><path d="M${CX + cw + 10} ${hy - 6} q6 30 -2 72" stroke="${hairD}" stroke-width="1.2" fill="none" opacity=".6"/>`;
  if (h === 'bun') return `<circle cx="${CX}" cy="${hy - 40}" r="${fem ? 14 : 10}" fill="${G('hr')}"/><path d="M${CX - 8} ${hy - 44} q8 -8 16 0 M${CX - 6} ${hy - 38} q6 5 12 0" stroke="${hairD}" stroke-width="1.2" fill="none" opacity=".6"/>`;
  if (h === 'braid') return '';
  return '';
}

function hairFront(a: Avatar, s: Shape, hy: number, G: (n: string) => string, hairD: string, hairL: string, fem: boolean): string {
  const cw = s.cheek, h = a.hair;
  if (h === 'bald') return '';
  if (h === 'buzz') return `<path d="${smooth([[CX - cw - 0.5, hy - 2], [CX - cw + 1, hy - 22], [CX - 12, hy - 34], [CX + 12, hy - 34], [CX + cw - 1, hy - 22], [CX + cw + 0.5, hy - 2], [CX + cw - 3, hy - 14], [CX + 10, hy - 22], [CX - 10, hy - 22], [CX - cw + 3, hy - 14]])}" fill="${a.hairColor}" opacity=".75"/>`;
  if (h === 'curly') {
    let o = `<path d="${smooth([[CX - cw - 2, hy + 4], [CX - cw, hy - 24], [CX, hy - 40], [CX + cw, hy - 24], [CX + cw + 2, hy + 4], [CX + cw - 4, hy - 14], [CX, hy - 22], [CX - cw + 4, hy - 14]])}" fill="${G('hr')}"/>`;
    for (let i = 0; i < 11; i++) {
      const ang = Math.PI * (1.06 + (i / 10) * 0.88);
      o += `<circle cx="${f1(CX + Math.cos(ang) * (cw - 2))}" cy="${f1(hy - 8 + Math.sin(ang) * (cw + 4))}" r="${7.5 + (i % 2) * 1.5}" fill="${G('hr')}"/>`;
      o += `<path d="M${f1(CX + Math.cos(ang) * (cw - 2) - 3)} ${f1(hy - 10 + Math.sin(ang) * (cw + 4))} q3 -3 6 0" stroke="${hairL}" stroke-width="1" fill="none" opacity=".55"/>`;
    }
    return o;
  }
  // skull cap shared by most styles; hairline differs
  const capOuter: P[] = [[CX - cw - 2.5, hy + 10], [CX - cw - 1, hy - 22], [CX - 14, hy - 39], [CX + 14, hy - 39], [CX + cw + 1, hy - 22], [CX + cw + 2.5, hy + 10]];
  const lines = (pts: string[]) => pts.map((d) => `<path d="${d}" stroke="${hairL}" stroke-width="1.1" fill="none" stroke-linecap="round" opacity=".38"/>`).join('');
  if (h === 'short' && !fem) {
    return `<path d="${smooth([[CX - cw - 1, hy - 2], [CX - cw, hy - 24], [CX - 12, hy - 40], [CX + 14, hy - 41], [CX + cw, hy - 24], [CX + cw + 1, hy - 2], [CX + cw - 3, hy - 14], [CX + 14, hy - 21], [CX - 6, hy - 22], [CX - cw + 3, hy - 13]])}" fill="${G('hr')}"/>` + lines([`M${CX - 12} ${hy - 32} q10 -6 22 -3`, `M${CX - 4} ${hy - 26} q10 -5 18 -1`]);
  }
  if (h === 'quiff') {
    return `<path d="${smooth([[CX - cw - 1, hy - 2], [CX - cw, hy - 24], [CX - 16, hy - 44], [CX + 4, hy - 52], [CX + 22, hy - 44], [CX + cw, hy - 24], [CX + cw + 1, hy - 2], [CX + cw - 3, hy - 14], [CX + 12, hy - 22], [CX - 8, hy - 22], [CX - cw + 3, hy - 13]])}" fill="${G('hr')}"/>` + lines([`M${CX - 12} ${hy - 38} q12 -10 28 -4`, `M${CX - 6} ${hy - 30} q12 -8 24 -2`]);
  }
  if (h === 'short') { // pixie
    return `<path d="${smooth([[CX - cw - 2, hy + 4], [CX - cw - 1, hy - 24], [CX - 10, hy - 41], [CX + 16, hy - 40], [CX + cw + 1, hy - 22], [CX + cw + 2, hy + 4], [CX + cw - 3, hy - 8], [CX + 10, hy - 14], [CX - 6, hy - 12], [CX - cw + 6, hy - 4], [CX - cw + 3, hy - 14]])}" fill="${G('hr')}"/>` + lines([`M${CX - 16} ${hy - 30} q14 -8 30 -2`, `M${CX - 8} ${hy - 22} q12 -3 22 4`]);
  }
  if (h === 'bun' || h === 'pony' || h === 'braid') {
    let o = `<path d="${smooth([...capOuter, [CX + cw - 3, hy - 6], [CX + 8, hy - 24], [CX - 6, hy - 25], [CX - cw + 3, hy - 6]])}" fill="${G('hr')}"/>` + lines([`M${CX - 18} ${hy - 26} Q${CX} ${hy - 38} ${CX + 18} ${hy - 26}`, `M${CX - 8} ${hy - 30} q8 -5 16 0`]);
    if (h === 'braid') {
      const sd = -1;
      for (let i = 0; i < 8; i++) {
        const y = hy + 14 + i * 13, x = CX + sd * (cw + 4 - i * 0.6);
        o += `<ellipse cx="${f1(x - sd * (i % 2 ? 2 : -2))}" cy="${y}" rx="${7 - i * 0.4}" ry="8" fill="${G('hr')}" transform="rotate(${i % 2 ? 25 : -25} ${f1(x)} ${y})"/>`;
      }
      o += `<rect x="${CX + sd * (cw + 4 - 4.8) - 3}" y="${hy + 114}" width="6" height="4" rx="2" fill="${CLR_ACCENT}"/>`;
    }
    return o;
  }
  // long, wavy, bob: side part, locks falling in front of the shoulders
  let o = `<path d="${smooth([...capOuter, [CX + cw - 1.5, hy + 6], [CX + cw - 5, hy - 14], [CX + 6, hy - 27], [CX - 12, hy - 18], [CX - cw + 2, hy - 2]])}" fill="${G('hr')}"/>`;
  o += lines([`M${CX - 4} ${hy - 30} Q${CX - 22} ${hy - 24} ${CX - cw + 1} ${hy - 4}`, `M${CX + 8} ${hy - 32} Q${CX + cw} ${hy - 26} ${CX + cw + 1} ${hy}`]);
  if (h === 'long' || h === 'wavy') {
    for (const sd of [-1, 1]) {
      const w = h === 'wavy' ? 3 : 0;
      const lock: P[] = side([[cw - 1, hy - 2], [cw + 5, hy], [cw + 9 + w, hy + 40], [cw + 6 - w, hy + 66], [cw + 9 + w, hy + 94], [cw, hy + 88], [cw - 2 + w, hy + 60], [cw - 1 - w, hy + 30]], sd);
      o += `<path d="${smooth(lock)}" fill="${G('hr')}"/><path d="M${CX + sd * (cw + 1)} ${hy + 14} q${sd * 4} 30 ${sd * 2} 66" stroke="${hairL}" stroke-width="1.2" fill="none" opacity=".45"/>`;
    }
  }
  if (h === 'bob') for (const sd of [-1, 1]) o += `<path d="${smooth(side([[cw - 1, hy - 2], [cw + 5, hy], [cw + 8, hy + 30], [cw + 3, hy + 42], [cw - 1, hy + 32]], sd))}" fill="${G('hr')}"/>`;
  return o;
}

function hijabBack(a: Avatar, s: Shape, hy: number, G: (n: string) => string): string {
  const cw = s.cheek, c = a.hijabColor;
  return `<path d="${smooth([[CX - cw - 10, hy - 18], [CX - cw - 9, hy + 30], [CX - s.shoulder - 3, hy + 62], [CX - s.chest - 1, hy + 100], [CX, hy + 108], [CX + s.chest + 1, hy + 100], [CX + s.shoulder + 3, hy + 62], [CX + cw + 9, hy + 30], [CX + cw + 10, hy - 18], [CX, hy - 46]])}" fill="${G('hj')}"/>
  <path d="M${CX - cw + 2} ${hy + 50} Q${CX} ${hy + 64} ${CX + cw - 2} ${hy + 50} M${CX - cw + 6} ${hy + 66} Q${CX} ${hy + 80} ${CX + cw - 4} ${hy + 64}" stroke="${sh(c, 0.72)}" stroke-width="1.4" fill="none" opacity=".7"/>`;
}
function hijabFront(a: Avatar, s: Shape, hy: number, G: (n: string) => string): string {
  const cw = s.cheek, c = a.hijabColor;
  return `<path d="M${CX - cw - 1} ${hy + 30} Q${CX - cw - 6} ${hy - 36} ${CX} ${hy - 38} Q${CX + cw + 6} ${hy - 36} ${CX + cw + 1} ${hy + 30}" stroke="${G('hj')}" stroke-width="11" fill="none" stroke-linecap="round"/>
  <path d="M${CX - cw + 3} ${hy + 22} Q${CX - cw} ${hy - 28} ${CX} ${hy - 30} Q${CX + cw} ${hy - 28} ${CX + cw - 3} ${hy + 22}" stroke="${sh(c, 0.86)}" stroke-width="2.2" fill="none"/>
  <path d="M${CX + cw} ${hy + 26} Q${CX + 8} ${hy + 50} ${CX - cw + 1} ${hy + 30}" stroke="${G('hj')}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
}

// ---- clothes ----
function bottoms(a: Avatar, s: Shape, body: string, G: (n: string) => string, id: string): string {
  const b = a.bottom, col = a.bottomColor;
  const dark = sh(col, light(col) ? 0.8 : 0.65), hi = sh(col, light(col) ? 0.92 : 1.35);
  let o = '';
  if (b === 'skirt' || b === 'maxi') {
    const end = b === 'skirt' ? 272 : 364, fl = b === 'skirt' ? 10 : 14 + s.hip * 0.2;
    o += `<path d="${smooth([[CX - s.waist - s.belly + 1, 210], [CX - s.hip - 1, 232], [CX - s.hip - fl, end], [CX, end + 2], [CX + s.hip + fl, end], [CX + s.hip + 1, 232], [CX + s.waist + s.belly - 1, 210]])}" fill="${G('bot')}"/>`;
    for (const k of [-0.55, -0.2, 0.2, 0.55]) o += `<path d="M${f1(CX + k * s.hip)} 230 L${f1(CX + k * (s.hip + fl) * 1.05)} ${end - 2}" stroke="${dark}" stroke-width="1" opacity=".5"/>`;
  } else {
    const w = b === 'joggers' ? 3 : b === 'wide' ? 4 : b === 'shorts' ? 3.5 : 0.7;
    const flare = b === 'wide' ? 10 : 0;
    o += `<g clip-path="url(#${id}cBot)"><path d="${body}" fill="${G('bot')}"/>${[1, -1].map((sd) => `<path d="${smooth(legPts(s, sd, w, flare))}" fill="${G('bot')}"/>`).join('')}</g>`;
    if (b === 'leggings' || b === 'biker') o += [1, -1].map((sd) => `<path d="M${CX + sd * (legC(s) + s.thigh * 0.8)} 240 L${CX + sd * (legC(s) + s.knee + 1)} ${b === 'biker' ? 286 : 360}" stroke="${hi}" stroke-width="1" opacity=".5"/>`).join('');
    if (b === 'joggers') o += [1, -1].map((sd) => `<rect x="${f1(CX + sd * legC(s) - s.ankle - 4.5)}" y="356" width="${f1((s.ankle + 4.5) * 2)}" height="9" rx="4" fill="${dark}"/>`).join('');
    if (b === 'shorts') o += [1, -1].map((sd) => `<path d="M${CX + sd * 2} 258 L${CX + sd * (legC(s) + s.thigh + 3)} 260" stroke="${dark}" stroke-width="1.6"/>`).join('');
  }
  o += `<rect x="${f1(CX - s.waist - s.belly - 0.5)}" y="208" width="${f1((s.waist + s.belly + 0.5) * 2)}" height="6" rx="3" fill="${dark}"/>`;
  if (b === 'joggers' || b === 'shorts') o += `<path d="M${CX - 2} 213 q-1 8 -3 11 M${CX + 2} 213 q1 8 3 11" stroke="#FFFFFF" stroke-width="1" fill="none" opacity=".8"/>`;
  return o;
}

function tops(a: Avatar, s: Shape, body: string, G: (n: string) => string, id: string, skin: string, fem: boolean): string {
  const tp = a.top, col = a.topColor;
  const dark = sh(col, light(col) ? 0.82 : 0.68), hi = sh(col, light(col) ? 0.95 : 1.3);
  const loose = tp === 'oversized' || tp === 'hoodie' || tp === 'jacket' ? 3 : tp === 'tunic' ? 2 : 1;
  let o = `<g clip-path="url(#${id}cTop)"><path d="${body}" fill="${G('top')}" stroke="${sh(col, 0.9)}" stroke-width="${loose * 2}"/></g>`;
  if (tp === 'tunic') o += `<path d="M${f1(CX - s.hip - 3)} 222 L${f1(CX - s.hip - 9)} 294 Q${CX} 299 ${f1(CX + s.hip + 9)} 294 L${f1(CX + s.hip + 3)} 222 Z" fill="${G('top')}"/>`;
  // necklines
  if (tp === 'tank') {
    o += `<path d="M${CX - s.neck - 7} 106 Q${CX} 132 ${CX + s.neck + 7} 106 Z" fill="${skin}"/>`;
    o += [1, -1].map((sd) => `<path d="${smooth(side([[s.neck + 9, 108], [s.shoulder + 1, 114], [s.shoulder + 1, 134], [s.chest - 5, 138], [s.neck + 13, 118]], sd))}" fill="${skin}"/>`).join('');
    o += `<path d="M${CX - s.neck - 7} 106 Q${CX} 132 ${CX + s.neck + 7} 106" stroke="${dark}" stroke-width="1.4" fill="none"/>`;
  } else if (tp === 'bra') {
    o += [1, -1].map((sd) => `<path d="M${CX + sd * (s.chest - 5)} 136 L${CX + sd * (s.neck + 5)} 106" stroke="${col}" stroke-width="4.5" stroke-linecap="round"/>`).join('');
    o += `<path d="M${CX - s.chest + 4} 136 Q${CX} 152 ${CX + s.chest - 4} 136" stroke="${dark}" stroke-width="1.3" fill="none"/><rect x="${f1(CX - s.under - 1)}" y="165" width="${f1((s.under + 1) * 2)}" height="7" rx="3" fill="${dark}"/>`;
  } else if (tp === 'tee' || tp === 'crop' || tp === 'oversized' || tp === 'long' || tp === 'tunic') {
    o += `<path d="M${CX - s.neck - 4} 104 Q${CX} ${tp === 'tunic' ? 116 : 118} ${CX + s.neck + 4} 104 Z" fill="${skin}"/><path d="M${CX - s.neck - 4} 104 Q${CX} 118 ${CX + s.neck + 4} 104" stroke="${dark}" stroke-width="2.4" fill="none"/>`;
    if (tp === 'crop') o += `<path d="M${CX - s.under - 1} 182 Q${CX} 186 ${CX + s.under + 1} 182" stroke="${dark}" stroke-width="2" fill="none"/>`;
  } else if (tp === 'hoodie') {
    o += `<path d="M${CX - s.neck - 6} 104 Q${CX} 126 ${CX + s.neck + 6} 104" stroke="${dark}" stroke-width="4" fill="none"/>`;
    o += `<path d="M${CX - 4} 112 l-1 26 M${CX + 4} 112 l1 26" stroke="${light(col) ? '#9AA6B2' : '#FFFFFF'}" stroke-width="1.4" stroke-linecap="round"/><circle cx="${CX - 5}" cy="139" r="1.3" fill="${light(col) ? '#9AA6B2' : '#fff'}"/><circle cx="${CX + 5}" cy="139" r="1.3" fill="${light(col) ? '#9AA6B2' : '#fff'}"/>`;
    o += `<path d="M${CX - s.waist * 0.62} 222 L${CX - s.waist * 0.46} 196 L${CX + s.waist * 0.46} 196 L${CX + s.waist * 0.62} 222 Z" fill="${dark}" opacity=".45"/>`;
    o += `<rect x="${f1(CX - s.hip - 3)}" y="242" width="${f1((s.hip + 3) * 2)}" height="7" rx="3" fill="${dark}"/>`;
  } else if (tp === 'jacket') {
    o += `<path d="M${CX - s.neck - 6} 102 L${CX - 3} 122 L${CX} 104 L${CX + 3} 122 L${CX + s.neck + 6} 102" stroke="${dark}" stroke-width="3" fill="${sh(col, 0.9)}" stroke-linejoin="round"/>`;
    o += `<path d="M${CX} 118 L${CX} 246" stroke="${dark}" stroke-width="2"/><rect x="${CX - 2}" y="124" width="4" height="6" rx="1" fill="#C9CED6"/>`;
    o += [1, -1].map((sd) => `<path d="M${CX + sd * (s.chest - 4)} 128 L${CX + sd * (s.shoulder + 2)} 120" stroke="${hi}" stroke-width="2.4" opacity=".7"/>`).join('');
    o += `<rect x="${f1(CX - s.hip - 3)}" y="240" width="${f1((s.hip + 3) * 2)}" height="6" rx="3" fill="${dark}"/>`;
  }
  if (fem && (tp === 'tee' || tp === 'long' || tp === 'tank' || tp === 'crop')) o += `<path d="M${CX - s.chest + 7} 156 Q${CX - 8} 162 ${CX - 3} 156 M${CX + s.chest - 7} 156 Q${CX + 8} 162 ${CX + 3} 156" stroke="${dark}" stroke-width="1" fill="none" opacity=".45"/>`;
  return o;
}
