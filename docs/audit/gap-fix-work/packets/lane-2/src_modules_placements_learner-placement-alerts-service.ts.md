# Work packet: edit src/modules/placements/learner-placement-alerts-service.ts

7 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-13/learner-announcements.md, docs/audit/gap2/lane-3/l19-u023-learner-announcement-controller.md

## G2-13-006-036  [P1] GAP  facet F10  effort L
- Legacy: GET learner/placement/overview contains placement notices array (`docs/legacy-source/frontend/src/api/Services/TpoHubService.js:169-170`)
- vNext now: New getOwnLearnerPlacementAlerts joins activity_events/in_app_notifications (`src/modules/placements/learner-placement-alerts-service.ts:24-40`)
- Fix: Crosswalk old event categories, source, status and read semantics.

## G2-13-006-042  [P1] GAP  facet F12  effort M
- Legacy: Legacy filters updates excluding PLACEMENT_ANNOUNCEMENT event to prevent duplicate (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:38-40`)
- vNext now: New personal alerts filter activityEvents.module PLACEMENTS, no per-event exclusion (`src/modules/placements/learner-placement-alerts-service.ts:33-39`)
- Fix: Deduplicate official announcement events against announcement list; avoid repeated bell content.

## G2-13-006-054  [P1] GAP  facet F15  effort L
- Legacy: Old updates represent offer, round, application, request notifications (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:11-14`)
- vNext now: New activityEvents PLACEMENTS only personal notifications (`src/modules/placements/learner-placement-alerts-service.ts:31-40`)
- Fix: Verify each legacy event producer still emits in_app_notifications.

## G2-13-006-072  [P1] GAP  facet F22  effort L
- Legacy: Old placement overview notices have event field and link (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:38-39`)
- vNext now: New inAppNotifications joins activityEvents.module PLACEMENTS and actionHref (`src/modules/placements/learner-placement-alerts-service.ts:24-39`)
- Fix: Map old event taxonomy and de-duplicate announcement cases.

## G2-13-006-076  [P1] GAP  facet F23  effort M
- Legacy: Legacy sees announcements just once under this page rather than in overview list (`docs/legacy-source/frontend/src/pages/learn/my-placements/announcements.js:11-14`)
- vNext now: New can include activity notifications alongside list if event producer duplicates (`src/modules/placements/learner-placement-alerts-service.ts:31-40`)
- Fix: Enforce cross-section de-duplication by event/source key.

## G2-19-023-026  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- vNext now: `src/modules/placements/learner-placement-alerts-service.ts:44-59`
- Fix: Legacy /unread counts unread placement announcements; vNext personal alert unread count from in_app_notifications separate event types.

## G2-19-023-058  [P1] MISSING  facet F23  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/tpo/LearnerAnnouncementController.java:33-39`
- vNext now: `src/modules/placements/learner-placement-alerts-service.ts:44-59`
- Fix: No exact `/unread` count for unread college placement announcements; personal alert unread is not equivalent.
