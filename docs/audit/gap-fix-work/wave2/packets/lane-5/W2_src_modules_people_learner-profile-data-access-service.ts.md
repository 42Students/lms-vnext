# Work packet (wave 2): edit src/modules/people/learner-profile-data-access-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/learner-placement-profile-controller.md

## G2-1-009-021  [P2] GAP  facet F05  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:46-55`: data-access list order by sl.created_at DESC, no LIMIT.
- vNext now: `src/modules/people/learner-profile-data-access-service.ts:18-22`: events sorted occurredAt DESC/id DESC, LIMIT 20.
- Fix: Offer paginated share records in descending sharedAt order, separate from 20 activity events.

## G2-1-009-042  [P2] GAP  facet F15  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: reports prior share links and download events; GET sends no email.
- vNext now: `src/modules/people/learner-profile-data-access-service.ts:12-22`: activity event read, no email emission.
- Fix: Display existing share notifications/events without sending additional notifications on read.

## G2-1-009-048  [P2] GAP  facet F19  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/tpo/LearnerPlacementProfileService.java:44-55`: potentially unbounded share history query, correlated MIN download event.
- vNext now: `src/modules/people/learner-profile-data-access-service.ts:22`: 20 newest activity rows, indexed event-based data.
- Fix: Use paginated share query with batched/aggregated download index and stable sort.
