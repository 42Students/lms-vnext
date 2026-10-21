# Work packet (wave 2): edit src/app/api/activity/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md, docs/audit/gap2/lane-8/cross-08-audit-activity-tracker-analytics.md

## G2-18-024-001  [P2] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:16-19 — GET /api/v1/superadmin/audit, also admin-of-college.
- vNext now: src/app/api/activity/route.ts:18-103 — GET /api/activity; admin /admin/audit page delegates /activity.
- Fix: Add route compatibility and preserve public audit link.

## G2-18-024-055  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:184-196 — response exposes actorNames/targetNames maps.
- vNext now: src/app/api/activity/route.ts:87-98 — vNext uses groups and nextCursor, lacks those maps.
- Fix: Restore legacy identity/target enrichment in compatibility response.

## G2-8-031-036  [P2] GAP  facet F10  effort L
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:103-123 GET /api/v1/superadmin/audit with page,size, actionKey, actor/scope and dates.
- vNext now: src/app/api/activity/route.ts:18-98 GET /api/activity with module,importance,eventType, cursor; src/modules/activity/service.ts:504-675 queries activity_events.
- Fix: Map filters/endpoints and response contract including actorNames/targetNames and total for compatibility.
