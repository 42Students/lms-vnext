# Work packet: edit src/app/api/tracker/logs/known-errors/[signatureId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l15-u018-log-alert-signature.md, docs/audit/gap2/lane-4/l12-u024-superadmin-logs-controller.md

## G2-15-018-029  [P1] GAP  facet F13  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V157__log_alerting.sql:6-16 — table exists after V157 migration on deployed legacy.
- vNext now: src/app/api/tracker/logs/known-errors/[signatureId]/route.ts:14-16 — returns 503 DB10_LOG_ALERTS_MIGRATIONS_PENDING when readiness off.
- Fix: Register migration and verify live runtime readiness.

## G2-12-024-013  [P2] GAP  facet F07  effort M
- Legacy: Missing environment says 'environment is required' `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminLogsController.java:103-106`
- vNext now: New returns INVALID_REQUEST for malformed PATCH `src/app/api/tracker/logs/known-errors/[signatureId]/route.ts:21-29`
- Fix: Expose precise user-facing validation field.
