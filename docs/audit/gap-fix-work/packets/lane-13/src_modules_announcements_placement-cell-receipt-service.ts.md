# Work packet: edit src/modules/announcements/placement-cell-receipt-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-10/superadmin-announcements.md, docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-10-002-053  [P1] GAP  facet F12  effort M
- Legacy: Legacy read counted when any faculty in a target college marks viewed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:338-349` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:408-417`
- vNext now: New separate explicit college receipt only from active TPO membership on visible notice `src/modules/announcements/placement-cell-receipt-service.ts:12-35`
- Fix: Align college-read definition and explicitly distinguish first reader from per-user bell receipts

## G2-10-002-060  [P1] GAP  facet F15  effort M
- Legacy: Legacy allFrom42 has unread state per faculty and distinct college read count `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:320-349`
- vNext now: New explicit college first-read table and separate in-app per-user read receipts `src/modules/announcements/super-admin-broadcast-receipts-service.ts:18-33` `src/modules/announcements/placement-cell-receipt-service.ts:10-35`
- Fix: Expose same recipient read metric and mark-read semantics to author and recipient

## G2-12-023-016  [P1] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:321-337`
- vNext now: `src/modules/announcements/placement-cell-receipt-service.ts:10-35`
- Fix: Legacy From 42 receipt per faculty reader, vNext one receipt per college(first TPO opener) and unread count per college, not per person.

## G2-12-023-072  [P1] GAP  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:84-96`
- vNext now: `src/modules/announcements/placement-cell-receipt-service.ts:10-35`
- Fix: Automatic From42 per-user mark-as-read on GET replaced by deliberate per-college acknowledgment POST, owner decision on per-person versus cell-wide receipts.
