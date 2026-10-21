# Work packet (wave 2): edit src/db/schema/quizzes.ts

33 findings. You own this file: apply every finding below in ONE editing pass (create the file if it does not exist).
Audit documents with full context: docs/audit/gap2/lane-12/l18-u016-quiz-attempt.md, docs/audit/gap2/lane-16/u016-quiz-question.md, docs/audit/gap2/lane-17/quiz-option-entity.md, docs/audit/gap2/lane-19/quiz-answer-entity.md, docs/audit/gap2/lane-2/admin-quiz-controller.md, docs/audit/gap2/lane-2/l18-u016-quiz-attempt.md

## G2-18-016-007  [P2] GAP  facet F04  effort S
- Legacy: QuizServiceImpl.java:594-601 writes LocalDateTime.now()
- vNext now: src/db/schema/quizzes.ts:243-247 DB instant and src/components/courses/college-quiz-attempts.tsx:71-72 explicit IST formatting
- Fix: Verify exact timestamp shape, date style and Asia/Kolkata day-boundary behavior

## G2-18-016-022  [P2] GAP  facet F12  effort S
- Legacy: QuizAttempt.java:23-32 attempt 1, status SUBMITTED defaults
- vNext now: src/db/schema/quizzes.ts:239-253 has attempt number only, no status
- Fix: Return derived SUBMITTED status for compatibility or document approved removal

## G2-16-016-006  [P2] GAP  facet F04  effort 
- Legacy: QuizQuestion.java:18-27 int quiz ID, string questionType/prompt, long points default1, int sequence.
- vNext now: quizzes.ts:144-156 UUID quiz ID, enum type, text, integer points and sequence.
- Fix: Map legacy IDs and enforce values before importing; preserve default 1.

## G2-16-016-007  [P2] GAP  facet F04  effort 
- Legacy: QuizQuestion.java:17 inherits BaseModel ID/audit/delete fields.
- vNext now: quizzes.ts:144,157-165 UUID id, timestamps, no isDeleted.
- Fix: Map soft-deleted old rows to omitted/archived questions; verify BaseModel fields.

## G2-16-016-008  [P2] GAP  facet F05  effort 
- Legacy: QuizQuestionRepository.java:11 uses isDeletedFalse, order sequence ASC id ASC.
- vNext now: quizzes.ts:169-174 unique quiz+sequence; ordering must be explicit on read.
- Fix: Ensure learner/builder reads order sequence then ID and exclude retired data.

## G2-16-016-021  [P2] GAP  facet F12  effort 
- Legacy: QuizQuestion.java:20-21 String question type, not enum at entity.
- vNext now: quizzes.ts:150-153 Postgres SINGLE_CHOICE/MULTIPLE_CHOICE enum.
- Fix: Map old question types and reject unsupported historical values gracefully.

## G2-16-016-023  [P2] GAP  facet F12  effort 
- Legacy: QuizQuestionRepository.java:11 isDeletedFalse allows hiding a question.
- vNext now: quizzes.ts:141-184 no per-question archival marker.
- Fix: Expose question removal in draft edit; preserve old history by attempt snapshots.

## G2-16-016-034  [P2] GAP  facet F22  effort 
- Legacy: QuizQuestion.java:13-27 table quiz_questions, int ID inherited BaseModel, quiz_id int.
- vNext now: quizzes.ts:141-184 same table name with UUID PK+FK and NOT NULL type/points.
- Fix: Document ID type/soft delete/audit field migration; no data migration if owner waived.

## G2-17-016-007  [P2] GAP  facet F04  effort L
- Legacy: docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:38-49 — MySQL INT id/questionId, option_text TEXT, correct BOOLEAN default false, sequence INT default0.
- vNext now: src/db/schema/quizzes.ts:186-216 — UUID IDs, isCorrect and sequence required, no default.
- Fix: Map IDs/sequence/default values in migration.

## G2-17-016-008  [P2] GAP  facet F04  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizOption.java:17-25 — Inherited BaseModel fields include soft-delete/timestamps.
- vNext now: src/db/schema/quizzes.ts:186-216 — quiz_options has no isDeleted, createdAt timestamp only.
- Fix: Preserve audit/history for removed options or document new immutable snapshot strategy.

## G2-17-016-024  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:606-626 — Attempt scoring checks exact selected ID set vs correct ID set.
- vNext now: src/db/schema/quizzes.ts:303-320 — Attempt answer stores selected IDs and option snapshots.
- Fix: Preserve exact-set grading and historic key snapshot on options edited.

## G2-17-016-025  [P2] GAP  facet F10  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/QuizOptionRepository.java:14-14 — Deletes choices by questionIdIn (hard delete repository call).
- vNext now: src/db/schema/quizzes.ts:186-216 — No per-option soft-delete column.
- Fix: Ensure historical quiz attempts remain reviewable after mutation.

## G2-17-016-031  [P2] GAP  facet F13  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/QuizOptionRepository.java:12-13 — Deleted choices filtered out, returning empty array when no active rows.
- vNext now: src/db/schema/quizzes.ts:186-216 — No delete flag, absent choices read as zero rows.
- Fix: Maintain empty-state semantics for imported deleted options.

## G2-17-016-045  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/repository/QuizOptionRepository.java:12-14 — Repository permits duplicate sequence, stable ID secondary ordering.
- vNext now: src/db/schema/quizzes.ts:208-209 — Unique sequence per question.
- Fix: Resolve duplicate legacy sequence deterministically when importing.

## G2-19-016-009  [P2] GAP  facet F04  effort M
- Legacy: Legacy BaseModel carries id/isDeleted/createdAt/updatedAt `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAnswer.java:17-17` `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:69-78`
- vNext now: vNext answer has uuid ID, createdAt but no updatedAt or isDeleted `src/db/schema/quizzes.ts:279-330`
- Fix: Set retention and soft-delete conversion policy for historical attempts.

## G2-19-016-034  [P2] GAP  facet F13  effort M
- Legacy: Legacy nullable selected_option_ids in SQL even though submit path requires answers `docs/legacy-source/backend/src/main/resources/db/migration/V66__first_class_quiz_tables.sql:73-75` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:552-562`
- vNext now: vNext NOT NULL jsonb [] for omitted answers if present in scored rows `src/db/schema/quizzes.ts:303-307` `src/modules/courses/quiz-attempt-service.ts:193-196`
- Fix: Define null/unanswered history behavior and UI empty state.

## G2-19-016-049  [P2] GAP  facet F21  effort M
- Legacy: Legacy JPA QuizAnswer extends BaseModel and repository saveAll `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAnswer.java:17-28` `docs/legacy-source/backend/src/main/java/com/_42students/lms/service/impl/QuizServiceImpl.java:618-628`
- vNext now: vNext Drizzle quizAttemptAnswers schema and transactional inserts `src/db/schema/quizzes.ts:279-343` `src/modules/courses/quiz-attempt-service.ts:394-411`
- Fix: Document old-to-new persistence semantics and FK behavior.

## G2-2-022-061  [P2] GAP  facet F22  effort M
- Legacy: QuizResponseDTO.java:14-36 int id/lesson/course/class/faculty + gradePublished
- vNext now: src/db/schema/quizzes.ts:25-139 UUID lessonId/deliveryId, createdByUserId, resultsPublished
- Fix: Map foreign keys and renamed grade release flag; preserve audience/author.

## G2-18-016-057  [P2] GAP  facet F22  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java:31-32 submittedAt nullable
- vNext now: src/db/schema/quizzes.ts:243-247 submittedAt required/defaultNow
- Fix: Decide handling of historical null submitted timestamps before backfill

## G2-18-016-058  [P2] MISSING  facet F23  effort M
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java:23-26 status field is explicitly SUBMITTED and soft-delete inherited BaseModel
- vNext now: src/db/schema/quizzes.ts:220-277 neither status nor soft-delete flag
- Fix: Document intentional simplified immutable attempts; if delete/withdraw exists elsewhere, add tombstone

## G2-20-016-002  [P2] GAP  facet F01  effort S
- Legacy: Legacy Quiz associated courseId, lessonId, classId and facultyId `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:19-26`
- vNext now: New lessonId required, deliveryId optional, createdByUserId required; course/class inferred `src/db/schema/quizzes.ts:29-37,64-68`
- Fix: Ensure class/faculty ownership displayed and scoped via lesson delivery

## G2-20-016-004  [P2] GAP  facet F02  effort S
- Legacy: Quiz records embedded inside lesson/course/class pages `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:19-26`
- vNext now: New delivery-scoped course quizzes mapped to lesson pages `src/db/schema/quizzes.ts:29-37`
- Fix: Verify placement under same sidebar/section tabs

## G2-20-016-005  [P2] MISSING  facet F03  effort S
- Legacy: Quiz active and enabled boolean independently stored `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:39-42`
- vNext now: New has status enum but no active/enabled columns `src/db/schema/quizzes.ts:25-79`
- Fix: Determine legacy active/enabled UI toggles and map to status/access policy

## G2-20-016-024  [P2] GAP  facet F11  effort S
- Legacy: Legacy facultyId/classId ownership stored directly on quiz `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:23-26`
- vNext now: New deliveryId/createdByUserId with permissions from course/lesson `src/db/schema/quizzes.ts:29-37,64-68`
- Fix: Verify teacher reassignment and section scope unaffected

## G2-20-016-025  [P2] GAP  facet F12  effort S
- Legacy: Legacy initial status DRAFT, active=true, enabled=true `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:31-42`
- vNext now: New status DRAFT but no active/enabled `src/db/schema/quizzes.ts:49-51`
- Fix: Explicitly map three legacy switches to one coherent lifecycle

## G2-20-016-033  [P2] GAP  facet F18  effort S
- Legacy: Legacy statuses DRAFT/PUBLISHED and gradePublished boolean `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:31-47`
- vNext now: New DRAFT/PUBLISHED/CLOSED/ARCHIVED status with resultsPublished `src/db/schema/quizzes.ts:49-56`
- Fix: Map CLOSED/ARCHIVED labels and legacy active/enabled toggle

## G2-20-016-039  [P2] GAP  facet F22  effort M
- Legacy: MySQL quizzes BaseModel int IDs/course,class,faculty and flags `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:13-61`
- vNext now: Postgres UUID course_quizzes lesson/delivery refs, resultsPublished, shuffle, indices `src/db/schema/quizzes.ts:25-139`
- Fix: Map old quiz ownership/class/course and stable question IDs to new schema

## G2-3-001-085  [P2] GAP  facet F22  effort M
- Legacy: `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizAttempt.java:24-32`
- vNext now: `src/db/schema/quizzes.ts:229-252`
- Fix: Legacy attempt status=SUBMITTED is omitted in new attempts table; verify any status-based reports consuming old field.

## G2-3-005-060  [P2] GAP  facet F22  effort S
- Legacy: `docs/legacy-source/frontend/src/pages/superadmin/sections/Quizzes.js:9-14`
- vNext now: `src/db/schema/quizzes.ts:220-252`
- Fix: Legacy attempts include status SUBMITTED, new schema no status column; test status-aware downstream reports.

## G2-17-016-030  [P3] GAP  facet F12  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizOption.java:22-25 — Correct boolean false default and ordering integer.
- vNext now: src/db/schema/quizzes.ts:196-215 — isCorrect defaults false; sequence required positive/zero.
- Fix: Map old zero default to deterministic sequential order.

## G2-17-016-038  [P3] GAP  facet F18  effort S
- Legacy: docs/legacy-source/backend/src/main/java/com/_42students/lms/model/QuizOption.java:20-25 — Schema calls `option_text`, `correct`, `sequence`.
- vNext now: src/db/schema/quizzes.ts:195-199 — new column `is_correct`, not `correct`.
- Fix: Map column aliases for migration/export.

## G2-20-016-008  [P3] GAP  facet F04  effort S
- Legacy: Legacy maxAttempts primitive int default1 `docs/legacy-source/backend/src/main/java/com/_42students/lms/model/Quiz.java:35-36`
- vNext now: New maxAttempts default1 and range1..20 `src/db/schema/quizzes.ts:43-45,126-129`
- Fix: Expose range and block >20 before save

## G2-20-016-037  [P3] GAP  facet F20  effort S
- Legacy: Legacy grade release separate from status controls `docs/legacy-source/backend/src/main/java/com/_42students/lms/controller/QuizController.java:84-96`
- vNext now: New booleans separate, but no check in DB for publish combination `src/db/schema/quizzes.ts:49-56`
- Fix: Validate resultsPublished allowed on DRAFT/CLOSED states
