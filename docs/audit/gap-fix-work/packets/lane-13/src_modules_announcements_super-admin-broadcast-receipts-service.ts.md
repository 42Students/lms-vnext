# Work packet: edit src/modules/announcements/super-admin-broadcast-receipts-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-11/l19-u024-super-admin-announcement-controller.md

## G2-10-002-015  [P1] GAP  facet F04  effort L
- Legacy: Legacy read totals are distinct college IDs not individual faculty readers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349`
- vNext now: Counts include one college receipt and separately individual bell recipient reads `src/modules/announcements/super-admin-broadcast-receipts-service.ts:18-33` `src/app/(authenticated)/admin/announcements/page.tsx:183-190`
- Fix: Group per-college DB10 rows to one broadcast ID and count distinct college reads across audience

## G2-10-002-060  [P1] GAP  facet F15  effort M
- Legacy: Legacy allFrom42 has unread state per faculty and distinct college read count `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:320-349`
- vNext now: New explicit college first-read table and separate in-app per-user read receipts `src/modules/announcements/super-admin-broadcast-receipts-service.ts:18-33` `src/modules/announcements/placement-cell-receipt-service.ts:10-35`
- Fix: Expose same recipient read metric and mark-read semantics to author and recipient

## G2-19-024-004  [P1] GAP  facet F03  effort L
- Legacy: Pinned icon/Updated tag, edit/delete actions, N of M cells read progress; superadmin/announcements.js:70-75; PlacementAnnouncementService.java:338-350
- vNext now: Generic announcement workspace and receipt row per college; admin/announcements/page.tsx:181-194; super-admin-broadcast-receipts-service.ts:18-35
- Fix: Render one original broadcast card with pinned, updated, exact reach and read counts plus direct row actions.

## G2-19-024-007  [P1] GAP  facet F04  effort L
- Legacy: Read count DISTINCT college IDs where any faculty reads, not TPO user count; PlacementAnnouncementService.java:338-344
- vNext now: Counts delivered/read individual bell recipients and one cell read per notice; super-admin-broadcast-receipts-service.ts:13-35
- Fix: Compute N distinct colleges that first-read the broadcast across all grouped college notices.
