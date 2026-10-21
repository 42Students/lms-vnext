# Work packet: edit src/modules/log-alerts/manual-ops.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-021  [P1] GAP  facet F10  effort M
- Legacy: Digest requested hours clamped 1..336, send endpoint `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:222-235`
- vNext now: Manual digest uses last100 signatures with 24h new count `src/modules/log-alerts/manual-ops.ts:18-35`
- Fix: Add hour-scoped digest and exact evidence window.
