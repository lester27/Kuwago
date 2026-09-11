# Dashboard Restructure — Priority Roster + Student Detail

This modifies `frontend-spec.md` §5.3 (Roster region) and interacts with the phase 2
addendum's health panel, attendance, and alert queue regions (those stay as their own
separate regions — this only changes the main roster row and adds a drill-down).

## What changes and why
The roster was a flat table with every metric visible for every student at once.
Replace it with a lightweight priority list — only what the professor needs to notice
immediately — with a click-through detail view for everything else.

## Metric change: remove Attentiveness %, replace with Focus Lapses
Attentiveness % (focused time ÷ total time) doesn't tell the professor anything
actionable on its own. Replace it everywhere with:

**Focus lapses** — a count of times the student went unfocused for longer than the
sustained-unfocus alert threshold (same threshold as the Alert Queue, so the two
numbers never disagree with each other), plus the cumulative time spent away across
those lapses. Brief tab flicks under the threshold don't count at all — same principle
as "don't treat brief tab switches as misconduct" from the alert queue design.

Shown compactly, e.g.: `2 lapses · 3m 40s away`. A clean student with none shows
"No focus lapses" rather than "0" — reads as a status, not a bare number.

## 1. Roster row (collapsed/priority view)
Replaces the original flat table. One row per roster student, showing only:

- **Student name**
- **Live status** — `Not joined` / `On Meet tab` / `Away from Meet tab` — the single
  most important glance-able fact
- **Attendance badge** — compact icon for Present / Late / Absent / Excused
- **Alert indicator** — shown only when this student currently has an active alert
  (sustained unfocus, disconnected extension, unanswered prompt, unmatched identity).
  Absent for students with nothing wrong — don't show an empty/neutral badge, just
  omit it, so a glance at the roster shows exactly who needs attention.

Nothing else lives on the row. Participation numbers, focus lapse detail, extension
version, join/leave timestamps — all moved to the detail view below.

The row is clickable/tappable anywhere to open detail — no separate "view" button
needed.

## 2. Student detail (opens on click)
Opens as a panel or modal within the same page — no full navigation away from the
dashboard. Contents:

- **Header**: name + live status restated plainly — "Currently: On Meet tab" /
  "Away from Meet tab" / "Not joined" — this is the direct answer to "are they on the
  call right now," front and center
- **Session times**: joined at, left at (if applicable)
- **Attendance**: current status, plus override history if the professor has
  corrected it (each entry: old status → new status, reason, timestamp)
- **Focus lapses**: count + total time away, plus a simple list of each lapse
  (started at, how long it lasted)
- **Participation**: prompts answered vs. issued, and a per-prompt list — what was
  asked, what they submitted, whether it matched
- **Extension health**: connected/disconnected, version, last heartbeat, detected
  name
- **Identity**: matched/unmatched to roster; if unmatched, a shortcut into the
  resolution action already defined in the phase 2 addendum rather than duplicating
  that UI here

## 3. States to design for
- Row with an active alert vs. none (badge presence/absence, as above)
- Detail panel open/closed
- Student with zero focus lapses (clean state wording, not just "0")
- Student never joined — detail view still opens, but session-specific fields
  (lapses, participation, extension health) show as "not applicable" rather than
  empty/broken-looking
