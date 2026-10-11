# DB06 immutable grading and attendance history contract

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE  
**Queue task:** DB-035 · **Worker:** Chat 1  
**Status:** source-only staging; not exported, not journaled, not runtime verified.

Artifacts:

- `src/db/schema/db06-history-staged.ts`
- `docs/planning/sql/db06-assessment-attendance-history-candidate.sql`
- `tests/db06-history-staging.test.mjs`

## Why this exists

DB-009 found two active legacy persistence jobs with no equivalent vNext history:

1. `grade_audit_log` records every assignment grade mutation with before/after points, before/after grading status, actor and action.
2. legacy `attend` keeps only current absence/correction state; rows are soft-deleted/revived and carry `marked_by` + `attendance_status`. vNext normalizes current attendance into explicit statuses, but a mutable current row alone loses correction history.

The current vNext schemas therefore have correct **current state**, but not enough immutable evidence for disputes, audit, concurrency review or historical reporting.

## Assignment grade events

Staged table: `assignment_grade_events`.

Each event snapshots:

- exact submission identity: submission, assignment, delivery and learner membership;
- derived college scope;
- actor user plus actor membership when the actor is tenant-bound;
- normalized action;
- previous/new points;
- previous/new normalized grading status;
- previous/new publication state;
- submission optimistic version before/after;
- immutable event time.

### Normalized actions

Legacy source actions confirmed in `AssignmentServiceImpl` include:

- `UPDATE_POINTS`
- `ADD_DESCRIPTIVE_POINTS`
- `PUBLISH_GRADE`

vNext has one normalized grading mutation surface, so the target event actions are:

- `GRADE` — first `NOT_GRADED → GRADED` mutation;
- `REGRADE` — later points/feedback grade mutation;
- `PUBLISH_GRADE` — unpublished graded result becomes learner-visible.

The source action names remain documented provenance; they are not copied blindly into a target enum whose producer model is different.

### Publisher attribution is a hard requirement

A database row-only auto-audit trigger is intentionally **not** used for grade history. Current `assignment_submissions.graded_by_user_id` identifies the grader. `publishAssignmentGrade` can be executed later by another authorized user, and the row does not persist that publisher.

Therefore promotion requires `gradeAssignmentSubmission` and `publishAssignmentGrade` to insert the immutable event **inside the same transaction** using the live `RequestContext` actor.

The SQL candidate uses a **DEFERRABLE INITIALLY DEFERRED constraint trigger** on grading-state updates. At commit it rejects a grade/publish mutation unless the exact matching event for the new submission version exists. Direct SQL cannot silently bypass the ledger.

### Parent and tenant integrity

Promotion creates an exact composite target on:

`assignment_submissions(id, assignment_id, delivery_id, membership_id)`

and the event carries a composite FK to it. A scope trigger derives the submission college through delivery → section → cohort → program → department and requires:

- event college = submission college;
- learner membership college = submission college;
- tenant actor membership, when supplied, is ACTIVE, belongs to the same college and belongs to `actor_user_id`;
- actor without a membership must be an actual persisted SUPER_ADMIN.

This is identity consistency, not authorization replacement. The service still owns whether that actor may grade that delivery.

## Attendance correction events

Staged table: `attendance_record_events`.

Each event snapshots:

- exact attendance record + schedule event + learner membership identity;
- college scope;
- actor user/membership;
- `MARK` or `CORRECT`;
- previous/new status;
- previous/new note;
- attendance record optimistic version before/after;
- immutable event time.

### Correction versioning

Current `attendance_records` has no optimistic version. The SQL candidate stages:

`attendance_records.version integer NOT NULL DEFAULT 0 CHECK (version >= 0)`

Semantics:

- initial MARK is record version 0 and event `record_version_before = NULL, record_version_after = 0`;
- every CORRECT must write `version = old + 1`;
- an update that changes status/note/marker without incrementing exactly once is rejected;
- a version-only update without a real correction is rejected;
- event `(attendance_record_id, record_version_after)` is unique.

The eventual producer API should expose/require an expected version so concurrent faculty corrections cannot silently last-write-win.

### Audit completeness

A deferred constraint trigger requires, at commit:

- INSERT attendance record → matching `MARK` event;
- meaningful UPDATE → matching `CORRECT` event with exact old/new status, note, actor and versions.

This is deliberately a **require-event** design instead of an auto-event trigger. It keeps RequestContext membership/authorization attribution explicit and forces all trusted writers to use one auditable transaction.

### Retention improvement

Current `attendance_records.schedule_event_id` is `ON DELETE CASCADE`. The staged history table references `section_schedule_events` with `ON DELETE RESTRICT` and references the current record with `RESTRICT`.

Once an attendance event exists, a hard schedule-event delete can no longer erase the audit trail through cascade. This directly addresses the DB-014 retention risk. A future approved retention/purge workflow must be explicit rather than accidental.

## Append-only enforcement

Both history tables reject:

- UPDATE;
- DELETE;
- TRUNCATE.

Corrections are new events, never history rewrites.

## Migration ordering

**Do not register this SQL during the current source-only task.**

Promotion must be one coordinated cutover because deferred completeness triggers would immediately break the current producers if tables/triggers became live first.

Required order in the migration/API integration batch:

1. add prerequisite composite unique targets and attendance version column;
2. create event tables, tenant guards and append-only guards;
3. deploy producer code that writes current row + event in one transaction and uses attendance version CAS;
4. enable deferred audit-completeness triggers in the same compatible release/migration plan;
5. run zero-to-head replay and direct-SQL/service acceptance.

DB02/DB05 academic parent guards and DB06 migration 0041 must be reconciled before registration; do not duplicate conflicting scope functions.

## PostgreSQL acceptance required before registration

At minimum execute:

- valid first grade + GRADE event commits;
- grade update without event fails at COMMIT;
- valid REGRADE event commits and version chain is exact;
- valid PUBLISH_GRADE captures the publisher, not the original grader;
- cross-college learner/event scope fails;
- mismatched actor membership/user fails;
- tenant actor without membership fails unless persisted SUPER_ADMIN;
- event wrong submission identity fails;
- event UPDATE/DELETE/TRUNCATE fail;
- attendance MARK + event commits;
- attendance INSERT without MARK event fails at COMMIT;
- attendance CORRECT + old/new event commits;
- correction without version increment fails;
- version-only update fails;
- correction without event fails at COMMIT;
- stale concurrent correction loses CAS / cannot commit an orphaned event;
- wrong schedule/learner/college event fails;
- attendance event UPDATE/DELETE/TRUNCATE fail;
- schedule-event hard delete with attendance history is RESTRICTED.

Until those execute, DB-035 may be source-complete but must not be `DONE_VERIFIED`.
