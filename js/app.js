/* ═══════════════════════════════════════════════════════════
   app.js — Entry point: init, poll loop, nav switching,
   search filtering, table sorting.
   ═══════════════════════════════════════════════════════════ */

import { fetchDashboardData, fetchStudentDetail } from './api.js';
import {
  renderAll,
  renderRosterTable,
  renderSummaryCards,
  renderStudentDetail,
  renderSessionSummary,
  setFilter,
  setSearch,
  setSort
} from './render.js';
import { initPromptModal } from './prompt.js';
import { initRespondentsModal, updateRespondentData } from './respondents.js';
import { initSessionControl, syncSessionFromPoll, isSessionActive } from './session.js';
import { initBatch2Interactions } from './attendance.js';

/* ── Configuration ─────────────────────────────────────── */
const POLL_INTERVAL_MS = 5000;
const COUNTDOWN_INTERVAL_MS = 1000;

/* ── State ─────────────────────────────────────────────── */
let _pollTimer = null;
let _countdownTimer = null;
let _currentView = 'roster'; /* 'roster' | 'unmatched' | 'health' */
let _latestData = null;
let _pollInProgress = false;

/* ── Init ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSearch();
  initSort();
  initPromptModal();
  initRespondentsModal();
  initBatch2Interactions(async () => {
    /* Trigger a poll immediately when resolution or override succeeds */
    await poll(true);
  });
  initStudentDetail();
  initFilters();
  initSessionSummary();

  /* Initialize session control */
  await initSessionControl((isActive, summary) => {
    /* Callback when session state changes */
    updatePromptButtonState(isActive);
    if (!isActive && summary) {
      renderSessionSummary(summary);
    }
  });

  /* First poll */
  await poll();

  /* Start the poll loop */
  _pollTimer = setInterval(poll, POLL_INTERVAL_MS);

  /* Start the countdown refresh loop (for prompt timer) */
  _countdownTimer = setInterval(() => {
    if (_latestData) {
      renderSummaryCards(_latestData);
    }
  }, COUNTDOWN_INTERVAL_MS);

  /* Remove the loading state */
  document.querySelector('.shell')?.classList.remove('app-loading');
});

/* ── Poll ──────────────────────────────────────────────── */

async function poll(force = false) {
  if (_pollInProgress && !force) return;
  _pollInProgress = true;

  try {
    const { data, pollFailed } = await fetchDashboardData();
    if (data) {
      _latestData = data;
      renderAll(data, pollFailed);
      updateRespondentData(data.activePrompt);

      /* Sync session state from poll data */
      if (data.session) {
        syncSessionFromPoll(data.session);
      }
    }
  } finally {
    _pollInProgress = false;
  }
}

/* ── Navigation ────────────────────────────────────────── */

function initNavigation() {
  const navRoster    = document.getElementById('nav-roster');
  const navUnmatched = document.getElementById('nav-unmatched');
  const navHealth    = document.getElementById('nav-health');

  const viewRoster    = document.getElementById('view-roster');
  const viewUnmatched = document.getElementById('view-unmatched');
  const viewHealth    = document.getElementById('view-health');

  function switchView(view) {
    _currentView = view;

    /* Update nav active state */
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('nav-item--active'));

    /* Show/hide views */
    if (viewRoster)    viewRoster.hidden    = view !== 'roster';
    if (viewUnmatched) viewUnmatched.hidden = view !== 'unmatched';
    if (viewHealth)    viewHealth.hidden    = view !== 'health';

    if (view === 'roster' && navRoster) navRoster.classList.add('nav-item--active');
    if (view === 'unmatched' && navUnmatched) navUnmatched.classList.add('nav-item--active');
    if (view === 'health' && navHealth) navHealth.classList.add('nav-item--active');
  }

  if (navRoster) {
    navRoster.addEventListener('click', () => switchView('roster'));
    navRoster.addEventListener('keydown', (e) => { if (e.key === 'Enter') switchView('roster'); });
  }

  if (navUnmatched) {
    navUnmatched.addEventListener('click', () => switchView('unmatched'));
    navUnmatched.addEventListener('keydown', (e) => { if (e.key === 'Enter') switchView('unmatched'); });
  }

  if (navHealth) {
    navHealth.addEventListener('click', () => switchView('health'));
    navHealth.addEventListener('keydown', (e) => { if (e.key === 'Enter') switchView('health'); });
  }
}

/* ── Search ────────────────────────────────────────────── */

function initSearch() {
  const input = document.getElementById('search-input');
  if (!input) return;

  input.addEventListener('input', () => {
    setSearch(input.value);
    if (_latestData) {
      renderRosterTable(_latestData.students);
    }
  });
}

/* ── Sort ──────────────────────────────────────────────── */

function initSort() {
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort');
      if (!key) return;
      setSort(key);
      if (_latestData) {
        renderRosterTable(_latestData.students);
      }
    });
  });
}

/* ── Filter Buttons ────────────────────────────────────── */

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      /* Update active style */
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');

      /* Apply filter and re-render */
      const filter = btn.getAttribute('data-filter');
      setFilter(filter);
      if (_latestData) {
        renderRosterTable(_latestData.students);
      }
    });
  });
}

/* ── Session Summary Modal ─────────────────────────────── */

function initSessionSummary() {
  const modal = document.getElementById('session-summary-modal');
  if (!modal) return;

  function close() { modal.classList.remove('is-open'); }

  document.getElementById('ss-close-btn')?.addEventListener('click', close);
  document.getElementById('ss-close-footer-btn')?.addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) close();
  });
}

/* ── Prompt Button State ───────────────────────────────── */

function updatePromptButtonState(isActive) {
  const btn = document.getElementById('btn-set-prompt');
  if (!btn) return;

  if (isActive) {
    btn.disabled = false;
    btn.title = '';
  } else {
    btn.disabled = true;
    btn.title = 'Start a class session first';
  }
}

/* ── Student Detail Overlay ────────────────────────────── */

function initStudentDetail() {
  const modal = document.getElementById('student-detail-modal');
  const closeBtn = document.getElementById('sd-close-btn');
  const rosterTable = document.getElementById('roster-table');

  if (!modal || !closeBtn || !rosterTable) return;

  function closeModal() {
    modal.classList.remove('is-open');
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  rosterTable.addEventListener('click', async (e) => {
    const row = e.target.closest('tr.roster-row');
    /* Ignore clicks on attendance badges */
    if (!row || e.target.closest('.attendance-badge')) return;

    const studentName = row.dataset.name;
    if (!studentName) return;

    /* Get current sessionId from session module */
    const sessionId = _latestData && _latestData.session ? _latestData.session.sessionId : null;

    /* Show modal and loading state */
    modal.classList.add('is-open');
    document.getElementById('sd-loading').hidden = false;
    document.getElementById('sd-content').hidden = true;
    document.getElementById('sd-name').textContent = studentName;

    const data = await fetchStudentDetail(sessionId, studentName);
    
    if (data && !data.error) {
      renderStudentDetail(data);
    } else {
      document.getElementById('sd-loading').innerHTML = '<p style="color:var(--status-unmatched)">Error loading student data.</p>';
    }
  });
}
