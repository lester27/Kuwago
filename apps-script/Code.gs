/* ═══════════════════════════════════════════════════════════
   Code.gs — Main entry point. Routes doGet/doPost requests,
   implements endpoint handlers, and serves the dashboard.
   ═══════════════════════════════════════════════════════════ */

/* ── Configuration ─────────────────────────────────────── */

/**
 * CORS headers for cross-origin requests.
 * Only needed if the dashboard is hosted separately from this script.
 */
var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

/* ── HTTP Handlers ─────────────────────────────────────── */

/**
 * Handle GET requests.
 * Routes on e.parameter.action:
 *   (none)          → serve dashboard HTML
 *   currentPrompt   → return active prompt JSON
 *   dashboardData   → return full aggregated state
 *   setPrompt       → create a new prompt (GET-safe for CORS)
 *   logEvent        → log a student event (GET-safe for CORS)
 *   submitChat      → submit a chat response (GET-safe for CORS)
 *
 * NOTE: setPrompt/logEvent/submitChat are exposed on GET so that
 * the standalone dashboard (served from localhost) can call them
 * without hitting Apps Script's POST redirect CORS issue.
 */
function doGet(e) {
  const p = e && e.parameter ? e.parameter : {};
  const action = p.action || null;

  switch (action) {
    case 'currentPrompt':
      return jsonResponse(handleCurrentPrompt());

    case 'dashboardData':
      return jsonResponse(handleDashboardData());

    /* ── Mutation endpoints exposed on GET for standalone-dashboard CORS ── */
    case 'setPrompt':
      return jsonResponse(handleSetPrompt({
        phrase:          p.phrase || '',
        durationSeconds: parseInt(p.durationSeconds, 10) || 60
      }));

    case 'logEvent':
      return jsonResponse(handleLogEvent({
        studentName: p.studentName || '',
        type:        p.type || ''
      }));

    case 'submitChat':
      return jsonResponse(handleSubmitChat({
        studentName: p.studentName || '',
        text:        p.text || ''
      }));

    case 'purgeStaleData':
      return jsonResponse(purgeStaleData());

    default:
      /* Serve the dashboard HTML page */
      return HtmlService.createTemplateFromFile('Index')
        .evaluate()
        .setTitle('Dashboard')
        .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
        .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
}

/**
 * Handle POST requests.
 * Action is read from the JSON request body.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'logEvent':
        return jsonResponse(handleLogEvent(body));

      case 'submitChat':
        return jsonResponse(handleSubmitChat(body));

      case 'setPrompt':
        return jsonResponse(handleSetPrompt(body));

      default:
        return jsonResponse({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    return jsonResponse({ error: 'Invalid request: ' + err.message }, 400);
  }
}

/* ── HtmlService Helper ────────────────────────────────── */

/**
 * Include a file's content in an HTML template.
 * Used by Index.html: <?!= include('Styles') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* ── JSON Response Helper ──────────────────────────────── */

function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/* ═══════════════════════════════════════════════════════════
   ENDPOINT HANDLERS
   ═══════════════════════════════════════════════════════════ */

/* ── GET currentPrompt ─────────────────────────────────── */

/**
 * Returns the currently active (non-expired) prompt, if any.
 * Called by the Chrome extension every ~5–10 seconds.
 */
function handleCurrentPrompt() {
  const prompts = getAllRows('ChatPrompts');
  const now = new Date();

  const active = prompts.find(p => {
    if (p.IsActive !== true && p.IsActive !== 'TRUE') return false;
    if (p.ExpiresAt && new Date(p.ExpiresAt) < now) return false;
    return true;
  });

  if (!active) {
    return { activePrompt: null };
  }

  return {
    activePrompt: {
      phrase: active.ExpectedPhrase,
      issuedAt: active.IssuedAt,
      expiresAt: active.ExpiresAt
    }
  };
}

/* ── GET dashboardData ─────────────────────────────────── */

/**
 * Aggregates all sheet data into the JSON shape the dashboard expects.
 * This is the main polling endpoint (called every ~5s by the dashboard).
 *
 * Callable via google.script.run.getDashboardData() from the
 * GAS-served dashboard page.
 */
function getDashboardData() {
  return handleDashboardData();
}

function handleDashboardData() {
  /* Load all raw data */
  const rosterNames = getRosterNames();
  const sessions = getAllRows('Sessions');
  const focusEvents = getAllRows('FocusEvents');
  const prompts = getAllRows('ChatPrompts');
  const responses = getAllRows('ChatResponses');

  /* Build the active prompt info */
  const activePromptData = buildActivePromptData(prompts, responses, rosterNames.length, rosterNames);

  /* Build the student list */
  const students = buildStudentList(
    rosterNames, sessions, focusEvents, prompts, responses
  );

  /* Determine if a session is active (any student currently joined) */
  const sessionActive = students.some(
    s => s.status === 'focused' || s.status === 'unfocused'
  );

  return {
    sessionActive,
    activePrompt: activePromptData,
    students
  };
}

/**
 * Build the activePrompt object for the dashboard response.
 */
function buildActivePromptData(prompts, responses, rosterCount, rosterNames) {
  if (!prompts || prompts.length === 0) return null;

  /* Find the most recent prompt (active or recently expired) */
  const sorted = prompts
    .slice()
    .sort((a, b) => new Date(b.IssuedAt).getTime() - new Date(a.IssuedAt).getTime());

  const latest = sorted[0];
  if (!latest) return null;

  /* Only show prompts that are either active or expired within the last session */
  const isActive = (latest.IsActive === true || latest.IsActive === 'TRUE');
  const isExpired = latest.ExpiresAt && new Date(latest.ExpiresAt) < new Date();

  /* Get matched responses and respondent names */
  const matchedResponses = responses.filter(
    r => r.PromptID === latest.PromptID && (r.Matched === true || r.Matched === 'TRUE')
  );
  const respondentNames = [...new Set(matchedResponses.map(r => r.StudentName))];

  /* Determine who has NOT responded */
  const respondentNamesNorm = new Set(respondentNames.map(n => normalizeName(n)));
  const nonRespondents = (rosterNames || []).filter(
    n => !respondentNamesNorm.has(normalizeName(n))
  );

  if (!isActive && isExpired) {
    return {
      phrase: latest.ExpectedPhrase,
      issuedAt: latest.IssuedAt instanceof Date ? latest.IssuedAt.toISOString() : latest.IssuedAt,
      expiresAt: latest.ExpiresAt instanceof Date ? latest.ExpiresAt.toISOString() : latest.ExpiresAt,
      responsesReceived: matchedResponses.length,
      rosterCount,
      respondents: respondentNames,
      nonRespondents: nonRespondents
    };
  }

  if (!isActive) return null;

  /* Active prompt */
  return {
    phrase: latest.ExpectedPhrase,
    issuedAt: latest.IssuedAt instanceof Date ? latest.IssuedAt.toISOString() : latest.IssuedAt,
    expiresAt: latest.ExpiresAt instanceof Date ? latest.ExpiresAt.toISOString() : latest.ExpiresAt,
    responsesReceived: matchedResponses.length,
    rosterCount,
    respondents: respondentNames,
    nonRespondents: nonRespondents
  };
}

/**
 * Build the full student list: one entry per roster name + unmatched entries.
 */
function buildStudentList(rosterNames, sessions, focusEvents, prompts, responses) {
  const students = [];

  /* ── Roster students ───────────────────────────────── */
  for (const name of rosterNames) {
    /* Include ALL sessions for this roster student (matched or name-matched) */
    const normalizedRosterName = normalizeName(name);
    const studentSessions = sessions.filter(
      s => normalizeName(String(s.StudentName || '')) === normalizedRosterName
    );

    /* Find the latest session (most recent JoinTime) */
    const latestSession = studentSessions
      .slice()
      .sort((a, b) => new Date(b.JoinTime).getTime() - new Date(a.JoinTime).getTime())[0] || null;

    /* Get focus events for the latest session */
    const sessionFocusEvents = latestSession
      ? focusEvents.filter(e => e.SessionID === latestSession.SessionID)
      : [];

    /* Compute status */
    const status = determineStatus(latestSession, sessionFocusEvents);

    /* Compute engagement */
    const attentivenessPct = latestSession
      ? computeAttentiveness(latestSession, sessionFocusEvents)
      : 0;

    const studentResponses = responses.filter(r => r.StudentName === name);
    const participationRate = computeParticipation(
      studentSessions, prompts, studentResponses
    );

    /* Find the most recent event of any kind */
    const allTimestamps = [
      ...(latestSession && latestSession.JoinTime ? [new Date(latestSession.JoinTime)] : []),
      ...sessionFocusEvents.map(e => new Date(e.Timestamp)),
      ...studentResponses.map(r => new Date(r.Timestamp))
    ].filter(d => !isNaN(d.getTime()));

    const lastActivityAt = allTimestamps.length > 0
      ? new Date(Math.max(...allTimestamps.map(d => d.getTime()))).toISOString()
      : null;

    students.push({
      name,
      status,
      joinedAt: latestSession && latestSession.JoinTime
        ? (latestSession.JoinTime instanceof Date
          ? latestSession.JoinTime.toISOString()
          : latestSession.JoinTime)
        : null,
      lastActivityAt,
      attentivenessPct,
      participationRate,
      matched: true
    });
  }

  /* ── Unmatched entries ─────────────────────────────── */
  /* Only show truly unmatched names — exclude anyone whose name
     matches a roster entry (those are stale sessions from before
     the matching fix). */
  const rosterNamesNormalized = new Set(rosterNames.map(n => normalizeName(n)));
  const unmatchedSessions = sessions.filter(
    s => (s.Matched === false || s.Matched === 'FALSE') &&
         !rosterNamesNormalized.has(normalizeName(String(s.StudentName || '')))
  );

  /* Group by student name */
  const unmatchedNames = [...new Set(unmatchedSessions.map(s => s.StudentName))];

  for (const name of unmatchedNames) {
    const studentSessions = unmatchedSessions.filter(s => s.StudentName === name);

    const latestSession = studentSessions
      .slice()
      .sort((a, b) => new Date(b.JoinTime).getTime() - new Date(a.JoinTime).getTime())[0] || null;

    const sessionFocusEvents = latestSession
      ? focusEvents.filter(e => e.SessionID === latestSession.SessionID)
      : [];

    const status = determineStatus(latestSession, sessionFocusEvents);

    const attentivenessPct = latestSession
      ? computeAttentiveness(latestSession, sessionFocusEvents)
      : 0;

    const studentResponses = responses.filter(r => r.StudentName === name);
    const participationRate = computeParticipation(
      studentSessions, prompts, studentResponses
    );

    const allTimestamps = [
      ...(latestSession && latestSession.JoinTime ? [new Date(latestSession.JoinTime)] : []),
      ...sessionFocusEvents.map(e => new Date(e.Timestamp)),
      ...studentResponses.map(r => new Date(r.Timestamp))
    ].filter(d => !isNaN(d.getTime()));

    const lastActivityAt = allTimestamps.length > 0
      ? new Date(Math.max(...allTimestamps.map(d => d.getTime()))).toISOString()
      : null;

    students.push({
      name,
      status,
      joinedAt: latestSession && latestSession.JoinTime
        ? (latestSession.JoinTime instanceof Date
          ? latestSession.JoinTime.toISOString()
          : latestSession.JoinTime)
        : null,
      lastActivityAt,
      attentivenessPct,
      participationRate,
      matched: false
    });
  }

  return students;
}

/* ── POST logEvent ─────────────────────────────────────── */

/**
 * Handle join/leave/focus_lost/focus_regained events from the extension.
 *
 * Request body: { action: 'logEvent', studentName: '...', type: '...' }
 * type is one of: 'join', 'leave', 'focus_lost', 'focus_regained'
 */
function handleLogEvent(body) {
  const { studentName, type } = body;

  if (!studentName || !type) {
    return { error: 'Missing studentName or type' };
  }

  /* Match against roster */
  const canonical = matchToRoster(studentName);
  const resolvedName = canonical || studentName;
  const matched = canonical !== null;

  const now = new Date();

  switch (type) {
    case 'join': {
      const sessionId = generateId('sess');
      appendRow('Sessions', [
        sessionId,
        resolvedName,
        matched,
        now,
        ''  /* LeaveTime — null until leave */
      ]);
      return { success: true, sessionId, matched, resolvedName };
    }

    case 'leave': {
      /* Find the student's most recent open session (no LeaveTime) */
      const openSessions = findRows('Sessions', 'StudentName', resolvedName)
        .filter(r => !r.data.LeaveTime || r.data.LeaveTime === '');

      if (openSessions.length > 0) {
        /* Close the most recent open session */
        const latest = openSessions[openSessions.length - 1];
        updateCell('Sessions', 'LeaveTime', latest.rowIndex, now);
        return { success: true, sessionId: latest.data.SessionID };
      }

      return { success: true, message: 'No open session found to close' };
    }

    case 'focus_lost':
    case 'focus_regained': {
      /* Find the student's most recent open session */
      const activeSessions = findRows('Sessions', 'StudentName', resolvedName)
        .filter(r => !r.data.LeaveTime || r.data.LeaveTime === '');

      if (activeSessions.length === 0) {
        return { error: 'No active session for this student' };
      }

      const session = activeSessions[activeSessions.length - 1];
      const eventType = type === 'focus_lost' ? 'lost' : 'regained';

      appendRow('FocusEvents', [
        generateId('evt'),
        resolvedName,
        session.data.SessionID,
        eventType,
        now
      ]);

      return { success: true, sessionId: session.data.SessionID };
    }

    default:
      return { error: `Unknown event type: ${type}` };
  }
}

/* ── POST submitChat ───────────────────────────────────── */

/**
 * Handle chat text submission from the extension.
 * Matches against the currently active prompt.
 *
 * Request body: { action: 'submitChat', studentName: '...', text: '...' }
 */
function handleSubmitChat(body) {
  const { studentName, text } = body;

  if (!studentName || text === undefined) {
    return { error: 'Missing studentName or text' };
  }

  /* Match against roster */
  const canonical = matchToRoster(studentName);
  const resolvedName = canonical || studentName;

  /* Find the active prompt */
  const prompts = getAllRows('ChatPrompts');
  const now = new Date();

  const activePrompt = prompts.find(p => {
    if (p.IsActive !== true && p.IsActive !== 'TRUE') return false;
    if (p.ExpiresAt && new Date(p.ExpiresAt) < now) return false;
    return true;
  });

  if (!activePrompt) {
    return { success: true, matched: false, reason: 'No active prompt' };
  }

  /* Normalize both for comparison */
  const normalizedText = normalizeName(text);
  const normalizedPhrase = normalizeName(activePrompt.ExpectedPhrase);
  const isMatch = normalizedText === normalizedPhrase;

  /* Log the response */
  appendRow('ChatResponses', [
    generateId('resp'),
    resolvedName,
    activePrompt.PromptID,
    text,
    isMatch,
    now
  ]);

  return { success: true, matched: isMatch };
}

/* ── POST setPrompt ────────────────────────────────────── */

/**
 * Set a new chat prompt. Expires any currently active prompt first.
 *
 * Request body: { action: 'setPrompt', phrase: '...', durationSeconds: 60 }
 *
 * Also callable via google.script.run.setNewPrompt(phrase, duration)
 * from the GAS-served dashboard page.
 */
function setNewPrompt(phrase, durationSeconds) {
  return handleSetPrompt({ phrase, durationSeconds });
}

function handleSetPrompt(body) {
  const { phrase, durationSeconds } = body;

  if (!phrase) {
    return { error: 'Missing phrase' };
  }

  const duration = durationSeconds || 60;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + duration * 1000);

  /* Expire any currently active prompts */
  const prompts = findRows('ChatPrompts', 'IsActive', true);
  for (const p of prompts) {
    updateCell('ChatPrompts', 'IsActive', p.rowIndex, false);
  }
  /* Also check for string 'TRUE' (Sheets sometimes stores booleans as strings) */
  const promptsTRUE = findRows('ChatPrompts', 'IsActive', 'TRUE');
  for (const p of promptsTRUE) {
    updateCell('ChatPrompts', 'IsActive', p.rowIndex, false);
  }

  /* Create the new prompt */
  const promptId = generateId('prmt');
  appendRow('ChatPrompts', [
    promptId,
    phrase,
    now,
    expiresAt,
    true
  ]);

  return {
    success: true,
    promptId,
    phrase,
    issuedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString()
  };
}

/* ═══════════════════════════════════════════════════════════
   TEST / DEBUG HELPERS
   Run these from the Apps Script editor to verify behavior.
   ═══════════════════════════════════════════════════════════ */

/**
 * Test: Log a join event for a roster student.
 */
function testLogJoin() {
  const result = handleLogEvent({
    studentName: 'Dela Cruz, Juan A.',
    type: 'join'
  });
  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test: Log a focus lost event.
 */
function testLogFocusLost() {
  const result = handleLogEvent({
    studentName: 'Dela Cruz, Juan A.',
    type: 'focus_lost'
  });
  Logger.log(JSON.stringify(result, null, 2));
}

/**
 * Test: Set a prompt and submit a chat response.
 */
function testPromptAndResponse() {
  /* Set prompt */
  const promptResult = handleSetPrompt({
    phrase: 'hello world',
    durationSeconds: 120
  });
  Logger.log('Set prompt: ' + JSON.stringify(promptResult));

  /* Submit matching response */
  const chatResult = handleSubmitChat({
    studentName: 'Dela Cruz, Juan A.',
    text: '  Hello World  '
  });
  Logger.log('Submit chat: ' + JSON.stringify(chatResult));
}

/**
 * Test: Get full dashboard data.
 */
function testDashboardData() {
  const result = handleDashboardData();
  Logger.log(JSON.stringify(result, null, 2));
}

/* ═══════════════════════════════════════════════════════════
   STALE DATA CLEANUP
   Removes orphaned sessions and stale entries.
   Can be triggered manually, from the dashboard, or on a schedule.
   ═══════════════════════════════════════════════════════════ */

/**
 * Purge stale data from all sheets.
 *
 * Rules:
 * 1. Sessions with Matched=FALSE whose StudentName matches a roster
 *    entry (ghost sessions from before the matching fix).
 * 2. Sessions with no LeaveTime that are older than 12 hours
 *    (student closed browser without triggering leave event).
 * 3. FocusEvents and ChatResponses whose SessionID no longer exists.
 *
 * @returns {{ deletedSessions, closedSessions, deletedEvents, deletedResponses }}
 */
function purgeStaleData() {
  const rosterNames = getRosterNames().map(n => normalizeName(n));
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);

  /* ── 1. Delete ghost sessions (Matched=FALSE but on roster) ── */
  const sessionsSheet = getOrCreateSheet('Sessions');
  const sessData = sessionsSheet.getDataRange().getValues();
  const sessHeaders = sessData[0];
  const colIdx = key => sessHeaders.indexOf(key);

  const matchedCol    = colIdx('Matched');
  const nameCol       = colIdx('StudentName');
  const sessionIdCol  = colIdx('SessionID');
  const joinTimeCol   = colIdx('JoinTime');
  const leaveTimeCol  = colIdx('LeaveTime');

  const rowsToDelete = [];
  const rowsToClose  = [];
  const validSessionIds = new Set();

  for (let i = sessData.length - 1; i >= 1; i--) {
    const row = sessData[i];
    const isMatched = row[matchedCol] === true || row[matchedCol] === 'TRUE';
    const rawName   = String(row[nameCol] || '');
    const sessionId = String(row[sessionIdCol] || '');
    const joinTime  = row[joinTimeCol] ? new Date(row[joinTimeCol]) : null;
    const leaveTime = row[leaveTimeCol] ? new Date(row[leaveTimeCol]) : null;

    /* Ghost: unmatched but on roster */
    if (!isMatched && rosterNames.includes(normalizeName(rawName))) {
      rowsToDelete.push(i + 1); /* Sheet rows are 1-indexed */
      continue;
    }

    /* Stale open session: no leave time and joined >12h ago */
    if (!leaveTime && joinTime && joinTime < twelveHoursAgo) {
      rowsToClose.push({ rowIndex: i + 1, sessionId });
      continue;
    }

    validSessionIds.add(sessionId);
  }

  /* Close stale open sessions */
  for (const { rowIndex, sessionId } of rowsToClose) {
    sessionsSheet.getRange(rowIndex, leaveTimeCol + 1).setValue(now);
    validSessionIds.add(sessionId);
  }

  /* Delete ghost rows (in reverse order to preserve indices) */
  for (const rowIndex of rowsToDelete) {
    sessionsSheet.deleteRow(rowIndex);
  }

  /* ── 2. Delete FocusEvents with no valid session ── */
  const focusSheet = getOrCreateSheet('FocusEvents');
  const focusData  = focusSheet.getDataRange().getValues();
  const focusSessionCol = focusData[0].indexOf('SessionID');
  let deletedEvents = 0;

  for (let i = focusData.length - 1; i >= 1; i--) {
    const sid = String(focusData[i][focusSessionCol] || '');
    if (!validSessionIds.has(sid)) {
      focusSheet.deleteRow(i + 1);
      deletedEvents++;
    }
  }

  /* ── 3. Delete orphaned ChatResponses ── */
  const respSheet = getOrCreateSheet('ChatResponses');
  const respData  = respSheet.getDataRange().getValues();
  /* ChatResponses don't link to sessions, so just trim
     responses older than 30 days to keep the sheet lean */
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const respTimestampCol = respData[0].indexOf('Timestamp');
  let deletedResponses = 0;

  for (let i = respData.length - 1; i >= 1; i--) {
    const ts = respData[i][respTimestampCol] ? new Date(respData[i][respTimestampCol]) : null;
    if (ts && ts < thirtyDaysAgo) {
      respSheet.deleteRow(i + 1);
      deletedResponses++;
    }
  }

  const summary = {
    deletedGhostSessions: rowsToDelete.length,
    closedStaleSessions:  rowsToClose.length,
    deletedOrphanEvents:  deletedEvents,
    deletedOldResponses:  deletedResponses,
    ranAt:                now.toISOString()
  };

  Logger.log('purgeStaleData: ' + JSON.stringify(summary));
  return summary;
}

/**
 * Install a daily time-based trigger to auto-purge stale data.
 * Run this ONCE from the Apps Script editor (Run → installDailyCleanup).
 * It sets up a trigger that fires every day at midnight PH time.
 */
function installDailyCleanup() {
  /* Remove any existing cleanup triggers first */
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'purgeStaleData') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('purgeStaleData')
    .timeBased()
    .everyDays(1)
    .atHour(0)     /* Midnight */
    .create();

  Logger.log('Daily cleanup trigger installed.');
}

