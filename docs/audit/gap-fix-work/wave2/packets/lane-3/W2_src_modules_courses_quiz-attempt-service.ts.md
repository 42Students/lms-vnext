# Work packet (wave 2): edit src/modules/courses/quiz-attempt-service.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md, docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-19/quiz-answer-entity.md, docs/audit/gap2/lane-2/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-3/l15-u031-learning-flow-cross-cutting.md, docs/audit/gap2/lane-3/learner-quiz.md

## G2-17-025-010  [P2] GAP  facet F05  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:145-153 — separate submissions and my-submissions reads
- vNext now: src/modules/courses/quiz-attempt-service.ts:453-573,573-700 — per-quiz own and staff attempt readers
- Fix: Provide all-quizzes own submissions access

## G2-17-025-022  [P2] GAP  facet F10  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:128-143 — submit POST /{quizId}/submit
- vNext now: src/modules/courses/quiz-attempt-service.ts:285-437 — scoped transactional submission service
- Fix: Adapt client API and conflict status

## G2-17-025-029  [P2] GAP  facet F14  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:150-153 — my-submissions optionally quizId filter
- vNext now: src/modules/courses/quiz-attempt-service.ts:453-573 — requires specific quizId
- Fix: Add across-quiz own submissions

## G2-18-016-006  [P2] GAP  facet F04  effort M
- Legacy: QuizAttemptResponseDTO.java:15-23 serializes roll, mobile and score
- vNext now: src/modules/courses/quiz-attempt-service.ts:618-633 serializes displayName/email; mobile/roll unavailable
- Fix: Add authorized roll lookup; privacy-review any mobile field; align blank placeholders

## G2-18-016-008  [P2] GAP  facet F05  effort S
- Legacy: QuizAttemptRepository.java:22-25 newest submission first and learner attempt number descending
- vNext now: src/modules/courses/quiz-attempt-service.ts:491-505,658-663 ascending attempt/submitted time
- Fix: Default to descending latest-first on both educator and learner lists; use deterministic ID tie-break

## G2-18-016-031  [P2] GAP  facet F19  effort M
- Legacy: QuizAttemptRepository.java:22-25 unpaged reads
- vNext now: src/modules/courses/quiz-attempt-service.ts:618-663 caps managers to 25/page but getMyQuizAttempts:491-505 remains unpaged
- Fix: Add cursor/page for personal long history and overall count for educator pagination

## G2-19-016-013  [P2] GAP  facet F05  effort M
- Legacy: Legacy answer repository reads by attemptId list, excludes soft-deleted `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:664-672`
- vNext now: vNext reads answers by attempt IDs, projects per attempt `src/modules/courses/quiz-attempt-service.ts:512-538`
- Fix: Account for deleted legacy rows when importing history.

## G2-19-016-014  [P2] GAP  facet F05  effort M
- Legacy: Legacy answer report sorts question ID ascending `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:1052-1054`
- vNext now: vNext read groups returned answer rows with no explicit sort in cited code `src/modules/courses/quiz-attempt-service.ts:512-538` `src/modules/courses/quiz-attempt-service.ts:548-568`
- Fix: Sort by question sequence (not raw UUID) to reproduce authored quiz order.

## G2-19-016-027  [P2] GAP  facet F10  effort M
- Legacy: Legacy GET answer report uses saved row selectedOptionIds parsed `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:1038-1059`
- vNext now: vNext GET returns JSON selectedOptionIds with conditionally revealed correctness `src/modules/courses/quiz-attempt-service.ts:548-568`
- Fix: Map response DTO field types for legacy callers.

## G2-19-016-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy nullable selected_option_ids in SQL even though submit path requires answers `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:73-75` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:552-562`
- vNext now: vNext NOT NULL jsonb [] for omitted answers if present in scored rows `src/db/schema/quizzes.ts:303-307` `src/modules/courses/quiz-attempt-service.ts:193-196`
- Fix: Define null/unanswered history behavior and UI empty state.

## G2-19-016-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy JPA QuizAnswer extends BaseModel and repository saveAll `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAnswer.java:17-28` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:618-628`
- vNext now: vNext Drizzle quizAttemptAnswers schema and transactional inserts `src/db/schema/quizzes.ts:279-343` `src/modules/courses/quiz-attempt-service.ts:394-411`
- Fix: Document old-to-new persistence semantics and FK behavior.

## G2-19-016-050  [P2] GAP  facet F21  effort M
- Legacy: Legacy report parses comma selected IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:1052-1059`
- vNext now: vNext reports JSON arrays and snapshots `src/modules/courses/quiz-attempt-service.ts:548-568` `src/modules/courses/faculty-quiz-attempts-service.ts:30-38`
- Fix: Update report DTOs/export and migrate ID array parsing.

## G2-18-016-046  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:529-550 exact Quiz deadline has passed / Maximum quiz attempts reached / Only learners can submit quizzes
- vNext now: src/modules/courses/quiz-attempt-service.ts:333-343 and 390-392 coded errors QUIZ_DEADLINE_PASSED / QUIZ_MAX_ATTEMPTS_REACHED
- Fix: Verify friendly-error mappings reproduce accepted phrases, status and field placement

## G2-18-016-047  [P2] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:140-141 This attempt was already recorded. Refresh to see your submission.
- vNext now: src/modules/courses/quiz-attempt-service.ts:433-437 QUIZ_ATTEMPT_CONFLICT code
- Fix: Add refresh-oriented duplicate submit error copy

## G2-18-016-052  [P2] GAP  facet F20  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:303-305 compares Asia/Kolkata LocalDateTime
- vNext now: src/modules/courses/quiz-attempt-service.ts:340-343 compares dueAt epoch to Date.now()
- Fix: Test boundary conversion and display for IST deadlines, especially midnight

## G2-15-031-030  [P2] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:14-42`
- vNext now: `src/modules/courses/quiz-attempt-service.ts:60-142`
- Fix: Legacy quiz selection/Redux vs vNext question/answer and per-delivery attempts.

## G2-15-031-037  [P2] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quizzes/QuizzesContent.jsx:98-106`
- vNext now: `src/modules/courses/quiz-attempt-service.ts:129-142`
- Fix: Legacy lesson picker context vs new published quiz/path/lesson guards.

## G2-3-003-062  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:12-24`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:128-143`
- vNext now: `src/modules/courses/quiz-validation.ts:235-276`; `src/modules/courses/quiz-attempt-service.ts:285-342`
- Fix: Legacy submit DTO permits up to 200 answers and requires non-empty, plus optional shownQuestionIds; new max 100 and defaults to []; reconcile validation for legacy long quizzes.

## G2-17-025-034  [P3] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:133-141 — 409 retry wording
- vNext now: src/modules/courses/quiz-attempt-service.ts:423-437 — domain error codes
- Fix: Provide focusable conflict notification
