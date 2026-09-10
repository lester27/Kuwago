/* ═══════════════════════════════════════════════════════════
   Engagement.gs — Server-side engagement calculations.
   Recomputed on every dashboardData request — never stored.
   ═══════════════════════════════════════════════════════════ */

/**
 * Compute attentiveness percentage for a student.
 *
 * Attentiveness % = total focused time ÷ total session time
 *
 * Logic:
 * - Walk through the student's FocusEvents in chronological order.
 * - The student starts "focused" at JoinTime.
 * - Each "lost" event marks the start of an unfocused period.
 * - Each "regained" event marks the end of an unfocused period.
 * - If the student is currently focused (no unresolved "lost"),
 *   focused time extends to now.
 * - Total session time = now - JoinTime (or LeaveTime if left).
 *
 * @param {Object} session — { JoinTime, LeaveTime }
 * @param {Object[]} focusEvents — sorted by Timestamp asc,
 *   each { Type: 'lost'|'regained', Timestamp }
 * @returns {number} — Integer 0–100
 */
function computeAttentiveness(session, focusEvents) {
  if (!session || !session.JoinTime) return 0;

  const joinTime = new Date(session.JoinTime).getTime();
  const endTime = session.LeaveTime
    ? new Date(session.LeaveTime).getTime()
    : Date.now();

  const totalTime = endTime - joinTime;
  if (totalTime <= 0) return 100;

  /* Sort events chronologically */
  const events = focusEvents
    .filter(e => e.Timestamp)
    .map(e => ({
      type: e.Type,
      time: new Date(e.Timestamp).getTime()
    }))
    .sort((a, b) => a.time - b.time);

  /*
   * Walk through events. Student starts focused at joinTime.
   * Accumulate unfocused time between lost→regained pairs.
   */
  let unfocusedTime = 0;
  let lostAt = null;

  for (const evt of events) {
    if (evt.type === 'lost' && lostAt === null) {
      lostAt = evt.time;
    } else if (evt.type === 'regained' && lostAt !== null) {
      unfocusedTime += evt.time - lostAt;
      lostAt = null;
    }
  }

  /* If currently unfocused (unresolved "lost"), extend to endTime */
  if (lostAt !== null) {
    unfocusedTime += endTime - lostAt;
  }

  const focusedTime = totalTime - unfocusedTime;
  const pct = Math.round((focusedTime / totalTime) * 100);

  return Math.max(0, Math.min(100, pct));
}

/**
 * Compute participation rate for a student.
 *
 * Participation rate = correct responses ÷ prompts issued while present
 *
 * "While present" means the prompt was issued between the student's
 * JoinTime and LeaveTime (or now, if still connected).
 *
 * @param {string} studentName — Canonical or raw name
 * @param {Object[]} sessions — Student's sessions [{ JoinTime, LeaveTime }]
 * @param {Object[]} allPrompts — All ChatPrompts [{ PromptID, IssuedAt }]
 * @param {Object[]} studentResponses — This student's ChatResponses
 *   [{ PromptID, Matched }]
 * @returns {number} — Integer 0–100
 */
function computeParticipation(sessions, allPrompts, studentResponses) {
  if (!allPrompts || allPrompts.length === 0) return 0;
  if (!sessions || sessions.length === 0) return 0;

  /* Determine which prompts were issued while this student was present */
  let eligiblePrompts = 0;
  let correctResponses = 0;

  for (const prompt of allPrompts) {
    const issuedAt = new Date(prompt.IssuedAt).getTime();

    /* Check if the student was present (in any session) when this prompt was issued */
    const wasPresent = sessions.some(session => {
      const joinTime = new Date(session.JoinTime).getTime();
      const leaveTime = session.LeaveTime
        ? new Date(session.LeaveTime).getTime()
        : Date.now();
      return issuedAt >= joinTime && issuedAt <= leaveTime;
    });

    if (wasPresent) {
      eligiblePrompts++;

      /* Check if this student has a correct response to this prompt */
      const hasCorrect = studentResponses.some(
        r => r.PromptID === prompt.PromptID && r.Matched === true
      );
      if (hasCorrect) {
        correctResponses++;
      }
    }
  }

  if (eligiblePrompts === 0) return 0;

  const pct = Math.round((correctResponses / eligiblePrompts) * 100);
  return Math.max(0, Math.min(100, pct));
}

/**
 * Determine a student's current status based on their latest session
 * and focus events.
 *
 * @param {Object|null} latestSession — Most recent session or null
 * @param {Object[]} focusEvents — Focus events for the latest session
 * @returns {string} — 'not_joined' | 'focused' | 'unfocused'
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
    return 'unfocused';
  }

  return 'focused';
}
