# Work packet: edit src/app/(authenticated)/admin/announcements/page.tsx

11 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md, docs/audit/gap2/lane-14/u014-announcement-search-controller.md, docs/audit/gap2/lane-2/admin-notification-delivery-controller.md, docs/audit/gap2/lane-2/admin-recycle-bin-controller.md

## G2-10-002-010  [P1] GAP  facet F03  effort M
- Legacy: Feed has recipient reach progress bar percent and N of M placement cells read `docs/legacy-source/frontend/src/components/tpo/announcements/AnnouncementList.jsx:85-91`
- vNext now: Separate per-notice receipt list with N of 1 cell read and bell recipients read `src/app/(authenticated)/admin/announcements/page.tsx:181-192`
- Fix: Aggregate recipients for a whole broadcast and display old reach fraction on its card

## G2-10-002-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy read totals are distinct college IDs not individual faculty readers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: Counts include one college receipt and separately individual bell recipient reads `src/modules/announcements/super-admin-broadcast-receipts-service.ts:18-33` `src/app/(authenticated)/admin/announcements/page.tsx:183-190`
- Fix: Group per-college DB10 rows to one broadcast ID and count distinct college reads across audience

## G2-19-024-004  [P1] GAP  facet F03  effort L
- Legacy: Pinned icon/Updated tag, edit/delete actions, N of M cells read progress; superadmin/announcements.js:70-75; PlacementAnnouncementService.java:338-350
- vNext now: Generic announcement workspace and receipt row per college; admin/announcements/page.tsx:181-194; super-admin-broadcast-receipts-service.ts:18-35
- Fix: Render one original broadcast card with pinned, updated, exact reach and read counts plus direct row actions.

## G2-19-024-006  [P1] GAP  facet F04  effort L
- Legacy: Single broadcast result contains id, title, body, pinned, authorName=42, createdAt, updatedAt, audienceKind/Label, recipientCount, readCount, link and expiry; PlacementAnnouncementService.java:338-350
- vNext now: One announcement row per college and receipt counts individual college; super-admin-college-broadcast-service.ts:69-117; admin/announcements/page.tsx:92-113,181-192
- Fix: Introduce broadcastGroupId and aggregate metadata/receipts to one logical author-facing item, preserving original audience label.

## G2-14-014-004  [P1] GAP  facet F01  effort M
- Legacy: Only global SA with no college or org scope can use /search `docs/legacy-source/backend/src/main/java/com/_42students/lms/search/announcements/AnnouncementSearchController.java:45-53`
- vNext now: New SA page can list scoped college or organization under adminListScope `src/modules/announcements/service.ts:137-147` `src/app/(authenticated)/admin/announcements/page.tsx:33-80`
- Fix: Do not silently broaden global-only search; keep explicit selected scope and endpoint compatibility policy

## G2-2-019-001  [P1] MISSING  facet F01  effort M
- Legacy: AdminNotificationDeliveryController.java:22-37 backend-only operator endpoints; frontend AdminService.js:516-524 exports retry/cancel clients
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:126-180 has announcement admin workspace, not same notification-delivery route
- Fix: Add scoped notification delivery history/operator entry point and controls.

## G2-2-019-003  [P1] MISSING  facet F01  effort M
- Legacy: AdminNotificationDeliveryController.java:110-115 POST `/{id}/cancel-schedule?collegeId=`
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-109 computes visibility but no legacy cancel-schedule action
- Fix: Expose cancel-schedule POST and link from scheduled rows.

## G2-2-019-019  [P1] MISSING  facet F06  effort M
- Legacy: AdminNotificationDeliveryController.java:58-65,110-115 actions are POST with no request body
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:94-110 read-only projection of announcements
- Fix: Add POST actions, explicit action-specific confirmation and success handling.

## G2-2-023-003  [P1] MISSING  facet F01  effort M
- Legacy: AdminRecycleBinController.java:173-197 GET list by entityType/collegeId
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:65-69 lists announcement history only
- Fix: Add common deleted-list endpoint for every registered type.

## G2-2-023-022  [P2] MISSING  facet F07  effort M
- Legacy: AdminRecycleBinController.java:259-266 Type not found/Type is not deleted (404)
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:65-69 deleted toggle; restore response elsewhere
- Fix: Return entity-specific 404 for absent/not-deleted row.

## G2-2-023-025  [P3] GAP  facet F08  effort S
- Legacy: AdminRecycleBinController.java:170 GET types OK/OK Reason Phrase
- vNext now: src/app/(authenticated)/admin/announcements/page.tsx:65-69 scoped list loading
- Fix: If keeping old API, provide expected success envelope.
