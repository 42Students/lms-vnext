# Work packet (wave 2): edit src/modules/projects/mentor-meeting-reschedule-service.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-025  [P2] GAP  facet F10  effort S
- Legacy: Legacy @Version optimistic lock Long version `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:163-176`
- vNext now: New CAS uses updatedAt milliseconds expectedUpdatedAt `src/modules/projects/mentor-meeting-reschedule-service.ts:32-33,47-50,68-74`
- Fix: Map version errors to stale edit state and ensure millisecond equality on all mutations

## G2-20-017-035  [P2] GAP  facet F15  effort S
- Legacy: Legacy calendar sync status documents async invite workflow, though auto-sync removed `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:140-154`
- vNext now: New reschedule sends in-app project member notifications, no external calendar dispatch `src/modules/projects/mentor-meeting-reschedule-service.ts:75-97`
- Fix: Do not promise calendar invitations; distinguish member notification from email/calendar invite

## G2-20-017-040  [P2] GAP  facet F20  effort S
- Legacy: Legacy @Version null on fresh entity required for JPA inserts `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeeting.java:163-176`
- vNext now: New updatedAt used as optimistic token `src/modules/projects/mentor-meeting-reschedule-service.ts:47-50,68-74`
- Fix: Test milliseconds/clock skew and replays, do not use DB-timestamp precision mismatch
