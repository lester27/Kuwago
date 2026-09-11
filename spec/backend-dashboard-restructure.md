# Dashboard Data Contract — Priority Roster + Detail

This modifies the `dashboardData` response shape defined in `backend-spec.md` §5 and
adds one new endpoint. Removes `attentivenessPct` entirely — it's no longer computed
or stored anywhere.

## 1. `dashboardData` — updated per-student shape
Trimmed to only what the roster row needs:

```json
{
  "name": "Dela Cruz, Juan A.",
  "liveStatus": "on_meet",       // "not_joined" | "on_meet" | "away"
  "attendanceStatus": "present", // "present" | "late" | "absent" | "excused"
  "activeAlerts": ["sustained_unfocus"],  // empty array if none
  "matched": true
}
```

`attentivenessPct` is removed from this payload. Full focus-lapse detail lives in the
new `studentDetail` endpoint instead, not in the roster payload — no need to compute
or transmit it for all 40 students on every 5-second poll when only one student's
detail is being viewed at a time.

## 2. New endpoint: `studentDetail`
`GET ?action=studentDetail&sessionId=...&studentName=...`

```json
{
  "name": "Dela Cruz, Juan A.",
  "liveStatus": "on_meet",
  "joinedAt": "2026-09-08T09:00:12Z",
  "leftAt": null,
  "attendance": {
    "status": "present",
    "overrides": [
      { "from": "late", "to": "excused", "reason": "doctor's note", "at": "2026-09-08T09:10:00Z" }
    ]
  },
  "focusLapses": {
    "count": 2,
    "totalSeconds": 220,
    "lapses": [
      { "startedAt": "2026-09-08T09:05:00Z", "durationSeconds": 75 },
      { "startedAt": "2026-09-08T09:12:00Z", "durationSeconds": 145 }
    ]
  },
  "participation": {
    "answered": 3,
    "issued": 4,
    "responses": [
      { "promptId": "p1", "phrase": "this word", "submittedText": "this word", "matched": true, "timestamp": "..." }
    ]
  },
  "extension": {
    "connected": true,
    "version": "1.2.0",
    "lastHeartbeatAt": "2026-09-08T09:14:50Z",
    "detectedName": "Dela Cruz, Juan A."
  },
  "identity": { "matched": true, "detectedName": "Dela Cruz, Juan A.", "canonicalName": "Dela Cruz, Juan A." }
}
```

## 3. Focus lapse calculation
Derived from `FocusEvents` (unchanged sheet): pair each `focus_lost` with its
following `focus_regained` (or session end, if still away when the session closes)
for that student/session. A pair counts as a lapse only if its duration exceeds the
**same sustained-unfocus threshold used by the Alert Queue** (backend addendum §7,
default 60s) — reusing that exact threshold is intentional, so the lapse count on the
roster and the sustained-unfocus alerts are always derived from the same rule and
never contradict each other. Pairs shorter than the threshold are not lapses and
aren't counted or returned.

## 4. Removed
- `attentivenessPct` field and its underlying calculation (focused time ÷ total
  session time) — delete this logic entirely rather than leaving it computed but
  unused.
