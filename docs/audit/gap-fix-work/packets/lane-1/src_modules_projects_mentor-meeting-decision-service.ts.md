# Work packet: edit src/modules/projects/mentor-meeting-decision-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/project-meeting-history-entity.md

## G2-19-017-025  [P1] GAP  facet F10  effort L
- Legacy: Legacy history row stores projectId/meetingId/key/action/actor/before/after fields `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/ProjectMeetingHistory.java:17-51`
- vNext now: vNext mentor meeting decision updates projectMeetings then records generic activity event `src/modules/projects/mentor-meeting-decision-service.ts:38-70`
- Fix: Write typed immutable before+after revision in same transaction as meeting mutation.
