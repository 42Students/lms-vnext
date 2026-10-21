# Work packet (wave 2): edit src/modules/announcements/tpo-notice-read-receipts-service.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-12-023-020  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:252-259`
- vNext now: `src/modules/announcements/tpo-notice-read-receipts-service.ts:26-41`
- Fix: Legacy unreadBy outputs name, roll and branch for each learner; vNext read receipt names-only display, no academic details.

## G2-12-023-036  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:74-95`
- vNext now: `src/modules/announcements/tpo-notice-read-receipts-service.ts:12-41`
- Fix: Legacy unreadBy reads placement_announcement_read per learner and from42 GET updates read table; vNext inAppNotifications.readAt and placement-cell receipt table.

## G2-12-023-048  [P2] GAP  facet F13  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:252-259`
- vNext now: `src/modules/announcements/tpo-notice-read-receipts-service.ts:21-25`
- Fix: Legacy unread-by for sent notice returns empty once everyone read; vNext may return notDelivered:true if delivery event absent, separate empty state.

## G2-19-023-027  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:282-301`
- vNext now: `src/modules/announcements/tpo-notice-read-receipts-service.ts:43-63`
- Fix: Old placement_announcement_read per learner/id, new inAppNotification readAt keyed event/user and only senderType TPO.

## G2-19-023-040  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/modules/announcements/tpo-notice-read-receipts-service.ts:43-63`
- Fix: Legacy read receipt directly stored in placement_announcement_read, new markOwnNotificationRead only after delivered event; delivery readiness matters.
