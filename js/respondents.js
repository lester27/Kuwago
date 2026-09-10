/* ═══════════════════════════════════════════════════════════
   respondents.js — Respondents modal logic.
   Shows who responded / didn't respond to the active prompt
   when the prompt card is clicked.
   ═══════════════════════════════════════════════════════════ */

/* ── DOM References ────────────────────────────────────── */
const $modal    = () => document.getElementById('respondents-modal');
const $closeBtn = () => document.getElementById('btn-close-respondents');
const $tabYes   = () => document.getElementById('resp-tab-responded');
const $tabNo    = () => document.getElementById('resp-tab-not-responded');
const $panelYes = () => document.getElementById('panel-responded');
const $panelNo  = () => document.getElementById('panel-not-responded');
const $listYes  = () => document.getElementById('resp-list-yes');
const $listNo   = () => document.getElementById('resp-list-no');
const $emptyYes = () => document.getElementById('resp-empty-yes');
const $emptyNo  = () => document.getElementById('resp-empty-no');
const $countYes = () => document.getElementById('resp-count-yes');
const $countNo  = () => document.getElementById('resp-count-no');
const $summary  = () => document.getElementById('resp-summary');
const $title    = () => document.getElementById('respondents-modal-title');
const $promptCard = () => document.getElementById('card-prompt');

/* ── Cached prompt data ────────────────────────────────── */
let _cachedPromptData = null;

/* ── Public: Update cached data (called from renderAll) ── */
export function updateRespondentData(activePrompt) {
  _cachedPromptData = activePrompt;
}

/* ── Public: Initialize ────────────────────────────────── */
export function initRespondentsModal() {
  /* Click on prompt card → open modal */
  const card = $promptCard();
  if (card) {
    card.addEventListener('click', () => {
      if (card.classList.contains('card--no-prompt')) return;
      if (!_cachedPromptData) return;
      openModal(_cachedPromptData);
    });
  }

  /* Close button */
  const closeBtn = $closeBtn();
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  /* Overlay click to close */
  const modal = $modal();
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  /* Escape key to close */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  /* Tab switching */
  const tabYes = $tabYes();
  const tabNo = $tabNo();
  if (tabYes) {
    tabYes.addEventListener('click', () => switchTab('responded'));
  }
  if (tabNo) {
    tabNo.addEventListener('click', () => switchTab('not-responded'));
  }
}

/* ── Private: Open Modal ───────────────────────────────── */
function openModal(promptData) {
  const modal = $modal();
  if (!modal) return;

  /* Update title with the prompt phrase */
  const title = $title();
  if (title) {
    title.textContent = `"${promptData.phrase}"`;
  }

  /* Populate lists */
  const responded = promptData.respondents || [];
  const notResponded = promptData.nonRespondents || [];

  renderList($listYes(), responded, 'yes', $emptyYes());
  renderList($listNo(), notResponded, 'no', $emptyNo());

  /* Update counts */
  const countYes = $countYes();
  const countNo = $countNo();
  if (countYes) countYes.textContent = responded.length;
  if (countNo) countNo.textContent = notResponded.length;

  /* Update summary */
  const summary = $summary();
  if (summary) {
    const total = responded.length + notResponded.length;
    summary.textContent = `${responded.length} / ${total} responded`;
  }

  /* Reset to "responded" tab */
  switchTab('responded');

  /* Show */
  modal.classList.add('is-open');
}

/* ── Private: Close Modal ──────────────────────────────── */
function closeModal() {
  const modal = $modal();
  if (modal) {
    modal.classList.remove('is-open');
  }
}

/* ── Private: Switch Tab ───────────────────────────────── */
function switchTab(tab) {
  const tabYes = $tabYes();
  const tabNo = $tabNo();
  const panelYes = $panelYes();
  const panelNo = $panelNo();

  if (tab === 'responded') {
    tabYes.classList.add('resp-tab--active');
    tabNo.classList.remove('resp-tab--active');
    panelYes.hidden = false;
    panelNo.hidden = true;
  } else {
    tabNo.classList.add('resp-tab--active');
    tabYes.classList.remove('resp-tab--active');
    panelNo.hidden = false;
    panelYes.hidden = true;
  }
}

/* ── Private: Render Student List ──────────────────────── */
function renderList(listEl, names, type, emptyEl) {
  if (!listEl) return;

  listEl.innerHTML = '';

  if (names.length === 0) {
    if (emptyEl) emptyEl.classList.add('is-visible');
    return;
  }

  if (emptyEl) emptyEl.classList.remove('is-visible');

  /* Sort alphabetically */
  const sorted = names.slice().sort((a, b) => a.localeCompare(b));

  sorted.forEach((name, i) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${i * 30}ms`;

    const avatar = document.createElement('div');
    avatar.className = `resp-avatar resp-avatar--${type}`;
    avatar.textContent = getInitials(name);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'resp-name';
    nameSpan.textContent = name;

    const badge = document.createElement('span');
    badge.className = `resp-badge resp-badge--${type}`;
    badge.textContent = type === 'yes' ? '✓ Responded' : 'Waiting';

    li.appendChild(avatar);
    li.appendChild(nameSpan);
    li.appendChild(badge);
    listEl.appendChild(li);
  });
}

/* ── Private: Get Initials ─────────────────────────────── */
function getInitials(name) {
  const parts = name.split(',');
  if (parts.length >= 2) {
    const last = parts[0].trim();
    const first = parts[1].trim();
    return (first[0] + last[0]).toUpperCase();
  }
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}
