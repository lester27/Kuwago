# Professor Dashboard — Functional Specification

## 1. What this document covers
This describes **what the dashboard does and what it shows** — screens, data, states,
and interactions. It intentionally excludes visual design (colors, typography, spacing,
layout aesthetics). Treat this as the functional/content brief; visual design is a
separate pass.

## 2. Purpose
A single-page web dashboard that lets a professor monitor student engagement during a
live Google Meet class, in near-real-time (~5 second refresh), for one class session at
a time (roughly 30–40 students).

## 3. Who uses it
One user role only: the professor. No student-facing views exist in this app. No
login/signup screen is required in the UI itself — access is restricted at the hosting
level (deployment permissions), not by an in-app auth screen.

## 4. How data reaches the page
The dashboard is a single HTML page that polls a backend JSON endpoint every ~5 seconds
and re-renders. There is no page reload — updates happen client-side against fresh
polled data. See `backend-spec.md` for the exact endpoint contracts; the shapes below
are what the frontend can expect to receive/send.

**Data the dashboard receives per poll (`GET dashboardData`):**
```json
{
  "sessionActive": true,
  "activePrompt": {
    "phrase": "this word",
    "issuedAt": "2026-09-08T09:15:00Z",
    "expiresAt": "2026-09-08T09:16:00Z",
    "responsesReceived": 27,
    "rosterCount": 38
  },
  "students": [
    {
      "name": "Dela Cruz, Juan A.",
      "status": "focused",          // "not_joined" | "focused" | "unfocused"
      "joinedAt": "2026-09-08T09:00:12Z",
      "lastActivityAt": "2026-09-08T09:14:55Z",
      "attentivenessPct": 92,
      "participationRate": 85,
      "matched": true
    },
    {
      "name": "J. delacruz",
      "status": "focused",
      "joinedAt": "2026-09-08T09:01:03Z",
      "lastActivityAt": "2026-09-08T09:14:40Z",
      "attentivenessPct": 88,
      "participationRate": 60,
      "matched": false
    }
  ]
}
```

**Data the dashboard sends when the professor sets a prompt (`POST setPrompt`):**
```json
{ "phrase": "this word", "durationSeconds": 60 }
```

## 5. Screens / regions
This is a single-page app. There is no navigation between separate pages — instead,
distinct functional regions on one screen:

### 5.1 Session status region
- Shows whether a session is currently active (students can be joining) or idle.
- Shows a "last updated" timestamp/indicator so the professor knows the data is live
  (e.g. reflecting the most recent successful poll).
- Shows a simple error indicator if a poll fails (e.g. "couldn't reach the server —
  retrying"), without wiping the last-known good data off the screen.

### 5.2 Chat prompt control region
- A text input where the professor types the expected phrase.
- A duration control (how long the prompt stays active before it expires — reasonable
  default, e.g. 60 seconds, adjustable).
- A "send/activate" action that submits the prompt.
- While a prompt is active, display:
  - The active phrase
  - Time remaining until it expires (or an expired state once time is up)
  - A live tally: how many of the roster have responded correctly so far (e.g. "27 / 38
    responded")
- After a prompt expires, it moves from "active" to a completed state until the
  professor sends a new one. No prompt is active by default.

### 5.3 Roster / live status region
The core view — a table or list, one row per **enrolled student** (from the full
roster, not just students who've sent events so far). Every enrolled student must
always be represented, even if they haven't joined yet.

Each row shows:
- **Student name** (as matched from the roster, in "LastName, FirstName, M.I." format)
- **Status** — one of:
  - `Not joined` — hasn't joined the Meet session at all
  - `Focused` — joined, Meet tab currently active/foregrounded
  - `Unfocused` — joined, but tabbed away from the Meet tab right now
- **Last activity timestamp** — most recent event of any kind from this student
- **Attentiveness %** — cumulative focused-time percentage for the session so far
- **Participation rate** — percentage of chat prompts this student has correctly
  responded to, out of prompts issued while they were present
- **Join time** (if joined)

### 5.4 Unmatched entries region
A separate list/section (not mixed into the main roster) for activity logged under a
display name that didn't match anyone on the roster — e.g. a student who didn't rename
themselves correctly. Each entry shows:
- The exact name/string that was detected
- Status and activity data, same fields as a normal roster row
- This exists so the professor can immediately spot and correct a naming problem,
  rather than that student's engagement data going untracked.

## 6. Interactions available to the professor
- Set/activate a new chat prompt (see 5.2)
- Sort or filter the roster — at minimum, useful filters are: show only `Unfocused`,
  show only `Not joined`, show only unmatched entries. Sorting by name and by
  attentiveness/participation is also useful.
- No other write actions are required for v1 — the professor doesn't edit student data,
  correct names, or manage the roster from this screen. Roster membership is managed in
  the underlying spreadsheet, not through the UI.

## 7. States to design for
- **No session active yet** (before class starts): roster shows all students as
  `Not joined`, no active prompt, session status region reflects idle state.
- **Session in progress, no active prompt**: normal roster view, chat prompt region
  shows no active prompt with an option to send one.
- **Session in progress, active prompt**: prompt region shows live response tally.
- **Prompt expired**: tally freezes, phrase shows as expired, professor can send a new
  one.
- **All students joined and focused**: no unusual handling needed, just the normal
  table fully populated.
- **Some/all students unmatched**: unmatched region is populated; make sure this isn't
  hidden or easy to miss, since it represents a data-quality problem the professor needs
  to act on.
- **Poll failure**: show a non-disruptive indicator; keep showing the last successful
  data rather than blanking the screen.

## 8. Explicitly out of scope for this version
- No historical/past-session browsing in the UI (raw data remains reviewable directly
  in the Google Sheet if needed later)
- No per-student detail/drill-down page
- No login screen
- No editing of roster or student records from the dashboard
- No visual design decisions — colors, typography, spacing, and layout aesthetics are a
  separate task
