# Work packet: edit src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx

4 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-quiz-report.md

## G2-3-007-001  [P1] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/report/quiz/[quizId].js:1-6`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:20-27`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:21-30`
- Fix: Legacy direct link numeric quizId works alone; vNext requires UUID quizId plus optional deliveryId. Resolve or deliberately deprecate old numeric bookmarks with explicit redirect/not found.

## G2-3-007-026  [P1] GAP  facet F07  effort L
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:59-67`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:148-157`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:28-38`; `src/modules/courses/faculty-assessment-report-service.ts:212-228`
- Fix: Legacy roster API failure falls back to partial data with warning+Retry roster, vNext Promise.all rejects entire report; restore partial-data degrade for roster-only failure.

## G2-3-007-024  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:36-43`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:119-130`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:28-38`; `src/modules/courses/faculty-assessment-route-boundary.ts:5-23`
- Fix: Invalid legacy numeric route displays `Report not found.`; vNext returns generic Next notFound for invalid UUID/delivery. Provide same local state with return path.

## G2-3-007-025  [P2] GAP  facet F07  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:73-80`; `docs/legacy-source/frontend/src/components/Report/QuizReportContent.jsx:119-129`
- vNext now: `src/app/(authenticated)/teacher/report/quiz/[quizId]/page.tsx:33-38`
- Fix: Legacy data error shows `Couldn't load this quiz's report. Please try again.` and Retry; new server throws generic route boundary, verify matches exact wording.
