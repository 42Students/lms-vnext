# Work packet: edit src/modules/courses/faculty-assessment-route-boundary.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md, docs/audit/gap2/lane-4/teacher-report-assignment-content-id.md

## G2-3-007-024  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:36-43`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:119-130`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:28-38`; `src/modules/courses/faculty-assessment-route-boundary.ts:5-23`
- Fix: Invalid legacy numeric route displays `Report not found.`; vNext returns generic Next notFound for invalid UUID/delivery. Provide same local state with return path.

## G2-4-013-032  [P2] GAP  facet F07  effort M
- Legacy: Invalid numeric id gives Report not found. without Retry; valid fetch error wraps server detail. (`docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:45-52`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:90-94`; `docs/legacy-source/frontend/src/components/Report/AssignmentReportContent.jsx:136-147`)
- vNext now: New invalid UUID 404, fetch error page Unable to load Assignment Report generic text. (`src/modules/courses/faculty-assessment-route-boundary.ts:4-15`; `src/app/(authenticated)/teacher/report/assignment/[contentId]/error.tsx:5-13`)
- Fix: Match text and retry differentiation without leaking private details.
