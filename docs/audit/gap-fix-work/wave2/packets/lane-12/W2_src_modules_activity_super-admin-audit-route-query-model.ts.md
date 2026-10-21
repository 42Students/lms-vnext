# Work packet (wave 2): edit src/modules/activity/super-admin-audit-route-query-model.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md

## G2-18-024-014  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:104-112 — actionKey, entityId, entityType exact-match filters.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:11-24 — eventType, subjectId and subjectType filters; schema/category taxonomy differs.
- Fix: Translate legacy action/entity keys to vNext event/subject filters.

## G2-18-024-017  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:116-121 — since and until inclusive DateTimeFormat ISO DATE_TIME.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:7-10,21-22 — from/to ISO offset or YYYY-MM-DD; timezone boundary conversions.
- Fix: Convert old local datetime query parameters consistently.

## G2-18-024-019  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:111-112,175-183 — category is a named string with validation, overrides several filters.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:11-24 — no category parameter, strict object rejects it.
- Fix: Support legacy category deep links or redirect to equivalent normalized filters.

## G2-18-024-020  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:123, S:132-136 — size capped500 even if requested >500, page clamped.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:11-24 and src/modules/activity/service.ts:98-104 — cursor/limit <=100, fixed page UI 50.
- Fix: Provide explicit size validation or clear migration message.
