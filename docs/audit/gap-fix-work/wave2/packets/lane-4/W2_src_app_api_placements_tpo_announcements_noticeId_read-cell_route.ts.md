# Work packet (wave 2): edit src/app/api/placements/tpo/announcements/[noticeId]/read-cell/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-057  [P2] GAP  facet F17  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/TpoAnnouncementController.java:84-90`
- vNext now: `src/app/api/placements/tpo/announcements/[noticeId]/read-cell/route.ts:6-11`
- Fix: Legacy From 42 auto-read via GET on page open; vNext explicit POST Acknowledge read cell, better mutation hygiene but different keyboard/user action.
