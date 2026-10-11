# DB06 immutable history: grade parity and canonical attendance history decision

**Date:** 2026-10-11 IST · **Global phase:** DATABASE (ACTIVE) · **Repository:** `42Students/lms-vnext` on `main`.

## Scope and current DB-045 decision

DB-045 is the follow-up integration-design pass over source-COMPLETED DB-035. Both history tables remain **STAGED/UNREGISTERED**; no numbered migration, schema barrel or runtime producer is enabled yet.

The attendance identity decision is now explicit: **vNext persists one stable `attendance_records` row for every attendance state, including PRESENT, and immutable history is keyed to that row plus optimistic record version.** Legacy absence-row soft delete/revive is source evidence, not target storage semantics.

DB-045 also keeps grade-event field parity from the prior correction batch and defines the synchronized producer/migration cutover required before the deferred audit-completeness triggers can be registered.

Artifacts:

- `src/db/schema/db06-history-staged.ts`: repaired **14 invalid TypeScript `sql.raw` quoted string literals** to equivalent valid template literals without changing the SQL expression.
- `docs/planning/sql/db06-assessment-attendance-history-candidate.sql`: aligned the **grade event** source table with the staged Drizzle grade model, filling seven missing fields: `actor_role`, `previous_feedback`, `new_feedback`, `previous_graded_by_user_id`, `new_graded_by_user_id`, `previous_graded_at`, `new_graded_at`. Added actor role/shape checks; canonical normalized GRADE/REGRADE/PUBLISH_GRADE snapshot checks; and disallowed an audit bypass from **feedback-only grade changes** by requiring a version-matched event with exact before/after feedback, grader and grading timestamp. Grade event actor role now must match an actual active COLLEGE_ADMIN role or a FACULTY role with an active teaching assignment on the same delivery, not merely any grant the membership happens to hold. An actual SUPER_ADMIN with no tenant membership remains separately supported.
- `scripts/db41-history-schema-drift.mjs`: source-only, fail-closed reconciliation utility; run with `node scripts/db41-history-schema-drift.mjs --json`. Exit 2 indicates an unresolved **candidate source mismatch**, not a failing migration already applied.
- `tests/db41-history-schema-drift.test.mjs`: 12 current-source and injected-negative regressions; checks grade parity, extra columns, missing tables, malformed raw SQL, feedback-only mutation auditing, actor role grants and still-unresolved attendance parity.

The `db41` *file prefix* is a source identifier assigned while tasks were being created concurrently. **Do not conflate it with the separate shared queue DB-041 (quiz shuffle persistence).** Queue assignment for remaining work must use its actual newly allocated ID.

## Before/after structural review

| Event ledger | Initially different field names | After correction | Decision |
|---|---:|---:|---|
| `assignment_grade_events` | 7 staged-only / 0 SQL-only | **0 staged-only / 0 SQL-only**; Drizzle **25**, SQL **25** | Field/shape checks source-aligned; producer & PG still missing |
| `attendance_record_events` | 9 staged-only / 3 SQL-only | **0 staged-only / 0 SQL-only**; Drizzle **21**, SQL **21** | Stable record-id + version model chosen; source-aligned, runtime unverified |

The *grade* source-model CHECK names are reconciled, including `actor_role_ck` and `actor_shape_ck`. SQL runtime semantics and the emitted migration are still unverified. This is **not** proof that Drizzle/SQL are equivalent in every expression or that the business rules are complete.

### Canonical attendance history model

The former 12-column conflict is resolved in source.

**Current row:** `attendance_records` remains the normalized current-state table and keeps explicit `PRESENT|ABSENT|EXCUSED|MEDICAL|LATE` status. Promotion adds `version integer NOT NULL DEFAULT 0` plus an exact composite identity key `(id, schedule_event_id, membership_id)`.

**Event identity:** `attendance_record_events` uses stable `attendance_record_id` + `record_version_before/after`. Initial MARK records version 0; each CORRECT records old version → old+1. History does not use legacy delete/recreate revision IDs.

**Context snapshots:** each event also persists schedule event, optional canonical delivery snapshot, membership/college, actor user/membership/role, old/new status, note, marker and mark time. The event INSERT guard requires the new snapshot to equal the current row post-state and validates schedule→delivery, tenant and staff role/teaching scope.

**Course-less schedules:** `delivery_id` is nullable. If `section_schedule_event_courses` has a canonical delivery, the event must record exactly that delivery; otherwise delivery must remain null.

**Retention:** event FKs are `RESTRICT`. Because every current-row INSERT/correction must have a same-transaction event once the deferred triggers are enabled, history prevents silent attendance-row/schedule deletion from erasing audit evidence.

**Fail-closed preflight:** migration promotion refuses any pre-existing attendance rows or already-graded assignment submissions. The current rollout has no production data to migrate; if that changes, an explicit audited backfill is required rather than fabricating actor/time/history.

### Atomic producer cutover contract

The migration **must not** enable deferred audit-completeness triggers before compatible writers deploy.

**Assignment grading transaction**
1. authorize using the existing service policy;
2. load/lock the expected submission version;
3. update grade state with optimistic expectedVersion;
4. insert exactly one GRADE/REGRADE event with exact old/new grade, feedback, grader, timestamps and versions;
5. commit; the deferred trigger verifies the event.

**Grade publish transaction**
1. authorize publisher;
2. update publication state with expectedVersion;
3. insert PUBLISH_GRADE using the **publisher** as event actor while preserving prior grader snapshots;
4. commit under the deferred completeness trigger.

**Attendance MARK transaction**
1. authorize actor and resolve schedule + optional canonical delivery + learner roster;
2. insert the stable current row with desired explicit status (PRESENT included), marker/time and version 0;
3. insert MARK event with null previous snapshot and exact current post-state;
4. update `attendance_sessions` lifecycle consistently;
5. commit.

**Attendance CORRECT transaction**
1. authorize correction actor; for an existing historical row do not require the learner to still be active merely to preserve a legitimate correction path;
2. lock current attendance row and enforce expected version;
3. update status/note/marker/time with version = old+1;
4. insert CORRECT event with exact old/new snapshots and actor role;
5. commit.

No producer should DELETE the current row to represent PRESENT. No direct SQL grade/attendance mutation may commit without its matching immutable event.

## Negative/positive acceptance still required (NOT RUN)

| Witness | Requirement |
|---|---|
| H01 | Fresh grade emits GRADE with matching old/new points, feedback, grader and version |
| H02 | Feedback-only REGRADE emits matching event; direct SQL without event rolls back |
| H03 | Grade publish by a **different** authorized publisher stores publisher, not prior grader, as actor |
| H04 | FACULTY actor-role label with no current FACULTY grant/teaching assignment rejected |
| H05 | Same-college actor without accepted role rejected; revoked membership rejected |
| H06 | Forged COLLEGE_ADMIN label by FACULTY-only membership rejected |
| H07 | Lower grade maximum cannot silently invalidate historical event/submission |
| H08 | Historical grade correction after learner leaves remains possible with authorized staff |
| H09 | Concurrent graders with stale expectedVersion: only one accepted transition |
| H10 | Attendance MARK/CORRECT audit events preserve exact old/new state and actor |
| H11 | Concurrent attendance correction vs schedule move/archive or learner status change |
| H12 | Two concurrent correction attempts cannot reuse an event revision |
| H13 | Current record deletion/recreation cannot erase old audit event linkage |
| H14 | Event UPDATE/DELETE/TRUNCATE and grade-only/attendance-only direct SQL are denied |
| H15 | Clean disposable PostgreSQL 0-to-head migration replay + idempotence |
| H16 | Existing poisoned rows fail preflight before promotion; no silent destructive cleanup |

These witnesses must run against a disposable PostgreSQL database after synchronized producer/migration changes, with exact command/SHA and output evidence. Source tests cannot promote any field/domain to `DONE_VERIFIED`.

## Evidence recorded in this source-only iteration

- The **original** source comparison detected 19 field-name discrepancies (7 grade, 12 attendance), 14 invalid literal expressions and grade-only feedback audit omission.
- After DB-045 reconciliation, the source checker reports **0 field differences** and no grade/attendance CHECK-name mismatches. This is source alignment only; PostgreSQL and producer execution remain unverified.
- **12/12** source/negative tests executed successfully in an isolated JavaScript evaluator with exact fetched GitHub source bytes. No Node project test runner, TypeScript project typecheck or PostgreSQL command executed in the hosted session.
- The checker deliberately keeps `readyForPromotion: false` and `verifiedPostgreSQL: false`, even if the remaining source schema mismatch is resolved, to prevent fake certification.
- GitHub Actions remains intentionally unused because of billing; use `npm run db:verify:independent` where Docker or a genuinely disposable PostgreSQL instance is available.

## Commands for a source checkout

```bash
node --test tests/db41-history-schema-drift.test.mjs
node scripts/db41-history-schema-drift.mjs --json
```

The second command **currently exits 2 by design**: the SQL and Drizzle attendance events still disagree. Do not bypass that guard to register an incomplete history schema.

## Handoff

DB-045 owns the resolved attendance history semantic decision and source parity. Remaining blockers are synchronized producer implementation, numbered migration integration and executable PostgreSQL negative/race acceptance. Chat 1 remains the only writer for numbered migrations and the shared schema barrel.
