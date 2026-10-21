# Work packet (wave 2): edit src/modules/courses/quiz-validation.ts

13 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md, docs/audit/gap2/lane-16/u016-quiz-question.md, docs/audit/gap2/lane-17/quiz-option-entity.md, docs/audit/gap2/lane-3/learner-quiz.md, docs/audit/gap2/lane-3/superadmin-quizzes-section.md, docs/audit/gap2/lane-19/quiz-answer-entity.md

## G2-17-025-007  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:27-36 — maxAttempts=1 default; shuffle false; publish flag
- vNext now: src/modules/courses/quiz-validation.ts:145-173 — shuffle false; attempts in Zod; no create publish flag
- Fix: Preserve publish-on-create decision if required

## G2-17-025-012  [P2] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:16-29 — positive integer lesson/course; title<=255 description<=5000 attempts1..20
- vNext now: src/modules/courses/quiz-validation.ts:145-174 — UUID scope and structured Zod shape
- Fix: Document DTO conversions and matching limits

## G2-17-025-043  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:16-36 — int class/course/lesson, publish & shuffle flags
- vNext now: src/modules/courses/quiz-validation.ts:145-173 — UUID lesson/delivery, dueAt offset, shuffle
- Fix: Document schema/migration mapping

## G2-17-025-044  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:13-25 — numeric question/option and shown IDs
- vNext now: src/modules/courses/quiz-validation.ts:227-277 — UUID question/option without shown IDs
- Fix: Map identity and version shape

## G2-16-016-011  [P2] GAP  facet F06  effort 
- Legacy: QuizQuestion.java:25 defaults points=1, DTO QuizQuestionRequestDTO.java:25 defaults1.
- vNext now: quiz-validation.ts:44-48 requires explicit points, no default.
- Fix: Default points to 1 on initial question insert, including API where absent if allowed.

## G2-16-016-037  [P2] GAP  facet F23  effort 
- Legacy: QuizQuestion.java:25 points default1.
- vNext now: quiz-validation.ts:44-48 points required and1000 max.
- Fix: Apply default1 and validate legacy max100.

## G2-17-016-012  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizOptionRequestDTO.java:9-15 — Request optional id; text @NotBlank @Size(max2000), correct boolean.
- vNext now: src/modules/courses/quiz-validation.ts:30-34 — Text trim min1 max2000, correct boolean, required sequence 0..100.
- Fix: Align editor per-option sequence validation/legacy optional ID semantics.

## G2-17-016-013  [P2] GAP  facet F06  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:794-802 — Backend computes sequential positions from submitted array.
- vNext now: src/modules/courses/quiz-validation.ts:30-34 — Client supplies explicit sequence constrained 0..100.
- Fix: Generate positions server-side or prevent sparse/duplicate positions.

## G2-17-016-028  [P2] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:995-1005 — Single-choice picks earliest correct option by sequence/id if malformed.
- vNext now: src/modules/courses/quiz-validation.ts:89-98 — vNext requires exactly one, bad legacy data rejected.
- Fix: Plan migration repair of multiple legacy correct flags.

## G2-3-003-062  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:12-24`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:128-143`
- vNext now: `src/modules/courses/quiz-validation.ts:235-276`; `src/modules/courses/quiz-attempt-service.ts:285-342`
- Fix: Legacy submit DTO permits up to 200 answers and requires non-empty, plus optional shownQuestionIds; new max 100 and defaults to []; reconcile validation for legacy long quizzes.

## G2-3-005-024  [P2] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:502-505`
- vNext now: `src/modules/courses/quiz-validation.ts:39-52`
- Fix: Legacy points editor max 100; new validator max 1000. Align UI/business limit.

## G2-17-016-037  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:878-882 — Legacy error uses `need` not `require` and no hyphen.
- vNext now: src/modules/courses/quiz-validation.ts:96-111 — New error wording differs and adds one-incorrect requirement.
- Fix: Keep exact legacy validation copy where parity demanded.

## G2-19-016-043  [P3] GAP  facet F18  effort S
- Legacy: Legacy error `Duplicate selected option submitted for questionId` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:580-585`
- vNext now: vNext Zod `Selected options may not contain duplicates` `src/modules/courses/quiz-validation.ts:258-274`
- Fix: Map exact submit-feedback wording where parity required.
