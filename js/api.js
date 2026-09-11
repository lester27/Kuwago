/* ═══════════════════════════════════════════════════════════
   api.js — Fetch wrapper for dashboard polling and
   prompt submission. Handles errors gracefully and
   preserves last-known-good data.

   NOTE: For local development, use ?mock=true in the URL.
   For production, set API_BASE to your deployed Apps Script
   web app URL (looks like:
   https://script.google.com/macros/s/DEPLOY_ID/exec).
   ═══════════════════════════════════════════════════════════ */

import {
  isMockMode, generateMockData, mockSendPrompt,
  mockGetCourses, mockStartSession, mockEndSession, mockGetSessionState,
  mockResolveMatch, mockOverrideAttendance, mockStudentDetail
} from './mock.js';

/* ── Configuration ─────────────────────────────────────── */
const API_BASE = 'https://script.google.com/macros/s/AKfycbwL9EYd_XOQSqELRbdupUcpZhCxhZ7dt9fASZKkKxYtdEtDkWmW3iIRiK3HNQL7WTBG5g/exec';
const REQUEST_TIMEOUT_MS = 30000;

/* ── State ─────────────────────────────────────────────── */
let _lastGoodData = null;
let _pollFailed = false;
let _consecutiveFailures = 0;

/* ── Public API ────────────────────────────────────────── */

/**
 * Fetch the latest dashboard data.
 * Returns { data, pollFailed } where data is always
 * populated (last-known-good on failure).
 */
export async function fetchDashboardData() {
  /* Mock mode */
  if (isMockMode()) {
    const data = generateMockData();
    _lastGoodData = data;
    _pollFailed = false;
    _consecutiveFailures = 0;
    return { data, pollFailed: false };
  }

  /* Real fetch */
  try {
    const res = await fetch(`${API_BASE}?action=dashboardData`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const data = await res.json();
    _lastGoodData = data;
    _pollFailed = false;
    _consecutiveFailures = 0;
    return { data, pollFailed: false };

  } catch (err) {
    _consecutiveFailures++;
    _pollFailed = true;
    console.warn(
      `[api] Poll failed (attempt ${_consecutiveFailures}):`,
      err.message
    );

    return {
      data: _lastGoodData,
      pollFailed: true,
      consecutiveFailures: _consecutiveFailures,
      error: err.message
    };
  }
}

/**
 * Send a new chat prompt to the backend.
 * @param {string} phrase - The expected phrase
 * @param {number} durationSeconds - How long the prompt stays active
 * @returns {{ success: boolean, error?: string }}
 */
export async function sendPrompt(phrase, durationSeconds) {
  /* Mock mode */
  if (isMockMode()) {
    return mockSendPrompt(phrase, durationSeconds);
  }

  /* Real fetch — use GET to avoid Apps Script POST redirect CORS issue */
  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'setPrompt');
    url.searchParams.set('phrase', phrase);
    url.searchParams.set('durationSeconds', String(durationSeconds));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    return { success: true };

  } catch (err) {
    console.error('[api] sendPrompt failed:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Check if currently in poll-failure state.
 */
export function isPollFailed() {
  return _pollFailed;
}

/**
 * Get the number of consecutive poll failures.
 */
export function getConsecutiveFailures() {
  return _consecutiveFailures;
}

/* ═══════════════════════════════════════════════════════════
   SESSION CONTROL API (Phase 2)
   ═══════════════════════════════════════════════════════════ */

/**
 * Fetch the list of available courses/sections.
 * @returns {{ courses: Array<{ sectionId, courseName, sectionName }> }}
 */
export async function fetchCourses() {
  if (isMockMode()) {
    return mockGetCourses();
  }

  try {
    const res = await fetch(`${API_BASE}?action=getCourses`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] fetchCourses failed:', err.message);
    return { courses: [], error: err.message };
  }
}

/**
 * Start a new class session.
 * @param {string} sectionId
 * @returns {{ success, sessionId, sectionId, startedAt } | { error }}
 */
export async function startSession(sectionId) {
  if (isMockMode()) {
    return mockStartSession(sectionId);
  }

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'startSession');
    url.searchParams.set('sectionId', sectionId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] startSession failed:', err.message);
    return { error: err.message };
  }
}

/**
 * End the current class session.
 * @param {string} sessionId
 * @returns {{ success, endedAt } | { error }}
 */
export async function endSession(sessionId) {
  if (isMockMode()) {
    return mockEndSession();
  }

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'endSession');
    url.searchParams.set('sessionId', sessionId);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] endSession failed:', err.message);
    return { error: err.message };
  }
}

/**
 * Get the current session state.
 * @returns {{ active, sessionId?, sectionId?, startedAt? }}
 */
export async function fetchSessionState() {
  if (isMockMode()) {
    return mockGetSessionState();
  }

  try {
    const res = await fetch(`${API_BASE}?action=getSessionState`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] fetchSessionState failed:', err.message);
    return { active: false, error: err.message };
  }
}

/* ═══════════════════════════════════════════════════════════
   BATCH 2 API — Name Resolution & Attendance
   ═══════════════════════════════════════════════════════════ */

/**
 * Resolve an unmatched display name to a roster student, or dismiss.
 * @param {string} detectedName — Raw unmatched name
 * @param {string|null} resolvedTo — Canonical roster name, or null to dismiss
 */
export async function resolveMatch(detectedName, resolvedTo) {
  if (isMockMode()) {
    return mockResolveMatch(detectedName, resolvedTo);
  }

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'resolveMatch');
    url.searchParams.set('detectedName', detectedName);
    if (resolvedTo) url.searchParams.set('resolvedTo', resolvedTo);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] resolveMatch failed:', err.message);
    return { error: err.message };
  }
}

/**
 * Override a student's attendance status manually.
 * @param {string} sessionId
 * @param {string} studentName
 * @param {string} status — 'Present' | 'Late' | 'Absent' | 'Excused'
 * @param {string} reason — Optional reason text
 */
export async function overrideAttendance(sessionId, studentName, status, reason) {
  if (isMockMode()) {
    return mockOverrideAttendance(sessionId, studentName, status, reason);
  }

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'overrideAttendance');
    url.searchParams.set('sessionId', sessionId || '');
    url.searchParams.set('studentName', studentName);
    url.searchParams.set('status', status);
    if (reason) url.searchParams.set('reason', reason);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] overrideAttendance failed:', err.message);
    return { error: err.message };
  }
}

/**
 * Fetch rich per-student detail for the overlay panel.
 * Called on demand when a roster row is clicked.
 * @param {string} sessionId
 * @param {string} studentName
 */
export async function fetchStudentDetail(sessionId, studentName) {
  if (isMockMode()) {
    return mockStudentDetail(sessionId, studentName);
  }

  try {
    const url = new URL(API_BASE);
    url.searchParams.set('action', 'studentDetail');
    if (sessionId) url.searchParams.set('sessionId', sessionId);
    url.searchParams.set('studentName', studentName);

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('[api] fetchStudentDetail failed:', err.message);
    return { error: err.message };
  }
}
