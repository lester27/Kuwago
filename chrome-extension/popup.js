/* ═══════════════════════════════════════════════════════════
   popup.js — Status display for the extension popup.
   Queries the background worker for current state and
   renders it in the premium popup UI.
   ═══════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', async () => {
  const badgeEl    = document.getElementById('badge-connection');
  const badgeLbl   = document.getElementById('badge-label');
  const meetEl     = document.getElementById('status-meet');
  const nameEl     = document.getElementById('status-name');
  const promptCard = document.getElementById('card-prompt');

  try {
    /* Query background worker for extension status */
    const status = await chrome.runtime.sendMessage({ type: 'GET_EXTENSION_STATUS' });

    if (!status) {
      setConnectionBadge(badgeEl, badgeLbl, 'error', 'Error');
      renderPromptCard(promptCard, null);
      return;
    }

    /* Connection status */
    const isConfigured = status.apiBase && status.apiBase !== 'YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';

    if (isConfigured) {
      setConnectionBadge(badgeEl, badgeLbl, 'connected', 'Connected');
    } else {
      setConnectionBadge(badgeEl, badgeLbl, 'warning', 'Setup needed');
    }

    /* Active Meet tabs */
    if (status.activeTabs && status.activeTabs.length > 0) {
      const tab = status.activeTabs[0];

      meetEl.innerHTML = '<span class="dot dot--green"></span><span>Active</span>';

      /* Student name */
      if (tab.studentName) {
        nameEl.textContent = tab.studentName;
        nameEl.classList.remove('card__value--muted');
      } else {
        nameEl.innerHTML = '<span class="dot dot--amber"></span><span>Detecting…</span>';
        nameEl.classList.add('card__value--amber');
      }
    } else {
      meetEl.innerHTML = '<span class="dot dot--gray"></span><span>No active Meet</span>';
      nameEl.textContent = '—';
      nameEl.classList.add('card__value--muted');
    }

    /* Active prompt */
    renderPromptCard(promptCard, status.currentPrompt);

  } catch (err) {
    console.error('[popup] Failed to get status:', err);
    setConnectionBadge(badgeEl, badgeLbl, 'error', 'Error');
    renderPromptCard(promptCard, null);
  }

  /* Also try to get status from the content script on the active tab */
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url && tab.url.startsWith('https://meet.google.com/')) {
      const contentStatus = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATUS' });
      if (contentStatus && contentStatus.detectedName) {
        const currentName = nameEl.textContent;
        if (currentName === '—' || currentName === 'Detecting…' || currentName === '') {
          nameEl.textContent = contentStatus.detectedName;
          nameEl.className = 'card__value card__value--sm';
        }
      }
    }
  } catch {
    /* Content script might not be injected yet */
  }
});

/* ── Helpers ───────────────────────────────────────────── */

function setConnectionBadge(badgeEl, labelEl, state, text) {
  badgeEl.className = 'header__badge';
  switch (state) {
    case 'connected':
      badgeEl.classList.add('header__badge--connected');
      break;
    case 'warning':
      badgeEl.classList.add('header__badge--warning');
      break;
    case 'error':
      badgeEl.classList.add('header__badge--error');
      break;
  }
  labelEl.textContent = text;
}

function renderPromptCard(container, promptPhrase) {
  if (promptPhrase) {
    container.innerHTML = `
      <div class="prompt-card">
        <div class="prompt-card__label">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
          Active Prompt
        </div>
        <div class="prompt-card__phrase">"${escapeHtml(promptPhrase)}"</div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div class="prompt-card prompt-card--empty">
        <div class="prompt-card__label">Active Prompt</div>
        <div class="prompt-card__phrase">No active prompt</div>
      </div>
    `;
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
