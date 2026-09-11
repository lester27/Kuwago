# Kuwago 🦉

> **Real-time student engagement, attendance, and focus monitoring for Google Meet classrooms.**

Kuwago provides professors with a live, glanceable control center during online classes. It tracks who is present, who is actively paying attention to the Google Meet tab, and who responds to real-time verification prompts — updating automatically every 5 seconds without requiring page refreshes.

---

## What Kuwago Does

| Capability | How It Works |
|---|---|
| **Class Session Lifecycle** | Professor selects a section (`BSIT301-A`), clicks **Start Class**, and monitors a live session timer. Ending the class compiles an automated per-session Google Sheet report. |
| **Priority Roster** | A clean, high-priority list displaying each student's name, live status (`On Meet tab`, `Away from Meet tab`, `Not joined`), attendance badge, and alert indicator. |
| **Student Detail Drill-Down** | Clicking any student opens an in-depth modal showing session timestamps, attendance history & overrides, focus lapse breakdown, participation log, and extension health. |
| **Actionable Focus Lapses** | Replaces arbitrary "percentages" with concrete data: counts how many times a student left the Meet tab longer than the threshold and the exact cumulative time spent away. |
| **Automated Attendance Engine** | Categorizes attendance automatically into `Present`, `Late`, or `Absent` based on configurable grace periods. Professors can manually override status with an audit reason. |
| **Real-Time Verification Prompts** | Professor broadcasts a prompt phrase with an expiration countdown; the Chrome extension listens to chat messages and tallies matches in real time. |
| **Extension Health & Heartbeats** | Background workers ping health heartbeats to a dedicated sheet tab; flags disconnected students or outdated extension versions. |
| **Unmatched Identity Resolution** | Automatically identifies students whose Google Meet display names differ from the official roster and provides an in-dashboard binding tool. |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│              Student Browser (Chrome Extension MV3)             │
│  ┌──────────────────────────────┐  ┌─────────────────────────┐  │
│  │ content.js                   │  │ background.js           │  │
│  │ - Meet display name detection│  │ - Window/tab focus track│  │
│  │ - MutationObserver chat watch│  │ - Heartbeat beacon (15s)│  │
│  │ - In-page prompt alerts      │  │ - Join / leave lifecycle│  │
│  └──────────────┬───────────────┘  └────────────┬────────────┘  │
└─────────────────┼───────────────────────────────┼───────────────┘
                  │ logEvent / submitChat / pulse │
                  ▼                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Google Apps Script Backend                   │
│                    (doGet / doPost API Router)                  │
│  ┌──────────────────────────────┬────────────────────────────┐  │
│  │ Code.gs                      │ SheetHelpers.gs            │  │
│  │ - Roster & session lifecycle │ - Sheet CRUD & setupSheets │  │
│  │ - Priority payload generator │ - Scoped section rosters   │  │
│  ├──────────────────────────────┴────────────────────────────┤  │
│  │ Engagement.gs                                             │  │
│  │ - Focus lapse calculation & sustained unfocus alerts      │  │
│  │ - Participation matching & attendance classification      │  │
│  └──────────────────────────────┬────────────────────────────┘  │
└─────────────────────────────────┼───────────────────────────────┘
                                  │ read / write
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Google Sheets Database Storage                  │
│  ┌──────────────┬──────────────┬──────────────┬──────────────┐  │
│  │ Courses      │ Students     │ Sessions     │ Heartbeats   │  │
│  ├──────────────┼──────────────┼──────────────┼──────────────┤  │
│  │ FocusEvents  │ ChatPrompts  │ ChatResponses│ Session_...  │  │
│  └──────────────┴──────────────┴──────────────┴──────────────┘  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ JSON responses (5s poll & lazy detail)
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Professor Dashboard Web Application            │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ index.html + css/ + js/ (Vanilla ES Modules, Zero Build)   │  │
│  │ - session.js    : Class lifecycle, course selector, timer │  │
│  │ - attendance.js : Overrides, alias resolution & auditing  │  │
│  │ - render.js     : Priority roster, student detail modals  │  │
│  │ - prompt.js     : Live chat prompt dispatch & respondents │  │
│  │ - mock.js       : Offline sandbox (?mock=true)            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
Kuwago/
├── index.html                    # Professor Dashboard SPA
├── serve-dashboard.js            # Node.js local dev server (zero dependencies)
├── package.json                  # Project metadata (v2.0.0)
├── css/
│   ├── tokens.css                # Color variables, typography, and spacing tokens
│   ├── layout.css                # Grid layout, responsive containers, session bar
│   ├── components.css            # Priority roster rows, modals, badges, alerts
│   └── states.css                # Connection banners, empty states, loading indicators
├── js/
│   ├── app.js                    # Application entry point, poll coordinator
│   ├── api.js                    # Fetch client with timeout, retry & last-good cache
│   ├── session.js                # Class lifecycle controls (start/end, course selector)
│   ├── attendance.js             # Attendance overrides and alias binding handlers
│   ├── render.js                 # DOM rendering: Priority Roster, Detail Modal, Prompts
│   ├── prompt.js                 # Chat prompt dialog and active prompt countdown
│   ├── respondents.js            # Respondents breakdown dialog
│   └── mock.js                   # Comprehensive offline mock data engine (?mock=true)
├── apps-script/                  # Google Apps Script Backend
│   ├── Code.gs                   # Web App router, endpoints & session sheet export
│   ├── SheetHelpers.gs           # Database I/O, setupSheets(), and schema helpers
│   ├── Engagement.gs             # Focus lapse analytics, attendance & participation math
│   └── appsscript.json           # Apps Script manifest
├── chrome-extension/             # Student-side Chrome Extension (Manifest V3)
│   ├── manifest.json             # Extension permissions & content script definitions
│   ├── background.js             # Service worker (focus tracking, heartbeats, polling)
│   ├── content.js                # Google Meet DOM name detector & chat listener
│   ├── popup.html / popup.js     # Extension toolbar status popup
│   └── icons/                    # Extension visual assets
├── docs/                         # Comprehensive Documentation
│   ├── README.md                 # Documentation portal
│   ├── architecture.md           # Deep architectural specification and flows
│   ├── setup-guide.md            # Complete step-by-step setup guide
│   ├── api-reference.md          # Full API contract reference for all endpoints
│   ├── apps-script.md            # Google Sheets schemas and deployment instructions
│   └── chrome-extension.md       # Extension mechanics, installation, and permissions
├── spec/                         # Specifications & Addenda
└── CHANGELOG.md                  # Release notes and version history
```

---

## Quick Start Guide

### Prerequisites
- **Node.js** (v18+) or **Python 3** (for serving the local dashboard)
- **Google Chrome** (for student extension and professor dashboard)
- A **Google Account** (for Google Apps Script and Google Sheets)

---

### 1. Set Up Google Sheets & Apps Script

1. Create a new Google Spreadsheet at [sheets.google.com](https://sheets.google.com).
2. Open **Extensions → Apps Script**.
3. Create three script files matching `apps-script/`:
   - `Code.gs`
   - `SheetHelpers.gs`
   - `Engagement.gs`
4. In `SheetHelpers.gs`, update `SPREADSHEET_ID` with your Google Spreadsheet ID (found in the Sheet's URL).
5. In the Apps Script toolbar, select `setupSheets` from the function dropdown and click **▶ Run**. This automatically creates all required sheets with the correct headers:
   - `Courses`, `Students`, `Sessions`, `FocusEvents`, `ChatPrompts`, `ChatResponses`, `Heartbeats`.
6. Add your sections to `Courses` (e.g. `BSIT301-A | IT Capstone | Section A`) and students to `Students` (including their matching `SectionID`).
7. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
8. Copy the generated Web App URL.

---

### 2. Configure Frontend & Extension

1. In `js/api.js`, set `API_BASE` to your Apps Script Web App URL.
2. In `chrome-extension/background.js`, set `API_BASE` to the same Web App URL.

---

### 3. Run the Dashboard

Start the local server (zero third-party dependencies):

```bash
# Using Node.js:
npm start
# or: node serve-dashboard.js

# Alternatively, using Python 3:
python -m http.server 8080
```

Open `http://localhost:8080` in Chrome.

> **Offline Mock Mode**: To test the dashboard UI without configuring Google Apps Script, visit:
> `http://localhost:8080/?mock=true`

---

### 4. Install the Chrome Extension (Students)

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** and choose the `chrome-extension/` directory.
4. When students join a Google Meet at `meet.google.com`, the extension activates automatically, sends a heartbeat, and connects to the active class session.

---

## Documentation Index

For in-depth documentation, visit the [`docs/`](docs/) directory:

- 📐 **[System Architecture](docs/architecture.md)** — Architectural design, data flow, state machines, and sequence diagrams.
- 🚀 **[Setup Guide](docs/setup-guide.md)** — Complete, foolproof deployment walkthrough from scratch.
- 📡 **[API Reference](docs/api-reference.md)** — Detailed request/response contracts for all endpoints.
- 📊 **[Apps Script & Sheets](docs/apps-script.md)** — Database schemas, `setupSheets()` automation, and maintenance.
- 🧩 **[Chrome Extension](docs/chrome-extension.md)** — Focus detection algorithm, heartbeat protocol, and permissions.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines, coding standards, and workflow practices.

---

## License

Private / Unlicensed — All rights reserved.
