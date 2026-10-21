# Work packet (wave 2): edit src/modules/placements/learner-placement-event-delivery.ts

5 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/job-application.md, docs/audit/gap2/lane-4/l12-u010-job-notification-helper.md

## G2-12-019-047  [P2] GAP  facet F15  effort S
- Legacy: Old application model has notification-linked assessmentUrl and offer letter sentAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/JobApplication.java:69-74,104-112`
- vNext now: New notice delivered from activity events and generic kind, no per-application assessment URL `src/modules/placements/learner-placement-event-delivery.ts:13-35` `src/db/schema/placements.ts:973-1020`
- Fix: Pass approved candidate-specific link and status transitions through notice payload.

## G2-12-010-002  [P2] GAP  facet F01  effort M
- Legacy: Legacy resolves notification college template context from job collegeId `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:89-91`
- vNext now: New derives target college from scoped membership and source event `src/modules/placements/learner-placement-event-delivery.ts:17-27`
- Fix: Map cross-organization job and learner college explicitly, including scoped college policies.

## G2-12-010-011  [P2] GAP  facet F05  effort M
- Legacy: Legacy async refetch joins learner/job associations by ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:57-61`
- vNext now: New transactional delivery joins membership/user/preferences for active recipient `src/modules/placements/learner-placement-event-delivery.ts:17-27`
- Fix: Retain up-to-date job/application detail lookup when generating status copy.

## G2-12-010-036  [P2] GAP  facet F19  effort M
- Legacy: Legacy per-record remote send deferred @Async to avoid holding DB transaction `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:47-62`
- vNext now: New in-transaction direct in-app writes batch recipients 250 at a time `src/modules/placements/learner-placement-event-delivery.ts:37-63`
- Fix: Measure large-list latency and split fanout into durable postcommit outbox if needed.

## G2-12-010-044  [P2] GAP  facet F22  effort M
- Legacy: Legacy recipient is learner-centric Integer ID `docs/legacy-source/backend/src/main/java/com/_42students/lms/util/JobNotificationHelper.java:126-134`
- vNext now: New recipient UUID membership/user and college context `src/modules/placements/learner-placement-event-delivery.ts:15-27`
- Fix: Audit mapping of learner IDs to active membership before dispatch.
