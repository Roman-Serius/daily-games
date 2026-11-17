// Rooted missed-word collector: Google Apps Script bound to a Google Sheet.
//
// Setup (once):
//   1. Make a new Google Sheet (e.g. "Rooted misses").
//   2. Extensions > Apps Script. Delete what's there, paste this whole file, Save.
//   3. Project Settings (gear) > Script Properties > Add property:
//        KEY = any long random string (used only for reading the sheet back with tools/pull-misses.py)
//   4. Deploy > New deployment > type "Web app":
//        Execute as: Me      Who has access: Anyone
//      Authorize when asked, then copy the Web app URL (ends in /exec).
//   5. Put that URL in rooted/rooted.js as MISS_URL.
//
// After editing this script later: Deploy > Manage deployments > edit (pencil) >
// Version: New version > Deploy. The URL stays the same.

const SHEET = "misses";
const COLS = ["received", "t", "day", "puzzle", "mode", "from", "part", "pid", "typed", "word", "reason", "player"];
const MAX_LEN = 60;

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
  }
  return sh;
}

const clean_ = (v) => String(v == null ? "" : v).replace(/[\r\n\t]/g, " ").slice(0, MAX_LEN);

// The game POSTs one miss as JSON (sent as text/plain so the browser needs no preflight).
function doPost(e) {
  try {
    const m = JSON.parse(e.postData.contents);
    if (!m || typeof m.typed !== "string" || !m.typed.trim()) return out_({ ok: false });
    // Text that starts with = + - @ could run as a formula in the sheet: prefix with '.
    const safe = (v) => { const s = clean_(v); return /^[=+\-@]/.test(s) ? "'" + s : s; };
    const row = [new Date()].concat(COLS.slice(1).map((c) => safe(m[c])));
    const lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try { sheet_().appendRow(row); } finally { lock.releaseLock(); }
    return out_({ ok: true });
  } catch (err) {
    return out_({ ok: false });
  }
}

// tools/pull-misses.py reads everything back: GET <url>?key=KEY[&since=ISO-date]
function doGet(e) {
  const key = PropertiesService.getScriptProperties().getProperty("KEY");
  if (!key || !e.parameter || e.parameter.key !== key) return out_({ ok: false, error: "key" });
  const since = e.parameter.since ? new Date(e.parameter.since) : null;
  const values = sheet_().getDataRange().getValues();
  const head = values.shift();
  const rows = values
    .filter((r) => !since || new Date(r[0]) > since)
    .map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] instanceof Date ? r[i].toISOString() : r[i]])));
  return out_({ ok: true, rows });
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
