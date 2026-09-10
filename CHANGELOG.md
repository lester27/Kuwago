# Changelog

All notable changes to **Kuwago** will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project uses [Semantic Versioning](https://semver.org/).

---

## [1.0.0] — 2026-09-10

### Added

#### Professor Dashboard (frontend)
- Single-page dashboard served locally via `node serve-dashboard.js`
- Live roster table with per-student status (`Focused`, `Unfocused`, `Not Joined`)
- Attentiveness % and participation rate columns, updated on every poll
- Unmatched entries section for students whose Meet display names don't match the roster
- Active prompt card showing phrase, countdown timer, and live response tally (`X / Y responded`)
- Chat prompt modal — professor can set a phrase + duration and push it to the class
- Session status bar with last-updated timestamp and poll-failure indicator
- Filter bar (All / Focused / Unfocused / Not Joined / Unmatched)
- Column sort (Name, Status, Attentiveness, Participation, Last Activity, Join Time)
- Mock mode (`?mock=true`) for local development without a live backend
- Respondents modal showing who has responded to the active prompt
- Polling every 5 seconds with graceful last-known-good fallback on failures

#### Chrome Extension (`chrome-extension/`)
- Manifest V3 Chrome extension targeting `meet.google.com`
- Content script: detects the student's own Meet display name from the DOM
- Content script: `MutationObserver`-based chat capture, forwarded to `submitChat`
- Background service worker: tab focus/blur tracking via `chrome.tabs.onActivated` + `chrome.windows.onFocusChanged`
- Background service worker: join/leave lifecycle events
- Background service worker: debounced focus-lost/regained to suppress sub-second flickers
- Background service worker: polls `currentPrompt` every ~5–10 s

#### Google Apps Script Backend (`apps-script/`)
- `doGet` / `doPost` router with action-based dispatch
- `dashboardData` endpoint: returns full aggregated roster state
- `currentPrompt` endpoint: returns the active prompt (for extension polling)
- `logEvent` endpoint: records join, leave, focus-lost, focus-regained events
- `submitChat` endpoint: matches raw chat text against the active prompt
- `setPrompt` endpoint: sets a new expected phrase with a configurable duration
- Engagement calculations (attentiveness %, participation rate) computed fresh on every read — nothing cached
- Google Sheets schema: `Students`, `Sessions`, `FocusEvents`, `ChatPrompts`, `ChatResponses`
- Name normalization: case-insensitive, whitespace-collapsed matching against roster

#### Documentation
- `README.md` — overview, architecture diagram, quick-start guide
- `CHANGELOG.md` — this file
- `docs/architecture.md` — full system architecture with Mermaid sequence diagram
- `docs/setup-guide.md` — step-by-step setup for all three components
- `docs/api-reference.md` — all endpoint shapes and field definitions
- `docs/chrome-extension.md` — extension internals and install instructions
- `docs/apps-script.md` — Apps Script deployment and sheet setup

---

_Versions prior to 1.0.0 were internal development iterations._
