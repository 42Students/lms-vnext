# Work packet (wave 2): edit src/modules/log-alerts/manual-ops.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-037  [P2] GAP  facet F20  effort M
- Legacy: Requested digest hours bounded between 1 and 336 `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:222-227`
- vNext now: New 24h digest summary fixed `src/modules/log-alerts/manual-ops.ts:18-35`
- Fix: Retain adjustable 1..336 hour query.

## G2-12-024-039  [P2] GAP  facet F21  effort M
- Legacy: Legacy LogDigestService + Telegram alert pipeline `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:41-42`
- vNext now: New scheduled lease and manual Telegram `src/modules/log-alerts/scheduler.ts:49-69`; `src/modules/log-alerts/manual-ops.ts:37-51`
- Fix: Trace scheduled jobs to ensure equivalent digest dispatch.
