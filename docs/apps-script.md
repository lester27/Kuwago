# Google Apps Script Backend

The `apps-script/` directory contains the complete serverless backend and database manager for Kuwago, powered by Google Apps Script and backed by Google Sheets.

---

## Core Script Files

| File | Primary Responsibilities |
|---|---|
| [`Code.gs`](../apps-script/Code.gs) | `doGet` and `doPost` routing, endpoint request parsing, active session lifecycle, consolidated per-session export tab generation. |
| [`SheetHelpers.gs`](../apps-script/SheetHelpers.gs) | `SPREADSHEET_ID` configuration, database CRUD, `setupSheets()` automation, name normalization, and schema definitions. |
| [`Engagement.gs`](../apps-script/Engagement.gs) | Mathematical models for focus lapses, sustained unfocus alert computation, participation rate calculation, and attendance status inference. |

---

## Deploying From Scratch

### 1. Create the Spreadsheet & Project

1. Create a new Google Spreadsheet at [sheets.google.com](https://sheets.google.com) and name it `Kuwago Database`.
2. Copy the Spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```
3. In the Spreadsheet menu, open **Extensions → Apps Script**.
4. Rename the script project to **Kuwago Backend**.

### 2. Copy the Script Files

In the Apps Script editor:
1. Replace `Code.gs` with the local [`apps-script/Code.gs`](../apps-script/Code.gs).
2. Click **+ → Script**, name it `SheetHelpers`, and paste [`apps-script/SheetHelpers.gs`](../apps-script/SheetHelpers.gs).
3. Click **+ → Script**, name it `Engagement`, and paste [`apps-script/Engagement.gs`](../apps-script/Engagement.gs).

### 3. Set the Spreadsheet ID

In `SheetHelpers.gs` (around line 36), ensure your Spreadsheet ID is set:

```javascript
function getSpreadsheet() {
  var SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}
```

### 4. Initialize Database Tables via `setupSheets()`

Rather than manually creating and formatting 7 tabs with exact headers:
1. In the Apps Script toolbar, locate the function dropdown menu (defaults to `myFunction` or `doGet`).
2. Select **`setupSheets`**.
3. Click **▶ Run**.
4. Google will ask for permission authorization on the first run — click **Review permissions**, select your Google account, click **Advanced → Go to Kuwago Backend (unsafe)**, and grant access.
5. `setupSheets()` will automatically create all required sheets with their exact headers:
   - `Courses`
   - `Students`
   - `Sessions`
   - `FocusEvents`
   - `ChatPrompts`
   - `ChatResponses`
   - `Heartbeats`

### 5. Deploy as a Web App

1. In the top right corner of the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure the deployment:
   - **Description**: `Kuwago v2.0.0 Production`
   - **Execute as**: `Me (your-email@gmail.com)`
   - **Who has access**: `Anyone` *(crucial: the Chrome extension and local dashboard require access without Google login prompt)*
4. Click **Deploy**.
5. Copy the generated **Web App URL** (looks like `https://script.google.com/macros/s/.../exec`).

---

## Updating an Existing Deployment

Whenever you modify any `.gs` file in the Apps Script project:
1. Click **Deploy → Manage deployments**.
2. Select your active deployment and click the **Pencil icon (Edit)**.
3. In the **Version** dropdown, select **New version**.
4. Click **Deploy**.

> ⚠️ **Important:** If you do not publish a **New version**, Apps Script will continue running the previous cached code, even if the editor shows updated code.

---

## Database Schema Reference

```
Google Spreadsheet: Kuwago Database
├── Courses           (SectionID, CourseName, SectionName)
├── Students          (StudentName, SectionID)
├── Sessions          (SessionID, StudentName, Matched, JoinTime, LeaveTime)
├── FocusEvents       (EventID, StudentName, SessionID, Type, Timestamp)
├── ChatPrompts       (PromptID, ExpectedPhrase, IssuedAt, ExpiresAt, IsActive)
├── ChatResponses     (ResponseID, StudentName, PromptID, SubmittedText, Matched, Timestamp)
├── Heartbeats        (StudentName, DetectedName, ExtensionVersion, Timestamp)
└── Session_YYYY-MM-DD_SectionID  (Automated frozen export generated upon endSession)
```

---

## Automated Session Export: `generateSessionSheet`

When the professor clicks **End Class** in the dashboard, `handleEndSession()` invokes `generateSessionSheet()`:
- Evaluates attendance status for every student enrolled in the section.
- Incorporates any manual overrides logged during class.
- Calculates focus lapses and cumulative away duration.
- Computes participation success rates on prompts issued while the student was joined.
- Generates a permanent tab named `Session_<Date>_<SectionID>` (e.g. `Session_2026-09-11_BSIT301-A`) with bold headers and auto-formatted widths.
