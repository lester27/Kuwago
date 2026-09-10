/* ═══════════════════════════════════════════════════════════
   prompt.js — Prompt modal: open/close, form validation,
   submission, and countdown timer management.
   ═══════════════════════════════════════════════════════════ */

import { sendPrompt } from './api.js';

/* ── State ─────────────────────────────────────────────── */
let _isOpen = false;

/* ── DOM References ────────────────────────────────────── */
function $modal()       { return document.getElementById('prompt-modal'); }
function $phrase()      { return document.getElementById('prompt-phrase'); }
function $duration()    { return document.getElementById('prompt-duration'); }
function $btnSend()     { return document.getElementById('btn-send-prompt'); }
function $btnCancel()   { return document.getElementById('btn-cancel-prompt'); }
function $btnClose()    { return document.getElementById('btn-close-modal'); }
function $btnOpen()     { return document.getElementById('btn-set-prompt'); }

/* ── Public API ────────────────────────────────────────── */

/**
 * Initialize prompt modal event listeners.
 * Call once on DOMContentLoaded.
 * @param {Function} onPromptSent - Callback after successful prompt submission
 */
export function initPromptModal(onPromptSent) {
  /* Open */
  const openBtn = $btnOpen();
  if (openBtn) {
    openBtn.addEventListener('click', () => openModal());
  }

  /* Close via cancel button */
  const cancelBtn = $btnCancel();
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeModal());
  }

  /* Close via X button */
  const closeBtn = $btnClose();
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal());
  }

  /* Close via overlay click */
  const modal = $modal();
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  }

  /* Close via Escape key */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && _isOpen) closeModal();
  });

  /* Submit */
  const sendBtn = $btnSend();
  if (sendBtn) {
    sendBtn.addEventListener('click', async () => {
      await handleSubmit(onPromptSent);
    });
  }

  /* Submit on Enter in phrase input */
  const phraseInput = $phrase();
  if (phraseInput) {
    phraseInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await handleSubmit(onPromptSent);
      }
    });
  }
}

/* ── Open / Close ──────────────────────────────────────── */

function openModal() {
  const modal = $modal();
  if (!modal) return;

  _isOpen = true;
  modal.classList.add('is-open');
  clearErrors();

  /* Reset form */
  const phrase = $phrase();
  if (phrase) {
    phrase.value = '';
    /* Delay focus to after transition */
    setTimeout(() => phrase.focus(), 200);
  }

  const duration = $duration();
  if (duration) duration.value = '60';
}

function closeModal() {
  const modal = $modal();
  if (!modal) return;

  _isOpen = false;
  modal.classList.remove('is-open');
}

/* ── Validation ────────────────────────────────────────── */

function validate() {
  const phrase = $phrase();
  if (!phrase) return false;

  const value = phrase.value.trim();
  if (!value) {
    showError(phrase, 'Please enter a phrase');
    return false;
  }

  if (value.length > 200) {
    showError(phrase, 'Phrase must be 200 characters or fewer');
    return false;
  }

  return true;
}

function showError(input, message) {
  const group = input.closest('.form-group');
  if (!group) return;

  group.classList.add('form-group--error');

  let errorEl = group.querySelector('.form-error');
  if (!errorEl) {
    errorEl = document.createElement('span');
    errorEl.className = 'form-error';
    group.appendChild(errorEl);
  }
  errorEl.textContent = message;
  errorEl.style.display = 'block';
}

function clearErrors() {
  const groups = document.querySelectorAll('.form-group--error');
  groups.forEach(g => {
    g.classList.remove('form-group--error');
    const err = g.querySelector('.form-error');
    if (err) err.style.display = 'none';
  });
}

/* ── Submit ─────────────────────────────────────────────── */

async function handleSubmit(onPromptSent) {
  clearErrors();

  if (!validate()) return;

  const phrase = $phrase().value.trim();
  const durationSeconds = parseInt($duration().value, 10);

  /* Disable button while submitting */
  const sendBtn = $btnSend();
  if (sendBtn) {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Sending...';
  }

  try {
    const result = await sendPrompt(phrase, durationSeconds);

    if (result.success) {
      closeModal();
      if (onPromptSent) onPromptSent();
    } else {
      showError($phrase(), `Failed to send: ${result.error || 'Unknown error'}`);
    }
  } catch (err) {
    showError($phrase(), `Error: ${err.message}`);
  } finally {
    if (sendBtn) {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send prompt';
    }
  }
}
