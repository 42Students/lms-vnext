# Work packet (wave 2): edit src/app/api/tracker/logs/known-errors/[signatureId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-12-024-032  [P2] GAP  facet F18  effort M
- Legacy: Exact invalid status wording 'status is required' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:173-183`
- vNext now: Standard INVALID_REQUEST on malformed PATCH `src/app/api/tracker/logs/known-errors/[signatureId]/route.ts:21-29`
- Fix: Align exact error wording or document changed UI copy.
