# Work packet: edit src/app/api/courses/quizzes/route.ts

3 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/college-admin-quizzes.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-1/l17-u025-quiz-controller.md

## G2-3-001-047  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:7-8`; `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:243-272`
- vNext now: `src/components/courses/college-quiz-create.tsx:74-95`; `src/app/api/courses/quizzes/route.ts:32-56`
- Fix: Support legacy create `publish=true` server-side or explicitly document intentional two-step publish rollout.

## G2-3-005-035  [P1] GAP  facet F10  effort L
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:3-36`
- vNext now: `src/app/api/courses/quizzes/route.ts:12-56`
- Fix: Legacy create can publish immediately; new create is draft + separate transition, alters workflow and UI notifications.

## G2-17-025-017  [P3] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:163-164 — 200 Response(OK, OK, data) for all methods
- vNext now: src/app/api/courses/quizzes/route.ts:49-51 — 201 {quiz} create; other {quiz}
- Fix: Publish status/envelope migration
