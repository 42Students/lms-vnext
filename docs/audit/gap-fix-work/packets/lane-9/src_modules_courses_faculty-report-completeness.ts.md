# Work packet: edit src/modules/courses/faculty-report-completeness.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-031  [P1] GAP  facet F06  effort M
- Legacy: Legacy incomplete PDF confirmation shown only on failed class roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:114-126`)
- vNext now: New confirmation if any student missing/ungraded or cohort size zero. (`src/modules/courses/faculty-report-completeness.ts:4-16`; `src/components/courses/faculty-report-download.tsx:49-57`)
- Fix: Separate data-integrity incomplete from legitimate in-progress ungraded roster.
