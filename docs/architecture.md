# System Architecture

## Overview

Kuwago is composed of three independent components that communicate via HTTP:

| Component | Where it runs | Who deploys it |
|---|---|---|
| **Chrome Extension** | Each student's Chrome browser | Professor (load unpacked or distributed) |
| **Apps Script Backend** | Google's servers | Professor (Google Apps Script project) |
| **Professor Dashboard** | Professor's local machine | Professor (`node serve-dashboard.js`) |

---

## Data Flow

### Sequence diagram — normal session

```
Student (Chrome Extension)          Apps Script + Sheets       Professor (Dashboard)
        │                                    │                         │
        │── join event ──────────────────►  │                         │
        │                               [Sessions row written]        │
        │── focus_lost ──────────────────►  │                         │
        │── focus_regained ──────────────►  │                         │
        │                               [FocusEvents rows written]    │
        │                                    │                         │
        │                                    │◄── GET dashboardData ──│  (every 5s)
        │                                    │                         │
        │                               [reads Students, Sessions,    │
        │                                FocusEvents, ChatPrompts,    │
        │                                ChatResponses; computes      │
        │                                attentiveness + participation]│
        │                                    │                         │
        │                                    │── JSON response ───────►│
        │                                    │                         │  (renders roster)
        │                                    │                         │
        │◄── GET currentPrompt ─────────────│ (every 5–10s from ext) │
        │         {phrase, expiresAt}        │                         │
        │                                    │                         │
        │  [student types phrase in chat]    │                         │
        │── submitChat ──────────────────►  │                         │
        │                               [ChatResponses row written,   │
        │                                match evaluated]             │
        │                                    │                         │
        │                                    │◄── POST setPrompt ─────│  (professor sets prompt)
        │                                    │   {phrase, duration}    │
        │                               [ChatPrompts row written,     │
        │                                old prompt expired]          │
```

---

## Component Details

### Chrome Extension

Runs entirely in each **student's** browser. It never reads any other student's
data.

```
chrome-extension/
├── manifest.json     # MV3 — permissions: activeTab, scripting, tabs
├── content.js        # Injected into meet.google.com
│                     #   - reads student's own display name from DOM
│                     #   - MutationObserver on chat panel
│                     #   - visibilitychange listener
├── background.js     # Service worker
│                     #   - chrome.tabs.onActivated
│                     #   - chrome.windows.onFocusChanged
│                     #   - join/leave lifecycle
│                     #   - currentPrompt polling
└── popup.html/js     # Status popup (extension toolbar icon)
```

**Permissions rationale:**
- `activeTab` / `scripting` — inject content script on the active Meet tab
- `tabs` — detect tab focus switches in the background worker
- No `identity` permission — student name is read from the Meet DOM, not OAuth

### Google Apps Script Backend

A single Apps Script project acting as the API server and data store manager.

```
apps-script/
├── Code.gs           # doGet/doPost router + endpoint handlers
├── SheetHelpers.gs   # All Spreadsheet read/write operations
├── Engagement.gs     # Attentiveness % + participation rate calculations
├── Index.html        # Dashboard HTML (alternative: served by Apps Script)
├── JavaScript.html   # Bundled JS (alternative deployment)
└── Styles.html       # Bundled CSS (alternative deployment)
```

All engagement metrics are **computed on read** — nothing is pre-stored or
cached in the sheet. This means every `dashboardData` poll gets fresh numbers.

### Professor Dashboard

A static single-page app with no build step. Served locally by a zero-dependency
Node.js file server.

```
index.html            # The SPA shell
serve-dashboard.js    # Local file server (Node, stdlib only)
css/
├── tokens.css        # Design system tokens
├── layout.css        # Page shell + sidebar
├── components.css    # All UI components
└── states.css        # Loading, error, empty states
js/
├── app.js            # Init, 5s poll loop, nav, sort, filter
├── api.js            # Fetch wrapper + last-known-good fallback
├── render.js         # DOM rendering (roster, cards, prompt area)
├── prompt.js         # "Set prompt" modal
├── respondents.js    # "Who responded" modal
└── mock.js           # Mock data generator for ?mock=true
```

---

## Google Sheets Schema

The sheet is the sole data store. All five tables live as separate worksheets.

### `Students`
| Column | Type | Notes |
|---|---|---|
| StudentName | string | Canonical `LastName, FirstName, M.I.` — roster key |

### `Sessions`
| Column | Type | Notes |
|---|---|---|
| SessionID | string | UUID per join event |
| StudentName | string | Normalized received name |
| Matched | boolean | Did it match a roster entry? |
| JoinTime | datetime | |
| LeaveTime | datetime | Null until leave/close |

### `FocusEvents`
| Column | Type | Notes |
|---|---|---|
| EventID | string | |
| StudentName | string | |
| SessionID | string | FK → Sessions |
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
| PromptID | string | FK → ChatPrompts |
| SubmittedText | string | Raw chat text |
| Matched | boolean | Normalized phrase match |
| Timestamp | datetime | |

---

## Engagement Calculations

Both metrics are computed server-side on every `dashboardData` request:

**Attentiveness %**
```
= total focused time ÷ total session duration
```
Derived from `FocusEvents` (lost/regained timestamps) plus `Sessions`
join/leave times. Periods with no `lost` event count as focused.

**Participation rate**
```
= prompts answered correctly ÷ prompts issued while student was present
```
A prompt "counts" for a student only if they were joined (session open) when
it was issued.
