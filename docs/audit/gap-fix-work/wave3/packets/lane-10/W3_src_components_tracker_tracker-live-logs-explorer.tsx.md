# Work packet (wave 3): edit src/components/tracker/tracker-live-logs-explorer.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-020  [P1] MISSING  facet F05  effort L
- Legacy: `logs.js:447-478`: groups by normalized signature and interleaves deploy markers.
- vNext now: `tracker-live-logs-explorer.tsx:20-23,196-223`: dedupe by id only, no group or deploy markers.
- Fix: Port grouping by normalised message/path and interleaved deploys with unique row keys.

## G2-16-005-037  [P1] MISSING  facet F09  effort L
- Legacy: `TrackerLogDetailsDrawer.jsx:101-110`: right drawer width min(760px, 100vw), persists while shown.
- vNext now: `tracker-live-logs-explorer.tsx:196-223`: inline disclosure per log; no drawer.
- Fix: Add 760px drawer with full detail fetch, overlay/focus behavior and deep link.

## G2-16-005-038  [P1] MISSING  facet F09  effort L
- Legacy: `TrackerLogDetailsDrawer.jsx:153-246`: detail fields, source links, read-only SQL, request and stacktrace, sanitized JSON.
- vNext now: `tracker-live-logs-explorer.tsx:196-221`: message and basic requestRef/component, no rich detail sections.
- Fix: Add detail grid, source frames and sanitized raw JSON (redaction enforced server side).

## G2-16-005-057  [P1] MISSING  facet F14  effort L
- Legacy: `TrackerLogDetailsDrawer.jsx:235-246`: `Sanitized raw log payload` expandable JSON with Copy as JSON.
- vNext now: `tracker-live-logs-explorer.tsx:196-221`: no raw JSON/details.
- Fix: Add raw sanitized JSON for permitted admins with copy, avoid exposing secrets.
