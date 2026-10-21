# Work packet: edit src/modules/admin-ui/super-admin-placement-interviews-service.ts

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-019  [P1] GAP  facet F05 Tables/lists  effort L
- Legacy: 8 table columns Job,Candidate,Type,Status,Date & Time,Interviewer,Mode,Actions (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-649)
- vNext now: Generic admin directory compact round items, not 8-column appointment table (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11; src/modules/admin-ui/super-admin-placement-interviews-service.ts:35-39)
- Fix: Implement required 8 column interview table with row actions.

## G2-5-007-023  [P1] GAP  facet F06 Forms  effort M
- Legacy: Search... inside Job column, matches job/company/student (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:409-422)
- vNext now: Generic query searches round name/job only (src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11; src/modules/admin-ui/super-admin-placement-interviews-service.ts:23-27)
- Fix: Include candidate/company text in scoped appointment search.

## G2-5-007-044  [P1] GAP  facet F12 Business rules  effort L
- Legacy: ACTIVE includes SCHEDULED/CONFIRMED/RESCHEDULE_REQUESTED (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:254-272)
- vNext now: Round status enum PENDING/SCHEDULED/COMPLETED/CANCELLED (src/app/(authenticated)/admin/placements/interviews/page.tsx:4; src/modules/admin-ui/super-admin-placement-interviews-service.ts:16-24)
- Fix: Restore full appointment lifecycle.

## G2-5-007-069  [P1] GAP  facet F22 Data/migrations  effort L
- Legacy: Supports CONFIRMED/RESCHEDULE_REQUESTED/NO_SHOW (docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Interview.java:49-54)
- vNext now: Round statuses cannot represent those (src/app/(authenticated)/admin/placements/interviews/page.tsx:4; src/modules/admin-ui/super-admin-placement-interviews-service.ts:24)
- Fix: Persist and show old status transitions.
