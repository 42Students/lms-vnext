# Work packet: edit src/app/api/announcements/[announcementId]/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-10-002-045  [P1] GAP  facet F10  effort L
- Legacy: Legacy edit PUT /api/v1/superadmin/announcements/id updates one logical broadcast `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:46-50` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:391-399`
- vNext now: New PATCH /api/announcements/id changes one college announcement using expectedVersion `src/app/api/announcements/[announcementId]/route.ts:14-31` `src/components/announcements/announcement-admin-workspace.tsx:175-203`
- Fix: Expose broadcast-wide edit transaction instead of mutating a single recipient clone

## G2-10-002-046  [P1] GAP  facet F10  effort L
- Legacy: Legacy delete DELETE /api/v1/superadmin/announcements/id removes single logical broadcast `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/SuperAdminAnnouncementController.java:52-55` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:401-404`
- vNext now: New DELETE /api/announcements/id removes one row only `src/app/api/announcements/[announcementId]/route.ts:35-50` `src/components/announcements/announcement-admin-workspace.tsx:138-157`
- Fix: Create group-scoped deletion that withdraws all college copies and notifications consistently

## G2-19-024-044  [P1] GAP  facet F20  effort L
- Legacy: Legacy delete idempotent soft delete by broadcast id; PlacementAnnouncementService.java:401-404
- vNext now: Generic row-level CAS version and restore, no broadcast group identity; announcements/[announcementId]/route.ts:35-50
- Fix: Make group write CAS and idempotent including repeated DELETE and concurrent edits.
