# Work packet: edit src/db/schema/placement-tpo-notice-audiences.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-19-023-055  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:27-29`
- vNext now: `src/db/schema/placement-tpo-notice-audiences.ts:23-35`
- Fix: Old studentID as numeric learner and direct receipt, new collegeMembershipId UUID recipient and user-based notification read.
