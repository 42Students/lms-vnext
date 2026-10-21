# Work packet (wave 2): edit src/app/api/courses/quiz-attempts/route.ts

1 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md

## G2-18-016-002  [P2] GAP  facet F01  effort S
- Legacy: QuizController.java:145-147 manager submissions only needs quiz ID
- vNext now: src/app/api/courses/quiz-attempts/route.ts:19-27 requires deliveryId
- Fix: Supply Section picker and preserve authorization when following bookmarked quiz report links
