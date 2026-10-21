# Work packet: edit src/modules/activity/super-admin-audit-route-query-model.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-9/superadmin-audit-hub.md, docs/audit/gap2/lane-9/superadmin-audit-logs.md

## G2-18-024-018  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-123 — actorUserId/organizationId/collegeId numeric, entityId string, size/page int.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:11-24 — UUID actor/college/subject IDs; no orgId query in Super Admin route schema.
- Fix: Translate numeric identifiers and org-scope filtering.

## G2-18-024-034  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/AdminAuditLogService.java:139-148 — category whitelist exact lowercase important/setup/people/teaching/projects.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:12-24 — module enum PLATFORM/IDENTITY/ACADEMICS/COURSES/PROJECTS/PLACEMENTS.
- Fix: Restore category mapping to equivalent event semantics.

## G2-9-026-020  [P1] GAP  facet F05  effort M
- Legacy: Super Admin org-only scope is supported without college `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditHub.js:4-35`
- vNext now: Query schema lacks organizationId; page context may still apply orgScope `src/modules/activity/super-admin-audit-route-query-model.ts:11-24`
- Fix: Document scope and pass org-only context correctly to read/export.

## G2-9-027-017  [P1] GAP  facet F05  effort M
- Legacy: Filters actionKey, actorUserId, orgId, collegeId, entityId, date range `docs/legacy-source/frontend/src/pages/superadmin/sections/AuditLogs.js:31-35,65-78`
- vNext now: New module,importance,collegeId,actor UUID,eventType,subjectType,id,actorName,q,dates `src/modules/activity/super-admin-audit-route-query-model.ts:11-24`
- Fix: Implement old raw actionKey/entity filter semantics and field mapping.

## G2-18-024-021  [P2] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:175-179 — invalid category 400 message Unknown activity category: X.
- vNext now: src/modules/activity/super-admin-audit-route-query-model.ts:33-37 and src/app/(authenticated)/admin/audit/page.tsx:15-20 — invalid filters rendered ErrorState, no same JSON message.
- Fix: Return legacy validation sentence where required.

## G2-9-026-026  [P2] GAP  facet F07  effort S
- Legacy: Legacy invalid category emits Unknown activity category: CATEGORY `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:105-124`
- vNext now: Unknown module/importance rejected generically as Invalid audit filters `src/modules/activity/super-admin-audit-route-query-model.ts:11-16`
- Fix: Provide explicit invalid filter and recovery text.
