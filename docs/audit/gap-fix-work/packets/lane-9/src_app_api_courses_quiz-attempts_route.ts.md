# Work packet: edit src/app/api/courses/quiz-attempts/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-3-001-049  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:47-48`; `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:29-41`
- vNext now: `src/app/api/courses/quiz-attempts/route.ts:10-30`; `src/components/courses/college-quiz-attempts.tsx:25-48`
- Fix: Legacy unpaged college submissions vs new section-specific paged attempts (25/page): ensure all eligible section attempts are accessible.
