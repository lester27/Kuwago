import { resolveMatch, overrideAttendance } from './api.js';
import { getCurrentSessionId } from './session.js';

let _activeOverrideStudent = null;

export function initBatch2Interactions(onDataMutated) {
  /* ── 1. Unmatched Table: Resolve Dropdown ── */
  const unmatchedBody = document.getElementById('unmatched-body');
  if (unmatchedBody) {
    unmatchedBody.addEventListener('change', async (e) => {
      const select = e.target.closest('.resolve-select');
      if (!select) return;
      
      const detectedName = select.getAttribute('data-detected');
      const resolvedTo = select.value;
      if (resolvedTo === '') return; // Not selected yet

      const originalBg = select.style.backgroundColor;
      select.style.backgroundColor = 'var(--surface-3)';
      select.disabled = true;

      try {
        const canonical = resolvedTo === 'DISMISS' ? null : resolvedTo;
        const res = await resolveMatch(detectedName, canonical);
        if (res && res.success) {
          // Immediately trigger a UI update by calling the provided callback
          if (onDataMutated) onDataMutated();
        } else {
          console.error('[attendance] resolveMatch error', res);
          alert('Failed to resolve match. See console.');
          select.value = '';
          select.disabled = false;
          select.style.backgroundColor = originalBg;
        }
      } catch (err) {
        console.error('[attendance] resolveMatch exception', err);
        select.value = '';
        select.disabled = false;
        select.style.backgroundColor = originalBg;
      }
    });
  }

  /* ── 2. Roster Table: Attendance Badge Click ── */
  const rosterBody = document.getElementById('roster-body');
  if (rosterBody) {
    rosterBody.addEventListener('click', (e) => {
      const badge = e.target.closest('.attendance-badge');
      if (!badge) return;
      
      const name = badge.getAttribute('data-name');
      const currentStatus = badge.getAttribute('data-status');
      const reason = badge.getAttribute('data-reason');
      
      openOverrideModal(name, currentStatus, reason);
    });
  }

  /* ── 3. Attendance Override Modal Setup ── */
  const modal = document.getElementById('attendance-modal');
  const btnClose = document.getElementById('btn-close-attendance-modal');
  const btnCancel = document.getElementById('btn-cancel-override');
  const btnSave = document.getElementById('btn-save-override');
  
  function closeModal() {
    if (modal) modal.classList.remove('is-open');
    _activeOverrideStudent = null;
  }

  function openOverrideModal(studentName, currentStatus, reason) {
    if (!modal) return;
    _activeOverrideStudent = studentName;
    
    document.getElementById('override-student-name').textContent = studentName;
    document.getElementById('override-status').value = currentStatus || 'Absent';
    document.getElementById('override-reason').value = reason || '';
    
    modal.classList.add('is-open');
  }

  if (btnClose) btnClose.addEventListener('click', closeModal);
  if (btnCancel) btnCancel.addEventListener('click', closeModal);
  
  if (btnSave) {
    btnSave.addEventListener('click', async () => {
      if (!_activeOverrideStudent) return;
      
      const status = document.getElementById('override-status').value;
      const reason = document.getElementById('override-reason').value.trim();
      const sessionId = getCurrentSessionId(); // We need to expose this from session.js
      
      const originalText = btnSave.textContent;
      btnSave.textContent = 'Saving...';
      btnSave.disabled = true;

      try {
        const res = await overrideAttendance(sessionId, _activeOverrideStudent, status, reason);
        if (res && res.success) {
          closeModal();
          if (onDataMutated) onDataMutated();
        } else {
          console.error('[attendance] override error', res);
          alert('Failed to override attendance.');
        }
      } catch (err) {
        console.error('[attendance] override exception', err);
      } finally {
        btnSave.textContent = originalText;
        btnSave.disabled = false;
      }
    });
  }
}
