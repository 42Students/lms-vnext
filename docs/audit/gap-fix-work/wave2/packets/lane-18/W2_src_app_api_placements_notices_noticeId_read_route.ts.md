# Work packet (wave 2): edit src/app/api/placements/notices/[noticeId]/read/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-19-023-053  [P2] GAP  facet F21  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:23-31`
- vNext now: `src/app/api/placements/notices/[noticeId]/read/route.ts:7-12`
- Fix: Legacy GET mutating endpoint vs Next same-origin POST with CSRF-origin guard.
