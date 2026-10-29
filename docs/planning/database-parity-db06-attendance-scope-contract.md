# DB-042 — DB06 attendance current-row integrity contract

**Date:** 2026-10-11  
**Worker:** Chat 3  
**Phase:** DATABASE  
**Status:** SOURCE/STAGING IMPLEMENTED — not registered, not PostgreSQL verified  
**Legacy backend oracle:** `21bad59d4dfaf2fa11fdeaf9353327ce105697d5`

## Administrative correction without whole-class marking

An authorized College Admin/Super Admin may write one explicitly reviewed
`attendance_records` row while `attendance_sessions` is absent or UNMARKED.
That row applies to that learner only; it must not silently mark the remaining
roster present. DB-042's deferred marker guard permits this exception only for
`db06_attendance_actor_kind` = `COLLEGE_ADMIN` or `SUPER_ADMIN`; Faculty
must still mark the whole class in the same transaction. Existing timing, scope,
roster and DB-035 immutable event requirements apply to both paths.

## Why DB-042 exists

DB-035 stages immutable grade/attendance history and versioning. It does not, by itself, prove that the **current** attendance row belongs to the right tenant/roster or that the user recorded in `marked_by_user_id` was allowed to mark that session.

Current vNext `attendance_records` and `attendance_sessions` already have useful status/uniqueness checks, and the services perform authorization/roster checks. But individual UUID foreign keys still permit direct SQL to combine:

- an event in college A with a learner membership in college B;
- a learner who is not on that delivery roster;
- an event with a delivery from another section/college;
- an arbitrary active user as marker;
- a faculty member who does not teach that delivery;
- an attendance mark before the session begins.

DB-042 stages database-level fail-closed checks for those invariants.

## Frozen legacy source behavior

### Current row and session state

Legacy `attend` has one unique row per `(student_id, class_schedule_id)`. It primarily stores the current absence exception; correcting a learner to present soft-deletes that row. V156 added `class_schedule.attendance_marked_at` because **zero absence rows does not mean attendance was taken**.

vNext already normalizes that distinction into:

- `attendance_sessions`: `UNMARKED | MARKED`, marker and mark time;
- `attendance_records`: per-learner current state/exception rows.

DB-042 preserves the explicit MARKED session signal. It does not decide DB-035's eventual history representation for PRESENT corrections.

### Learner roster

Legacy `RosterSql.LEARNER_IN_CLASS` defines a learner as in a class when either:

1. they belong directly to the ordinary class; or
2. the class is group-backed and the learner is an ACTIVE LEARNER member of the LIVE, non-archived group.

Critically, archiving the roster group revokes access even though membership history remains.

The current vNext equivalent is `listActiveDeliveryLearners`:

- ordinary delivery → active `section_enrollments` for exact section + academic period, backed by active learner program enrollment;
- elective-backed delivery → active `elective_offerings` / `elective_slots` / `lms_groups(kind=ELECTIVE)` plus ACTIVE LEARNER group membership;
- membership and user must be active and college-scoped.

DB-042 mirrors this shape in SQL. It deliberately treats the **existence** of an elective offering for a delivery as elective ownership. If the offering/slot/group is archived, the database rejects a new attendance write rather than falling back to the broader section roster.

### Marker authorization

Frozen attendance writes require:

- assigned faculty for the exact class/course;
- college admin; or
- super admin under its higher-level scope.

The current vNext faculty service similarly proves an ACTIVE FACULTY membership plus an active `course_teaching_assignments` row for the exact delivery. Admin attendance uses college-admin/super-admin permission gates.

The staged DB function therefore accepts only:

- `SUPER_ADMIN` in `system_roles`;
- ACTIVE same-college `COLLEGE_ADMIN`; or
- ACTIVE same-college `FACULTY` with active teaching assignment for the exact delivery.

The database does not contain the full scoped-superadmin organization policy; that remains an API/runtime negative-test requirement.

### Timing

Frozen `LearnerServiceImpl.attend` rejects a class that has not started for **all callers**. Faculty marking is also blocked after the college correction window (default 24 hours after the class ends); admin corrections intentionally bypass that post-class cutoff but do **not** bypass the future-session rule.

DB-042 stages the same distinction. It additionally rejects a materially future `marked_at` because source writers generate marker timestamps server-side rather than accepting arbitrary client timestamps.

## Staged implementation

Canonical source-only SQL:

`docs/planning/sql/db06-attendance-scope-candidate.sql`

It stages:

1. **Event context function** — resolves section, delivery, academic period, college, start/end and status while proving course college equals section/program college.
2. **Event→delivery bridge trigger** — direct SQL cannot associate a schedule event with a delivery from another section or college.
3. **Roster function** — normal section and elective/group roster semantics mirror current vNext/legacy behavior.
4. **Marker classifier** — SUPER_ADMIN / same-college COLLEGE_ADMIN / assigned FACULTY only.
5. **Timing function** — scheduled event, no pre-start marks, faculty correction window, admin bypass after end only.
6. **Current-record trigger** — immutable event/member identity, exact roster, marker/timing, sane timestamps.
7. **Deferred current-row→session trigger** — Faculty attendance rows require a final MARKED session at commit; authorized COLLEGE_ADMIN/SUPER_ADMIN may correct one learner in an otherwise UNMARKED session without falsely marking the entire class.
8. **Session trigger** — event identity immutable, MARKED cannot become UNMARKED, timing/marker enforced, mark time cannot move backward.
9. **Current-row retention guard** — attendance current rows cannot be physically deleted once the normalized history design is adopted; PRESENT is a status correction.
10. **Marked-session retention guard** — a MARKED session cannot be deleted and made indistinguishable from "never taken".

## Important boundary with DB-035

DB-042 does **not** register or redefine `attendance_record_events`, row versions, or immutable correction history. DB-035 owns that history contract.

Existing vNext services currently delete an exception row to represent PRESENT. DB-035's immutable `attendance_record_events` FK is `ON DELETE RESTRICT`, so that behavior cannot remain once history is registered. DB-042 therefore stages the final fail-closed shape explicitly: physical DELETE of a current attendance row is rejected; a correction to PRESENT must UPDATE the retained row to `PRESENT` and append DB-035's matching `CORRECT` event in the same transaction. A MARKED session is also non-deletable. This is a required narrow producer cutover before registration, not runtime work claimed by DB-042.

## Acceptance matrix — must execute on disposable PostgreSQL

- Cross-college event→delivery bridge rejected.
- Cross-college learner rejected.
- Learner without ACTIVE LEARNER role rejected.
- Ordinary learner outside exact active section + academic period rejected.
- Elective learner outside ACTIVE elective group rejected.
- Archived elective offering/slot/group cannot fall back to ordinary section roster.
- Unrelated faculty, TPO, mentor and learner markers rejected.
- ACTIVE assigned faculty accepted; ended teaching assignment rejected.
- Same-college college admin accepted.
- Superadmin structural path accepted; scoped-superadmin API restriction tested separately.
- Any marker before `starts_at` rejected.
- Faculty after correction window rejected; admin after the window accepted.
- Materially future `marked_at` rejected.
- MARKED session cannot become UNMARKED.
- Session `marked_at` cannot move backwards.
- Faculty row without final MARKED session fails at transaction commit; an authorized College Admin/Super Admin's individual correction is retained without creating a MARKED session. A learner, mentor, TPO or unrelated faculty actor cannot use this exception.
- Existing event/member unique constraint still rejects duplicates under concurrency.
- Physical DELETE of an attendance current row is rejected after normalized history cutover.
- PRESENT correction is represented by retained current row + DB-035 CORRECT history event.
- MARKED session DELETE is rejected.
- DB-035 history/version candidate composes with DB-042 without trigger/constraint collisions.
- Empty-database registered migration replay and schema drift check pass.

## Proof state

The SQL and static regression definitions are authored only. No disposable PostgreSQL, registered journal replay, Node test runner, TypeScript build, API runtime, or browser path has been executed by DB-042 yet. GitHub Actions availability is intentionally irrelevant.

DB-042 may be source-complete while awaiting independent database verification; it must not become `DONE_VERIFIED` without executed acceptance evidence.


## Source-level evidence executed

Two CI-independent, non-PostgreSQL checks were executed against fresh committed/frozen sources:

- **12 / 12 current DB-042 test callback bodies passed** in an isolated V8 runtime with read-file/assert shims, using the committed test, candidate SQL, this contract and DB-035 history candidate.
- **43 / 43 independent cross-repo source assertions passed** across frozen legacy `Attend`, `RosterSql`, `LearnerServiceImpl`, bulk/admin attendance controllers; current vNext faculty/admin attendance services, delivery roster and attendance schema; and the DB-042 candidate/contract.

These prove source/design consistency only. They do **not** execute the Node test runner, PostgreSQL DDL/functions/triggers, migration replay, TypeScript, API runtime or concurrency behavior. All disposable-PostgreSQL acceptance items above remain mandatory before `DONE_VERIFIED`.
