# Work packet (wave 2): edit src/modules/courses/faculty-assessment-route-boundary.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-004  [P2] GAP  facet F01  effort M
- Legacy: Invalid positive numeric contentId shows Report not found; valid error has Retry. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:45-52`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:136-147`)
- vNext now: Invalid UUID or query goes to notFound() 404. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/page.tsx:28-37`; `src/modules/courses/faculty-assessment-route-boundary.ts:4-15`)
- Fix: Match recoverable invalid-route error presentation while keeping access secure.
