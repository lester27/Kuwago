# Backend & System Specification — Addendum (Phase 2)

This extends `backend-spec.md`. Covers new sheets, endpoint changes, extension
changes, and the consolidated per-session sheet. Build order matches
`frontend-spec-addendum.md` §"Suggested build order."

## 1. Reference data changes

### New sheet: `Courses`
| Column | Type | Notes |
|---|---|---|
| SectionID | string | Primary key, e.g. `BSIT301-A` |
| CourseName | string | |
| SectionName | string | |

### `Students` sheet — add column
| Column | Type | Notes |
|---|---|---|
| SectionID | string | Foreign key to `Courses`. A student belongs to one section. |

Roster lookups for a session are now scoped to `SectionID`, not the whole
`Students` sheet.

## 2. Class-session control

### `startSession`
`POST`, body: `{ "sectionId": "BSIT301-A" }`

- Rejects if a session is already active anywhere in the system (single active
  session at a time, matching the "no overcomplexity" constraint).
- Creates a new `SessionID`, records `StartedAt`, `SectionID`.
- Pre-loads the roster for that section as the working "expected students" list for
  status tracking (§5.3 of the original frontend spec — "every enrolled student
  always represented").

### `endSession`
`POST`, body: `{ "sessionId": "..." }`

- For any student still marked joined, sets `LeaveTime = now` (they didn't
  explicitly leave, but the session is over).
- Deactivates any active prompt.
- Computes final attendance status, attentiveness %, and participation rate per
  student.
- Generates the consolidated per-session sheet (§4 below) — this is the one and
  only time that sheet gets written for a given session.
- Marks the session inactive.

### Extension/dashboard behavior while no session is active
`currentPrompt` and `logEvent`/`submitChat`/`heartbeat` calls made while no session
is active return `{ "sessionActive": false }` and are **not** logged — there's
nothing meaningful to attribute the data to. The extension should hold off on
firing events until a session becomes active (it can keep polling `currentPrompt`
to find out).

## 3. Extension health

### New sheet: `Heartbeats` (latest-only, not append-only)
One row per student, **overwritten** on each heartbeat — this table only ever needs
to answer "when did we last hear from this student," so it doesn't need history.
| Column | Type |
|---|---|
| StudentName | string |
| ExtensionVersion | string |
| LastHeartbeatAt | datetime |

### `heartbeat` endpoint
`POST`, body: `{ "studentName": "...", "version": "1.2.0" }` — called every ~15–30s
by the background worker while on an active Meet call. Upserts the student's row in
`Heartbeats`.

**Connection status logic** (used by both the health panel and alerts): a student
is "disconnected" if their `LastHeartbeatAt` is older than a threshold (suggested
default: 45–60 seconds) while they're still marked joined in `Sessions`.

## 4. Consolidated per-session sheet

At `endSession`, generate a **new sheet tab** (not a new spreadsheet), named
something like `Session_2026-09-10_BSIT301-A`, containing one row per roster
student:

| Column |
|---|
| StudentName |
| TimeIn |
| TimeOut |
| AttendanceStatus (Present / Late / Absent / Excused) |
| AttentivenessPct |
| PromptsAnswered / PromptsIssued |
| ParticipationPct |
| IdentityMatched (Y/N) |
| Notes (any override reasons, flags carried over) |

This sheet is a **finalized snapshot** — written once, not touched again after
`endSession`. It's the human-readable artifact a professor can open directly in
Sheets without the dashboard at all, and it's also the source for historical
reporting later (§8 of the frontend addendum) rather than re-deriving from raw logs
each time.

## 5. Unmatched-name resolution

### New sheet: `NameAliases`
| Column | Type | Notes |
|---|---|---|
| DetectedName | string | Exact string as received from the extension |
| CanonicalStudentName | string | Roster name it resolves to |

Once a mapping exists here, future events under `DetectedName` are auto-matched
without re-flagging.

### `suggestMatches` (part of `dashboardData`, or its own action)
For each unmatched name, compute a simple string-similarity score (e.g. Levenshtein
distance or token overlap) against the active roster and return the top 1–2
candidates above a reasonable similarity threshold.

### `resolveMatch`
`POST`, body: `{ "detectedName": "...", "resolvedTo": "..." }` (or `"resolvedTo": null`
for "not a student" dismissal)

- Writes the mapping to `NameAliases` (skip this if dismissed as not-a-student).
- Retroactively relabels this session's existing `Sessions`/`FocusEvents`/
  `ChatResponses` rows under `DetectedName` to `CanonicalStudentName`, so the
  student's data for the current session is complete rather than split across two
  identities.

## 6. Attendance workflow

### `Sessions` sheet — add columns
| Column | Type | Notes |
|---|---|---|
| AttendanceStatus | string | Auto-computed: Present / Late / Absent |
| OverrideStatus | string | Nullable — professor's manual correction |
| OverrideReason | string | Nullable |
| OverrideAt | datetime | Nullable |

Auto-computation: `Present` if joined within a configurable grace period of session
start, `Late` if joined after it, `Absent` if never joined. `Excused` is
manual-only — there's no auto path to it.

### New sheet: `AttendanceAuditLog` (append-only)
| Column | Type |
|---|---|
| StudentName |
| SessionID |
| OldStatus |
| NewStatus |
| Reason |
| ChangedAt |

Every manual correction appends here — never edited or deleted, so there's always a
full history even if a status gets corrected more than once.

### `overrideAttendance`
`POST`, body: `{ "sessionId": "...", "studentName": "...", "status": "Excused",
"reason": "..." }` — writes the override to `Sessions` and appends to
`AttendanceAuditLog`.

## 7. Alert queue

Computed server-side (part of `dashboardData`, or a dedicated `alerts` action).
Suggested defaults (make these tunable, not hardcoded, since different professors
may want different sensitivity):

- **Sustained unfocus**: unfocused continuously for > 60 seconds
- **Missing extension connection**: no heartbeat for > 45 seconds while marked
  joined
- **Unanswered prompt**: prompt expired with no matched response from a student who
  was present when it was issued (uses the prompt roster snapshot — §8 below)

Alerts are computed fresh each poll, not stored as persistent state — a condition
that resolves (student refocuses, heartbeat resumes) simply stops appearing.
Dismissal/acknowledgment (if implemented) can be a lightweight session-scoped flag
so a dismissed-but-still-active alert doesn't keep resurfacing every poll cycle.

## 8. Prompt improvements

### `ChatPrompts` sheet — add columns
| Column | Type | Notes |
|---|---|---|
| PromptType | string | `text` or `multiple_choice` |
| AcceptedAnswers | string | JSON array — for text, one phrase; for multiple choice, all valid options |
| ReminderCount | integer | Incremented by `resendPrompt` |

### New sheet: `PromptRoster` (snapshot at issuance)
| Column | Type |
|---|---|
| PromptID |
| StudentName |

Written once when a prompt is created — the list of students marked joined at that
exact moment. This is the roster used for participation-rate math and the
"present when issued" response list, so it never drifts if attendance changes
mid-prompt.

### `resendPrompt`
`POST`, body: `{ "promptId": "..." }` — extends `ExpiresAt` and increments
`ReminderCount` on the existing prompt rather than creating a new one.

**Matching logic update**: `submitChat` now compares the normalized submitted text
against *any* entry in `AcceptedAnswers`, not a single phrase.

## 9. Student transparency view

### `studentView` (GET)
`GET ?action=studentView&name=...` — returns only that student's own data for the
current/recent session (join/leave, focus summary, prompt responses). Intended to
be called from inside the extension (popup), using the same self-detected name the
extension already reads from the Meet DOM — consistent with the no-OAuth identity
model established from the start.

**Caveat worth flagging**: since there's no authentication anywhere in this system,
this endpoint is scoped by name only, not by a verified identity — technically
anyone could query anyone's name. Given the system already accepts DOM-based
self-reported identity as its trust model, this is consistent with existing
design, but if this becomes a concern later, it's the one place worth revisiting
with lightweight auth.

### New sheet: `IdentityDisputes` (append-only)
| Column | Type |
|---|---|
| ReportedName |
| SessionID |
| Timestamp |
| Status | `open` / `resolved` |

### `flagIdentity`
`POST`, body: `{ "studentName": "...", "sessionId": "..." }` — appends an open
dispute for professor review, separate from the automatic unmatched-name queue
(§5) since this is student-initiated.
