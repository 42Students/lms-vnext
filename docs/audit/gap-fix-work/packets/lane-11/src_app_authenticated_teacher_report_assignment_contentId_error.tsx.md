# Work packet: edit src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-4-013-012  [P1] GAP  facet F03  effort M
- Legacy: Partial roster warning yellow Alert Report is partially loaded, Retry roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- vNext now: No partial warning banner; failed roster API fails entire report render. (`src/modules/courses/faculty-assessment-report-service.ts:304-315`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx:5-13`)
- Fix: Render partial metrics/warning and Retry roster when submission data succeeded.

## G2-4-013-077  [P1] GAP  facet F18  effort M
- Legacy: Legacy roster warning Report is partially loaded and Retry roster. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:167-175`)
- vNext now: New full-page error no banner or retry roster. (`src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx:5-13`)
- Fix: Restore precise warning and retry copy.

## G2-4-013-032  [P2] GAP  facet F07  effort M
- Legacy: Invalid numeric id gives Report not found. without Retry; valid fetch error wraps server detail. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:45-52`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:90-94`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:136-147`)
- vNext now: New invalid UUID 404, fetch error page Unable to load Assignment Report generic text. (`src/modules/courses/faculty-assessment-route-boundary.ts:4-15`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx:5-13`)
- Fix: Match text and retry differentiation without leaking private details.
