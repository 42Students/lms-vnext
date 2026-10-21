# Work packet: edit src/modules/courses/quiz-validation.ts

18 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-1/l17-u025-quiz-controller.md, docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-16/u016-quiz-question.md, docs/audit/gap2/lane-17/quiz-option-entity.md, docs/audit/gap2/lane-19/quiz-answer-entity.md, docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-17-025-013  [P1] GAP  facet F06  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:13-25 — answers1..200, optional shownQuestionIds200
- vNext now: src/modules/courses/quiz-validation.ts:227-277 — UUID answer IDs, no shownQuestionIds
- Fix: Protect question-set freshness with version token or IDs

## G2-18-016-011  [P1] GAP  facet F06  effort M
- Legacy: QuizSubmitRequestDTO.java:13-24 requires answers list 1-200 and optional shownQuestionIds 0-200
- vNext now: src/modules/courses/quiz-validation.ts:227-243 defaults answers to [], max 100 and requires deliveryId; no shown IDs
- Fix: Reconcile 100 vs 200 cap and nonempty requirements; document immutable-question assumption or retain shown question fingerprint

## G2-18-016-014  [P1] GAP  facet F07  effort M
- Legacy: QuizServiceImpl.java:564-589,643-658 duplicate/question-set 400/409 errors
- vNext now: src/modules/courses/quiz-validation.ts:244-276 gives new duplicate wording and omits shown-question set
- Fix: Restore actionable changed-quiz reload warning or verify immutable publish transition prevents issue

## G2-16-016-010  [P1] GAP  facet F06  effort 
- Legacy: QuizQuestionRequestDTO.java:17-31 type ≤30, prompt 1-5000, points1-100, sequence≥0, options 1-20.
- vNext now: quiz-validation.ts:36-58 type enum, prompt 1-5000, points1-1000, sequence ≤1000, options 2-20.
- Fix: Align points max100 and one-option legacy acceptance only if still valid; document intentional stricter minimum two.

## G2-16-016-014  [P1] GAP  facet F07  effort 
- Legacy: QuizQuestionRequestDTO.java:23-25 @Max(100) points.
- vNext now: quiz-validation.ts:44-48 max1000; db check ≤1000.
- Fix: Reduce allowed per-question points to100 or document approved scoring change.

## G2-17-016-017  [P1] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:881-882 — Legacy multiple choice requires >=1 correct (all-correct permitted).
- vNext now: src/modules/courses/quiz-validation.ts:101-111 — Requires at least one correct and one incorrect.
- Fix: Document intentional all-correct restriction or restore legacy rule.

## G2-19-016-015  [P1] GAP  facet F06  effort M
- Legacy: Legacy submit requires nonempty answer request and one answer for every question `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:552-579`
- vNext now: vNext schema allows answers array default[] then scoreSubmission fills omitted answers with [] `src/modules/courses/quiz-validation.ts:227-242` `src/modules/courses/quiz-attempt-service.ts:193-196`
- Fix: Decide complete-answer requirement; don't silently change unanswered scoring semantics.

## G2-3-001-034  [P1] GAP  facet F06  effort S
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:346-347`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:19-25`
- vNext now: `src/components/courses/college-quiz-create.tsx:119-130`; `src/modules/courses/quiz-validation.ts:15-25`
- Fix: Enforce legacy 5000-char description max or formally approve 10000-char new limit; distinguish UI and server validation.

## G2-3-001-055  [P1] GAP  facet F12  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/QuizBuilderModal.jsx:367-390`
- vNext now: `src/components/courses/college-quiz-actions.tsx:47-59`; `src/modules/courses/quiz-validation.ts:175-210`
- Fix: Legacy allows title/description edits after attempts and locks deadline/attempts/randomization; vNext UI offers deadline and stale-version logic; verify server restrictions.

## G2-3-001-086  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:19-28`
- vNext now: `src/modules/courses/quiz-validation.ts:15-28`; `src/modules/courses/quiz-validation.ts:145-174`
- Fix: Align description max length 5000 vs 10000 and required date policy; document DB/validation decision explicitly.

## G2-3-003-034  [P1] GAP  facet F10  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizSubmitRequestDTO.java:12-24`; `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:513-531`
- vNext now: `src/components/courses/learner-quiz-attempt.tsx:301-313`; `src/modules/courses/quiz-validation.ts:235-243`
- Fix: Legacy sends `shownQuestionIds` list to reject assessment changed mid-attempt; vNext does not send/validate it because published content is immutable. Confirm immutable guarantee and error mapping before declaring parity.

## G2-3-003-060  [P1] GAP  facet F20  effort M
- Legacy: `docs/legacy-source/frontend/src/components/Quiz/quizpanel.js:527-530`
- vNext now: `src/modules/courses/quiz-attempt-service.ts:302-343`; `src/modules/courses/quiz-validation.ts:235-257`
- Fix: Legacy request includes shownQuestionIds revision-check; vNext claims authored immutability. Assert session can't submit against swapped question IDs after publish/unpublish/edits.

## G2-3-005-058  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizUpsertRequestDTO.java:17-28`
- vNext now: `src/modules/courses/quiz-validation.ts:15-26`; `src/modules/courses/quiz-validation.ts:145-173`
- Fix: Legacy description max 5000 vs new 10000; also creation required date UI vs nullable service payload.

## G2-17-016-015  [P2] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/dto/request/QuizOptionRequestDTO.java:11-13 — Blank or >2000 option rejected Bean Validation.
- vNext now: src/modules/courses/quiz-validation.ts:30-31 — Zod rejects trimmed blank and >2000; generic error codes may differ.
- Fix: Display exact per-choice required/max messages in builder.

## G2-19-016-021  [P2] GAP  facet F08  effort S
- Legacy: Legacy error text `Submit exactly one answer for every quiz question` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:575-579`
- vNext now: vNext missing answers can be mapped to empty list instead of same error `src/modules/courses/quiz-validation.ts:239-242` `src/modules/courses/quiz-attempt-service.ts:193-196`
- Fix: Match complete-submission message where required.

## G2-20-016-015  [P2] GAP  facet F07  effort S
- Legacy: Legacy Quiz object accepts unknown JSON fields ignored `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:17`
- vNext now: New Zod request schemas enforce declared types `src/modules/courses/quiz-validation.ts:145-173`
- Fix: Handle compatibility fields safely with migration/adapters

## G2-17-016-016  [P3] GAP  facet F07  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:878-882 — Legacy single choice error `Single choice questions need exactly one correct option`.
- vNext now: src/modules/courses/quiz-validation.ts:89-98 — `Single-choice questions require exactly one correct option`.
- Fix: Match wording if exact clone is required.

## G2-19-016-022  [P3] GAP  facet F08  effort S
- Legacy: Legacy duplicate answer gives `Duplicate answer submitted for questionId N` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:570-574`
- vNext now: vNext Zod issue `A question may only be answered once` `src/modules/courses/quiz-validation.ts:247-255`
- Fix: Use legacy-oriented row-level error with safe UUID display.
