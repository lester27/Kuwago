# Professor Dashboard — Addendum Spec (Phase 2)

This extends `frontend-spec.md`. Section numbers below are new additions; where a
feature modifies an existing region from the original spec, that's called out
explicitly. No aesthetic direction here either — functionality and content only.

## Suggested build order
Build in this order — each phase depends on the reliability of the one before it:

1. **Class-session control** — everything else needs a real session to attach to
2. **Extension health panel** + **Unmatched-name resolution** — makes existing
   tracking trustworthy
3. **Attendance workflow** — depends on session control existing
4. **Alert queue** + **Prompt improvements** — refinements on top of a reliable base
5. **Student transparency view** — independent, can slot in anytime after phase 2
6. **Historical reporting** — explicitly last, only once the current-session model is
   proven reliable in real classes

## 1. Class-session control
New region, likely replacing the old implicit "session status" indicator from
§5.1 of the original spec.

- **Course/section selector**: dropdown populated from the `Courses` reference data
  (see backend addendum). Selecting one determines which roster the session will
  track.
- **Start Class** button: only enabled when a course/section is selected and no
  session is currently active. Begins a new session.
- **End Class** button: only enabled while a session is active. Ends it.
- **Session timer**: elapsed time since Start Class was pressed, updating live
  (client-side ticking, not dependent on the poll cycle).
- Only one session can be active at a time system-wide — the UI should make Start
  Class unavailable if a session is already running, rather than allowing two
  overlapping sessions.
- After End Class, the dashboard should clearly indicate the session has ended
  (roster stops updating live) and ideally link/point to the finalized per-session
  sheet as the record of what happened (see backend addendum §4).

## 2. Extension health panel
New region — a table, one row per roster student (for the active session's course/
section), showing:

- **Connected** — Yes/No, based on heartbeat recency (see backend addendum for
  threshold)
- **Detected name** — whatever name the extension last reported, useful for
  cross-checking against identity issues even before they show up as "unmatched"
- **Extension version**
- **Last heartbeat** — timestamp
- **Troubleshooting guidance** — shown inline or on click, for any student flagged
  as disconnected. Guidance text differs by situation:
  - Never connected → "Extension not detected — confirm it's installed and enabled"
  - Was connected, now silent → "Connection lost — likely closed the tab or lost
    network"
  - Outdated version → "Running an old version — ask the student to update"

## 3. Unmatched-name resolution
Extends §5.4 (Unmatched entries region) from the original spec. Each unmatched entry
now additionally shows:

- **Suggested match** (if the backend found one) — the closest roster name, with a
  one-click **Confirm** action
- **Manual match** — a dropdown/search to pick the correct roster student directly,
  for cases with no good automatic suggestion
- **Not a student** — dismiss action for guests/non-enrolled participants, so they
  stop appearing in the unmatched queue
- Once resolved, this pairing is remembered — the same detected name should auto-
  match going forward without needing to be resolved again every session

## 4. Attendance workflow
New region or extension of the roster table (§5.3). Each student's attendance status
is one of: **Present, Late, Absent, Excused** — auto-computed by default (Present if
joined promptly, Late if joined after a threshold, Absent if never joined), but
manually overridable by the professor.

- Manual override control per student: pick a status + optional reason text
- Every manual correction is recorded with a timestamp and reason — displayed as a
  small visible history per student (e.g. "Marked Excused — 'doctor's note' —
  9:05 AM"), not just stored invisibly
- Corrections never overwrite/delete the auto-computed original — both the system's
  original determination and the override are visible

## 5. Alert queue
New region — a live list of active issues needing attention, newest first. Alert
types:

- **Sustained unfocus** — a student has been unfocused continuously past a
  threshold (backend-configured; brief tab flicks should never appear here)
- **Missing extension connection** — a student who joined is no longer sending
  heartbeats
- **Unanswered prompt** — a prompt expired and a present student never responded

Each alert shows: type, affected student, how long the condition has persisted, and
a **dismiss/acknowledge** action. Alerts should disappear automatically once the
underlying condition resolves (e.g. student refocuses) — dismissal is for
acknowledging without it being resolved yet, not a permanent hide.

## 6. Prompt improvements
Extends §5.2 (Chat prompt control region).

- **Prompt type**: text-match (existing behavior) or **multiple choice** — for
  multiple choice, the professor defines the accepted options (e.g. A/B/C/D), and
  any of them counts as a valid response
- **Response window**: now a required field when creating a prompt, not just a
  default
- **Resend/reminder**: a button to re-broadcast the currently active prompt
  (extends its window and nudges non-responders) rather than requiring a whole new
  prompt
- **Response list**: shows responses only from students who were actually present
  at the moment the prompt was issued — not the full roster, and not whoever
  happens to be present now if that's changed since

## 7. Student transparency view
A separate, simple view — **not part of the professor dashboard** — accessible to
students. Given the system doesn't use any login, the most consistent approach is to
surface this from inside the extension itself (e.g. an extension popup), scoped to
whatever name the extension has already detected for that student. Contents:

- Plain-language explanation of what is recorded: session join/leave, whether their
  tab lost focus (never *what* site they went to), and chat prompt responses —
  nothing else
- Their own recorded data for the current/recent session
- A **"this isn't me" / "wrong identity"** flag action, for a student to report a
  misdetected name or wrong session assignment — this creates a review item for the
  professor, distinct from the professor-side unmatched-name queue, since this is
  the student reporting it rather than the system detecting it automatically

## 8. Historical reporting (build last)
- A session history list — pick a past session, view its finalized summary (pulled
  directly from that session's dedicated sheet, see backend addendum §4)
- CSV export — since each session already lives as a real Sheet tab, this may not
  need custom export code at all; Sheets' native download-as-CSV may already cover
  it
- PDF export and course-level trend views — lowest priority, only worth scoping
  once the above is in real use
