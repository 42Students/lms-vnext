# Work packet (wave 3): edit src/app/(authenticated)/admin/placements/interviews/page.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-5/u007-superadmin-calendar.md

## G2-5-007-014  [P1] MISSING  facet F04 Data formatting  effort L
- Legacy: Job cell with company tag; Candidate learner name and department (docs/legacy-source/frontend/src/components/InterviewCalendar/InterviewCalendarContent.js:406-480)
- vNext now: Round list projects name/job/sequence only, no candidate/department (src/modules/admin-ui/super-admin-placement-interviews-service.ts:35-39; src/app/(authenticated)/admin/placements/interviews/page.tsx:9-11)
- Fix: Provide appointment per-candidate rows with department.
