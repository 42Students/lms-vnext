# Work packet: edit src/app/api/tracker/logs/known-errors/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-040  [P1] GAP  facet F22  effort M
- Legacy: Legacy service persists known errors, viewed marker `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:37-42`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:68-84`
- vNext now: New DB10 known errors disabled unless ready flag `src/app/api/tracker/logs/known-errors/route.ts:9-12`
- Fix: Promote DB10 migrations and validate live persistence.
