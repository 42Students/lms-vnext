# Work packet: edit src/app/api/courses/quizzes/[quizId]/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-3-001-048  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:15-20`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:27-36`
- vNext now: `src/app/api/courses/quizzes/[quizId]/route.ts:37-63`; `src/app/api/courses/quizzes/[quizId]/transition/route.ts:15-40`; `src/app/api/courses/quizzes/[quizId]/results/route.ts:15-40`
- Fix: Map PUT/update, PATCH publish, PATCH results, DELETE to vNext PATCH/POST transition/POST results; check method/payload/status semantics.

## G2-3-001-081  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:381-401`
- vNext now: `src/components/courses/college-quiz-actions.tsx:30-41`; `src/app/api/courses/quizzes/[quizId]/route.ts:16-35`
- Fix: On failed attempt-count precheck, allow only metadata correction and show exact warning; vNext fetches metadata without attempt-count precheck.
