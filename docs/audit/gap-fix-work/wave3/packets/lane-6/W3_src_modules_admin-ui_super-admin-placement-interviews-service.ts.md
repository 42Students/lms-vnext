# Work packet (wave 3): edit src/modules/admin-ui/super-admin-placement-interviews-service.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-015  [P1] MISSING  facet F04 Data formatting  effort L
- Legacy: Interviewer name, mode, venue in table (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:564-605)
- vNext now: Round projection has mode only, no interviewer/venue (src/modules/admin-ui/super-admin-placement-interviews-service.ts:13-19; src/modules/admin-ui/super-admin-placement-interviews-service.ts:35-39)
- Fix: Expose scoped interviewer and venue for individual interview records.

## G2-5-007-017  [P1] MISSING  facet F04 Data formatting  effort L
- Legacy: Conflict kinds candidate/interviewer/both (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:224-230)
- vNext now: No visible appointment conflicts in round list/calendar summary (src/components/placements/placement-calendar-workspace.tsx:635-664; src/modules/admin-ui/super-admin-placement-interviews-service.ts:12-39)
- Fix: Compute full unfiltered per-candidate and interviewer overlapping appointments.
