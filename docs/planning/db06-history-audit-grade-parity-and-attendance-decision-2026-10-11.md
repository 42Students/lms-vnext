# DB06 immutable history: grade parity repair and attendance decision gate

**Date:** 2026-10-11 IST · **Global phase:** DATABASE (ACTIVE) · **Repository:** `42Students/lms-vnext` on `main`.

## Scope and changes committed

This is an **independent review/correction batch** of already source-COMPLETED DB-035, not an attempt to claim a different worker's active DB-038/DB-042 package. Both affected history tables remain **STAGED/UNREGISTERED**. No numbered Drizzle migration, schema barrel, protected provider configuration, or API service was modified.

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
| `attendance_record_events` | 9 staged-only / 3 SQL-only | **9 staged-only / 3 SQL-only** (12 unresolved) | **BLOCKED:** choose one durable attendance history identity model |

The *grade* source-model CHECK names are reconciled, including `actor_role_ck` and `actor_shape_ck`. SQL runtime semantics and the emitted migration are still unverified. This is **not** proof that Drizzle/SQL are equivalent in every expression or that the business rules are complete.

### Attendance history conflict: requires an explicit canonical choice

The existing `attendance_records` table stores current attendance state. The **SQL candidate** expects a durable `attendance_record_id` FK plus `record_version_before/after`, including a deferred matching-audit-event requirement. The **staged Drizzle model** instead records a session/learner **`revision`** and separate nullable `previous_attendance_record_id`/`new_attendance_record_id`, with a rule that PRESENT can have no current record. They cannot both be the deployed event identity, and silently combining them would create invalid FK/retention/producer assumptions.

**Decision criteria:**

1. Verify actual active vNext attendance mark/re-mark/present/absent persistence; compare with legacy `attend` active behavior rather than equating legacy soft-delete with a vNext hard delete.
2. Decide whether PRESENT is an explicit current `attendance_records` row or absence of a row. Grade/attendance reports, correction workflow, section schedule deletion, period archive and backfills must agree.
3. Pick one event identity: immutable record-relative version (requires preserving record through transitions), or session+learner revision (survives deletion/recreation). Prove exactly-once monotonic revision under two concurrent faculty writes.
4. Decide real actor membership attribution for COLLEGE_ADMIN/FACULTY versus SUPER_ADMIN and ensure the role asserted on events matches live grants at write time.
5. Align Drizzle fields, SQL DDL, CHECKs, FKs and each `MARK`/`CORRECT` producer **before** registering migrations. Do not drop source columns to make an automatic comparison pass.
6. Ensure a direct SQL attendance correction without an event fails at commit, and an attempted mutation, deletion or TRUNCATE of persisted events is denied.

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
- After corrections, the source checker reports **12 field differences**, all confined to attendance, and no grade source model field/check mismatches; attendance actor role remains unpersisted in the SQL draft.
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

A new, separate shared DATABASE task should own the remaining **attendance history semantic decision, Drizzle/SQL parity, atomic producer cutover and negative PG acceptance**. Chat 1 remains the only writer for numbered migrations and the shared schema barrel. No existing worker's `PICKED`, `COMPLETED`, or `VERIFIED` history should be altered to take credit for this independent source correction.
