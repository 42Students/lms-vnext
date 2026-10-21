# Work packet: edit src/app/api/placements/tpo/announcements/[noticeId]/lifecycle/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-027  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:198-208`
- vNext now: `src/app/api/placements/tpo/announcements/[noticeId]/lifecycle/route.ts:29-36`
- Fix: Legacy expired undo raises service-level error; vNext maps ANNOUNCEMENT_UNDO_EXPIRED to UNDO_WINDOW_EXPIRED 409 with retry UX.
