# Chrome Extension

The `chrome-extension/` folder contains a Manifest V3 Chrome extension that
runs in each **student's** browser during a Google Meet session.

---

## What it does

| Responsibility | Implementation |
|---|---|
| Detect student's own name | Reads the self-participant tile in Meet's DOM |
| Detect tab focus / blur | `chrome.tabs.onActivated` + `chrome.windows.onFocusChanged` |
| Detect join / leave | Content script load on Meet + tab close / navigation away |
| Capture chat messages | `MutationObserver` on Meet's chat panel |
| Poll for active prompt | Background worker polls `currentPrompt` every ~5–10 s |

---

## Files

```
chrome-extension/
├── manifest.json     # MV3 manifest
├── content.js        # Injected into every meet.google.com page
├── background.js     # Service worker (persistent background logic)
├── popup.html        # Toolbar icon popup
├── popup.js          # Popup controller
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Permissions

| Permission | Why it's needed |
|---|---|
| `activeTab` | Inject the content script into the active Meet tab |
| `scripting` | Run content script programmatically |
| `tabs` | Detect tab focus changes in the background worker |
| `host_permissions: meet.google.com` | Content script runs on Meet pages |
| `host_permissions: script.google.com` | API calls to the Apps Script backend |

**No `identity` permission is used.** The student's name is read directly from
Meet's page DOM — no OAuth flow required.

---

## How name detection works

The content script looks for the student's own name in Meet's participant UI.
Because Meet's DOM structure is undocumented and can change, the content script:

1. Tries multiple CSS selector strategies in priority order.
2. Re-runs detection on every poll cycle (not just once on load) — so a
   temporary DOM miss self-corrects next time.
3. Caches the name once found to avoid thrashing.

> ⚠️ **Maintenance note:** If Google updates Meet's UI, selectors may need
> updating. This is the main ongoing maintenance risk.

---

## How chat detection works

A `MutationObserver` watches the chat panel for new messages. When the student
sends a message, the raw text is forwarded to `submitChat`. The server does the
phrase matching — the extension sends everything.

---

## How focus tracking works

The background service worker combines two signals:

1. `chrome.tabs.onActivated` — fires when the user switches tabs
2. `chrome.windows.onFocusChanged` — fires when the browser window loses focus

A `focus_lost` event is fired only after **both** signals agree the Meet tab is
backgrounded, with a short debounce to suppress sub-second flickers (e.g.
clicking between windows quickly).

---

## Installing the extension (developer / manual install)

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `chrome-extension/` folder from this repository
5. The **Classroom Monitor** extension will appear in your extensions list
6. It activates automatically whenever you open `meet.google.com`

> The extension icon will appear in your Chrome toolbar. Clicking it shows a
> small popup with connection status.

---

## Student setup instructions

Students need to:

1. Install the extension (professor distributes / loads unpacked)
2. **Set their Google Meet display name** to the exact format:
   ```
   LastName, FirstName, M.I.
   ```
   Example: `Santos, Maria B.`

   To rename in Meet: click the three-dot menu on your own tile → **Change name**

If a student's name doesn't match the roster, their data will appear in the
**Unmatched** section of the dashboard rather than their roster row.

---

## Known limitations

- **Meet DOM fragility** — name detection and chat detection rely on Meet's
  unofficial DOM. Google can change this without notice.
- **No cross-device tracking** — a student on two devices creates two sessions.
- **No content monitoring** — only the _fact_ that focus was lost is tracked,
  never which website the student switched to.
