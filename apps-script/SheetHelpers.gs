/* ═══════════════════════════════════════════════════════════
   SheetHelpers.gs — Google Sheets CRUD utilities,
   name normalization, and ID generation.
   ═══════════════════════════════════════════════════════════ */

/* ── Sheet Definitions ─────────────────────────────────── */

var SHEET_SCHEMAS = {
  Students:      ['StudentName'],
  Sessions:      ['SessionID', 'StudentName', 'Matched', 'JoinTime', 'LeaveTime'],
  FocusEvents:   ['EventID', 'StudentName', 'SessionID', 'Type', 'Timestamp'],
  ChatPrompts:   ['PromptID', 'ExpectedPhrase', 'IssuedAt', 'ExpiresAt', 'IsActive'],
  ChatResponses: ['ResponseID', 'StudentName', 'PromptID', 'SubmittedText', 'Matched', 'Timestamp']
};

/* ── Spreadsheet Access ────────────────────────────────── */

/**
 * Get the spreadsheet.
 *
 * SETUP: If this script is standalone (not created from inside a Sheet),
 * replace the ID below with your actual Sheet ID.
 * Find it in the Sheet's URL:
 *   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
 *
 * If the script was created via Extensions → Apps Script from inside
 * a Sheet, you can switch back to getActiveSpreadsheet() instead.
 */
function getSpreadsheet() {
  var SPREADSHEET_ID = '1eOmyrcEPnxNj7qVkTpSiCpYiQlBBQs8_8xn2XyPvVQs';
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

/**
 * Get or create a sheet by name. If the sheet doesn't exist,
 * it's created with the correct column headers.
 * @param {string} name — Sheet name (must be a key in SHEET_SCHEMAS)
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function getOrCreateSheet(name) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    const headers = SHEET_SCHEMAS[name];
    if (headers && headers.length > 0) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.setFrozenRows(1);
      /* Bold the header row */
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    }
  }

  return sheet;
}

/* ── ID Generation ─────────────────────────────────────── */

/**
 * Generate a unique ID. Uses timestamp + random suffix.
 * @param {string} [prefix=''] — Optional prefix (e.g. 'sess', 'evt')
 * @returns {string}
 */
function generateId(prefix) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 8);
  return prefix ? `${prefix}_${ts}_${rand}` : `${ts}_${rand}`;
}

/* ── Name Normalization ────────────────────────────────── */

/**
 * Normalize a name for comparison:
 * trim whitespace, collapse multiple spaces, lowercase.
 * @param {string} raw
 * @returns {string}
 */
function normalizeName(raw) {
  if (!raw) return '';
  return raw.trim().replace(/\s+/g, ' ').toLowerCase();
}

/**
 * Check if a student name matches anyone on the roster.
 * Returns the canonical roster name if matched, null otherwise.
 * @param {string} incomingName — Raw name from the extension
 * @returns {string|null} — Canonical roster name or null
 */
function matchToRoster(incomingName) {
  const normalized = normalizeName(incomingName);
  const sheet = getOrCreateSheet('Students');
  const data = sheet.getDataRange().getValues();

  /* Skip header row */
  for (let i = 1; i < data.length; i++) {
    const rosterName = data[i][0];
    if (rosterName && normalizeName(String(rosterName)) === normalized) {
      return String(rosterName); /* Return canonical name */
    }
  }

  return null;
}

/* ── Row Operations ────────────────────────────────────── */

/**
 * Append a row to a sheet.
 * @param {string} sheetName
 * @param {Array} rowData — Values in column order
 */
function appendRow(sheetName, rowData) {
  const sheet = getOrCreateSheet(sheetName);
  sheet.appendRow(rowData);
}

/**
 * Get all data from a sheet as an array of objects.
 * @param {string} sheetName
 * @returns {Object[]}
 */
function getAllRows(sheetName) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; /* Empty or header only */

  const headers = data[0].map(String);
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Find rows where a column matches a value.
 * @param {string} sheetName
 * @param {string} columnName
 * @param {*} value
 * @returns {Object[]} — Array of { rowIndex (1-based), data: {...} }
 */
function findRows(sheetName, columnName, value) {
  const sheet = getOrCreateSheet(sheetName);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(String);
  const colIdx = headers.indexOf(columnName);
  if (colIdx === -1) return [];

  const results = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][colIdx] === value) {
      const row = {};
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = data[i][j];
      }
      results.push({ rowIndex: i + 1, data: row }); /* 1-based row index */
    }
  }

  return results;
}

/**
 * Update a specific cell in a sheet.
 * @param {string} sheetName
 * @param {number} rowIndex — 1-based row index
 * @param {string} columnName
 * @param {*} value
 */
function updateCell(sheetName, columnName, rowIndex, value) {
  const sheet = getOrCreateSheet(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const colIdx = headers.indexOf(columnName);
  if (colIdx === -1) return;

  sheet.getRange(rowIndex, colIdx + 1).setValue(value);
}

/**
 * Get all roster student names.
 * @returns {string[]}
 */
function getRosterNames() {
  const sheet = getOrCreateSheet('Students');
  const data = sheet.getDataRange().getValues();
  const names = [];

  for (let i = 1; i < data.length; i++) {
    const name = data[i][0];
    if (name) names.push(String(name));
  }

  return names;
}
