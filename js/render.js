/* ═══════════════════════════════════════════════════════════
   render.js — DOM updaters for all dashboard regions.
   Every function takes data and updates the DOM in-place.
   No full page re-renders.
   ═══════════════════════════════════════════════════════════ */

/* ── Helpers ───────────────────────────────────────────── */

function $(selector) {
  return document.querySelector(selector);
}

function $$(selector) {
  return document.querySelectorAll(selector);
}

/**
 * Get initials from a name like "Dela Cruz, Juan A."
 * Returns 2-char string like "DJ"
 */
function getInitials(name) {
  const parts = name.split(',');
  if (parts.length >= 2) {
    const last = parts[0].trim();
    const first = parts[1].trim();
    return (first[0] + last[0]).toUpperCase();
  }
  /* Fallback for unmatched names */
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Relative time string: "12s ago", "3m ago", "1h ago"
 */
function relativeTime(isoString) {
  if (!isoString) return '\u2014';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

/**
 * Format status string for display
 */
function formatStatus(status) {
  switch (status) {
    case 'focused': return 'Focused';
    case 'unfocused': return 'Unfocused';
    case 'not_joined': return 'Not joined';
    default: return status;
  }
}

/**
 * Get CSS class for percentage value
 */
function pctClass(value) {
  if (value === 0) return 'pct-cell--zero';
  if (value >= 80) return 'pct-cell--high';
  if (value >= 50) return 'pct-cell--mid';
  return 'pct-cell--low';
}

/**
 * Time remaining as "Mm Ss" or "Expired"
 */
function formatCountdown(expiresAt) {
  const remaining = Math.max(0, Math.floor(
    (new Date(expiresAt).getTime() - Date.now()) / 1000
  ));
  if (remaining <= 0) return null;
  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return { text: m > 0 ? `${m}m ${s}s` : `${s}s`, remaining };
}

/* ── Render: Summary Cards ─────────────────────────────── */

export function renderSummaryCards(data) {
  if (!data) return;

  const { sessionActive, activePrompt, students } = data;

  /* Card 1: Session Status */
  const sessionValue = $('#card-session-value');
  const liveDot = $('#live-indicator .live-dot');
  if (sessionActive) {
    sessionValue.textContent = 'Active';
    sessionValue.style.color = '';
    if (liveDot) liveDot.classList.remove('live-dot--idle');
  } else {
    sessionValue.textContent = 'Idle';
    sessionValue.style.color = 'var(--zinc-400)';
    if (liveDot) liveDot.classList.add('live-dot--idle');
  }

  /* Card 2: Active Prompt */
  const promptCard = $('#card-prompt');
  const promptValue = $('#card-prompt-value');
  const promptDetail = $('#card-prompt-detail');

  if (activePrompt) {
    const cd = formatCountdown(activePrompt.expiresAt);
    promptCard.classList.remove('card--no-prompt');

    if (cd) {
      promptValue.textContent = `"${activePrompt.phrase}"`;
      promptDetail.innerHTML = '';

      const countdownSpan = document.createElement('span');
      countdownSpan.className = 'countdown' + (cd.remaining <= 10 ? ' countdown--urgent' : '');
      countdownSpan.textContent = cd.text;

      const tallySpan = document.createElement('span');
      tallySpan.textContent = ` \u00B7 ${activePrompt.responsesReceived}/${activePrompt.rosterCount} responded`;

      promptDetail.appendChild(countdownSpan);
      promptDetail.appendChild(tallySpan);
    } else {
      promptValue.textContent = `"${activePrompt.phrase}"`;
      promptDetail.innerHTML = '';

      const expiredSpan = document.createElement('span');
      expiredSpan.className = 'prompt-expired';
      expiredSpan.textContent = 'Expired';

      const tallySpan = document.createElement('span');
      tallySpan.textContent = ` \u00B7 ${activePrompt.responsesReceived}/${activePrompt.rosterCount} responded`;

      promptDetail.appendChild(expiredSpan);
      promptDetail.appendChild(tallySpan);
    }
  } else {
    promptCard.classList.add('card--no-prompt');
    promptValue.textContent = 'No active prompt';
    promptDetail.textContent = 'Set one from the sidebar';
  }

  /* Card 3: Joined Count */
  const matched = students.filter(s => s.matched);
  const joined = matched.filter(s => s.status !== 'not_joined').length;
  const total = matched.length;
  $('#card-joined-value').textContent = `${joined} / ${total}`;

  /* Card 4: Unmatched Count */
  const unmatched = students.filter(s => !s.matched).length;
  const unmatchedValue = $('#card-unmatched-value');
  const unmatchedCard = $('#card-unmatched');
  unmatchedValue.textContent = unmatched;

  if (unmatched > 0) {
    unmatchedCard.classList.add('card--warning');
  } else {
    unmatchedCard.classList.remove('card--warning');
  }
}

/* ── Render: Roster Table ──────────────────────────────── */

let _currentFilter = 'all';
let _currentSearch = '';
let _currentSort = { key: 'name', dir: 'asc' };

export function setFilter(filter) {
  _currentFilter = filter;
}

export function setSearch(search) {
  _currentSearch = search.toLowerCase().trim();
}

export function setSort(key) {
  if (_currentSort.key === key) {
    _currentSort.dir = _currentSort.dir === 'asc' ? 'desc' : 'asc';
  } else {
    _currentSort = { key, dir: 'asc' };
  }
}

export function renderRosterTable(students) {
  if (!students) return;

  const tbody = $('#roster-body');
  const emptyState = $('#roster-empty');
  if (!tbody) return;

  /* Filter to matched only */
  let rows = students.filter(s => s.matched);

  /* Apply status filter */
  if (_currentFilter !== 'all') {
    rows = rows.filter(s => s.status === _currentFilter);
  }

  /* Apply search */
  if (_currentSearch) {
    rows = rows.filter(s => s.name.toLowerCase().includes(_currentSearch));
  }

  /* Sort */
  rows.sort((a, b) => {
    let va, vb;
    switch (_currentSort.key) {
      case 'name':
        va = a.name; vb = b.name;
        return _currentSort.dir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      case 'status':
        const order = { not_joined: 0, unfocused: 1, focused: 2 };
        va = order[a.status] ?? 0; vb = order[b.status] ?? 0;
        return _currentSort.dir === 'asc' ? va - vb : vb - va;
      case 'lastActivity':
        va = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        vb = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        return _currentSort.dir === 'asc' ? va - vb : vb - va;
      case 'attentiveness':
        return _currentSort.dir === 'asc'
          ? a.attentivenessPct - b.attentivenessPct
          : b.attentivenessPct - a.attentivenessPct;
      case 'participation':
        return _currentSort.dir === 'asc'
          ? a.participationRate - b.participationRate
          : b.participationRate - a.participationRate;
      default:
        return 0;
    }
  });

  /* Show/hide empty state */
  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
      const msg = emptyState.querySelector('p');
      if (_currentSearch) {
        msg.textContent = `No students match "${_currentSearch}"`;
      } else if (_currentFilter !== 'all') {
        msg.textContent = `No students with status: ${formatStatus(_currentFilter)}`;
      } else {
        msg.textContent = 'No students in roster';
      }
    }
    return;
  }

  if (emptyState) emptyState.hidden = true;

  /* Build rows */
  const fragment = document.createDocumentFragment();
  rows.forEach((student, index) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${index * 15}ms`;
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="student-avatar">${getInitials(student.name)}</div>
          <span class="student-name">${escapeHtml(student.name)}</span>
        </div>
      </td>
      <td>
        <div class="status-cell">
          <span class="status-label status-label--${student.status}">${formatStatus(student.status)}</span>
        </div>
      </td>
      <td class="timestamp-cell">${relativeTime(student.lastActivityAt)}</td>
      <td class="pct-cell ${pctClass(student.attentivenessPct)}">${student.attentivenessPct > 0 ? student.attentivenessPct + '%' : '\u2014'}</td>
      <td class="pct-cell ${pctClass(student.participationRate)}">${student.participationRate > 0 ? student.participationRate + '%' : '\u2014'}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}

/* ── Render: Unmatched Table ───────────────────────────── */

export function renderUnmatchedTable(students) {
  if (!students) return;

  const tbody = $('#unmatched-body');
  const emptyState = $('#unmatched-empty');
  if (!tbody) return;

  const rows = students.filter(s => !s.matched);

  if (rows.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  const fragment = document.createDocumentFragment();
  rows.forEach((student, index) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${index * 15}ms`;
    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="student-avatar" style="background: var(--status-unmatched-bg); color: var(--status-unmatched);">${getInitials(student.name)}</div>
          <span class="student-name" style="color: var(--status-unmatched);">${escapeHtml(student.name)}</span>
        </div>
      </td>
      <td>
        <div class="status-cell">
          <span class="status-label status-label--${student.status}">${formatStatus(student.status)}</span>
        </div>
      </td>
      <td class="timestamp-cell">${relativeTime(student.lastActivityAt)}</td>
      <td class="pct-cell ${pctClass(student.attentivenessPct)}">${student.attentivenessPct > 0 ? student.attentivenessPct + '%' : '\u2014'}</td>
      <td class="pct-cell ${pctClass(student.participationRate)}">${student.participationRate > 0 ? student.participationRate + '%' : '\u2014'}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
}

/* ── Render: Attendance Widget ─────────────────────────── */

export function renderAttendanceWidget(students) {
  if (!students) return;

  const matched = students.filter(s => s.matched);
  const joined = matched.filter(s => s.status !== 'not_joined').length;
  const total = matched.length;
  const pct = total > 0 ? Math.round((joined / total) * 100) : 0;

  const text = $('#attendance-text');
  const bar = $('#attendance-bar');

  if (text) text.textContent = `${joined} / ${total} joined`;
  if (bar) bar.style.width = `${pct}%`;
}

/* ── Render: Badges ────────────────────────────────────── */

export function renderBadges(students) {
  if (!students) return;

  const unmatched = students.filter(s => !s.matched).length;
  const str = String(unmatched);

  const navBadge = $('#badge-unmatched-nav');
  const notifBadge = $('#badge-notification');

  if (navBadge) {
    navBadge.textContent = str;
    navBadge.setAttribute('data-count', str);
  }

  if (notifBadge) {
    notifBadge.textContent = str;
    notifBadge.setAttribute('data-count', str);
  }
}

/* ── Render: Last Updated ──────────────────────────────── */

let _lastPollTime = null;
let _lastUpdatedTimer = null;

export function renderLastUpdated() {
  _lastPollTime = Date.now();

  /* Clear any existing timer */
  if (_lastUpdatedTimer) clearInterval(_lastUpdatedTimer);

  const el = $('#last-updated');
  if (!el) return;

  function update() {
    if (!_lastPollTime) return;
    const secs = Math.floor((Date.now() - _lastPollTime) / 1000);
    el.textContent = `Updated ${secs}s ago`;
  }

  update();
  _lastUpdatedTimer = setInterval(update, 1000);
}

/* ── Render: Poll Error ────────────────────────────────── */

export function renderPollError(isError) {
  const banner = $('#error-banner');
  if (!banner) return;
  banner.hidden = !isError;
}

/* ── Render All (convenience) ──────────────────────────── */

export function renderAll(data, pollFailed) {
  if (!data) return;

  renderSummaryCards(data);
  renderRosterTable(data.students);
  renderUnmatchedTable(data.students);
  renderAttendanceWidget(data.students);
  renderBadges(data.students);
  renderLastUpdated();
  renderPollError(pollFailed);
}

/* ── Escape HTML ───────────────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
