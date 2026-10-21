# Work packet: edit src/modules/projects/mentor-attention-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-7/u026-mentor-notifications.md

## G2-7-026-087  [P1] GAP  facet F22  effort L
- Legacy: notifications.js:287-340 project resolvedDelivery/meetingsList/status/updatedAt from projectService
- vNext now: mentor-attention-service.ts:43-92 projectSubmissions, projectMeetings, activityEvents, taskSubmissions
- Fix: Define field/status/timestamp crosswalk for review and meeting signal parity
