# Google Apps Script Backend

The `apps-script/` folder contains the full backend for Kuwago — an API server
and data store manager built on Google Apps Script, backed by Google Sheets.

---

## Files

| File | Purpose |
|---|---|
| `Code.gs` | `doGet`/`doPost` router + all endpoint handlers |
| `SheetHelpers.gs` | All Spreadsheet read/write operations |
| `Engagement.gs` | Attentiveness % and participation rate calculations |
| `Index.html` | Dashboard HTML (alternative: served by Apps Script instead of `node`) |
| `JavaScript.html` | Bundled frontend JS (for Apps Script–hosted deployment) |
| `Styles.html` | Bundled CSS (for Apps Script–hosted deployment) |
| `appsscript.json` | Project manifest (timezone, runtime, web app config) |

---

## Deploying from scratch

### 1. Create the Apps Script project

1. Go to [script.google.com](https://script.google.com)
2. Click **New project**
3. Rename it to **Kuwago Backend**

### 2. Add the script files

For each `.gs` file in `apps-script/`:

1. If the file is `Code.gs`: paste its content into the default script file
2. For all other `.gs` files: **File → New → Script**, name it to match, paste content

For each `.html` file in `apps-script/`:

1. **File → New → HTML file**, name it to match (without `.html`), paste content

### 3. Set your Spreadsheet ID

In `Code.gs`, find:

```javascript
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
```

Replace with your Google Sheet's ID (from its URL):
```
https://docs.google.com/spreadsheets/d/THIS_IS_THE_ID/edit
```

### 4. Deploy as a Web App

1. Click **Deploy → New deployment**
2. Click the gear icon → **Web app**
3. Set:
   - **Description**: `v1`
   - **Execute as**: `Me`
   - **Who has access**: `Anyone` ← required for the Chrome extension to call it
4. Click **Deploy**
5. Copy the **Web App URL** — save this, you'll need it in Step 5

### 5. Update the dashboard's API URL

In `js/api.js`, replace:

```javascript
const API_BASE = 'https://script.google.com/macros/s/.../exec';
```

with your deployment URL.

---

## Updating the deployment

After editing any `.gs` or `.html` file:

1. **Deploy → Manage deployments**
2. Click the pencil (edit) icon on your deployment
3. Change **Version** to **New version**
4. Click **Deploy**

> The URL does not change when you create a new version.

---

## Google Sheets schema

See [`docs/architecture.md`](architecture.md#google-sheets-schema) for the
full table schemas.

**Quick reference — sheet tab names:**
- `Students` — professor-maintained roster (one name per row)
- `Sessions` — join/leave events per student
- `FocusEvents` — focus lost/regained events
- `ChatPrompts` — prompts issued by the professor
- `ChatResponses` — chat messages submitted by students

---

## Quota considerations

At 30–40 students with a 5-second dashboard poll and a 5–10 second extension
poll, Apps Script execution stays well within Google's consumer quotas. No
special configuration is needed.

If you have significantly more students or run very long sessions, monitor
usage via **Apps Script → Executions**.

---

## Configuration constants (in `Code.gs`)

| Constant | Default | Description |
|---|---|---|
| `SPREADSHEET_ID` | *(must set)* | Your Google Sheet's ID |
| `DEFAULT_PROMPT_DURATION_S` | `60` | Default prompt duration in seconds |

---

## How engagement is calculated

Both metrics are computed **fresh on every `dashboardData` request**. Nothing
is stored pre-calculated in the sheet.

**Attentiveness %**
```
= total focused time ÷ total session duration × 100
```
- Total session duration = time from first `join` to latest `leave` (or now, if still joined)
- Total focused time = session duration minus all focus-lost intervals

**Participation rate**
```
= matched chat responses ÷ prompts issued while present × 100
```
- A prompt "counts" for a student only if they were joined when it was issued
- Only responses where `Matched = true` count

---

## Running Apps Script locally (emulation)

Apps Script doesn't run outside Google's servers, but you can test the
dashboard against the live backend using **mock mode**:

```
http://127.0.0.1:8080?mock=true
```

This bypasses all API calls entirely and uses realistic generated data.
