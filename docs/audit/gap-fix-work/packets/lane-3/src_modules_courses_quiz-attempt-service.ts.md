# Work packet: edit src/modules/courses/quiz-attempt-service.ts

19 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md, docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-19/quiz-answer-entity.md, docs/audit/gap2/lane-2/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-3/learner-quiz.md

## G2-17-025-033  [P1] GAP  facet F17  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:18-24 — shownQuestionIds stale question set gives 409
- vNext now: src/modules/courses/quiz-attempt-service.ts:302-313,318-342 — immutability + quiz lock but no client shown ID
- Fix: Pin authored revision at attempted submission

## G2-18-016-009  [P1] GAP  facet F05  effort M
- Legacy: QuizServiceImpl.java:663-681 lists all manager attempts across quiz without paging
- vNext now: src/modules/courses/quiz-attempt-service.ts:618-663 pages 25 rows per delivery
- Fix: Retain scalability but show quiz-wide totals/all-deliveries view and explicit 25/page control

## G2-18-016-012  [P1] GAP  facet F06  effort M
- Legacy: QuizServiceImpl.java:575-589 rejects missing answers/empty options and demands exactly one answer per question
- vNext now: src/modules/courses/quiz-attempt-service.ts:170-260 scores omitted questions zero
- Fix: Decide required-question behavior; apply client and server validation and explain skipped questions

## G2-18-016-021  [P1] GAP  facet F11  effort M
- Legacy: QuizAttemptResponseDTO.java:15-17 includes mobile and roll
- vNext now: src/modules/courses/quiz-attempt-service.ts:618-647 shows email; no mobile
- Fix: Record PII access decision and reveal learner contact only for explicit need-to-know roles

## G2-18-016-023  [P1] GAP  facet F12  effort M
- Legacy: QuizServiceImpl.java:535-550 enforces active/enabled/PUBLISHED/due/max attempts
- vNext now: src/modules/courses/quiz-attempt-service.ts:130-141,333-343,383-393 scopes visible PUBLISHED quiz, due and max
- Fix: Verify active/enabled legacy flags fully represented by quiz/lesson visibility and CLOSED states

## G2-18-016-033  [P1] GAP  facet F20  effort M
- Legacy: QuizServiceImpl.java:298-305 uses Asia/Kolkata local due date
- vNext now: src/modules/courses/quiz-attempt-service.ts:340-343 compares Date instant
- Fix: Test dueAt ingestion and IST boundary including midnight; never assume UTC wall-clock interpretation

## G2-18-016-038  [P1] MISSING  facet F23  effort M
- Legacy: QuizAttemptRepository.java:24-25 supports global learner attempt history
- vNext now: src/modules/courses/quiz-attempt-service.ts:453-505 requires one quiz/delivery
- Fix: Recreate learner-owned all-quiz attempt-history endpoint with tenant scoping

## G2-19-016-007  [P1] GAP  facet F03  effort L
- Legacy: Legacy saved option IDs are comma-joined sorted integers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:618-623`
- vNext now: vNext UUID selected options JSON array, retaining selection order `src/db/schema/quizzes.ts:303-307` `src/modules/courses/quiz-attempt-service.ts:241-254`
- Fix: Normalize existing comma integers to new option UUIDs with deterministic ordering.

## G2-19-016-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy submit requires nonempty answer request and one answer for every question `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:552-579`
- vNext now: vNext schema allows answers array default[] then scoreSubmission fills omitted answers with [] `src/modules/courses/quiz-validation.ts:227-242` `src/modules/courses/quiz-attempt-service.ts:193-196`
- Fix: Decide complete-answer requirement; don't silently change unanswered scoring semantics.

## G2-19-016-017  [P1] GAP  facet F06  effort M
- Legacy: Legacy single choice requires exactly one selected `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:580-587`
- vNext now: vNext rejects selection >1, while zero may be allowed for omitted answers `src/modules/courses/quiz-attempt-service.ts:193-217`
- Fix: Align required single-choice selection with product policy.

## G2-18-016-060  [P1] GAP  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:554-590 complete-answer rules
- vNext now: src/modules/courses/quiz-attempt-service.ts:170-260 omission scores zero (diff from required complete submit)
- Fix: Restore validation contract or explicitly approve accepting unanswered questions and update copy

## G2-3-003-037  [P1] GAP  facet F11  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:188-190`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:330-340`
- vNext now: `src/modules/courses/quiz-attempt-service.ts:129-167`; `src/components/courses/learner-quiz-attempt.tsx:131-151`
- Fix: Legacy allows faculty preview via effective role and includes correct answers; new learner page does not branch by teacher and requires learner access. Restore teacher preview elsewhere with explicit permission.

## G2-3-003-060  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:527-530`
- vNext now: `src/modules/courses/quiz-attempt-service.ts:302-343`; `src/modules/courses/quiz-validation.ts:235-257`
- Fix: Legacy request includes shownQuestionIds revision-check; vNext claims authored immutability. Assert session can't submit against swapped question IDs after publish/unpublish/edits.

## G2-18-016-013  [P2] GAP  facet F07  effort S
- Legacy: QuizServiceImpl.java:544-555 exact 'Quiz deadline has passed', 'Quiz submission must include answers'
- vNext now: src/modules/courses/quiz-attempt-service.ts:333-343 machine error codes
- Fix: Map error codes to legacy exact field/page copy including retry guidance

## G2-18-016-015  [P2] GAP  facet F07  effort S
- Legacy: QuizController.java:128-142 catches duplicate-attempt DB error as 409 'This attempt was already recorded. Refresh to see your submission.'
- vNext now: src/modules/courses/quiz-attempt-service.ts:422-437 emits QUIZ_MAX_ATTEMPTS_REACHED or QUIZ_ATTEMPT_CONFLICT
- Fix: Surface equivalent 409 explanatory toast and refresh submitted history automatically

## G2-18-016-016  [P2] GAP  facet F08  effort S
- Legacy: QuizController.java:128-143 success returns 200 OK Response wrapper including attempt
- vNext now: src/app/api/courses/quizzes/[quizId]/submit/route.ts:37-40 201 {attempt}, and quiz-attempt-service.ts:413-419 hides score
- Fix: Show explicit saved attempt confirmation with attempt number; keep grades embargoed until release

## G2-19-016-021  [P2] GAP  facet F08  effort S
- Legacy: Legacy error text `Submit exactly one answer for every quiz question` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:575-579`
- vNext now: vNext missing answers can be mapped to empty list instead of same error `src/modules/courses/quiz-validation.ts:239-242` `src/modules/courses/quiz-attempt-service.ts:193-196`
- Fix: Match complete-submission message where required.

## G2-19-016-023  [P2] GAP  facet F08  effort S
- Legacy: Legacy invalid option message `Selected option does not belong to this question` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:605-608`
- vNext now: vNext generic QUIZ_ANSWER_INVALID `src/modules/courses/quiz-attempt-service.ts:203-209`
- Fix: Surface precise, non-leaking invalid-option feedback.

## G2-17-025-015  [P3] GAP  facet F07  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:133-141 — 409 This attempt was already recorded. Refresh to see your submission.
- vNext now: src/modules/courses/quiz-attempt-service.ts:423-437 — domain conflict and MAX_ATTEMPTS_REACHED codes
- Fix: Show actionable conflict and refresh affordance
