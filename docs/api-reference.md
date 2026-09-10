# API Reference

All API calls go to the Apps Script Web App URL (`API_BASE` in `js/api.js`).
All requests use **GET** to work around Apps Script's CORS redirect issue with
POST from a cross-origin page.

---

## Endpoints

### `GET ?action=dashboardData`

Returns the full aggregated state for the professor dashboard. Called every
~5 seconds.

**Response:**
```json
{
  "sessionActive": true,
  "activePrompt": {
    "phrase": "this word",
    "issuedAt": "2026-09-08T09:15:00Z",
    "expiresAt": "2026-09-08T09:16:00Z",
    "responsesReceived": 27,
    "rosterCount": 38
  },
  "students": [
    {
      "name": "Dela Cruz, Juan A.",
      "status": "focused",
      "joinedAt": "2026-09-08T09:00:12Z",
      "lastActivityAt": "2026-09-08T09:14:55Z",
      "attentivenessPct": 92,
      "participationRate": 85,
      "matched": true
    },
    {
      "name": "J. delacruz",
      "status": "focused",
      "joinedAt": "2026-09-08T09:01:03Z",
      "lastActivityAt": "2026-09-08T09:14:40Z",
      "attentivenessPct": 88,
      "participationRate": 60,
      "matched": false
    }
  ]
}
```

**Fields:**

| Field | Type | Description |
|---|---|---|
| `sessionActive` | boolean | Whether any student has joined in this session |
| `activePrompt` | object \| null | Active chat prompt, or null if none |
| `activePrompt.phrase` | string | The expected chat phrase |
| `activePrompt.issuedAt` | ISO 8601 | When the prompt was set |
| `activePrompt.expiresAt` | ISO 8601 | When the prompt expires |
| `activePrompt.responsesReceived` | number | Matched responses so far |
| `activePrompt.rosterCount` | number | Total roster size |
| `students[]` | array | One entry per student (roster + unmatched) |
| `students[].name` | string | Display name (canonical if matched, raw if not) |
| `students[].status` | string | `not_joined` \| `focused` \| `unfocused` |
| `students[].joinedAt` | ISO 8601 \| null | Join timestamp, null if not joined |
| `students[].lastActivityAt` | ISO 8601 \| null | Most recent event timestamp |
| `students[].attentivenessPct` | number | 0–100, focused time ÷ session time |
| `students[].participationRate` | number | 0–100, prompts answered ÷ prompts issued while present |
| `students[].matched` | boolean | Whether name matched a roster entry |

---

### `GET ?action=currentPrompt`

Returns only the currently active prompt. Used by the Chrome extension
(polling every ~5–10 s) to know what phrase students should type.

**Response (active prompt):**
```json
{
  "active": true,
  "phrase": "this word",
  "expiresAt": "2026-09-08T09:16:00Z"
}
```

**Response (no active prompt):**
```json
{
  "active": false
}
```

---

### `GET ?action=setPrompt&phrase=...&durationSeconds=...`

Sets a new active chat prompt. Any currently active prompt is immediately
expired. Only one prompt can be active at a time.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `phrase` | string | Yes | The expected phrase students should type |
| `durationSeconds` | integer | No (default: 60) | How long the prompt stays active |

**Response:**
```json
{ "success": true }
```

---

### `GET ?action=logEvent&studentName=...&type=...`

Records a student lifecycle event.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `studentName` | string | Yes | Student's Meet display name |
| `type` | string | Yes | `join` \| `leave` \| `focus_lost` \| `focus_regained` |

**Response:**
```json
{ "success": true }
```

**Notes:**
- The backend normalizes `studentName` (trim, lowercase, collapse whitespace)
  before matching against the roster.
- Events are always logged, even if the name doesn't match a roster entry
  (`matched = false`).

---

### `GET ?action=submitChat&studentName=...&text=...`

Submits a student's raw chat message for prompt matching.

**Query parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `studentName` | string | Yes | Student's Meet display name |
| `text` | string | Yes | Raw chat text as typed |

**Response:**
```json
{ "success": true, "matched": true }
```

**Matching logic:**
Both the active prompt phrase and the submitted text are normalized (trim,
lowercase, collapse whitespace) before comparison. Only compared against the
currently active, non-expired prompt.

---

## Error responses

All endpoints return HTTP 200 even on application errors (Apps Script
limitation). Check the `success` field and any `error` field in the response body.

```json
{ "success": false, "error": "No active prompt" }
```

---

## Name normalization

Student names are matched using this normalization pipeline:

1. Trim leading/trailing whitespace
2. Collapse multiple spaces to one
3. Lowercase everything
4. Compare

Example: `"  Dela Cruz,  JUAN A.  "` normalizes to `"dela cruz, juan a."` and
matches roster entry `"Dela Cruz, Juan A."`.
