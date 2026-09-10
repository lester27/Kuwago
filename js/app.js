/* ═══════════════════════════════════════════════════════════
   app.js — Entry point: init, poll loop, nav switching,
   search filtering, table sorting.
   ═══════════════════════════════════════════════════════════ */

import { fetchDashboardData } from './api.js';
import {
  renderAll,
  renderRosterTable,
  renderSummaryCards,
  setFilter,
  setSearch,
  setSort
} from './render.js';
import { initPromptModal } from './prompt.js';
import { initRespondentsModal, updateRespondentData } from './respondents.js';

/* ── Configuration ─────────────────────────────────────── */
const POLL_INTERVAL_MS = 5000;
const COUNTDOWN_INTERVAL_MS = 1000;

/* ── State ─────────────────────────────────────────────── */
let _pollTimer = null;
let _countdownTimer = null;
let _currentView = 'roster'; /* 'roster' | 'unmatched' */
let _latestData = null;
let _pollInProgress = false;

/* ── Init ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  initNav();
  initSearch();
  initFilters();
  initSorting();
  initPromptModal(onPromptSent);
  initRespondentsModal();

  /* First fetch */
  await poll();

  /* Start poll loop */
  _pollTimer = setInterval(poll, POLL_INTERVAL_MS);

  /* Start countdown updater (for prompt timer) */
  _countdownTimer = setInterval(() => {
    if (_latestData) {
      renderSummaryCards(_latestData);
    }
  }, COUNTDOWN_INTERVAL_MS);
});

/* ── Polling ───────────────────────────────────────────── */

async function poll() {
  if (_pollInProgress) return;

  _pollInProgress = true;
  try {
    const result = await fetchDashboardData();
    if (result.data) {
      _latestData = result.data;
      renderAll(result.data, result.pollFailed);
      updateRespondentData(result.data.activePrompt);
    }
  } finally {
    _pollInProgress = false;
  }
}

/* ── Prompt Sent Callback ──────────────────────────────── */

async function onPromptSent() {
  /* Immediately re-poll to pick up the new prompt */
  await poll();
}

/* ── Navigation ────────────────────────────────────────── */

function initNav() {
  const navRoster = document.getElementById('nav-roster');
  const navUnmatched = document.getElementById('nav-unmatched');
  const viewRoster = document.getElementById('view-roster');
  const viewUnmatched = document.getElementById('view-unmatched');

  if (navRoster) {
    navRoster.addEventListener('click', () => {
      _currentView = 'roster';
      navRoster.classList.add('nav-item--active');
      if (navUnmatched) navUnmatched.classList.remove('nav-item--active');
      if (viewRoster) viewRoster.hidden = false;
      if (viewUnmatched) viewUnmatched.hidden = true;
    });
  }

  if (navUnmatched) {
    navUnmatched.addEventListener('click', () => {
      _currentView = 'unmatched';
      navUnmatched.classList.add('nav-item--active');
      if (navRoster) navRoster.classList.remove('nav-item--active');
      if (viewRoster) viewRoster.hidden = true;
      if (viewUnmatched) viewUnmatched.hidden = false;
    });
  }
}

/* ── Search ────────────────────────────────────────────── */

function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  let debounceTimer = null;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setSearch(input.value);
      if (_latestData) {
        renderRosterTable(_latestData.students);
      }
    }, 150);
  });
}

/* ── Filters ───────────────────────────────────────────── */

function initFilters() {
  const buttons = document.querySelectorAll('.filter-btn');

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      /* Update active state */
      buttons.forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      /* Apply filter */
      const filter = btn.getAttribute('data-filter');
      setFilter(filter);

      if (_latestData) {
        renderRosterTable(_latestData.students);
      }
    });
  });
}

/* ── Sorting ───────────────────────────────────────────── */

function initSorting() {
  const headers = document.querySelectorAll('.data-table th.sortable');

  headers.forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort');
      if (!key) return;

      /* Update visual state */
      headers.forEach(h => h.classList.remove('sorted'));
      th.classList.add('sorted');

      setSort(key);

      if (_latestData) {
        renderRosterTable(_latestData.students);
      }
    });
  });
}
