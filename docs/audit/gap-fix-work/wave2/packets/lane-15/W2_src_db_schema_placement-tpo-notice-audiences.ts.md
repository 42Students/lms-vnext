# Work packet (wave 2): edit src/db/schema/placement-tpo-notice-audiences.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/l12-u023-tpo-announcement-controller.md

## G2-12-023-013  [P2] GAP  facet F04  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:55-61`
- vNext now: `src/db/schema/placement-tpo-notice-audiences.ts:7-35`
- Fix: Legacy batchIds numeric, branches strings, jobId numeric and stage APPLIED/ACTIVE; vNext UUID cohort/department/job audience references and frozen membership recipients.

## G2-12-023-070  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/PlacementAnnouncementService.java:252-259`
- vNext now: `src/db/schema/placement-tpo-notice-audiences.ts:7-35`
- Fix: Legacy per-learner read/recipient rows vs UUID frozen targeted membership set plus inAppNotifications read receipts; map delivery state and no retroactive audience broadening.
