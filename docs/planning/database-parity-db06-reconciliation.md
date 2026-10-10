# DB06 assessments and attendance — source reconciliation

**Observed:** 2026-10-11 IST  
**Legacy backend oracle:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Legacy frontend oracle:** `42Students/lms2-fe@e6b09e6dd14ac7b6a0dae1697a7c08ddb27cdde2`  
**Global phase:** DATABASE · **Queue task:** DB-009 · **Worker:** Chat 1

This is a source-semantic reconciliation, not runtime database certification. DB-001 is blocked because GitHub Actions jobs are not reaching any steps, so no PostgreSQL replay/integration result is claimed here.

## Current source contracts

The DB06 pass-4 ledger contains 21 historical table candidates / 248 field candidates. Current production source narrows them into two evidence classes:

| Evidence class | Tables | Fields | Disposition |
| --- | ---: | ---: | --- |
| Current JPA entity + current product-job evidence | 9 | 120 | Active source contract; map to vNext semantics |
| Historical exam/proctoring candidate without current JPA entity or current route evidence | 12 | 128 | Retirement candidate only; do **not** retire until native-SQL/live-schema producer checks are complete |

### Active source contracts

1. `quizzes`
2. `quiz_questions`
3. `quiz_options`
4. `quiz_attempts`
5. `quiz_answers`
6. `student_assignment`
7. `grade_audit_log`
8. `assignment_upload_receipt`
9. `attend`

Current frontend route evidence includes Learner All Quizzes / All Assignments / Attendance / standalone Quiz, Faculty All Quizzes / All Assignments / Quiz Report / Assignment Report / Course Attendance, and College/Super Admin assessment and attendance surfaces.

### Historical candidates requiring explicit retirement evidence

`assigned_exam`, `attempted_question`, `exam`, `exam_faculty`, `exam_faculty_mapping`, `exam_monitoring`, `examinee`, `facial_recognition_result`, `question`, `question_option`, singular `quiz_attempt`, and `selected_option`.

The current 118-model JPA census has no entity for these twelve tables and the frozen current UI route manifest has no legacy exam/proctoring product route using them. That is **not enough to retire them**: native SQL, detached jobs, integrations and actual live MySQL presence still need confirmation.

## Normalized vNext mapping and gaps

### Quiz definition

vNext `course_quizzes` already normalizes legacy lesson/course/class scope through `lesson_id` plus optional Section delivery, stores status/deadline/attempt limit/total points/result publication, and records creator/time metadata.

Source-confirmed gap:

- legacy `shuffle_questions` and `shuffle_options` are actively written by `QuizServiceImpl.applyQuizFields`, returned in the response contract, and used to deterministically shuffle the learner view;
- vNext `course_quizzes` currently has no persisted shuffle flags.

The legacy `active` + `enabled` booleans are candidates for normalization into vNext lifecycle/status, not fields to copy blindly. Legacy `course_id`, `class_id` and `faculty_id` are likewise normalized through the lesson/delivery/creator/teaching-assignment model, but target ownership rules still need cross-role execution evidence.

### Quiz attempts and answers

vNext already improves answer history by snapshotting prompt/options/correctness inside `quiz_attempt_answers`, instead of depending on mutable live options.

Source-confirmed behavior:

- attempt number is sequential per learner+quiz;
- submitted attempts are persisted before answers in one service transaction;
- max-attempt enforcement counts non-deleted persisted attempts;
- grade publication gates scores/correct answers;
- question mutation is frozen after attempts exist;
- legacy attempt `status` is written as `SUBMITTED`.

Open disposition:

- vNext omits an attempt status column. Current source only proves the value `SUBMITTED`; do not add an enum unless producer/consumer review finds additional persisted states.
- legacy soft-delete history is not copied automatically; vNext must preserve equivalent audit/recovery behavior if delete/undo remains a current user job.

### Assignment submissions and grading

vNext `course_assignments` + `assignment_submissions` normalize assignment definition and learner submission, but the current schema has one unique row per assignment+membership.

Source-confirmed gaps/decisions:

- legacy `student_assignment.version` is an optimistic-lock field; vNext already carries `version`;
- legacy `is_grade_published`, grader and graded-at semantics are represented in vNext;
- legacy `grade_audit_log` is a durable immutable grade-change/publish trail. vNext currently overwrites submission grading fields and has no grade-specific history table;
- legacy `attempt_number` explicitly exists for re-attempt support, while vNext's unique `(assignment_id,membership_id)` key prevents multiple persisted attempts. Producer/UI behavior must decide whether re-attempt is active; it cannot be silently lost;
- legacy `previous_points` is redundant if an immutable grade-event ledger is introduced; do not duplicate both without a concrete query need;
- legacy learner first/last name and assignment name are denormalized snapshots. Default vNext decision is derive them from canonical identity/assignment records unless report/history evidence requires historical snapshots;
- legacy `semester_number` supports semester-scoped attempt behavior. Prefer deriving academic-period scope from the Section delivery if that preserves the reset rule; otherwise persist an explicit immutable academic-period key.

### Assignment file receipts

`assignment_upload_receipt` is active: assignment submission validation requires an upload receipt for file assets and records storage key, owner, declared/actual MIME+length, expiry, consumption and linked assignment.

PR #45 defines a private GCS object contract, but it is not merged and, even if merged, the helper alone does not replace receipt persistence. DB06 needs a tenant/member-scoped assignment-upload receipt model that:

- never stores a public object URL as the authority;
- stores opaque private object key/generation + integrity/attestation data;
- expires and becomes consumed atomically;
- binds owner membership, assignment/delivery scope and final submission;
- cannot be reused across tenants or submissions.

Coordinate this with DB-016/private-document work rather than creating a second storage security model.

### Attendance

Legacy `attend` is an absence-oriented table: a present correction soft-deletes the unique learner+schedule absence row; re-marking absent revives it. It stores `drop_class_reason`, actor `marked_by`, and optional statuses such as EXCUSED/MEDICAL/LATE. Attendance percentages count held schedules and subtract active absence rows.

vNext `attendance_records` is intentionally normalized to one explicit status per learner+schedule and already persists actor/time, while `attendance_sessions` records whether a session was marked.

Open gap:

- current target rows can be overwritten during correction but there is no immutable attendance-correction history. Faculty parity already records audit-history as open. Add a history/event contract before DB06 can be database-certified.
- cross-table tenant consistency must prove schedule event, membership and marker all belong to the same college/authorized delivery.

## Required DB06 target changes after shared-schema collision clears

Chat 5 currently owns a broad `src/db/schema/**` claim for DB03. DB-009 must not edit those files concurrently. Once that claim is released/reconciled, the migration integrator should review these source-backed candidates:

1. persist `shuffle_questions` + `shuffle_options` on `course_quizzes`;
2. add immutable assignment grade-history persistence;
3. resolve assignment re-attempt semantics before changing the unique key;
4. add secure assignment upload-receipt persistence coordinated with DB-016/private storage;
5. add immutable attendance correction/history persistence;
6. add composite/trigger/service-backed same-tenant constraints where ordinary single-column FKs cannot prove membership/delivery/actor consistency.

## Verification gates still open

- disposable PostgreSQL replay and negative DB tests are blocked by DB-001;
- no live MySQL `information_schema` export has confirmed the 12 historical candidates are absent/unused;
- no runtime concurrency witness has verified assignment grading, upload receipt consumption, quiz attempt creation or attendance correction races;
- schema/migration changes are intentionally deferred while another worker has the broad schema claim.

Therefore DB-009 remains **IN_PROGRESS**, not COMPLETED or DONE_VERIFIED.
