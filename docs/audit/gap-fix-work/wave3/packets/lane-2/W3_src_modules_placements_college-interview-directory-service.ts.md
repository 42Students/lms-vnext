# Work packet (wave 3): edit src/modules/placements/college-interview-directory-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u002-college-admin-calendar.md

## G2-5-002-072  [P1] MISSING  facet F23 Extras/dropped  effort L
- Legacy: Shows historical confirmed, reschedule, cancelled and no-show appointment states. (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:96-103; docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:254-262)
- vNext now: Only BOOKED slot source, confirmed/cancelled may be excluded. (src/modules/placements/college-interview-directory-service.ts:34-37; src/modules/placements/college-interview-directory-service.ts:49-57)
- Fix: Include historical appointment records and full state lifecycle.
