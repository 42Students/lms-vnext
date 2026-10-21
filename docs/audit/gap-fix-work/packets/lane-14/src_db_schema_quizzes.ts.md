# Work packet: edit src/db/schema/quizzes.ts

17 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-16/u016-quiz-question.md, docs/audit/gap2/lane-19/quiz-answer-entity.md, docs/audit/gap2/lane-2/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-20/quiz.md, docs/audit/gap2/lane-3/college-admin-quizzes.md

## G2-18-016-005  [P1] GAP  facet F04  effort M
- Legacy: QuizAttempt.java:18-32 int quizId/learnerId/attemptNumber, status SUBMITTED, long score/maxScore, LocalDateTime submittedAt
- vNext now: src/db/schema/quizzes.ts:220-253 UUID quiz/delivery/membership, int scores, timestamptz; no status
- Fix: Document compatibility map for IDs, score width, status and timezone; no direct numeric ID migration assumed

## G2-18-016-035  [P1] GAP  facet F22  effort M
- Legacy: BaseModel.java:23-37 gives int ID, created_at, updated_at, is_deleted
- vNext now: src/db/schema/quizzes.ts:220-253 UUID id, createdAt, no updatedAt/isDeleted
- Fix: Record intentional immutable attempt history and remove soft-delete assumptions from downstream reads

## G2-18-016-036  [P1] GAP  facet F22  effort M
- Legacy: QuizAttempt.java:18-32 legacy learner_id, status, long score
- vNext now: src/db/schema/quizzes.ts:220-275 new membership_id, delivery_id, int score, unique/check/index
- Fix: Verify actual drizzle migration, overflow bounds and reenrolment semantics, documenting every field replacement

## G2-16-016-035  [P1] GAP  facet F22  effort 
- Legacy: QuizQuestionRequestDTO.java:23-25 max100 points.
- vNext now: quizzes.ts:175-182 max1000; drizzle/0007_courses_c4b_quizzes.sql:23-34 check.
- Fix: Align DB and validator maximum to100 if literal legacy parity.

## G2-19-016-002  [P1] GAP  facet F01  effort L
- Legacy: Legacy table named quiz_answers, PK integer `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAnswer.java:13-17` `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-70`
- vNext now: vNext table renamed quiz_attempt_answers, PK UUID `src/db/schema/quizzes.ts:279-283`
- Fix: Use migration mapping from old attempt/question IDs to UUID answer keys.

## G2-19-016-007  [P1] GAP  facet F03  effort L
- Legacy: Legacy saved option IDs are comma-joined sorted integers `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:618-623`
- vNext now: vNext UUID selected options JSON array, retaining selection order `src/db/schema/quizzes.ts:303-307` `src/modules/courses/quiz-attempt-service.ts:241-254`
- Fix: Normalize existing comma integers to new option UUIDs with deterministic ordering.

## G2-19-016-010  [P1] GAP  facet F04  effort L
- Legacy: Legacy pointsAwarded BIGINT `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAnswer.java:26-27` `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:74-75`
- vNext now: vNext pointsAwarded integer CHECK bounded to pointsPossible `src/db/schema/quizzes.ts:322-340`
- Fix: Reject/quarantine historical overflow, negative or inconsistent scores.

## G2-19-016-011  [P1] GAP  facet F04  effort M
- Legacy: Legacy selected_option_ids VARCHAR500 nullable `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:71-75`
- vNext now: vNext selectedOptionIds jsonb string[] NOT NULL `src/db/schema/quizzes.ts:303-307`
- Fix: Explicitly parse null as [] only under documented legacy unanswered policy.

## G2-19-016-028  [P1] GAP  facet F10  effort L
- Legacy: Legacy answer writer stores sorted comma IDs `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:621-623`
- vNext now: vNext data model retains jsonb ordered array of UUIDs `src/db/schema/quizzes.ts:303-307`
- Fix: Preserve option equivalence, not incidental numeric order, in migration.

## G2-19-016-031  [P1] GAP  facet F12  effort L
- Legacy: Legacy isDeleted soft-delete flag per answer `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:76-78`
- vNext now: vNext ON DELETE RESTRICT and no isDeleted column `src/db/schema/quizzes.ts:283-292` `src/db/schema/quizzes.ts:279-330`
- Fix: Define retention and delete compatibility before migrator applies.

## G2-19-016-051  [P1] GAP  facet F22  effort L
- Legacy: Legacy quiz_answers INT FK to attempt/question, CSV VARCHAR500, bool, BIGINT, soft-delete `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-83`
- vNext now: vNext quiz_attempt_answers UUID FKs, JSONB, integer, snapshots, no deletedAt `src/db/schema/quizzes.ts:279-343`
- Fix: Reconcile every column and relation in migration.

## G2-19-016-052  [P1] GAP  facet F22  effort L
- Legacy: Legacy migration is MySQL V66 `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-83`
- vNext now: vNext Postgres quiz_attempt_answers in Drizzle plus nsrit import plans `src/db/schema/quizzes.ts:279-343` `scripts/migrate/nsrit/plan-academics.ts:1671-1794`
- Fix: Run staged mapping integrity checks and quarantine dangling answer refs.

## G2-18-016-054  [P1] GAP  facet F22  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:51-67 quiz_attempts uses int PK/FKs, status, is_deleted, updated_at, DATETIME, BIGINT score
- vNext now: src/db/schema/quizzes.ts:220-277 UUID PK/FKs, membership/delivery, no status/is_deleted/updated_at, integer score
- Fix: Map legacy IDs and historic soft deletes/status; verify long score values fit new integer range

## G2-20-016-040  [P1] GAP  facet F23  effort M
- Legacy: Legacy active and enabled fields allow hidden/off independently of status `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:31-42`
- vNext now: New consolidated status, no same flag pair `src/db/schema/quizzes.ts:25-79`
- Fix: Decide intentional switch retirement and test learner visibility/staff publish edge cases

## G2-3-001-083  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:14-55`; `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java:18-32`
- vNext now: `src/db/schema/quizzes.ts:25-79`; `src/db/schema/quizzes.ts:220-275`
- Fix: Map numeric legacy course/class/faculty IDs and active/enabled flags to new UUID lesson/delivery/author fields and archived enum; document migration not needed but behavioral impact.

## G2-3-001-084  [P1] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:21-49`
- vNext now: `src/db/schema/quizzes.ts:34-64`
- Fix: Contrast `class_id`/`faculty_id` with `delivery_id`/`created_by_user_id`, grade publication field name and status enum; map role/access rules.

## G2-3-005-059  [P1] GAP  facet F22  effort L
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/AdminQuizController.java:87-107`
- vNext now: `src/db/schema/quizzes.ts:25-79`
- Fix: Legacy numeric quiz/course/class/faculty IDs vs new UUID quiz, delivery and author; ensure scope and any report mapping.
