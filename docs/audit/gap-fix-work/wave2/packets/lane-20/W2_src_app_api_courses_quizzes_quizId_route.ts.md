# Work packet (wave 2): edit src/app/api/courses/quizzes/[quizId]/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md

## G2-17-025-009  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:99-103 — includeCorrectAnswers flag default false
- vNext now: src/app/api/courses/quizzes/[quizId]/route.ts:16-31 — GET takes deliveryId; no flag
- Fix: Map privileged answer key query contract
