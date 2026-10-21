# Work packet (wave 2): edit src/modules/projects/mentor-team-meetings-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-20/project-meeting.md

## G2-20-017-039  [P3] GAP  facet F19  effort S
- Legacy: Legacy batch loading multiple workspace meetings avoids N+1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/ProjectMeetingRepository.java:19-22`
- vNext now: New mentor-team meetings paginated and filtered at DB `src/modules/projects/mentor-team-meetings-service.ts:40-82`
- Fix: Ensure dashboard aggregate uses batched query and list retains consistent ordering
