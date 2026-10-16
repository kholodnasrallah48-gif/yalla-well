// Yalla Well waitlist: receives sign-ups from yallawellfit.com/join.html and adds each one as a row in this Google Sheet.
// Setup (once): open the Sheet > Extensions > Apps Script, paste this file, Deploy > New deployment > Web app,
// Execute as: Me, Who has access: Anyone. Put the /exec URL in website/src/config.mjs (WAITLIST_URL).

const SHEET = 'Waitlist';
const HEAD = ['Time', 'Name', 'Email', 'Phone', 'Country', 'Goals', 'Language', 'Source'];

function doPost(e) {
  const p = (e && e.parameter) || {};
  if (p.website) return done_(); // hidden field filled: a bot
  const email = clip_(p.email).toLowerCase();
  if (!p.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return done_();
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = book.getSheetByName(SHEET) || book.insertSheet(SHEET);
    if (sheet.getLastRow() === 0) { sheet.appendRow(HEAD); sheet.setFrozenRows(1); }
    // Same email again: keep one row (update it) instead of a duplicate.
    const last = sheet.getLastRow();
    const emails = last > 1 ? sheet.getRange(2, 3, last - 1, 1).getValues().map((r) => String(r[0]).toLowerCase()) : [];
    const row = [new Date(), clip_(p.name), email, clip_(p.device), clip_(p.country), clip_(p.goal), clip_(p.lang), clip_(p.src)];
    const at = emails.indexOf(email);
    if (at >= 0) sheet.getRange(at + 2, 1, 1, row.length).setValues([row]);
    else sheet.appendRow(row);
  } finally {
    lock.releaseLock();
  }
  return done_();
}

// Short plain text only; a leading = + - @ would make the Sheet treat it as a formula.
function clip_(v) {
  return String(v || '').slice(0, 200).replace(/^[=+\-@]/, "'$&");
}

function done_() {
  return ContentService.createTextOutput('{"ok":true}').setMimeType(ContentService.MimeType.JSON);
}
