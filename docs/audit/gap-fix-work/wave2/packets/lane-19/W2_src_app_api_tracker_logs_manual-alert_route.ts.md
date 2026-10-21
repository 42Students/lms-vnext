# Work packet (wave 2): edit src/app/api/tracker/logs/manual-alert/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-029  [P2] GAP  facet F15  effort M
- Legacy: Test and digest send Telegram via backend `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:86-92`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:230-235`
- vNext now: New manual TEST/DIGEST includes 10min throttle `src/app/api/tracker/logs/manual-alert/route.ts:9-31`
- Fix: Align alert cadence and false failure state.
