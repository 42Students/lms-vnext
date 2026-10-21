# Work packet: edit src/app/api/courses/quizzes/[quizId]/submit/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md

## G2-18-016-016  [P2] GAP  facet F08  effort S
- Legacy: QuizController.java:128-143 success returns 200 OK Response wrapper including attempt
- vNext now: src/app/api/courses/quizzes/[quizId]/submit/route.ts:37-40 201 {attempt}, and quiz-attempt-service.ts:413-419 hides score
- Fix: Show explicit saved attempt confirmation with attempt number; keep grades embargoed until release
