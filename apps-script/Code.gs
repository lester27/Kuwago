/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   Code.gs Ã¢â‚¬â€ Main entry point. Routes doGet/doPost requests,
   implements endpoint handlers, and serves the dashboard.
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

/* Ã¢â€â‚¬Ã¢â€â‚¬ Configuration Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

/**
 * CORS headers for cross-origin requests.
 * Only needed if the dashboard is hosted separately from this script.
 */
var CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

/* Ã¢â€â‚¬Ã¢â€â‚¬ HTTP Handlers Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

/**
 * Handle GET requests.
 * Routes on e.parameter.action:
 *   (none)          Ã¢â€ â€™ serve dashboard HTML
 *   currentPrompt   Ã¢â€ â€™ return active prompt JSON
 *   dashboardData   Ã¢â€ â€™ return full aggregated state
 *   setPrompt       Ã¢â€ â€™ create a new prompt (GET-safe for CORS)
 *   logEvent        Ã¢â€ â€™ log a student event (GET-safe for CORS)
 *   submitChat      Ã¢â€ â€™ submit a chat response (GET-safe for CORS)
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

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Session control endpoints Ã¢â€â‚¬Ã¢â€â‚¬ */
    case 'getCourses':
      return jsonResponse(handleGetCourses());

    case 'startSession':
      return jsonResponse(handleStartSession({
        sectionId: p.sectionId || ''
      }));

    case 'endSession':
      return jsonResponse(handleEndSession({
        sessionId: p.sessionId || ''
      }));

    case 'getSessionState':
      return jsonResponse(handleGetSessionState());

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Extension health endpoint Ã¢â€â‚¬Ã¢â€â‚¬ */
    case 'heartbeat':
      return jsonResponse(handleHeartbeat({
        studentName: p.studentName || '',
        version:     p.version || ''
      }));

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Mutation endpoints exposed on GET for standalone-dashboard CORS Ã¢â€â‚¬Ã¢â€â‚¬ */
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

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Batch 2: Name resolution & attendance Ã¢â€â‚¬Ã¢â€â‚¬ */
    case 'resolveMatch':
      return jsonResponse(handleResolveMatch({
        detectedName: p.detectedName || '',
        resolvedTo:   p.resolvedTo   || null   /* null = dismiss as non-student */
      }));

    case 'overrideAttendance':
      return jsonResponse(handleOverrideAttendance({
        sessionId:   p.sessionId   || '',
        studentName: p.studentName || '',
        status:      p.status      || '',
        reason:      p.reason      || ''
      }));

    /* Ã¢â€â‚¬Ã¢â€â‚¬ Restructure: Student detail Ã¢â€â‚¬Ã¢â€â‚¬ */
    case 'studentDetail':
      return jsonResponse(handleStudentDetail({
        sessionId:   p.sessionId   || '',
        studentName: p.studentName || ''
      }));

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

/* Ã¢â€â‚¬Ã¢â€â‚¬ HtmlService Helper Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

/**
 * Include a file's content in an HTML template.
 * Used by Index.html: <?!= include('Styles') ?>
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ JSON Response Helper Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

function jsonResponse(data, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   ENDPOINT HANDLERS
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

/* Ã¢â€â‚¬Ã¢â€â‚¬ GET currentPrompt Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

/**
 * Returns the currently active (non-expired) prompt, if any.
 * Called by the Chrome extension every ~5Ã¢â‚¬â€œ10 seconds.
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

/* Ã¢â€â‚¬Ã¢â€â‚¬ GET dashboardData Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

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
  /* Check active session */
  const sessionState = handleGetSessionState();

  /* Load all raw data */
  const rosterNames = sessionState.active && sessionState.sectionId
    ? getRosterForSection(sessionState.sectionId)
    : getRosterNames();
  const sessions     = getAllRows('Sessions');
  const focusEvents  = getAllRows('FocusEvents');
  const prompts      = getAllRows('ChatPrompts');
  const responses    = getAllRows('ChatResponses');
  const heartbeats   = getAllRows('Heartbeats');

  /* Build the active prompt info */
  const activePromptData = buildActivePromptData(prompts, responses, rosterNames.length, rosterNames);

  /* Find the currently active prompt object (for alert computation) */
  const now = new Date();
  const activePromptObj = prompts.find(p => {
    if (p.IsActive !== true && p.IsActive !== 'TRUE') return false;
    if (p.ExpiresAt && new Date(p.ExpiresAt) < now) return false;
    return true;
  }) || null;

  /* Build the slim student list with alerts */
  const students = buildStudentList(
    rosterNames, sessions, focusEvents, prompts, responses,
    sessionState, heartbeats, activePromptObj
  );

  /* Determine if a session is active */
  const sessionActive = sessionState.active || students.some(
    s => s.liveStatus === 'on_meet' || s.liveStatus === 'away'
  );

  /* Build extension health data */
  const extensionHealth = buildExtensionHealth(rosterNames, sessions);

  return {
    sessionActive,
    activePrompt: activePromptData,
    students,
    extensionHealth,
    session: sessionState.active ? sessionState : null
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
 * Build the slim student list for the roster poll.
 * Each entry: { name, liveStatus, attendanceStatus, activeAlerts, matched }.
 * Heavy per-student data (focus lapses, participation detail) lives in studentDetail.
 */
function buildStudentList(rosterNames, sessions, focusEvents, prompts, responses, sessionState, heartbeats, activePromptObj) {
  const students = [];
  const sessionStartedAt = sessionState && sessionState.startedAt ? sessionState.startedAt : null;
  const GRACE_PERIOD_MS = 10 * 60 * 1000;

  /* Build heartbeat lookup by normalized name */
  const hbByName = {};
  if (heartbeats) {
    for (const hb of heartbeats) {
      hbByName[normalizeName(String(hb.StudentName || ''))] = hb;
    }
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Roster students Ã¢â€â‚¬Ã¢â€â‚¬ */
  for (const name of rosterNames) {
    const normalizedName = normalizeName(name);
    const studentSessions = sessions.filter(
      s => normalizeName(String(s.StudentName || '')) === normalizedName
    );

    const latestSession = studentSessions
      .slice()
      .sort((a, b) => new Date(b.JoinTime).getTime() - new Date(a.JoinTime).getTime())[0] || null;

    const sessionFocusEvents = latestSession
      ? focusEvents.filter(e => e.SessionID === latestSession.SessionID)
      : [];

    const liveStatus = determineStatus(latestSession, sessionFocusEvents);

    /* Attendance */
    let attendanceStatus = 'Absent';
    if (latestSession) {
      const override = latestSession.OverrideStatus;
      if (override) {
        attendanceStatus = String(override);
      } else if (latestSession.AttendanceStatus) {
        attendanceStatus = String(latestSession.AttendanceStatus);
      } else if (sessionStartedAt && latestSession.JoinTime) {
        const joinMs  = new Date(latestSession.JoinTime).getTime();
        const startMs = new Date(sessionStartedAt).getTime();
        attendanceStatus = (joinMs <= startMs + GRACE_PERIOD_MS) ? 'Present' : 'Late';
      }
    }

    /* Alerts */
    const studentResponses = responses.filter(r => normalizeName(String(r.StudentName || '')) === normalizedName);
    const heartbeatRow = hbByName[normalizedName] || null;
    const studentObj = { name, liveStatus };
    const activeAlerts = computeActiveAlerts(
      studentObj, latestSession, sessionFocusEvents,
      heartbeatRow, activePromptObj, studentResponses
    );

    students.push({
      name,
      liveStatus,
      attendanceStatus,
      activeAlerts,
      matched: true
    });
  }

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Unmatched entries Ã¢â€â‚¬Ã¢â€â‚¬ */
  const rosterNamesNormalized = new Set(rosterNames.map(n => normalizeName(n)));
  const unmatchedSessions = sessions.filter(
    s => (s.Matched === false || s.Matched === 'FALSE') &&
         !rosterNamesNormalized.has(normalizeName(String(s.StudentName || '')))
  );

  const unmatchedNames = [...new Set(unmatchedSessions.map(s => s.StudentName))];

  for (const name of unmatchedNames) {
    const studentSessions = unmatchedSessions.filter(s => s.StudentName === name);

    const latestSession = studentSessions
      .slice()
      .sort((a, b) => new Date(b.JoinTime).getTime() - new Date(a.JoinTime).getTime())[0] || null;

    const sessionFocusEvents = latestSession
      ? focusEvents.filter(e => e.SessionID === latestSession.SessionID)
      : [];

    const liveStatus = determineStatus(latestSession, sessionFocusEvents);
    const suggestions = suggestMatches(name, rosterNames);

    students.push({
      name,
      liveStatus,
      attendanceStatus: null,
      activeAlerts: [],
      matched: false,
      suggestions
    });
  }

  return students;
}

/* Ã¢â€â‚¬Ã¢â€â‚¬ POST logEvent Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

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

  /* Match against roster Ã¢â‚¬â€ alias-aware */
  const canonical = matchToRosterWithAlias(studentName);
  const resolvedName = canonical || studentName;
  const matched = canonical !== null;

  const now = new Date();

  switch (type) {
    case 'join': {
      const sessionId = generateId('sess');

      /* Auto-compute attendance for this join */
      const sessionState = handleGetSessionState();
      let attendanceStatus = '';
      if (sessionState.active && sessionState.startedAt) {
        const startMs = new Date(sessionState.startedAt).getTime();
        const GRACE_MS = 10 * 60 * 1000;
        attendanceStatus = (now.getTime() <= startMs + GRACE_MS) ? 'Present' : 'Late';
      }

      appendRow('Sessions', [
        sessionId,
        resolvedName,
        matched,
        now,
        '',             /* LeaveTime */
        attendanceStatus,
        '',             /* OverrideStatus */
        '',             /* OverrideReason */
        ''              /* OverrideAt */
      ]);
      return { success: true, sessionId, matched, resolvedName, attendanceStatus };
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

/* Ã¢â€â‚¬Ã¢â€â‚¬ POST submitChat Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

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

/* Ã¢â€â‚¬Ã¢â€â‚¬ POST setPrompt Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬ */

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

/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   SESSION CONTROL HANDLERS (Phase 2)
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

/**
 * Return all courses/sections from the Courses sheet.
 */
function handleGetCourses() {
  const rows = getAllRows('Courses');
  return {
    courses: rows.map(r => ({
      sectionId:   r.SectionID   || '',
      courseName:  r.CourseName  || '',
      sectionName: r.SectionName || ''
    }))
  };
}

/**
 * Get the current active session state.
 * Returns { active, sessionId, sectionId, startedAt } or { active: false }.
 */
function handleGetSessionState() {
  const rows = getAllRows('ActiveSession');
  if (rows.length === 0) return { active: false };

  const latest = rows[rows.length - 1];
  const isActive = latest.Active === true || latest.Active === 'TRUE';

  if (!isActive) return { active: false };

  return {
    active: true,
    sessionId:  latest.SessionID  || '',
    sectionId:  latest.SectionID  || '',
    startedAt:  latest.StartedAt instanceof Date
      ? latest.StartedAt.toISOString()
      : (latest.StartedAt || '')
  };
}

/**
 * Start a new class session.
 * Rejects if a session is already active.
 */
function handleStartSession(body) {
  const { sectionId } = body;

  if (!sectionId) {
    return { error: 'Missing sectionId' };
  }

  /* Check for existing active session */
  const current = handleGetSessionState();
  if (current.active) {
    return { error: 'A session is already active. End it before starting a new one.' };
  }

  const sessionId = generateId('cls');
  const now = new Date();

  /* Write to ActiveSession (overwrite Ã¢â‚¬â€ single-row table) */
  const sheet = getOrCreateSheet('ActiveSession');
  const dataRows = sheet.getDataRange().getValues();

  if (dataRows.length > 1) {
    /* Overwrite existing row */
    sheet.getRange(2, 1, 1, 4).setValues([[sessionId, sectionId, now, true]]);
  } else {
    /* Append first row */
    sheet.appendRow([sessionId, sectionId, now, true]);
  }

  return {
    success: true,
    sessionId,
    sectionId,
    startedAt: now.toISOString()
  };
}

/**
 * End the current class session.
 * Closes all open student sessions, expires active prompts,
 * and generates a per-session summary sheet tab.
 */
function handleEndSession(body) {
  const current = handleGetSessionState();

  if (!current.active) {
    return { error: 'No active session to end' };
  }

  const sessionId = current.sessionId;
  const sectionId = current.sectionId;
  const now = new Date();

  /* 1. Close all open student sessions (set LeaveTime = now) */
  const sessSheet = getOrCreateSheet('Sessions');
  const sessData = sessSheet.getDataRange().getValues();
  if (sessData.length > 1) {
    const headers = sessData[0].map(String);
    const leaveCol = headers.indexOf('LeaveTime');
    for (let i = 1; i < sessData.length; i++) {
      if (!sessData[i][leaveCol] || sessData[i][leaveCol] === '') {
        sessSheet.getRange(i + 1, leaveCol + 1).setValue(now);
      }
    }
  }

  /* 2. Expire any active prompts */
  const activePrompts = findRows('ChatPrompts', 'IsActive', true);
  for (const p of activePrompts) {
    updateCell('ChatPrompts', 'IsActive', p.rowIndex, false);
  }
  const activePromptsTRUE = findRows('ChatPrompts', 'IsActive', 'TRUE');
  for (const p of activePromptsTRUE) {
    updateCell('ChatPrompts', 'IsActive', p.rowIndex, false);
  }

  /* 3. Mark session inactive */
  const activeSheet = getOrCreateSheet('ActiveSession');
  const activeData = activeSheet.getDataRange().getValues();
  if (activeData.length > 1) {
    const headers = activeData[0].map(String);
    const activeCol = headers.indexOf('Active');
    activeSheet.getRange(2, activeCol + 1).setValue(false);
  }

  /* 4. Generate per-session summary sheet and capture summary */
  const summary = generateSessionSheet(sessionId, sectionId, current.startedAt, now.toISOString());

  return {
    success: true,
    endedAt: now.toISOString(),
    summary
  };
}

/**
 * Generate a finalized per-session sheet tab.
 * Named: Session_YYYY-MM-DD_SectionID
 * Returns the summary rows for immediate frontend display.
 */
function generateSessionSheet(sessionId, sectionId, startedAt, endedAt) {
  const ss = getSpreadsheet();
  const startDate = new Date(startedAt);
  const dateStr = Utilities.formatDate(startDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const sheetName = 'Session_' + dateStr + '_' + (sectionId || 'Unknown');

  /* Avoid duplicate sheet names */
  let finalName = sheetName;
  let counter = 1;
  while (ss.getSheetByName(finalName)) {
    finalName = sheetName + '_' + counter;
    counter++;
  }

  const summarySheet = ss.insertSheet(finalName);

  /* Headers per spec */
  const headers = [
    'StudentName', 'TimeIn', 'TimeOut', 'AttendanceStatus',
    'FocusLapseCount', 'AwaySeconds', 'AttentivenessPct',
    'PromptsAnswered', 'PromptsIssued', 'ParticipationPct',
    'IdentityMatched', 'Notes'
  ];
  summarySheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  summarySheet.setFrozenRows(1);
  summarySheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#f1f5f9');

  /* Load all required data */
  const sessions    = getAllRows('Sessions');
  const focusEvents = getAllRows('FocusEvents');
  const prompts     = getAllRows('ChatPrompts');
  const responses   = getAllRows('ChatResponses');

  /* Get roster for this section */
  const rosterNames = getRosterForSection(sectionId);

  const sessionStartMs = new Date(startedAt).getTime();
  const sessionEndMs   = new Date(endedAt).getTime();
  const sessionDurationMs = sessionEndMs - sessionStartMs;
  const gracePeriodMs = 10 * 60 * 1000; /* 10 minutes grace for Present vs Late */

  const rows = [];
  const summaryStudents = []; /* For returning to frontend */

  for (const name of rosterNames) {
    const normalizedName = normalizeName(name);

    /* Find all session rows for this student */
    const studentSessions = sessions.filter(
      s => normalizeName(String(s.StudentName || '')) === normalizedName
    );

    /* Find the student's session that falls within this class time window.
       NOTE: We cannot match on the class sessionId (cls_xxx) because student
       sessions use their own IDs (sess_xxx). Instead, match by join time. */
    const latestSession = studentSessions
      .filter(s => {
        if (!s.JoinTime) return false;
        const joinMs = new Date(s.JoinTime).getTime();
        /* Accept joins up to 10min before class start (clock skew) and before session end */
        return joinMs >= (sessionStartMs - gracePeriodMs) && joinMs <= sessionEndMs;
      })
      .sort((a, b) => new Date(b.JoinTime).getTime() - new Date(a.JoinTime).getTime())[0] || null;

    /* Session focus events */
    const sessionFocusEvents = latestSession
      ? focusEvents.filter(e => e.SessionID === latestSession.SessionID)
      : [];

    /* Time in / out */
    const timeIn = latestSession && latestSession.JoinTime
      ? new Date(latestSession.JoinTime)
      : null;
    const timeOut = latestSession && latestSession.LeaveTime
      ? new Date(latestSession.LeaveTime)
      : (latestSession ? new Date(endedAt) : null);

    /* Attendance â€” respect override if set */
    let attendance = 'Absent';
    if (latestSession) {
      if (latestSession.OverrideStatus) {
        attendance = String(latestSession.OverrideStatus);
      } else if (latestSession.AttendanceStatus) {
        attendance = String(latestSession.AttendanceStatus);
      } else if (timeIn) {
        const joinMs = timeIn.getTime();
        attendance = (joinMs <= sessionStartMs + gracePeriodMs) ? 'Present' : 'Late';
      }
    }

    /* Focus lapses */
    const lapses = computeFocusLapses(latestSession, sessionFocusEvents);
    const awaySeconds = lapses.totalSeconds;
    const attPct = sessionDurationMs > 0 && timeIn
      ? Math.max(0, Math.round((1 - awaySeconds / (sessionDurationMs / 1000)) * 100))
      : (timeIn ? 100 : 0);

    /* Participation */
    const studentResponses = responses.filter(
      r => normalizeName(String(r.StudentName || '')) === normalizedName
    );
    const part = computeParticipation(
      latestSession ? [latestSession] : [],
      prompts,
      studentResponses
    );
    const answered = part.answered;
    const issued   = part.issued;
    const partPct  = part.rate;

    /* Identity: was this student matched or unmatched at some point? */
    const identityMatched = latestSession
      ? (latestSession.Matched !== false && latestSession.Matched !== 'FALSE' ? 'Y' : 'N')
      : 'N';

    /* Notes: override reason if any */
    const notes = latestSession && latestSession.OverrideReason
      ? String(latestSession.OverrideReason)
      : '';

    rows.push([
      name,
      timeIn || '',
      timeOut || '',
      attendance,
      lapses.count,
      awaySeconds,
      attPct,
      answered,
      issued,
      partPct,
      identityMatched,
      notes
    ]);

    summaryStudents.push({
      name,
      timeIn: timeIn ? timeIn.toISOString() : null,
      timeOut: timeOut ? timeOut.toISOString() : null,
      attendance,
      focusLapses: lapses.count,
      awaySeconds,
      attentivenessPct: attPct,
      answered,
      issued,
      participationPct: partPct,
      identityMatched: identityMatched === 'Y'
    });
  }

  if (rows.length > 0) {
    summarySheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    /* Format time columns */
    summarySheet.getRange(2, 2, rows.length, 2)
      .setNumberFormat('hh:mm:ss');

    /* Auto-resize columns */
    for (let c = 1; c <= headers.length; c++) {
      summarySheet.autoResizeColumn(c);
    }
  }

  return { sheetName: finalName, students: summaryStudents };
}


/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   EXTENSION HEALTH HANDLERS (Phase 2)
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

/**
 * Handle heartbeat from a student's Chrome extension.
 */
function handleHeartbeat(body) {
  const { studentName, version } = body;

  if (!studentName) {
    return { error: 'Missing studentName' };
  }

  /* Match against roster */
  const canonical = matchToRoster(studentName);
  const resolvedName = canonical || studentName;

  upsertHeartbeat(resolvedName, version || 'unknown');

  return { success: true, resolvedName };
}

/**
 * Build extension health data for the dashboard response.
 * Cross-references Heartbeats with roster and active sessions.
 */
function buildExtensionHealth(rosterNames, sessions) {
  const heartbeats = getAllRows('Heartbeats');
  const now = Date.now();
  const DISCONNECT_THRESHOLD_MS = 45 * 1000; /* 45 seconds */

  const health = [];

  for (const name of rosterNames) {
    const normalizedName = normalizeName(name);

    /* Find heartbeat row for this student */
    const hb = heartbeats.find(
      h => normalizeName(String(h.StudentName || '')) === normalizedName
    );

    /* Find if student has an open session */
    const hasOpenSession = sessions.some(s =>
      normalizeName(String(s.StudentName || '')) === normalizedName &&
      (!s.LeaveTime || s.LeaveTime === '')
    );

    if (!hb) {
      health.push({
        name,
        connected: false,
        detectedName: null,
        extensionVersion: null,
        lastHeartbeat: null,
        status: hasOpenSession ? 'no_heartbeat' : 'never_connected'
      });
      continue;
    }

    const lastBeat = hb.LastHeartbeatAt
      ? new Date(hb.LastHeartbeatAt).getTime()
      : 0;
    const elapsed = now - lastBeat;
    const connected = elapsed < DISCONNECT_THRESHOLD_MS;

    let status = 'connected';
    if (!connected && hasOpenSession) {
      status = 'connection_lost';
    } else if (!connected) {
      status = 'disconnected';
    }

    health.push({
      name,
      connected,
      detectedName: String(hb.StudentName || ''),
      extensionVersion: String(hb.ExtensionVersion || 'unknown'),
      lastHeartbeat: hb.LastHeartbeatAt instanceof Date
        ? hb.LastHeartbeatAt.toISOString()
        : (hb.LastHeartbeatAt || null),
      status
    });
  }

  return health;
}

/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   BATCH 2 HANDLERS Ã¢â‚¬â€ Name Resolution & Attendance
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

/**
 * Resolve an unmatched display name to a roster student (or dismiss).
 * Writes to NameAliases for future auto-matching.
 * Retroactively relabels this session's data under the detected name.
 *
 * GET ?action=resolveMatch&detectedName=...&resolvedTo=...
 * resolvedTo = canonical roster name, or empty = "not a student"
 */
function handleResolveMatch(body) {
  const { detectedName, resolvedTo } = body;

  if (!detectedName) {
    return { error: 'Missing detectedName' };
  }

  const canonical = resolvedTo || null; /* null / '' = dismiss */

  /* Write alias so future sessions auto-match */
  writeAlias(detectedName, canonical);

  if (canonical) {
    /* Retroactively relabel Sessions rows */
    const sessSheet = getOrCreateSheet('Sessions');
    const sessData  = sessSheet.getDataRange().getValues();
    const headers   = sessData[0].map(String);
    const nameCol   = headers.indexOf('StudentName');
    const matchCol  = headers.indexOf('Matched');

    const normDetected = normalizeName(detectedName);
    for (let i = 1; i < sessData.length; i++) {
      if (normalizeName(String(sessData[i][nameCol] || '')) === normDetected) {
        sessSheet.getRange(i + 1, nameCol + 1).setValue(canonical);
        sessSheet.getRange(i + 1, matchCol + 1).setValue(true);
      }
    }

    /* Retroactively relabel FocusEvents rows */
    const focusSheet = getOrCreateSheet('FocusEvents');
    const focusData  = focusSheet.getDataRange().getValues();
    const focusHeaders = focusData[0].map(String);
    const focusNameCol = focusHeaders.indexOf('StudentName');
    for (let i = 1; i < focusData.length; i++) {
      if (normalizeName(String(focusData[i][focusNameCol] || '')) === normDetected) {
        focusSheet.getRange(i + 1, focusNameCol + 1).setValue(canonical);
      }
    }

    /* Retroactively relabel ChatResponses rows */
    const respSheet  = getOrCreateSheet('ChatResponses');
    const respData   = respSheet.getDataRange().getValues();
    const respHeaders = respData[0].map(String);
    const respNameCol = respHeaders.indexOf('StudentName');
    for (let i = 1; i < respData.length; i++) {
      if (normalizeName(String(respData[i][respNameCol] || '')) === normDetected) {
        respSheet.getRange(i + 1, respNameCol + 1).setValue(canonical);
      }
    }
  }

  return {
    success: true,
    detectedName,
    resolvedTo: canonical,
    dismissed: canonical === null
  };
}

/**
 * Override a student's attendance status manually.
 * Writes to Sessions (OverrideStatus/Reason/At) and appends to AttendanceAuditLog.
 *
 * GET ?action=overrideAttendance&sessionId=...&studentName=...&status=...&reason=...
 */
function handleOverrideAttendance(body) {
  const { sessionId, studentName, status, reason } = body;

  if (!studentName || !status) {
    return { error: 'Missing studentName or status' };
  }

  const validStatuses = ['Present', 'Late', 'Absent', 'Excused'];
  if (!validStatuses.includes(status)) {
    return { error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` };
  }

  const now = new Date();

  /* Find the student's session row to read old status and write override */
  const sessSheet = getOrCreateSheet('Sessions');
  const sessData  = sessSheet.getDataRange().getValues();
  const headers   = sessData[0].map(String);
  const nameCol         = headers.indexOf('StudentName');
  const attStatusCol    = headers.indexOf('AttendanceStatus');
  const overrideStatCol = headers.indexOf('OverrideStatus');
  const overrideReaCol  = headers.indexOf('OverrideReason');
  const overrideAtCol   = headers.indexOf('OverrideAt');

  const normalizedName = normalizeName(studentName);
  let oldStatus = 'Absent';
  let found = false;

  for (let i = 1; i < sessData.length; i++) {
    if (normalizeName(String(sessData[i][nameCol] || '')) === normalizedName) {
      oldStatus = String(sessData[i][attStatusCol] || sessData[i][overrideStatCol] || 'Absent');
      /* Write override */
      if (overrideStatCol !== -1) sessSheet.getRange(i + 1, overrideStatCol + 1).setValue(status);
      if (overrideReaCol  !== -1) sessSheet.getRange(i + 1, overrideReaCol  + 1).setValue(reason || '');
      if (overrideAtCol   !== -1) sessSheet.getRange(i + 1, overrideAtCol   + 1).setValue(now);
      found = true;
      break;
    }
  }

  /* Append to AttendanceAuditLog regardless of whether row was found */
  appendRow('AttendanceAuditLog', [
    studentName,
    sessionId || '',
    oldStatus,
    status,
    reason || '',
    now
  ]);

  return {
    success: true,
    studentName,
    oldStatus,
    newStatus: status,
    reason: reason || '',
    changedAt: now.toISOString()
  };
}

/* â”€â”€ GET studentDetail â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */

/**
 * Return rich per-student detail for the overlay panel.
 * Only called on demand (when professor clicks a roster row),
 * not on every 5-second poll.
 *
 * GET ?action=studentDetail&sessionId=...&studentName=...
 */
function handleStudentDetail(body) {
  const { sessionId, studentName } = body;
  if (!studentName) return { error: 'Missing studentName' };

  const sessions   = getAllRows('Sessions');
  const focusEvts  = getAllRows('FocusEvents');
  const prompts    = getAllRows('ChatPrompts');
  const responses  = getAllRows('ChatResponses');
  const heartbeats = getAllRows('Heartbeats');
  const auditLog   = getAllRows('AttendanceAuditLog');

  const normalizedName = normalizeName(studentName);

  /* Find all sessions for this student */
  const studentSessions = sessions.filter(
    s => normalizeName(String(s.StudentName || '')) === normalizedName
  );

  /* Use the session matching the requested sessionId if given, else latest */
  const targetSession = sessionId
    ? studentSessions.find(s => s.SessionID === sessionId) || null
    : (studentSessions.sort((a, b) => new Date(b.JoinTime).getTime() - new Date(a.JoinTime).getTime())[0] || null);

  /* Focus events for this session */
  const sessionFocusEvents = targetSession
    ? focusEvts.filter(e => e.SessionID === targetSession.SessionID)
    : [];

  /* Live status */
  const liveStatus = determineStatus(targetSession, sessionFocusEvents);

  /* Focus lapses */
  const focusLapses = computeFocusLapses(targetSession, sessionFocusEvents);

  /* Participation detail */
  const studentResponses = responses.filter(
    r => normalizeName(String(r.StudentName || '')) === normalizedName
  );
  const participation = computeParticipation(studentSessions, prompts, studentResponses);

  /* Per-prompt response detail */
  const promptDetail = prompts.map(p => {
    const resp = studentResponses.find(r => r.PromptID === p.PromptID);
    return {
      promptId: p.PromptID,
      phrase: p.ExpectedPhrase,
      issuedAt: p.IssuedAt,
      submittedText: resp ? resp.SubmittedText : null,
      matched: resp ? (resp.Matched === true || resp.Matched === 'TRUE') : false,
      responded: !!resp,
      timestamp: resp ? resp.Timestamp : null
    };
  });

  /* Attendance with override history */
  let attendanceStatus = 'Absent';
  if (targetSession) {
    if (targetSession.OverrideStatus) {
      attendanceStatus = String(targetSession.OverrideStatus);
    } else if (targetSession.AttendanceStatus) {
      attendanceStatus = String(targetSession.AttendanceStatus);
    }
  }

  const overrideHistory = auditLog
    .filter(r => normalizeName(String(r.StudentName || '')) === normalizedName &&
                 (!sessionId || r.SessionID === sessionId))
    .sort((a, b) => new Date(a.ChangedAt).getTime() - new Date(b.ChangedAt).getTime())
    .map(r => ({
      from: r.OldStatus,
      to: r.NewStatus,
      reason: r.Reason || null,
      at: r.ChangedAt
    }));

  /* Extension health */
  const hbRow = heartbeats.find(
    h => normalizeName(String(h.StudentName || '')) === normalizedName
  ) || null;
  const now = Date.now();
  const connected = hbRow && hbRow.LastHeartbeatAt
    ? (now - new Date(hbRow.LastHeartbeatAt).getTime()) < HEARTBEAT_DISCONNECT_MS
    : false;

  /* Identity */
  const matched = !studentSessions.some(s => s.Matched === false || s.Matched === 'FALSE');

  return {
    name: studentName,
    liveStatus,
    joinedAt: targetSession && targetSession.JoinTime ? targetSession.JoinTime : null,
    leftAt:   targetSession && targetSession.LeaveTime ? targetSession.LeaveTime : null,
    attendance: {
      status: attendanceStatus,
      overrides: overrideHistory
    },
    focusLapses,
    participation: {
      answered: participation.answered,
      issued: participation.issued,
      prompts: promptDetail
    },
    extension: {
      connected,
      version: hbRow ? (hbRow.ExtensionVersion || null) : null,
      lastHeartbeatAt: hbRow ? (hbRow.LastHeartbeatAt || null) : null,
      detectedName: hbRow ? (hbRow.StudentName || null) : null
    },
    identity: { matched }
  };
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• 
   TEST / DEBUG HELPERS
   Run these from the Apps Script editor to verify behavior.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•  */

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

/* Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â
   STALE DATA CLEANUP
   Removes orphaned sessions and stale entries.
   Can be triggered manually, from the dashboard, or on a schedule.
   Ã¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢ÂÃ¢â€¢Â */

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

  /* Ã¢â€â‚¬Ã¢â€â‚¬ 1. Delete ghost sessions (Matched=FALSE but on roster) Ã¢â€â‚¬Ã¢â€â‚¬ */
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

  /* Ã¢â€â‚¬Ã¢â€â‚¬ 2. Delete FocusEvents with no valid session Ã¢â€â‚¬Ã¢â€â‚¬ */
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

  /* Ã¢â€â‚¬Ã¢â€â‚¬ 3. Delete orphaned ChatResponses Ã¢â€â‚¬Ã¢â€â‚¬ */
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
 * Run this ONCE from the Apps Script editor (Run Ã¢â€ â€™ installDailyCleanup).
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

