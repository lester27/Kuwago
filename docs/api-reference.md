# API Reference

All API communications route through the Google Apps Script Web App URL (`API_BASE` in `js/api.js` and `chrome-extension/background.js`).

### Request Conventions:
- **CORS Handling**: Because browsers restrict cross-origin POST requests with custom headers against Google Apps Script redirects, the dashboard uses `GET` requests for polling and query actions, and sends `POST` requests with `Content-Type: text/plain` (avoiding preflight) or query-string fallbacks.
- **Chrome Extension**: The extension has `host_permissions` declared for `script.google.com`, permitting direct `POST` requests without CORS restrictions.

---

## 1. Class-Session Management

### `GET ?action=getCourses`
Returns all available academic courses and sections defined in the `Courses` spreadsheet tab.

**Response:**
```json
{
  "success": true,
  "courses": [
    {
      "sectionId": "BSIT301-A",
      "courseName": "IT Capstone Project",
      "sectionName": "Section A"
    },
    {
      "sectionId": "BSIT301-B",
      "courseName": "IT Capstone Project",
      "sectionName": "Section B"
    }
  ]
}
```

---

### `GET ?action=getSessionState`
Returns the currently active class session (if any). Queried by the dashboard upon page load or reconnect.

**Response (Session Active):**
```json
{
  "sessionActive": true,
  "sessionId": "sess-1726027200000",
  "sectionId": "BSIT301-A",
  "courseName": "IT Capstone Project",
  "startedAt": "2026-09-11T08:00:00.000Z"
}
```

**Response (No Active Session):**
```json
{
  "sessionActive": false
}
```

---

### `POST ?action=startSession`
Activates a new class session for the specified section. Rejects if a session is already in progress.

**Payload:**
```json
{
  "sectionId": "BSIT301-A"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "sess-1726027200000",
  "sectionId": "BSIT301-A",
  "startedAt": "2026-09-11T08:00:00.000Z",
  "rosterCount": 35
}
```

---

### `POST ?action=endSession`
Concludes the active session. Closes open student sessions, evaluates final attendance and participation, generates the permanent `Session_YYYY-MM-DD_SectionID` sheet tab, and marks the session closed.

**Payload:**
```json
{
  "sessionId": "sess-1726027200000"
}
```

**Response:**
```json
{
  "success": true,
  "sessionId": "sess-1726027200000",
  "sheetName": "Session_2026-09-11_BSIT301-A",
  "summary": {
    "totalEnrolled": 35,
    "present": 30,
    "late": 3,
    "absent": 2,
    "excused": 0,
    "averageParticipation": 88.5,
    "totalFocusLapses": 14
  }
}
```

---

## 2. Real-Time Roster & Analytics

### `GET ?action=dashboardData`
Returns the high-priority state for the professor dashboard. Polled every ~5 seconds during an active session. Stripped of heavy telemetry logs to maintain instantaneous rendering.

**Response:**
```json
{
  "sessionActive": true,
  "sessionId": "sess-1726027200000",
  "sectionId": "BSIT301-A",
  "activePrompt": {
    "promptId": "prompt-1",
    "phrase": "matrix",
    "issuedAt": "2026-09-11T08:15:00.000Z",
    "expiresAt": "2026-09-11T08:16:00.000Z",
    "responsesReceived": 28,
    "rosterCount": 35
  },
  "students": [
    {
      "name": "Dela Cruz, Juan A.",
      "liveStatus": "on_meet",
      "attendanceStatus": "present",
      "activeAlerts": [],
      "matched": true
    },
    {
      "name": "Santos, Maria C.",
      "liveStatus": "away",
      "attendanceStatus": "late",
      "activeAlerts": ["sustained_unfocus"],
      "matched": true
    },
    {
      "name": "john_doe99",
      "liveStatus": "on_meet",
      "attendanceStatus": "present",
      "activeAlerts": ["unmatched_name"],
      "matched": false
    }
  ]
}
```

#### Student Fields:
| Field | Type | Values / Description |
|---|---|---|
| `name` | string | Canonical roster name, or raw Meet name if unmatched |
| `liveStatus` | string | `"not_joined"` \| `"on_meet"` \| `"away"` |
| `attendanceStatus` | string | `"present"` \| `"late"` \| `"absent"` \| `"excused"` |
| `activeAlerts` | string[] | Array of active flags: `"sustained_unfocus"`, `"disconnected"`, `"unanswered_prompt"`, `"unmatched_name"` |
| `matched` | boolean | Whether the student's Meet identity matches the enrolled roster |

---

### `GET ?action=studentDetail&sessionId=...&studentName=...`
Returns complete telemetry, focus lapse logs, and prompt participation records for a single student. Lazy-loaded when opening the Student Detail Modal.

**Response:**
```json
{
  "name": "Dela Cruz, Juan A.",
  "liveStatus": "on_meet",
  "joinedAt": "2026-09-11T08:02:15.000Z",
  "leftAt": null,
  "attendance": {
    "status": "present",
    "overrides": [
      {
        "from": "late",
        "to": "present",
        "reason": "Traffic / ISP lag verified",
        "timestamp": "2026-09-11T08:10:00.000Z"
      }
    ]
  },
  "focusLapses": {
    "count": 2,
    "totalSeconds": 180,
    "lapses": [
      { "startedAt": "2026-09-11T08:14:00.000Z", "durationSeconds": 60 },
      { "startedAt": "2026-09-11T08:25:00.000Z", "durationSeconds": 120 }
    ]
  },
  "participation": {
    "answered": 2,
    "issued": 2,
    "responses": [
      {
        "promptId": "prompt-1",
        "phrase": "matrix",
        "submittedText": "matrix",
        "matched": true,
        "timestamp": "2026-09-11T08:15:20.000Z"
      }
    ]
  },
  "extension": {
    "connected": true,
    "version": "2.0.0",
    "lastHeartbeatAt": "2026-09-11T08:30:10.000Z",
    "detectedName": "Juan Dela Cruz"
  },
  "matched": true
}
```

---

## 3. Attendance & Identity Operations

### `POST ?action=overrideAttendance`
Records a manual attendance status override for a student during the active session.

**Payload:**
```json
{
  "sessionId": "sess-1726027200000",
  "studentName": "Dela Cruz, Juan A.",
  "newStatus": "excused",
  "reason": "Medical appointment certificate submitted"
}
```

**Response:**
```json
{
  "success": true,
  "studentName": "Dela Cruz, Juan A.",
  "status": "excused"
}
```

---

### `POST ?action=resolveMatch`
Binds an unrecognized Meet display name to an enrolled roster student. Updates canonical identity and removes temporary ghost rows.

**Payload:**
```json
{
  "rawName": "john_doe99",
  "canonicalName": "Dela Cruz, Juan A."
}
```

**Response:**
```json
{
  "success": true,
  "rawName": "john_doe99",
  "canonicalName": "Dela Cruz, Juan A."
}
```

---

## 4. Verification Prompts

### `GET ?action=currentPrompt`
Polled by student Chrome extensions every ~7 seconds. Returns the active prompt phrase if within its validity window.

**Response (Active):**
```json
{
  "active": true,
  "phrase": "matrix",
  "expiresAt": "2026-09-11T08:16:00.000Z"
}
```

**Response (Inactive):**
```json
{
  "active": false
}
```

---

### `POST ?action=setPrompt`
Broadcasts a new verification prompt. Deactivates any previously open prompt.

**Payload:**
```json
{
  "phrase": "matrix",
  "durationSeconds": 60
}
```

**Response:**
```json
{
  "success": true,
  "promptId": "prompt-1",
  "phrase": "matrix",
  "expiresAt": "2026-09-11T08:16:00.000Z"
}
```

---

## 5. Chrome Extension Telemetry

### `POST ?action=heartbeat`
Pulsed by the Chrome extension every 15 seconds to report client vitality.

**Payload:**
```json
{
  "studentName": "Juan Dela Cruz",
  "detectedName": "Juan Dela Cruz",
  "version": "2.0.0"
}
```

---

### `POST ?action=logEvent`
Dispatches lifecycle and focus events from the student browser.

**Payload:**
```json
{
  "type": "focus_lost",
  "studentName": "Juan Dela Cruz",
  "sessionId": "sess-1726027200000"
}
```
*Supported `type` values: `"join"`, `"leave"`, `"focus_lost"`, `"focus_regained"`.*

---

### `POST ?action=submitChat`
Transmits raw chat messages intercepted in Google Meet for server-side evaluation.

**Payload:**
```json
{
  "studentName": "Juan Dela Cruz",
  "text": "matrix"
}
```

**Response:**
```json
{
  "matched": true
}
```
