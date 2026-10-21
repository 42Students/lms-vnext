# Work packet (wave 2): edit src/modules/courses/faculty-quiz-attempts-service.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-19/quiz-answer-entity.md

## G2-19-016-050  [P2] GAP  facet F21  effort M
- Legacy: Legacy report parses comma selected IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:1052-1059`
- vNext now: vNext reports JSON arrays and snapshots `src/modules/courses/quiz-attempt-service.ts:548-568` `src/modules/courses/faculty-quiz-attempts-service.ts:30-38`
- Fix: Update report DTOs/export and migrate ID array parsing.
