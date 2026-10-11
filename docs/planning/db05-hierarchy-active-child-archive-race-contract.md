# DB-008 — parent archive vs active child insert concurrency contract

**Status:** implemented application-level transaction locking on `main`; six DB trigger candidates **UNREGISTERED**; PostgreSQL real two-session acceptance **NOT RUN**. Global phase remains DATABASE. Chat 6 owns source work, Chat 1 owns numbered migration/schema-barrel integration.

## Three existing user-visible product contracts

| Operation | Existing behavior | Data invariant |
| --- | --- | --- |
| `archiveCourse` | Reject with `COURSE_HAS_ACTIVE_OFFERINGS` | No ACTIVE offering may belong to ARCHIVED course |
| `archiveCourseOffering` | Reject with `OFFERING_HAS_ACTIVE_DELIVERIES` | No delivery with `ended_at IS NULL` may reference ARCHIVED offering |
| `endCourseSectionDelivery` | Reject with `DELIVERY_HAS_ACTIVE_TEACHERS` | No active teaching assignment may reference ended delivery |

Previous implementations did a child `SELECT` before a parent `UPDATE`, using separate autocommit statements. An insert after SELECT but before UPDATE could violate the state relationship, despite FK row existence constraints.

## Main implementation — paired parent/child row locking

**Critical concurrency correction:** the archive-side FOR UPDATE by itself is NOT enough: a child creator could check an ACTIVE parent before the archive, block on its FK KEY SHARE during the archive, and then INSERT after the parent became ARCHIVED (the FK verifies identity, not status). Both sides must lock and recheck the live parent **inside** their respective transactions. The six code paths below implement that pairing for normal service operations. Direct SQL, upstream moves and alternate status writes still require the DB trigger and PG evidence.

- `src/modules/courses/course-service.ts`: within `getDb().transaction`, lock `courses` row `FOR UPDATE`, then check `course_offerings.status='ACTIVE'`, then set course ARCHIVED in same transaction.
- `src/modules/courses/offering-service.ts`: transactionally lock `course_offerings FOR UPDATE`, then check `course_section_deliveries.ended_at IS NULL` and archive.
- `src/modules/courses/delivery-service.ts`: transactionally lock `course_section_deliveries FOR UPDATE`, check `course_teaching_assignments.ended_at IS NULL`, then set `ended_at`.

- `src/modules/courses/offering-service.ts` create: after preliminary scope/permission checks, lock course `FOR SHARE`, require course ACTIVE and INSERT offering in the same transaction.
- `src/modules/courses/delivery-service.ts` create: lock offering `FOR SHARE`, require ACTIVE and INSERT delivery in the same transaction.
- `src/modules/courses/teaching-assignment-service.ts` create: lock delivery `FOR SHARE`, require `ended_at IS NULL` and INSERT faculty assignment in the same transaction.

PostgreSQL FK child INSERT obtains `FOR KEY SHARE` on its referenced parent row, but that **does not revalidate parent status**. The explicit child `FOR SHARE` and post-lock state predicate are required alongside the archive `FOR UPDATE`. Both locks must be held until commit. The parent first/child first schedules must be verified with two sessions under READ COMMITTED.

**Scope of this fix:** paired normal service archive/end vs new child **INSERT**. It does not prove safety against direct privileged SQL, child reactivation or upstream reparenting. Source-level test is not a PostgreSQL witness.

## W01 non-numbered companion and drift preflight

- `scripts/sql/db05-hierarchy-active-child-archive-guard.draft.sql`: six triggers. Three parent state transitions reject active children; three child create/reactivate/reparent paths take a parent `FOR SHARE` lock and reject inactive parents. This is defense-in-depth for paths beyond current application services. **Do not register blindly**; cross-trigger lock order and transaction isolation require acceptance.
- `scripts/sql/db05-hierarchy-archive-state-preflight.readonly.sql`: three aggregate counts; all must equal zero on a disposable database before the guards become active. A zero-row report is necessary but cannot prove concurrency correctness.
- `tests/db05-hierarchy-archive-race.test.mjs`: eight authored static contract tests.
- `tests/db05-hierarchy-archive-transactions.test.mjs`: four authored archive-side transactional lock-order tests.
- `tests/db05-hierarchy-paired-row-locks.test.mjs`: five authored assertions for corresponding child CREATE-side `FOR SHARE` + state recheck before INSERT.

## Mandatory disposable PostgreSQL test cases

The SQL companion contains **HL-01 through HL-20**, which must be run at exact main SHA with SQLSTATE, transaction outcome and lock wait/deadlock details. Essential two-session cases:

1. TX-A locks course `FOR UPDATE` then checks active offering; TX-B attempts offering INSERT; upon TX-A archive commit the child INSERT must reject rather than become ACTIVE under archived course. Reverse the commit/order and verify course archive rejects an active offering.
2. Repeat both directions for offering archive vs active delivery INSERT.
3. Repeat both directions for delivery end vs active teaching-assignment INSERT.
4. Test child status reactivation or parent reassignment with **direct SQL**, not just service APIs; guard should reject attachment to archived/ended parent.
5. Confirm historical archived offerings, ended deliveries and ended teachers do not block a parent close.
6. Verify whole-statement rollback on trigger violation, including multi-row writes, and correct READ COMMITTED behavior. For REPEATABLE READ/SERIALIZABLE, **no verified safety claim** until separately exercised.
7. Replay with existing offering/delivery tenant guard, DB02 academic path guards, course tombstone/ancestor guard and DB06 assignment paths. Log PostgreSQL version and exact current source SHA; verify no lock-order deadlocks or duplicate trigger names.

## Evidence accounting

- Application TS archive/end commits: `dabe1e4`, `d50ae54`, `7fa2b3c`. Matching child CREATE commits: `9778ce1`, `36cbf87`, `0a7287e`.
- SQL draft: `5ead8a2`; read-only preflight: `27a319f`.
- Authored tests: `9b43308`, `2db1f93`, `10a8dd9` (17 new test definitions; not executed).
- Real Node/typecheck/build/PG validation: **NOT EXECUTED in this worker iteration**. GitHub Actions is intentionally unused due to billing and is *not* itself a blocker; an independent runner may provide equivalent acceptance evidence.
