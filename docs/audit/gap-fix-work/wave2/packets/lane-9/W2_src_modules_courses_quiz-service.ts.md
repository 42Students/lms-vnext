# Work packet (wave 2): edit src/modules/courses/quiz-service.ts

9 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md, docs/audit/gap2/lane-20/quiz.md

## G2-17-025-003  [P2] GAP  facet F02  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:55-64 — controller create/update returns complete quiz
- vNext now: src/modules/courses/quiz-service.ts:381-453 — creates draft, independent publish
- Fix: Match teacher workflow and saved state

## G2-17-025-005  [P2] GAP  facet F03  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:66-97 — four distinct publish/result controls
- vNext now: src/modules/courses/quiz-service.ts:665-782 — PUBLISH/CLOSE/ARCHIVE and resultsReleased
- Fix: Match exact labels and statuses

## G2-17-025-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:110-120 — page0/size20 only when lessonId absent
- vNext now: src/modules/courses/quiz-service.ts:135-219 — lesson-scoped listing no page argument
- Fix: Implement dedicated paged all-quizzes list

## G2-17-025-019  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:240-248 — unpublish refused after attempts/deadline
- vNext now: src/modules/courses/quiz-service.ts:665-743 — no unpublish UI/API at all
- Fix: Preserve confirmation with explicit guard

## G2-17-025-020  [P2] GAP  facet F09  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:258-270 — delete soft-deletes if no attempts/closed
- vNext now: src/modules/courses/quiz-service.ts:665-743 — ARCHIVE via transition, not DELETE
- Fix: Reconcile soft-delete and archive historical records

## G2-17-025-035  [P2] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:73-96 — unpublish quiz vs unpublish grades separate commands
- vNext now: src/modules/courses/quiz-service.ts:665-782 — CLOSE/ARCHIVE and resultsPublished
- Fix: Align exact title, tooltip, confirmation copy

## G2-17-025-037  [P2] GAP  facet F19  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:110-120 — page size defaults20 for large course list
- vNext now: src/modules/courses/quiz-service.ts:135-219 — no paging on lesson list
- Fix: Supply server paging and filters

## G2-20-016-001  [P2] GAP  facet F01  effort S
- Legacy: Quiz CRUD/publish/unpublish/grade release in QuizService `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/QuizService.java:12-39`
- vNext now: New create/update/status/attempt functions in course quiz-service `src/modules/courses/quiz-service.ts:20-41,428-431,691-709`
- Fix: Map route/action names and ensure every old faculty/admin operation available

## G2-17-025-036  [P3] GAP  facet F18  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:224-232 — Due date is required before publishing
- vNext now: src/modules/courses/quiz-service.ts:708-714 — QUIZ_DEADLINE_PASSED
- Fix: Separate missing vs expired due errors
