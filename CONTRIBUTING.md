# Contributing to Kuwago

Thanks for your interest! This is primarily a personal classroom tool, but
contributions, bug reports, and suggestions are welcome.

---

## Reporting Bugs

Open a [GitHub Issue](https://github.com/lester27/Kuwago/issues) with:

- A clear title
- Steps to reproduce
- What you expected vs. what actually happened
- Browser / Node / OS version

---

## Suggesting Features

Open an issue tagged **enhancement** with a clear description of the use case.

---

## Submitting a Pull Request

1. Fork the repo and create a branch from `main`:
   ```
   git checkout -b feature/my-improvement
   ```

2. Make your changes. Keep each commit focused on one thing.

3. Test locally using mock mode:
   ```
   node serve-dashboard.js
   # then open http://127.0.0.1:8080/?mock=true
   ```

4. Open a Pull Request against `main` with a clear description of what changed
   and why.

---

## Code Style

- **JavaScript**: vanilla ES modules in the frontend, Apps Script V8 (CommonJS
  style) in the backend. No build step, no transpilation.
- **CSS**: design tokens in `css/tokens.css`; no utility-class frameworks.
- **Commits**: use the imperative mood (`Fix bug` not `Fixed bug`).

---

## Project Structure

```
Kuwago/
├── index.html              # Dashboard single-page app
├── serve-dashboard.js      # Local dev server (Node, no deps)
├── css/                    # Stylesheet modules
│   ├── tokens.css          # Design tokens (colors, spacing, radii)
│   ├── layout.css          # Page & sidebar layout
│   ├── components.css      # Cards, tables, modals, buttons
│   └── states.css          # Loading, error, empty states
├── js/                     # Frontend ES modules
│   ├── app.js              # Entry point — init, poll loop, nav
│   ├── api.js              # Fetch wrapper (real + mock)
│   ├── render.js           # DOM rendering functions
│   ├── prompt.js           # Prompt modal controller
│   ├── respondents.js      # Respondents modal controller
│   └── mock.js             # Mock data generator
├── apps-script/            # Google Apps Script backend
│   ├── Code.gs             # Router + endpoint handlers
│   ├── SheetHelpers.gs     # Sheet read/write helpers
│   ├── Engagement.gs       # Attentiveness & participation calculation
│   ├── Index.html          # Dashboard HTML (served by Apps Script)
│   ├── JavaScript.html     # Bundled JS (served by Apps Script)
│   └── Styles.html         # Bundled CSS (served by Apps Script)
├── chrome-extension/       # Student-side Chrome extension
│   ├── manifest.json       # MV3 manifest
│   ├── content.js          # Meet page name + chat detection
│   ├── background.js       # Focus tracking + event dispatch
│   └── popup.html / popup.js  # Extension popup UI
├── docs/                   # Documentation
└── spec/                   # Original functional specs
```
