# Work packet: edit src/modules/placements/request-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/learner-placement-schedule.md

## G2-19-004-084  [P1] GAP  facet F22  effort L
- Legacy: Legacy reschedule request stores free-text preferredTimes and statuses `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:21-23` `docs/legacy-source/frontend/src/components/Placements/student/ScheduleCard.jsx:43-47`
- vNext now: vNext request requires structured scheduledAt, mode, venue/meetingUrl `src/components/placements/learner-schedule-reschedule.tsx:20-28` `src/modules/placements/request-service.ts:393-406`
- Fix: Migrate historic preferredTimes/reply payload and render pending/decided states.
