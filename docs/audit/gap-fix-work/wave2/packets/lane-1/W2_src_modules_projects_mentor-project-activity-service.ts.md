# Work packet (wave 2): edit src/modules/projects/mentor-project-activity-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u018-project-activity-event.md

## G2-5-018-006  [P2] GAP  facet F03  effort M
- Legacy: Legacy shows human-readable eventType separate machine eventCode `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:24-32`
- vNext now: New eventType is machine taxonomy and mentor derives safe label `src/modules/projects/mentor-project-activity-service.ts:66-85`
- Fix: Separate machine event code from human label consistently.

## G2-5-018-038  [P2] GAP  facet F18  effort M
- Legacy: Legacy text labels derive title,eventType,actorName (+source tab) `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectActivityEvent.java:28-46`
- vNext now: New mentor safe label derived from eventType, strips actor/metadata `src/modules/projects/mentor-project-activity-service.ts:12-17,77-85`
- Fix: Review wording catalogue for every event code, preserve safe human labels.
