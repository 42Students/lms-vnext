# Work packet: edit src/modules/courses/learner-quiz-result-release-policy.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md

## G2-18-016-024  [P1] GAP  facet F12  effort M
- Legacy: QuizServiceImpl.java:275-295 allows grades after due and published quiz
- vNext now: src/modules/courses/learner-quiz-result-release-policy.ts:6-16 additionally requires CLOSED
- Fix: Verify CLOSE + release workflow reachable; describe result-visibility timing deliberately
