/* ═══════════════════════════════════════════════════════════
   session.js — Session control: course selector, start/end
   class, session timer. Phase 2 feature.
   ═══════════════════════════════════════════════════════════ */

import { fetchCourses, startSession, endSession, fetchSessionState } from './api.js';

/* ── State ─────────────────────────────────────────────── */
let _sessionActive = false;
let _sessionId = null;
let _sectionId = null;
let _startedAt = null;
let _timerInterval = null;
let _onSessionChange = null; /* callback for app.js */

export function getCurrentSessionId() {
  return _sessionId;
}

/* ── Init ──────────────────────────────────────────────── */

/**
 * Initialize session control UI.
 * @param {Function} onSessionChange — called with (isActive) whenever session state changes
 */
export async function initSessionControl(onSessionChange) {
  _onSessionChange = onSessionChange;

  const selector = document.getElementById('course-selector');
  const btnStart = document.getElementById('btn-start-class');
  const btnEnd   = document.getElementById('btn-end-class');

  if (!selector || !btnStart || !btnEnd) return;

  /* Load courses */
  const result = await fetchCourses();
  if (result.courses && result.courses.length > 0) {
    selector.innerHTML = '<option value="" disabled selected>Select a course…</option>';
    for (const c of result.courses) {
      const opt = document.createElement('option');
      opt.value = c.sectionId;
      opt.textContent = `${c.courseName} — ${c.sectionName}`;
      selector.appendChild(opt);
    }
  } else {
    selector.innerHTML = '<option value="" disabled selected>No courses found</option>';
  }

  /* Enable/disable start button based on selector */
  selector.addEventListener('change', () => {
    btnStart.disabled = !selector.value || _sessionActive;
  });

  /* Start Class */
  btnStart.addEventListener('click', async () => {
    if (!selector.value || _sessionActive) return;

    btnStart.disabled = true;
    btnStart.textContent = 'Starting…';

    const result = await startSession(selector.value);

    if (result.error) {
      alert('Failed to start session: ' + result.error);
      btnStart.disabled = false;
      btnStart.textContent = 'Start Class';
      return;
    }

    _sessionActive = true;
    _sessionId = result.sessionId;
    _sectionId = result.sectionId;
    _startedAt = result.startedAt;

    updateSessionUI();
    startTimer();

    if (_onSessionChange) _onSessionChange(true);
  });

  /* End Class */
  btnEnd.addEventListener('click', async () => {
    if (!_sessionActive) return;

    if (!confirm('Are you sure you want to end this class session?')) return;

    btnEnd.disabled = true;
    btnEnd.textContent = 'Ending…';

    const result = await endSession(_sessionId);

    if (result.error) {
      alert('Failed to end session: ' + result.error);
      btnEnd.disabled = false;
      btnEnd.textContent = 'End Class';
      return;
    }

    _sessionActive = false;
    _sessionId = null;
    _sectionId = null;
    _startedAt = null;

    stopTimer();
    updateSessionUI();

    /* Pass summary to app layer for display */
    if (_onSessionChange) _onSessionChange(false, result.summary || null);
  });

  /* Check for already-active session (e.g. after page refresh) */
  const state = await fetchSessionState();
  if (state.active) {
    _sessionActive = true;
    _sessionId = state.sessionId;
    _sectionId = state.sectionId;
    _startedAt = state.startedAt;

    /* Select the correct course in the dropdown */
    if (selector.querySelector(`option[value="${state.sectionId}"]`)) {
      selector.value = state.sectionId;
    }

    updateSessionUI();
    startTimer();

    if (_onSessionChange) _onSessionChange(true);
  }
}

/* ── Session State Queries ─────────────────────────────── */

export function isSessionActive() {
  return _sessionActive;
}

export function getSessionState() {
  return {
    active: _sessionActive,
    sessionId: _sessionId,
    sectionId: _sectionId,
    startedAt: _startedAt
  };
}

/**
 * Update session state from poll data (keeps UI in sync if
 * the session was started/ended from another tab).
 */
export function syncSessionFromPoll(sessionData) {
  if (!sessionData) {
    if (_sessionActive) {
      _sessionActive = false;
      _sessionId = null;
      _sectionId = null;
      _startedAt = null;
      stopTimer();
      updateSessionUI();
      if (_onSessionChange) _onSessionChange(false);
    }
    return;
  }

  if (sessionData.active && !_sessionActive) {
    _sessionActive = true;
    _sessionId = sessionData.sessionId;
    _sectionId = sessionData.sectionId;
    _startedAt = sessionData.startedAt;
    updateSessionUI();
    startTimer();
    if (_onSessionChange) _onSessionChange(true);
  }
}

/* ── Timer ─────────────────────────────────────────────── */

function startTimer() {
  stopTimer();
  updateTimerDisplay();
  _timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (_timerInterval) {
    clearInterval(_timerInterval);
    _timerInterval = null;
  }
}

function updateTimerDisplay() {
  const el = document.getElementById('session-timer');
  if (!el) return;

  if (!_startedAt) {
    el.textContent = '0:00:00';
    return;
  }

  const elapsed = Math.floor((Date.now() - new Date(_startedAt).getTime()) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;

  el.textContent = `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/* ── UI Updates ────────────────────────────────────────── */

function updateSessionUI() {
  const selector = document.getElementById('course-selector');
  const btnStart = document.getElementById('btn-start-class');
  const btnEnd   = document.getElementById('btn-end-class');
  const timerEl  = document.getElementById('session-timer');
  const bar      = document.getElementById('session-control');

  if (_sessionActive) {
    if (selector) selector.disabled = true;
    if (btnStart) {
      btnStart.disabled = true;
      btnStart.textContent = 'Start Class';
    }
    if (btnEnd) {
      btnEnd.disabled = false;
      btnEnd.textContent = 'End Class';
      btnEnd.classList.remove('btn--hidden');
    }
    if (bar) bar.classList.add('session-control--active');
  } else {
    if (selector) selector.disabled = false;
    if (btnStart) {
      btnStart.disabled = !selector || !selector.value;
      btnStart.textContent = 'Start Class';
    }
    if (btnEnd) {
      btnEnd.disabled = true;
      btnEnd.textContent = 'End Class';
      btnEnd.classList.add('btn--hidden');
    }
    if (timerEl) timerEl.textContent = '0:00:00';
    if (bar) bar.classList.remove('session-control--active');
  }
}
