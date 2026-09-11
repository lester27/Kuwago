# Kuwago Documentation Portal

Welcome to the comprehensive technical documentation for **Kuwago v2.0.0** — real-time classroom engagement, attendance tracking, and focus telemetry for Google Meet.

---

## Core Documentation Guides

| Guide | Description | Target Audience |
|---|---|---|
| 📐 **[System Architecture](architecture.md)** | Full architectural overview, component breakdowns, Mermaid sequence flows, and Google Sheets entity schemas. | Architects & Developers |
| 🚀 **[Setup Guide](setup-guide.md)** | Step-by-step walkthrough for deploying Google Sheets, Apps Script, Chrome Extension, and the Professor Dashboard. | Professors & System Admins |
| 📡 **[API Reference](api-reference.md)** | Exhaustive request/response specifications for all 13 REST-like actions across GET and POST interfaces. | Frontend & Backend Engineers |
| 📊 **[Google Apps Script & Database](apps-script.md)** | Backend router implementation, sheet schemas, `setupSheets()` automation, and maintenance guides. | Backend Developers |
| 🧩 **[Chrome Extension](chrome-extension.md)** | Deep dive into Manifest V3 event debouncing, DOM name scraping, chat observers, and the 15-second heartbeat loop. | Client Engineers |

---

## Specifications & Design History

For original requirements and Phase 2 addenda, explore the [`spec/`](../spec/) directory:
- [`spec/frontend-spec-addendum.md`](../spec/frontend-spec-addendum.md) — Priority Roster UX design & Student Detail modal specifications.
- [`spec/backend-spec-addendum.md`](../spec/backend-spec-addendum.md) — Class session control, `Courses` sheet, and per-session consolidated exports.
- [`spec/frontend-dashboard-restructure.md`](../spec/frontend-dashboard-restructure.md) — Focus Lapses metric transition specification.
- [`spec/backend-dashboard-restructure.md`](../spec/backend-dashboard-restructure.md) — Trimmed `dashboardData` and `studentDetail` data contracts.
