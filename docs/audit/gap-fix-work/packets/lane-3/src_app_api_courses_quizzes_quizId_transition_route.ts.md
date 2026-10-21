# Work packet: edit src/app/api/courses/quizzes/[quizId]/transition/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md, docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-17-025-002  [P1] GAP  facet F01  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:73-96 — PATCH unpublish, publish-grades and unpublish-grades
- vNext now: src/app/api/courses/quizzes/[quizId]/transition/route.ts:15-37 — transition action and separate results POST
- Fix: Preserve independent reversibility semantics

## G2-3-001-048  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:15-20`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:27-36`
- vNext now: `src/app/api/courses/quizzes/[quizId]/route.ts:37-63`; `src/app/api/courses/quizzes/[quizId]/transition/route.ts:15-40`; `src/app/api/courses/quizzes/[quizId]/results/route.ts:15-40`
- Fix: Map PUT/update, PATCH publish, PATCH results, DELETE to vNext PATCH/POST transition/POST results; check method/payload/status semantics.

## G2-3-001-050  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:340-347`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:78-82`
- vNext now: `src/components/courses/college-quiz-actions.tsx:60-78`; `src/app/api/courses/quizzes/[quizId]/transition/route.ts:15-39`
- Fix: Clarify delete semantics: legacy DELETE, vNext ARCHIVE transition with retained rows/history; align user expectation and retention.
