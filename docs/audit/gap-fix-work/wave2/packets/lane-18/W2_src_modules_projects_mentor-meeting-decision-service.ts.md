# Work packet (wave 2): edit src/modules/projects/mentor-meeting-decision-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-19-017-037  [P2] GAP  facet F15  effort M
- Legacy: Legacy actionType text in history row `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:26-27`
- vNext now: vNext event type PROJECTS_MEETING_DECIDED in generic activity stream `src/modules/projects/mentor-meeting-decision-service.ts:61-69`
- Fix: Map generic event type to granular source action and before/after changes.
