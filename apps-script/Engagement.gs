/* ═══════════════════════════════════════════════════════════
   Engagement.gs — Server-side engagement calculations.
   Recomputed on every dashboardData request — never stored.
   ═══════════════════════════════════════════════════════════ */

/* Threshold constants (tunable) */
var FOCUS_LAPSE_THRESHOLD_MS  = 60 * 1000;  /* 60s — must be unfocused this long to count as a lapse */
var HEARTBEAT_DISCONNECT_MS   = 45 * 1000;  /* 45s — no heartbeat = disconnected */

/**
 * Determine a student's current live status based on their latest session
 * and focus events.
 *
 * @param {Object|null} latestSession — Most recent session or null
 * @param {Object[]} focusEvents — Focus events for the latest session
 * @returns {string} — 'not_joined' | 'on_meet' | 'away'
 */
function determineStatus(latestSession, focusEvents) {
  if (!latestSession || !latestSession.JoinTime) {
    return 'not_joined';
  }

  /* If the student has left, they're not_joined */
  if (latestSession.LeaveTime) {
    return 'not_joined';
  }

  /* Check the most recent focus event */
  const sorted = focusEvents
    .filter(e => e.Timestamp)
    .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

  if (sorted.length > 0 && sorted[0].Type === 'lost') {
    return 'away';
  }

  return 'on_meet';
}

/**
 * Compute focus lapses for a student.
 *
 * A "lapse" is a focus_lost → focus_regained pair (or lost → session end)
 * whose duration exceeds FOCUS_LAPSE_THRESHOLD_MS.
 * Brief tab flicks under the threshold are ignored entirely.
 *
 * @param {Object} session — { JoinTime, LeaveTime }
 * @param {Object[]} focusEvents — { Type: 'lost'|'regained', Timestamp }
 * @returns {{ count: number, totalSeconds: number, lapses: Array }}
 */
function computeFocusLapses(session, focusEvents) {
  if (!session || !session.JoinTime) {
    return { count: 0, totalSeconds: 0, lapses: [] };
  }

  const endTime = session.LeaveTime
    ? new Date(session.LeaveTime).getTime()
    : Date.now();

  /* Sort chronologically */
  const events = focusEvents
    .filter(e => e.Timestamp)
    .map(e => ({ type: e.Type, time: new Date(e.Timestamp).getTime() }))
    .sort((a, b) => a.time - b.time);

  const lapses = [];
  let lostAt = null;

  for (const evt of events) {
    if (evt.type === 'lost' && lostAt === null) {
      lostAt = evt.time;
    } else if (evt.type === 'regained' && lostAt !== null) {
      const durationMs = evt.time - lostAt;
      if (durationMs >= FOCUS_LAPSE_THRESHOLD_MS) {
        lapses.push({
          startedAt: new Date(lostAt).toISOString(),
          durationSeconds: Math.round(durationMs / 1000)
        });
      }
      lostAt = null;
    }
  }

  /* If still unfocused at session end, that's also a lapse */
  if (lostAt !== null) {
    const durationMs = endTime - lostAt;
    if (durationMs >= FOCUS_LAPSE_THRESHOLD_MS) {
      lapses.push({
        startedAt: new Date(lostAt).toISOString(),
        durationSeconds: Math.round(durationMs / 1000)
      });
    }
  }

  const totalSeconds = lapses.reduce((sum, l) => sum + l.durationSeconds, 0);

  return { count: lapses.length, totalSeconds, lapses };
}

/**
 * Compute participation for a student.
 * Returns { answered, issued } counts for the detail view.
 *
 * @param {Object[]} sessions — Student's sessions [{ JoinTime, LeaveTime }]
 * @param {Object[]} allPrompts — All ChatPrompts [{ PromptID, IssuedAt }]
 * @param {Object[]} studentResponses — This student's ChatResponses
 * @returns {{ answered: number, issued: number, rate: number }}
 */
function computeParticipation(sessions, allPrompts, studentResponses) {
  if (!allPrompts || allPrompts.length === 0) return { answered: 0, issued: 0, rate: 0 };
  if (!sessions || sessions.length === 0) return { answered: 0, issued: 0, rate: 0 };

  let issued = 0;
  let answered = 0;

  for (const prompt of allPrompts) {
    const issuedAt = new Date(prompt.IssuedAt).getTime();

    const wasPresent = sessions.some(session => {
      const joinTime = new Date(session.JoinTime).getTime();
      const leaveTime = session.LeaveTime
        ? new Date(session.LeaveTime).getTime()
        : Date.now();
      return issuedAt >= joinTime && issuedAt <= leaveTime;
    });

    if (wasPresent) {
      issued++;
      const hasCorrect = studentResponses.some(
        r => r.PromptID === prompt.PromptID && r.Matched === true
      );
      if (hasCorrect) answered++;
    }
  }

  const rate = issued > 0 ? Math.round((answered / issued) * 100) : 0;
  return { answered, issued, rate };
}

/**
 * Compute active alerts for a single student.
 * Returns an array of alert type strings (empty if none).
 *
 * Alert types:
 *   'sustained_unfocus'   — unfocused continuously > FOCUS_LAPSE_THRESHOLD_MS
 *   'missing_extension'   — no heartbeat for > HEARTBEAT_DISCONNECT_MS while joined
 *   'unanswered_prompt'   — active prompt with no matched response from this student
 *
 * @param {Object} student — { name, liveStatus }
 * @param {Object|null} latestSession — { JoinTime, LeaveTime }
 * @param {Object[]} sessionFocusEvents — Focus events for the current session
 * @param {Object|null} heartbeatRow — { LastHeartbeatAt } or null
 * @param {Object|null} activePrompt — The active prompt object or null
 * @param {Object[]} studentResponses — This student's ChatResponses
 * @returns {string[]}
 */
function computeActiveAlerts(student, latestSession, sessionFocusEvents, heartbeatRow, activePrompt, studentResponses) {
  const alerts = [];
  const now = Date.now();

  /* Only compute alerts for joined students */
  if (student.liveStatus === 'not_joined') return alerts;

  /* ── Sustained unfocus ── */
  if (student.liveStatus === 'away') {
    /* Find the most recent unresolved focus_lost */
    const sorted = sessionFocusEvents
      .filter(e => e.Timestamp)
      .sort((a, b) => new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime());

    const latestLost = sorted.find(e => e.Type === 'lost');
    if (latestLost) {
      const lostMs = now - new Date(latestLost.Timestamp).getTime();
      if (lostMs >= FOCUS_LAPSE_THRESHOLD_MS) {
        alerts.push('sustained_unfocus');
      }
    }
  }

  /* ── Missing extension heartbeat ── */
  if (!heartbeatRow || !heartbeatRow.LastHeartbeatAt) {
    alerts.push('missing_extension');
  } else {
    const lastBeat = new Date(heartbeatRow.LastHeartbeatAt).getTime();
    if (now - lastBeat > HEARTBEAT_DISCONNECT_MS) {
      alerts.push('missing_extension');
    }
  }

  /* ── Unanswered prompt ── */
  if (activePrompt) {
    /* Only alert if the prompt window has actually closed */
    const promptExpired = activePrompt.ExpiresAt
      ? new Date(activePrompt.ExpiresAt).getTime() < now
      : false;

    if (promptExpired) {
      const hasResponse = studentResponses.some(
        r => r.PromptID === activePrompt.PromptID && r.Matched === true
      );
      if (!hasResponse) {
        alerts.push('unanswered_prompt');
      }
    }
  }

  return alerts;
}
