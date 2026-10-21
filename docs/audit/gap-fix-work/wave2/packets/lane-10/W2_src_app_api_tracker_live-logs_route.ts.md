# Work packet (wave 2): edit src/app/api/tracker/live-logs/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-001  [P2] GAP  facet F01  effort M
- Legacy: Legacy /api/v1/superadmin/logs base `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:32-34`
- vNext now: New /api/tracker/live-logs and /api/tracker/logs/known-errors `src/app/api/tracker/live-logs/route.ts:7-21`; `src/app/api/tracker/logs/known-errors/route.ts:9-22`
- Fix: Migrate route callers or provide adapters.

## G2-12-024-024  [P2] MISSING  facet F12  effort M
- Legacy: Legacy deploy health compares ten minutes before/after `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/GcpCloudLoggingService.java:208-232`
- vNext now: New no deploy health in mapped live route `src/app/api/tracker/live-logs/route.ts:7-23`
- Fix: Implement same threshold/logic.

## G2-12-024-026  [P2] GAP  facet F13  effort M
- Legacy: Cloud Logging may fail query `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/GcpCloudLoggingService.java:114-139`
- vNext now: New maps errors to 503 'Live logs could not be loaded. Try again.' `src/app/api/tracker/live-logs/route.ts:19-24`
- Fix: Expose actionable safe error categories.
