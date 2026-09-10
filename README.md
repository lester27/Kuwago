# Kuwago 🦉

> **Real-time student engagement monitor for Google Meet classrooms.**

Kuwago gives professors a live view of who has joined, who is focused, and who
is responding during a class — all updating automatically every 5 seconds
without a page reload.

---

## What it does

| What you see | How it works |
|---|---|
| Live roster with focus status per student | Chrome extension detects tab focus on each student's browser |
| Attentiveness % per student | Ratio of focused time to total session time |
| Chat prompt — send a phrase, see who responds | Professor sets a phrase from the dashboard; extension watches each student's chat |
| Participation rate per student | Fraction of prompts each student answered correctly |
| Unmatched entries | Students whose Meet display name didn't match the roster |

---

## Architecture

```
┌─────────────────────────────────────┐
│  Student Browser (Chrome Extension) │
│  ┌─────────────┐  ┌──────────────┐  │
│  │ content.js  │  │background.js │  │
│  │ - name det. │  │ - focus track│  │
│  │ - chat obs. │  │ - join/leave │  │
│  └──────┬──────┘  └──────┬───────┘  │
└─────────┼────────────────┼──────────┘
          │  logEvent / submitChat / currentPrompt
          ▼
┌─────────────────────────────────────┐
│       Google Apps Script            │
│       (doGet / doPost router)       │
│  ┌──────────────────────────────┐   │
│  │ Code.gs · SheetHelpers.gs    │   │
│  │ Engagement.gs                │   │
│  └──────────────┬───────────────┘   │
└─────────────────┼───────────────────┘
                  │  read / write
                  ▼
         ┌────────────────┐
         │ Google Sheets  │
         │ Students       │
         │ Sessions       │
         │ FocusEvents    │
         │ ChatPrompts    │
         │ ChatResponses  │
         └───────┬────────┘
                 │  dashboardData (every 5s)
                 ▼
┌─────────────────────────────────────┐
│   Professor Browser (Dashboard)     │
│   index.html + js/ + css/           │
│   served by node serve-dashboard.js │
└─────────────────────────────────────┘
```

See [`docs/architecture.md`](docs/architecture.md) for the detailed sequence
diagram.

---

## Project structure

```
Kuwago/
├── index.html              # Dashboard single-page app
├── serve-dashboard.js      # Local dev server (Node, zero deps)
├── package.json
├── css/
│   ├── tokens.css          # Design tokens
│   ├── layout.css          # Page layout
│   ├── components.css      # UI components
│   └── states.css          # Loading / error states
├── js/
│   ├── app.js              # Entry point + poll loop
│   ├── api.js              # Fetch wrapper
│   ├── render.js           # DOM rendering
│   ├── prompt.js           # Prompt modal
│   ├── respondents.js      # Respondents modal
│   └── mock.js             # Mock data for local dev
├── apps-script/            # Google Apps Script backend
│   ├── Code.gs             # Router + handlers
│   ├── SheetHelpers.gs     # Sheet I/O helpers
│   ├── Engagement.gs       # Engagement calculations
│   └── ...
├── chrome-extension/       # Student-side extension (MV3)
│   ├── manifest.json
│   ├── content.js
│   ├── background.js
│   └── ...
├── docs/                   # Full documentation
└── spec/                   # Original functional specs
```

---

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later (for the local dev server)
- Google Chrome (for the extension)
- A Google account with access to Google Apps Script and Google Sheets

### 1 — Run the dashboard locally

```bash
# Clone the repo
git clone https://github.com/lester27/Kuwago.git
cd Kuwago

# Start the local server (no install needed — zero dependencies)
node serve-dashboard.js
```

Open **http://127.0.0.1:8080** in your browser.

> **Tip:** Add `?mock=true` to the URL to use realistic mock data without
> a live backend: `http://127.0.0.1:8080?mock=true`

### 2 — Deploy the Apps Script backend

See **[`docs/apps-script.md`](docs/apps-script.md)** for the full guide.

Short version:
1. Create a new Google Apps Script project.
2. Copy the files from `apps-script/` into the project.
3. Set the `SPREADSHEET_ID` constant in `Code.gs` to your Google Sheet's ID.
4. Deploy as a **Web App** (Execute as: Me, Access: Anyone).
5. Copy the deployment URL into `js/api.js` → `API_BASE`.

### 3 — Install the Chrome extension (students)

See **[`docs/chrome-extension.md`](docs/chrome-extension.md)** for the full
guide.

Short version:
1. Open **chrome://extensions** → enable Developer Mode.
2. Click **Load unpacked** → select the `chrome-extension/` folder.
3. The extension activates automatically when a student opens a Google Meet.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design and data flow |
| [Setup Guide](docs/setup-guide.md) | Complete setup for all three components |
| [API Reference](docs/api-reference.md) | All endpoint shapes and field definitions |
| [Chrome Extension](docs/chrome-extension.md) | Extension internals and install guide |
| [Apps Script](docs/apps-script.md) | Backend deployment and sheet schema |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

Private / Unlicensed — all rights reserved.
