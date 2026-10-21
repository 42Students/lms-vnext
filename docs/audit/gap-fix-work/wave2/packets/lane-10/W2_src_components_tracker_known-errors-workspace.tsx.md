# Work packet (wave 2): edit src/components/tracker/known-errors-workspace.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-16/u005-tracker-logs.md

## G2-16-005-039  [P2] GAP  facet F09  effort M
- Legacy: `KnownErrorsDrawer.jsx` invoked `logs.js:756-761`: known errors overlay separate from Logs.
- vNext now: `tracker/logs/page.tsx:88`; `known-errors-workspace.tsx:232-280`: known errors list is top-level content.
- Fix: Restore drawer for known errors from More menu while preserving safe audit controls.

## G2-16-005-060  [P2] GAP  facet F15  effort M
- Legacy: `logs.js:166-193`: on successful first query marks viewed and computes new count based on lastViewedAt.
- vNext now: `known-errors-workspace.tsx:243-250`: only explicit Mark logs reviewed.
- Fix: Restore passive last-visit timestamp and new event calculation with safe anti-duplicate handling.

## G2-16-005-082  [P2] GAP  facet F22  effort M
- Legacy: `SuperAdminLogsController.java:68-84`; `LogAlertAdminService` persists last viewed and startup time.
- vNext now: `known-errors-workspace.tsx:232-270`: persisted review time shown, but not auto computed new-count or backend startup.
- Fix: Expose backend start + lastViewedAt and compute first-query new since.
