/* ═══════════════════════════════════════════════════════════
   api.js — Fetch wrapper for dashboard polling and
   prompt submission. Handles errors gracefully and
   preserves last-known-good data.

   NOTE: For local development, use ?mock=true in the URL.
   For production, set API_BASE to your deployed Apps Script
   web app URL (looks like:
   https://script.google.com/macros/s/DEPLOY_ID/exec).
   ═══════════════════════════════════════════════════════════ */

import { isMockMode, generateMockData, mockSendPrompt } from './mock.js';

/* ── Configuration ─────────────────────────────────────── */
const API_BASE = 'https://script.google.com/macros/s/AKfycbx7QkmCJbaiX4H9lJHKaFzqmRyEnZ-oRpbAhOCypDJluOIm3NGL4gpysUGykB2YzMT7Bg/exec';
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
