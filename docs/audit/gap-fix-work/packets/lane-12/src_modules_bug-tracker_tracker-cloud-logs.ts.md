# Work packet: edit src/modules/bug-tracker/tracker-cloud-logs.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-006  [P1] GAP  facet F04  effort M
- Legacy: Full GcpLogEntryResponse returned from detail `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:62-66`
- vNext now: New summary only id/time/event/message/path/requestId/component `src/modules/bug-tracker/tracker-cloud-logs.ts:67-76`
- Fix: Specify safe detail parity or documented privacy removal.
