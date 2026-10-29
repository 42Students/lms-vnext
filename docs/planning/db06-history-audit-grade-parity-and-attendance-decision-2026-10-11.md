# DB-045 — DB06 immutable grade + attendance history integration decision

**Date:** 2026-10-11  
**Phase:** DATABASE  
**Worker:** Chat 1  
**Frozen legacy backend:** `42Students/lms@21bad59d4dfaf2fa11fdeaf9353327ce105697d5`  
**Current vNext branch:** `main`

This document is the migration-integrator decision for the source-only DB06 history artifacts:

- `src/db/schema/db06-history-staged.ts`
- `docs/planning/sql/db06-assessment-attendance-history-candidate.sql`
- `scripts/db41-history-schema-drift.mjs`
- `tests/db41-history-schema-drift.test.mjs`

It does **not** claim PostgreSQL execution or registration of the DB035/042 incremental enforcement. The base `assignment_grade_events` table was already registered in `drizzle/0205_lane15_assignment_grade_events.sql`; the DB035 candidate's duplicate `CREATE TABLE` is reference-only and must be composed as an **in-place upgrade**.

## Decision summary

### Grade history

Keep the existing `assignment_grade_events` model. Its staged Drizzle and SQL field/check contracts are aligned.

Every grading mutation must eventually be one transaction:

1. authorize from persisted scope;
2. lock/update `assignment_submissions` using the existing version CAS;
3. capture exact before/after grading snapshots;
4. insert one immutable `assignment_grade_events` row;
5. commit.

Actions:

- first grade: `GRADE`;
- later grade/feedback correction: `REGRADE` (including published grades whose score/feedback changed);
- publication: `PUBLISH_GRADE`;
- pure withdrawal of a published grade, preserving points, feedback and original grader: `HIDE_GRADE`.

`HIDE_GRADE` is **not** `REGRADE`: the current L04 producer can hide a
published grade without changing its evaluated content. L01's incremental
completeness trigger must classify true→false publication with unchanged
grade snapshot as HIDE; true→false with changed snapshot remains REGRADE.
For HIDE and PUBLISH, the acting publisher/editor may legitimately differ
from the previous graded-by user, so the event guard must authorize the
request actor rather than require equality to the saved grader.

The event actor is the request actor. In particular, `PUBLISH_GRADE.actor_user_id` is the **publisher**, not the original `graded_by_user_id`. The grade snapshot still preserves the original/current grader in `previous_graded_by_user_id` and `new_graded_by_user_id`.

Valid actor roles match current authorization exactly:

- scoped/global `SUPER_ADMIN` with no college membership in the event;
- same-college `COLLEGE_ADMIN`;
- active same-delivery `FACULTY`.

No Mentor/TPO-only grading path exists in current source.

### Attendance history

The canonical final model is **stable current row + monotonic row version + immutable events**.

DB-042 owns current-row scope and the producer representation cutover:

- a marked attendance session retains one `attendance_records` row per learner;
- `PRESENT` is persisted explicitly instead of deleting the row;
- current-row identity is immutable;
- physical deletion of attendance rows is forbidden after cutover;
- roster/tenant/marker/timing rules are enforced on the current row.

DB-045 owns history:

- add `attendance_records.version NOT NULL DEFAULT 0`;
- `MARK` creates the retained current row at version 0 plus one event;
- `CORRECT` updates that same row to version N+1 plus one event;
- history is keyed by the stable `attendance_record_id`;
- event uniqueness is `(attendance_record_id, record_version_after)`;
- `delivery_id` is persisted as an immutable history snapshot even though every schedule event currently has exactly one delivery link;
- current-row, schedule-delivery and membership identities are protected by composite FKs;
- event rows are append-only and cannot be UPDATEd, DELETEd or TRUNCATEd.

This supersedes the older staged session-revision/delete-recreate history shape. The following attendance history columns are **rejected**:

- `revision`;
- `previous_attendance_record_id`;
- `new_attendance_record_id`.

They were useful only while PRESENT meant deleting a row. DB-042's retained explicit-PRESENT cutover removes that identity problem.

## Why retained explicit PRESENT is safe

Current `attendance_records.status` already permits `PRESENT`.

Current learner reads already support it:

- if a marked session has a record, `recordStatus` is returned directly;
- if no row exists, current compatibility logic falls back to `PRESENT`.

Therefore retaining an explicit PRESENT row does not change learner-visible attendance meaning. It removes destructive identity churn and makes immutable correction history reliable.

Frozen legacy similarly treated a missing/soft-deleted absence as present, but vNext is free to normalize that representation as long as visible status and history semantics remain faithful.

## Attendance event shape

Canonical `attendance_record_events` fields:

| Category | Fields |
| --- | --- |
| identity | `id`, `attendance_record_id`, `schedule_event_id`, `delivery_id`, `membership_id`, `college_id` |
| event actor | `actor_user_id`, `actor_membership_id`, `actor_role` |
| action | `action = MARK | CORRECT` |
| state | `previous_status`, `new_status`, `previous_note`, `new_note` |
| marker snapshot | `previous_marked_by_user_id`, `new_marked_by_user_id`, `previous_marked_at`, `new_marked_at` |
| version/time | `record_version_before`, `record_version_after`, `occurred_at` |

`delivery_id` is non-null. `section_schedule_event_courses.schedule_event_id` is a primary key today, so a schedule event has one delivery. DB-045 still persists and composite-FKs the delivery snapshot to prevent future bridge changes from reinterpreting history.

## Attendance actor rules

For every event:

- `actor_user_id = new_marked_by_user_id`;
- `COLLEGE_ADMIN` and `FACULTY` require a same-college active actor membership;
- `COLLEGE_ADMIN` requires the persisted role grant;
- `FACULTY` requires the persisted FACULTY role plus active teaching assignment to the exact delivery;
- actor with no membership must be a persisted `SUPER_ADMIN`;
- learner membership and event college must match the schedule's college;
- event `delivery_id` must equal the schedule-event delivery link;
- event's new status/note/marker/time/version must equal the current row post-state.

DB-042 separately protects whether the learner is on the exact active roster and whether the marker is allowed to mark/correct that current row.

## Exact producer cutover contracts

Service implementation remains later-phase work. When API cutover is allowed, the following order is required.

### gradeAssignmentSubmission

Current source performs a standalone optimistic UPDATE. Replace with one transaction:

1. load/lock the submission and its persisted grading scope;
2. re-run the same grade authorization in the transaction;
3. verify `expectedVersion`;
4. compute `GRADE` vs `REGRADE` from the persisted before state;
5. UPDATE points, feedback, grading status, publication=false, grader, graded time and version+1;
6. INSERT `assignment_grade_events` with the exact before/after snapshot and request actor;
7. return updated row;
8. commit.

Feedback-only regrades still require an event.

### publishAssignmentGrade

Current source increments version and sets `grade_published=true` without recording who published.

Required transaction:

1. lock current submission;
2. authorize request actor;
3. require GRADED and expected version;
4. if already published, preserve current idempotent behavior;
5. UPDATE publication + version;
6. INSERT `PUBLISH_GRADE`;
7. event actor = publisher request actor;
8. before/new points, feedback, grader and graded timestamp remain identical;
9. commit.

### markFacultyAttendance

Current source deletes PRESENT rows and deletes/reinserts ABSENT rows. That implementation cannot coexist with stable history.

Required cutover after DB-042 current-row guards are promoted:

1. authorize and lock exact delivery/schedule event as today;
2. lock/create attendance session;
3. lock all existing `attendance_records` for the submitted roster;
4. for each roster learner:
   - if no row exists, INSERT stable row with requested `PRESENT` or `ABSENT`, version 0;
   - INSERT matching `MARK` event;
   - if a row already exists, UPDATE in place with version+1 and INSERT `CORRECT` event only when the mark operation actually changes marker/status/note/time under the chosen remark policy;
5. persist session MARKED actor/time;
6. commit the whole roster atomically.

No DELETE/reinsert is allowed.

### correctAdminAttendance

Current source deletes a row when correction sets PRESENT.

Required cutover:

1. authorize exact college/delivery/roster and lock schedule event as today;
2. lock the stable learner attendance row;
3. if the row does not exist in a pre-cutover database, INSERT it as version 0 with a `MARK` event; normal post-cutover state should already contain it;
4. otherwise UPDATE `status` in place, set actual correcting actor/time, increment version exactly once and INSERT one `CORRECT` event;
5. mark the attendance session as MARKED;
6. commit.

No physical deletion represents PRESENT after cutover.

## Version semantics

`attendance_records.version` is history version, not a free counter.

- initial retained row: 0;
- every historical state mutation: previous + 1;
- identity fields never change;
- status, note, marked-by or marked-at changes require next version;
- changing version without one of those state changes is rejected.

The deferred completeness trigger requires an exact event for every insert/correction. Direct SQL cannot mutate the current state and omit history.

## Migration composition order

Chat 1 must compose the final registered sequence in this dependency order, after source tasks settle:

1. DB-042 current-row tenant/roster/marker guards and explicit-PRESENT/no-delete contract;
2. DB-045 history prerequisites:
   - `attendance_records.version`;
   - unique `(id, schedule_event_id, membership_id)`;
   - unique `(schedule_event_id, delivery_id)` on the one-to-one schedule bridge;
3. create immutable grade + attendance event tables and scope guards;
4. add version and deferred completeness triggers;
5. perform API producer cutover in the global API phase;
6. execute PostgreSQL negative/race witnesses before any `DONE_VERIFIED` state.

The source-only history schema file remains outside `src/db/schema/index.ts` until the numbered migration and live schema are generated together.

## PostgreSQL acceptance matrix

No item below is claimed executed by DB-045.

### Grade

1. grade without event fails at commit;
2. feedback-only regrade without event fails;
3. wrong learner/submission/delivery/college event fails;
4. faculty without active delivery teaching assignment fails;
5. actor membership role spoof fails;
6. SUPER_ADMIN event with membership shape fails;
7. publish event records publisher while grader snapshot stays unchanged;
8. concurrent same-version grade attempts: exactly one update/event pair wins;
9. history UPDATE/DELETE/TRUNCATE fails.

### Attendance current row + history

10. initial PRESENT row + MARK event commits at version 0;
11. initial ABSENT row + MARK event commits at version 0;
12. correction without event fails at commit;
13. status/note/marker/marked-at change without version+1 fails;
14. version increment without state change fails;
15. wrong event learner/college fails;
16. wrong schedule-delivery snapshot fails;
17. faculty without exact delivery teaching assignment fails;
18. actor role spoof fails;
19. event new snapshot differing from current post-state fails;
20. event wrong previous snapshot fails via deferred completeness;
21. duplicate event for the same row/version fails;
22. current attendance row DELETE fails after DB-042 cutover;
23. history UPDATE/DELETE/TRUNCATE fails;
24. two concurrent corrections cannot publish the same next version;
25. direct SQL event against another tenant fails.

### Integration

26. learner summary treats explicit PRESENT identically to previous marked/no-exception representation;
27. faculty/admin workspace returns retained PRESENT records without double counting;
28. zero-to-head replay succeeds;
29. replay then migration idempotence succeeds;
30. current DB06 parent/tenant scope witnesses remain passing.

## Current verification state

Source design is now selected and staged Drizzle/SQL field/check contracts are intended to be structurally identical. The semantic drift checker must remain clean.

Still **not verified**:

- no disposable PostgreSQL replay has executed for DB-045;
- no direct-SQL negative/race matrix has executed;
- grade/publish services do not yet emit immutable grade events;
- faculty/admin attendance writers still use delete/recreate semantics today;
- DB-042 itself remains source-only while its worker completes that task.

Therefore DB-045 may become **COMPLETED source work**, but must not become `DONE_VERIFIED` until migration integration + producer cutover + real PostgreSQL evidence exist.
