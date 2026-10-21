# Work packet (wave 2): edit src/modules/placements/hr-notifications-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/cross-notifications.md, docs/audit/gap2/lane-6/l12-u011-recruiter-notification-service.md

## G2-4-032-005  [P2] GAP  facet F02  effort M
- Legacy: Message events displayed by job/interview/course type (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:79-124`)
- vNext now: Recruiter inbox filters HR event subset by jobs (`src/modules/placements/hr-notifications-service.ts:8-49`)
- Fix: Ensure learner/faculty notification sections display every relevant legacy event.

## G2-4-032-017  [P2] GAP  facet F05  effort M
- Legacy: Legacy JOB vs COURSE notification filters (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:150-177`)
- vNext now: HR read filters placement_job events, own job IDs (`src/modules/placements/hr-notifications-service.ts:25-45`)
- Fix: Keep module/type tabs distinct across recipient roles.

## G2-4-032-060  [P2] GAP  facet F18  effort M
- Legacy: Interview Round Scheduled, Interview reminder/confirmed titles (`docs/legacy-source/backend/src/main/java/com/_42students/lms/util/NotificationEventRegistry.java:89-109`)
- vNext now: HR inbox uses fixed projection, not learner-specific event strings (`src/modules/placements/hr-notifications-service.ts:47-49`)
- Fix: Restore learner-specific interview titles and include round name.

## G2-12-011-039  [P2] GAP  facet F19  effort M
- Legacy: Feed at most40 notifications after sorting by time (RecruiterNotificationService.java:136-137).
- vNext now: Bell shows 10 of paginated list, ordered activity/notification createdAt DESC (bell-service.ts:10-19; hr-notifications-service.ts:38-45).
- Fix: Increase visible depth; sort by actual event time not receipt timestamp where different.
