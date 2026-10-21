# Work packet (wave 2): edit src/modules/announcements/tpo-placement-notice-lifecycle.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-040  [P2] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:61-72`
- vNext now: `src/modules/announcements/tpo-placement-notice-lifecycle.ts:22-47`
- Fix: Legacy own-college delete/undo service may permit any TPO; vNext any same-college TPO colleague can mutate, not strictly author, verify intended ACL.

## G2-12-023-065  [P2] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:198-208`
- vNext now: `src/modules/announcements/tpo-placement-notice-lifecycle.ts:46-60`
- Fix: Legacy undo checks sendAt age and outbox group, vNext uses createdAt age and CAS. A scheduled notice with old create time may not have equivalent undo window.
