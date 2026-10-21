# Work packet (wave 2): edit src/modules/announcements/tpo-notice-reminder-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-041  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:79-82`
- vNext now: `src/modules/announcements/tpo-notice-reminder-service.ts:12-28`
- Fix: Legacy remind scoped college notice; vNext additionally requires notice.senderUserId equals current TPO user, narrowing colleague reminder.

## G2-12-023-063  [P2] GAP  facet F19  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:263-277`
- vNext now: `src/modules/announcements/tpo-notice-reminder-service.ts:49-69`
- Fix: Legacy reminder sends to all unread selected learners via outbox, vNext caps 1000 and returns too-many error.
