# Work packet (wave 2): edit src/app/(authenticated)/teacher/allQuizzes/page.tsx

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/faculty-all-quizzes.md

## G2-3-006-001  [P2] GAP  facet F01  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/teacher/allQuizzes.js:1-6`; `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:269-310`
- vNext now: `src/app/(authenticated)/teacher/allQuizzes/page.tsx:15-22`
- Fix: Legacy My Quizzes page uses white PageShell with ListingPageHeader and metric pills; vNext uses PageHeader with report link, different nesting and header hierarchy.

## G2-3-006-003  [P2] GAP  facet F01  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:300-310`
- vNext now: `src/app/(authenticated)/teacher/allQuizzes/page.tsx:17-21`
- Fix: Legacy top-right Create Quiz primary icon button, vNext top-right Assessment results overview; move report to row actions and prioritize Create Quiz.

## G2-3-006-050  [P2] GAP  facet F18  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:269-304`
- vNext now: `src/app/(authenticated)/teacher/allQuizzes/page.tsx:17-20`; `src/components/courses/faculty-assessment-overview.tsx:85-91`
- Fix: Legacy My Quizzes with metrics total Quizzes and Courses as header pills; vNext standalone Badge totals/courses and different Assessment results overview CTA.
