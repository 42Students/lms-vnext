# Work packet: edit src/modules/courses/quiz-service.ts

6 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md

## G2-17-025-018  [P1] GAP  facet F08  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:240-250 — unpublish PUBLISHED back to DRAFT when safe
- vNext now: src/modules/courses/quiz-service.ts:665-743 — no unpublish transition
- Fix: Provide reversible-before-attempt draft reset

## G2-17-025-025  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:243-249 — no unpublish after attempts or deadline
- vNext now: src/modules/courses/quiz-service.ts:496-561 — questions/randomization edits locked after attempts
- Fix: Restore lifecycle rollback contract

## G2-17-025-026  [P1] GAP  facet F12  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:276-295 — faculty/admin grades release toggle after deadline
- vNext now: src/modules/courses/quiz-service.ts:746-773 — courses.manage admin-only results toggle
- Fix: Resolve teacher privilege loss explicitly

## G2-17-025-045  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:276-295 — grade release can be reverted by manager
- vNext now: src/modules/courses/quiz-service.ts:746-773 — admin-only results close/toggle
- Fix: Preserve reversible teacher result visibility

## G2-17-025-014  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:224-232 — exact missing due and at-least-one-question messages
- vNext now: src/modules/courses/quiz-service.ts:708-714 — QUIZ_DEADLINE_PASSED and status guard
- Fix: Map field-level error copy

## G2-17-025-016  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:183-197 — distinct frozen fields error strings
- vNext now: src/modules/courses/quiz-service.ts:490-561 — single QUIZ_HAS_ATTEMPTS domain error
- Fix: Differentiate forbidden mutations
