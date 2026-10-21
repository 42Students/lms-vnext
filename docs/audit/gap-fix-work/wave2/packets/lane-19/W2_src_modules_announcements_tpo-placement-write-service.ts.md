# Work packet (wave 2): edit src/modules/announcements/tpo-placement-write-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-022  [P2] GAP  facet F06  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:129-139`
- vNext now: `src/modules/announcements/tpo-placement-write-service.ts:29-37`
- Fix: Legacy audience validation resolves specific college/drive and refuses empty; vNext grouped target IDs max50 and UUID scoped DB checks, COLLEGE exempt from targeted storage.
