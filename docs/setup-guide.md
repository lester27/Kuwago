# Complete Setup Guide

This guide walks you through setting up all three layers of **Kuwago v2.0.0** from start to finish.

**Estimated setup time:** 15–20 minutes.

---

## Prerequisites

| Component | Requirement | Purpose |
|---|---|---|
| **Node.js** or **Python 3** | Node 18+ or Python 3.8+ | Serving the Professor Dashboard locally |
| **Google Chrome** | Modern stable version | Running the extension and dashboard |
| **Google Account** | Any personal or Google Workspace account | Hosting Google Sheets and Apps Script backend |
| **Git** | Any version | Cloning and updating the repository |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/lester27/Kuwago.git
cd Kuwago
```

---

## Step 2 — Create the Google Spreadsheet & Backend

1. Navigate to [Google Sheets](https://sheets.google.com) and create a **blank spreadsheet**.
2. Rename the document to **Kuwago Database**.
3. Copy the **Spreadsheet ID** from the browser address bar:
   ```
   https://docs.google.com/spreadsheets/d/1eOmyrcEPnxNj7qVkTpSiCpYiQlBBQs8_8xn2XyPvVQs/edit
                                          ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
   ```
4. In the spreadsheet menu bar, open **Extensions → Apps Script**.
5. Rename the Apps Script project to **Kuwago Backend**.
6. Create the script files:
   - In `Code.gs`, delete default code and paste the content of [`apps-script/Code.gs`](../apps-script/Code.gs).
   - Click **+ → Script**, name it `SheetHelpers`, and paste [`apps-script/SheetHelpers.gs`](../apps-script/SheetHelpers.gs).
   - Click **+ → Script**, name it `Engagement`, and paste [`apps-script/Engagement.gs`](../apps-script/Engagement.gs).
7. In `SheetHelpers.gs` around line 36, paste your **Spreadsheet ID**:
   ```javascript
   function getSpreadsheet() {
     var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
     return SpreadsheetApp.openById(SPREADSHEET_ID);
   }
   ```
8. Save all files (**Ctrl+S** or the disk icon).

---

## Step 3 — Auto-Initialize Sheets via `setupSheets()`

You don't need to manually create sheets or type headers:

1. In the Apps Script toolbar, click the function dropdown (where it says `doGet` or `myFunction`) and choose **`setupSheets`**.
2. Click **▶ Run**.
3. Authorize the permissions prompt:
   - Click **Review permissions** → select your Google account.
   - Click **Advanced** (bottom left) → **Go to Kuwago Backend (unsafe)** → **Allow**.
4. Return to your Google Spreadsheet. You will now see seven initialized tabs:
   - `Courses`
   - `Students`
   - `Sessions`
   - `FocusEvents`
   - `ChatPrompts`
   - `ChatResponses`
   - `Heartbeats`

---

## Step 4 — Populate Course & Roster Data

Open your Google Spreadsheet:

### 1. In the `Courses` tab:
Add your course sections (one per row):
| SectionID | CourseName | SectionName |
|---|---|---|
| `BSIT301-A` | `IT Capstone Project` | `Section A` |
| `BSIT301-B` | `IT Capstone Project` | `Section B` |

### 2. In the `Students` tab:
Add your student roster. The `SectionID` must match the `Courses` tab:
| StudentName | SectionID |
|---|---|
| `Dela Cruz, Juan A.` | `BSIT301-A` |
| `Santos, Maria C.` | `BSIT301-A` |
| `Reyes, Mark L.` | `BSIT301-B` |

---

## Step 5 — Deploy Apps Script as a Web App

1. In Apps Script, click **Deploy → New deployment**.
2. Click the gear icon → select **Web app**.
3. Fill in the deployment modal:
   - **Description**: `Kuwago Production v2.0.0`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` *(mandatory for extension and dashboard)*
4. Click **Deploy**.
5. Copy the **Web App URL** (e.g. `https://script.google.com/macros/s/.../exec`).

---

## Step 6 — Connect Dashboard & Extension

Configure the Web App URL in two places:

### 1. Dashboard: [`js/api.js`](../js/api.js)
```javascript
const API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

### 2. Chrome Extension: [`chrome-extension/background.js`](../chrome-extension/background.js)
```javascript
const API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

---

## Step 7 — Run the Professor Dashboard

Start a local static server inside the repository root:

```bash
# Option A: Zero-dependency Node.js server
npm start
# or: node serve-dashboard.js

# Option B: Python 3 server
python -m http.server 8080
```

Open your browser to: **`http://localhost:8080`**

*(To test the interface with simulated data offline, append `?mock=true`: `http://localhost:8080/?mock=true`)*

---

## Step 8 — Install the Student Chrome Extension

1. Open Google Chrome and visit: `chrome://extensions`
2. Toggle on **Developer mode** in the top-right corner.
3. Click **Load unpacked** (top-left).
4. Select the `chrome-extension/` directory from the Kuwago repository.
5. The **Kuwago Classroom Monitor** extension will now be active in your toolbar.

---

## Step 9 — Verification & Live Testing Walkthrough

1. In the Professor Dashboard, select your course section from the dropdown (`BSIT301-A`).
2. Click **Start Class**. The live session timer will begin ticking.
3. Open a Google Meet call at `meet.google.com` (as a student).
4. Verify on the dashboard:
   - Student's status updates to **On Meet tab**.
   - Attendance badge marks as **Present**.
5. Switch to a different tab on the student machine:
   - After a short debounce, status switches to **Away from Meet tab**.
6. Click **Send Prompt** on the dashboard, type `"code"` for 60 seconds:
   - Student sees the prompt notification in Meet.
   - Student types `"code"` in the Meet chat.
   - Dashboard instantly registers the response and tallies it in real time.
7. Click **End Class** and confirm:
   - The **Session Summary** modal appears showing overall stats.
   - Open your Google Spreadsheet: a new tab named `Session_2026-09-11_BSIT301-A` has been automatically compiled with all records!
