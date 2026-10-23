// The lab comparison report (a PDF from the Health tab): the last 3 results of each test side by side with the
// normal range, how much each one changed and whether it moved toward the range, the tests without a number (blood
// count, eye check) with when they are due, and plain notes written from the numbers. Pure (no native modules).
import { dayKey } from './day.ts';
import { LABS, labHistory, labStatus, labStatusWord, nextLab, rangeText, rangeDist as dist, rangeSide as side, type LabEntry, type LabKind, type LabStatus } from './health.ts';
import { L, isEn } from './i18n.ts';
import type { Profile } from './plan.ts';
import { ad, clinicalCSS, clinicalHead, dmy, dmyDate, esc, infoBox, monthYear, n, page, pill, secNo } from './printkit.ts';

// The range and status rules live with the tests (./health.ts), shared with the doctor report.
export { RANGES, labStatus, rangeText, type LabStatus } from './health.ts';

export type LabRow = {
  kind: LabKind;
  /** Up to the last 3 results with a number, oldest first. */
  shown: LabEntry[];
  /** Percent change from the first shown result to the latest (null with one result). */
  change: number | null;
  /** The latest moved toward the range (or into it) compared with the first shown result. */
  improved: boolean;
  /** The latest moved away from the range. */
  worse: boolean;
  status: LabStatus;
};

/** One row per test with a number, in the app's test order. */
export function labRows(p: Profile): LabRow[] {
  const out: LabRow[] = [];
  for (const k of Object.keys(LABS) as LabKind[]) {
    if (LABS[k].noValue) continue;
    const shown = labHistory(p, k).filter((x) => x.value !== undefined && Number.isFinite(x.value)).slice(0, 3).reverse();
    if (!shown.length) continue;
    const first = shown[0].value!, last = shown[shown.length - 1].value!;
    const two = shown.length > 1;
    const change = two && first ? Math.round(((last - first) / first) * 100) : two ? 0 : null;
    out.push({ kind: k, shown, change, improved: two && dist(k, last) < dist(k, first), worse: two && dist(k, last) > dist(k, first), status: labStatus(k, last) });
  }
  return out;
}

export type NoValueRow = { kind: LabKind; last: string; next: string | null; due: boolean };
/** The tests without a number that were done at least once. */
export function noValueRows(p: Profile, today: Date): NoValueRow[] {
  const t = dayKey(today);
  return (Object.keys(LABS) as LabKind[]).filter((k) => LABS[k].noValue).flatMap((k) => {
    const last = labHistory(p, k)[0];
    if (!last) return [];
    const next = nextLab(p, k);
    return [{ kind: k, last: last.date, next, due: !next || next <= t }];
  });
}

/** The three summary numbers. */
export function labSummary(rows: LabRow[]) {
  return { improved: rows.filter((r) => r.improved).length, inRange: rows.filter((r) => r.status === 'ok').length, follow: rows.filter((r) => r.status !== 'ok').length };
}

/** Name without the bracketed part ("هرمون الغدة (TSH)" -> "هرمون الغدة"). */
const shortName = (k: LabKind) => (k === 'lipids' ? L('الكوليسترول', 'Cholesterol') : L(LABS[k].n[0], LABS[k].n[1]).replace(/\s*\(.*\)\s*$/, ''));
const fmtV = (v: number) => String(Math.round(v * 100) / 100);
/** Feminine test names (for "اتعملت", "ميعادها"). */
const FEM: Partial<Record<LabKind, boolean>> = { cbc: true };

const monthsBetween = (a: string, b: string) => {
  const [y1, m1, d1] = a.split('-').map(Number), [y2, m2, d2] = b.split('-').map(Number);
  return Math.max(0, Math.round(((y2 - y1) * 12 + (m2 - m1) + (d2 - d1) / 30)));
};
const monthsText = (m: number) => L(m === 1 ? 'شهر' : m === 2 ? 'شهرين' : m <= 10 ? `${ad(m)} شهور` : `${ad(m)} شهر`, m === 1 ? '1 month' : `${m} months`);

/** Plain sentences from the numbers, one per test that has something to say. */
export function labNotes(rows: LabRow[], nv: NoValueRow[]): string[] {
  const out: string[] = [];
  for (const r of rows) {
    const name = shortName(r.kind);
    const first = r.shown[0], last = r.shown[r.shown.length - 1];
    const v0 = first.value!, v1 = last.value!;
    const s1 = side(r.kind, v1), s0 = side(r.kind, v0);
    const where = (s: 'low' | 'high' | 'in') => (s === 'high' ? L('أعلى من', 'above') : L('أقل من', 'below'));
    if (r.shown.length < 2) {
      if (r.status !== 'ok') out.push(L(`نتيجة ${name} ${where(s1)} المعدل، ومحتاجة متابعة.`, `${name} is ${where(s1)} the range and needs follow-up.`));
      continue;
    }
    const m = monthsBetween(first.date, last.date);
    const span = m >= 1 ? L(` في ${monthsText(m)}`, ` in ${monthsText(m)}`) : '';
    const move = v1 > v0 ? L(`زادت من ${ad(fmtV(v0))} لـ ${ad(fmtV(v1))}${span}`, `rose from ${fmtV(v0)} to ${fmtV(v1)}${span}`)
      : v1 < v0 ? L(`نزلت من ${ad(fmtV(v0))} لـ ${ad(fmtV(v1))}${span}`, `fell from ${fmtV(v0)} to ${fmtV(v1)}${span}`)
        : L(`فضلت ${ad(fmtV(v1))}`, `stayed at ${fmtV(v1)}`);
    let end: string;
    if (r.status === 'ok') {
      if (s0 === 'in') continue; // in range all along: nothing to add
      end = L(`، وبقت في المعدل بعد ما كانت ${where(s0)}ه.`, `, and is now in range after being ${where(s0)} it.`);
    } else if (r.improved) end = L(`، بس لسه ${where(s1)} المعدل ومحتاجة متابعة.`, `, but is still ${where(s1)} the range and needs follow-up.`);
    else if (r.worse) end = L(`، وبعدت عن المعدل ومحتاجة متابعة.`, `, moving away from the range; it needs follow-up.`);
    else end = L(`، ولسه ${where(s1)} المعدل ومحتاجة متابعة.`, `, still ${where(s1)} the range; it needs follow-up.`);
    out.push(L(`نتيجة ${name} ${move}${end}`, `${name} ${move}${end}`));
  }
  for (const x of nv) if (x.due) out.push(L(`ميعاد ${shortName(x.kind)} جه.`, `${shortName(x.kind)}: due now.`));
  if (!out.length && rows.length) out.push(L('كل النتايج الأخيرة في المعدل.', 'All the latest results are in range.'));
  return out;
}

const CSS = `
td.test b{display:block;font-weight:700}
td.test span{font-size:10px}
td.v b,td.v span{display:block}td.v span{font-size:9.5px;color:#6E6E73;font-weight:400}
td.v b{font-weight:700;font-size:12.5px}
td.old{color:#6E6E73}td.old b{font-weight:400}
.chg{font-size:11px;white-space:nowrap}
.empty{border:1px dashed #E5E5EA;border-radius:10px;padding:26px 20px;text-align:center}
.empty .h{font-size:15px;margin-bottom:6px}
`;

/** The printable lab comparison (Arabic or English by the app language). */
export function labReportHTML(p: Profile, today: Date): string {
  const en = isEn();
  const rows = labRows(p);
  const nv = noValueRows(p, today);
  const all = (p.labs ?? []).filter((x) => LABS[x.kind]);
  const kinds = new Set(all.map((x) => x.kind));
  const dates = [...rows.flatMap((r) => r.shown.map((x) => x.date)), ...nv.map((x) => x.last)].sort();
  const w = p.weights?.length ? p.weights[p.weights.length - 1].kg : p.weight;
  const period = dates.length ? (monthYear(dates[0]) === monthYear(dates[dates.length - 1]) ? monthYear(dates[0]) : L(`من ${monthYear(dates[0])} لـ ${monthYear(dates[dates.length - 1])}`, `${monthYear(dates[0])} to ${monthYear(dates[dates.length - 1])}`)) : '';
  const made = L(`اتعمل ${ad(dmyDate(today))}`, `Made on ${dmyDate(today)}`);
  const head = clinicalHead(L('تقرير مقارنة التحاليل', 'Lab results comparison'), [period, made].filter(Boolean).join(' · '));
  const info = infoBox([
    [L('الاسم', 'Name'), esc(p.name || '—')],
    [L('النوع والسن', 'Sex and age'), `${p.sex === 'f' ? L('أنثى', 'Female') : L('ذكر', 'Male')} · ${n(p.age)}`],
    [L('الطول والوزن', 'Height and weight'), n(`${p.height} cm · ${w} kg`)],
    [L('عدد التحاليل', 'Tests'), n(kinds.size)],
  ]);
  const foot = `<div class="foot"><span>${L('من النتايج اللي الشخص دخلها بنفسه في يلا ويل، ومش تشخيص طبي.', 'From the results the person entered in Yalla Well. Not a medical diagnosis.')}</span></div>`;

  if (!rows.length && !nv.length) {
    const body = `<div class="wrap">${head}${info}<div class="empty"><p class="h">${L('لسه مفيش نتايج تحاليل متسجلة', 'No lab results yet')}</p><p class="mut">${L('أول ما النتايج تتسجل في صفحة الصحة، المقارنة بينها هتظهر هنا.', 'Once results are added on the Health tab, the comparison shows up here.')}</p></div>${foot}</div>`;
    return page(L('تقرير مقارنة التحاليل', 'Lab results comparison'), body, clinicalCSS() + CSS);
  }

  const s = labSummary(rows);
  const tiles = rows.length ? `<div class="tiles">
    <div class="ok"><span class="n">${s.improved}</span>${L('اتحسنت من أول نتيجة', 'Improved since the first result')}</div>
    <div style="background:#F5F5F7"><span class="n">${s.inRange}</span>${L('في المعدل دلوقتي', 'In range now')}</div>
    <div class="${s.follow ? 'warn' : 'none'}"><span class="n">${s.follow}</span>${L('محتاجة متابعة', 'Need follow-up')}</div></div>` : '';

  const cell = (x: LabEntry | undefined, latest: boolean) => x
    ? `<td class="v${latest ? '' : ' old'}"><b class="n">${fmtV(x.value!)}</b><span class="n">${dmy(x.date)}</span></td>`
    : `<td class="v old"><span class="mut">—</span></td>`;
  const table = rows.map((r) => {
    const sh = r.shown;
    const [a, b, c] = sh.length === 3 ? sh : sh.length === 2 ? [sh[0], undefined, sh[1]] : [undefined, undefined, sh[0]];
    const v = sh[sh.length - 1].value!;
    const sub = en ? LABS[r.kind].unit : `${LABS[r.kind].n[1].replace(/^Vitamin /, 'Vit ')} · ${LABS[r.kind].unit}`;
    const color = r.improved ? '#0A8F55' : r.worse ? '#8A5A00' : '#6E6E73';
    const arrow = r.change === null ? '' : r.change > 0 ? '▲' : r.change < 0 ? '▼' : '■';
    const chg = r.change === null ? `<span class="mut">—</span>` : `<span class="n" style="color:${color}">${arrow} ${Math.abs(r.change)}%</span>`;
    return `<tr><td class="test"><b>${esc(shortName(r.kind))}</b><span class="mut n">${esc(sub)}</span></td><td class="mut">${rangeText(r.kind)}</td>${cell(a, false)}${cell(b, false)}${cell(c, true)}<td class="chg">${chg}</td><td>${pill(r.status, labStatusWord(r.kind, v))}</td></tr>`;
  }).join('');
  let no = 0;
  const sec1 = rows.length ? `<div><h3>${secNo(++no)} ${L('آخر ٣ نتايج لكل تحليل', 'Last 3 results of each test')}</h3>
    <table><thead><tr><th>${L('التحليل', 'Test')}</th><th>${L('المعدل الطبيعي', 'Normal range')}</th><th>${L('أول نتيجة', 'First result')}</th><th>${L('النتيجة اللي بعدها', 'Next result')}</th><th>${L('آخر نتيجة', 'Latest result')}</th><th>${L('التغيير', 'Change')}</th><th>${L('الحالة', 'Status')}</th></tr></thead><tbody>${table}</tbody></table>
    <p class="mut note">${L('المعدلات الطبيعية تقريبية وبتختلف من معمل للتاني، فالأحسن تتقارن بالمعدل المكتوب في ورقة المعمل.', 'Normal ranges are approximate and differ between labs, so compare with the range printed on the lab paper.')}</p></div>` : '';
  const sec2 = nv.length ? `<div class="sec"><h3>${secNo(++no)} ${L('تحاليل من غير رقم', 'Tests without a number')}</h3><table><tbody>${nv.map((x) => {
    const f = FEM[x.kind];
    const when = x.due ? pill('warn', L(f ? 'جه ميعادها' : 'جه ميعاده', 'Due now')) : pill('ok', L(`${f ? 'ميعادها' : 'ميعاده'} ${monthYear(x.next!)}`, `Due ${monthYear(x.next!)}`));
    return `<tr><td>${esc(shortName(x.kind))}</td><td class="n">${dmy(x.last)}</td><td class="mut">${L(f ? 'آخر مرة اتعملت' : 'آخر مرة اتعمل', 'Last done')}</td><td>${when}</td></tr>`;
  }).join('')}</tbody></table></div>` : '';
  const notes = labNotes(rows, nv);
  const sec3 = notes.length ? `<div class="sec"><h3>${secNo(++no)} ${L('ملاحظات', 'Notes')}</h3><ul>${notes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  const body = `<div class="wrap">${head}${info}${tiles}${sec1}${sec2}${sec3}${foot}</div>`;
  return page(L('تقرير مقارنة التحاليل', 'Lab results comparison'), body, clinicalCSS() + CSS);
}
