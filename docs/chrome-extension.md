# Chrome Extension Guide

The `chrome-extension/` directory contains a Manifest V3 browser extension designed to run in each student's browser during a Google Meet session.

---

## Architectural Responsibilities

| Responsibility | Implementation Mechanism |
|---|---|
| **Self-Name Detection** | `content.js` inspects Google Meet's DOM participant elements with fallback selector heuristics. |
| **Tab & Window Focus Tracking** | `background.js` combines `chrome.tabs.onActivated` and `chrome.windows.onFocusChanged` with a 1.5-second debounce. |
| **Health Heartbeats** | Periodic 15-second beacon (`POST ?action=heartbeat`) reporting extension vitality and version. |
| **Session Join & Leave** | Content script initialization fires `join`; tab close/navigation fires `leave`. |
| **Prompt Polling & Interception** | Background worker polls `currentPrompt` every ~7 seconds; `MutationObserver` in `content.js` captures chat messages. |

---

## Directory Structure

```
chrome-extension/
├── manifest.json       # MV3 permissions, host permissions, and scripts
├── content.js          # Injected into meet.google.com DOM
├── background.js       # Background service worker (heartbeats, focus, API)
├── popup.html          # Toolbar popup UI
├── popup.js            # Toolbar popup logic
└── icons/              # Extension icon assets (16x16, 48x48, 128x128)
```

---

## How Focus Tracking Works

To prevent false alarms caused by quick window clicks, Alt-Tab glances, or OS notifications, Kuwago utilizes a dual-signal debouncing algorithm:

```
[Tab Activation Event]   ──┐
                           ├─► Debounce Window (1,500ms) ─► Agreement Check ─► Dispatch Event
[Window Focus Event]     ──┘
```

1. **State Aggregation**: The background service worker listens to both `chrome.tabs.onActivated` (tab switches) and `chrome.windows.onFocusChanged` (app/window switches).
2. **Debounce Buffer**: When focus changes away from the active Google Meet tab, an event is scheduled with a 1,500ms delay.
3. **Cancellation**: If the student returns to the Meet tab within 1,500ms, the pending `focus_lost` event is cancelled and discarded.
4. **Dispatch**: If the student remains away, a `focus_lost` event is dispatched to the backend.

---

## Heartbeat Health Engine

To differentiate between a student who simply closed their tab and a student whose extension crashed or was disabled:
- Every 15 seconds, `background.js` pulses a health check to the Apps Script endpoint:
  ```json
  {
    "action": "heartbeat",
    "studentName": "Juan Dela Cruz",
    "detectedName": "Juan Dela Cruz",
    "version": "2.0.0"
  }
  ```
- The backend writes this to the `Heartbeats` sheet tab (one row per student, continuously overwritten).
- If the professor dashboard detects no heartbeat from an active student for longer than the alert threshold, a **Disconnected** warning is raised.

---

## Google Meet DOM Name Detection

The content script reads the student's name directly from the Google Meet user interface without requiring Google OAuth identity scopes:

1. **Selector Fallbacks**: The script queries participant self-tiles using standard attributes, `data-self-name`, and aria-labels.
2. **Normalization**: Names are cleaned, stripped of "(You)" or "(Presentation)" suffixes, and trimmed.
3. **Periodic Validation**: Detection runs on a periodic cycle to accommodate dynamic DOM mutations during Google Meet loading.
4. **Identity Binding**: If a student's Google account name differs from their enrolled roster name (e.g. `Johnny D.` vs. `Dela Cruz, Juan`), the professor can bind the alias directly from the dashboard using **Resolve Match**.

---

## Permissions Rationale

| Permission | Justification |
|---|---|
| `activeTab` | Injects content script upon navigating to Google Meet. |
| `scripting` | Enables programmatic DOM observation on Meet tabs. |
| `tabs` | Allows background service worker to detect tab switching. |
| `host_permissions: https://meet.google.com/*` | Grants execution rights on all Google Meet rooms. |
| `host_permissions: https://script.google.com/*` | Authorizes background API calls to Apps Script without CORS preflight restrictions. |

*Note: Kuwago strictly adheres to privacy standards. The extension does not record video, microphone streams, or browse history outside `meet.google.com`.*

---

## Configuration & Installation

### 1. Configure the API URL
In `background.js` (line 17), set the `API_BASE` to your deployed Apps Script URL:
```javascript
const API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 2. Install Unpacked Extension
1. Open Google Chrome and go to `chrome://extensions`.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked** (top-left).
4. Select the `chrome-extension/` directory.

### 3. Reloading After Code Changes
When you update `background.js` or `content.js`:
1. Return to `chrome://extensions`.
2. Locate **Kuwago Classroom Monitor**.
3. Click the **↻ (Reload)** button.
4. Refresh any active Google Meet tabs.
