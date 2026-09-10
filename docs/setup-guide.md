# Setup Guide

This guide walks through setting up all three components of Kuwago from scratch.

**Estimated time:** 20–30 minutes

---

## Prerequisites

| Tool | Minimum version | Notes |
|---|---|---|
| Node.js | 18+ | For the local dashboard server |
| Google Chrome | Any current version | For the extension |
| Google Account | — | For Apps Script + Sheets |
| Git | Any | To clone the repo |

---

## Step 1 — Clone the repo

```bash
git clone https://github.com/lester27/Kuwago.git
cd Kuwago
```

---

## Step 2 — Set up the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new blank spreadsheet.
2. Rename it to something like **Kuwago Data**.
3. Create five sheets (tabs at the bottom) with **exactly** these names:
   - `Students`
   - `Sessions`
   - `FocusEvents`
   - `ChatPrompts`
   - `ChatResponses`
4. Add header rows to each sheet:

   **Students:** `StudentName`

   **Sessions:** `SessionID | StudentName | Matched | JoinTime | LeaveTime`

   **FocusEvents:** `EventID | StudentName | SessionID | Type | Timestamp`

   **ChatPrompts:** `PromptID | ExpectedPhrase | IssuedAt | ExpiresAt | IsActive`

   **ChatResponses:** `ResponseID | StudentName | PromptID | SubmittedText | Matched | Timestamp`

5. In the Students sheet, add your student roster — one name per row in the format:
   ```
   LastName, FirstName, M.I.
   ```
   Example: `Dela Cruz, Juan A.`

6. Copy the **Spreadsheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
   ```

---

## Step 3 — Deploy the Apps Script backend

1. Go to [script.google.com](https://script.google.com) and create a **New Project**.
2. Rename it to **Kuwago Backend**.
3. Copy the content of each `.gs` file from `apps-script/` into corresponding script files:
   - `Code.gs` → replaces the default `Code.gs`
   - Create `SheetHelpers.gs` (File → New → Script)
   - Create `Engagement.gs`
4. In `Code.gs`, find the `SPREADSHEET_ID` constant and replace it with your sheet's ID:
   ```javascript
   const SPREADSHEET_ID = 'paste-your-id-here';
   ```
5. Also copy the HTML files:
   - File → New → HTML → name it `Index` → paste content of `apps-script/Index.html`
   - Repeat for `JavaScript` and `Styles`
6. Deploy as a Web App:
   - Click **Deploy → New deployment**
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone** (required for extension to call it)
   - Click **Deploy**
7. Copy the **Web App URL** — it looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```

---

## Step 4 — Configure the dashboard

Open `js/api.js` and replace the `API_BASE` constant with your deployment URL:

```javascript
const API_BASE = 'https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec';
```

Save the file.

---

## Step 5 — Run the dashboard

```bash
node serve-dashboard.js
```

Open **http://127.0.0.1:8080** in your browser.

> **Mock mode:** To test the UI without a live backend, open  
> `http://127.0.0.1:8080?mock=true`

---

## Step 6 — Install the Chrome extension (per student)

See [`docs/chrome-extension.md`](chrome-extension.md) for the full guide.

Short version:
1. Open `chrome://extensions` in Chrome.
2. Enable **Developer mode** (top-right toggle).
3. Click **Load unpacked**.
4. Select the `chrome-extension/` folder.
5. The extension is now installed — it activates automatically on `meet.google.com`.

> **Student instructions:** Tell students to set their Google Meet display name
> to exactly: `LastName, FirstName, M.I.` before joining class.
> Example: `Santos, Maria B.`

---

## Updating the deployment

After editing Apps Script files, re-deploy:
- **Deploy → Manage deployments → Edit → New version → Deploy**
- The URL stays the same.

After editing dashboard files, no redeploy needed — just refresh the browser.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| Dashboard shows "Poll failed" | `API_BASE` not set / Apps Script not deployed | Check Step 4 + redeploy |
| All students show "Not Joined" | Extension not installed, or Meet name mismatch | Verify extension + student names |
| Student appears in Unmatched | Display name doesn't match roster exactly | Ask student to rename in Meet |
| Apps Script quota error | Too many requests | Reduce poll frequency in `app.js` |
