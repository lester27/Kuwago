/* ═══════════════════════════════════════════════════════════
   SheetHelpers.gs — Google Sheets CRUD utilities,
   name normalization, and ID generation.
   ═══════════════════════════════════════════════════════════ */

/* ── Sheet Definitions ─────────────────────────────────── */

var SHEET_SCHEMAS = {
  Students:            ['StudentName', 'SectionID'],
  Sessions:            ['SessionID', 'StudentName', 'Matched', 'JoinTime', 'LeaveTime',
                        'AttendanceStatus', 'OverrideStatus', 'OverrideReason', 'OverrideAt'],
  FocusEvents:         ['EventID', 'StudentName', 'SessionID', 'Type', 'Timestamp'],
  ChatPrompts:         ['PromptID', 'ExpectedPhrase', 'IssuedAt', 'ExpiresAt', 'IsActive'],
  ChatResponses:       ['ResponseID', 'StudentName', 'PromptID', 'SubmittedText', 'Matched', 'Timestamp'],
  Courses:             ['SectionID', 'CourseName', 'SectionName'],
  ActiveSession:       ['SessionID', 'SectionID', 'StartedAt', 'Active'],
  Heartbeats:          ['StudentName', 'ExtensionVersion', 'LastHeartbeatAt'],
  NameAliases:         ['DetectedName', 'CanonicalStudentName'],
  AttendanceAuditLog:  ['StudentName', 'SessionID', 'OldStatus', 'NewStatus', 'Reason', 'ChangedAt']
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

/**
 * Run this ONCE from the Apps Script editor (Run → setupSheets)
 * to create all required sheet tabs with the correct headers.
 * Safe to re-run — won't overwrite existing sheets.
 */
function setupSheets() {
  Object.keys(SHEET_SCHEMAS).forEach(function(name) {
    getOrCreateSheet(name);
  });
  Logger.log('✅ All sheets initialized: ' + Object.keys(SHEET_SCHEMAS).join(', '));
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

/**
 * Get roster student names for a specific course section.
 * @param {string} sectionId — e.g. 'BSIT301-A'
 * @returns {string[]}
 */
function getRosterForSection(sectionId) {
  const sheet = getOrCreateSheet('Students');
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(String);
  const nameCol = headers.indexOf('StudentName');
  const sectionCol = headers.indexOf('SectionID');
  const names = [];

  for (let i = 1; i < data.length; i++) {
    const secId = String(data[i][sectionCol] || '').trim();
    if (sectionCol === -1 || secId === sectionId) {
      const name = data[i][nameCol];
      if (name) names.push(String(name));
    }
  }

  return names;
}

/**
 * Upsert a heartbeat row (latest-only table, not append-only).
 * If a row for this student already exists, overwrite it.
 * Otherwise, append a new row.
 * @param {string} studentName
 * @param {string} extensionVersion
 */
function upsertHeartbeat(studentName, extensionVersion) {
  const sheet = getOrCreateSheet('Heartbeats');
  const data = sheet.getDataRange().getValues();
  const now = new Date();

  /* Search for existing row */
  for (let i = 1; i < data.length; i++) {
    if (normalizeName(String(data[i][0] || '')) === normalizeName(studentName)) {
      /* Update in place */
      sheet.getRange(i + 1, 1, 1, 3).setValues([[studentName, extensionVersion, now]]);
      return;
    }
  }

  /* No existing row — append */
  sheet.appendRow([studentName, extensionVersion, now]);
}

/* ── Name Alias Helpers ─────────────────────────────────── */

/**
 * Check if a detectedName has a stored alias mapping.
 * @param {string} detectedName — Raw name from extension
 * @returns {string|null} — Canonical name if alias exists, null otherwise
 */
function checkAlias(detectedName) {
  const sheet = getOrCreateSheet('NameAliases');
  const data = sheet.getDataRange().getValues();
  const normalized = normalizeName(detectedName);

  for (let i = 1; i < data.length; i++) {
    if (normalizeName(String(data[i][0] || '')) === normalized) {
      return String(data[i][1] || '') || null;
    }
  }
  return null;
}

/**
 * Write a new alias mapping to NameAliases.
 * @param {string} detectedName
 * @param {string} canonicalName — Pass null to mark as "not a student"
 */
function writeAlias(detectedName, canonicalName) {
  const sheet = getOrCreateSheet('NameAliases');
  const data = sheet.getDataRange().getValues();
  const normalized = normalizeName(detectedName);

  /* Overwrite if already exists */
  for (let i = 1; i < data.length; i++) {
    if (normalizeName(String(data[i][0] || '')) === normalized) {
      sheet.getRange(i + 1, 2).setValue(canonicalName || '');
      return;
    }
  }
  /* Append new */
  sheet.appendRow([detectedName, canonicalName || '']);
}

/**
 * Compute a simple similarity score between two strings.
 * Uses token overlap + character-level Levenshtein distance.
 * Returns 0.0 (no match) to 1.0 (perfect match).
 * @param {string} a
 * @param {string} b
 * @returns {number}
 */
function stringSimilarity(a, b) {
  a = normalizeName(a);
  b = normalizeName(b);
  if (a === b) return 1.0;
  if (!a || !b) return 0.0;

  /* Token overlap score */
  const tokensA = new Set(a.split(/\s+/));
  const tokensB = new Set(b.split(/\s+/));
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
    /* partial: check if a token from A is contained in any token of B */
    else {
      for (const tb of tokensB) {
        if (tb.includes(t) || t.includes(tb)) { overlap += 0.5; break; }
      }
    }
  }
  const tokenScore = overlap / Math.max(tokensA.size, tokensB.size);

  /* Levenshtein distance score */
  const maxLen = Math.max(a.length, b.length);
  const dist = levenshtein(a, b);
  const charScore = 1 - dist / maxLen;

  /* Weighted average — token overlap is more meaningful for names */
  return tokenScore * 0.6 + charScore * 0.4;
}

/**
 * Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = [];
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
    for (let j = 1; j <= n; j++) {
      dp[i][j] = i === 0 ? j
        : j === 0 ? i
        : a[i-1] === b[j-1]
          ? dp[i-1][j-1]
          : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

/**
 * Suggest top roster matches for a detected (unmatched) name.
 * @param {string} detectedName
 * @param {string[]} rosterNames
 * @param {number} [limit=2]
 * @param {number} [threshold=0.35]
 * @returns {Array<{ name: string, score: number }>}
 */
function suggestMatches(detectedName, rosterNames, limit, threshold) {
  limit = limit || 2;
  threshold = threshold !== undefined ? threshold : 0.35;

  const scored = rosterNames.map(name => ({
    name,
    score: stringSimilarity(detectedName, name)
  }));

  return scored
    .filter(s => s.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Extended matchToRoster that also checks NameAliases before
 * doing the exact-match lookup.
 * @param {string} incomingName
 * @returns {string|null}
 */
function matchToRosterWithAlias(incomingName) {
  /* 1. Check alias table first */
  const alias = checkAlias(incomingName);
  if (alias !== null) {
    /* Empty string alias = "not a student" dismissal */
    return alias === '' ? null : alias;
  }

  /* 2. Fall back to exact roster match */
  return matchToRoster(incomingName);
}
