# Work packet: edit src/app/api/activity/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/l18-u024-superadmin-audit-controller.md

## G2-18-024-025  [P2] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAuditController.java:184-196 — search success returns 200 with items/page/size/total/actorNames/targetNames.
- vNext now: src/app/api/activity/route.ts:87-98 — 200 items/groups/remainingCount/nextCursor.
- Fix: Provide compatibility envelope for legacy API clients.
