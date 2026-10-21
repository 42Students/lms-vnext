# Work packet (wave 2): edit src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-3/learner-quiz.md

## G2-3-003-036  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:43-48`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:145-153`
- vNext now: `src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts:14-32`; `src/components/courses/learner-quiz-attempt.tsx:131-151`
- Fix: Legacy fetch own submission history with quizId only, new requires deliveryId; ensure old review URLs resolve correct current delivery rather than hard failure.
