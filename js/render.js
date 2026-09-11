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
    case 'on_meet': return 'On Meet tab';
    case 'away': return 'Away from Meet tab';
    case 'not_joined': return 'Not joined';
    default: return status;
  }
}

/**
 * Format alert text and icon
 */
function formatAlert(alertType) {
  switch (alertType) {
    case 'sustained_unfocus': 
      return `<span class="alert-indicator" title="Sustained unfocus">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                Unfocused
              </span>`;
    case 'missing_extension':
      return `<span class="alert-indicator" title="Missing extension connection">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Disconnected
              </span>`;
    case 'unanswered_prompt':
      return `<span class="alert-indicator" title="Unanswered prompt">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                Prompt missed
              </span>`;
    default: return '';
  }
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
  const joined = matched.filter(s => s.liveStatus !== 'not_joined').length;
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
    rows = rows.filter(s => s.liveStatus === _currentFilter);
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
      case 'liveStatus':
        const order = { not_joined: 0, away: 1, on_meet: 2 };
        va = order[a.liveStatus] ?? 0; vb = order[b.liveStatus] ?? 0;
        return _currentSort.dir === 'asc' ? va - vb : vb - va;
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
    tr.style.cursor = 'pointer';
    tr.dataset.name = student.name;
    tr.className = 'roster-row';
    
    let alertsHtml = '';
    if (student.activeAlerts && student.activeAlerts.length > 0) {
      alertsHtml = student.activeAlerts.map(a => formatAlert(a)).join(' ');
    }

    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="student-avatar">${getInitials(student.name)}</div>
          <span class="student-name">${escapeHtml(student.name)}</span>
        </div>
      </td>
      <td>
        <div class="status-cell">
          <span class="status-label status-label--${student.liveStatus}">${formatStatus(student.liveStatus)}</span>
        </div>
      </td>
      <td class="attendance-cell-click-target">
        <button class="attendance-badge status-${student.attendanceStatus ? student.attendanceStatus.toLowerCase() : 'absent'}" 
                data-name="${escapeHtml(student.name)}" 
                data-status="${student.attendanceStatus || 'Absent'}"
                data-reason="${escapeHtml(student.overrideReason || '')}">
          ${student.attendanceStatus || 'Absent'}
        </button>
      </td>
      <td>
        <div class="alerts-cell">${alertsHtml}</div>
      </td>
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
    /* Build options for resolve dropdown */
    let optionsHtml = `<option value="">-- Select Roster Match --</option>`;
    if (student.suggestions && student.suggestions.length > 0) {
      optionsHtml += `<optgroup label="Suggestions">`;
      student.suggestions.forEach(sug => {
        optionsHtml += `<option value="${escapeHtml(sug.name)}">${escapeHtml(sug.name)} (${Math.round(sug.score * 100)}%)</option>`;
      });
      optionsHtml += `</optgroup>`;
    }
    optionsHtml += `<option value="DISMISS">Dismiss (Not a student)</option>`;

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
          <span class="status-label status-label--${student.liveStatus}">${formatStatus(student.liveStatus)}</span>
        </div>
      </td>
      <td>
        <select class="resolve-select ${student.suggestions && student.suggestions.length > 0 ? 'has-suggestions' : ''}" data-detected="${escapeHtml(student.name)}">
          ${optionsHtml}
        </select>
      </td>
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

/* ── Render: Extension Health Table ────────────────────── */

export function renderHealthTable(healthData) {
  const tbody = $('#health-body');
  const emptyState = $('#health-empty');
  if (!tbody) return;

  if (!healthData || healthData.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.hidden = false;
    return;
  }

  if (emptyState) emptyState.hidden = true;

  const fragment = document.createDocumentFragment();
  healthData.forEach((entry, index) => {
    const tr = document.createElement('tr');
    tr.style.animationDelay = `${index * 15}ms`;

    /* Connected badge */
    const connectedHtml = entry.connected
      ? '<span class="health-badge health-badge--connected">Yes</span>'
      : '<span class="health-badge health-badge--disconnected">No</span>';

    /* Version pill */
    const versionHtml = entry.extensionVersion
      ? `<span class="version-pill">${escapeHtml(entry.extensionVersion)}</span>`
      : '<span class="text-muted">\u2014</span>';

    /* Status with troubleshooting hint */
    let statusHtml;
    switch (entry.status) {
      case 'connected':
        statusHtml = '<span class="health-status health-status--ok">Connected</span>';
        break;
      case 'connection_lost':
        statusHtml = '<span class="health-status health-status--warn">Connection lost</span>'
          + '<span class="health-hint">Likely closed the tab or lost network</span>';
        break;
      case 'never_connected':
        statusHtml = '<span class="health-status health-status--none">Never connected</span>'
          + '<span class="health-hint">Extension not detected — confirm it\'s installed</span>';
        break;
      case 'no_heartbeat':
        statusHtml = '<span class="health-status health-status--warn">No heartbeat</span>'
          + '<span class="health-hint">Joined but no extension signal received</span>';
        break;
      case 'disconnected':
        statusHtml = '<span class="health-status health-status--none">Disconnected</span>';
        break;
      default:
        statusHtml = `<span class="health-status">${escapeHtml(entry.status)}</span>`;
    }

    tr.innerHTML = `
      <td>
        <div class="student-cell">
          <div class="student-avatar">${getInitials(entry.name)}</div>
          <span class="student-name">${escapeHtml(entry.name)}</span>
        </div>
      </td>
      <td>${connectedHtml}</td>
      <td class="text-mono">${entry.detectedName ? escapeHtml(entry.detectedName) : '<span class="text-muted">\u2014</span>'}</td>
      <td>${versionHtml}</td>
      <td class="timestamp-cell">${relativeTime(entry.lastHeartbeat)}</td>
      <td>${statusHtml}</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);
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
  renderHealthTable(data.extensionHealth);
  renderLastUpdated();
  renderPollError(pollFailed);
}

/* ── Escape HTML ───────────────────────────────────────── */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ── Render: Student Detail Overlay ────────────────────── */

export function renderStudentDetail(detail) {
  const modal = $('#student-detail-modal');
  if (!modal) return;
  
  $('#sd-name').textContent = detail.name;
  
  /* Status */
  $('#sd-live-status').textContent = formatStatus(detail.liveStatus);
  if (detail.joinedAt) {
    const joined = new Date(detail.joinedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    const left = detail.leftAt ? ` • Left at ${new Date(detail.leftAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : '';
    $('#sd-session-times').textContent = `Joined at ${joined}${left}`;
  } else {
    $('#sd-session-times').textContent = 'Not joined this session';
  }
  
  /* Attendance */
  $('#sd-attendance-status').textContent = detail.attendance.status || 'Absent';
  const attHist = $('#sd-attendance-history');
  attHist.innerHTML = '';
  if (detail.attendance.overrides && detail.attendance.overrides.length > 0) {
    detail.attendance.overrides.forEach(o => {
      const time = new Date(o.at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      attHist.insertAdjacentHTML('beforeend', `
        <li>
          <div class="sd-list-title">Changed to ${o.to}</div>
          <div class="sd-list-desc">${time}${o.reason ? ` — "${escapeHtml(o.reason)}"` : ''}</div>
        </li>
      `);
    });
  } else {
    attHist.innerHTML = '<li><div class="sd-list-desc">No manual corrections</div></li>';
  }
  
  /* Focus Lapses */
  const lapses = detail.focusLapses;
  if (lapses && lapses.count > 0) {
    const min = Math.floor(lapses.totalSeconds / 60);
    const sec = lapses.totalSeconds % 60;
    const timeStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    $('#sd-focus-summary').textContent = `${lapses.count} lapse${lapses.count !== 1 ? 's' : ''} · ${timeStr} away`;
    
    const fList = $('#sd-focus-list');
    fList.innerHTML = '';
    lapses.lapses.forEach(l => {
      const start = new Date(l.startedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      const lm = Math.floor(l.durationSeconds / 60);
      const ls = l.durationSeconds % 60;
      const dStr = lm > 0 ? `${lm}m ${ls}s` : `${ls}s`;
      fList.insertAdjacentHTML('beforeend', `
        <li>
          <div class="sd-list-title">${start}</div>
          <div class="sd-list-desc">Away for ${dStr}</div>
        </li>
      `);
    });
  } else {
    $('#sd-focus-summary').textContent = 'No focus lapses';
    $('#sd-focus-list').innerHTML = '';
  }
  
  /* Participation */
  const p = detail.participation;
  if (p && p.issued > 0) {
    $('#sd-participation-summary').textContent = `${p.answered} / ${p.issued} prompts answered`;
    const pList = $('#sd-participation-list');
    pList.innerHTML = '';
    p.prompts.forEach(pr => {
      let statusStr = !pr.responded ? 'Missed' : (pr.matched ? 'Answered' : 'Incorrect');
      let statusCol = !pr.responded ? 'var(--zinc-500)' : (pr.matched ? 'var(--status-focused)' : 'var(--status-unmatched)');
      pList.insertAdjacentHTML('beforeend', `
        <li>
          <div class="sd-list-title">"${escapeHtml(pr.phrase)}"</div>
          <div class="sd-list-desc" style="color: ${statusCol}">${statusStr}${pr.submittedText && !pr.matched ? ` ("${escapeHtml(pr.submittedText)}")` : ''}</div>
        </li>
      `);
    });
  } else {
    $('#sd-participation-summary').textContent = 'No prompts issued while present';
    $('#sd-participation-list').innerHTML = '';
  }
  
  /* Extension Health & Identity */
  const ex = detail.extension;
  $('#sd-health-connected').textContent = ex.connected ? 'Connected' : 'Disconnected';
  $('#sd-health-connected').style.color = ex.connected ? 'var(--status-focused)' : 'var(--status-unmatched)';
  if (ex.lastHeartbeatAt) {
    $('#sd-health-details').textContent = `Version ${ex.version || 'unknown'} • Last heartbeat: ${relativeTime(ex.lastHeartbeatAt)}`;
  } else {
    $('#sd-health-details').textContent = 'Extension not detected';
  }
  
  const idMatch = $('#sd-identity-match');
  if (detail.identity.matched) {
    idMatch.textContent = 'Matched to roster';
    idMatch.style.color = 'var(--zinc-500)';
  } else {
    idMatch.innerHTML = '<span style="color: var(--status-unmatched)">Unmatched identity</span>';
  }
  
  /* Show content */
  $('#sd-loading').hidden = true;
  $('#sd-content').hidden = false;
}

/* ── Render: Session Summary Overlay ──────────────────── */

const ATTENDANCE_COLORS = {
  Present: 'var(--status-focused)',
  Late: '#d97706',
  Absent: 'var(--status-unmatched)',
  Excused: '#6366f1'
};

/**
 * Populate and open the session summary modal.
 * @param {{ sheetName: string, students: Array }} summary
 */
export function renderSessionSummary(summary) {
  const modal = $('#session-summary-modal');
  if (!modal || !summary) return;

  /* Sheet name */
  const sheetNameEl = $('#ss-sheet-name');
  const sheetNameInline = $('#ss-sheet-name-inline');
  if (sheetNameEl) sheetNameEl.textContent = summary.sheetName || '';
  if (sheetNameInline) sheetNameInline.textContent = summary.sheetName || 'Session sheet';

  /* Build table rows */
  const tbody = $('#ss-tbody');
  if (!tbody) return;

  const students = summary.students || [];
  const fragment = document.createDocumentFragment();

  students.forEach(s => {
    const tr = document.createElement('tr');
    tr.className = 'ss-row';

    const attColor = ATTENDANCE_COLORS[s.attendance] || 'inherit';

    const fmtTime = iso => {
      if (!iso) return '—';
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const fmtSecs = secs => {
      if (!secs) return '—';
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    tr.innerHTML = `
      <td class="ss-cell ss-name">${escapeHtml(s.name)}</td>
      <td class="ss-cell">${fmtTime(s.timeIn)}</td>
      <td class="ss-cell">${fmtTime(s.timeOut)}</td>
      <td class="ss-cell" style="color:${attColor};font-weight:600;">${s.attendance}</td>
      <td class="ss-cell">${s.focusLapses ?? 0}</td>
      <td class="ss-cell">${fmtSecs(s.awaySeconds)}</td>
      <td class="ss-cell">${s.attentivenessPct ?? 0}%</td>
      <td class="ss-cell">${s.answered ?? 0} / ${s.issued ?? 0}</td>
      <td class="ss-cell">${s.participationPct ?? 0}%</td>
    `;
    fragment.appendChild(tr);
  });

  tbody.innerHTML = '';
  tbody.appendChild(fragment);

  /* Open modal */
  modal.classList.add('is-open');
}
