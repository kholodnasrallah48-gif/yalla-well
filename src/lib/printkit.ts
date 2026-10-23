// Shared pieces for the printable reports (lab comparison, doctor report, weekly report, My plan): the A4 page, the
// colours (the light theme's tokens from src/theme.ts, copied here because that file needs React Native), system
// fonts (phones can't reliably load web fonts while printing), number spans that stay left-to-right inside Arabic
// text, and the two looks: "clinical" (header bar, info box, numbered sections) and "scoreboard" (black band, rings).
import { isEn } from './i18n.ts';

/** Light theme tokens (src/theme.ts) plus the print-only ones. */
export const PC = {
  ink: '#1D1D1F', muted: '#6E6E73', line: '#E5E5EA', soft: '#F5F5F7', grey: '#F2F2F7',
  green: '#0A8F55', greenBg: '#DDF3E7', amber: '#8A5A00', amberBg: '#FFF3C4', red: '#D70015', redBg: '#FDE2E5',
  blue: '#1A65C7', orange: '#B26B00', calAmber: '#E0A800',
  /** The scoreboard band and its neon green. */
  night: '#0B0B0C', neon: '#19E68C', nightRing: '#2C2C2E', nightMuted: '#A1A1A6',
} as const;

export const FONT = `-apple-system,"SF Arabic","Geeza Pro",Tahoma,"Segoe UI",sans-serif`;

export const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!);

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
/** Digits for running text: Arabic-Indic in Arabic, as they are in English. */
export const ad = (s: string | number) => (isEn() ? String(s) : String(s).replace(/\d/g, (d) => AR_DIGITS[Number(d)]));

/** A number (or any Latin text) kept left-to-right with Western digits inside the page. */
export const n = (s: string | number, cls = '') => `<span class="n${cls ? ' ' + cls : ''}">${esc(String(s))}</span>`;

/** dd/mm/yyyy from a YYYY-MM-DD key. */
export const dmy = (k: string) => `${k.slice(8, 10)}/${k.slice(5, 7)}/${k.slice(0, 4)}`;
export const dmyDate = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "أكتوبر ٢٠٢٦" / "October 2026" from a YYYY-MM-DD key. */
export const monthYear = (k: string) => {
  const m = Number(k.slice(5, 7)) - 1;
  return isEn() ? `${MONTHS_EN[m]} ${k.slice(0, 4)}` : `${MONTHS_AR[m]} ${ad(k.slice(0, 4))}`;
};

/** The whole page: A4, system fonts, colours kept when printing. */
export function page(title: string, body: string, css = ''): string {
  const en = isEn();
  return `<!doctype html><html dir="${en ? 'ltr' : 'rtl'}" lang="${en ? 'en' : 'ar'}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>
@page{size:A4;margin:14mm 14mm 14mm}
*{box-sizing:border-box;-webkit-print-color-adjust:exact;print-color-adjust:exact}
html,body{background:#fff}
body{font-family:${FONT};color:${PC.ink};margin:0;font-size:12px;line-height:1.55}
.n{font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate}
.wm{font-weight:600;letter-spacing:.18em;color:${PC.green};font-size:11px;direction:ltr;unicode-bidi:isolate;white-space:nowrap}
.h{font-weight:700;margin:0}
.mut{color:${PC.muted}}
p{margin:0}
table{width:100%;border-collapse:collapse}
td,th{padding:6px 5px;text-align:${en ? 'left' : 'right'};border-bottom:1px solid ${PC.line};vertical-align:middle}
th{font-weight:400;color:${PC.muted};font-size:10.5px;border-bottom:1px solid ${PC.ink}}
tr{break-inside:avoid}
.pill{display:inline-block;padding:1px 9px;border-radius:99px;font-size:10.5px;white-space:nowrap}
.ok{color:${PC.green};background:${PC.greenBg}}.warn{color:${PC.amber};background:${PC.amberBg}}.bad{color:${PC.red};background:${PC.redBg}}
.none{color:${PC.muted};background:${PC.grey}}
ul{margin:0;padding-${en ? 'left' : 'right'}:16px}li{margin:3px 0}
.sec{break-inside:avoid-page}
h3,h2{break-after:avoid}
h3{font-size:13.5px;margin:0 0 6px;font-weight:700}
thead{display:table-header-group}
.foot{margin-top:18px;font-size:10px;color:${PC.muted};display:flex;justify-content:space-between;gap:12px;border-top:1px solid ${PC.line};padding-top:8px}
${css}
</style></head><body>${body}</body></html>`;
}

/* ---------- Clinical look ---------- */

export const clinicalCSS = () => `
.wrap{display:flex;flex-direction:column;gap:16px}
.bar{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;border-bottom:2px solid ${PC.ink};padding-bottom:10px}
.bar .h{font-size:21px;line-height:1.3}
.box{display:grid;border:1px solid ${PC.line};border-radius:8px}
.box>div{padding:8px 11px;border-${isEn() ? 'right' : 'left'}:1px solid ${PC.line}}.box>div:last-child{border-${isEn() ? 'right' : 'left'}:0}
.box .mut{font-size:10.5px;display:block}
.tiles{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}
.tiles>div{border-radius:9px;padding:9px 12px}
.tiles .n{font-size:24px;font-weight:300;display:block;line-height:1.15}
.note{font-size:10.5px;margin-top:6px}
`;

/** The clinical header: title and a line under it, the green wordmark on the other side. */
export const clinicalHead = (title: string, sub: string) =>
  `<div class="bar"><div><p class="h">${esc(title)}</p><span class="mut">${sub}</span></div><span class="wm">YALLA WELL</span></div>`;

/** The info box: label over value, in equal columns. Values are HTML. */
export const infoBox = (cells: [string, string][]) =>
  `<div class="box" style="grid-template-columns:repeat(${cells.length},1fr)">${cells.map(([l, v]) => `<div><span class="mut">${esc(l)}</span>${v}</div>`).join('')}</div>`;

export const pill = (kind: 'ok' | 'warn' | 'bad' | 'none', text: string) => `<span class="pill ${kind}">${esc(text)}</span>`;

/** Section numbers: "١." / "1.". */
export const secNo = (i: number) => `${ad(i)}.`;

/* ---------- Scoreboard look ---------- */

export const scoreCSS = () => `
.band{background:${PC.night};color:#F5F5F7;border-radius:14px;padding:20px 24px;display:flex;gap:22px;align-items:center}
.band .mut{color:${PC.nightMuted}}
.band .wm{color:${PC.neon}}
.band .h{font-size:22px;margin-top:3px;line-height:1.3}
.wrap{display:flex;flex-direction:column;gap:16px}
.rings{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;text-align:center}
.rings svg{width:64%;display:block;margin:0 auto 4px}
.rings .sub{display:block;font-size:10px}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.cal>div{border-radius:9px;padding:7px 3px;text-align:center;font-size:10.5px}
.cal .n{display:block;font-size:13px;margin-top:2px}
.dot{display:inline-block;width:8px;height:8px;border-radius:50%;vertical-align:middle;margin-${isEn() ? 'right' : 'left'}:4px}
.legend{font-size:10px;margin-top:6px;display:flex;gap:14px;flex-wrap:wrap}
.cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.cols>div{border-radius:12px;padding:11px 14px}
.cols .h{font-size:13.5px;margin-bottom:3px}
.tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
.tiles>div{background:${PC.grey};border-radius:11px;padding:9px 12px}
.tiles .n{font-size:20px;font-weight:300;display:block;line-height:1.2}
.tiles .mut{font-size:10.5px}
`;

/** A ring: `pct` (0 to 1+) of the circle in `color`, with `text` in the middle. `dark` is for the black band. */
export function ring(pct: number, color: string, text: string, dark = false, size = 24): string {
  const C = 2 * Math.PI * 40;
  const len = Math.max(0, Math.min(1, pct)) * C;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="40" fill="none" stroke="${dark ? PC.nightRing : PC.line}" stroke-width="10"/>${len > 0 ? `<circle cx="50" cy="50" r="40" fill="none" stroke="${color}" stroke-width="10" stroke-linecap="round" stroke-dasharray="${len.toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 50 50)"/>` : ''}<text x="50" y="${(50 + size / 3).toFixed(1)}" text-anchor="middle" font-family='${FONT}' font-weight="300" font-size="${size}" fill="${dark ? '#F5F5F7' : PC.ink}">${esc(text)}</text></svg>`;
}

/** The scoreboard band: the big score ring, the wordmark, a title and a line under it. */
export const scoreBand = (ringSvg: string, title: string, sub: string) =>
  `<div class="band"><div style="width:118px;flex:none">${ringSvg}</div><div><span class="wm">YALLA WELL</span><p class="h">${esc(title)}</p><p class="mut">${sub}</p></div></div>`;

export const scoreFoot = (right: string) => `<div class="foot"><span dir="ltr">Be well. Live more.</span><span>${right}</span></div>`;
