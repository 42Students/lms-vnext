# DB06 immutable grading and attendance history contract

**Observed:** 2026-10-11 IST  
**Global phase:** DATABASE  
**Queue task:** DB-035 · **Worker:** Chat 1  
**Status:** source-only staging; not exported, not journaled, not runtime verified.

Artifacts:

- `src/db/schema/db06-history-staged.ts`
- `docs/planning/sql/db06-assessment-attendance-history-candidate.sql`
- `tests/db06-history-staging.test.mjs`

## Registered 0205 compatibility — do not re-create grade events

`drizzle/0205_lane15_assignment_grade_events.sql` already registers
`assignment_grade_events` with the four actions `GRADE`, `REGRADE`,
`HIDE_GRADE`, and `PUBLISH_GRADE`. The earlier DB035 SQL candidate's
`CREATE TABLE assignment_grade_events` is a historical source shape, **not
an executable migration step**. L01 must compose an in-place upgrade of
0205's existing constraints and append-only/completeness guards; it must not
create the table a second time.

Exact compatibility requirements:

- `HIDE_GRADE` is true→false publication only, unchanged graded state,
  score, feedback, grader and grade timestamp; writer and grader can differ;
- `REGRADE` may also cause true→false publication, but must have a changed
  grade snapshot; the deferred guard must distinguish this from a pure hide;
- `PUBLISH_GRADE` and `HIDE_GRADE` require the initiating actor, not the
  saved grader; the authorizing service still applies persisted scope checks;
- each grading mutation increments submission version exactly once and writes
  exactly one matching event in the same transaction.

Negative PostgreSQL witnesses: (1) HIDE with changed points/feedback/grader
must fail `23514`; (2) direct published→unpublished update with no event
must fail `23514`; (3) grade reversion labeled HIDE when grade values change
must fail `23514`; (4) two concurrent writes at the same expected version
must not both commit; (5) malicious actor/tenant membership must fail.
These are acceptance requirements, **not** executed evidence.

## Why this exists

DB-009 found two active legacy persistence jobs with no equivalent vNext history:

1. `grade_audit_log` records every assignment grade mutation with before/after points, before/after grading status, actor and action.
2. legacy `attend` keeps only current absence/correction state; rows are soft-deleted/revived and carry `marked_by` + `attendance_status`. vNext normalizes current attendance into explicit statuses, but a mutable current row alone loses correction history.

The current vNext schemas therefore have correct **current state**, but not enough immutable evidence for disputes, audit, concurrency review or historical reporting.

## Attendance source-event retention guarantee

The immutable attendance history uses a non-null parent key to the canonical
`section_schedule_events` schedule row. A **hard schedule-event delete must remain RESTRICT**
while an attendance event refers to that schedule event, even if the current
attendance marker row has subsequently changed. Never CASCADE the parent
because that would erase evidence for a past absence, marking actor or
correction. The SQL draft explicitly declares
`schedule_event_id REFERENCES section_schedule_events(id) ON DELETE RESTRICT`.
This is staging evidence only, not proof that the numbered PostgreSQL
migration or legacy producer cutover has completed.

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
- `REGRADE` — later points/feedback grade mutation, including a published result becoming unpublished because the grade changed;
- `HIDE_GRADE` — an already published grade becomes private with the same score, feedback, grader and graded timestamp; the hiding actor may differ from the grader;
- `PUBLISH_GRADE` — unpublished graded result becomes learner-visible; the publisher may differ from the grader.

The source action names remain documented provenance; they are not copied blindly into a target enum whose producer model is different.

### Publisher attribution is a hard requirement

The publisher may differ from the original grader, so publisher attribution must come from the live request actor rather than `graded_by_user_id`.

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
- that tenant actor is either a COLLEGE_ADMIN or a FACULTY member with an active teaching assignment on the event delivery;
- actor without a membership must be an actual persisted SUPER_ADMIN.

This mirrors the current coarse database-checkable grading boundary. The service still owns the full permission policy and request authorization; the event guard prevents a same-college but unauthorized membership from legitimizing a direct SQL grade mutation.

## Attendance correction events

Staged table: `attendance_record_events`.

Each event snapshots:

- exact stable attendance record + schedule event + learner membership identity;
- optional canonical delivery (null for course-less schedule events);
- college scope;
- actor user/membership/role;
- `MARK` or `CORRECT`;
- previous/new status and note;
- previous/new marker user and mark time;
- attendance record optimistic version before/after;
- immutable event time.

### Correction versioning

Current `attendance_records` has no optimistic version. The SQL candidate stages:

`attendance_records.version integer NOT NULL DEFAULT 0 CHECK (version >= 0)`

Semantics:

- vNext keeps an explicit current row for every status, including `PRESENT`; it does not delete the row to represent presence;
- initial MARK is record version 0 and event `record_version_before = NULL, record_version_after = 0`;
- every CORRECT must write `version = old + 1`;
- an update that changes status/note/marker/mark-time without incrementing exactly once is rejected;
- a version-only update without a real correction is rejected;
- event `(attendance_record_id, record_version_after)` is unique.

The eventual producer API should expose/require an expected version so concurrent faculty corrections cannot silently last-write-win.

### Attendance delivery and actor scope

A schedule event may be course-linked or course-less. The event's `delivery_id` is therefore nullable:

- if `section_schedule_event_courses` has a linked delivery, the history event must persist exactly that delivery and it must belong to the schedule section;
- if there is no course link, event `delivery_id` must be null.

Tenant actors must use an ACTIVE membership in the schedule college. COLLEGE_ADMIN requires the persisted admin role; FACULTY requires an active teaching assignment on the linked delivery or, for course-less schedules, an active section faculty assignment. Membership-less actors must be persisted SUPER_ADMINs. The event actor must equal the current row's marker user.

### Audit completeness

A deferred constraint trigger requires, at commit:

- INSERT attendance record → matching `MARK` event;
- meaningful UPDATE → matching `CORRECT` event with exact old/new status, note, marker, mark time and versions.

This is deliberately a **require-event** design instead of an auto-event trigger. It keeps RequestContext membership/authorization attribution explicit and forces all trusted writers to use one auditable transaction.

### Retention improvement

Current `attendance_records.schedule_event_id` is `ON DELETE CASCADE`. The staged history table references `section_schedule_events` with `ON DELETE RESTRICT` and references the current record with `RESTRICT`.

Once an attendance event exists, a hard schedule-event delete can no longer erase the audit trail through cascade. This directly addresses the DB-014 retention risk. A future approved retention/purge workflow must be explicit rather than accidental.

### Fail-closed existing-history preflight

The staged SQL refuses promotion if the database already contains attendance rows or already-graded assignment submissions. Those states cannot be given truthful historical actors/timestamps retroactively without an explicit audited backfill. The current rollout has no production data to migrate; if that changes, migration integration must stop and design a real backfill rather than inventing events.

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
- same-college learner/non-teaching faculty grade actor fails;
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
- forged/mismatched attendance actor role fails;
- schedule-linked event with wrong delivery fails, while a course-less event requires null delivery;
- event actor that differs from the persisted current-row marker fails;
- attendance event UPDATE/DELETE/TRUNCATE fail;
- schedule-event hard delete with attendance history is RESTRICTED.

Until those execute, DB-035 may be source-complete but must not be `DONE_VERIFIED`.
