# Work packet (wave 2): edit src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-056  [P2] GAP  facet F13  effort S
- Legacy: Legacy failed report renders Empty with error text and Retry (unless invalid id). (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:136-150`)
- vNext now: New error page uses PageHeader Unable to load Assignment Report, Retry report and Back link. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx:5-13`)
- Fix: Align empty/error presentation and Retry button wording.
