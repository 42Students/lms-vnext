# Work packet: edit src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts

2 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-3/learner-quiz.md

## G2-18-016-001  [P1] MISSING  facet F01  effort M
- Legacy: QuizController.java:123-153 has get-for-attempt, submit, manager submissions, global optional-filter learner my-submissions
- vNext now: src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts:14-29 requires quiz and delivery ID
- Fix: Build authenticated all-quiz learner attempt-history index/route; map old links safely rather than accepting numeric IDs

## G2-3-003-033  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/api/Services/quizServices.js:11-20`; `docs/legacy-source/frontend/src/api/Services/quizServices.js:39-52`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:131-151`; `src/app/api/courses/quizzes/[quizId]/my-attempts/route.ts:14-32`
- Fix: Legacy `/api/v1/quizzes/:id/attempt`, `/my-submissions`; vNext uses scoped GET quiz and own attempts with mandatory deliveryId; repair bookmarked old `/quiz?quizId=` lacking deliveryId via scope resolve.
