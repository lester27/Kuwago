# Backend & System Specification — Classroom Activity Monitor

## 1. Scope of this document
Everything except the professor dashboard's UI: the Google Apps Script backend, the
Google Sheets data store, and the Chrome extension (student-side client). The dashboard
UI/content spec lives separately in `frontend-spec.md` — this document defines the API
contract the dashboard consumes.

## 2. System components
1. **Chrome extension** — runs in each student's browser, active only on
   `meet.google.com`. Detects identity, join/leave, tab focus, and chat activity.
2. **Google Apps Script** — single project acting as the backend hub. Receives events
   from the extension, owns the Sheet, and serves the dashboard HTML + JSON.
3. **Google Sheets** — the data store. Append-only event logs; derived state (live
   status, engagement %) is computed on read, not stored redundantly.

## 3. Identity model
Students are instructed to set their Google Meet display name to the exact format:
`LastName, FirstName, M.I.`

- The extension reads this name **directly from the Meet page DOM** (the student's own
  participant tile/entry) — not via `chrome.identity` or any OAuth flow. This keeps
  extension permissions minimal (`activeTab`, `scripting` on `meet.google.com` only).
- Every event the extension sends includes this raw name string.
- The backend normalizes incoming names (trim whitespace, collapse extra spaces,
  case-insensitive compare) before matching against the `Students` roster.
- **Match found** → event logged under the roster's canonical name, `matched = true`.
- **No match found** → event is still logged under the exact string received,
  `matched = false`. Nothing is ever silently dropped.

## 4. Google Sheets schema

### `Students` (professor-maintained roster)
| Column | Type | Notes |
|---|---|---|
| StudentName | string | Canonical "LastName, FirstName, M.I." — used as the match key |

### `Sessions`
| Column | Type | Notes |
|---|---|---|
| SessionID | string | Generated per join |
| StudentName | string | As received (post-normalization) |
| Matched | boolean | Whether StudentName matched the roster |
| JoinTime | datetime | |
| LeaveTime | datetime | Nullable until student leaves/tab closes |

### `FocusEvents`
| Column | Type | Notes |
|---|---|---|
| EventID | string | |
| StudentName | string | |
| SessionID | string | Foreign key to `Sessions` |
| Type | string | `lost` or `regained` |
| Timestamp | datetime | |

### `ChatPrompts`
| Column | Type | Notes |
|---|---|---|
| PromptID | string | |
| ExpectedPhrase | string | |
| IssuedAt | datetime | |
| ExpiresAt | datetime | |
| IsActive | boolean | Only one prompt active at a time |

### `ChatResponses`
| Column | Type | Notes |
|---|---|---|
| ResponseID | string | |
| StudentName | string | |
| PromptID | string | Foreign key to `ChatPrompts` |
| SubmittedText | string | Raw text as typed |
| Matched | boolean | Whether it matched the active prompt (normalized compare) |
| Timestamp | datetime | |

## 5. Apps Script endpoints
Single Apps Script project, routed by an `action` parameter. All requests/responses are
JSON except the bare dashboard page load.

| Endpoint | Method | Action | Purpose |
|---|---|---|---|
| `/` | GET | *(none)* | Serves the dashboard HTML page (`HtmlService`) |
| `/` | GET | `currentPrompt` | Extension polls this (every ~5–10s) for the active prompt, if any |
| `/` | GET | `dashboardData` | Dashboard polls this (every ~5s); returns full aggregated state — see shape in `frontend-spec.md` §4 |
| `/` | POST | `logEvent` | Extension reports join/leave/focus events |
| `/` | POST | `submitChat` | Extension reports raw typed chat text for prompt matching |
| `/` | POST | `setPrompt` | Professor sets a new expected phrase from the dashboard |

**`logEvent` request body:**
```json
{ "studentName": "Dela Cruz, Juan A.", "type": "join" }
```
`type` is one of: `join`, `leave`, `focus_lost`, `focus_regained`.

**`submitChat` request body:**
```json
{ "studentName": "Dela Cruz, Juan A.", "text": "this word" }
```
Matching logic (server-side): normalize both the active prompt's phrase and the
submitted text (trim, lowercase, collapse whitespace) and compare for equality. Only
compared against whichever prompt is currently active and not expired.

**`setPrompt` request body:**
```json
{ "phrase": "this word", "durationSeconds": 60 }
```
Setting a new prompt marks any currently active prompt as inactive/expired first — only
one prompt is active at a time.

## 6. Chrome extension specification

### Manifest (V3)
- `content_scripts` matching `https://meet.google.com/*`
- `background` service worker
- Permissions: `activeTab`, `scripting`, host permission for the Apps Script web app
  URL. No `identity` permission needed.

### Content script responsibilities (on the Meet page)
1. **Self-name detection**: locate the student's own name as shown in the Meet UI
   (self participant tile). Because Meet's DOM/class names are undocumented and can
   change, implement this defensively — try a small set of selector strategies, and
   re-check periodically (e.g. every poll cycle) rather than reading once, so a
   temporary DOM miss self-corrects on the next attempt.
2. **Chat detection**: use a `MutationObserver` on the chat panel to detect when the
   student sends a message. Capture the message text and forward it via `submitChat`.
   Same DOM-fragility caveat applies — expect occasional maintenance if Meet's UI
   changes.
3. **Visibility**: listen to `document.visibilitychange` as a secondary signal for
   focus state (works alongside the background worker's tab-level detection).

### Background service worker responsibilities
1. **Focus tracking**: use `chrome.tabs.onActivated` and
   `chrome.windows.onFocusChanged` to detect when the Meet tab loses/regains focus
   relative to the rest of the browser. Combine with the content script's
   `visibilitychange` signal to avoid false positives (e.g. switching to a picture-in-
   picture Meet window shouldn't count as "unfocused").
2. **Session lifecycle**: fire a `join` event when the content script first loads on an
   active Meet call, and a `leave` event on tab close / navigation away / Meet call end.
3. **Prompt polling**: poll `currentPrompt` every ~5–10 seconds while on an active Meet
   call. Pass the currently-known phrase down to the content script so it can compare
   locally if desired, though authoritative matching still happens server-side.
4. **Event dispatch**: batch/debounce rapid focus toggling (e.g. don't fire a
   lost/regained pair for a sub-second tab flick) before calling `logEvent`, to avoid
   flooding the Sheet with noise.

## 7. Engagement calculation (computed server-side, on read)
- **Attentiveness %** = total focused time ÷ total session time (both derived from
  `FocusEvents` + `Sessions` join/leave timestamps), per student, for the current
  session.
- **Participation rate** = count of `ChatResponses` with `Matched = true` for this
  student ÷ count of `ChatPrompts` issued while the student was present (joined and not
  yet left), per student, for the current session.
- Both are recomputed fresh on every `dashboardData` request — nothing is pre-stored, so
  there's no risk of stale cached percentages.

## 8. Non-functional notes
- **Apps Script quotas**: at 30–40 students with ~5s dashboard polling and ~5–10s
  extension polling, usage stays comfortably within consumer Apps Script execution
  quotas. No scaling work needed for this class size.
- **Meet DOM fragility**: both self-name detection and chat detection depend on Meet's
  unofficial DOM structure. Budget maintenance time if Google changes the UI mid-
  semester — this is the main ongoing risk in the system.
- **No real push/websocket layer**: all "live" behavior is polling-based. This is
  intentional, matching the "no overcomplexity" constraint at this scale.

## 9. Explicitly out of scope for this version
- OAuth / `chrome.identity` — replaced entirely by Meet-DOM name matching
- Historical multi-session analytics or storage beyond the current session's raw log
- Any monitoring of actual webpage content/URLs the student switches to (only the fact
  that focus was lost is tracked, never what site they went to)
- Audio/video content monitoring of any kind
